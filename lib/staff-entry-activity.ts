import type { ServiceEntryPaymentMethod } from "@/components/ServiceEntryForm";

export type StaffEntryActivitySnapshot = {
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
  created_at: string | null;
};

type StaffEntrySource = {
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
  created_at: string | null;
};

export function buildStaffEntryActivitySnapshot(
  entry: StaffEntrySource,
): StaffEntryActivitySnapshot {
  return {
    id: entry.id,
    staff_id: entry.staff_id,
    service_id: entry.service_id ?? null,
    service_name: entry.service_name,
    amount: Number(entry.amount),
    payment_method: entry.payment_method,
    customer_name: entry.customer_name ?? null,
    customer_phone: entry.customer_phone ?? null,
    notes: entry.notes ?? null,
    status: entry.status,
    service_date: entry.service_date,
    created_at: entry.created_at ?? null,
  };
}
