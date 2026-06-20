"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import type { ManagerServiceRow } from "@/lib/manager-services";

export type ServiceEntryFormState = {
  error: string | null;
};

export type ServiceEntryPaymentMethod = "cash" | "card" | "online";

type ServiceEntryFormProps = {
  action: (state: ServiceEntryFormState, formData: FormData) => Promise<ServiceEntryFormState>;
  submitLabel: string;
  services: ManagerServiceRow[];
  disabled?: boolean;
  disabledMessage?: string;
  initialServiceId?: string;
  initialAmount?: string;
  initialPaymentMethod?: ServiceEntryPaymentMethod;
  initialCustomerName?: string;
  initialCustomerPhone?: string;
  initialNotes?: string;
};

const initialState: ServiceEntryFormState = {
  error: null,
};

export function ServiceEntryForm({
  action,
  submitLabel,
  services,
  disabled = false,
  disabledMessage,
  initialServiceId,
  initialAmount,
  initialPaymentMethod = "cash",
  initialCustomerName = "",
  initialCustomerPhone = "",
  initialNotes = "",
}: ServiceEntryFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const initialSelectedService = services.find((service) => service.id === initialServiceId) ?? services[0] ?? null;
  const [selectedServiceId, setSelectedServiceId] = useState(
    () => initialSelectedService?.id ?? "",
  );
  const [amount, setAmount] = useState(
    () =>
      initialAmount ??
      (initialSelectedService?.default_price != null
        ? String(Number(initialSelectedService.default_price).toFixed(2))
        : ""),
  );
  const selectedService = services.find((service) => service.id === selectedServiceId) ?? null;

  function handleServiceChange(event: ChangeEvent<HTMLSelectElement>) {
    const serviceId = event.target.value;
    setSelectedServiceId(serviceId);

    const service = services.find((item) => item.id === serviceId);
    if (service) {
      setAmount(String(Number(service.default_price).toFixed(2)));
    }
  }

  const canSubmit = !disabled && !pending && services.length > 0;

  return (
    <form className="space-y-4" action={formAction}>
      <input type="hidden" name="service_name" value={selectedService?.name ?? ""} />

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-700">
          Service
        </span>
        <select
          name="service_id"
          value={selectedServiceId}
          onChange={handleServiceChange}
          disabled={disabled || services.length === 0}
          required
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-100"
        >
          {services.length === 0 ? (
            <option value="">No active services available</option>
          ) : null}
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} - AED {Number(service.default_price).toFixed(2)}
            </option>
          ))}
        </select>
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
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          required
          disabled={disabled || services.length === 0}
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-100"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-700">
          Payment method
        </span>
        <select
          name="payment_method"
          defaultValue={initialPaymentMethod}
          disabled={disabled || services.length === 0}
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-100"
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
          defaultValue={initialCustomerName}
          placeholder="Optional"
          disabled={disabled || services.length === 0}
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-100"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-700">
          Customer phone
        </span>
        <input
          type="tel"
          name="customer_phone"
          defaultValue={initialCustomerPhone}
          placeholder="Optional"
          disabled={disabled || services.length === 0}
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-100"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-zinc-700">
          Notes
        </span>
        <textarea
          name="notes"
          rows={4}
          defaultValue={initialNotes}
          placeholder="Optional"
          disabled={disabled || services.length === 0}
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none placeholder:text-zinc-400 focus:border-zinc-400 disabled:cursor-not-allowed disabled:bg-zinc-100"
        />
      </label>

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
      >
        {pending ? "Saving..." : submitLabel}
      </button>

      <div className="min-h-12 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6">
        {services.length === 0 ? (
          <p className="text-zinc-500">
            {disabledMessage ||
              "No active services are available yet. Ask an owner or manager to add one before creating entries."}
          </p>
        ) : state.error ? (
          <p className="text-red-600">{state.error}</p>
        ) : (
          <p className="text-zinc-500">
            Select a service to fill the default price, then adjust the amount if needed.
          </p>
        )}
      </div>
    </form>
  );
}
