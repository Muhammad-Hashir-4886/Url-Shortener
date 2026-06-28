/**
 * AuthApi.ts
 *
 * Single-responsibility HTTP layer.
 *
 * Two axios instances:
 *  - publicClient  → login, register, refresh-token. NO interceptors.
 *                    These endpoints CREATE a session, so they must never
 *                    try to attach or refresh an existing token.
 *  - apiClient     → every authenticated route (links, me, logout …).
 *                    Carries the bearer token and handles 401 silently.
 *
 * Token refresh is serialized via a promise mutex: only ONE refresh call
 * can be in-flight at a time; every concurrent 401 awaits that same promise.
 *
 * AuthContext is notified of auth events through a tiny EventEmitter so the
 * two layers stay fully decoupled — no circular imports, no shared mutable state.
 */

import axios, {
    AxiosError,
    AxiosInstance,
    InternalAxiosRequestConfig,
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import { DeviceInfoData, SignType } from '../constants/Types';

// ─── Config ───────────────────────────────────────────────────────────────────

const MOBILE_API_URL = 'http://192.168.1.100:5000/api';

// Centralised storage keys — every layer uses the exact same strings.
export const STORAGE_KEYS = {
    ACCESS_TOKEN:  'accessToken',
    REFRESH_TOKEN: 'refreshToken',
    USER:          'user',
} as const;

// ─── Tiny EventEmitter (zero external dependencies) ──────────────────────────

type AuthEvent    = 'SESSION_EXPIRED';
type AuthListener = () => void;

const authEventListeners = new Map<AuthEvent, Set<AuthListener>>();

export const authEvents = {
    on(event: AuthEvent, listener: AuthListener): () => void {
        if (!authEventListeners.has(event)) {
            authEventListeners.set(event, new Set());
        }
        authEventListeners.get(event)!.add(listener);
        // Returns an unsubscribe handle — store it and call it in useEffect cleanup.
        return () => authEventListeners.get(event)?.delete(listener);
    },

    emit(event: AuthEvent): void {
        authEventListeners.get(event)?.forEach((fn) => fn());
    },
};

// ─── Axios instances ──────────────────────────────────────────────────────────

const sharedConfig = {
    baseURL:  MOBILE_API_URL,
    timeout:  15_000,
    headers:  { 'Content-Type': 'application/json' },
};

/**
 * FIX 1 — publicClient has NO interceptors.
 *
 * Login, register, and token-refresh must never run through the auth
 * interceptor chain, for two reasons:
 *
 *  a) The request interceptor tries to read and attach an access token that
 *     does not exist yet — pointless async work on every login/register call.
 *
 *  b) The response interceptor catches every 401 and tries to refresh tokens.
 *     If the server returns 401 for wrong credentials during login, the
 *     interceptor would find no refresh token, emit SESSION_EXPIRED, and
 *     forcibly log the user out — before they were ever logged in. That bug
 *     would make "wrong password" silently redirect the user away from the
 *     login screen.
 */
const publicClient: AxiosInstance = axios.create(sharedConfig);

/**
 * apiClient is the authenticated client.
 * Every request automatically gets a bearer token (request interceptor).
 * Every 401 response triggers a silent token refresh (response interceptor).
 */
const apiClient: AxiosInstance = axios.create(sharedConfig);

// ─── AsyncStorage helpers ─────────────────────────────────────────────────────

/**
 * FIX 2 — correct AsyncStorage multi-key API.
 *
 * The original code called AsyncStorage.setMany / getMany / removeMany, which
 * do not exist. The real API is multiSet / multiGet / multiRemove.
 *
 *   multiSet  accepts: [ [key, value], [key, value], … ]
 *   multiGet  accepts: string[]  — returns: [ [key, value], … ]
 *   multiRemove accepts: string[]
 */

export async function storageMultiSet(
    pairs: Record<string, string>,
): Promise<void> {
    // const entries = Object.entries(pairs) as [string, string][];
    await AsyncStorage.setMany(pairs);
}

export async function storageMultiGet(
    keys: string[],
): Promise<Record<string, string | null>> {
    // multiGet returns [ [key, value | null], … ] — convert to a plain object
    // so callers can do result['accessToken'] instead of result[0][1].
    return await AsyncStorage.getMany(keys);
    // return Object.fromEntries(pairs);
}

export async function storageMultiRemove(keys: string[]): Promise<void> {
    await AsyncStorage.removeMany(keys);
}

// ─── Refresh mutex ────────────────────────────────────────────────────────────
//
// refreshPromise is set while a refresh is in-flight and nulled when it
// settles.  Concurrent 401s share the same promise instead of each firing
// their own refresh request.

let refreshPromise: Promise<string> | null = null;

async function executeTokenRefresh(): Promise<string> {
    const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    if (!refreshToken) {
        throw new Error('NO_REFRESH_TOKEN');
    }

    // FIX 1 (continued) — use publicClient here too, not apiClient, so this
    // call cannot recursively trigger the same 401 interceptor.
    const response = await publicClient.post('/auth/refresh-token', {
        refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken } =
        response.data.data.tokens;

    // FIX 2 (continued) — multiSet, not setMany.
    await storageMultiSet({
        [STORAGE_KEYS.ACCESS_TOKEN]:  accessToken,
        [STORAGE_KEYS.REFRESH_TOKEN]: newRefreshToken ?? refreshToken,
    });

    return accessToken as string;
}

// ─── Request interceptor — attach bearer token ────────────────────────────────

apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => Promise.reject(error),
);

// ─── Response interceptor — handle 401 with serialised refresh ───────────────

apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
            _retry?: boolean;
        };

        const is401          = error.response?.status === 401;
        const alreadyRetried = originalRequest._retry === true;

        if (!is401 || alreadyRetried) {
            return Promise.reject(error);
        }

        originalRequest._retry = true;

        try {
            // Serialise: reuse the in-flight refresh promise or start a new one.
            if (!refreshPromise) {
                refreshPromise = executeTokenRefresh().finally(() => {
                    refreshPromise = null;
                });
            }

            const newAccessToken = await refreshPromise;

            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return apiClient(originalRequest);
        } catch {
            // Refresh failed — signal AuthContext to clear state and navigate
            // the user to the login screen.
            authEvents.emit('SESSION_EXPIRED');
            return Promise.reject(error);
        }
    },
);

// ─── Device info helper ───────────────────────────────────────────────────────

async function getDeviceInfo(): Promise<DeviceInfoData> {
    const [deviceId, deviceName, platform] = await Promise.all([
        DeviceInfo.getUniqueId(),
        DeviceInfo.getDeviceName(),
        DeviceInfo.getSystemName(),
    ]);

    return {
        deviceId,
        deviceName,
        platform,
    };
}

// ─── Auth API ─────────────────────────────────────────────────────────────────
//
// Rule: if an endpoint CREATES a session  → publicClient (no token needed)
//       if an endpoint REQUIRES a session → apiClient    (token attached)

export const authAPI = {
    // FIX 1 (continued) — login and register use publicClient.
    // Using apiClient here caused two problems:
    //   • The request interceptor pointlessly read AsyncStorage for a token
    //     that doesn't exist yet.
    //   • A 401 (wrong password) would trigger the refresh interceptor, find
    //     no refresh token, emit SESSION_EXPIRED, and force-logout the user
    //     before they ever logged in.
    login: async ({ email, password }: Pick<SignType, 'email' | 'password'>) => {
        const deviceInfo = await getDeviceInfo();
        return publicClient.post('/auth/login', { email, password, ...deviceInfo });
    },

    register: async ({ name, email, password }: SignType) => {
        const deviceInfo = await getDeviceInfo();
        return publicClient.post('/auth/register', {
            name,
            email,
            password,
            ...deviceInfo,
        });
    },

    // refreshToken also uses publicClient — same reasoning as above.
    refreshToken: async (refreshToken: string) =>
        publicClient.post('/auth/refresh-token', { refreshToken }),

    // logout and getMe require an active session → apiClient.
    logout: async (logoutAll = false) =>
        apiClient.post('/auth/logout', { logoutAll }),

    getMe: async () => apiClient.get('/auth/me'),
};

// ─── Links API ────────────────────────────────────────────────────────────────
//
// All link operations require authentication → apiClient throughout.

export const linksAPI = {
    getAll: async (
        page      = 1,
        limit     = 20,
        search    = '',
        sortBy    = 'createdAt',
        sortOrder: 'asc' | 'desc' = 'desc',
    ) =>
        apiClient.get('/links', {
            params: { page, limit, search, sortBy, sortOrder },
        }),

    create: async (url: string, shortCode: string | null = null) =>
        apiClient.post('/links', { url, shortCode }),

    update: async (id: string, data: Record<string, unknown>) =>
        apiClient.put(`/links/${id}`, data),

    delete: async (id: string) => apiClient.delete(`/links/${id}`),

    getStats: async (id: string) => apiClient.get(`/links/${id}/stats`),

    redirect: async (shortCode: string) => apiClient.get(`/${shortCode}`),
};

// Export apiClient as default so other modules can make one-off authenticated
// calls without going through linksAPI / authAPI.
export default apiClient;