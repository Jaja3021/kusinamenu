"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getPayment, setPaymentStatus } from "@/lib/payments-data";
import { getOrder } from "@/lib/orders-data";
import { sendEmail } from "@/lib/email";
import { paymentVerifiedEmail } from "@/lib/email-templates";

async function revalidatePaymentViews(orderId: string) {
  revalidatePath("/dashboard/payments");
  revalidatePath(`/dashboard/orders/${orderId}`);
  revalidatePath("/dashboard/orders");
}

export async function verifyPaymentAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const payment = await getPayment(id);
  if (!payment) throw new Error("Payment not found.");
  await setPaymentStatus(id, "Verified");
  await revalidatePaymentViews(payment.orderId);

  // Read the order AFTER setPaymentStatus so amountPaid reflects the
  // trigger-recomputed total (supabase/payments.sql §5), not the
  // pre-verification snapshot.
  const order = await getOrder(payment.orderId);
  if (order) {
    after(() =>
      sendEmail({
        to: order.email,
        ...paymentVerifiedEmail({
          firstName: order.firstName,
          orderNumber: order.orderNumber,
          amount: payment.amount,
          amountPaid: order.amountPaid,
          total: order.total,
        }),
      })
    );
  }
}

export async function rejectPaymentAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const payment = await getPayment(id);
  if (!payment) throw new Error("Payment not found.");
  await setPaymentStatus(id, "Rejected", note || undefined);
  await revalidatePaymentViews(payment.orderId);
}
