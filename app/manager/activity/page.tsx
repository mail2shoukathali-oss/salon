import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { requireOwnerOrManagerAccess } from "@/lib/auth/access";
import {
  getActivityLogActionLabel,
  getActivityLogEntityLabel,
  type ActivityLogRow,
  getActivityLogs,
} from "@/lib/activity-log";

function isIsoDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Dubai",
  }).format(new Date(value));
}

function formatBusinessDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

function prettifyValue(value: string) {
  return value
    .split(/[_-]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatRole(role: string) {
  return prettifyValue(role);
}

export default async function ManagerActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; action?: string; entityType?: string }>;
}) {
  const { profile } = await requireOwnerOrManagerAccess();
  const { date: dateParam, action: actionParam, entityType: entityTypeParam } =
    await searchParams;

  const selectedDate = isIsoDate(dateParam) ? dateParam : "";
  const selectedAction = actionParam?.trim() ?? "";
  const selectedEntityType = entityTypeParam?.trim() ?? "";

  let logs: ActivityLogRow[] = [];
  let loadError: string | null = null;

  try {
    logs = await getActivityLogs({
      date: selectedDate || undefined,
      action: selectedAction || undefined,
      entityType: selectedEntityType || undefined,
    });
  } catch (error) {
    const maybeError = error as {
      code?: string;
      message?: string;
      details?: string;
    };
    const combinedMessage = [maybeError.code, maybeError.message, maybeError.details]
      .filter(Boolean)
      .join(" ");

    if (/activity_logs/i.test(combinedMessage) || /42P01/.test(combinedMessage)) {
      loadError =
        "Activity logs are not available yet. The activity_logs SQL may need to be applied in Supabase.";
    } else {
      throw error;
    }
  }

  return (
    <AppShell
      role={profile.role}
      title="Activity Log"
      description="Read-only audit history for important salon actions."
    >
      <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <form method="get" className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-700">Date</span>
            <input
              type="date"
              name="date"
              defaultValue={selectedDate}
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-zinc-400"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-700">Action</span>
            <input
              type="text"
              name="action"
              defaultValue={selectedAction}
              placeholder="e.g. expense_created"
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-zinc-400"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-zinc-700">
              Entity type
            </span>
            <input
              type="text"
              name="entityType"
              defaultValue={selectedEntityType}
              placeholder="e.g. expense"
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-zinc-400"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white"
            >
              Apply filter
            </button>
            <Link
              href="/manager/activity"
              className="rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700"
            >
              Clear
            </Link>
          </div>
        </form>
      </section>

      <section className="mt-4 rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        {loadError ? (
          <div className="rounded-3xl border border-dashed border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
            {loadError}
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-600">
            No activity logs found.
          </div>
        ) : (
          <div className="grid gap-4">
            {logs.map((log) => {
              const businessDate = formatBusinessDate(log.business_date);
              const period =
                log.period_year && log.period_month
                  ? `${log.period_month.toString().padStart(2, "0")}/${log.period_year}`
                  : null;

              return (
                <article
                  key={log.id}
                  className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-zinc-950">
                        {getActivityLogActionLabel(log.action)}
                      </h2>
                      <p className="mt-1 text-sm text-zinc-600">
                        {formatDateTime(log.created_at)}
                      </p>
                    </div>
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-700">
                      {formatRole(log.actor_role)}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-zinc-700 sm:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <span className="block text-zinc-500">Actor</span>
                      <span className="font-medium">{log.actor_name}</span>
                    </div>
                    <div>
                      <span className="block text-zinc-500">Entity</span>
                      <span className="font-medium">
                        {getActivityLogEntityLabel(log.entity_type)}
                      </span>
                    </div>
                    <div>
                      <span className="block text-zinc-500">Target</span>
                      <span className="font-medium">
                        {log.entity_label || log.entity_id}
                      </span>
                    </div>
                    <div>
                      <span className="block text-zinc-500">Logged at</span>
                      <span className="font-medium">{formatDateTime(log.created_at)}</span>
                    </div>
                    {businessDate ? (
                      <div>
                        <span className="block text-zinc-500">Business date</span>
                        <span className="font-medium">{businessDate}</span>
                      </div>
                    ) : null}
                    {period ? (
                      <div>
                        <span className="block text-zinc-500">Period</span>
                        <span className="font-medium">{period}</span>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </AppShell>
  );
}
