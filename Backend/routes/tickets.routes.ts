import { Router } from "express";
import { randomBytes } from "node:crypto";
import { requireAuth, AuthRequest } from "../middleware/auth.ts";
import { getOrCreateUser } from "../db/users.ts";
import { db } from "../db/index.ts";
import { orders, orderItems } from "../db/schema.ts";
import { eq, desc } from "drizzle-orm";

const router = Router();

// In-memory fallback when the cloud database is unavailable
const inMemoryOrders: any[] = [];

const code = (len = 6) =>
  randomBytes(len)
    .toString("base64")
    .replace(/[^A-Z0-9]/gi, "")
    .slice(0, len)
    .toUpperCase();

// GET /api/tickets — current user's orders (each with its ticket items)
router.get("/tickets", requireAuth, async (req: AuthRequest, res) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(400).json({ error: "Unauthorized" });

  try {
    const rows = await db.query.orders.findMany({
      where: eq(orders.buyerFirebaseUid, uid),
      orderBy: desc(orders.createdAt),
      with: { items: true },
    });
    return res.json({ tickets: rows });
  } catch (error: any) {
    console.warn("[Tickets Route] DB fetch fallback to in-memory:", error?.message);
    return res.json({ tickets: inMemoryOrders.filter((o) => o.buyerFirebaseUid === uid) });
  }
});

// POST /api/tickets — create an order + one ticket item per quantity
router.post("/tickets", requireAuth, async (req: AuthRequest, res) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(400).json({ error: "Unauthorized" });

  const { eventId, eventTitle, tierId, tierName, price, quantity, selectedDate, selectedTime } =
    req.body;
  if (!eventId || !eventTitle || !tierId || !tierName || quantity === undefined) {
    return res.status(400).json({ error: "Missing required booking details" });
  }

  const qty = Math.max(1, Number(quantity) || 1);
  const unit = Math.max(0, Number(price) || 0);
  const subtotal = unit * qty;
  const orderNumber = `PSK-${code(8)}`;
  const userEmail = req.user?.email || "user@example.com";

  try {
    const userRow = await getOrCreateUser(uid, userEmail);

    const [order] = await db
      .insert(orders)
      .values({
        orderNumber,
        userId: typeof userRow?.id === "string" && userRow.id.includes("-") ? userRow.id : null,
        buyerFirebaseUid: uid,
        eventId: String(eventId),
        eventTitle: String(eventTitle),
        status: "confirmed",
        subtotalKip: subtotal,
        totalKip: subtotal,
        selectedDate: selectedDate ? String(selectedDate) : null,
        selectedTime: selectedTime ? String(selectedTime) : null,
        buyerEmail: userEmail,
      })
      .returning();

    const items = await db
      .insert(orderItems)
      .values(
        Array.from({ length: qty }, (_, i) => ({
          orderId: order.id,
          tierId: String(tierId),
          tierName: String(tierName),
          unitPriceKip: unit,
          ticketCode: `${orderNumber}-${i + 1}-${code(4)}`,
        })),
      )
      .returning();

    return res.json({ success: true, order, items });
  } catch (error: any) {
    console.warn("[Tickets Route] DB insert fallback to in-memory:", error?.message);
    const order = {
      id: `mem-${inMemoryOrders.length + 1}`,
      orderNumber,
      buyerFirebaseUid: uid,
      eventId: String(eventId),
      eventTitle: String(eventTitle),
      status: "confirmed",
      subtotalKip: subtotal,
      totalKip: subtotal,
      selectedDate: selectedDate ? String(selectedDate) : null,
      selectedTime: selectedTime ? String(selectedTime) : null,
      createdAt: new Date().toISOString(),
      items: Array.from({ length: qty }, (_, i) => ({
        tierId: String(tierId),
        tierName: String(tierName),
        unitPriceKip: unit,
        ticketCode: `${orderNumber}-${i + 1}-${code(4)}`,
        status: "valid",
      })),
    };
    inMemoryOrders.unshift(order);
    return res.json({ success: true, order, items: order.items });
  }
});

export default router;
