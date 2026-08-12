import { signInAction } from "./actions";

const inputClass =
  "mt-1 w-full rounded-lg border border-gold-light/50 bg-white px-3 py-2 text-gray-900 shadow-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/25";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
      <h1 className="font-serif text-3xl italic text-forest-dark">Dashboard Login</h1>
      <p className="mt-1 text-sm text-gray-600">Sign in to manage the menu.</p>

      {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <form
        action={signInAction}
        className="mt-6 space-y-4 rounded-2xl border border-gold-light/40 bg-white p-6 shadow-[0_1px_3px_rgba(27,58,46,0.06)]"
      >
        <label className="block text-sm">
          Email
          <input type="email" name="email" required autoFocus className={inputClass} />
        </label>
        <label className="block text-sm">
          Password
          <input type="password" name="password" required className={inputClass} />
        </label>
        <button
          type="submit"
          className="w-full rounded-full bg-gradient-to-r from-forest to-forest-light px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
