import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { getManagerTodayDateString } from "@/lib/manager-closing";
import { getManagerExpenses } from "@/lib/manager-expenses";

function formatMoney(amount: number) {
  return `AED ${amount.toFixed(2)}`;
}

function isIsoDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export default async function ManagerExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { user, profile } = await getCurrentUserProfile();

  if (!user || !profile) {
    redirect("/login");
  }

  if (profile.role === "staff") {
    redirect("/staff/today");
  }

  const { date: dateParam } = await searchParams;
  const selectedDate: string = isIsoDate(dateParam)
    ? dateParam
    : getManagerTodayDateString();
  const { expenses, totals } = await getManagerExpenses(selectedDate);

  return (
    <AppShell
      role={profile.role}
      title="Expenses"
      description="Track daily operating expenses for the salon by date."
    >
      <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <form method="get" className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-700">
              Filter date
            </span>
            <input
              type="date"
              name="date"
              defaultValue={selectedDate}
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
            href="/manager/expenses"
            className="rounded-2xl border border-zinc-200 px-4 py-3 text-center text-sm font-medium text-zinc-700"
          >
            Today
          </Link>
        </form>
        <p className="mt-3 text-sm text-zinc-600">
          Showing expenses for {formatDateLabel(selectedDate)}.
        </p>
      </section>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Total expenses</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {formatMoney(totals.total)}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Number of expenses</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {totals.count}
          </p>
        </article>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-zinc-600">Newest expenses first.</p>
        <Link
          href="/manager/expenses/new"
          className="rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white"
        >
          Add expense
        </Link>
      </div>

      <div className="mt-4 grid gap-4">
        {expenses.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm">
            No expenses found.
          </div>
        ) : null}

        {expenses.map((expense) => (
          <article
            key={expense.id}
            className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-zinc-950">
                  {expense.title}
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  {expense.expense_date}
                </p>
              </div>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-700">
                {expense.payment_method}
              </span>
            </div>

            <div className="mt-4 grid gap-3 text-sm text-zinc-700 sm:grid-cols-2">
              <div>
                <span className="block text-zinc-500">Category</span>
                <span className="font-medium">{expense.category}</span>
              </div>
              <div>
                <span className="block text-zinc-500">Amount</span>
                <span className="font-medium">
                  {formatMoney(Number(expense.amount))}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="block text-zinc-500">Notes</span>
                <span className="font-medium">{expense.notes || "—"}</span>
              </div>
            </div>

            <div className="mt-4">
              <Link
                href={`/manager/expenses/${expense.id}/edit`}
                className="inline-flex rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700"
              >
                Edit
              </Link>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
