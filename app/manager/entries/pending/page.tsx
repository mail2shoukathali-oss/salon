import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { requireManagerAccess } from "@/lib/auth/access";
import {
  getManagerEntries,
  approveManagerEntry,
  type ManagerServiceEntry,
} from "@/lib/manager-entries";

function formatMoney(amount: number) {
  return `AED ${amount.toFixed(2)}`;
}

export default async function ManagerPendingEntriesPage() {
  const { user, profile } = await getCurrentUserProfile();

  if (!user || !profile) {
    redirect("/login");
  }

  if (profile.role === "staff") {
    redirect("/staff/today");
  }

  const { entries, totals } = await getManagerEntries({ status: "pending" });

  async function approveEntry(entryId: string) {
    "use server";

    const { user: currentUser, profile: currentProfile } =
      await requireManagerAccess();

    if (!currentUser || !currentProfile) {
      redirect("/login");
    }

    try {
      await approveManagerEntry(entryId, currentUser.id);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update entry status.";
      throw new Error(message);
    }

    revalidatePath("/manager/entries");
    revalidatePath("/manager/entries/pending");
  }

  return (
    <AppShell
      role={profile.role}
      title="Pending entries"
      description="Approve or reject service entries waiting for review."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Pending entries</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {totals.totalEntries}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Pending value</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {formatMoney(totals.pendingSalesTotal)}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Approved value</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {formatMoney(totals.approvedSalesTotal)}
          </p>
        </article>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-600">Pending entries only.</p>
        <Link
          href="/manager/entries"
          className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700"
        >
          All entries
        </Link>
      </div>

      <div className="mt-4 grid gap-4">
        {entries.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm">
            No pending entries.
          </div>
        ) : null}

        {entries.map((entry: ManagerServiceEntry) => (
          <article
            key={entry.id}
            className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-zinc-950">
                  {entry.service_name}
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  {entry.staff_name || "Unknown staff"} - {entry.service_date}
                </p>
              </div>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-700">
                {entry.status}
              </span>
            </div>

            <div className="mt-4 grid gap-3 text-sm text-zinc-700 sm:grid-cols-2">
              <div>
                <span className="block text-zinc-500">Amount</span>
                <span className="font-medium">{formatMoney(Number(entry.amount))}</span>
              </div>
              <div>
                <span className="block text-zinc-500">Payment method</span>
                <span className="font-medium">{entry.payment_method}</span>
              </div>
              <div>
                <span className="block text-zinc-500">Customer name</span>
                <span className="font-medium">{entry.customer_name || "—"}</span>
              </div>
              <div>
                <span className="block text-zinc-500">Status</span>
                <span className="font-medium">{entry.status}</span>
              </div>
            </div>

            <div className="mt-4">
              <Link
                href={`/manager/entries/${entry.id}`}
                className="inline-flex rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700"
              >
                View details
              </Link>
            </div>

            <div className="mt-4 flex gap-2">
              <form action={approveEntry.bind(null, entry.id)}>
                <button
                  type="submit"
                  className="rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white"
                >
                  Approve
                </button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
