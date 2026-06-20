import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { requireOwnerOrManagerAccess } from "@/lib/auth/access";
import {
  formatReportMonthLabel,
  getCurrentReportMonthString,
  getManagerStaffMonthlyReport,
  isMonthString,
} from "@/lib/manager-staff-monthly-report";

function formatMoney(amount: number) {
  return `AED ${amount.toFixed(2)}`;
}

export default async function ManagerStaffMonthlyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { profile } = await requireOwnerOrManagerAccess();
  const { month: monthParam } = await searchParams;
  const selectedMonth = isMonthString(monthParam)
    ? monthParam
    : getCurrentReportMonthString();
  const report = await getManagerStaffMonthlyReport(selectedMonth);

  return (
    <AppShell
      role={profile.role}
      title="Monthly staff report"
      description="Monthly staff-wise performance by selected month."
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
            href="/manager/reports/staff-monthly"
            className="rounded-2xl border border-zinc-200 px-4 py-3 text-center text-sm font-medium text-zinc-700"
          >
            Current month
          </Link>
        </form>
        <p className="mt-3 text-sm text-zinc-600">
          Showing staff performance for {formatReportMonthLabel(report.month)}.
        </p>
      </section>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Total approved sales</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {formatMoney(report.summary.totalApprovedSales)}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Approved entries</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {report.summary.approvedEntriesCount}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Pending entries</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {report.summary.pendingEntriesCount}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Rejected entries</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {report.summary.rejectedEntriesCount}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Total entries</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {report.summary.totalEntriesCount}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Top staff</p>
          <p className="mt-3 text-xl font-semibold tracking-tight">
            {report.summary.topStaffName || "No data"}
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            {formatMoney(report.summary.topStaffApprovedSales)}
          </p>
        </article>
      </div>

      <section className="mt-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">
          Staff performance for {report.month}
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Read-only monthly summary. Commission is not calculated here.
        </p>

        <div className="mt-4 grid gap-4">
          {report.staffRows.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-600">
              No service entries found for this month.
            </div>
          ) : null}

          {report.staffRows.map((staff) => (
            <article
              key={staff.staff_id}
              className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-zinc-950">
                    {staff.staff_name || "Unknown staff"}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600">{staff.staff_id}</p>
                </div>
                <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-700">
                  Monthly
                </span>
              </div>

              <div className="mt-4 grid gap-3 text-sm text-zinc-700 sm:grid-cols-2 xl:grid-cols-5">
                <div>
                  <span className="block text-zinc-500">Approved sales</span>
                  <span className="font-medium">
                    {formatMoney(staff.approvedSalesTotal)}
                  </span>
                </div>
                <div>
                  <span className="block text-zinc-500">Approved entries</span>
                  <span className="font-medium">{staff.approvedEntriesCount}</span>
                </div>
                <div>
                  <span className="block text-zinc-500">Pending entries</span>
                  <span className="font-medium">{staff.pendingEntriesCount}</span>
                </div>
                <div>
                  <span className="block text-zinc-500">Rejected entries</span>
                  <span className="font-medium">{staff.rejectedEntriesCount}</span>
                </div>
                <div>
                  <span className="block text-zinc-500">Total entries</span>
                  <span className="font-medium">{staff.totalEntriesCount}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
