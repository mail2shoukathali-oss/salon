import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppShell } from "@/components/AppShell";
import {
  BusinessSettingsForm,
  type BusinessSettingsFormState,
} from "@/components/BusinessSettingsForm";
import { requireOwnerAccess } from "@/lib/auth/access";
import {
  getBusinessSettings,
  updateBusinessSettings,
} from "@/lib/business-settings";

export default async function OwnerSettingsPage() {
  const { profile } = await requireOwnerAccess();
  const settings = await getBusinessSettings();

  async function saveBusinessSettings(
    _state: BusinessSettingsFormState,
    formData: FormData,
  ): Promise<BusinessSettingsFormState> {
    "use server";

    await requireOwnerAccess();

    const businessName = String(formData.get("business_name") ?? "").trim();
    const payoutStatementTitle = String(
      formData.get("payout_statement_title") ?? "",
    ).trim();
    const dailyClosingReportTitle = String(
      formData.get("daily_closing_report_title") ?? "",
    ).trim();

    if (!businessName) {
      return { error: "Business name is required." };
    }

    if (!payoutStatementTitle) {
      return { error: "Payout statement title is required." };
    }

    if (!dailyClosingReportTitle) {
      return { error: "Daily closing report title is required." };
    }

    const { error } = await updateBusinessSettings({
      businessName,
      payoutStatementTitle,
      dailyClosingReportTitle,
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/owner/settings");
    redirect("/owner/settings");
  }

  return (
    <AppShell
      role={profile.role}
      title="Business settings"
      description="Customize print document branding for the salon."
    >
      <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm leading-6 text-zinc-600">
          These settings are used on print documents and fall back to the default
          Nawab Salon values if the database row is missing.
        </p>
        <div className="mt-4 grid gap-3 text-sm text-zinc-700 sm:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Business name
            </p>
            <p className="mt-1 font-medium">{settings.businessName}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Payout title
            </p>
            <p className="mt-1 font-medium">{settings.payoutStatementTitle}</p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Daily closing title
            </p>
            <p className="mt-1 font-medium">{settings.dailyClosingReportTitle}</p>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">Edit settings</h2>
        <div className="mt-4">
          <BusinessSettingsForm
            action={saveBusinessSettings}
            defaultBusinessName={settings.businessName}
            defaultPayoutStatementTitle={settings.payoutStatementTitle}
            defaultDailyClosingReportTitle={settings.dailyClosingReportTitle}
          />
        </div>
      </section>
    </AppShell>
  );
}
