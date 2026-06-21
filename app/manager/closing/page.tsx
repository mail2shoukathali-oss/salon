import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { requireManagerAccess } from "@/lib/auth/access";
import {
  getManagerTodayDateString,
  getRecentManagerClosings,
} from "@/lib/manager-closing";

function formatMoney(amount: number) {
  return `AED ${amount.toFixed(2)}`;
}

export default async function ManagerClosingPage() {
  const { user, profile } = await getCurrentUserProfile();

  if (!user || !profile) {
    redirect("/login");
  }

  if (profile.role === "staff") {
    redirect("/staff/today");
  }

  const today = getManagerTodayDateString();
  const recentClosings = await getRecentManagerClosings();

  async function noop() {
    "use server";
    await requireManagerAccess();
  }

  return (
    <AppShell
      role={profile.role}
      title="Daily closing"
      description="Review recent closings and open today&apos;s closing worksheet."
    >
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-zinc-600">
          Daily closing does not calculate or deduct commission.
        </p>
        <div className="mt-4">
          <Link
            href={`/manager/closing/${today}`}
            className="inline-flex rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white"
          >
            Open today&apos;s closing
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        {recentClosings.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm">
            No daily closings found yet.
          </div>
        ) : null}

        {recentClosings.map((closing) => (
          <article
            key={closing.id}
            className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-zinc-950">
                  {closing.closing_date}
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Tap the date to review or update.
                </p>
              </div>
              <Link
                href={`/manager/closing/${closing.closing_date}`}
                className="rounded-full border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700"
              >
                Open
              </Link>
            </div>

            <div className="mt-4 grid gap-3 text-sm text-zinc-700 sm:grid-cols-2">
              <div>
                <span className="block text-zinc-500">Total approved sales</span>
                <span className="font-medium">
                  {formatMoney(Number(closing.total_approved_sales))}
                </span>
              </div>
              <div>
                <span className="block text-zinc-500">Total expenses</span>
                <span className="font-medium">
                  {formatMoney(Number(closing.total_expenses))}
                </span>
              </div>
              <div>
                <span className="block text-zinc-500">Net balance</span>
                <span className="font-medium">
                  {formatMoney(Number(closing.net_balance))}
                </span>
              </div>
              <div>
                <span className="block text-zinc-500">Cash in hand</span>
                <span className="font-medium">
                  {formatMoney(Number(closing.cash_in_hand ?? 0))}
                </span>
              </div>
              <div>
                <span className="block text-zinc-500">Actual cash</span>
                <span className="font-medium">
                  {formatMoney(Number(closing.actual_cash))}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="block text-zinc-500">Cash difference</span>
                <span className="font-medium">
                  {formatMoney(Number(closing.cash_difference))}
                </span>
              </div>
            </div>

            <form action={noop} className="hidden" />
          </article>
        ))}
      </div>
    </AppShell>
  );
}
