import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppShell } from "@/components/AppShell";
import { ExpenseForm, type ExpenseFormState } from "@/components/ExpenseForm";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { requireManagerAccess } from "@/lib/auth/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ManagerNewExpensePage() {
  const { user, profile } = await getCurrentUserProfile();

  if (!user || !profile) {
    redirect("/login");
  }

  if (profile.role === "staff") {
    redirect("/staff/today");
  }

  async function createExpense(
    _state: ExpenseFormState,
    formData: FormData,
  ): Promise<ExpenseFormState> {
    "use server";

    const { user: currentUser, profile: currentProfile } =
      await requireManagerAccess();

    if (!currentUser || !currentProfile) {
      redirect("/login");
    }

    const title = String(formData.get("title") ?? "").trim();
    const category = String(formData.get("category") ?? "").trim();
    const amountRaw = String(formData.get("amount") ?? "").trim();
    const paymentMethod = String(formData.get("payment_method") ?? "");
    const expenseDate = String(formData.get("expense_date") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();

    if (!title) {
      return { error: "Title is required." };
    }

    if (!category) {
      return { error: "Category is required." };
    }

    const amount = Number(amountRaw);
    if (amountRaw === "" || Number.isNaN(amount) || amount <= 0) {
      return { error: "Amount must be greater than 0." };
    }

    if (!["cash", "card", "online"].includes(paymentMethod)) {
      return { error: "Payment method must be cash, card, or online." };
    }

    if (!expenseDate) {
      return { error: "Expense date is required." };
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("expenses").insert({
      manager_id: currentUser.id,
      title,
      category,
      amount,
      payment_method: paymentMethod,
      expense_date: expenseDate,
      notes: notes || null,
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/manager/expenses");
    redirect("/manager/expenses");
  }

  return (
    <AppShell
      role={profile.role}
      title="Add expense"
      description="Record a salon operating expense."
    >
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm leading-6 text-zinc-600">
          Expense date defaults to today. The logged-in manager becomes the
          manager ID for the record.
        </p>

        <div className="mt-5">
          <ExpenseForm action={createExpense} submitLabel="Save expense" />
        </div>
      </div>
    </AppShell>
  );
}
