import { Router } from "express";
import { requireAuth, AuthRequest } from "../middleware/auth.ts";
import { getOrCreateUser } from "../db/users.ts";
import { db } from "../db/index.ts";
import { reviews } from "../db/schema.ts";
import { eq, and, desc } from "drizzle-orm";

const router = Router();

// In-memory fallback reviews storage
const inMemoryReviews: any[] = [];

const asUuid = (v: unknown) =>
  typeof v === "string" && v.includes("-") ? v : null;

// Get reviews for an event
router.get("/reviews/:eventId", async (req, res) => {
  const { eventId } = req.params;
  try {
    const eventReviews = await db
      .select()
      .from(reviews)
      .where(eq(reviews.eventId, eventId))
      .orderBy(desc(reviews.createdAt));

    return res.json({ reviews: eventReviews });
  } catch (error: any) {
    console.warn("[Reviews Route] DB fetch fallback to in-memory:", error?.message);
    return res.json({ reviews: inMemoryReviews.filter((r) => r.eventId === eventId) });
  }
});

// Create or update the current user's review for an event
router.post("/reviews", requireAuth, async (req: AuthRequest, res) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(400).json({ error: "Unauthorized" });

  const { eventId, userName, userRealName, rating, comment, date, avatarUrl } = req.body;
  if (!eventId || rating === undefined || !comment) {
    return res.status(400).json({ error: "Missing required review fields" });
  }

  const userEmail = req.user?.email || "user@example.com";
  const reviewDate = String(date || new Date().toISOString().slice(0, 10));
  const commentText = typeof comment === "object" ? JSON.stringify(comment) : String(comment);

  try {
    const userRow = await getOrCreateUser(uid, userEmail);

    const existing = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.eventId, String(eventId)), eq(reviews.authorFirebaseUid, uid)))
      .limit(1);

    let result;
    if (existing.length > 0) {
      result = await db
        .update(reviews)
        .set({
          userName: String(userName || "Anonymous"),
          userRealName: userRealName ? String(userRealName) : null,
          rating: Number(rating),
          comment: commentText,
          reviewDate,
          avatarUrl: avatarUrl ? String(avatarUrl) : null,
          updatedAt: new Date(),
        })
        .where(eq(reviews.id, existing[0].id))
        .returning();
    } else {
      result = await db
        .insert(reviews)
        .values({
          eventId: String(eventId),
          userId: asUuid(userRow?.id),
          authorFirebaseUid: uid,
          userName: String(userName || "Anonymous"),
          userRealName: userRealName ? String(userRealName) : null,
          rating: Number(rating),
          comment: commentText,
          reviewDate,
          avatarUrl: avatarUrl ? String(avatarUrl) : null,
        })
        .returning();
    }

    return res.json({ success: true, review: result[0] });
  } catch (error: any) {
    console.warn("[Reviews Route] DB insert fallback to in-memory:", error?.message);
    const idx = inMemoryReviews.findIndex(
      (r) => r.eventId === String(eventId) && r.authorFirebaseUid === uid,
    );
    const revData = {
      id: idx >= 0 ? inMemoryReviews[idx].id : `mem-${inMemoryReviews.length + 1}`,
      eventId: String(eventId),
      authorFirebaseUid: uid,
      userName: String(userName || "Anonymous"),
      userRealName: userRealName ? String(userRealName) : null,
      rating: Number(rating),
      comment: commentText,
      reviewDate,
      avatarUrl: avatarUrl ? String(avatarUrl) : null,
      createdAt: new Date().toISOString(),
    };
    if (idx >= 0) inMemoryReviews[idx] = revData;
    else inMemoryReviews.unshift(revData);
    return res.json({ success: true, review: revData });
  }
});

export default router;
