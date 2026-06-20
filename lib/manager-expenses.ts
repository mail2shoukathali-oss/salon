import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ExpenseRow = {
  id: string;
  title: string;
  category: string;
  amount: number;
  payment_method: "cash" | "card" | "online";
  expense_date: string;
  notes: string | null;
};

export async function getManagerExpenses(date?: string) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("expenses")
    .select("id, title, category, amount, payment_method, expense_date, notes")
    .order("created_at", { ascending: false });

  if (date) {
    query = query.eq("expense_date", date);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const expenses = (data ?? []) as ExpenseRow[];
  const totals = expenses.reduce(
    (acc, expense) => {
      acc.count += 1;
      acc.total += Number(expense.amount);
      return acc;
    },
    { count: 0, total: 0 },
  );

  return { expenses, totals };
}
