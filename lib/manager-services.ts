import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ServiceStatus = "active" | "inactive";

export type ManagerServiceRow = {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  default_price: number;
  status: ServiceStatus;
  created_at: string;
};

export async function getManagerServices() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, name, description, active, default_price, status, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as ManagerServiceRow[];
}

export async function getActiveManagerServices() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, name, description, active, default_price, status, created_at")
    .eq("status", "active")
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as ManagerServiceRow[];
}

export async function getManagerServiceById(serviceId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("services")
    .select("id, name, description, active, default_price, status, created_at")
    .eq("id", serviceId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as ManagerServiceRow | null;
}

export async function createManagerService(input: {
  name: string;
  defaultPrice: number;
  status: ServiceStatus;
}) {
  const supabase = await createSupabaseServerClient();
  return supabase.from("services").insert({
    name: input.name,
    default_price: input.defaultPrice,
    status: input.status,
  });
}
