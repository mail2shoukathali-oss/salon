import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import {
  formatMonthLabel,
  getCurrentMonthString,
  getStaffMonthlyData,
  isMonthString,
} from "@/lib/staff-monthly";

function formatMoney(amount: number) {
  return `AED ${amount.toFixed(2)}`;
}

function formatServiceDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export default async function StaffMonthlyPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { user, profile } = await getCurrentUserProfile();

  if (!user || !profile) {
    redirect("/login");
  }

  const { month: monthParam } = await searchParams;
  const selectedMonth = isMonthString(monthParam)
    ? monthParam
    : getCurrentMonthString();
  const data = await getStaffMonthlyData(
    user.id,
    Number(profile.commission_percentage ?? 0),
    selectedMonth,
  );

  return (
    <AppShell
      role={profile.role}
      title="Monthly"
      description="View your approved sales and an estimated commission for the selected month."
    >
      <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <form
          method="get"
          className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end"
        >
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-700">
              Month
            </span>
            <input
              type="month"
              name="month"
              defaultValue={selectedMonth}
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-zinc-400"
            />
          </label>

          <button
            type="submit"
            className="rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white"
          >
            Apply filter
          </button>

          <Link
            href="/staff/monthly"
            className="rounded-2xl border border-zinc-200 px-4 py-3 text-center text-sm font-medium text-zinc-700"
          >
            Current month
          </Link>
        </form>
        <p className="mt-3 text-sm text-zinc-600">
          Showing {formatMonthLabel(data.month)}.
        </p>
      </section>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Approved sales total</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {formatMoney(data.summary.approvedSalesTotal)}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Approved entries</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {data.summary.approvedEntriesCount}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Pending entries</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {data.summary.pendingEntriesCount}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Rejected entries</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {data.summary.rejectedEntriesCount}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Commission percentage</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {Number(data.summary.commissionPercentage).toFixed(2)}%
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Estimated commission</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {formatMoney(data.summary.estimatedCommissionAmount)}
          </p>
        </article>
      </div>

      <section className="mt-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">
          Approved entries in {data.monthLabel}
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Read-only view. Estimated commission may differ from the final monthly
          payout if deductions or advance deductions are applied later.
        </p>

        <div className="mt-4 grid gap-4">
          {data.entries.filter((entry) => entry.status === "approved").length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-600">
              No approved service entries found for this month.
            </div>
          ) : null}

          {data.entries
            .filter((entry) => entry.status === "approved")
            .map((entry) => (
              <article
                key={entry.id}
                className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-zinc-950">
                      {entry.service_name}
                    </h3>
                    <p className="mt-1 text-sm text-zinc-600">
                      {formatServiceDate(entry.service_date)}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-emerald-700">
                    approved
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm text-zinc-700 sm:grid-cols-2">
                  <div>
                    <span className="block text-zinc-500">Amount</span>
                    <span className="font-medium">
                      {formatMoney(Number(entry.amount))}
                    </span>
                  </div>
                  <div>
                    <span className="block text-zinc-500">Payment method</span>
                    <span className="font-medium">{entry.payment_method}</span>
                  </div>
                </div>
              </article>
            ))}
        </div>
      </section>
    </AppShell>
  );
}
