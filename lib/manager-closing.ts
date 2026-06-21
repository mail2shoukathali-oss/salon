import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ManagerClosingEntry = {
  id: string;
  service_name: string;
  amount: number;
  payment_method: string | null;
  customer_name: string | null;
  service_date: string;
};

export type ManagerClosingExpense = {
  id: string;
  title: string;
  amount: number;
  payment_method: string | null;
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
  other_sales: number;
  cash_in_hand: number;
  actual_cash: number;
  cash_difference: number;
  notes: string | null;
  created_at: string;
};

export type DailyClosingActivitySnapshot = {
  id: string;
  closing_date: string;
  manager_id: string;
  total_approved_sales: number;
  total_expenses: number;
  net_balance: number;
  cash_total: number;
  card_total: number;
  online_total: number;
  other_sales: number;
  cash_in_hand: number;
  actual_cash: number;
  cash_difference: number;
  notes: string | null;
  created_at: string;
};

export type ManagerClosingSummary = {
  totalApprovedSales: number;
  totalExpenses: number;
  netBalance: number;
  cashSales: number;
  cardSales: number;
  onlineSales: number;
  otherSales: number;
  cashExpenseTotal: number;
  cashInHand: number;
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
  const cashSales = sum(
    approvedEntries
      .filter((entry) => entry.payment_method === "cash")
      .map((entry) => Number(entry.amount)),
  );
  const cardSales = sum(
    approvedEntries
      .filter((entry) => entry.payment_method === "card")
      .map((entry) => Number(entry.amount)),
  );
  const onlineSales = sum(
    approvedEntries
      .filter((entry) => entry.payment_method === "online")
      .map((entry) => Number(entry.amount)),
  );
  const otherSales = sum(
    approvedEntries
      .filter((entry) => entry.payment_method === "other")
      .map((entry) => Number(entry.amount)),
  );
  const totalApprovedSales = cashSales + cardSales + onlineSales + otherSales;
  const totalExpenses = sum(input.expenses.map((expense) => Number(expense.amount)));
  const cashExpenseTotal = sum(
    input.expenses
      .filter((expense) => expense.payment_method === "cash")
      .map((expense) => Number(expense.amount)),
  );
  const cashInHand = cashSales - cashExpenseTotal;
  const actualCash = input.actualCash ?? 0;
  const cashDifference = actualCash - cashInHand;

  return {
    totalApprovedSales,
    totalExpenses,
    netBalance: totalApprovedSales - totalExpenses,
    cashSales,
    cardSales,
    onlineSales,
    otherSales,
    cashExpenseTotal,
    cashInHand,
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
        "id, closing_date, manager_id, total_approved_sales, total_expenses, net_balance, cash_total, card_total, online_total, other_sales, cash_in_hand, actual_cash, cash_difference, notes, created_at",
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
      "id, closing_date, total_approved_sales, total_expenses, net_balance, cash_in_hand, actual_cash, cash_difference",
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
    cash_in_hand: number;
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
        cash_total: summary.cashSales,
        card_total: summary.cardSales,
        online_total: summary.onlineSales,
        other_sales: summary.otherSales,
        cash_in_hand: summary.cashInHand,
        actual_cash: summary.actualCash,
        cash_difference: summary.cashDifference,
        notes: input.notes,
      },
      { onConflict: "closing_date" },
    )
    .select(
      "id, closing_date, manager_id, total_approved_sales, total_expenses, net_balance, cash_total, card_total, online_total, other_sales, cash_in_hand, actual_cash, cash_difference, notes, created_at",
    )
    .maybeSingle();
}

export function buildDailyClosingActivitySnapshot(
  closing: DailyClosingRecord | null,
): DailyClosingActivitySnapshot | null {
  if (!closing) {
    return null;
  }

  return {
    id: closing.id,
    closing_date: closing.closing_date,
    manager_id: closing.manager_id,
    total_approved_sales: Number(closing.total_approved_sales),
    total_expenses: Number(closing.total_expenses),
    net_balance: Number(closing.net_balance),
    cash_total: Number(closing.cash_total),
    card_total: Number(closing.card_total),
    online_total: Number(closing.online_total),
    other_sales: Number(closing.other_sales),
    cash_in_hand: Number(closing.cash_in_hand),
    actual_cash: Number(closing.actual_cash),
    cash_difference: Number(closing.cash_difference),
    notes: closing.notes,
    created_at: closing.created_at,
  };
}
