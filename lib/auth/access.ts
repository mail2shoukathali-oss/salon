import { redirect } from "next/navigation";
import type { UserRole } from "@/types";
import { getCurrentUserProfile } from "@/lib/auth/profile";

export function getRoleRedirectPath(role: UserRole): string {
  switch (role) {
    case "owner":
      return "/owner/dashboard";
    case "manager":
      return "/manager/dashboard";
    case "staff":
      return "/staff/today";
  }
}

export async function requireOwnerAccess() {
  const { user, profile } = await getCurrentUserProfile();

  if (!user || !profile) {
    redirect("/login");
  }

  if (profile.role !== "owner") {
    redirect(getRoleRedirectPath(profile.role));
  }

  return { user, profile };
}
