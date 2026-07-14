"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ActionResult } from "@/lib/validation/result";
import { registerAction } from "../actions/register";

type RegisterSuccess = {
  message: string;
};

const initialState: ActionResult<RegisterSuccess> = { ok: false, error: "" };

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1">
        <Input name="displayName" placeholder="Display name" autoComplete="name" />
        {!state.ok && state.fieldErrors?.displayName ? (
          <p className="text-xs text-red-300">{state.fieldErrors.displayName[0]}</p>
        ) : null}
      </div>

      <div className="space-y-1">
        <Input name="email" placeholder="Email" type="email" autoComplete="email" />
        {!state.ok && state.fieldErrors?.email ? (
          <p className="text-xs text-red-300">{state.fieldErrors.email[0]}</p>
        ) : null}
      </div>

      <div className="space-y-1">
        <Input name="password" placeholder="Password" type="password" autoComplete="new-password" />
        {!state.ok && state.fieldErrors?.password ? (
          <p className="text-xs text-red-300">{state.fieldErrors.password[0]}</p>
        ) : null}
      </div>

      {state.ok ? <p className="text-sm text-emerald-300">{state.data.message}</p> : null}
      {!state.ok && state.error ? <p className="text-sm text-red-300">{state.error}</p> : null}

      <Button className="w-full" disabled={pending}>
        {pending ? "Creating account..." : "Register"}
      </Button>
    </form>
  );
}
