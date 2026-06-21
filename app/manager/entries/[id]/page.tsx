import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppShell } from "@/components/AppShell";
import {
  ManagerEntryRejectForm,
  type ManagerEntryRejectFormState,
} from "@/components/ManagerEntryRejectForm";
import { requireManagerAccess } from "@/lib/auth/access";
import { recordActivityLog } from "@/lib/activity-log";
import {
  buildManagerEntryActivitySnapshot,
  approveManagerEntry,
  getManagerEntryById,
  rejectManagerEntry,
} from "@/lib/manager-entries";

function formatMoney(amount: number) {
  return `AED ${amount.toFixed(2)}`;
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatNotes(notes: string | null) {
  if (!notes) {
    return "—";
  }

  return notes;
}

export default async function ManagerEntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireManagerAccess();

  const { id } = await params;
  const entry = await getManagerEntryById(id);

  if (!entry) {
    notFound();
  }

  async function approveEntry() {
    "use server";

    const { user: currentUser, profile: currentProfile } =
      await requireManagerAccess();

    if (!currentUser || !currentProfile) {
      redirect("/login");
    }

    const currentEntry = await getManagerEntryById(id);

    if (!currentEntry) {
      notFound();
    }

    if (currentEntry.status !== "pending") {
      notFound();
    }

    await approveManagerEntry(id, currentUser.id);
    await recordActivityLog({
      actorId: currentProfile.id,
      actorName: currentProfile.full_name || "Unknown user",
      actorRole: currentProfile.role,
      action: "entry_approved",
      entityType: "service_entry",
      entityId: currentEntry.id,
      entityLabel: currentEntry.service_name || currentEntry.id,
      businessDate: currentEntry.service_date,
      beforeData: buildManagerEntryActivitySnapshot(currentEntry),
      afterData: {
        status: "approved",
        reviewed_by: currentUser.id,
        reviewed_at: new Date().toISOString(),
      },
      metadata: {
        staff_id: currentEntry.staff_id,
        amount: currentEntry.amount,
        payment_method: currentEntry.payment_method,
      },
    });
    revalidatePath("/manager/entries");
    revalidatePath("/manager/entries/pending");
    revalidatePath(`/manager/entries/${id}`);
    redirect(`/manager/entries/${id}`);
  }

  async function rejectEntry(
    _state: ManagerEntryRejectFormState,
    formData: FormData,
  ): Promise<ManagerEntryRejectFormState> {
    "use server";

    const { user: currentUser, profile: currentProfile } =
      await requireManagerAccess();

    if (!currentUser || !currentProfile) {
      redirect("/login");
    }

    const reason = String(formData.get("reason") ?? "").trim();
    if (!reason) {
      return { error: "Rejection reason is required." };
    }

    const currentEntry = await getManagerEntryById(id);

    if (!currentEntry) {
      notFound();
    }

    if (currentEntry.status !== "pending") {
      notFound();
    }

    try {
      await rejectManagerEntry(id, currentUser.id, reason, currentEntry.notes);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reject the entry.";
      return { error: message };
    }

    await recordActivityLog({
      actorId: currentProfile.id,
      actorName: currentProfile.full_name || "Unknown user",
      actorRole: currentProfile.role,
      action: "entry_rejected",
      entityType: "service_entry",
      entityId: currentEntry.id,
      entityLabel: currentEntry.service_name || currentEntry.id,
      businessDate: currentEntry.service_date,
      beforeData: buildManagerEntryActivitySnapshot(currentEntry),
      afterData: {
        status: "rejected",
        reviewed_by: currentUser.id,
        reviewed_at: new Date().toISOString(),
        rejection_reason: reason,
      },
      metadata: {
        staff_id: currentEntry.staff_id,
        amount: currentEntry.amount,
        payment_method: currentEntry.payment_method,
      },
    });
    revalidatePath("/manager/entries");
    revalidatePath("/manager/entries/pending");
    revalidatePath(`/manager/entries/${id}`);
    redirect(`/manager/entries/${id}`);
  }

  const isPending = entry.status === "pending";

  return (
    <AppShell
      role={profile.role}
      title="Entry details"
      description="Review a service entry and approve or reject pending items."
    >
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-zinc-950">
              {entry.service_name}
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              {entry.staff_name || "Unknown staff"}
            </p>
          </div>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-700">
            {entry.status}
          </span>
        </div>

        <div className="mt-5 grid gap-3 text-sm text-zinc-700 sm:grid-cols-2">
          <div>
            <span className="block text-zinc-500">Service date</span>
            <span className="font-medium">{entry.service_date}</span>
          </div>
          <div>
            <span className="block text-zinc-500">Created time</span>
            <span className="font-medium">{formatDateTime(entry.created_at)}</span>
          </div>
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
            <span className="block text-zinc-500">Customer phone</span>
            <span className="font-medium">{entry.customer_phone || "—"}</span>
          </div>
          <div className="sm:col-span-2">
            <span className="block text-zinc-500">Notes</span>
            <span className="font-medium whitespace-pre-line">
              {formatNotes(entry.notes)}
            </span>
          </div>
          <div>
            <span className="block text-zinc-500">Reviewed by</span>
            <span className="font-medium">
              {entry.reviewed_by_name || "—"}
            </span>
          </div>
          <div>
            <span className="block text-zinc-500">Reviewed at</span>
            <span className="font-medium">{formatDateTime(entry.reviewed_at)}</span>
          </div>
        </div>

        <div className="mt-6">
          <Link
            href="/manager/entries"
            className="inline-flex rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700"
          >
            Back to entries
          </Link>
        </div>
      </div>

      {isPending ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold tracking-tight">Approve entry</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Approving this entry will keep the current notes as-is.
            </p>

            <form action={approveEntry} className="mt-4">
              <button
                type="submit"
                className="w-full rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white"
              >
                Approve entry
              </button>
            </form>
          </section>

          <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold tracking-tight">Reject entry</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Provide a reason. It will be appended to the notes field.
            </p>

            <div className="mt-4">
              <ManagerEntryRejectForm action={rejectEntry} />
            </div>
          </section>
        </div>
      ) : (
        <section className="mt-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold tracking-tight">Review locked</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            This entry is already {entry.status} and is now view-only.
          </p>
        </section>
      )}
    </AppShell>
  );
}
