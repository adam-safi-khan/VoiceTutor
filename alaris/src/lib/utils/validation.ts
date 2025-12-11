/**
 * Form Validation Utilities
 */

import { z } from 'zod';

// Calculate age from date of birth
export function calculateAge(dateOfBirth: string | Date): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  return age;
}

// Signup validation schema
export const signupSchema = z.object({
  full_name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens and apostrophes'),
  
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be less than 255 characters'),
  
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be less than 72 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  
  confirm_password: z.string(),
  
  date_of_birth: z
    .string()
    .refine((val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    }, 'Please enter a valid date')
    .refine((val) => {
      const age = calculateAge(val);
      return age >= 13;
    }, 'You must be at least 13 years old to use Alaris')
    .refine((val) => {
      const age = calculateAge(val);
      return age <= 120;
    }, 'Please enter a valid date of birth'),
  
  location: z
    .string()
    .max(255, 'Location must be less than 255 characters')
    .optional()
    .nullable(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});

export type SignupFormData = z.infer<typeof signupSchema>;

// Login validation schema
export const loginSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address'),
  
  password: z
    .string()
    .min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Format validation errors for display
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }
  
  return errors;
}

// Check if date is valid and not in the future
export function isValidBirthDate(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  
  if (isNaN(date.getTime())) return false;
  if (date > today) return false;
  
  return true;
}

