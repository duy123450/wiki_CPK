import { z } from "zod";

export const profileSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(20, "Username must be at most 20 characters"),
    email: z.string().email("Please enter a valid email address"),
    currentPassword: z.string().optional().or(z.literal("")),
    newPassword: z.string().optional().or(z.literal("")),
    confirmPassword: z.string().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword && data.newPassword.length > 0) {
      if (data.newPassword.length < 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          minimum: 6,
          type: "string",
          inclusive: true,
          message: "New password must be at least 6 characters",
          path: ["newPassword"],
        });
      }
      if (!data.currentPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Current password is required to set a new password",
          path: ["currentPassword"],
        });
      }
      if (data.newPassword !== data.confirmPassword) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "New passwords do not match",
          path: ["confirmPassword"],
        });
      }
    }
  });
