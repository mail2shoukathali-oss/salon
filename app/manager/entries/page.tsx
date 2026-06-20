import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppShell } from "@/components/AppShell";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { requireManagerAccess } from "@/lib/auth/access";
import {
  getManagerEntries,
  updateServiceEntryStatus,
  type ManagerServiceEntry,
} from "@/lib/manager-entries";

function formatMoney(amount: number) {
  return `AED ${amount.toFixed(2)}`;
}

export default async function ManagerEntriesPage() {
  const { user, profile } = await getCurrentUserProfile();

  if (!user || !profile) {
    redirect("/login");
  }

  if (profile.role === "staff") {
    redirect("/staff/today");
  }

  const { entries, totals } = await getManagerEntries();

  async function setEntryStatus(
    entryId: string,
    status: "approved" | "rejected",
  ) {
    "use server";

    const { user: currentUser, profile: currentProfile } =
      await requireManagerAccess();

    if (!currentUser || !currentProfile) {
      redirect("/login");
    }

    const { error } = await updateServiceEntryStatus(
      entryId,
      status,
      currentUser.id,
    );

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/manager/entries");
    revalidatePath("/manager/entries/pending");
  }

  return (
    <AppShell
      role={profile.role}
      title="Service entries"
      description="Review all staff service entries and approve or reject pending items."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Total entries</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {totals.totalEntries}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Approved sales total</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {formatMoney(totals.approvedSalesTotal)}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Pending sales total</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {formatMoney(totals.pendingSalesTotal)}
          </p>
        </article>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-600">Newest entries first.</p>
        <a
          href="/manager/entries/pending"
          className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700"
        >
          Pending only
        </a>
      </div>

      <div className="mt-4 grid gap-4">
        {entries.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm">
            No service entries found.
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

            {entry.status === "pending" ? (
              <div className="mt-4 flex gap-2">
                <form action={setEntryStatus.bind(null, entry.id, "approved")}>
                  <button
                    type="submit"
                    className="rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white"
                  >
                    Approve
                  </button>
                </form>
                <form action={setEntryStatus.bind(null, entry.id, "rejected")}>
                  <button
                    type="submit"
                    className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700"
                  >
                    Reject
                  </button>
                </form>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </AppShell>
  );
}
