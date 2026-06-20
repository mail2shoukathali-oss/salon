import Link from "next/link";
import type { ReactNode } from "react";
import type { ShellNavItem, UserRole } from "@/types";
import { LogoutButton } from "@/components/LogoutButton";

const roleLabels: Record<UserRole, { title: string; subtitle: string }> = {
  owner: {
    title: "Owner view",
    subtitle: "Full operations overview",
  },
  manager: {
    title: "Manager view",
    subtitle: "Daily operations control",
  },
  staff: {
    title: "Staff view",
    subtitle: "Daily service entry",
  },
};

const navigation: Record<UserRole, ShellNavItem[]> = {
  owner: [
    { href: "/owner/dashboard", label: "Dashboard" },
    { href: "/owner/staff", label: "Staff" },
    { href: "/owner/settings", label: "Settings" },
    { href: "/manager/reports/staff-daily", label: "Staff Report" },
    { href: "/manager/services", label: "Services" },
    { href: "/manager/entries", label: "Entries" },
    { href: "/manager/expenses", label: "Expenses" },
    { href: "/manager/closing", label: "Closing" },
    { href: "/owner/payouts", label: "Payouts" },
    { href: "/staff/today", label: "Today" },
  ],
  manager: [
    { href: "/manager/dashboard", label: "Dashboard" },
    { href: "/manager/reports/staff-daily", label: "Staff Report" },
    { href: "/manager/services", label: "Services" },
    { href: "/manager/entries", label: "Entries" },
    { href: "/manager/expenses", label: "Expenses" },
    { href: "/manager/closing", label: "Closing" },
    { href: "/owner/payouts", label: "Payouts" },
    { href: "/staff/today", label: "Today" },
  ],
  staff: [
    { href: "/staff/today", label: "Today" },
    { href: "/staff/profile", label: "Profile" },
    { href: "/staff/monthly", label: "Monthly" },
    { href: "/staff/add-service", label: "Add Service" },
  ],
};

type AppShellProps = {
  role: UserRole;
  title: string;
  description: string;
  children: ReactNode;
};

export function AppShell({ role, title, description, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#f6f1ea] text-zinc-950">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="rounded-3xl bg-zinc-950 px-5 py-4 text-zinc-50 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.75)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
                Salon commissions
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                {title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-300 sm:text-base">
                {description}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-200">
              <p className="font-medium text-white">{roleLabels[role].title}</p>
              <p className="mt-1 text-zinc-300">{roleLabels[role].subtitle}</p>
            </div>
          </div>
        </header>

        <nav className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {navigation[role].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl border border-zinc-200 bg-white px-3 py-3 text-center text-sm font-medium text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:text-zinc-950"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="mt-3 flex justify-start">
          <LogoutButton />
        </div>

        <main className="flex-1 py-4">{children}</main>
      </div>
    </div>
  );
}
