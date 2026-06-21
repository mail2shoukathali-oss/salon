import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppShell } from "@/components/AppShell";
import { PendingCancelForm } from "@/components/PendingCancelForm";
import { recordActivityLog } from "@/lib/activity-log";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import {
  formatEntryDateTime,
  getStaffTodayData,
} from "@/lib/staff-today";
import {
  deleteStaffPendingEntry,
  getStaffPendingEntryById,
} from "@/lib/staff-entry-edit";
import { buildStaffEntryActivitySnapshot } from "@/lib/staff-entry-activity";

function formatMoney(amount: number) {
  return `AED ${amount.toFixed(2)}`;
}

function getStatusStyles(status: "pending" | "approved" | "rejected") {
  switch (status) {
    case "approved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "rejected":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "pending":
      return "bg-amber-50 text-amber-700 border-amber-200";
  }
}

export default async function StaffTodayPage() {
  const { user, profile } = await getCurrentUserProfile();

  if (!user || !profile) {
    redirect("/login");
  }

  const { entries, summary } = await getStaffTodayData(user.id);

  async function cancelEntry(entryId: string) {
    "use server";

    const { user: currentUser, profile: currentProfile } =
      await getCurrentUserProfile();

    if (!currentUser || !currentProfile) {
      redirect("/login");
    }

    const entry = await getStaffPendingEntryById(entryId, currentUser.id);

    if (!entry) {
      redirect("/staff/today");
    }

    await deleteStaffPendingEntry(entryId, currentUser.id);

    await recordActivityLog({
      actorId: currentProfile.id,
      actorName: currentProfile.full_name || "Unknown user",
      actorRole: currentProfile.role,
      action: "staff_entry_deleted",
      entityType: "service_entry",
      entityId: entry.id,
      entityLabel: entry.service_name,
      businessDate: entry.service_date,
      beforeData: buildStaffEntryActivitySnapshot(entry),
      afterData: null,
      metadata: {
        staff_id: entry.staff_id,
        amount: Number(entry.amount),
        payment_method: entry.payment_method,
        status: entry.status,
      },
    });

    revalidatePath("/staff/today");
    redirect("/staff/today");
  }

  return (
    <AppShell
      role={profile.role}
      title="Today"
      description="Your daily service entries and work value for today."
    >
      <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">Today&apos;s work summary</p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Commission is not shown here. This page tracks only service entries and work value.
            </p>
          </div>
          <Link
            href="/staff/add-service"
            className="inline-flex rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white"
          >
            Add Service
          </Link>
        </div>
      </section>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Today total value</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {formatMoney(summary.todayTotalValue)}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Approved value</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {formatMoney(summary.approvedValue)}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Pending value</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {formatMoney(summary.pendingValue)}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Rejected count</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {summary.rejectedCount}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Total entries</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {summary.totalEntriesCount}
          </p>
        </article>
      </div>

      <div className="mt-4 grid gap-4">
        {entries.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm">
            No service entries recorded for today yet.
          </div>
        ) : null}

        {entries.map((entry) => (
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
                  {entry.customer_name || "No customer name"}
                </p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide ${getStatusStyles(
                  entry.status,
                )}`}
              >
                {entry.status}
              </span>
            </div>

            <div className="mt-4 grid gap-3 text-sm text-zinc-700 sm:grid-cols-2">
              <div>
                <span className="block text-zinc-500">Amount</span>
                <span className="font-medium">
                  {formatMoney(Number(entry.amount))}
                </span>
              </div>
              <div>
                <span className="block text-zinc-500">Payment method</span>
                <span className="font-medium">{entry.payment_method}</span>
              </div>
              <div>
                <span className="block text-zinc-500">Customer phone</span>
                <span className="font-medium">
                  {entry.customer_phone || "—"}
                </span>
              </div>
              <div>
                <span className="block text-zinc-500">Created</span>
                <span className="font-medium">
                  {formatEntryDateTime(entry.created_at)}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="block text-zinc-500">Notes</span>
                <span className="font-medium">
                  {entry.notes || "No notes added"}
                </span>
              </div>
            </div>

            {entry.status === "pending" ? (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Link
                  href={`/staff/entries/${entry.id}/edit`}
                  className="inline-flex items-center justify-center rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700"
                >
                  Edit
                </Link>
                <PendingCancelForm action={cancelEntry.bind(null, entry.id)} />
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </AppShell>
  );
}
