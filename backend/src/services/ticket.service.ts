import { randomBytes } from "node:crypto";
import { eq, desc } from "drizzle-orm";
import { db } from "../config/database.ts";
import { orders, orderItems } from "../models/schema.ts";
import { getOrCreateUser } from "./user.service.ts";
import { logger } from "../utils/logger.ts";

const inMemoryOrders: any[] = [];

const code = (len = 6) =>
  randomBytes(len)
    .toString("base64")
    .replace(/[^A-Z0-9]/gi, "")
    .slice(0, len)
    .toUpperCase();

const isUuid = (v: unknown): v is string => typeof v === "string" && v.includes("-");

export interface CreateOrderInput {
  uid: string;
  email: string;
  eventId: string;
  eventTitle: string;
  tierId: string;
  tierName: string;
  price: number;
  quantity: number;
  selectedDate?: string;
  selectedTime?: string;
}

/** All orders (with their ticket items) for one buyer. */
export async function listOrders(uid: string) {
  try {
    return await db.query.orders.findMany({
      where: eq(orders.buyerFirebaseUid, uid),
      orderBy: desc(orders.createdAt),
      with: { items: true },
    });
  } catch (error: any) {
    logger.warn("[ticket.service] listOrders DB fallback:", error?.message);
    return inMemoryOrders.filter((o) => o.buyerFirebaseUid === uid);
  }
}

/** Create an order plus one ticket item per unit of quantity. */
export async function createOrder(input: CreateOrderInput) {
  const qty = Math.max(1, Number(input.quantity) || 1);
  const unit = Math.max(0, Number(input.price) || 0);
  const subtotal = unit * qty;
  const orderNumber = `PSK-${code(8)}`;

  try {
    const userRow = await getOrCreateUser(input.uid, input.email);

    const [order] = await db
      .insert(orders)
      .values({
        orderNumber,
        userId: isUuid(userRow?.id) ? userRow.id : null,
        buyerFirebaseUid: input.uid,
        eventId: String(input.eventId),
        eventTitle: String(input.eventTitle),
        status: "confirmed",
        subtotalKip: subtotal,
        totalKip: subtotal,
        selectedDate: input.selectedDate ? String(input.selectedDate) : null,
        selectedTime: input.selectedTime ? String(input.selectedTime) : null,
        buyerEmail: input.email,
      })
      .returning();

    const items = await db
      .insert(orderItems)
      .values(
        Array.from({ length: qty }, (_, i) => ({
          orderId: order.id,
          tierId: String(input.tierId),
          tierName: String(input.tierName),
          unitPriceKip: unit,
          ticketCode: `${orderNumber}-${i + 1}-${code(4)}`,
        })),
      )
      .returning();

    return { order, items };
  } catch (error: any) {
    logger.warn("[ticket.service] createOrder DB fallback:", error?.message);
    const order = {
      id: `mem-${inMemoryOrders.length + 1}`,
      orderNumber,
      buyerFirebaseUid: input.uid,
      eventId: String(input.eventId),
      eventTitle: String(input.eventTitle),
      status: "confirmed",
      subtotalKip: subtotal,
      totalKip: subtotal,
      selectedDate: input.selectedDate ? String(input.selectedDate) : null,
      selectedTime: input.selectedTime ? String(input.selectedTime) : null,
      createdAt: new Date().toISOString(),
      items: Array.from({ length: qty }, (_, i) => ({
        tierId: String(input.tierId),
        tierName: String(input.tierName),
        unitPriceKip: unit,
        ticketCode: `${orderNumber}-${i + 1}-${code(4)}`,
        status: "valid",
      })),
    };
    inMemoryOrders.unshift(order);
    return { order, items: order.items };
  }
}
