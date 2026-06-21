import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getManagerTodayDateString } from "@/lib/manager-closing";

type StaffProfileRow = {
  id: string;
  full_name: string | null;
};

type DashboardServiceEntryRow = {
  id: string;
  staff_id: string;
  service_name: string;
  amount: number;
  payment_method: "cash" | "card" | "online" | "other";
  status: "pending" | "approved" | "rejected";
  service_date: string;
};

type DashboardExpenseRow = {
  id: string;
  title: string;
  amount: number;
  category: string;
  expense_date: string;
};

function formatMoney(amount: number) {
  return `AED ${amount.toFixed(2)}`;
}

export default async function ManagerDashboardPage() {
  const { user, profile } = await getCurrentUserProfile();

  if (!user || !profile) {
    redirect("/login");
  }

  if (profile.role === "staff") {
    redirect("/staff/today");
  }

  const supabase = await createSupabaseServerClient();
  const today = getManagerTodayDateString();
  const todayClosingPath = `/manager/closing/${today}`;

  const [
    { data: todayEntryRows, error: todayEntriesError },
    { data: pendingPreviewRows, error: pendingPreviewError },
    { data: todayExpenseRows, error: todayExpensesError },
    { data: recentExpenseRows, error: recentExpensesError },
    { data: closingRow, error: closingError },
    { data: profileRows, error: profileError },
  ] = await Promise.all([
    supabase
      .from("service_entries")
      .select("id, staff_id, service_name, amount, payment_method, status, service_date")
      .eq("service_date", today)
      .order("created_at", { ascending: false }),
    supabase
      .from("service_entries")
      .select("id, staff_id, service_name, amount, payment_method, status, service_date")
      .eq("service_date", today)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("expenses")
      .select("id, title, amount, category, expense_date")
      .eq("expense_date", today)
      .order("created_at", { ascending: false }),
    supabase
      .from("expenses")
      .select("id, title, amount, category, expense_date")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("daily_closings")
      .select("id, closing_date")
      .eq("closing_date", today)
      .maybeSingle(),
    supabase.from("profiles").select("id, full_name"),
  ]);

  if (todayEntriesError) {
    throw todayEntriesError;
  }

  if (pendingPreviewError) {
    throw pendingPreviewError;
  }

  if (todayExpensesError) {
    throw todayExpensesError;
  }

  if (recentExpensesError) {
    throw recentExpensesError;
  }

  if (closingError) {
    throw closingError;
  }

  if (profileError) {
    throw profileError;
  }

  const profileMap = new Map(
    ((profileRows ?? []) as StaffProfileRow[]).map((staffProfile) => [
      staffProfile.id,
      staffProfile.full_name,
    ] as const),
  );

  const todayEntries = (todayEntryRows ?? []) as DashboardServiceEntryRow[];
  const pendingPreview = (pendingPreviewRows ?? []) as DashboardServiceEntryRow[];
  const todayExpenses = (todayExpenseRows ?? []) as DashboardExpenseRow[];
  const recentExpenses = (recentExpenseRows ?? []) as DashboardExpenseRow[];

  const approvedEntries = todayEntries.filter((entry) => entry.status === "approved");
  const pendingEntries = todayEntries.filter((entry) => entry.status === "pending");
  const approvedSalesTotal = approvedEntries.reduce(
    (total, entry) => total + Number(entry.amount),
    0,
  );
  const todayExpensesTotal = todayExpenses.reduce(
    (total, expense) => total + Number(expense.amount),
    0,
  );
  const netBalance = approvedSalesTotal - todayExpensesTotal;
  const todayClosingStatus = closingRow ? "Closed" : "Not closed";

  return (
    <AppShell
      role={profile.role}
      title="Manager dashboard"
      description="Operational view for today's staff, entries, expenses, and closing status."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Today approved sales</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {formatMoney(approvedSalesTotal)}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Today pending entries</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {pendingEntries.length}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Today expenses</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {formatMoney(todayExpensesTotal)}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Today net balance</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {formatMoney(netBalance)}
          </p>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            Approved sales minus expenses.
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Today closing status</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {todayClosingStatus}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Today approved entries</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {approvedEntries.length}
          </p>
        </article>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Pending entries preview
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                Up to five pending entries from today.
              </p>
            </div>
            <Link
              href="/manager/entries/pending"
              className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700"
            >
              View all
            </Link>
          </div>

          <div className="mt-4 grid gap-3">
            {pendingPreview.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
                No pending entries today.
              </div>
            ) : (
              pendingPreview.map((entry) => (
                <article
                  key={entry.id}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-950">
                        {entry.service_name}
                      </p>
                      <p className="mt-1 text-sm text-zinc-600">
                        {profileMap.get(entry.staff_id) || "Unknown staff"}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-700">
                      {entry.payment_method}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-sm text-zinc-700">
                    <span>{formatMoney(Number(entry.amount))}</span>
                    <span className="text-zinc-500">{entry.status}</span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Recent expenses preview
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600">
                The latest operating expenses recorded in the system.
              </p>
            </div>
            <Link
              href="/manager/expenses"
              className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700"
            >
              View all
            </Link>
          </div>

          <div className="mt-4 grid gap-3">
            {recentExpenses.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
                No expenses recorded yet.
              </div>
            ) : (
              recentExpenses.map((expense) => (
                <article
                  key={expense.id}
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-zinc-950">
                        {expense.title}
                      </p>
                      <p className="mt-1 text-sm text-zinc-600">
                        {expense.category}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-zinc-700">
                      {formatMoney(Number(expense.amount))}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-zinc-600">{expense.expense_date}</p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="mt-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Today closing shortcut
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Open the closing workspace or jump straight to today&apos;s closing page.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/manager/closing"
              className="rounded-2xl border border-zinc-200 px-4 py-3 text-center text-sm font-medium text-zinc-700"
            >
              Closing hub
            </Link>
            <Link
              href={todayClosingPath}
              className="rounded-2xl bg-zinc-950 px-4 py-3 text-center text-sm font-medium text-white"
            >
              Open today&apos;s closing
            </Link>
          </div>
        </div>
        <div className="mt-4 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
          {todayClosingStatus === "Closed"
            ? "Today already has a saved daily closing."
            : "Today has not been closed yet."}
        </div>
      </section>
    </AppShell>
  );
}
