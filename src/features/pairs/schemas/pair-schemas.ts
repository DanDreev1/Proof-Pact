import { z } from "zod";

export const joinPairSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .min(4, "Invite code is too short.")
    .max(24, "Invite code is too long.")
    .transform((value) => value.toUpperCase()),
});
