import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getManagerTodayDateString } from "@/lib/manager-closing";

type ProfileRow = {
  id: string;
  full_name: string | null;
  commission_percentage: number;
  role: "owner" | "manager" | "staff";
};

type ServiceEntryRow = {
  staff_id: string;
  amount: number;
};

type MonthlyPayoutRow = {
  id: string;
  staff_id: string;
  month: number;
  year: number;
  total_approved_sales: number;
  commission_percentage: number;
  commission_amount: number;
  deductions: number;
  advance_deduction: number;
  final_payable: number;
  status: "unpaid" | "paid";
  paid_at: string | null;
  created_at: string;
};

export type MonthlyPayoutListItem = {
  id: string;
  staff_name: string | null;
  month: number;
  year: number;
  total_approved_sales: number;
  commission_amount: number;
  final_payable: number;
  status: "unpaid" | "paid";
  created_at: string;
};

export type MonthlyPayoutStaffSummary = {
  staff_id: string;
  staff_name: string | null;
  commission_percentage: number;
  total_approved_sales: number;
  approved_entries_count: number;
  commission_amount: number;
  deductions: number;
  advance_deduction: number;
  final_payable: number;
  status: "unpaid" | "paid" | "not_generated";
  paid_at: string | null;
  payout_id: string | null;
};

export type MonthlyPayoutMonthData = {
  year: number;
  month: number;
  monthLabel: string;
  payouts: MonthlyPayoutStaffSummary[];
};

export type MonthlyPayoutSummarySnapshot = {
  payout_count: number;
  total_approved_sales: number;
  total_commission_amount: number;
  total_deductions: number;
  total_advance_deduction: number;
  total_final_payable: number;
};

export type MonthlyPayoutRowSnapshot = {
  id: string;
  staff_id: string;
  staff_name: string | null;
  month: number;
  year: number;
  total_approved_sales: number;
  commission_percentage: number;
  commission_amount: number;
  deductions: number;
  advance_deduction: number;
  final_payable: number;
  status: "unpaid" | "paid" | "not_generated";
  paid_at: string | null;
  payout_id: string | null;
};

export function formatMonthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function getCurrentMonthParts() {
  const today = getManagerTodayDateString();
  const [year, month] = today.split("-").map(Number);
  return { year, month };
}

function getMonthRange(year: number, month: number) {
  const start = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-01`;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextStart = `${String(nextYear).padStart(4, "0")}-${String(nextMonth).padStart(2, "0")}-01`;
  return { start, nextStart };
}

function buildMonthlyPayoutSummarySnapshot(
  payouts: Array<{
    total_approved_sales: number;
    commission_amount: number;
    deductions: number;
    advance_deduction: number;
    final_payable: number;
  }>,
): MonthlyPayoutSummarySnapshot {
  return payouts.reduce<MonthlyPayoutSummarySnapshot>(
    (acc, payout) => {
      acc.payout_count += 1;
      acc.total_approved_sales += Number(payout.total_approved_sales);
      acc.total_commission_amount += Number(payout.commission_amount);
      acc.total_deductions += Number(payout.deductions);
      acc.total_advance_deduction += Number(payout.advance_deduction);
      acc.total_final_payable += Number(payout.final_payable);
      return acc;
    },
    {
      payout_count: 0,
      total_approved_sales: 0,
      total_commission_amount: 0,
      total_deductions: 0,
      total_advance_deduction: 0,
      total_final_payable: 0,
    },
  );
}

export function summarizeMonthlyPayoutRows(
  payouts: Array<{
    total_approved_sales: number;
    commission_amount: number;
    deductions: number;
    advance_deduction: number;
    final_payable: number;
  }>,
) {
  return buildMonthlyPayoutSummarySnapshot(payouts);
}

export function buildMonthlyPayoutRowSnapshot(
  payout: MonthlyPayoutStaffSummary,
  year: number,
  month: number,
): MonthlyPayoutRowSnapshot {
  return {
    id: payout.payout_id ?? payout.staff_id,
    staff_id: payout.staff_id,
    staff_name: payout.staff_name,
    month,
    year,
    total_approved_sales: Number(payout.total_approved_sales),
    commission_percentage: Number(payout.commission_percentage),
    commission_amount: Number(payout.commission_amount),
    deductions: Number(payout.deductions),
    advance_deduction: Number(payout.advance_deduction),
    final_payable: Number(payout.final_payable),
    status: payout.status,
    paid_at: payout.paid_at,
    payout_id: payout.payout_id,
  };
}

export async function getMonthlyPayoutsList() {
  const supabase = await createSupabaseServerClient();
  const [{ data: payoutRows, error: payoutsError }, { data: profiles, error: profilesError }] =
    await Promise.all([
      supabase
        .from("monthly_payouts")
        .select(
          "id, staff_id, month, year, total_approved_sales, commission_amount, final_payable, status, created_at",
        )
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name, role"),
    ]);

  if (payoutsError) throw payoutsError;
  if (profilesError) throw profilesError;

  const profileMap = new Map(
    ((profiles ?? []) as ProfileRow[]).map((profile) => [
      profile.id,
      profile,
    ] as const),
  );

  return ((payoutRows ?? []) as MonthlyPayoutRow[])
    .filter((row) => profileMap.get(row.staff_id)?.role !== "owner")
    .map((row) => ({
      id: row.id,
      staff_name: profileMap.get(row.staff_id)?.full_name ?? null,
      month: row.month,
      year: row.year,
      total_approved_sales: Number(row.total_approved_sales),
      commission_amount: Number(row.commission_amount),
      final_payable: Number(row.final_payable),
      status: row.status,
      created_at: row.created_at,
    })) satisfies MonthlyPayoutListItem[];
}

export async function getMonthlyPayoutMonthData(year: number, month: number) {
  const supabase = await createSupabaseServerClient();
  const { start, nextStart } = getMonthRange(year, month);

  const [
    { data: entryRows, error: entryError },
    { data: profileRows, error: profileError },
    { data: existingRows, error: existingError },
  ] = await Promise.all([
    supabase
      .from("service_entries")
      .select("staff_id, amount")
      .eq("status", "approved")
      .gte("service_date", start)
      .lt("service_date", nextStart),
    supabase.from("profiles").select("id, full_name, commission_percentage, role"),
    supabase
      .from("monthly_payouts")
      .select(
        "id, staff_id, month, year, total_approved_sales, commission_percentage, commission_amount, deductions, advance_deduction, final_payable, status, paid_at, created_at",
      )
      .eq("year", year)
      .eq("month", month),
  ]);

  if (entryError) throw entryError;
  if (profileError) throw profileError;
  if (existingError) throw existingError;

  const profileMap = new Map(
    ((profileRows ?? []) as ProfileRow[]).map((profile) => [
      profile.id,
      profile,
    ] as const),
  );

  const existingMap = new Map(
    ((existingRows ?? []) as MonthlyPayoutRow[]).map((row) => [
      row.staff_id,
      row,
    ] as const),
  );

  const staffMap = new Map<
    string,
    { totalApprovedSales: number; approvedEntriesCount: number }
  >();

  for (const entry of (entryRows ?? []) as ServiceEntryRow[]) {
    const profile = profileMap.get(entry.staff_id);
    if (profile?.role === "owner") {
      continue;
    }

    const current = staffMap.get(entry.staff_id) ?? {
      totalApprovedSales: 0,
      approvedEntriesCount: 0,
    };

    current.totalApprovedSales += Number(entry.amount);
    current.approvedEntriesCount += 1;
    staffMap.set(entry.staff_id, current);
  }

  const payouts = Array.from(staffMap.entries())
    .map(([staffId, stats]) => {
      const profile = profileMap.get(staffId);
      if (profile?.role === "owner") {
        return null;
      }
      const existing = existingMap.get(staffId);
      const commissionPercentage = Number(profile?.commission_percentage ?? 0);
      const deductions = Number(existing?.deductions ?? 0);
      const advanceDeduction = Number(existing?.advance_deduction ?? 0);
      const commissionAmount = stats.totalApprovedSales * (commissionPercentage / 100);
      const finalPayable = commissionAmount - deductions - advanceDeduction;

      return {
        staff_id: staffId,
        staff_name: profile?.full_name ?? null,
        commission_percentage: commissionPercentage,
        total_approved_sales: stats.totalApprovedSales,
        approved_entries_count: stats.approvedEntriesCount,
        commission_amount: commissionAmount,
        deductions,
        advance_deduction: advanceDeduction,
        final_payable: finalPayable,
        status: (existing?.status ?? "not_generated") as
          | "unpaid"
          | "paid"
          | "not_generated",
        paid_at: existing?.paid_at ?? null,
        payout_id: existing?.id ?? null,
      };
    })
    .filter((payout): payout is NonNullable<typeof payout> => payout !== null)
    .sort((a, b) => b.total_approved_sales - a.total_approved_sales);

  return {
    year,
    month,
    monthLabel: formatMonthLabel(year, month),
    payouts,
  } satisfies MonthlyPayoutMonthData;
}

export async function generateMonthlyPayoutsForMonth(year: number, month: number) {
  const supabase = await createSupabaseServerClient();
  const monthData = await getMonthlyPayoutMonthData(year, month);

  const rows = monthData.payouts.map((payout) => ({
    staff_id: payout.staff_id,
    month,
    year,
    total_approved_sales: payout.total_approved_sales,
    commission_percentage: payout.commission_percentage,
    commission_amount: payout.commission_amount,
    deductions: payout.deductions,
    advance_deduction: payout.advance_deduction,
    final_payable: payout.final_payable,
    status:
      payout.status === "paid" ? "paid" : ("unpaid" as "unpaid" | "paid"),
    paid_at: payout.paid_at,
    calculated_at: new Date().toISOString(),
  }));

  if (rows.length === 0) {
    return { count: 0 };
  }

  const { error } = await supabase
    .from("monthly_payouts")
    .upsert(rows, { onConflict: "staff_id,month,year" });

  if (error) throw error;

  return { count: rows.length };
}

export async function updateMonthlyPayoutAdjustments(
  payoutId: string,
  deductions: number,
  advanceDeduction: number,
) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("monthly_payouts")
    .select("id, commission_amount, status, paid_at")
    .eq("id", payoutId)
    .maybeSingle();

  if (error) throw error;
  if (!data) throw new Error("Payout record not found.");

  const current = data as Pick<
    MonthlyPayoutRow,
    "commission_amount" | "status" | "paid_at"
  > & { id: string };
  const finalPayable = Number(current.commission_amount) - deductions - advanceDeduction;

  const updateResult = await supabase
    .from("monthly_payouts")
    .update({
      deductions,
      advance_deduction: advanceDeduction,
      final_payable: finalPayable,
      calculated_at: new Date().toISOString(),
      status: current.status,
      paid_at: current.paid_at,
    })
    .eq("id", payoutId);

  if (updateResult.error) throw updateResult.error;
  return updateResult;
}

export async function markMonthlyPayoutPaid(payoutId: string) {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("monthly_payouts")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
    })
    .eq("id", payoutId);

  if (error) throw error;

  return { ok: true };
}
