import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Data Access Layer for admin checks (see Next.js auth guide). Memoized per
// request with React's cache() so calling isAdmin()/requireAdmin() from
// multiple places in one render (layout + page + action) only hits
// Supabase once.

export const getCurrentUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

// Relies on the "Admins can read admins" RLS policy (user_id = auth.uid()):
// a non-admin's query simply returns no row, it isn't a permissions error.
export const isAdmin = cache(async (): Promise<boolean> => {
  const supabase = await createSupabaseServerClient();
  const user = await getCurrentUser();
  if (!user) return false;
  const { data } = await supabase.from("admins").select("user_id").eq("user_id", user.id).maybeSingle();
  return data != null;
});

// Belt-and-braces alongside RLS: Server Actions are independently POST-able,
// so every mutating action calls this even though the dashboard layout also
// gates page navigation.
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    redirect("/dashboard/login");
  }
}
