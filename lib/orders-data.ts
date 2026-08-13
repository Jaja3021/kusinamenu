"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { OrderRecord, OrderStatus } from "@/lib/orders";

type OrderRow = {
  id: string;
  order_number: string;
  status: OrderStatus;
  package_slug: string;
  package_name: string;
  menu_id: string | null;
  menu_name: string | null;
  menu_snapshot: OrderRecord["menuSnapshot"];
  pax: number | null;
  quantity_label: string | null;
  cart: OrderRecord["cart"];
  packed_meal_cart: OrderRecord["packedMealCart"];
  selected_dishes: OrderRecord["selectedDishes"];
  event_type: string | null;
  event_date: string | null;
  event_time: string | null;
  venue: string | null;
  instructions: string | null;
  branch: string | null;
  delivery_time: string | null;
  delivery_method: OrderRecord["deliveryMethod"];
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  deposit_amount: number;
  amount_paid: number;
  payment_status: OrderRecord["paymentStatus"];
  created_at: string;
  updated_at: string;
};

function rowToOrder(row: OrderRow): OrderRecord {
  return {
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    packageSlug: row.package_slug,
    packageName: row.package_name,
    menuId: row.menu_id,
    menuName: row.menu_name,
    menuSnapshot: row.menu_snapshot,
    pax: row.pax,
    quantityLabel: row.quantity_label,
    cart: row.cart ?? [],
    packedMealCart: row.packed_meal_cart ?? [],
    selectedDishes: row.selected_dishes ?? {},
    eventType: row.event_type,
    eventDate: row.event_date,
    eventTime: row.event_time,
    venue: row.venue,
    instructions: row.instructions,
    branch: row.branch,
    deliveryTime: row.delivery_time,
    deliveryMethod: row.delivery_method,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    subtotal: row.subtotal,
    deliveryFee: row.delivery_fee,
    total: row.total,
    depositAmount: row.deposit_amount,
    amountPaid: row.amount_paid,
    paymentStatus: row.payment_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getOrders(): Promise<OrderRecord[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load orders: ${error.message}`);
  return (data as OrderRow[]).map(rowToOrder);
}

export async function getOrder(id: string): Promise<OrderRecord | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Failed to load order: ${error.message}`);
  return data ? rowToOrder(data as OrderRow) : null;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) throw new Error(`Failed to update order status: ${error.message}`);
}
