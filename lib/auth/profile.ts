import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export type CurrentUserProfile = {
  id: string;
  role: "owner" | "manager" | "staff";
  full_name: string | null;
  phone: string | null;
  commission_percentage: number;
};

export async function getCurrentUserProfile(): Promise<{
  user: User | null;
  profile: CurrentUserProfile | null;
}> {
  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return { user: null, profile: null };
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, full_name, phone, commission_percentage")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError || !profileData) {
    return { user: userData.user, profile: null };
  }

  return { user: userData.user, profile: profileData as CurrentUserProfile };
}
