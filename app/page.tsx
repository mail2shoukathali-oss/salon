import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center bg-[#f6f1ea] px-4 py-8 text-zinc-950 sm:px-6">
      <section className="mx-auto w-full max-w-2xl rounded-3xl bg-white p-6 shadow-[0_24px_70px_-40px_rgba(0,0,0,0.45)] ring-1 ring-zinc-200 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">
          Salon commissions
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Base structure is ready.
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600 sm:text-base">
          Use the login, owner, manager, and staff routes to start wiring the
          commission workflow.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Link
            href="/login"
            className="rounded-2xl bg-zinc-950 px-4 py-3 text-center text-sm font-medium text-white"
          >
            Go to login
          </Link>
          <Link
            href="/owner/dashboard"
            className="rounded-2xl border border-zinc-200 px-4 py-3 text-center text-sm font-medium text-zinc-700"
          >
            Open owner dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
