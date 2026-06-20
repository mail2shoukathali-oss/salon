"use client";

import { useActionState } from "react";
import type { ServiceStatus } from "@/lib/manager-services";

export type ServiceFormState = {
  error: string | null;
};

type ServiceFormProps = {
  action: (state: ServiceFormState, formData: FormData) => Promise<ServiceFormState>;
  submitLabel: string;
  initialValues?: {
    name?: string;
    defaultPrice?: string;
    status?: ServiceStatus;
  };
};

const initialState: ServiceFormState = {
  error: null,
};

export function ServiceForm({
  action,
  submitLabel,
  initialValues,
}: ServiceFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form className="space-y-4" action={formAction}>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-700">Name</span>
        <input
          type="text"
          name="name"
          defaultValue={initialValues?.name}
          placeholder="Service name"
          required
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-700">
          Default price
        </span>
        <input
          type="number"
          name="default_price"
          defaultValue={initialValues?.defaultPrice}
          min="0"
          step="0.01"
          inputMode="decimal"
          placeholder="0.00"
          required
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-700">Status</span>
        <select
          name="status"
          defaultValue={initialValues?.status ?? "active"}
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-zinc-400"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
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
