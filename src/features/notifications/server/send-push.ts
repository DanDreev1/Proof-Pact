import "server-only";
import webpush from "web-push";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type PushPayload = {
  title: string;
  body: string;
  url: string;
};

function isPushConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    && process.env.VAPID_PRIVATE_KEY
    && process.env.VAPID_SUBJECT
    && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!isPushConfigured()) {
    return { sent: 0, skipped: true };
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT as string,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
    process.env.VAPID_PRIVATE_KEY as string,
  );

  const supabase = createSupabaseAdminClient();
  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (error || !subscriptions?.length) {
    return { sent: 0, skipped: Boolean(error) };
  }

  let sent = 0;

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          JSON.stringify(payload),
        );

        sent += 1;
      } catch (pushError) {
        const statusCode = typeof pushError === "object" && pushError && "statusCode" in pushError
          ? Number(pushError.statusCode)
          : null;

        if (statusCode === 404 || statusCode === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", subscription.id);
        }
      }
    }),
  );

  return { sent, skipped: false };
}
