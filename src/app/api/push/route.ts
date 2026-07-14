import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      message: "Push notifications are sent by server-side proof actions.",
    },
    { status: 404 },
  );
}
