import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppShell } from "@/components/AppShell";
import {
  ServiceEntryForm,
  type ServiceEntryFormState,
} from "@/components/ServiceEntryForm";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getTodayDateString } from "@/lib/staff-entries";

export default async function AddServicePage() {
  const { user, profile } = await getCurrentUserProfile();

  if (!user || !profile) {
    redirect("/login");
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

    const serviceName = String(formData.get("service_name") ?? "").trim();
    const amountRaw = String(formData.get("amount") ?? "").trim();
    const paymentMethod = String(formData.get("payment_method") ?? "");
    const customerName = String(formData.get("customer_name") ?? "").trim();
    const customerPhone = String(formData.get("customer_phone") ?? "").trim();
    const notes = String(formData.get("notes") ?? "").trim();

    if (!serviceName) {
      return { error: "Service name is required." };
    }

    const amount = Number(amountRaw);
    if (amountRaw === "" || Number.isNaN(amount) || amount <= 0) {
      return { error: "Amount must be greater than 0." };
    }

    if (!["cash", "card", "online"].includes(paymentMethod)) {
      return { error: "Payment method must be cash, card, or online." };
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("service_entries").insert({
      staff_id: currentUser.id,
      service_name: serviceName,
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
          <ServiceEntryForm action={createServiceEntry} submitLabel="Save service" />
        </div>
      </div>
    </AppShell>
  );
}
