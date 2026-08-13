// Pure (data) => {subject, html} builders — no I/O, so each is trivially
// testable on its own. Inline-styled tables rather than a framework, to
// match the project's "no extra dependency for a small job" style (see
// lib/email.ts).

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

function trackLink(orderNumber: string): string {
  return `${siteUrl()}/order/track?order=${encodeURIComponent(orderNumber)}`;
}

function wrap(bodyHtml: string): string {
  return `
    <div style="font-family: Georgia, 'Times New Roman', serif; max-width: 560px; margin: 0 auto; color: #1b3a2e;">
      <p style="font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: #b08d57; margin: 0 0 4px;">
        Kusinang Pamana Catering
      </p>
      ${bodyHtml}
      <p style="margin-top: 32px; font-size: 12px; color: #6b7280;">
        Questions about your order? Just reply to this email.
      </p>
    </div>
  `;
}

export function orderPlacedEmail(data: {
  firstName: string;
  orderNumber: string;
  total: number;
  depositAmount: number;
}): { subject: string; html: string } {
  const link = trackLink(data.orderNumber);
  return {
    subject: `Order received — ${data.orderNumber}`,
    html: wrap(`
      <h1 style="font-size: 22px; margin: 8px 0;">Thank you, ${data.firstName}!</h1>
      <p>We've received your order <strong>${data.orderNumber}</strong> and it's now pending confirmation.</p>
      <p>
        Total: <strong>₱${data.total.toLocaleString()}</strong><br />
        Reservation deposit due: <strong>₱${data.depositAmount.toLocaleString()}</strong>
      </p>
      <p>You can track your order status and submit your payment any time here:</p>
      <p><a href="${link}" style="color: #1b3a2e; font-weight: bold;">${link}</a></p>
    `),
  };
}

export function paymentVerifiedEmail(data: {
  firstName: string;
  orderNumber: string;
  amount: number;
  amountPaid: number;
  total: number;
}): { subject: string; html: string } {
  const link = trackLink(data.orderNumber);
  const balance = Math.max(0, data.total - data.amountPaid);
  return {
    subject: `Payment verified — ${data.orderNumber}`,
    html: wrap(`
      <h1 style="font-size: 22px; margin: 8px 0;">Payment received, ${data.firstName}!</h1>
      <p>We've verified your payment of <strong>₱${data.amount.toLocaleString()}</strong> for order <strong>${data.orderNumber}</strong>.</p>
      <p>
        Amount paid so far: <strong>₱${data.amountPaid.toLocaleString()}</strong><br />
        Balance remaining: <strong>₱${balance.toLocaleString()}</strong>
      </p>
      <p><a href="${link}" style="color: #1b3a2e; font-weight: bold;">View your order</a></p>
    `),
  };
}

export function orderStatusChangedEmail(data: {
  firstName: string;
  orderNumber: string;
  status: string;
}): { subject: string; html: string } {
  const link = trackLink(data.orderNumber);
  return {
    subject: `Order update — ${data.orderNumber} is now "${data.status}"`,
    html: wrap(`
      <h1 style="font-size: 22px; margin: 8px 0;">Update on your order, ${data.firstName}</h1>
      <p>Order <strong>${data.orderNumber}</strong> is now: <strong>${data.status}</strong></p>
      <p><a href="${link}" style="color: #1b3a2e; font-weight: bold;">View your order</a></p>
    `),
  };
}
