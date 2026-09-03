import { eq, and, desc } from "drizzle-orm";
import { db } from "../config/database.ts";
import { reviews } from "../models/schema.ts";
import { getOrCreateUser } from "./user.service.ts";
import { logger } from "../utils/logger.ts";

const inMemoryReviews: any[] = [];

const asUuid = (v: unknown) => (typeof v === "string" && v.includes("-") ? v : null);

export interface UpsertReviewInput {
  uid: string;
  email: string;
  eventId: string;
  userName?: string;
  userRealName?: string;
  rating: number;
  comment: unknown;
  date?: string;
  avatarUrl?: string;
}

export async function listReviewsByEvent(eventId: string) {
  try {
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.eventId, eventId))
      .orderBy(desc(reviews.createdAt));
  } catch (error: any) {
    logger.warn("[review.service] list DB fallback:", error?.message);
    return inMemoryReviews.filter((r) => r.eventId === eventId);
  }
}

/** Create or update the current user's single review for an event. */
export async function upsertReview(input: UpsertReviewInput) {
  const reviewDate = String(input.date || new Date().toISOString().slice(0, 10));
  const commentText =
    typeof input.comment === "object" ? JSON.stringify(input.comment) : String(input.comment);
  const eventId = String(input.eventId);

  try {
    const userRow = await getOrCreateUser(input.uid, input.email);

    const existing = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.eventId, eventId), eq(reviews.authorFirebaseUid, input.uid)))
      .limit(1);

    const common = {
      userName: String(input.userName || "Anonymous"),
      userRealName: input.userRealName ? String(input.userRealName) : null,
      rating: Number(input.rating),
      comment: commentText,
      reviewDate,
      avatarUrl: input.avatarUrl ? String(input.avatarUrl) : null,
    };

    const [row] =
      existing.length > 0
        ? await db
            .update(reviews)
            .set({ ...common, updatedAt: new Date() })
            .where(eq(reviews.id, existing[0].id))
            .returning()
        : await db
            .insert(reviews)
            .values({ ...common, eventId, authorFirebaseUid: input.uid, userId: asUuid(userRow?.id) })
            .returning();

    return row;
  } catch (error: any) {
    logger.warn("[review.service] upsert DB fallback:", error?.message);
    const idx = inMemoryReviews.findIndex(
      (r) => r.eventId === eventId && r.authorFirebaseUid === input.uid,
    );
    const revData = {
      id: idx >= 0 ? inMemoryReviews[idx].id : `mem-${inMemoryReviews.length + 1}`,
      eventId,
      authorFirebaseUid: input.uid,
      userName: String(input.userName || "Anonymous"),
      userRealName: input.userRealName ? String(input.userRealName) : null,
      rating: Number(input.rating),
      comment: commentText,
      reviewDate,
      avatarUrl: input.avatarUrl ? String(input.avatarUrl) : null,
      createdAt: new Date().toISOString(),
    };
    if (idx >= 0) inMemoryReviews[idx] = revData;
    else inMemoryReviews.unshift(revData);
    return revData;
  }
}
