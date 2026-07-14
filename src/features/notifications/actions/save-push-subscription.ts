"use server";

import { requireUser } from "@/lib/auth/require-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/validation/result";
import { pushSubscriptionSchema } from "../schemas/push-subscription-schema";

export async function savePushSubscription(input: unknown): Promise<ActionResult<{ endpoint: string }>> {
  const user = await requireUser();
  const parsed = pushSubscriptionSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: "Invalid push subscription." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("push_subscriptions")
    .upsert(
      {
        user_id: user.id,
        endpoint: parsed.data.endpoint,
        p256dh: parsed.data.keys.p256dh,
        auth: parsed.data.keys.auth,
        user_agent: null,
      },
      { onConflict: "endpoint" },
    );

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, data: { endpoint: parsed.data.endpoint } };
}
