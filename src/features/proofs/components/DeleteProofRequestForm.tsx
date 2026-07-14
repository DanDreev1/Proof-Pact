"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ActionResult } from "@/lib/validation/result";
import { deleteProofRequestAction } from "../actions/delete-proof-request";

type DeleteProofRequestFormProps = {
  requestId: string;
  title: string;
};

type DeleteProofSuccess = {
  requestId: string;
};

const initialState: ActionResult<DeleteProofSuccess> = { ok: false, error: "" };

export function DeleteProofRequestForm({ requestId, title }: DeleteProofRequestFormProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(deleteProofRequestAction, initialState);

  if (!open) {
    return (
      <Button className="w-full" onClick={() => setOpen(true)} type="button" variant="secondary">
        Delete proof request
      </Button>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input name="requestId" type="hidden" value={requestId} />
      <input name="title" type="hidden" value={title} />
      <p className="text-sm text-slate-400">
        This removes the proof record and its stored video. Type the proof title to confirm.
      </p>
      <Input name="confirmTitle" placeholder={title} autoComplete="off" />
      {!state.ok && state.fieldErrors?.confirmTitle ? (
        <p className="text-xs text-red-300">{state.fieldErrors.confirmTitle[0]}</p>
      ) : null}
      {!state.ok && state.error ? <p className="text-sm text-red-300">{state.error}</p> : null}
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={() => setOpen(false)} type="button" variant="secondary">
          Cancel
        </Button>
        <Button disabled={pending} variant="secondary">
          {pending ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </form>
  );
}
