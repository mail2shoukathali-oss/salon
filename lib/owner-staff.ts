import type { UserRole } from "@/types";

export type StaffStatus = "active" | "inactive";

export type StaffProfileFormValues = {
  id?: string;
  full_name: string;
  phone: string;
  role: UserRole;
  status: StaffStatus;
  commission_percentage: number;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseStaffProfileFormData(
  formData: FormData,
  options: { includeId: boolean },
):
  | { values: StaffProfileFormValues }
  | { error: string } {
  const id = String(formData.get("id") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const role = String(formData.get("role") ?? "");
  const status = String(formData.get("status") ?? "");
  const commissionRaw = String(formData.get("commission_percentage") ?? "").trim();

  if (options.includeId && !id) {
    return { error: "ID is required." };
  }

  if (options.includeId && !uuidPattern.test(id)) {
    return { error: "ID must be a valid UUID." };
  }

  if (!fullName) {
    return { error: "Full name is required." };
  }

  if (role !== "owner" && role !== "manager" && role !== "staff") {
    return { error: "Role must be owner, manager, or staff." };
  }

  if (status !== "active" && status !== "inactive") {
    return { error: "Status must be active or inactive." };
  }

  const commissionPercentage = Number(commissionRaw);

  if (
    commissionRaw === "" ||
    Number.isNaN(commissionPercentage) ||
    commissionPercentage < 0 ||
    commissionPercentage > 100
  ) {
    return { error: "Commission percentage must be between 0 and 100." };
  }

  return {
    values: {
      id: options.includeId ? id : undefined,
      full_name: fullName,
      phone,
      role: role as UserRole,
      status: status as StaffStatus,
      commission_percentage: commissionPercentage,
    },
  };
}

export function getStaffProfileErrorMessage(error: {
  code?: string;
  message?: string;
}): string {
  if (error.code === "23505") {
    return "A profile already exists for that user ID.";
  }

  return error.message || "Something went wrong while saving the profile.";
}
