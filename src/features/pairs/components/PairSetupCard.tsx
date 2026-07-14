"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { ActionResult } from "@/lib/validation/result";
import { createPairAction } from "../actions/create-pair";
import { joinPairAction } from "../actions/join-pair";
import { leavePairAction } from "../actions/leave-pair";
import type { CurrentPair } from "../queries/get-current-pair";

type PairSetupCardProps = {
  pair: CurrentPair | null;
};

type CreatePairSuccess = {
  pairId: string;
  inviteCode: string;
};

type JoinPairSuccess = {
  pairId: string;
};

type LeavePairSuccess = {
  pairId: string;
};

const createInitialState: ActionResult<CreatePairSuccess> = { ok: false, error: "" };
const joinInitialState: ActionResult<JoinPairSuccess> = { ok: false, error: "" };
const leaveInitialState: ActionResult<LeavePairSuccess> = { ok: false, error: "" };

export function PairSetupCard({ pair }: PairSetupCardProps) {
  const [createState, createFormAction, creating] = useActionState(createPairAction, createInitialState);
  const [joinState, joinFormAction, joining] = useActionState(joinPairAction, joinInitialState);
  const [leaveState, leaveFormAction, leaving] = useActionState(leavePairAction, leaveInitialState);
  const [leaveArmed, setLeaveArmed] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(15);

  useEffect(() => {
    if (!leaveArmed || secondsLeft <= 0) return;

    const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [leaveArmed, secondsLeft]);

  if (pair) {
    const isReady = pair.memberCount >= 2;

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>{pair.partner ? `Connected with ${pair.partner.displayName}` : "Waiting for partner"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-2xl bg-slate-900 p-3">
                <p className="text-slate-500">Members</p>
                <p className="font-semibold">{pair.memberCount}/2</p>
              </div>
              <div className="rounded-2xl bg-slate-900 p-3">
                <p className="text-slate-500">Status</p>
                <p className="font-semibold">{isReady ? "Ready" : "Waiting"}</p>
              </div>
            </div>

            {!pair.partner ? (
              <div className="rounded-2xl border border-white/10 bg-slate-900 p-4">
                <p className="text-sm text-slate-400">Invite code</p>
                <p className="mt-1 text-3xl font-black tracking-[0.2em]">{pair.inviteCode}</p>
              </div>
            ) : null}

            {!isReady ? (
              <p className="text-sm text-slate-400">Share this code with your partner to unlock proof requests.</p>
            ) : (
              <p className="text-sm text-emerald-300">Your pair is ready for proof requests.</p>
            )}
          </CardContent>
        </Card>

        {pair.partner ? (
          <Card>
            <CardHeader>
              <CardTitle>Leave pair</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-400">
                This deletes the pair, proof records, and stored videos shared between you and {pair.partner.displayName}.
              </p>

              {!leaveArmed ? (
                <Button className="w-full" onClick={() => setLeaveArmed(true)} type="button" variant="secondary">
                  Start leave process
                </Button>
              ) : secondsLeft > 0 ? (
                <Button className="w-full" disabled type="button" variant="secondary">
                  Think for {secondsLeft}s
                </Button>
              ) : (
                <form action={leaveFormAction} className="space-y-3">
                  <Input
                    name="partnerName"
                    placeholder={`Type ${pair.partner.displayName}`}
                    autoComplete="off"
                  />
                  {!leaveState.ok && leaveState.fieldErrors?.partnerName ? (
                    <p className="text-xs text-red-300">{leaveState.fieldErrors.partnerName[0]}</p>
                  ) : null}
                  {!leaveState.ok && leaveState.error ? <p className="text-sm text-red-300">{leaveState.error}</p> : null}
                  {leaveState.ok ? <p className="text-sm text-emerald-300">Pair deleted.</p> : null}
                  <Button className="w-full" disabled={leaving} variant="secondary">
                    {leaving ? "Deleting..." : "Leave and delete shared data"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connect with partner</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <form action={createFormAction} className="space-y-2">
          <Button className="w-full" disabled={creating}>
            {creating ? "Creating..." : "Create invite"}
          </Button>
          {!createState.ok && createState.error ? <p className="text-sm text-red-300">{createState.error}</p> : null}
          {createState.ok ? (
            <p className="text-sm text-emerald-300">Invite created: {createState.data.inviteCode}</p>
          ) : null}
        </form>

        <div className="h-px bg-white/10" />

        <form action={joinFormAction} className="space-y-3">
          <div className="space-y-1">
            <Input name="inviteCode" placeholder="Invite code" autoComplete="off" />
            {!joinState.ok && joinState.fieldErrors?.inviteCode ? (
              <p className="text-xs text-red-300">{joinState.fieldErrors.inviteCode[0]}</p>
            ) : null}
          </div>

          {!joinState.ok && joinState.error ? <p className="text-sm text-red-300">{joinState.error}</p> : null}
          {joinState.ok ? <p className="text-sm text-emerald-300">Pair joined.</p> : null}

          <Button className="w-full" variant="secondary" disabled={joining}>
            {joining ? "Joining..." : "Join with code"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
