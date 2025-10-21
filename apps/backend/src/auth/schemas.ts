import { z } from "zod";

export const EmailSchema = z
  .string()
  .trim()
  .min(3, "Email is required.")
  .max(254, "Email must be less than 255 characters.")
  .email("Email must be valid.");

export const PasswordSchema = z.string().min(12, "Password must be at least 12 characters long.");

export const DisplayNameSchema = z
  .string()
  .trim()
  .min(1, "Display name is required.")
  .max(120, "Display name must be less than 120 characters.")
  .optional();

export const RegisterSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  displayName: DisplayNameSchema,
});

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, "Password is required."),
});

