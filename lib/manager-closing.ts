import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ManagerClosingEntry = {
  id: string;
  service_name: string;
  amount: number;
  payment_method: "cash" | "card" | "online";
  customer_name: string | null;
  service_date: string;
};

export type ManagerClosingExpense = {
  id: string;
  title: string;
  amount: number;
  payment_method: "cash" | "card" | "online";
  expense_date: string;
  notes: string | null;
};

export type DailyClosingRecord = {
  id: string;
  closing_date: string;
  manager_id: string;
  total_approved_sales: number;
  total_expenses: number;
  net_balance: number;
  cash_total: number;
  card_total: number;
  online_total: number;
  actual_cash: number;
  cash_difference: number;
  notes: string | null;
};

export type ManagerClosingSummary = {
  totalApprovedSales: number;
  totalExpenses: number;
  netBalance: number;
  cashTotal: number;
  cardTotal: number;
  onlineTotal: number;
  cashExpenseTotal: number;
  expectedCash: number;
  actualCash: number;
  cashDifference: number;
};

export function getManagerTodayDateString() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dubai",
  }).format(new Date());
}

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

export function calculateManagerClosingSummary(input: {
  entries: ManagerClosingEntry[];
  expenses: ManagerClosingExpense[];
  actualCash?: number;
}): ManagerClosingSummary {
  const approvedEntries = input.entries;
  const cashTotal = sum(
    approvedEntries
      .filter((entry) => entry.payment_method === "cash")
      .map((entry) => Number(entry.amount)),
  );
  const cardTotal = sum(
    approvedEntries
      .filter((entry) => entry.payment_method === "card")
      .map((entry) => Number(entry.amount)),
  );
  const onlineTotal = sum(
    approvedEntries
      .filter((entry) => entry.payment_method === "online")
      .map((entry) => Number(entry.amount)),
  );
  const totalApprovedSales = cashTotal + cardTotal + onlineTotal;
  const totalExpenses = sum(input.expenses.map((expense) => Number(expense.amount)));
  const cashExpenseTotal = sum(
    input.expenses
      .filter((expense) => expense.payment_method === "cash")
      .map((expense) => Number(expense.amount)),
  );
  const expectedCash = cashTotal - cashExpenseTotal;
  const actualCash = input.actualCash ?? 0;
  const cashDifference = actualCash - expectedCash;

  return {
    totalApprovedSales,
    totalExpenses,
    netBalance: totalApprovedSales - totalExpenses,
    cashTotal,
    cardTotal,
    onlineTotal,
    cashExpenseTotal,
    expectedCash,
    actualCash,
    cashDifference,
  };
}

export async function getManagerClosingSnapshot(date: string) {
  const supabase = await createSupabaseServerClient();
  const [
    { data: entryData, error: entryError },
    { data: expenseData, error: expenseError },
    { data: closingData, error: closingError },
  ] = await Promise.all([
    supabase
      .from("service_entries")
      .select("id, service_name, amount, payment_method, customer_name, service_date")
      .eq("service_date", date)
      .eq("status", "approved")
      .order("created_at", { ascending: true }),
    supabase
      .from("expenses")
      .select("id, title, amount, payment_method, expense_date, notes")
      .eq("expense_date", date)
      .order("created_at", { ascending: true }),
    supabase
      .from("daily_closings")
      .select(
        "id, closing_date, manager_id, total_approved_sales, total_expenses, net_balance, cash_total, card_total, online_total, actual_cash, cash_difference, notes",
      )
      .eq("closing_date", date)
      .maybeSingle(),
  ]);

  if (entryError) {
    throw entryError;
  }

  if (expenseError) {
    throw expenseError;
  }

  if (closingError) {
    throw closingError;
  }

  const entries = (entryData ?? []) as ManagerClosingEntry[];
  const expenses = (expenseData ?? []) as ManagerClosingExpense[];
  const existingClosing = (closingData ?? null) as DailyClosingRecord | null;
  const summary = calculateManagerClosingSummary({
    entries,
    expenses,
    actualCash: existingClosing?.actual_cash ?? 0,
  });

  return { entries, expenses, existingClosing, summary };
}

export async function getRecentManagerClosings(limit = 10) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("daily_closings")
    .select(
      "id, closing_date, total_approved_sales, total_expenses, net_balance, actual_cash, cash_difference",
    )
    .order("closing_date", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as Array<{
    id: string;
    closing_date: string;
    total_approved_sales: number;
    total_expenses: number;
    net_balance: number;
    actual_cash: number;
    cash_difference: number;
  }>;
}

export async function saveManagerDailyClosing(input: {
  date: string;
  managerId: string;
  actualCash: number;
  notes: string | null;
}) {
  const snapshot = await getManagerClosingSnapshot(input.date);
  const summary = calculateManagerClosingSummary({
    entries: snapshot.entries,
    expenses: snapshot.expenses,
    actualCash: input.actualCash,
  });
  const supabase = await createSupabaseServerClient();

  return supabase
    .from("daily_closings")
    .upsert(
      {
        closing_date: input.date,
        manager_id: input.managerId,
        total_approved_sales: summary.totalApprovedSales,
        total_expenses: summary.totalExpenses,
        net_balance: summary.netBalance,
        cash_total: summary.cashTotal,
        card_total: summary.cardTotal,
        online_total: summary.onlineTotal,
        actual_cash: summary.actualCash,
        cash_difference: summary.cashDifference,
        notes: input.notes,
      },
      { onConflict: "closing_date" },
    );
}
