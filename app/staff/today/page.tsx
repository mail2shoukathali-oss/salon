import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTodayDateString, type StaffServiceEntry } from "@/lib/staff-entries";

type EntryRow = StaffServiceEntry;

export default async function StaffTodayPage() {
  const { user, profile } = await getCurrentUserProfile();

  if (!user || !profile) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  const today = getTodayDateString();
  const { data, error } = await supabase
    .from("service_entries")
    .select(
      "id, service_name, amount, payment_method, customer_name, status, service_date",
    )
    .eq("staff_id", user.id)
    .eq("service_date", today)
    .order("created_at", { ascending: false });

  const entries = (data ?? []) as EntryRow[];
  const total = entries.reduce((sum, entry) => sum + Number(entry.amount), 0);

  return (
    <AppShell
      role={profile.role}
      title="Today"
      description="Daily service entries for the logged-in user."
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-600">Today’s entries</p>
          <p className="text-xs text-zinc-500">
            {profile.role === "owner" || profile.role === "manager"
              ? "Owner and manager see their own entries for now."
              : "Staff see only their own entries."}
          </p>
        </div>
        <Link
          href="/staff/add-service"
          className="rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white"
        >
          Add service
        </Link>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Today total</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            AED {total.toFixed(2)}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Entries</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight">
            {entries.length}
          </p>
        </article>
      </div>

      {error ? (
        <div className="mt-4 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load today&apos;s entries: {error.message}
        </div>
      ) : null}

      <div className="mt-4 grid gap-4">
        {entries.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm">
            No service entries for today yet.
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
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-700">
                {entry.status}
              </span>
            </div>

            <div className="mt-4 grid gap-3 text-sm text-zinc-700 sm:grid-cols-2">
              <div>
                <span className="block text-zinc-500">Amount</span>
                <span className="font-medium">AED {Number(entry.amount).toFixed(2)}</span>
              </div>
              <div>
                <span className="block text-zinc-500">Payment method</span>
                <span className="font-medium">{entry.payment_method}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
