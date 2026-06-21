import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppShell } from "@/components/AppShell";
import { PayoutAdjustmentsForm, type PayoutAdjustmentsFormState } from "@/components/PayoutAdjustmentsForm";
import { requireOwnerAccess, requireOwnerOrManagerAccess } from "@/lib/auth/access";
import { recordActivityLog } from "@/lib/activity-log";
import {
  formatMonthLabel,
  generateMonthlyPayoutsForMonth,
  getMonthlyPayoutMonthData,
  markMonthlyPayoutPaid,
  summarizeMonthlyPayoutRows,
  buildMonthlyPayoutRowSnapshot,
  updateMonthlyPayoutAdjustments,
} from "@/lib/owner-payouts";

function formatMoney(amount: number) {
  return `AED ${amount.toFixed(2)}`;
}

function parseMonthParams(yearParam: string, monthParam: string) {
  const year = Number(yearParam);
  const month = Number(monthParam);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }

  return { year, month };
}

export default async function OwnerPayoutMonthPage({
  params,
}: {
  params: Promise<{ year: string; month: string }>;
}) {
  const { profile } = await requireOwnerOrManagerAccess();
  const { year: yearParam, month: monthParam } = await params;
  const parsed = parseMonthParams(yearParam, monthParam);

  if (!parsed) {
    redirect("/owner/payouts");
  }

  const { year, month } = parsed;
  const monthData = await getMonthlyPayoutMonthData(year, month);
  const isOwner = profile.role === "owner";
  const currentPath = `/owner/payouts/${year}/${String(month).padStart(2, "0")}`;

  async function generateOrUpdatePayouts() {
    "use server";

    const { profile: currentProfile } = await requireOwnerAccess();
    const beforeSummary = summarizeMonthlyPayoutRows(monthData.payouts);
    await generateMonthlyPayoutsForMonth(year, month);
    try {
      const refreshedMonthData = await getMonthlyPayoutMonthData(year, month);
      const afterSummary = summarizeMonthlyPayoutRows(refreshedMonthData.payouts);

      await recordActivityLog({
        actorId: currentProfile.id,
        actorName: currentProfile.full_name || "Unknown user",
        actorRole: currentProfile.role,
        action: "payouts_generated",
        entityType: "monthly_payout",
        entityId: `${year}-${String(month).padStart(2, "0")}`,
        entityLabel: `Monthly payouts - ${year}-${String(month).padStart(2, "0")}`,
        periodYear: year,
        periodMonth: month,
        beforeData: beforeSummary.payout_count > 0 ? beforeSummary : null,
        afterData: afterSummary,
        metadata: afterSummary,
      });
    } catch (error) {
      console.error("Failed to record payout generation activity log.", error);
    }

    revalidatePath("/owner/payouts");
    revalidatePath(currentPath);
    redirect(currentPath);
  }

  async function saveAdjustments(
    payoutId: string,
    _state: PayoutAdjustmentsFormState,
    formData: FormData,
  ): Promise<PayoutAdjustmentsFormState> {
    "use server";

    const { profile: currentProfile } = await requireOwnerAccess();
    const beforeMonthData = await getMonthlyPayoutMonthData(year, month);
    const beforePayout = beforeMonthData.payouts.find(
      (payout) => payout.payout_id === payoutId,
    );

    const deductionsRaw = String(formData.get("deductions") ?? "").trim();
    const advanceRaw = String(formData.get("advance_deduction") ?? "").trim();
    const deductions = Number(deductionsRaw);
    const advanceDeduction = Number(advanceRaw);

    if (deductionsRaw === "" || Number.isNaN(deductions) || deductions < 0) {
      return { error: "Deductions must be 0 or greater." };
    }

    if (advanceRaw === "" || Number.isNaN(advanceDeduction) || advanceDeduction < 0) {
      return { error: "Advance deduction must be 0 or greater." };
    }

    await updateMonthlyPayoutAdjustments(payoutId, deductions, advanceDeduction);
    try {
      const refreshedMonthData = await getMonthlyPayoutMonthData(year, month);
      const afterPayout = refreshedMonthData.payouts.find(
        (payout) => payout.payout_id === payoutId,
      );

      if (beforePayout && afterPayout) {
        await recordActivityLog({
          actorId: currentProfile.id,
          actorName: currentProfile.full_name || "Unknown user",
          actorRole: currentProfile.role,
          action: "payout_adjusted",
          entityType: "monthly_payout",
          entityId: payoutId,
          entityLabel: afterPayout.staff_name || payoutId,
          periodYear: year,
          periodMonth: month,
          beforeData: buildMonthlyPayoutRowSnapshot(beforePayout, year, month),
          afterData: buildMonthlyPayoutRowSnapshot(afterPayout, year, month),
          metadata: {
            staff_id: afterPayout.staff_id,
            total_approved_sales: afterPayout.total_approved_sales,
            commission_amount: afterPayout.commission_amount,
            deductions: afterPayout.deductions,
            advance_deduction: afterPayout.advance_deduction,
            final_payable: afterPayout.final_payable,
          },
        });
      }
    } catch (error) {
      console.error("Failed to record payout adjustment activity log.", error);
    }

    revalidatePath("/owner/payouts");
    revalidatePath(currentPath);
    redirect(currentPath);
  }

  async function markPaid(payoutId: string) {
    "use server";

    const { profile: currentProfile } = await requireOwnerAccess();
    const beforeMonthData = await getMonthlyPayoutMonthData(year, month);
    const beforePayout = beforeMonthData.payouts.find(
      (payout) => payout.payout_id === payoutId,
    );
    await markMonthlyPayoutPaid(payoutId);
    try {
      const refreshedMonthData = await getMonthlyPayoutMonthData(year, month);
      const afterPayout = refreshedMonthData.payouts.find(
        (payout) => payout.payout_id === payoutId,
      );

      if (beforePayout && afterPayout) {
        await recordActivityLog({
          actorId: currentProfile.id,
          actorName: currentProfile.full_name || "Unknown user",
          actorRole: currentProfile.role,
          action: "payout_marked_paid",
          entityType: "monthly_payout",
          entityId: payoutId,
          entityLabel: afterPayout.staff_name || payoutId,
          periodYear: year,
          periodMonth: month,
          beforeData: buildMonthlyPayoutRowSnapshot(beforePayout, year, month),
          afterData: buildMonthlyPayoutRowSnapshot(afterPayout, year, month),
          metadata: {
            staff_id: afterPayout.staff_id,
            final_payable: afterPayout.final_payable,
          },
        });
      }
    } catch (error) {
      console.error("Failed to record payout payment activity log.", error);
    }

    revalidatePath("/owner/payouts");
    revalidatePath(currentPath);
    redirect(currentPath);
  }

  return (
    <AppShell
      role={profile.role}
      title={formatMonthLabel(year, month)}
      description="Review, adjust, and close monthly commission payouts."
    >
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm leading-6 text-zinc-600">
          Monthly commission is calculated from approved sales only.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={`/owner/payouts/${year}/${String(month).padStart(2, "0")}/print`}
            className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700"
          >
            Print statement
          </Link>
          {isOwner ? (
            <form action={generateOrUpdatePayouts}>
              <button
                type="submit"
                className="w-full rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white sm:w-auto"
              >
                Generate or update payout records
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        {monthData.payouts.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm">
            No staff payout records found for this month.
          </div>
        ) : null}

        {monthData.payouts.map((payout) => (
          <article
            key={payout.staff_id}
            className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-zinc-950">
                  {payout.staff_name || "Unknown staff"}
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  {payout.approved_entries_count} approved entries
                </p>
              </div>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-700">
                {payout.status}
              </span>
            </div>

            <div className="mt-4 grid gap-3 text-sm text-zinc-700 sm:grid-cols-2">
              <div>
                <span className="block text-zinc-500">Total approved sales</span>
                <span className="font-medium">
                  {formatMoney(Number(payout.total_approved_sales))}
                </span>
              </div>
              <div>
                <span className="block text-zinc-500">Commission percentage</span>
                <span className="font-medium">
                  {Number(payout.commission_percentage).toFixed(2)}%
                </span>
              </div>
              <div>
                <span className="block text-zinc-500">Commission amount</span>
                <span className="font-medium">
                  {formatMoney(Number(payout.commission_amount))}
                </span>
              </div>
              <div>
                <span className="block text-zinc-500">Final payable</span>
                <span className="font-medium">
                  {formatMoney(Number(payout.final_payable))}
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm font-medium text-zinc-700">Deductions</p>
                <p className="mt-2 text-lg font-semibold">
                  {formatMoney(Number(payout.deductions))}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Current stored deductions for this payout.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <p className="text-sm font-medium text-zinc-700">Advance deduction</p>
                <p className="mt-2 text-lg font-semibold">
                  {formatMoney(Number(payout.advance_deduction))}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Current stored advance deduction for this payout.
                </p>
              </div>
            </div>

            {isOwner && payout.payout_id ? (
              <div className="mt-4 grid gap-4">
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <PayoutAdjustmentsForm
                    action={saveAdjustments.bind(null, payout.payout_id)}
                    defaultDeductions={String(payout.deductions)}
                    defaultAdvanceDeduction={String(payout.advance_deduction)}
                  />
                </div>

                <form action={markPaid.bind(null, payout.payout_id)}>
                  <button
                    type="submit"
                    className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700"
                  >
                    Mark paid
                  </button>
                </form>
              </div>
            ) : isOwner ? (
              <div className="mt-4 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
                Generate payout records to enable editing and payment actions.
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </AppShell>
  );
}
