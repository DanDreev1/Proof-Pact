"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { savePushSubscription } from "../actions/save-push-subscription";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

export function NotificationPermissionButton() {
  const [message, setMessage] = useState<string>("Notifications are optional.");
  const [pending, setPending] = useState(false);

  async function requestPermission() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

    if (!publicKey) {
      setMessage("Push notifications are not configured yet.");
      return;
    }

    if (!("Notification" in window)) {
      setMessage("Notifications are not supported in this browser.");
      return;
    }

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setMessage("Push notifications are not supported in this browser.");
      return;
    }

    setPending(true);

    try {
    const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setMessage(`Notification permission: ${permission}`);
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      const subscription = existingSubscription ?? await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const result = await savePushSubscription(subscription.toJSON());

      if (!result.ok) {
        setMessage(result.error);
        return;
      }

      setMessage("Notifications enabled.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400">{message}</p>
      <Button type="button" variant="secondary" onClick={requestPermission} disabled={pending}>
        {pending ? "Enabling..." : "Enable notifications"}
      </Button>
    </div>
  );
}
