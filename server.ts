import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { getOrCreateUser } from "./src/db/users.ts";
import { db } from "./src/db/index.ts";
import { tickets, reviews } from "./src/db/schema.ts";
import { eq, and, desc } from "drizzle-orm";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Resolve Google Maps shortlinks (e.g., maps.app.goo.gl/...)
  app.get("/api/resolve-map-url", async (req, res) => {
    try {
      const targetUrl = req.query.url as string;
      if (!targetUrl || (!targetUrl.includes('goo.gl') && !targetUrl.includes('google.com') && !targetUrl.includes('maps'))) {
        return res.status(400).json({ error: "Invalid URL" });
      }

      const response = await fetch(targetUrl, {
        method: 'GET',
        redirect: 'follow',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      const finalUrl = response.url || targetUrl;
      
      // Extract coordinates from URL if present (e.g., @17.9628,102.6015)
      let coords: { lat: number; lng: number } | null = null;
      const coordMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (coordMatch) {
        coords = { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) };
      }

      // Extract place name if present (e.g. /maps/place/Place+Name/)
      let placeName: string | null = null;
      if (finalUrl.includes('/maps/place/')) {
        const placePart = finalUrl.split('/maps/place/')[1]?.split('/')[0];
        if (placePart) {
          placeName = decodeURIComponent(placePart.replace(/\+/g, ' '));
        }
      }

      return res.json({ resolvedUrl: finalUrl, coords, placeName });
    } catch (error: any) {
      console.warn("Failed to resolve map URL:", error?.message);
      return res.status(500).json({ error: "Failed to resolve URL" });
    }
  });

  // In-memory fallback stores when DB is unavailable
  const inMemoryTickets: any[] = [];
  const inMemoryReviews: any[] = [];

  // Register user after frontend authentication
  app.post("/api/account/sync", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { email } = req.body;
      const uid = req.user?.uid;
      if (!uid || !email) {
        return res.status(400).json({ error: "Missing uid or email" });
      }
      const user = await getOrCreateUser(uid, email);
      return res.json({ success: true, user });
    } catch (error: any) {
      console.error("Register endpoint error:", error);
      return res.status(500).json({ error: error.message || "Failed to register user" });
    }
  });

  // Get current user's tickets/bookings
  app.get("/api/tickets", requireAuth, async (req: AuthRequest, res) => {
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
      console.warn("[AI Studio] Database fetch tickets failed, returning in-memory tickets fallback:", error?.message);
      const userTickets = inMemoryTickets.filter((t) => t.userId === uid);
      return res.json({ tickets: userTickets });
    }
  });

  // Purchase a ticket/booking
  app.post("/api/tickets", requireAuth, async (req: AuthRequest, res) => {
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
      console.warn("[AI Studio] Database create ticket failed, using in-memory ticket fallback:", error?.message);
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

  // Get reviews for an event
  app.get("/api/reviews/:eventId", async (req, res) => {
    const { eventId } = req.params;
    try {
      const eventReviews = await db.select()
        .from(reviews)
        .where(eq(reviews.eventId, eventId))
        .orderBy(desc(reviews.createdAt));

      return res.json({ reviews: eventReviews });
    } catch (error: any) {
      console.warn("[AI Studio] Database fetch reviews failed, returning in-memory reviews fallback:", error?.message);
      const eventReviews = inMemoryReviews.filter((r) => r.eventId === eventId);
      return res.json({ reviews: eventReviews });
    }
  });

  // Create or update a review
  app.post("/api/reviews", requireAuth, async (req: AuthRequest, res) => {
    const uid = req.user?.uid;
    if (!uid) {
      return res.status(400).json({ error: "Unauthorized" });
    }

    const { eventId, userName, userRealName, rating, comment, date, avatarUrl } = req.body;
    if (!eventId || rating === undefined || !comment) {
      return res.status(400).json({ error: "Missing required review fields" });
    }

    const userEmail = req.user?.email || "user@example.com";
    await getOrCreateUser(uid, userEmail);

    try {
      const existing = await db.select()
        .from(reviews)
        .where(and(eq(reviews.eventId, String(eventId)), eq(reviews.userId, uid)))
        .limit(1);

      let result;
      if (existing.length > 0) {
        result = await db.update(reviews)
          .set({
            userName: String(userName || "Anonymous"),
            userRealName: userRealName ? String(userRealName) : null,
            rating: Number(rating),
            comment: typeof comment === 'object' ? JSON.stringify(comment) : String(comment),
            date: String(date || new Date().toISOString().slice(0, 10)),
            avatarUrl: avatarUrl ? String(avatarUrl) : null,
          })
          .where(eq(reviews.id, existing[0].id))
          .returning();
      } else {
        result = await db.insert(reviews)
          .values({
            eventId: String(eventId),
            userId: uid,
            userName: String(userName || "Anonymous"),
            userRealName: userRealName ? String(userRealName) : null,
            rating: Number(rating),
            comment: typeof comment === 'object' ? JSON.stringify(comment) : String(comment),
            date: String(date || new Date().toISOString().slice(0, 10)),
            avatarUrl: avatarUrl ? String(avatarUrl) : null,
          })
          .returning();
      }

      return res.json({ success: true, review: result[0] });
    } catch (error: any) {
      console.warn("[AI Studio] Database review save failed, using in-memory review fallback:", error?.message);
      const existingIdx = inMemoryReviews.findIndex((r) => r.eventId === String(eventId) && r.userId === uid);
      const revData = {
        id: existingIdx >= 0 ? inMemoryReviews[existingIdx].id : inMemoryReviews.length + 1,
        eventId: String(eventId),
        userId: uid,
        userName: String(userName || "Anonymous"),
        userRealName: userRealName ? String(userRealName) : null,
        rating: Number(rating),
        comment: typeof comment === 'object' ? JSON.stringify(comment) : String(comment),
        date: String(date || new Date().toISOString().slice(0, 10)),
        avatarUrl: avatarUrl ? String(avatarUrl) : null,
        createdAt: new Date().toISOString(),
      };
      if (existingIdx >= 0) {
        inMemoryReviews[existingIdx] = revData;
      } else {
        inMemoryReviews.unshift(revData);
      }
      return res.json({ success: true, review: revData });
    }
  });

  // --- Serve Frontend Application ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

process.on('unhandledRejection', (reason, promise) => {
  console.warn('[Server Unhandled Rejection Caught Safely]:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Server Uncaught Exception Caught Safely]:', error);
});

startServer().catch((err) => {
  console.error("Unhandled error starting server:", err);
});
