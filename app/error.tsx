"use client";

// Route-level error boundary. Without this, any render-time throw (e.g. an
// unrecognized package slug hitting an unguarded lookup — see app/page.tsx's
// PACKAGE_ICONS fallback) takes down the whole page with a raw Next.js
// error overlay in dev / a blank failure in prod, instead of a recoverable
// screen a customer can back out of.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-6 py-24 text-center">
      <h1 className="font-serif text-3xl italic text-forest-dark">Something went wrong</h1>
      <p className="mt-3 text-sm text-gray-600">
        We hit an unexpected error loading this page. Please try again, or head back home.
      </p>
      {process.env.NODE_ENV === "development" && (
        <pre className="mt-4 max-w-full overflow-x-auto rounded-lg bg-red-50 p-3 text-left text-xs text-red-700">
          {error.message}
        </pre>
      )}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-gradient-to-r from-forest to-forest-light px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-md"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-full border border-forest/40 px-5 py-2.5 text-sm font-semibold text-forest transition hover:bg-ivory-deep"
        >
          Back to Home
        </a>
      </div>
    </div>
  );
}
