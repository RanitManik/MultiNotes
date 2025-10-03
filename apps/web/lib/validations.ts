import { z } from "zod";

// Auth validation schemas
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be less than 50 characters"),
  lastName: z
    .string()
    .max(50, "Last name must be less than 50 characters")
    .optional(),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().optional(),
    token: z.string().min(1, "Token and password are required"),
  })
  .refine(
    data => !data.confirmPassword || data.password === data.confirmPassword,
    {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    }
  );

export const organizationSchema = z.object({
  name: z
    .string()
    .min(1, "Organization name is required")
    .max(100, "Organization name must be less than 100 characters"),
  slug: z
    .string()
    .min(1, "Organization slug is required")
    .max(50, "Organization slug must be less than 50 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    ),
});

export const createOrganizationSchema = z.object({
  name: z
    .string({ required_error: "Organization name is required" })
    .min(1, "Organization name is required")
    .max(100, "Organization name must be less than 100 characters"),
});

// API validation schemas
const baseNoteSchema = z.object({
  title: z
    .string()
    .max(200, "Title must be less than 200 characters")
    .optional(),
  content: z.any().optional(),
});

export const createNoteSchema = baseNoteSchema.refine(
  data => data.title && data.content,
  {
    message: "Title and content required",
    path: ["title"], // This will make the error appear on the title field
  }
);

export const updateNoteSchema = baseNoteSchema.refine(
  data => data.title && data.content,
  {
    message: "Title and content required",
    path: ["title"],
  }
);

export const inviteEmailsSchema = z.object({
  emails: z
    .array(z.string().email("Invalid email format"), {
      required_error: "At least one email is required",
    })
    .min(1, "At least one email is required")
    .max(50, "Cannot invite more than 50 users at once"),
});

export const inviteUserSchema = z.object({
  email: z
    .string({ required_error: "Email and role required" })
    .email("Please enter a valid email address"),
  role: z
    .string({ required_error: "Email and role required" })
    .refine(val => ["admin", "member"].includes(val), {
      message: "Invalid role. Must be 'admin' or 'member'",
    }),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type OrganizationInput = z.infer<typeof organizationSchema>;
export type CreateOrganizationInput = z.infer<typeof createOrganizationSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type InviteEmailsInput = z.infer<typeof inviteEmailsSchema>;
