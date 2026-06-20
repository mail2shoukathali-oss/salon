"use client";

import { useActionState } from "react";

export type BusinessSettingsFormState = {
  error: string | null;
};

type BusinessSettingsFormProps = {
  action: (
    state: BusinessSettingsFormState,
    formData: FormData,
  ) => Promise<BusinessSettingsFormState>;
  defaultBusinessName: string;
  defaultPayoutStatementTitle: string;
  defaultDailyClosingReportTitle: string;
};

const initialState: BusinessSettingsFormState = {
  error: null,
};

export function BusinessSettingsForm({
  action,
  defaultBusinessName,
  defaultPayoutStatementTitle,
  defaultDailyClosingReportTitle,
}: BusinessSettingsFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form className="space-y-4" action={formAction}>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-700">
          Business name
        </span>
        <input
          type="text"
          name="business_name"
          defaultValue={defaultBusinessName}
          required
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-700">
          Payout statement title
        </span>
        <input
          type="text"
          name="payout_statement_title"
          defaultValue={defaultPayoutStatementTitle}
          required
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-700">
          Daily closing report title
        </span>
        <input
          type="text"
          name="daily_closing_report_title"
          defaultValue={defaultDailyClosingReportTitle}
          required
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Saving..." : "Save settings"}
      </button>

      <div className="min-h-12 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6">
        {state.error ? (
          <p className="text-red-600">{state.error}</p>
        ) : (
          <p className="text-zinc-500">Status messages will appear here.</p>
        )}
      </div>
    </form>
  );
}
