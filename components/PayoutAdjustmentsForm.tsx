"use client";

import { useActionState } from "react";

export type PayoutAdjustmentsFormState = {
  error: string | null;
};

type PayoutAdjustmentsFormProps = {
  action: (state: PayoutAdjustmentsFormState, formData: FormData) => Promise<PayoutAdjustmentsFormState>;
  defaultDeductions: string;
  defaultAdvanceDeduction: string;
  submitLabel?: string;
};

const initialState: PayoutAdjustmentsFormState = {
  error: null,
};

export function PayoutAdjustmentsForm({
  action,
  defaultDeductions,
  defaultAdvanceDeduction,
  submitLabel = "Save deductions",
}: PayoutAdjustmentsFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form className="space-y-4" action={formAction}>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-700">
          Deductions
        </span>
        <input
          type="number"
          name="deductions"
          min="0"
          step="0.01"
          inputMode="decimal"
          defaultValue={defaultDeductions}
          required
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-700">
          Advance deduction
        </span>
        <input
          type="number"
          name="advance_deduction"
          min="0"
          step="0.01"
          inputMode="decimal"
          defaultValue={defaultAdvanceDeduction}
          required
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Saving..." : submitLabel}
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
