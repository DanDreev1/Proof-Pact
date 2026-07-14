"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ActionResult } from "@/lib/validation/result";
import { loginAction } from "../actions/login";

const initialState: ActionResult = { ok: false, error: "" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-1">
        <Input name="email" placeholder="Email" type="email" autoComplete="email" />
        {!state.ok && state.fieldErrors?.email ? (
          <p className="text-xs text-red-300">{state.fieldErrors.email[0]}</p>
        ) : null}
      </div>

      <div className="space-y-1">
        <Input name="password" placeholder="Password" type="password" autoComplete="current-password" />
        {!state.ok && state.fieldErrors?.password ? (
          <p className="text-xs text-red-300">{state.fieldErrors.password[0]}</p>
        ) : null}
      </div>

      {!state.ok && state.error ? <p className="text-sm text-red-300">{state.error}</p> : null}

      <Button className="w-full" disabled={pending}>
        {pending ? "Logging in..." : "Log in"}
      </Button>
    </form>
  );
}
