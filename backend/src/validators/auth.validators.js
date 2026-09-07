// auth.validators.js
// Zod schemas for validating auth-related request bodies.

import { z } from 'zod';

// Password rules: at least 8 chars, at least one letter and one number.
// Kept simple - production would enforce more.
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100, 'Password too long')
  .regex(/[a-zA-Z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a number');

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Name too short').max(80),
    email: z.string().trim().toLowerCase().email('Invalid email'),
    password: passwordSchema,
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Invalid email'),
    password: z.string().min(1, 'Password required'),
  })
  .strict();

export const forgotPasswordSchema = z
  .object({
    email: z.string().trim().toLowerCase().email('Invalid email'),
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    // Same strength rules a new account has to meet.
    password: passwordSchema,
  })
  .strict();
