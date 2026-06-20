import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppShell } from "@/components/AppShell";
import { DailyClosingForm, type DailyClosingFormState } from "@/components/DailyClosingForm";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { requireManagerAccess } from "@/lib/auth/access";
import {
  calculateManagerClosingSummary,
  getManagerClosingSnapshot,
  saveManagerDailyClosing,
} from "@/lib/manager-closing";

function formatMoney(amount: number) {
  return `AED ${amount.toFixed(2)}`;
}

export default async function ManagerClosingDetailPage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const { user, profile } = await getCurrentUserProfile();

  if (!user || !profile) {
    redirect("/login");
  }

  if (profile.role === "staff") {
    redirect("/staff/today");
  }

  const snapshot = await getManagerClosingSnapshot(date);
  const summary = calculateManagerClosingSummary({
    entries: snapshot.entries,
    expenses: snapshot.expenses,
    actualCash: snapshot.existingClosing?.actual_cash ?? 0,
  });

  async function closeDay(
    _state: DailyClosingFormState,
    formData: FormData,
  ): Promise<DailyClosingFormState> {
    "use server";

    const { user: currentUser, profile: currentProfile } =
      await requireManagerAccess();

    if (!currentUser || !currentProfile) {
      redirect("/login");
    }

    const actualCashRaw = String(formData.get("actual_cash") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();

    const actualCash = Number(actualCashRaw);
    if (actualCashRaw === "" || Number.isNaN(actualCash) || actualCash < 0) {
      return { error: "Actual cash must be 0 or greater." };
    }

    const { error } = await saveManagerDailyClosing({
      date,
      managerId: currentUser.id,
      actualCash,
      notes: notes || null,
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/manager/closing");
    revalidatePath(`/manager/closing/${date}`);
    redirect("/manager/closing");
  }

  return (
    <AppShell
      role={profile.role}
      title={`Closing ${date}`}
      description="Review approved sales and expenses before saving the daily close."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Approved sales</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {formatMoney(summary.totalApprovedSales)}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Expenses</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {formatMoney(summary.totalExpenses)}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Net balance</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {formatMoney(summary.netBalance)}
          </p>
        </article>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Cash total</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {formatMoney(summary.cashTotal)}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Card total</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {formatMoney(summary.cardTotal)}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Online total</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {formatMoney(summary.onlineTotal)}
          </p>
        </article>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Cash expenses</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {formatMoney(summary.cashExpenseTotal)}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Expected cash</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {formatMoney(summary.expectedCash)}
          </p>
        </article>
      </div>

      <div className="mt-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm leading-6 text-zinc-600">
          Daily closing does not calculate or deduct commission.
        </p>
        <div className="mt-5">
          <DailyClosingForm
            action={closeDay}
            submitLabel="Save closing"
            defaultActualCash={String(snapshot.existingClosing?.actual_cash ?? 0)}
            defaultNotes={snapshot.existingClosing?.notes ?? ""}
          />
        </div>
      </div>
    </AppShell>
  );
}
