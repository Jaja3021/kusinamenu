import { Suspense } from "react";
import TrackOrderClient from "./TrackOrderClient";

// Next.js requires useSearchParams() (used in TrackOrderClient for the
// ?order= prefill) to be wrapped in Suspense, or `next build` fails even
// though `next dev` looks fine — see node_modules/next/dist/docs/01-app/
// 03-api-reference/04-functions/use-search-params.md.
export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-6 pb-12 pt-8 text-center text-gray-500">Loading…</div>}>
      <TrackOrderClient />
    </Suspense>
  );
}
