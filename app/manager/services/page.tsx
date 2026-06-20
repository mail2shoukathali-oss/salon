import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { requireManagerAccess } from "@/lib/auth/access";
import { getManagerServices } from "@/lib/manager-services";

function formatMoney(amount: number) {
  return `AED ${amount.toFixed(2)}`;
}

export default async function ManagerServicesPage() {
  const { profile } = await requireManagerAccess();
  const services = await getManagerServices();

  return (
    <AppShell
      role={profile.role}
      title="Services"
      description="Manage the salon service catalog and default prices."
    >
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm leading-6 text-zinc-600">
          Owner and manager can create and review standard salon services here.
        </p>
        <div className="mt-4">
          <Link
            href="/manager/services/new"
            className="inline-flex rounded-2xl bg-zinc-950 px-4 py-3 text-sm font-medium text-white"
          >
            Add service
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-4">
        {services.length === 0 ? (
          <div className="rounded-3xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm">
            No services have been added yet.
          </div>
        ) : null}

        {services.map((service) => (
          <Link
            key={service.id}
            href={`/manager/services/${service.id}`}
            className="block rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-zinc-950">
                  {service.name}
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Default salon service
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide ${
                  service.status === "active"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-zinc-100 text-zinc-700"
                }`}
              >
                {service.status}
              </span>
            </div>

            <div className="mt-4 grid gap-3 text-sm text-zinc-700 sm:grid-cols-2">
              <div>
                <span className="block text-zinc-500">Default price</span>
                <span className="font-medium">
                  {formatMoney(Number(service.default_price))}
                </span>
              </div>
              <div>
                <span className="block text-zinc-500">Created</span>
                <span className="font-medium">{service.created_at}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </AppShell>
  );
}
