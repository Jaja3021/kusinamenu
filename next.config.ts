import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Default is 1 MB; a phone payment screenshot routinely runs 3-8 MB.
    // Server Actions carry file uploads (see app/order/track/actions.ts'
    // submitPaymentAction), so this must cover the raw multipart body,
    // boundaries included — hence the headroom over the 5 MB bucket limit
    // in supabase/payments.sql §12.
    serverActions: { bodySizeLimit: "6mb" },
  },
};

export default nextConfig;
