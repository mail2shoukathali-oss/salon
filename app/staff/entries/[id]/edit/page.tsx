import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppShell } from "@/components/AppShell";
import {
  ServiceEntryForm,
  type ServiceEntryFormState,
} from "@/components/ServiceEntryForm";
import { recordActivityLog } from "@/lib/activity-log";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import { getActiveManagerServices } from "@/lib/manager-services";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getStaffPendingEntryById,
  updateStaffPendingEntry,
} from "@/lib/staff-entry-edit";
import { buildStaffEntryActivitySnapshot } from "@/lib/staff-entry-activity";

function formatMoney(amount: number) {
  return `AED ${amount.toFixed(2)}`;
}

export default async function EditStaffEntryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { user, profile } = await getCurrentUserProfile();

  if (!user || !profile) {
    redirect("/login");
  }

  const { id } = await params;
  const entry = await getStaffPendingEntryById(id, user.id);

  if (!entry) {
    notFound();
  }

  let services = await getActiveManagerServices();
  const existingServiceId = entry.service_id ?? "";
  if (existingServiceId && !services.some((service) => service.id === existingServiceId)) {
    const supabase = await createSupabaseServerClient();
    const { data: existingService } = await supabase
      .from("services")
      .select("id, name, description, active, default_price, status, created_at")
      .eq("id", existingServiceId)
      .maybeSingle();

    if (existingService) {
      services = [existingService, ...services];
    }
  }

  async function saveEntry(
    _state: ServiceEntryFormState,
    formData: FormData,
  ): Promise<ServiceEntryFormState> {
    "use server";

    const { user: currentUser, profile: currentProfile } =
      await getCurrentUserProfile();

    if (!currentUser || !currentProfile) {
      redirect("/login");
    }

    const currentEntry = await getStaffPendingEntryById(id, currentUser.id);

    if (!currentEntry) {
      redirect("/staff/today");
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

    const { data: updatedEntry, error } = await updateStaffPendingEntry(id, currentUser.id, {
      service_id: selectedService.id,
      service_name: selectedService.name,
      amount,
      payment_method: paymentMethod as "cash" | "card" | "online",
      customer_name: customerName || null,
      customer_phone: customerPhone || null,
      notes: notes || null,
    });

    if (error) {
      return { error: error.message };
    }

    if (!updatedEntry) {
      return { error: "Pending entry could not be updated." };
    }

    await recordActivityLog({
      actorId: currentProfile.id,
      actorName: currentProfile.full_name || "Unknown user",
      actorRole: currentProfile.role,
      action: "staff_entry_updated",
      entityType: "service_entry",
      entityId: updatedEntry.id,
      entityLabel: updatedEntry.service_name,
      businessDate: updatedEntry.service_date,
      beforeData: buildStaffEntryActivitySnapshot(currentEntry),
      afterData: buildStaffEntryActivitySnapshot(updatedEntry),
      metadata: {
        staff_id: updatedEntry.staff_id,
        amount: Number(updatedEntry.amount),
        payment_method: updatedEntry.payment_method,
        status: updatedEntry.status,
      },
    });

    revalidatePath("/staff/today");
    redirect("/staff/today");
  }

  return (
    <AppShell
      role={profile.role}
      title="Edit entry"
      description="Update your pending service entry before it is reviewed."
    >
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm leading-6 text-zinc-600">
          Only pending entries can be updated. Approved and rejected entries are locked.
        </p>
        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Current amount: <span className="font-medium">{formatMoney(Number(entry.amount))}</span>
        </p>

        <div className="mt-5">
          <ServiceEntryForm
            action={saveEntry}
            submitLabel="Save changes"
            services={services}
            initialServiceId={entry.service_id ?? undefined}
            initialAmount={String(Number(entry.amount).toFixed(2))}
            initialPaymentMethod={entry.payment_method}
            initialCustomerName={entry.customer_name ?? ""}
            initialCustomerPhone={entry.customer_phone ?? ""}
            initialNotes={entry.notes ?? ""}
          />
        </div>
      </div>
    </AppShell>
  );
}
