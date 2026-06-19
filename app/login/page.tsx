import Link from "next/link";

const previewLinks = [
  { href: "/owner/dashboard", label: "Owner dashboard" },
  { href: "/manager/dashboard", label: "Manager dashboard" },
  { href: "/staff/today", label: "Staff today" },
];

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f6f1ea] px-4 py-8 text-zinc-950 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center">
        <section className="w-full rounded-3xl bg-white p-6 shadow-[0_24px_70px_-40px_rgba(0,0,0,0.45)] ring-1 ring-zinc-200 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-600">
            Salon commissions
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Sign in for staff and management views
          </h1>
          <p className="mt-3 text-sm leading-6 text-zinc-600">
            Authentication wiring comes later. This page is a mobile-first
            placeholder for the future login flow.
          </p>

          <form className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-700">
                Email
              </span>
              <input
                type="email"
                placeholder="name@salon.com"
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-700">
                Password
              </span>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400"
              />
            </label>

            <button
              type="button"
              className="w-full rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white"
            >
              Authentication coming soon
            </button>
          </form>

          <div className="mt-6 border-t border-zinc-200 pt-5">
            <p className="text-sm font-medium text-zinc-700">Preview routes</p>
            <div className="mt-3 grid gap-2">
              {previewLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
