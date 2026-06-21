import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ServiceEntryPaymentMethod } from "@/components/ServiceEntryForm";

export type StaffPendingEntry = {
  id: string;
  staff_id: string;
  service_id: string | null;
  service_name: string;
  amount: number;
  payment_method: ServiceEntryPaymentMethod;
  customer_name: string | null;
  customer_phone: string | null;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
  service_date: string;
  created_at: string;
};

export type StaffPendingEntryUpdateInput = {
  service_id: string;
  service_name: string;
  amount: number;
  payment_method: ServiceEntryPaymentMethod;
  customer_name: string | null;
  customer_phone: string | null;
  notes: string | null;
};

export async function getStaffPendingEntryById(entryId: string, staffId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("service_entries")
    .select(
      "id, staff_id, service_id, service_name, amount, payment_method, customer_name, customer_phone, notes, status, service_date, created_at",
    )
    .eq("id", entryId)
    .eq("staff_id", staffId)
    .eq("status", "pending")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as StaffPendingEntry | null;
}

export async function updateStaffPendingEntry(
  entryId: string,
  staffId: string,
  input: StaffPendingEntryUpdateInput,
) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("service_entries")
    .update({
      service_id: input.service_id,
      service_name: input.service_name,
      amount: input.amount,
      payment_method: input.payment_method,
      customer_name: input.customer_name,
      customer_phone: input.customer_phone,
      notes: input.notes,
    })
    .eq("id", entryId)
    .eq("staff_id", staffId)
    .eq("status", "pending")
    .select(
      "id, staff_id, service_id, service_name, amount, payment_method, customer_name, customer_phone, notes, status, service_date, created_at",
    )
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  if (!data) {
    return {
      data: null,
      error: new Error("Pending entry could not be updated."),
    };
  }

  return { data: data as StaffPendingEntry, error: null };
}

export async function deleteStaffPendingEntry(entryId: string, staffId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("service_entries")
    .delete()
    .select("id")
    .eq("id", entryId)
    .eq("staff_id", staffId)
    .eq("status", "pending");

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error("No pending entry was deleted.");
  }

  return data;
}
