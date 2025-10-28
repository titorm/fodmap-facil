import { z } from 'zod';
import {
  FODMAPGroup,
  TestPhase,
  SymptomSeverity,
} from '../../core/domain/entities/ReintroductionTest';

/**
 * Schemas de validação usando Zod
 */

// Auth schemas
export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signUpSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Reintroduction test schemas
export const createTestSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  fodmapGroup: z.nativeEnum(FODMAPGroup, {
    errorMap: () => ({ message: 'Invalid FODMAP group' }),
  }),
  dayNumber: z.number().int().positive('Day number must be positive'),
  foodItem: z.string().min(1, 'Food item is required').max(100, 'Food item is too long'),
  portionSize: z.string().min(1, 'Portion size is required').max(50, 'Portion size is too long'),
  notes: z.string().max(500, 'Notes are too long').optional(),
});

export const createSymptomSchema = z.object({
  testId: z.string().uuid('Invalid test ID'),
  type: z.string().min(1, 'Symptom type is required').max(50, 'Symptom type is too long'),
  severity: z.nativeEnum(SymptomSeverity, {
    errorMap: () => ({ message: 'Invalid symptom severity' }),
  }),
  notes: z.string().max(500, 'Notes are too long').optional(),
  timestamp: z.date(),
});

// User profile schema
export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long').optional(),
  language: z
    .enum(['en', 'pt'], {
      errorMap: () => ({ message: 'Invalid language' }),
    })
    .optional(),
  notificationsEnabled: z.boolean().optional(),
});

// Type inference
export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type CreateTestInput = z.infer<typeof createTestSchema>;
export type CreateSymptomInput = z.infer<typeof createSymptomSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Helper para validar dados
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} {
  const result = schema.safeParse(data);

  if (result.success) {
    return {
      success: true,
      data: result.data,
    };
  }

  const errors: Record<string, string> = {};
  result.error.errors.forEach((error) => {
    const path = error.path.join('.');
    errors[path] = error.message;
  });

  return {
    success: false,
    errors,
  };
}
