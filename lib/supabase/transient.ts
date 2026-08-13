import { createClient } from "@supabase/supabase-js";

// Deliberately NOT the cookie-bound client from lib/supabase/server.ts: an
// anonymous customer action (OTP verification, order lookup, payment
// submission) must never write a session cookie into the browser, or it
// would silently sign an admin's dashboard session out (or a customer's OTP
// session in) in the same browser. Shared by app/order/confirm/actions.ts
// and app/order/track/actions.ts.
export function transientSupabase(accessToken?: string) {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    ...(accessToken ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } } : {}),
  });
}
