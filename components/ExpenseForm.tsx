"use client";

import { useActionState } from "react";

export type ExpenseFormState = {
  error: string | null;
};

type ExpenseFormProps = {
  action: (state: ExpenseFormState, formData: FormData) => Promise<ExpenseFormState>;
  submitLabel: string;
  defaultTitle?: string;
  defaultCategory?: string;
  defaultAmount?: string;
  defaultPaymentMethod?: "cash" | "card" | "online";
  defaultExpenseDate?: string;
  defaultNotes?: string;
};

const initialState: ExpenseFormState = {
  error: null,
};

export function ExpenseForm({
  action,
  submitLabel,
  defaultTitle = "",
  defaultCategory = "",
  defaultAmount = "",
  defaultPaymentMethod = "cash",
  defaultExpenseDate = new Date().toISOString().slice(0, 10),
  defaultNotes = "",
}: ExpenseFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form className="space-y-4" action={formAction}>
      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-700">
          Title
        </span>
        <input
          type="text"
          name="title"
          placeholder="Expense title"
          defaultValue={defaultTitle}
          required
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-700">
          Category
        </span>
        <input
          type="text"
          name="category"
          placeholder="Expense category"
          defaultValue={defaultCategory}
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
          defaultValue={defaultAmount}
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
          defaultValue={defaultPaymentMethod}
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-zinc-400"
        >
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="online">Online</option>
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-700">
          Expense date
        </span>
        <input
          type="date"
          name="expense_date"
          defaultValue={defaultExpenseDate}
          required
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-zinc-400"
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
          defaultValue={defaultNotes}
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
