"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/validation/result";
import { joinPairSchema } from "../schemas/pair-schemas";

type JoinPairSuccess = {
  pairId: string;
};

export async function joinPairAction(
  _previousState: ActionResult<JoinPairSuccess>,
  formData: FormData,
): Promise<ActionResult<JoinPairSuccess>> {
  const parsed = joinPairSchema.safeParse({
    inviteCode: formData.get("inviteCode"),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: "Check the invite code.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("join_accountability_pair", {
    pair_invite_code: parsed.data.inviteCode,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const joinedPair = data?.[0];

  if (!joinedPair) {
    return { ok: false, error: "Pair was not joined." };
  }

  revalidatePath("/");
  revalidatePath("/pair");
  revalidatePath("/profile");

  return {
    ok: true,
    data: {
      pairId: joinedPair.pair_id,
    },
  };
}
