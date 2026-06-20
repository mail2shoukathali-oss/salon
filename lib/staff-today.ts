import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTodayDateString } from "@/lib/staff-entries";

export type StaffTodayEntry = {
  id: string;
  service_name: string;
  amount: number;
  payment_method: "cash" | "card" | "online";
  customer_name: string | null;
  customer_phone: string | null;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  service_date: string;
  created_at: string;
};

export type StaffTodaySummary = {
  todayTotalValue: number;
  approvedValue: number;
  pendingValue: number;
  rejectedCount: number;
  totalEntriesCount: number;
};

export type StaffTodayData = {
  entries: StaffTodayEntry[];
  summary: StaffTodaySummary;
};

export function formatEntryDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export async function getStaffTodayData(staffId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("service_entries")
    .select(
      "id, service_name, amount, payment_method, customer_name, customer_phone, notes, status, service_date, created_at",
    )
    .eq("staff_id", staffId)
    .eq("service_date", getTodayDateString())
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const entries = (data ?? []) as StaffTodayEntry[];
  const summary = entries.reduce<StaffTodaySummary>(
    (acc, entry) => {
      const amount = Number(entry.amount);
      acc.todayTotalValue += amount;
      acc.totalEntriesCount += 1;

      if (entry.status === "approved") {
        acc.approvedValue += amount;
      }

      if (entry.status === "pending") {
        acc.pendingValue += amount;
      }

      if (entry.status === "rejected") {
        acc.rejectedCount += 1;
      }

      return acc;
    },
    {
      todayTotalValue: 0,
      approvedValue: 0,
      pendingValue: 0,
      rejectedCount: 0,
      totalEntriesCount: 0,
    },
  );

  return { entries, summary } satisfies StaffTodayData;
}
