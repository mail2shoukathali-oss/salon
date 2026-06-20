import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getManagerTodayDateString } from "@/lib/manager-closing";

type ProfileRow = {
  id: string;
  full_name: string | null;
  role: "owner" | "manager" | "staff";
};

type ServiceEntryRow = {
  staff_id: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
};

export type ManagerStaffMonthlyStaffRow = {
  staff_id: string;
  staff_name: string | null;
  approvedSalesTotal: number;
  approvedEntriesCount: number;
  pendingEntriesCount: number;
  rejectedEntriesCount: number;
  totalEntriesCount: number;
};

export type ManagerStaffMonthlySummary = {
  totalApprovedSales: number;
  approvedEntriesCount: number;
  pendingEntriesCount: number;
  rejectedEntriesCount: number;
  totalEntriesCount: number;
  topStaffName: string | null;
  topStaffApprovedSales: number;
};

export type ManagerStaffMonthlyReport = {
  month: string;
  monthLabel: string;
  staffRows: ManagerStaffMonthlyStaffRow[];
  summary: ManagerStaffMonthlySummary;
};

export function isMonthString(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}$/.test(value));
}

export function formatReportMonthLabel(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

export function getCurrentReportMonthString() {
  return getManagerTodayDateString().slice(0, 7);
}

function getMonthRange(monthString: string) {
  const [year, month] = monthString.split("-").map(Number);
  const start = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-01`;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextStart = `${String(nextYear).padStart(4, "0")}-${String(nextMonth).padStart(2, "0")}-01`;
  return { start, nextStart };
}

export async function getManagerStaffMonthlyReport(month: string) {
  const supabase = await createSupabaseServerClient();
  const { start, nextStart } = getMonthRange(month);

  const [{ data: entryRows, error: entryError }, { data: profileRows, error: profileError }] =
    await Promise.all([
      supabase
        .from("service_entries")
        .select("staff_id, amount, status")
        .gte("service_date", start)
        .lt("service_date", nextStart),
      supabase.from("profiles").select("id, full_name, role"),
    ]);

  if (entryError) {
    throw entryError;
  }

  if (profileError) {
    throw profileError;
  }

  const profiles = (profileRows ?? []) as ProfileRow[];
  const profileMap = new Map(
    profiles.map((profile) => [
      profile.id,
      { full_name: profile.full_name, role: profile.role },
    ] as const),
  );

  const staffMap = new Map<string, ManagerStaffMonthlyStaffRow>();
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
    const profile = profileMap.get(entry.staff_id);
    if (profile?.role === "owner") {
      continue;
    }

    const amount = Number(entry.amount);
    const current = staffMap.get(entry.staff_id) ?? {
      staff_id: entry.staff_id,
      staff_name: profile?.full_name ?? null,
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
    month,
    monthLabel: formatReportMonthLabel(month),
    staffRows,
    summary,
  } satisfies ManagerStaffMonthlyReport;
}
