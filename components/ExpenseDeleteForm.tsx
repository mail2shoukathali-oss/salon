"use client";

import { useActionState } from "react";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";

export type ExpenseDeleteFormState = {
  error: string | null;
};

type ExpenseDeleteFormProps = {
  action: (
    state: ExpenseDeleteFormState,
    formData: FormData,
  ) => Promise<ExpenseDeleteFormState>;
  submitLabel?: string;
};

const initialState: ExpenseDeleteFormState = {
  error: null,
};

export function ExpenseDeleteForm({
  action,
  submitLabel = "Delete expense",
}: ExpenseDeleteFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form className="space-y-4" action={formAction}>
      <ConfirmSubmitButton
        confirmMessage="Delete this expense entry?"
        className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Deleting..." : submitLabel}
      </ConfirmSubmitButton>

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
