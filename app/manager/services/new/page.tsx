import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppShell } from "@/components/AppShell";
import { ServiceForm, type ServiceFormState } from "@/components/ServiceForm";
import { recordActivityLog } from "@/lib/activity-log";
import { requireManagerAccess } from "@/lib/auth/access";
import {
  createManagerService,
  type ServiceStatus,
} from "@/lib/manager-services";

export default async function NewManagerServicePage() {
  const { profile } = await requireManagerAccess();

  async function createService(
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

    const { data, error } = await createManagerService({
      name,
      defaultPrice,
      status: statusRaw as ServiceStatus,
    });

    if (error) {
      return { error: error.message };
    }

    if (data) {
      await recordActivityLog({
        actorId: currentProfile.id,
        actorName: currentProfile.full_name || "Unknown user",
        actorRole: currentProfile.role,
        action: "service_created",
        entityType: "service",
        entityId: data.id,
        entityLabel: data.name,
        beforeData: null,
        afterData: {
          id: data.id,
          name: data.name,
          default_price: Number(data.default_price),
          status: data.status,
        },
        metadata: {
          name: data.name,
          default_price: Number(data.default_price),
          status: data.status,
        },
      });
    }

    revalidatePath("/manager/services");
    redirect("/manager/services");
  }

  return (
    <AppShell
      role={profile.role}
      title="Add service"
      description="Create a salon service with a default price and status."
    >
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm leading-6 text-zinc-600">
          Add services that the salon offers. Staff selection will be added later.
        </p>

        <div className="mt-5">
          <ServiceForm submitLabel="Save service" action={createService} />
        </div>
      </div>
    </AppShell>
  );
}
