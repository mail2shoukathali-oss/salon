import { createSupabaseServerClient } from "@/lib/supabase/server";

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
  selectedDate: string;
  selectedMonth: string;
  selectedMonthLabel: string;
  selectedDayApprovedSales: number;
  selectedDayExpenses: number;
  selectedDayNetBalance: number;
  pendingServiceEntriesCount: number;
  selectedMonthApprovedSales: number;
  selectedMonthExpenses: number;
  selectedDayClosingStatus: "Closed" | "Not closed";
  recentClosings: OwnerDashboardClosing[];
  topStaffThisMonth: OwnerDashboardTopStaff[];
};

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function getMonthDateRange(monthString: string) {
  const [year, month] = monthString.split("-").map(Number);
  const start = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-01`;
  const nextStart = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
  return { start, nextStart };
}

function formatMonthLabel(monthString: string) {
  const [year, month] = monthString.split("-").map(Number);
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export async function getOwnerDashboardData(input: {
  selectedDate: string;
  selectedMonth: string;
}): Promise<OwnerDashboardData> {
  const supabase = await createSupabaseServerClient();
  const { start: monthStart, nextStart: nextMonthStart } = getMonthDateRange(
    input.selectedMonth,
  );

  const [
    { data: selectedDayApprovedEntries, error: selectedDayApprovedEntriesError },
    { data: selectedDayExpenses, error: selectedDayExpensesError },
    { count: pendingServiceEntriesCount, error: pendingCountError },
    { data: monthApprovedEntries, error: monthApprovedEntriesError },
    { data: monthExpenses, error: monthExpensesError },
    { data: recentClosingRows, error: recentClosingsError },
    { data: selectedDayClosingRow, error: selectedDayClosingError },
    { data: profileRows, error: profileRowsError },
  ] = await Promise.all([
    supabase
      .from("service_entries")
      .select("amount")
      .eq("service_date", input.selectedDate)
      .eq("status", "approved"),
    supabase
      .from("expenses")
      .select("amount")
      .eq("expense_date", input.selectedDate),
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
      .eq("closing_date", input.selectedDate)
      .maybeSingle(),
    supabase.from("profiles").select("id, full_name"),
  ]);

  if (selectedDayApprovedEntriesError) throw selectedDayApprovedEntriesError;
  if (selectedDayExpensesError) throw selectedDayExpensesError;
  if (pendingCountError) throw pendingCountError;
  if (monthApprovedEntriesError) throw monthApprovedEntriesError;
  if (monthExpensesError) throw monthExpensesError;
  if (recentClosingsError) throw recentClosingsError;
  if (selectedDayClosingError) throw selectedDayClosingError;
  if (profileRowsError) throw profileRowsError;

  const selectedDayApprovedSales = sum(
    ((selectedDayApprovedEntries ?? []) as ApprovedEntryRow[]).map((entry) =>
      Number(entry.amount),
    ),
  );
  const selectedDayExpensesTotal = sum(
    ((selectedDayExpenses ?? []) as ExpenseRow[]).map((expense) =>
      Number(expense.amount),
    ),
  );
  const selectedMonthApprovedSales = sum(
    ((monthApprovedEntries ?? []) as ApprovedEntryRow[]).map((entry) =>
      Number(entry.amount),
    ),
  );
  const selectedMonthExpenses = sum(
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
    selectedDate: input.selectedDate,
    selectedMonth: input.selectedMonth,
    selectedMonthLabel: formatMonthLabel(input.selectedMonth),
    selectedDayApprovedSales,
    selectedDayExpenses: selectedDayExpensesTotal,
    selectedDayNetBalance: selectedDayApprovedSales - selectedDayExpensesTotal,
    pendingServiceEntriesCount: pendingServiceEntriesCount ?? 0,
    selectedMonthApprovedSales,
    selectedMonthExpenses,
    selectedDayClosingStatus: selectedDayClosingRow ? "Closed" : "Not closed",
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
