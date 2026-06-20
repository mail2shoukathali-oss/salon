import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { requireOwnerAccess } from "@/lib/auth/access";
import { getCurrentMonthParts } from "@/lib/owner-payouts";
import { getOwnerDashboardData } from "@/lib/owner-dashboard";
import { getManagerTodayDateString } from "@/lib/manager-closing";

function formatMoney(amount: number) {
  return `AED ${amount.toFixed(2)}`;
}

function isIsoDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function isMonthString(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}$/.test(value));
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export default async function OwnerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; month?: string }>;
}) {
  const { profile } = await requireOwnerAccess();
  const { date: dateParam, month: monthParam } = await searchParams;
  const todayDate = getManagerTodayDateString();
  const currentMonth = getCurrentMonthParts();
  const selectedDate = isIsoDate(dateParam) ? dateParam : todayDate;
  const selectedMonth = isMonthString(monthParam)
    ? monthParam
    : `${String(currentMonth.year).padStart(4, "0")}-${String(currentMonth.month).padStart(2, "0")}`;
  const data = await getOwnerDashboardData({ selectedDate, selectedMonth });

  const cards = [
    {
      title: "Selected day approved sales",
      value: formatMoney(data.selectedDayApprovedSales),
      description: `Approved sales for ${formatDateLabel(data.selectedDate)}.`,
    },
    {
      title: "Selected day expenses",
      value: formatMoney(data.selectedDayExpenses),
      description: `Operating expenses recorded on ${formatDateLabel(data.selectedDate)}.`,
    },
    {
      title: "Selected day net balance",
      value: formatMoney(data.selectedDayNetBalance),
      description: "Approved sales minus expenses for the selected day.",
    },
    {
      title: "Pending service entries",
      value: String(data.pendingServiceEntriesCount),
      description: "Current pending entries waiting for manager review.",
    },
    {
      title: "Selected month approved sales",
      value: formatMoney(data.selectedMonthApprovedSales),
      description: `Approved sales for ${data.selectedMonthLabel}.`,
    },
    {
      title: "Selected month expenses",
      value: formatMoney(data.selectedMonthExpenses),
      description: `Expenses recorded in ${data.selectedMonthLabel}.`,
    },
    {
      title: "Selected day closing status",
      value: data.selectedDayClosingStatus,
      description: `Open ${formatDateLabel(data.selectedDate)} in daily closing if you need to review it.`,
    },
  ];

  return (
    <AppShell
      role={profile.role}
      title="Owner dashboard"
      description="Review any selected day and month across salon operations."
    >
      <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <form
          method="get"
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end"
        >
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-700">
              Day
            </span>
            <input
              type="date"
              name="date"
              defaultValue={data.selectedDate}
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-zinc-400"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-700">
              Month
            </span>
            <input
              type="month"
              name="month"
              defaultValue={data.selectedMonth}
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
            href="/owner/dashboard"
            className="rounded-2xl border border-zinc-200 px-4 py-3 text-center text-sm font-medium text-zinc-700"
          >
            Today / current month
          </Link>
        </form>
        <p className="mt-3 text-sm text-zinc-600">
          Showing {formatDateLabel(data.selectedDate)} and {data.selectedMonthLabel}.
        </p>
      </section>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.title}
            className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-zinc-500">{card.title}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">
              {card.value}
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {card.description}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">
              Recent daily closing
            </h2>
            <Link
              href={`/manager/closing/${data.selectedDate}`}
              className="rounded-full border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700"
            >
              Open selected day
            </Link>
          </div>

          <div className="mt-4 grid gap-3">
            {data.recentClosings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
                No daily closings yet.
              </div>
            ) : (
              data.recentClosings.map((closing) => (
                <article
                  key={closing.id}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                >
                  <p className="text-sm font-medium text-zinc-950">
                    {closing.closing_date}
                  </p>
                  <div className="mt-2 grid gap-1 text-sm text-zinc-600">
                    <p>
                      Total approved sales:{" "}
                      {formatMoney(closing.total_approved_sales)}
                    </p>
                    <p>Total expenses: {formatMoney(closing.total_expenses)}</p>
                    <p>Net balance: {formatMoney(closing.net_balance)}</p>
                    <p>Cash difference: {formatMoney(closing.cash_difference)}</p>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight">
            Top staff in {data.selectedMonthLabel}
          </h2>

          <div className="mt-4 grid gap-3">
            {data.topStaffThisMonth.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
                No approved sales yet in this month.
              </div>
            ) : (
              data.topStaffThisMonth.map((staff) => (
                <article
                  key={staff.staff_id}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                >
                  <p className="text-sm font-medium text-zinc-950">
                    {staff.staff_name || "Unknown staff"}
                  </p>
                  <div className="mt-2 grid gap-1 text-sm text-zinc-600">
                    <p>
                      Total approved sales:{" "}
                      {formatMoney(staff.total_approved_sales)}
                    </p>
                    <p>Approved entries: {staff.approved_entries_count}</p>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
