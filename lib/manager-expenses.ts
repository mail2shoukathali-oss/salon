import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ExpenseRow = {
  id: string;
  manager_id: string;
  title: string;
  category: string;
  amount: number;
  payment_method: "cash" | "card" | "online" | "other";
  expense_date: string;
  notes: string | null;
};

export type ExpenseDetailRow = ExpenseRow & {
  created_at: string;
};

export type ExpenseActivitySnapshot = {
  id: string;
  manager_id: string;
  title: string;
  category: string;
  amount: number;
  payment_method: "cash" | "card" | "online" | "other";
  expense_date: string;
  notes: string | null;
};

export function buildExpenseActivitySnapshot(
  expense: Pick<
    ExpenseDetailRow,
    "id" | "manager_id" | "title" | "category" | "amount" | "payment_method" | "expense_date" | "notes"
  >,
): ExpenseActivitySnapshot {
  return {
    id: expense.id,
    manager_id: expense.manager_id,
    title: expense.title,
    category: expense.category,
    amount: Number(expense.amount),
    payment_method: expense.payment_method,
    expense_date: expense.expense_date,
    notes: expense.notes ?? null,
  };
}

export async function getManagerExpenses(date?: string) {
  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("expenses")
    .select("id, manager_id, title, category, amount, payment_method, expense_date, notes")
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

export async function getManagerExpenseById(expenseId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("expenses")
    .select(
      "id, manager_id, title, category, amount, payment_method, expense_date, notes, created_at",
    )
    .eq("id", expenseId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as ExpenseDetailRow | null;
}

export async function updateManagerExpense(
  expenseId: string,
  input: {
    title: string;
    category: string;
    amount: number;
    paymentMethod: "cash" | "card" | "online" | "other";
    expenseDate: string;
    notes: string | null;
  },
) {
  const supabase = await createSupabaseServerClient();
  return supabase
    .from("expenses")
    .update({
      title: input.title,
      category: input.category,
      amount: input.amount,
      payment_method: input.paymentMethod,
      expense_date: input.expenseDate,
      notes: input.notes,
    })
    .eq("id", expenseId);
}

export async function deleteManagerExpense(expenseId: string) {
  const supabase = await createSupabaseServerClient();
  return supabase
    .from("expenses")
    .delete()
    .eq("id", expenseId)
    .select("id")
    .maybeSingle();
}
