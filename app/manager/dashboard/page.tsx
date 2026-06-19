import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import type { DashboardCard, DashboardSection } from "@/types";

const cards: DashboardCard[] = [
  {
    title: "Open shifts",
    value: "4",
    description: "Staff coverage still needs review.",
  },
  {
    title: "Pending service entries",
    value: "7",
    description: "Service entries still waiting to be finalized.",
  },
  {
    title: "Staff work value",
    value: "18 services",
    description: "Estimated work value completed today.",
  },
];

const sections: DashboardSection[] = [
  {
    title: "Staff queue",
    description: "Placeholder for assigned team members and work status.",
  },
  {
    title: "Closing status",
    description: "Placeholder for daily close checks and final review.",
  },
];

export default async function ManagerDashboardPage() {
  const { user, profile } = await getCurrentUserProfile();

  if (!user || !profile) {
    redirect("/login");
  }

  if (profile.role === "staff") {
    redirect("/staff/today");
  }

  return (
    <AppShell
      role="manager"
      title="Manager dashboard"
      description="Operational view for today's staff, entries, and closing workflow."
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
