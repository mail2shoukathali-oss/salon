"use client";

import { useActionState } from "react";

export type ServiceEntryFormState = {
  error: string | null;
};

type ServiceEntryFormProps = {
  action: (state: ServiceEntryFormState, formData: FormData) => Promise<ServiceEntryFormState>;
  submitLabel: string;
};

const initialState: ServiceEntryFormState = {
  error: null,
};

export function ServiceEntryForm({ action, submitLabel }: ServiceEntryFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form className="space-y-4" action={formAction}>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-700">
          Service name
        </span>
        <input
          type="text"
          name="service_name"
          placeholder="Service name"
          required
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-700">
          Amount
        </span>
        <input
          type="number"
          name="amount"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          placeholder="0.00"
          required
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-700">
          Payment method
        </span>
        <select
          name="payment_method"
          defaultValue="cash"
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-zinc-400"
        >
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="online">Online</option>
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-700">
          Customer name
        </span>
        <input
          type="text"
          name="customer_name"
          placeholder="Optional"
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-700">
          Customer phone
        </span>
        <input
          type="tel"
          name="customer_phone"
          placeholder="Optional"
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-700">
          Notes
        </span>
        <textarea
          name="notes"
          rows={4}
          placeholder="Optional"
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
