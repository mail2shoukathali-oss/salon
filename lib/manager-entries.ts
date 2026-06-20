import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ServiceEntryStatus = "pending" | "approved" | "rejected";
export type ServicePaymentMethod = "cash" | "card" | "online";

export type ManagerServiceEntry = {
  id: string;
  service_date: string;
  service_name: string;
  amount: number;
  payment_method: ServicePaymentMethod;
  customer_name: string | null;
  status: ServiceEntryStatus;
  staff_id: string;
  staff_name: string | null;
};

type ServiceEntryRow = {
  id: string;
  service_date: string;
  service_name: string;
  amount: number;
  payment_method: ServicePaymentMethod;
  customer_name: string | null;
  status: ServiceEntryStatus;
  staff_id: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
};

export async function getManagerEntries(options?: {
  status?: ServiceEntryStatus;
}) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("service_entries")
    .select(
      "id, service_date, service_name, amount, payment_method, customer_name, status, staff_id",
    )
    .order("created_at", { ascending: false });

  if (options?.status) {
    query = query.eq("status", options.status);
  }

  const [{ data: entries, error: entriesError }, { data: profiles, error: profilesError }] =
    await Promise.all([
      query,
      supabase.from("profiles").select("id, full_name"),
    ]);

  if (entriesError) {
    throw entriesError;
  }

  if (profilesError) {
    throw profilesError;
  }

  const profileMap = new Map<string, string | null>(
    (profiles as ProfileRow[] | null | undefined)?.map((profile) => [
      profile.id,
      profile.full_name,
    ]) ?? [],
  );

  const mappedEntries = ((entries as ServiceEntryRow[] | null | undefined) ?? []).map(
    (entry) => ({
      ...entry,
      staff_name: profileMap.get(entry.staff_id) ?? null,
    }),
  );

  const totals = mappedEntries.reduce(
    (acc, entry) => {
      acc.totalEntries += 1;
      if (entry.status === "approved") {
        acc.approvedSalesTotal += Number(entry.amount);
      }
      if (entry.status === "pending") {
        acc.pendingSalesTotal += Number(entry.amount);
      }
      return acc;
    },
    {
      totalEntries: 0,
      approvedSalesTotal: 0,
      pendingSalesTotal: 0,
    },
  );

  return {
    entries: mappedEntries as ManagerServiceEntry[],
    totals,
  };
}

export async function updateServiceEntryStatus(
  entryId: string,
  status: ServiceEntryStatus,
  reviewedBy: string,
) {
  const supabase = await createSupabaseServerClient();
  return supabase
    .from("service_entries")
    .update({
      status,
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", entryId);
}
