import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

export const registerSchema = z.object({
  displayName: z.string().trim().min(1, "Display name is required.").max(40, "Display name is too long."),
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});
