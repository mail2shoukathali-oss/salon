const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export type SupabaseClientConfig = {
  url: string;
  anonKey: string;
};

export function getSupabaseClientConfig(): SupabaseClientConfig {
  return {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
  };
}

export function isSupabaseConfigured(): boolean {
  return supabaseUrl.length > 0 && supabaseAnonKey.length > 0;
}
