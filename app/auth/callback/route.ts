import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (code) {
    const supabase = await createSupabaseServerClient();
    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch {
      // Ignore callback exchange errors for now and fall back to login.
    }
  }

  return NextResponse.redirect(new URL("/login", request.url));
}
