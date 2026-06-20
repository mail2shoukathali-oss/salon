"use client";

import { useActionState } from "react";
import type { UserRole } from "@/types";
import type { StaffStatus } from "@/lib/owner-staff";

export type StaffProfileFormState = {
  error: string | null;
};

type StaffProfileFormProps = {
  action: (state: StaffProfileFormState, formData: FormData) => Promise<StaffProfileFormState>;
  submitLabel: string;
  initialValues: {
    id?: string;
    fullName: string;
    phone: string;
    role: UserRole;
    status: StaffStatus;
    commissionPercentage: string;
  };
  includeIdInput?: boolean;
  helpText?: string;
};

const initialState: StaffProfileFormState = {
  error: null,
};

export function StaffProfileForm({
  action,
  submitLabel,
  initialValues,
  includeIdInput = false,
  helpText,
}: StaffProfileFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form className="space-y-4" action={formAction}>
      {includeIdInput ? (
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-zinc-700">
            ID
          </span>
          <input
            type="text"
            name="id"
            defaultValue={initialValues.id}
            placeholder="Copy the Supabase Auth user ID here"
            required
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400"
          />
        </label>
      ) : (
        <input type="hidden" name="id" value={initialValues.id} />
      )}

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-700">
          Full name
        </span>
        <input
          type="text"
          name="full_name"
          defaultValue={initialValues.fullName}
          placeholder="Full name"
          required
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-700">
          Phone
        </span>
        <input
          type="tel"
          name="phone"
          defaultValue={initialValues.phone}
          placeholder="Phone number"
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-700">
          Role
        </span>
        <select
          name="role"
          defaultValue={initialValues.role}
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-zinc-400"
        >
          <option value="owner">Owner</option>
          <option value="manager">Manager</option>
          <option value="staff">Staff</option>
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-700">
          Status
        </span>
        <select
          name="status"
          defaultValue={initialValues.status}
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-zinc-400"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-700">
          Commission percentage
        </span>
        <input
          type="number"
          name="commission_percentage"
          defaultValue={initialValues.commissionPercentage}
          min="0"
          max="100"
          step="0.01"
          inputMode="decimal"
          placeholder="0"
          required
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400"
        />
      </label>

      {helpText ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          {helpText}
        </p>
      ) : null}

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
