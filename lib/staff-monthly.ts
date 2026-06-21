import { createSupabaseServerClient } from "@/lib/supabase/server";

type StaffMonthlyEntryRow = {
  id: string;
  service_name: string;
  amount: number;
  payment_method: "cash" | "card" | "online" | "other";
  status: "pending" | "approved" | "rejected";
  service_date: string;
};

export type StaffMonthlyEntry = StaffMonthlyEntryRow;

export type StaffMonthlySummary = {
  approvedSalesTotal: number;
  approvedEntriesCount: number;
  pendingEntriesCount: number;
  rejectedEntriesCount: number;
  totalEntriesCount: number;
  commissionPercentage: number;
  estimatedCommissionAmount: number;
};

export type StaffMonthlyData = {
  month: string;
  monthLabel: string;
  entries: StaffMonthlyEntry[];
  summary: StaffMonthlySummary;
};

export function getCurrentMonthString() {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dubai",
  }).format(new Date());

  return today.slice(0, 7);
}

export function isMonthString(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}$/.test(value));
}

export function formatMonthLabel(monthString: string) {
  const [year, month] = monthString.split("-").map(Number);
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function getMonthRange(monthString: string) {
  const [year, month] = monthString.split("-").map(Number);
  const start = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-01`;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextStart = `${String(nextYear).padStart(4, "0")}-${String(nextMonth).padStart(2, "0")}-01`;
  return { start, nextStart };
}

export async function getStaffMonthlyData(
  staffId: string,
  commissionPercentage: number,
  month: string,
): Promise<StaffMonthlyData> {
  const supabase = await createSupabaseServerClient();
  const { start, nextStart } = getMonthRange(month);

  const { data, error } = await supabase
    .from("service_entries")
    .select("id, service_name, amount, payment_method, status, service_date")
    .eq("staff_id", staffId)
    .gte("service_date", start)
    .lt("service_date", nextStart)
    .order("service_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const entries = (data ?? []) as StaffMonthlyEntry[];

  const summary = entries.reduce<StaffMonthlySummary>(
    (acc, entry) => {
      const amount = Number(entry.amount);
      acc.totalEntriesCount += 1;

      if (entry.status === "approved") {
        acc.approvedEntriesCount += 1;
        acc.approvedSalesTotal += amount;
      }

      if (entry.status === "pending") {
        acc.pendingEntriesCount += 1;
      }

      if (entry.status === "rejected") {
        acc.rejectedEntriesCount += 1;
      }

      return acc;
    },
    {
      approvedSalesTotal: 0,
      approvedEntriesCount: 0,
      pendingEntriesCount: 0,
      rejectedEntriesCount: 0,
      totalEntriesCount: 0,
      commissionPercentage,
      estimatedCommissionAmount: 0,
    },
  );

  summary.estimatedCommissionAmount =
    summary.approvedSalesTotal * (commissionPercentage / 100);

  return {
    month,
    monthLabel: formatMonthLabel(month),
    entries,
    summary,
  };
}
