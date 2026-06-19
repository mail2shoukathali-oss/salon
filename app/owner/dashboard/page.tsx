import { AppShell } from "@/components/AppShell";
import type { DashboardCard, DashboardSection } from "@/types";

const cards: DashboardCard[] = [
  {
    title: "Daily sales",
    value: "AED 8,420",
    description: "Estimated salon sales for today.",
  },
  {
    title: "Pending service entries",
    value: "12",
    description: "Service entries waiting to be closed out.",
  },
  {
    title: "Closing status",
    value: "Ready",
    description: "Daily close is ready with no blocking items.",
  },
];

const sections: DashboardSection[] = [
  {
    title: "Expenses",
    description: "Placeholder for daily expenses, supplies, and deductions.",
  },
  {
    title: "Monthly payout coming later",
    description: "Monthly payout details will appear at month end.",
  },
];

export default function OwnerDashboardPage() {
  return (
    <AppShell
      role="owner"
      title="Owner dashboard"
      description="High-level daily operations overview for the full salon."
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.title}
            className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-zinc-500">{card.title}</p>
            <p className="mt-3 text-3xl font-semibold tracking-tight">
              {card.value}
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {card.description}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {sections.map((section) => (
          <section
            key={section.title}
            className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <h2 className="text-lg font-semibold tracking-tight">{section.title}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              {section.description}
            </p>
            <div className="mt-4 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
              Placeholder for operational summary content.
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
