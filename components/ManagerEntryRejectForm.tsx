"use client";

import { useActionState } from "react";

export type ManagerEntryRejectFormState = {
  error: string | null;
};

type ManagerEntryRejectFormProps = {
  action: (state: ManagerEntryRejectFormState, formData: FormData) => Promise<ManagerEntryRejectFormState>;
};

const initialState: ManagerEntryRejectFormState = {
  error: null,
};

export function ManagerEntryRejectForm({ action }: ManagerEntryRejectFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form className="space-y-4" action={formAction}>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-700">
          Rejection reason
        </span>
        <textarea
          name="reason"
          rows={4}
          required
          placeholder="Explain why this entry is being rejected"
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Rejecting..." : "Reject entry"}
      </button>

      <div className="min-h-12 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6">
        {state.error ? (
          <p className="text-red-600">{state.error}</p>
        ) : (
          <p className="text-zinc-500">The reason will be saved in the entry notes.</p>
        )}
      </div>
    </form>
  );
}
