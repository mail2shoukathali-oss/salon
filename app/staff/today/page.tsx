import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getCurrentUserProfile } from "@/lib/auth/profile";
import type { DashboardCard, DashboardSection } from "@/types";

const cards: DashboardCard[] = [
  {
    title: "Daily sales",
    value: "AED 1,280",
    description: "Placeholder sales total for the current shift.",
  },
  {
    title: "Appointments",
    value: "6",
    description: "Bookings currently assigned to you.",
  },
  {
    title: "Staff work value",
    value: "AED 140",
    description: "Placeholder value for work completed today.",
  },
];

const sections: DashboardSection[] = [
  {
    title: "Session list",
    description: "Placeholder for each service completed today.",
  },
  {
    title: "Monthly payout coming later",
    description: "Monthly payout details will appear at month end.",
  },
];

export default async function StaffTodayPage() {
  const { user, profile } = await getCurrentUserProfile();

  if (!user || !profile) {
    redirect("/login");
  }

  return (
    <AppShell
      role="staff"
      title="Today"
      description="Personal daily view for sales, entries, and assigned services."
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
