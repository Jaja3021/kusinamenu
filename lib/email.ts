// Fail-soft transactional email via Resend's REST API, called with plain
// fetch — the project has five dependencies total, and POSTing one JSON
// body doesn't earn an SDK. Supabase's built-in mailer is auth-only (OTP
// codes) and can't send this kind of mail; Nodemailer needs an SMTP host
// this project doesn't have.
//
// This function must NEVER throw and must NEVER be the reason an order
// insert or status update fails — every caller fires it through after()
// (see app/order/confirm/actions.ts, app/dashboard/orders/actions.ts,
// app/dashboard/payments/actions.ts) specifically so a slow or failing
// mailer can never block the response the customer/admin is waiting on.

type Message = { to: string; subject: string; html: string };

export async function sendEmail(msg: Message): Promise<{ ok: boolean }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) {
    // Not configured (e.g. local dev) — log and move on rather than throw.
    console.warn(`[email] RESEND_API_KEY/EMAIL_FROM unset, skipping "${msg.subject}" to ${msg.to}`);
    return { ok: false };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, ...msg }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error(`[email] send failed (${res.status}):`, await res.text());
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error("[email] send threw:", err);
    return { ok: false };
  }
}
