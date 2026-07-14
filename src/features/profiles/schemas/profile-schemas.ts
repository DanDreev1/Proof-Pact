import { z } from "zod";

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1, "Display name is required.").max(40, "Display name is too long."),
});
