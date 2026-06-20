import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { requireOwnerOrManagerAccess } from "@/lib/auth/access";
import {
  formatMonthLabel,
  getCurrentMonthParts,
  getMonthlyPayoutsList,
} from "@/lib/owner-payouts";

function formatMoney(amount: number) {
  return `AED ${amount.toFixed(2)}`;
}

export default async function OwnerPayoutsPage() {
  const { profile } = await requireOwnerOrManagerAccess();
  const payouts = await getMonthlyPayoutsList();
  const currentMonth = getCurrentMonthParts();
  const currentMonthPath = `/owner/payouts/${currentMonth.year}/${String(currentMonth.month).padStart(2, "0")}`;

  return (
    <AppShell
      role={profile.role}
      title="Monthly payouts"
      description="Review payout records for month-end commission calculations."
    >
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm text-zinc-600">
          Commission is calculated only in monthly payouts at month end.
        </p>
        <div className="mt-4">
          <Link
            href={currentMonthPath}
            className="inline-flex rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white"
          >
            Open current month
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        {payouts.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm">
            No payout records yet.
          </div>
        ) : null}

        {payouts.map((payout) => (
          <article
            key={payout.id}
            className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-zinc-950">
                  {payout.staff_name || "Unknown staff"}
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  {formatMonthLabel(payout.year, payout.month)}
                </p>
              </div>
              <Link
                href={`/owner/payouts/${payout.year}/${String(payout.month).padStart(2, "0")}`}
                className="rounded-full border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700"
              >
                Open month
              </Link>
            </div>

            <div className="mt-4 grid gap-3 text-sm text-zinc-700 sm:grid-cols-2">
              <div>
                <span className="block text-zinc-500">Total approved sales</span>
                <span className="font-medium">
                  {formatMoney(Number(payout.total_approved_sales))}
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
              <div>
                <span className="block text-zinc-500">Status</span>
                <span className="font-medium">{payout.status}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
