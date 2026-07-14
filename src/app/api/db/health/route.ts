import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const hasUrl = Boolean(url);
  const hasAnonKey = Boolean(anonKey);
  const hasServiceRoleKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  if (!url || !anonKey) {
    return NextResponse.json(
      {
        ok: false,
        configured: {
          url: hasUrl,
          anonKey: hasAnonKey,
          serviceRoleKey: hasServiceRoleKey,
        },
        message: "Supabase URL and anon key are required for the app connection.",
      },
      { status: 503 },
    );
  }

  const supabase = createClient<Database>(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  const { error } = await supabase.from("daily_words").select("id").limit(1);

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        configured: {
          url: true,
          anonKey: true,
          serviceRoleKey: hasServiceRoleKey,
        },
        message: "Supabase connection failed or schema has not been applied.",
        code: error.code,
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    ok: true,
    configured: {
      url: true,
      anonKey: true,
      serviceRoleKey: hasServiceRoleKey,
    },
    adminReady: hasServiceRoleKey,
  });
}
