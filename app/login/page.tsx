"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type MessageState = {
  type: "error" | "success";
  text: string;
} | null;

export default function LoginPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
      setLoading(false);
      return;
    }

    setMessage({
      type: "success",
      text: "Signed in successfully. Redirecting to the dashboard...",
    });

    router.replace("/owner/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#f6f1ea] px-4 py-8 text-zinc-950 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center">
        <section className="w-full rounded-3xl bg-white p-6 shadow-[0_24px_70px_-40px_rgba(0,0,0,0.45)] ring-1 ring-zinc-200 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">
            Salon commissions
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Sign in
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Use your email and password to access the app.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-700">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@salon.com"
                autoComplete="email"
                required
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-700">
                Password
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400"
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-5 min-h-12 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6">
            {message ? (
              <p
                className={
                  message.type === "error" ? "text-red-600" : "text-emerald-700"
                }
              >
                {message.text}
              </p>
            ) : (
              <p className="text-zinc-500">
                Status messages will appear here.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
