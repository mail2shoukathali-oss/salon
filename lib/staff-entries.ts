export type StaffServiceEntry = {
  id: string;
  service_name: string;
  amount: number;
  payment_method: "cash" | "card" | "online" | "other";
  customer_name: string | null;
  status: "pending" | "approved" | "rejected";
  service_date: string;
};

export function getTodayDateString() {
  return new Date().toISOString().slice(0, 10);
}
