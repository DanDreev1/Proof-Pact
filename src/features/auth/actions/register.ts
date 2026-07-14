"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/validation/result";
import { getErrorMessage } from "@/lib/utils/error-message";
import { registerSchema } from "../schemas/auth-schemas";

type RegisterSuccess = {
  message: string;
};

export async function registerAction(
  _previousState: ActionResult,
  formData: FormData,
): Promise<ActionResult<RegisterSuccess>> {
  const parsed = registerSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Check the form fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  let supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;

  try {
    supabase = await createSupabaseServerClient();
  } catch (error) {
    return { ok: false, error: getErrorMessage(error, "Supabase is not configured on this deployment.") };
  }

  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        display_name: parsed.data.displayName,
      },
    },
  });

  if (error) {
    return { ok: false, error: getErrorMessage(error, "Could not create account.") };
  }

  if (!data.session) {
    return {
      ok: true,
      data: {
        message: "Account created. Check your email to confirm the sign up, then log in.",
      },
    };
  }

  redirect("/");
}
