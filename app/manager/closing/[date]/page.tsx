import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppShell } from "@/components/AppShell";
import { DailyClosingForm, type DailyClosingFormState } from "@/components/DailyClosingForm";
import Link from "next/link";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { requireManagerAccess } from "@/lib/auth/access";
import { recordActivityLog } from "@/lib/activity-log";
import {
  buildDailyClosingActivitySnapshot,
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

    const previousClosing = buildDailyClosingActivitySnapshot(snapshot.existingClosing);

    const { data, error } = await saveManagerDailyClosing({
      date,
      managerId: currentUser.id,
      actualCash,
      notes: notes || null,
    });

    if (error) {
      return { error: error.message };
    }

    const savedClosing = data
      ? {
          id: data.id,
          closing_date: data.closing_date,
          manager_id: data.manager_id,
          total_approved_sales: Number(data.total_approved_sales),
          total_expenses: Number(data.total_expenses),
          net_balance: Number(data.net_balance),
          cash_total: Number(data.cash_total),
          card_total: Number(data.card_total),
          online_total: Number(data.online_total),
          other_sales: Number(data.other_sales),
          cash_in_hand: Number(data.cash_in_hand),
          actual_cash: Number(data.actual_cash),
          cash_difference: Number(data.cash_difference),
          notes: data.notes,
          created_at: data.created_at,
        }
      : null;

    await recordActivityLog({
      actorId: currentProfile.id,
      actorName: currentProfile.full_name || "Unknown user",
      actorRole: currentProfile.role,
      action: "daily_closing_saved",
      entityType: "daily_closing",
      entityId: savedClosing?.id ?? date,
      entityLabel: `Daily closing - ${date}`,
      businessDate: date,
      beforeData: previousClosing,
      afterData: savedClosing,
      metadata: {
        total_approved_sales: summary.totalApprovedSales,
        total_expenses: summary.totalExpenses,
        net_balance: summary.netBalance,
        cash_sales: summary.cashSales,
        card_sales: summary.cardSales,
        online_sales: summary.onlineSales,
        other_sales: summary.otherSales,
        cash_in_hand: summary.cashInHand,
        actual_cash: summary.actualCash,
        cash_difference: summary.cashDifference,
      },
    });

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
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-zinc-600">
          Daily closing does not calculate or deduct commission.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/manager/closing/${date}/print`}
            className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700"
          >
            Print report
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Cash sales</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {formatMoney(summary.cashSales)}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Card sales</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {formatMoney(summary.cardSales)}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Online sales</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {formatMoney(summary.onlineSales)}
          </p>
        </article>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Other sales</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {formatMoney(summary.otherSales)}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Total approved sales</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {formatMoney(summary.totalApprovedSales)}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Total expenses</p>
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
          <p className="text-sm font-medium text-zinc-500">Cash in hand</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {formatMoney(summary.cashInHand)}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Actual cash</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {formatMoney(summary.actualCash)}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Cash difference</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {formatMoney(summary.cashDifference)}
          </p>
        </article>
      </div>

      <div className="mt-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
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
