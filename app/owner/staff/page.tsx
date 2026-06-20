import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { requireOwnerAccess } from "@/lib/auth/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type StaffRow = {
  id: string;
  full_name: string | null;
  role: "owner" | "manager" | "staff";
  status: "active" | "inactive";
  phone: string | null;
  commission_percentage: number;
};

export default async function OwnerStaffPage() {
  await requireOwnerAccess();

  const supabase = await createSupabaseServerClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, status, phone, commission_percentage")
    .order("role", { ascending: true })
    .order("full_name", { ascending: true, nullsFirst: true });

  const staff = (profiles ?? []) as StaffRow[];

  return (
    <AppShell
      role="owner"
      title="Staff management"
      description="Manage staff profiles, roles, status, and commission settings."
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-zinc-600">Profiles in Supabase</p>
          <p className="text-xs text-zinc-500">
            Owner access only. Staff and managers are redirected away.
          </p>
        </div>
        <Link
          href="/owner/staff/new"
          className="rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white"
        >
          Add staff
        </Link>
      </div>

      {error ? (
        <div className="mt-4 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to load profiles: {error.message}
        </div>
      ) : null}

      <div className="mt-4 grid gap-4">
        {staff.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm">
            No profiles found yet.
          </div>
        ) : null}

        {staff.map((profile) => (
          <article
            key={profile.id}
            className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-zinc-950">
                  {profile.full_name || "Unnamed profile"}
                </h2>
                <p className="mt-1 text-sm text-zinc-600">{profile.id}</p>
              </div>
              <Link
                href={`/owner/staff/${profile.id}`}
                className="rounded-full border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700"
              >
                Edit
              </Link>
            </div>

            <div className="mt-4 grid gap-3 text-sm text-zinc-700 sm:grid-cols-2">
              <div>
                <span className="block text-zinc-500">Role</span>
                <span className="font-medium">{profile.role}</span>
              </div>
              <div>
                <span className="block text-zinc-500">Status</span>
                <span className="font-medium">{profile.status}</span>
              </div>
              <div>
                <span className="block text-zinc-500">Phone</span>
                <span className="font-medium">{profile.phone || "—"}</span>
              </div>
              <div>
                <span className="block text-zinc-500">
                  Commission percentage
                </span>
                <span className="font-medium">
                  {Number(profile.commission_percentage).toFixed(2)}%
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
