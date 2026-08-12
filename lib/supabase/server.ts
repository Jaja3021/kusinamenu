import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Cookie-bound client used by every Server Action/Server Component. Reads
// work for anonymous storefront visitors too (RLS allows public select);
// writes are only accepted by Postgres when the request carries a signed-in
// session, because the "authenticated" RLS policies key off that.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component render, where cookies can't be
            // written — proxy.ts refreshes the session on the next request.
          }
        },
      },
    }
  );
}
