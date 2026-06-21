import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppShell } from "@/components/AppShell";
import { ExpenseForm, type ExpenseFormState } from "@/components/ExpenseForm";
import { ExpenseDeleteForm, type ExpenseDeleteFormState } from "@/components/ExpenseDeleteForm";
import { recordActivityLog } from "@/lib/activity-log";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { requireManagerAccess } from "@/lib/auth/access";
import {
  buildExpenseActivitySnapshot,
  deleteManagerExpense,
  getManagerExpenseById,
  updateManagerExpense,
} from "@/lib/manager-expenses";

function formatMoney(amount: number) {
  return `AED ${amount.toFixed(2)}`;
}

export default async function ManagerExpenseEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, profile } = await getCurrentUserProfile();

  if (!user || !profile) {
    redirect("/login");
  }

  if (profile.role === "staff") {
    redirect("/staff/today");
  }

  const { id } = await params;
  const expense = await getManagerExpenseById(id);
  const expenseRecord = expense as NonNullable<typeof expense>;

  if (!expenseRecord) {
    notFound();
  }

  async function saveExpense(
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

    if (!["cash", "card", "online", "other"].includes(paymentMethod)) {
      return { error: "Payment method must be cash, card, online, or other." };
    }

    if (!expenseDate) {
      return { error: "Expense date is required." };
    }

    const { error } = await updateManagerExpense(id, {
      title,
      category,
      amount,
      paymentMethod: paymentMethod as "cash" | "card" | "online" | "other",
      expenseDate,
      notes: notes || null,
    });

    if (error) {
      return { error: error.message };
    }

    await recordActivityLog({
      actorId: currentProfile.id,
      actorName: currentProfile.full_name || "Unknown user",
      actorRole: currentProfile.role,
      action: "expense_updated",
      entityType: "expense",
      entityId: expenseRecord.id,
      entityLabel: title,
      businessDate: expenseDate,
      beforeData: buildExpenseActivitySnapshot(expenseRecord),
      afterData: {
        id: expenseRecord.id,
        manager_id: expenseRecord.manager_id,
        title,
        category,
        amount,
        payment_method: paymentMethod,
        expense_date: expenseDate,
        notes: notes || null,
      },
      metadata: {
        amount,
        category,
        payment_method: paymentMethod,
      },
    });

    revalidatePath("/manager/expenses");
    revalidatePath("/manager/closing");
    revalidatePath(`/manager/closing/${expenseRecord.expense_date}`);
    revalidatePath(`/manager/closing/${expenseDate}`);
    redirect(`/manager/expenses?date=${expenseDate}`);
  }

  async function deleteExpense(
    _state: ExpenseDeleteFormState,
    _formData: FormData,
  ): Promise<ExpenseDeleteFormState> {
    "use server";
    void _state;
    void _formData;

    const { user: currentUser, profile: currentProfile } =
      await requireManagerAccess();

    if (!currentUser || !currentProfile) {
      redirect("/login");
    }

    const { data, error } = await deleteManagerExpense(id);

    if (error) {
      return { error: error.message };
    }

    if (!data) {
      return { error: "Expense record was not deleted." };
    }

    await recordActivityLog({
      actorId: currentProfile.id,
      actorName: currentProfile.full_name || "Unknown user",
      actorRole: currentProfile.role,
      action: "expense_deleted",
      entityType: "expense",
      entityId: expenseRecord.id,
      entityLabel: expenseRecord.title,
      businessDate: expenseRecord.expense_date,
      beforeData: buildExpenseActivitySnapshot(expenseRecord),
      afterData: null,
      metadata: {
        amount: Number(expenseRecord.amount),
        category: expenseRecord.category,
        payment_method: expenseRecord.payment_method,
      },
    });

    revalidatePath("/manager/expenses");
    revalidatePath("/manager/closing");
    revalidatePath(`/manager/closing/${expenseRecord.expense_date}`);
    redirect(`/manager/expenses?date=${expenseRecord.expense_date}`);
  }

  return (
    <AppShell
      role={profile.role}
      title="Edit expense"
      description="Correct or remove a salon operating expense."
    >
      <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-zinc-600">Expense amount</p>
            <p className="mt-1 text-2xl font-semibold">
              {formatMoney(Number(expenseRecord.amount))}
            </p>
          </div>
          <Link
            href={`/manager/expenses?date=${expenseRecord.expense_date}`}
            className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700"
          >
            Back
          </Link>
        </div>
      </section>

      <section className="mt-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">Edit details</h2>
        <div className="mt-4">
          <ExpenseForm
            action={saveExpense}
            submitLabel="Save changes"
            defaultTitle={expenseRecord.title}
            defaultCategory={expenseRecord.category}
            defaultAmount={String(Number(expenseRecord.amount))}
            defaultPaymentMethod={expenseRecord.payment_method}
            defaultExpenseDate={expenseRecord.expense_date}
            defaultNotes={expenseRecord.notes ?? ""}
          />
        </div>
      </section>

      <section className="mt-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">Delete expense</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Deleting this expense will update any daily closing that includes its
          expense date.
        </p>
        <div className="mt-4">
          <ExpenseDeleteForm action={deleteExpense} submitLabel="Delete expense" />
        </div>
      </section>
    </AppShell>
  );
}
