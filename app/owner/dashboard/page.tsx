import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { requireOwnerAccess } from "@/lib/auth/access";
import { getOwnerDashboardData } from "@/lib/owner-dashboard";

function formatMoney(amount: number) {
  return `AED ${amount.toFixed(2)}`;
}

export default async function OwnerDashboardPage() {
  const { profile } = await requireOwnerAccess();
  const data = await getOwnerDashboardData();

  const cards = [
    {
      title: "Today approved sales",
      value: formatMoney(data.todayApprovedSales),
      description: "Approved sales for today only.",
    },
    {
      title: "Today expenses",
      value: formatMoney(data.todayExpenses),
      description: "Operating expenses recorded today.",
    },
    {
      title: "Today net balance",
      value: formatMoney(data.todayNetBalance),
      description: "Today approved sales minus today expenses.",
    },
    {
      title: "Pending service entries",
      value: String(data.pendingServiceEntriesCount),
      description: "Service entries waiting for review.",
    },
    {
      title: "Month approved sales",
      value: formatMoney(data.currentMonthApprovedSales),
      description: "Approved sales for the current month.",
    },
    {
      title: "Month expenses",
      value: formatMoney(data.currentMonthExpenses),
      description: "Expenses recorded in the current month.",
    },
    {
      title: "Today closing status",
      value: data.todayClosingStatus,
      description: "Closed means a daily closing already exists for today.",
    },
  ];

  return (
    <AppShell
      role={profile.role}
      title="Owner dashboard"
      description="High-level daily operations overview for the full salon."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
              href={`/manager/closing/${data.todayDate}`}
              className="rounded-full border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700"
            >
              Open today
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
            Top staff this month
          </h2>

          <div className="mt-4 grid gap-3">
            {data.topStaffThisMonth.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
                No approved sales yet this month.
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
