/**
 * AuthContext.tsx
 *
 * Single source of truth for auth state in the React tree.
 *
 * Responsibilities:
 *  - Boot-time token validation & proactive silent refresh before expiry.
 *  - Expose login / register / logout to the rest of the app.
 *  - Listen for SESSION_EXPIRED events emitted by the axios interceptor and
 *    clear state without duplicating any HTTP logic.
 *
 * What this layer intentionally does NOT do:
 *  - Issue HTTP refresh requests (that lives in AuthApi.ts interceptor only).
 *  - Hold a redundant `isAuthenticated` boolean alongside `status`.
 */

import React, {
    createContext,
    useState,
    useContext,
    useEffect,
    useCallback,
    useRef,
    FC,
    PropsWithChildren,
    useMemo,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import {
    authAPI,
    authEvents,
    STORAGE_KEYS,
    storageMultiSet,
    storageMultiGet,
    storageMultiRemove,
} from '../services/Api';
import { SignType, User } from '../constants/Types';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuthStatus =
    | 'LOADING'         // App is booting, checking stored tokens.
    | 'AUTHENTICATED'   // Valid session exists.
    | 'UNAUTHENTICATED' // No session (logged out or never logged in).

interface AuthContextValue {
    status:          AuthStatus;
    user:            User | null;
    isLoading:       boolean; // derived — no extra useState needed
    isAuthenticated: boolean; // derived — no extra useState needed
    login:      (credentials: Pick<SignType, 'email' | 'password'>) => Promise<AuthResult>;
    register:   (data: SignType) => Promise<AuthResult>;
    logout:     (logoutAll?: boolean) => Promise<void>;
    updateUser: (user: User) => Promise<void>;
}

export interface AuthResult {
    success: boolean;
    error?:  string;
}

interface JwtPayload {
    exp: number;
    sub?: string;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
}

// ─── Pure helpers (defined outside the component so they are never recreated) ─

function getTokenExpiry(token: string): number {
    try {
        const { exp } = jwtDecode<JwtPayload>(token);
        return exp * 1000; // JWT exp is in seconds → convert to ms
    } catch {
        return 0;
    }
}

function isTokenExpired(token: string | null): boolean {
    if (!token) return true;
    return getTokenExpiry(token) < Date.now();
}

// ─── Session storage helpers ──────────────────────────────────────────────────
//
// FIX 2 — AsyncStorage has no setMany / getMany / removeMany methods.
// The correct API is multiSet / multiGet / multiRemove, and multiGet
// returns [ [key, value], … ] pairs, NOT a plain object.
// We wrap them in storageMultiGet/Set/Remove (defined in AuthApi.ts) which
// return plain objects — much easier to destructure.

async function readStoredSession(): Promise<{
    accessToken:  string | null;
    refreshToken: string | null;
    user:         User | null;
}> {
    // FIX 3 — storageMultiGet returns Record<string, string | null>
    // so we can safely do result['accessToken'] instead of result[0][1].
    const result = await storageMultiGet([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER,
    ]);

    const rawUser = result[STORAGE_KEYS.USER];

    return {
        accessToken:  result[STORAGE_KEYS.ACCESS_TOKEN],
        refreshToken: result[STORAGE_KEYS.REFRESH_TOKEN],
        user:         rawUser ? (JSON.parse(rawUser) as User) : null,
    };
}

async function writeSession(
    accessToken:  string,
    refreshToken: string,
    user:         User,
): Promise<void> {
    await storageMultiSet({
        [STORAGE_KEYS.ACCESS_TOKEN]:  accessToken,
        [STORAGE_KEYS.REFRESH_TOKEN]: refreshToken,
        [STORAGE_KEYS.USER]:          JSON.stringify(user),
    });
}

async function clearSession(): Promise<void> {
    await storageMultiRemove([
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
        STORAGE_KEYS.USER,
    ]);
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider: FC<PropsWithChildren> = ({ children }) => {
    const [status, setStatus] = useState<AuthStatus>('LOADING');
    const [user,   setUser]   = useState<User | null>(null);

    // Timer ref — cleared before every new schedule to prevent leaks.
    const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Proactive refresh scheduling ──────────────────────────────────────────

    const scheduleProactiveRefresh = useCallback((accessToken: string) => {
        // Always clear any pending timer before scheduling a new one.
        if (refreshTimerRef.current !== null) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }

        const expiresAt = getTokenExpiry(accessToken);
        const now       = Date.now();
        const lifetime  = expiresAt - now;

        if (lifetime <= 0) return; // Already expired — interceptor will handle it.

        // Fire at 80 % of remaining lifetime, minimum 30 s before expiry.
        // Example: 15-min token → fire after 12 min.
        const delay = Math.max(lifetime * 0.8, lifetime - 30_000);

        refreshTimerRef.current = setTimeout(async () => {
            /**
             * FIX 4 — the original timer body only read storage and rescheduled.
             * It never actually called the refresh endpoint, so the "proactive"
             * refresh silently did nothing and the 401 interceptor ended up
             * handling everything reactively anyway.
             *
             * Correct approach:
             *  1. Call authAPI.refreshToken() with the stored refresh token.
             *  2. Persist the new tokens.
             *  3. Schedule the NEXT refresh cycle with the new access token.
             *
             * If the refresh fails here, we leave state as-is — the next real
             * API call will hit 401, and the interceptor will handle it (or
             * emit SESSION_EXPIRED if the refresh token is also dead).
             */
            try {
                const stored = await readStoredSession();

                if (!stored.refreshToken) return;

                const response = await authAPI.refreshToken(stored.refreshToken);
                const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
                    response.data.data.tokens;

                // Persist updated tokens (keep existing user object).
                await storageMultiSet({
                    [STORAGE_KEYS.ACCESS_TOKEN]:  newAccessToken,
                    [STORAGE_KEYS.REFRESH_TOKEN]: newRefreshToken ?? stored.refreshToken,
                });

                // Schedule the next proactive refresh with the brand-new token.
                scheduleProactiveRefresh(newAccessToken);
            } catch {
                // Silent failure is acceptable here — the 401 interceptor is the
                // safety net if this proactive attempt doesn't work.
            }
        }, delay);
    }, []);

    // ── Boot: restore session on app launch ───────────────────────────────────

    const restoreSession = useCallback(async () => {
        try {
            const stored = await readStoredSession();

            // No tokens stored at all → send to login.
            if (!stored.accessToken && !stored.refreshToken) {
                setStatus('UNAUTHENTICATED');
                return;
            }

            // Valid access token → restore session immediately.
            if (stored.accessToken && !isTokenExpired(stored.accessToken)) {
                let userData = stored.user;

                // User object might be missing if storage was partially cleared.
                if (!userData) {
                    const response = await authAPI.getMe();
                    userData = response.data.data as User;
                    await AsyncStorage.setItem(
                        STORAGE_KEYS.USER,
                        JSON.stringify(userData),
                    );
                }

                setUser(userData);
                setStatus('AUTHENTICATED');
                scheduleProactiveRefresh(stored.accessToken);
                return;
            }

            // Access token expired but refresh token exists → silent refresh.
            if (stored.refreshToken) {
                try {
                    const response = await authAPI.refreshToken(stored.refreshToken);
                    const { accessToken, refreshToken: newRefreshToken } =
                        response.data.data.tokens;

                    let userData = stored.user;
                    if (!userData) {
                        const meResponse = await authAPI.getMe();
                        userData = meResponse.data.data as User;
                    }

                    await writeSession(
                        accessToken,
                        newRefreshToken ?? stored.refreshToken,
                        userData!,
                    );

                    setUser(userData);
                    setStatus('AUTHENTICATED');
                    scheduleProactiveRefresh(accessToken);
                    return;
                } catch {
                    // Refresh token is also dead → clear everything.
                }
            }

            // Nothing worked → force unauthenticated.
            await clearSession();
            setStatus('UNAUTHENTICATED');
        } catch {
            // Unexpected error — don't leave the user stuck on the splash screen.
            setStatus('UNAUTHENTICATED');
        }
    }, [scheduleProactiveRefresh]);

    // ── Listen for SESSION_EXPIRED from the axios interceptor ─────────────────

    useEffect(() => {
        const unsubscribe = authEvents.on('SESSION_EXPIRED', async () => {
            if (refreshTimerRef.current !== null) {
                clearTimeout(refreshTimerRef.current);
                refreshTimerRef.current = null;
            }
            await clearSession();
            setUser(null);
            setStatus('UNAUTHENTICATED');
        });

        return unsubscribe; // cleanup on unmount
    }, []);

    // ── Run boot sequence on mount ────────────────────────────────────────────

    useEffect(() => {
        restoreSession();

        return () => {
            // Cancel any pending timer when the provider unmounts (dev reloads, etc.).
            if (refreshTimerRef.current !== null) {
                clearTimeout(refreshTimerRef.current);
            }
        };
    }, [restoreSession]);

    // ── Auth actions ──────────────────────────────────────────────────────────

    const login = useCallback(
        async ({
            email,
            password,
        }: Pick<SignType, 'email' | 'password'>): Promise<AuthResult> => {
            try {
                const response = await authAPI.login({ email, password });
                const { user: userData, tokens } = response.data.data as {
                    user:   User;
                    tokens: { accessToken: string; refreshToken: string };
                };

                await writeSession(tokens.accessToken, tokens.refreshToken, userData);
                setUser(userData);
                setStatus('AUTHENTICATED');
                scheduleProactiveRefresh(tokens.accessToken);

                return { success: true };
            } catch (error: any) {
                // This error is now a real login error (wrong credentials, network, etc.)
                // because login goes through publicClient, not apiClient.
                // A 401 for wrong password will NOT accidentally trigger SESSION_EXPIRED.
                return {
                    success: false,
                    error: error?.response?.data?.message ?? 'Login failed',
                };
            }
        },
        [scheduleProactiveRefresh],
    );

    const register = useCallback(
        async ({ name, email, password }: SignType): Promise<AuthResult> => {
            try {
                const response = await authAPI.register({ name, email, password });
                const { user: userData, tokens } = response.data.data as {
                    user:   User;
                    tokens: { accessToken: string; refreshToken: string };
                };

                await writeSession(tokens.accessToken, tokens.refreshToken, userData);
                setUser(userData);
                setStatus('AUTHENTICATED');
                scheduleProactiveRefresh(tokens.accessToken);

                return { success: true };
            } catch (error: any) {
                return {
                    success: false,
                    error: error?.response?.data?.message ?? 'Registration failed',
                };
            }
        },
        [scheduleProactiveRefresh],
    );

    const logout = useCallback(async (logoutAll = false): Promise<void> => {
        // Cancel the proactive refresh timer immediately — before any async work.
        if (refreshTimerRef.current !== null) {
            clearTimeout(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }

        // Best-effort server-side logout — clear local state regardless.
        try {
            await authAPI.logout(logoutAll);
        } catch {
            // Server unreachable or token already invalid — still log out locally.
        } finally {
            await clearSession();
            setUser(null);
            setStatus('UNAUTHENTICATED');
        }
    }, []);

    const updateUser = useCallback(async (updatedUser: User): Promise<void> => {
        setUser(updatedUser);
        await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    }, []);

    // ── Memoised context value — prevents unnecessary re-renders ──────────────

    const value = useMemo<AuthContextValue>(
        () => ({
            status,
            user,
            isLoading:       status === 'LOADING',
            isAuthenticated: status === 'AUTHENTICATED',
            login,
            register,
            logout,
            updateUser,
        }),
        [status, user, login, register, logout, updateUser],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
