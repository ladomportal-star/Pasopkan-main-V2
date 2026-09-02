import { Router } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth.ts";
import { getOrCreateUser } from "../db/users.ts";
import { db } from "../db/index.ts";
import { tickets } from "../db/schema.ts";
import { eq, desc } from "drizzle-orm";

const router = Router();

// In-memory fallback tickets storage when cloud database is unavailable
const inMemoryTickets: any[] = [];

// Get current user's purchased tickets
router.get("/tickets", requireAuth, async (req: AuthRequest, res) => {
  const uid = req.user?.uid;
  if (!uid) {
    return res.status(400).json({ error: "Unauthorized" });
  }

  try {
    const userTickets = await db.select()
      .from(tickets)
      .where(eq(tickets.userId, uid))
      .orderBy(desc(tickets.createdAt));
      
    return res.json({ tickets: userTickets });
  } catch (error: any) {
    console.warn("[Tickets Route] DB fetch fallback to in-memory:", error?.message);
    const userTickets = inMemoryTickets.filter((t) => t.userId === uid);
    return res.json({ tickets: userTickets });
  }
});

// Create new ticket booking
router.post("/tickets", requireAuth, async (req: AuthRequest, res) => {
  const uid = req.user?.uid;
  if (!uid) {
    return res.status(400).json({ error: "Unauthorized" });
  }

  const { eventId, eventTitle, tierId, tierName, price, quantity, selectedDate, selectedTime } = req.body;
  if (!eventId || !eventTitle || !tierId || !tierName || quantity === undefined) {
    return res.status(400).json({ error: "Missing required booking details" });
  }

  const userEmail = req.user?.email || "user@example.com";
  await getOrCreateUser(uid, userEmail);

  try {
    const result = await db.insert(tickets)
      .values({
        userId: uid,
        eventId: String(eventId),
        eventTitle: String(eventTitle),
        tierId: String(tierId),
        tierName: String(tierName),
        price: Number(price) || 0,
        quantity: Number(quantity),
        selectedDate: selectedDate ? String(selectedDate) : null,
        selectedTime: selectedTime ? String(selectedTime) : null,
        status: "confirmed",
      })
      .returning();

    return res.json({ success: true, ticket: result[0] });
  } catch (error: any) {
    console.warn("[Tickets Route] DB insert fallback to in-memory:", error?.message);
    const newTicket = {
      id: inMemoryTickets.length + 1,
      userId: uid,
      eventId: String(eventId),
      eventTitle: String(eventTitle),
      tierId: String(tierId),
      tierName: String(tierName),
      price: Number(price) || 0,
      quantity: Number(quantity),
      selectedDate: selectedDate ? String(selectedDate) : null,
      selectedTime: selectedTime ? String(selectedTime) : null,
      status: "confirmed",
      createdAt: new Date().toISOString(),
    };
    inMemoryTickets.unshift(newTicket);
    return res.json({ success: true, ticket: newTicket });
  }
});

export default router;
