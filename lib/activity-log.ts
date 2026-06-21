import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ActivityLogAction =
  | "staff_entry_created"
  | "staff_entry_updated"
  | "staff_entry_deleted"
  | "entry_approved"
  | "entry_rejected"
  | "expense_created"
  | "expense_updated"
  | "expense_deleted"
  | "daily_closing_saved"
  | "payouts_generated"
  | "payout_adjusted"
  | "payout_marked_paid"
  | "business_settings_updated"
  | "staff_profile_created"
  | "staff_profile_updated"
  | "service_created"
  | "service_updated";

export type ActivityLogEntityType =
  | "service_entry"
  | "expense"
  | "daily_closing"
  | "monthly_payout"
  | "business_settings"
  | "staff_profile"
  | "service"
  | "report"
  | "other";

export type ActivityLogRow = {
  id: string;
  actor_id: string | null;
  actor_name: string;
  actor_role: "owner" | "manager" | "staff";
  action: string;
  entity_type: string;
  entity_id: string;
  entity_label: string | null;
  business_date: string | null;
  period_year: number | null;
  period_month: number | null;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type ActivityLogFilters = {
  date?: string;
  action?: ActivityLogAction | string;
  entityType?: ActivityLogEntityType | string;
  limit?: number;
};

export type RecordActivityLogInput = {
  actorId: string;
  actorName: string;
  actorRole: "owner" | "manager" | "staff";
  action: ActivityLogAction | string;
  entityType: ActivityLogEntityType | string;
  entityId: string;
  entityLabel?: string | null;
  businessDate?: string | null;
  periodYear?: number | null;
  periodMonth?: number | null;
  beforeData?: Record<string, unknown> | null;
  afterData?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
};

type ActivityLogQueryRow = ActivityLogRow;

export function getActivityLogActionLabel(action: string) {
  const labels: Record<string, string> = {
    staff_entry_created: "Staff entry created",
    staff_entry_updated: "Staff entry updated",
    staff_entry_deleted: "Staff entry deleted",
    entry_approved: "Entry approved",
    entry_rejected: "Entry rejected",
    expense_created: "Expense created",
    expense_updated: "Expense updated",
    expense_deleted: "Expense deleted",
    daily_closing_saved: "Daily closing saved",
    payouts_generated: "Payouts generated",
    payout_adjusted: "Payout adjusted",
    payout_marked_paid: "Payout marked paid",
    business_settings_updated: "Business settings updated",
    staff_profile_created: "Staff profile created",
    staff_profile_updated: "Staff profile updated",
    service_created: "Service created",
    service_updated: "Service updated",
  };

  return labels[action] ?? prettifyLabel(action);
}

export function getActivityLogEntityLabel(entityType: string) {
  const labels: Record<string, string> = {
    service_entry: "Service entry",
    expense: "Expense",
    daily_closing: "Daily closing",
    monthly_payout: "Monthly payout",
    business_settings: "Business settings",
    staff_profile: "Staff profile",
    service: "Service",
    report: "Report",
    other: "Other",
  };

  return labels[entityType] ?? prettifyLabel(entityType);
}

function prettifyLabel(value: string) {
  return value
    .split(/[_-]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function recordActivityLog(input: RecordActivityLogInput) {
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("activity_logs").insert({
      actor_id: input.actorId,
      actor_name: input.actorName,
      actor_role: input.actorRole,
      action: input.action,
      entity_type: input.entityType,
      entity_id: input.entityId,
      entity_label: input.entityLabel ?? null,
      business_date: input.businessDate ?? null,
      period_year: input.periodYear ?? null,
      period_month: input.periodMonth ?? null,
      before_data: input.beforeData ?? null,
      after_data: input.afterData ?? null,
      metadata: input.metadata ?? {},
    });

    if (error) {
      throw error;
    }

    return { ok: true as const };
  } catch (error) {
    console.error("Failed to record activity log.", error);
    return { ok: false as const };
  }
}

export async function getActivityLogs(filters: ActivityLogFilters = {}) {
  const supabase = await createSupabaseServerClient();
  const limit = filters.limit ?? 50;

  let query = supabase
    .from("activity_logs")
    .select(
      "id, actor_id, actor_name, actor_role, action, entity_type, entity_id, entity_label, business_date, period_year, period_month, before_data, after_data, metadata, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.date) {
    query = query.eq("business_date", filters.date);
  }

  if (filters.action) {
    query = query.eq("action", filters.action);
  }

  if (filters.entityType) {
    query = query.eq("entity_type", filters.entityType);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as ActivityLogQueryRow[];
}

