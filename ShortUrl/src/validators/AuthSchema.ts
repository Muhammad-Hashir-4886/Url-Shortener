import { z } from 'zod';

export const signInSchema = z.object({
    email: z
        .email('Please enter a valid email address')
        .max(100, 'cannot more than 100 characters long')
        .min(1, 'Email is required')
        .trim(),

    password: z
        .string()
        .min(1, 'Password is required')
        .min(8, 'Password must be at least 8 characters'),
});

export const signUpSchema = z
    .object({
        name: z
            .string()
            .min(1, 'Username is required')
            .min(3, 'Username must be at least 3 characters')
            .trim(),

        email: z
            .email('Please enter a valid email address')
            .max(100, 'cannot more than 100 characters long')
            .min(1, 'Email is required')
            .trim(),

        password: z
            .string()
            .min(8, 'Password must be at least 8 characters')
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/,
                'Password must contain uppercase, lowercase and a number'
            ),

        // confirmPassword: z.string(),
    });
    // .refine(data => data.password === data.confirmPassword, {
    //     message: 'Passwords do not match',
    //     path: ['confirmPassword'],
    // });