"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { updateOrderStatus } from "@/lib/orders-data";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/orders";

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  if (!ORDER_STATUSES.includes(status)) throw new Error(`Invalid status "${status}".`);
  await updateOrderStatus(id, status);
  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${id}`);
}
