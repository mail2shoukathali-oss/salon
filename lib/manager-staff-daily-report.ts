import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getManagerTodayDateString } from "@/lib/manager-closing";

type ProfileRow = {
  id: string;
  full_name: string | null;
};

type ServiceEntryRow = {
  staff_id: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
};

export type ManagerStaffDailyStaffRow = {
  staff_id: string;
  staff_name: string | null;
  approvedSalesTotal: number;
  approvedEntriesCount: number;
  pendingEntriesCount: number;
  rejectedEntriesCount: number;
  totalEntriesCount: number;
};

export type ManagerStaffDailySummary = {
  totalApprovedSales: number;
  approvedEntriesCount: number;
  pendingEntriesCount: number;
  rejectedEntriesCount: number;
  totalEntriesCount: number;
  topStaffName: string | null;
  topStaffApprovedSales: number;
};

export type ManagerStaffDailyReport = {
  date: string;
  staffRows: ManagerStaffDailyStaffRow[];
  summary: ManagerStaffDailySummary;
};

export function isIsoDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export function formatReportDateLabel(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function getCurrentReportDateString() {
  return getManagerTodayDateString();
}

export async function getManagerStaffDailyReport(date: string) {
  const supabase = await createSupabaseServerClient();
  const [{ data: entryRows, error: entryError }, { data: profileRows, error: profileError }] =
    await Promise.all([
      supabase
        .from("service_entries")
        .select("staff_id, amount, status")
        .eq("service_date", date),
      supabase.from("profiles").select("id, full_name"),
    ]);

  if (entryError) {
    throw entryError;
  }

  if (profileError) {
    throw profileError;
  }

  const profiles = (profileRows ?? []) as ProfileRow[];
  const profileMap = new Map(
    profiles.map((profile) => [profile.id, profile.full_name] as const),
  );

  const staffMap = new Map<string, ManagerStaffDailyStaffRow>();
  const summary = {
    totalApprovedSales: 0,
    approvedEntriesCount: 0,
    pendingEntriesCount: 0,
    rejectedEntriesCount: 0,
    totalEntriesCount: 0,
    topStaffName: null as string | null,
    topStaffApprovedSales: 0,
  };

  for (const entry of (entryRows ?? []) as ServiceEntryRow[]) {
    const amount = Number(entry.amount);
    const current = staffMap.get(entry.staff_id) ?? {
      staff_id: entry.staff_id,
      staff_name: profileMap.get(entry.staff_id) ?? null,
      approvedSalesTotal: 0,
      approvedEntriesCount: 0,
      pendingEntriesCount: 0,
      rejectedEntriesCount: 0,
      totalEntriesCount: 0,
    };

    current.totalEntriesCount += 1;
    summary.totalEntriesCount += 1;

    if (entry.status === "approved") {
      current.approvedSalesTotal += amount;
      current.approvedEntriesCount += 1;
      summary.totalApprovedSales += amount;
      summary.approvedEntriesCount += 1;
    }

    if (entry.status === "pending") {
      current.pendingEntriesCount += 1;
      summary.pendingEntriesCount += 1;
    }

    if (entry.status === "rejected") {
      current.rejectedEntriesCount += 1;
      summary.rejectedEntriesCount += 1;
    }

    staffMap.set(entry.staff_id, current);
  }

  const staffRows = Array.from(staffMap.values()).sort((a, b) => {
    if (b.approvedSalesTotal !== a.approvedSalesTotal) {
      return b.approvedSalesTotal - a.approvedSalesTotal;
    }

    return (a.staff_name ?? "").localeCompare(b.staff_name ?? "");
  });

  const topStaff = staffRows[0] ?? null;
  summary.topStaffName = topStaff?.staff_name ?? null;
  summary.topStaffApprovedSales = topStaff?.approvedSalesTotal ?? 0;

  return {
    date,
    staffRows,
    summary,
  } satisfies ManagerStaffDailyReport;
}
