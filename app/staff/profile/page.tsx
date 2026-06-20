import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getCurrentUserProfile } from "@/lib/auth/profile";

function formatLabel(value: string | null) {
  if (!value) {
    return "—";
  }

  return value;
}

export default async function StaffProfilePage() {
  const { user, profile } = await getCurrentUserProfile();

  if (!user || !profile) {
    redirect("/login");
  }

  return (
    <AppShell
      role={profile.role}
      title="Profile"
      description="View your account details. Profile changes are managed by the owner."
    >
      <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm leading-6 text-zinc-600">
          Profile changes are managed by the owner. Final monthly payout is
          handled through owner monthly payouts.
        </p>
      </section>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Full name</p>
          <p className="mt-3 text-xl font-semibold tracking-tight">
            {formatLabel(profile.full_name)}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Phone</p>
          <p className="mt-3 text-xl font-semibold tracking-tight">
            {formatLabel(profile.phone)}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Role</p>
          <p className="mt-3 text-xl font-semibold tracking-tight capitalize">
            {profile.role}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">Status</p>
          <p className="mt-3 text-xl font-semibold tracking-tight capitalize">
            {profile.status}
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">
            Commission percentage
          </p>
          <p className="mt-3 text-xl font-semibold tracking-tight">
            {Number(profile.commission_percentage).toFixed(2)}%
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-500">User ID</p>
          <p className="mt-3 break-all text-base font-semibold tracking-tight">
            {profile.id}
          </p>
        </article>
      </div>

      <section className="mt-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">Notes</h2>
        <div className="mt-3 grid gap-3 text-sm text-zinc-700">
          <p>Profile changes are managed by the owner.</p>
          <p>Final monthly payout is handled through owner monthly payouts.</p>
        </div>
      </section>
    </AppShell>
  );
}
