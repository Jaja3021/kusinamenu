import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, isAdmin } from "@/lib/admin";
import { signOutAction } from "./login/actions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const admin = user ? await isAdmin() : false;

  // proxy.ts only checks "is there a session" (cheap, runs on every
  // request); it can't tell admins from customers. Customers verify by OTP
  // through a session that's deliberately never written to cookies (see
  // app/order/confirm/actions.ts), so this should be unreachable in
  // practice — but if a non-admin ever holds a cookie session, send them to
  // the storefront rather than looping back through /dashboard/login.
  if (user && !admin) {
    redirect("/");
  }

  return (
    <div className="min-h-full bg-ivory">
      <header className="border-b border-gold-light/40 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/dashboard/menu" className="font-serif text-xl italic text-forest-dark">
            Kusinang Pamana — Dashboard
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-gray-600">
            {admin && (
              <>
                <Link href="/dashboard/menu" className="hover:text-forest-dark">
                  Menu
                </Link>
                <Link href="/dashboard/orders" className="hover:text-forest-dark">
                  Orders
                </Link>
                <Link href="/dashboard/payments" className="hover:text-forest-dark">
                  Payments
                </Link>
              </>
            )}
            <Link href="/" className="hover:text-forest-dark">
              View Storefront →
            </Link>
            {admin && (
              <form action={signOutAction}>
                <button type="submit" className="hover:text-forest-dark">
                  Sign Out
                </button>
              </form>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
