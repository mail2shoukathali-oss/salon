export type UserRole = "owner" | "manager" | "staff";

export type DashboardCard = {
  title: string;
  value: string;
  description: string;
};

export type DashboardSection = {
  title: string;
  description: string;
};

export type ShellNavItem = {
  href: string;
  label: string;
};
