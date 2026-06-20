"use client";

type PendingCancelFormProps = {
  action: () => Promise<void>;
};

export function PendingCancelForm({ action }: PendingCancelFormProps) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!confirm("Cancel this pending entry?")) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="w-full rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 sm:w-auto"
      >
        Cancel
      </button>
    </form>
  );
}
