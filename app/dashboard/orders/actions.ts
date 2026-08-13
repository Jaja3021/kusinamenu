"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { getOrder, updateOrderStatus } from "@/lib/orders-data";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/orders";
import { sendEmail } from "@/lib/email";
import { orderStatusChangedEmail } from "@/lib/email-templates";

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  if (!ORDER_STATUSES.includes(status)) throw new Error(`Invalid status "${status}".`);

  const order = await getOrder(id);
  await updateOrderStatus(id, status);
  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${id}`);

  if (order && order.status !== status) {
    after(() =>
      sendEmail({
        to: order.email,
        ...orderStatusChangedEmail({ firstName: order.firstName, orderNumber: order.orderNumber, status }),
      })
    );
  }
}
