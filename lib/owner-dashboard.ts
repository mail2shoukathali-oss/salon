import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getManagerTodayDateString } from "@/lib/manager-closing";

type ApprovedEntryRow = {
  staff_id: string;
  amount: number;
};

type ExpenseRow = {
  amount: number;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
};

type DailyClosingRow = {
  id: string;
  closing_date: string;
  total_approved_sales: number;
  total_expenses: number;
  net_balance: number;
  cash_difference: number;
};

export type OwnerDashboardTopStaff = {
  staff_id: string;
  staff_name: string | null;
  total_approved_sales: number;
  approved_entries_count: number;
};

export type OwnerDashboardClosing = {
  id: string;
  closing_date: string;
  total_approved_sales: number;
  total_expenses: number;
  net_balance: number;
  cash_difference: number;
};

export type OwnerDashboardData = {
  todayDate: string;
  todayApprovedSales: number;
  todayExpenses: number;
  todayNetBalance: number;
  pendingServiceEntriesCount: number;
  currentMonthApprovedSales: number;
  currentMonthExpenses: number;
  todayClosingStatus: "Closed" | "Not closed";
  recentClosings: OwnerDashboardClosing[];
  topStaffThisMonth: OwnerDashboardTopStaff[];
};

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function getMonthDateRange(dateString: string) {
  const [year, month] = dateString.split("-").map(Number);
  const start = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-01`;
  const nextStart = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
  return { start, nextStart };
}

export async function getOwnerDashboardData(): Promise<OwnerDashboardData> {
  const supabase = await createSupabaseServerClient();
  const todayDate = getManagerTodayDateString();
  const { start: monthStart, nextStart: nextMonthStart } = getMonthDateRange(
    todayDate,
  );

  const [
    { data: todayApprovedEntries, error: todayApprovedEntriesError },
    { data: todayExpenses, error: todayExpensesError },
    { count: pendingServiceEntriesCount, error: pendingCountError },
    { data: monthApprovedEntries, error: monthApprovedEntriesError },
    { data: monthExpenses, error: monthExpensesError },
    { data: recentClosingRows, error: recentClosingsError },
    { data: todayClosingRow, error: todayClosingError },
    { data: profileRows, error: profileRowsError },
  ] = await Promise.all([
    supabase
      .from("service_entries")
      .select("amount")
      .eq("service_date", todayDate)
      .eq("status", "approved"),
    supabase.from("expenses").select("amount").eq("expense_date", todayDate),
    supabase
      .from("service_entries")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("service_entries")
      .select("staff_id, amount")
      .eq("status", "approved")
      .gte("service_date", monthStart)
      .lt("service_date", nextMonthStart),
    supabase
      .from("expenses")
      .select("amount")
      .gte("expense_date", monthStart)
      .lt("expense_date", nextMonthStart),
    supabase
      .from("daily_closings")
      .select(
        "id, closing_date, total_approved_sales, total_expenses, net_balance, cash_difference",
      )
      .order("closing_date", { ascending: false })
      .limit(5),
    supabase
      .from("daily_closings")
      .select(
        "id, closing_date, total_approved_sales, total_expenses, net_balance, cash_difference",
      )
      .eq("closing_date", todayDate)
      .maybeSingle(),
    supabase.from("profiles").select("id, full_name"),
  ]);

  if (todayApprovedEntriesError) throw todayApprovedEntriesError;
  if (todayExpensesError) throw todayExpensesError;
  if (pendingCountError) throw pendingCountError;
  if (monthApprovedEntriesError) throw monthApprovedEntriesError;
  if (monthExpensesError) throw monthExpensesError;
  if (recentClosingsError) throw recentClosingsError;
  if (todayClosingError) throw todayClosingError;
  if (profileRowsError) throw profileRowsError;

  const todayApprovedSales = sum(
    ((todayApprovedEntries ?? []) as ApprovedEntryRow[]).map((entry) =>
      Number(entry.amount),
    ),
  );
  const todayExpensesTotal = sum(
    ((todayExpenses ?? []) as ExpenseRow[]).map((expense) =>
      Number(expense.amount),
    ),
  );
  const currentMonthApprovedSales = sum(
    ((monthApprovedEntries ?? []) as ApprovedEntryRow[]).map((entry) =>
      Number(entry.amount),
    ),
  );
  const currentMonthExpenses = sum(
    ((monthExpenses ?? []) as ExpenseRow[]).map((expense) => Number(expense.amount)),
  );

  const profiles = (profileRows ?? []) as ProfileRow[];
  const profileMap = new Map(
    profiles.map((profile) => [profile.id, profile.full_name] as const),
  );

  const staffStats = new Map<
    string,
    { total_approved_sales: number; approved_entries_count: number }
  >();

  for (const entry of (monthApprovedEntries ?? []) as ApprovedEntryRow[]) {
    const existing = staffStats.get(entry.staff_id) ?? {
      total_approved_sales: 0,
      approved_entries_count: 0,
    };

    existing.total_approved_sales += Number(entry.amount);
    existing.approved_entries_count += 1;
    staffStats.set(entry.staff_id, existing);
  }

  const topStaffThisMonth = Array.from(staffStats.entries())
    .map(([staffId, stats]) => ({
      staff_id: staffId,
      staff_name: profileMap.get(staffId) ?? null,
      total_approved_sales: stats.total_approved_sales,
      approved_entries_count: stats.approved_entries_count,
    }))
    .sort((a, b) => b.total_approved_sales - a.total_approved_sales)
    .slice(0, 5);

  return {
    todayDate,
    todayApprovedSales,
    todayExpenses: todayExpensesTotal,
    todayNetBalance: todayApprovedSales - todayExpensesTotal,
    pendingServiceEntriesCount: pendingServiceEntriesCount ?? 0,
    currentMonthApprovedSales,
    currentMonthExpenses,
    todayClosingStatus: todayClosingRow ? "Closed" : "Not closed",
    recentClosings: ((recentClosingRows ?? []) as DailyClosingRow[]).map((row) => ({
      id: row.id,
      closing_date: row.closing_date,
      total_approved_sales: Number(row.total_approved_sales),
      total_expenses: Number(row.total_expenses),
      net_balance: Number(row.net_balance),
      cash_difference: Number(row.cash_difference),
    })),
    topStaffThisMonth,
  };
}
