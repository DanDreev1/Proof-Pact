"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/validation/result";

type CreatePairSuccess = {
  pairId: string;
  inviteCode: string;
};

export async function createPairAction(
  _previousState: ActionResult<CreatePairSuccess>,
): Promise<ActionResult<CreatePairSuccess>> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("create_accountability_pair", {
    pair_timezone: "Europe/London",
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const createdPair = data?.[0];

  if (!createdPair) {
    return { ok: false, error: "Pair was not created." };
  }

  revalidatePath("/");
  revalidatePath("/pair");
  revalidatePath("/profile");

  return {
    ok: true,
    data: {
      pairId: createdPair.pair_id,
      inviteCode: createdPair.invite_code,
    },
  };
}
