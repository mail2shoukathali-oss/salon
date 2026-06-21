import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ServiceEntryStatus = "pending" | "approved" | "rejected";
export type ServicePaymentMethod = "cash" | "card" | "online" | "other";

export type ManagerServiceEntry = {
  id: string;
  service_date: string;
  service_name: string;
  amount: number;
  payment_method: ServicePaymentMethod;
  customer_name: string | null;
  customer_phone?: string | null;
  notes?: string | null;
  status: ServiceEntryStatus;
  staff_id: string;
  staff_name: string | null;
  created_at?: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
};

export type ManagerEntryTotals = {
  totalEntries: number;
  approvedSalesTotal: number;
  pendingSalesTotal: number;
  rejectedCount: number;
};

export type ManagerServiceEntryDetail = {
  id: string;
  service_date: string;
  service_name: string;
  amount: number;
  payment_method: ServicePaymentMethod;
  customer_name: string | null;
  customer_phone: string | null;
  notes: string | null;
  status: ServiceEntryStatus;
  staff_id: string;
  staff_name: string | null;
  reviewed_by: string | null;
  reviewed_by_name: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type ManagerEntryActivitySnapshot = {
  staff_id: string;
  amount: number;
  payment_method: ServicePaymentMethod;
  customer_name: string | null;
  customer_phone: string | null;
  service_name: string;
  service_date: string;
  status: ServiceEntryStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
};

type ServiceEntryRow = {
  id: string;
  service_date: string;
  service_name: string;
  amount: number;
  payment_method: ServicePaymentMethod;
  customer_name: string | null;
  customer_phone?: string | null;
  notes?: string | null;
  status: ServiceEntryStatus;
  staff_id: string;
  created_at?: string;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
};

export async function getManagerEntries(options?: {
  status?: ServiceEntryStatus;
  date?: string;
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

  if (options?.date) {
    query = query.eq("service_date", options.date);
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

  const totals = mappedEntries.reduce<ManagerEntryTotals>(
    (acc, entry) => {
      acc.totalEntries += 1;
      if (entry.status === "approved") {
        acc.approvedSalesTotal += Number(entry.amount);
      }
      if (entry.status === "pending") {
        acc.pendingSalesTotal += Number(entry.amount);
      }
      if (entry.status === "rejected") {
        acc.rejectedCount += 1;
      }
      return acc;
    },
    {
      totalEntries: 0,
      approvedSalesTotal: 0,
      pendingSalesTotal: 0,
      rejectedCount: 0,
    },
  );

  return {
    entries: mappedEntries as ManagerServiceEntry[],
    totals,
  };
}

export async function getManagerEntryById(entryId: string) {
  const supabase = await createSupabaseServerClient();
  const [{ data: entryData, error: entryError }, { data: profiles, error: profileError }] =
    await Promise.all([
      supabase
        .from("service_entries")
        .select(
          "id, service_date, service_name, amount, payment_method, customer_name, customer_phone, notes, status, staff_id, created_at, reviewed_by, reviewed_at",
        )
        .eq("id", entryId)
        .maybeSingle(),
      supabase.from("profiles").select("id, full_name"),
    ]);

  if (entryError) {
    throw entryError;
  }

  if (profileError) {
    throw profileError;
  }

  const profileMap = new Map<string, string | null>(
    (profiles as ProfileRow[] | null | undefined)?.map((profile) => [
      profile.id,
      profile.full_name,
    ]) ?? [],
  );

  const entry = entryData as ServiceEntryRow | null;
  if (!entry) {
    return null;
  }

  const reviewedByName =
    entry.reviewed_by ? profileMap.get(entry.reviewed_by) ?? null : null;

  return {
    id: entry.id,
    service_date: entry.service_date,
    service_name: entry.service_name,
    amount: Number(entry.amount),
    payment_method: entry.payment_method,
    customer_name: entry.customer_name ?? null,
    customer_phone: entry.customer_phone ?? null,
    notes: entry.notes ?? null,
    status: entry.status,
    staff_id: entry.staff_id,
    staff_name: profileMap.get(entry.staff_id) ?? null,
    reviewed_by: entry.reviewed_by ?? null,
    reviewed_by_name: reviewedByName,
    reviewed_at: entry.reviewed_at ?? null,
    created_at: entry.created_at ?? new Date().toISOString(),
  } satisfies ManagerServiceEntryDetail;
}

export function buildManagerEntryActivitySnapshot(
  entry: Pick<
    ManagerServiceEntryDetail,
    | "staff_id"
    | "amount"
    | "payment_method"
    | "customer_name"
    | "customer_phone"
    | "service_name"
    | "service_date"
    | "status"
    | "reviewed_by"
    | "reviewed_at"
    | "notes"
  >,
): ManagerEntryActivitySnapshot {
  return {
    staff_id: entry.staff_id,
    amount: entry.amount,
    payment_method: entry.payment_method,
    customer_name: entry.customer_name,
    customer_phone: entry.customer_phone,
    service_name: entry.service_name,
    service_date: entry.service_date,
    status: entry.status,
    reviewed_by: entry.reviewed_by,
    reviewed_at: entry.reviewed_at,
    notes: entry.notes,
  };
}

export async function approveManagerEntry(entryId: string, reviewedBy: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("service_entries")
    .update({
      status: "approved",
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", entryId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Entry could not be approved because it is no longer pending.");
  }

  return data;
}

function appendRejectionReason(notes: string | null, reason: string) {
  const trimmedReason = reason.trim();
  const baseNotes = notes?.trim();

  if (!baseNotes) {
    return `Rejection reason: ${trimmedReason}`;
  }

  return `${baseNotes}\n\nRejection reason: ${trimmedReason}`;
}

export async function rejectManagerEntry(
  entryId: string,
  reviewedBy: string,
  reason: string,
  existingNotes: string | null,
) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("service_entries")
    .update({
      status: "rejected",
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
      notes: appendRejectionReason(existingNotes, reason),
    })
    .eq("id", entryId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Entry could not be rejected because it is no longer pending.");
  }

  return data;
}
