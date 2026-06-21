import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppShell } from "@/components/AppShell";
import { StaffProfileForm, type StaffProfileFormState } from "@/components/StaffProfileForm";
import { recordActivityLog } from "@/lib/activity-log";
import { requireOwnerAccess } from "@/lib/auth/access";
import {
  buildStaffProfileActivitySnapshot,
  getStaffProfileErrorMessage,
  parseStaffProfileFormData,
} from "@/lib/owner-staff";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PageParams = {
  params: Promise<{
    id: string;
  }>;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  role: "owner" | "manager" | "staff";
  status: "active" | "inactive";
  phone: string | null;
  commission_percentage: number;
};

export default async function OwnerStaffEditPage({ params }: PageParams) {
  await requireOwnerAccess();
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, status, phone, commission_percentage")
    .eq("id", id)
    .maybeSingle();

  if (error || !profile) {
    redirect("/owner/staff");
  }

  const staffProfile = profile as ProfileRow;

  async function updateStaffProfile(
    _state: StaffProfileFormState,
    formData: FormData,
  ): Promise<StaffProfileFormState> {
    "use server";

    const { profile: currentProfile } = await requireOwnerAccess();

    const parsed = parseStaffProfileFormData(formData, { includeId: true });
    if ("error" in parsed) {
      return { error: parsed.error };
    }

    if (parsed.values.id !== staffProfile.id) {
      return { error: "Profile ID does not match the record being edited." };
    }

    const beforeSnapshot = buildStaffProfileActivitySnapshot({
      id: staffProfile.id,
      full_name: staffProfile.full_name ?? "",
      phone: staffProfile.phone ?? null,
      role: staffProfile.role,
      status: staffProfile.status,
      commission_percentage: staffProfile.commission_percentage,
    });

    const updateClient = await createSupabaseServerClient();
    const { error: updateError } = await updateClient
      .from("profiles")
      .update({
        full_name: parsed.values.full_name,
        phone: parsed.values.phone || null,
        role: parsed.values.role,
        status: parsed.values.status,
        commission_percentage: parsed.values.commission_percentage,
      })
      .eq("id", staffProfile.id);

    if (updateError) {
      return { error: getStaffProfileErrorMessage(updateError) };
    }

    await recordActivityLog({
      actorId: currentProfile.id,
      actorName: currentProfile.full_name || "Unknown user",
      actorRole: currentProfile.role,
      action: "staff_profile_updated",
      entityType: "staff_profile",
      entityId: staffProfile.id,
      entityLabel: parsed.values.full_name,
      beforeData: beforeSnapshot,
      afterData: buildStaffProfileActivitySnapshot({
        id: staffProfile.id,
        full_name: parsed.values.full_name,
        phone: parsed.values.phone || null,
        role: parsed.values.role,
        status: parsed.values.status,
        commission_percentage: parsed.values.commission_percentage,
      }),
      metadata: {
        role: parsed.values.role,
        status: parsed.values.status,
        commission_percentage: parsed.values.commission_percentage,
      },
    });

    revalidatePath("/owner/staff");
    revalidatePath(`/owner/staff/${staffProfile.id}`);
    redirect("/owner/staff");
  }

  return (
    <AppShell
      role="owner"
      title="Edit staff"
      description="Update the staff profile details and access settings."
    >
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm leading-6 text-zinc-600">
          Editing profile for <span className="font-medium">{staffProfile.id}</span>.
        </p>

        <div className="mt-5">
          <StaffProfileForm
            action={updateStaffProfile}
            submitLabel="Save changes"
            initialValues={{
              id: staffProfile.id,
              fullName: staffProfile.full_name ?? "",
              phone: staffProfile.phone ?? "",
              role: staffProfile.role,
              status: staffProfile.status,
              commissionPercentage: String(staffProfile.commission_percentage ?? 0),
            }}
          />
        </div>
      </div>
    </AppShell>
  );
}
