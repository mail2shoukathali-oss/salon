import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppShell } from "@/components/AppShell";
import { ServiceForm, type ServiceFormState } from "@/components/ServiceForm";
import { recordActivityLog } from "@/lib/activity-log";
import { requireManagerAccess } from "@/lib/auth/access";
import {
  buildServiceActivitySnapshot,
  getManagerServiceById,
  type ServiceStatus,
} from "@/lib/manager-services";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function EditManagerServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireManagerAccess();
  const { id } = await params;
  const service = await getManagerServiceById(id);
  const serviceRecord = service as NonNullable<typeof service>;

  if (!serviceRecord) {
    notFound();
  }

  async function updateService(
    _state: ServiceFormState,
    formData: FormData,
  ): Promise<ServiceFormState> {
    "use server";

    const { profile: currentProfile } = await requireManagerAccess();

    const name = String(formData.get("name") ?? "").trim();
    const defaultPriceRaw = String(formData.get("default_price") ?? "").trim();
    const statusRaw = String(formData.get("status") ?? "").trim();

    if (!name) {
      return { error: "Name is required." };
    }

    const defaultPrice = Number(defaultPriceRaw);
    if (defaultPriceRaw === "" || Number.isNaN(defaultPrice) || defaultPrice < 0) {
      return { error: "Default price must be 0 or greater." };
    }

    if (statusRaw !== "active" && statusRaw !== "inactive") {
      return { error: "Status must be active or inactive." };
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase
      .from("services")
      .update({
        name,
        default_price: defaultPrice,
        status: statusRaw as ServiceStatus,
      })
      .eq("id", id);

    if (error) {
      return { error: error.message };
    }

    await recordActivityLog({
      actorId: currentProfile.id,
      actorName: currentProfile.full_name || "Unknown user",
      actorRole: currentProfile.role,
      action: "service_updated",
      entityType: "service",
      entityId: serviceRecord.id,
      entityLabel: name,
      beforeData: buildServiceActivitySnapshot(serviceRecord),
      afterData: {
        id: serviceRecord.id,
        name,
        default_price: defaultPrice,
        status: statusRaw as ServiceStatus,
      },
      metadata: {
        name,
        default_price: defaultPrice,
        status: statusRaw as ServiceStatus,
      },
    });

    revalidatePath("/manager/services");
    redirect("/manager/services");
  }

  return (
    <AppShell
      role={profile.role}
      title="Edit service"
      description="Update the service name, default price, and status."
    >
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm leading-6 text-zinc-600">
          Keep the salon catalog current. Changes here affect the staff add-service flow.
        </p>

        <div className="mt-5">
          <ServiceForm
            action={updateService}
            submitLabel="Save changes"
            initialValues={{
              name: serviceRecord.name,
              defaultPrice: String(Number(serviceRecord.default_price).toFixed(2)),
              status: serviceRecord.status,
            }}
          />
        </div>
      </div>
    </AppShell>
  );
}
