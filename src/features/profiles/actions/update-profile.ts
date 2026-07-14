"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/require-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/validation/result";
import { updateProfileSchema } from "../schemas/profile-schemas";

type UpdateProfileSuccess = {
  displayName: string;
};

export async function updateProfileAction(
  _previousState: ActionResult<UpdateProfileSuccess>,
  formData: FormData,
): Promise<ActionResult<UpdateProfileSuccess>> {
  const user = await requireUser();
  const parsed = updateProfileSchema.safeParse({
    displayName: formData.get("displayName"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Check the profile fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: parsed.data.displayName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/");
  revalidatePath("/pair");
  revalidatePath("/profile");

  return { ok: true, data: { displayName: parsed.data.displayName } };
}
