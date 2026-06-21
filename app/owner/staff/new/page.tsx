import { redirect } from "next/navigation";
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
import { revalidatePath } from "next/cache";

export default async function OwnerStaffNewPage() {
  await requireOwnerAccess();

  async function createStaffProfile(
    _state: StaffProfileFormState,
    formData: FormData,
  ): Promise<StaffProfileFormState> {
    "use server";

    const { profile: currentProfile } = await requireOwnerAccess();

    const parsed = parseStaffProfileFormData(formData, { includeId: true });
    if ("error" in parsed) {
      return { error: parsed.error };
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("profiles").insert({
      id: parsed.values.id,
      full_name: parsed.values.full_name,
      phone: parsed.values.phone || null,
      role: parsed.values.role,
      status: parsed.values.status,
      commission_percentage: parsed.values.commission_percentage,
    });

    if (error) {
      return { error: getStaffProfileErrorMessage(error) };
    }

    await recordActivityLog({
      actorId: currentProfile.id,
      actorName: currentProfile.full_name || "Unknown user",
      actorRole: currentProfile.role,
      action: "staff_profile_created",
      entityType: "staff_profile",
      entityId: parsed.values.id ?? "",
      entityLabel: parsed.values.full_name,
      beforeData: null,
      afterData: buildStaffProfileActivitySnapshot({
        id: parsed.values.id ?? "",
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
    redirect("/owner/staff");
  }

  return (
    <AppShell
      role="owner"
      title="Add staff"
      description="Create a staff profile and link it to the matching Supabase Auth user."
    >
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm leading-6 text-zinc-600">
          Copy the Supabase Auth user ID into the ID field for now. The profile
          must use the same UUID as the auth user.
        </p>

        <div className="mt-5">
          <StaffProfileForm
            action={createStaffProfile}
            submitLabel="Save profile"
            initialValues={{
              id: "",
              fullName: "",
              phone: "",
              role: "staff",
              status: "active",
              commissionPercentage: "0",
            }}
            includeIdInput
            helpText="ID must be copied from the matching Supabase Auth user ID. Commission percentage must be between 0 and 100."
          />
        </div>
      </div>
    </AppShell>
  );
}
