import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppShell } from "@/components/AppShell";
import {
  ServiceEntryForm,
  type ServiceEntryFormState,
} from "@/components/ServiceEntryForm";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import {
  getActiveManagerServices,
  type ManagerServiceRow,
} from "@/lib/manager-services";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTodayDateString } from "@/lib/staff-entries";

export default async function AddServicePage() {
  const { user, profile } = await getCurrentUserProfile();

  if (!user || !profile) {
    redirect("/login");
  }

  let services: ManagerServiceRow[] = [];
  try {
    services = await getActiveManagerServices();
  } catch {
    services = [];
  }

  async function createServiceEntry(
    _state: ServiceEntryFormState,
    formData: FormData,
  ): Promise<ServiceEntryFormState> {
    "use server";

    const { user: currentUser, profile: currentProfile } =
      await getCurrentUserProfile();

    if (!currentUser || !currentProfile) {
      redirect("/login");
    }

    const serviceId = String(formData.get("service_id") ?? "").trim();
    const amountRaw = String(formData.get("amount") ?? "").trim();
    const paymentMethod = String(formData.get("payment_method") ?? "");
    const customerName = String(formData.get("customer_name") ?? "").trim();
    const customerPhone = String(formData.get("customer_phone") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();

    if (!serviceId) {
      return { error: "Please select a service." };
    }

    const amount = Number(amountRaw);
    if (amountRaw === "" || Number.isNaN(amount) || amount <= 0) {
      return { error: "Amount must be greater than 0." };
    }

    if (!["cash", "card", "online"].includes(paymentMethod)) {
      return { error: "Payment method must be cash, card, or online." };
    }

    const supabase = await createSupabaseServerClient();
    const { data: selectedService, error: serviceError } = await supabase
      .from("services")
      .select("id, name, default_price, status")
      .eq("id", serviceId)
      .eq("status", "active")
      .maybeSingle();

    if (serviceError) {
      return { error: serviceError.message };
    }

    if (!selectedService) {
      return { error: "Selected service is no longer available." };
    }

    const { error } = await supabase.from("service_entries").insert({
      staff_id: currentUser.id,
      service_id: selectedService.id,
      service_name: selectedService.name,
      service_date: getTodayDateString(),
      amount,
      payment_method: paymentMethod,
      customer_name: customerName || null,
      customer_phone: customerPhone || null,
      notes: notes || null,
      status: "pending",
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/staff/today");
    redirect("/staff/today");
  }

  return (
    <AppShell
      role={profile.role}
      title="Add service"
      description="Create a daily service entry for the logged-in user."
    >
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm leading-6 text-zinc-600">
          Add a service entry for today. The entry is saved as pending and can
          be reviewed later.
        </p>

        <div className="mt-5">
          <ServiceEntryForm
            action={createServiceEntry}
            submitLabel="Save service"
            services={services}
            disabled={services.length === 0}
            disabledMessage="No active services are available yet. Ask an owner or manager to add a service before creating entries."
          />
        </div>
      </div>
    </AppShell>
  );
}
