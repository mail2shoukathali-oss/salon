import { createSupabaseServerClient } from "@/lib/supabase/server";

export type BusinessSettings = {
  businessName: string;
  payoutStatementTitle: string;
  dailyClosingReportTitle: string;
};

export type BusinessSettingsSnapshot = BusinessSettings;

export const defaultBusinessSettings: BusinessSettings = {
  businessName: "Nawab Salon",
  payoutStatementTitle: "Monthly Staff Payout Statement",
  dailyClosingReportTitle: "Daily Closing Report",
};

export function buildBusinessSettingsSnapshot(
  settings: BusinessSettings,
): BusinessSettingsSnapshot {
  return {
    businessName: settings.businessName,
    payoutStatementTitle: settings.payoutStatementTitle,
    dailyClosingReportTitle: settings.dailyClosingReportTitle,
  };
}

function mapBusinessSettingsRow(
  row: {
    business_name: string | null;
    payout_statement_title: string | null;
    daily_closing_report_title: string | null;
  } | null,
): BusinessSettings {
  return {
    businessName: row?.business_name?.trim() || defaultBusinessSettings.businessName,
    payoutStatementTitle:
      row?.payout_statement_title?.trim() ||
      defaultBusinessSettings.payoutStatementTitle,
    dailyClosingReportTitle:
      row?.daily_closing_report_title?.trim() ||
      defaultBusinessSettings.dailyClosingReportTitle,
  };
}

export async function getBusinessSettings(): Promise<BusinessSettings> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("business_settings")
    .select("business_name, payout_statement_title, daily_closing_report_title")
    .eq("id", "main")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return mapBusinessSettingsRow(data);
}

export async function updateBusinessSettings(input: BusinessSettings) {
  const supabase = await createSupabaseServerClient();

  return supabase
    .from("business_settings")
    .upsert(
      {
        id: "main",
        business_name: input.businessName,
        payout_statement_title: input.payoutStatementTitle,
        daily_closing_report_title: input.dailyClosingReportTitle,
      },
      { onConflict: "id" },
    );
}
