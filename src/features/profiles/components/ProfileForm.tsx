"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ActionResult } from "@/lib/validation/result";
import { updateProfileAction } from "../actions/update-profile";

type ProfileFormProps = {
  displayName: string;
};

type UpdateProfileSuccess = {
  displayName: string;
};

const initialState: ActionResult<UpdateProfileSuccess> = { ok: false, error: "" };

export function ProfileForm({ displayName }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState(updateProfileAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1">
        <Input defaultValue={displayName} maxLength={40} name="displayName" placeholder="Display name" />
        {!state.ok && state.fieldErrors?.displayName ? (
          <p className="text-xs text-red-300">{state.fieldErrors.displayName[0]}</p>
        ) : null}
      </div>

      {!state.ok && state.error ? <p className="text-sm text-red-300">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-emerald-300">Profile updated.</p> : null}

      <Button className="w-full" disabled={pending}>
        {pending ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}
