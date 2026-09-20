import { eq, and, desc } from "drizzle-orm";
import { db } from "../config/database.ts";
import { reviews } from "../models/schema.ts";
import { getOrCreateUser } from "./user.service.ts";

export interface UpsertReviewInput {
  uid: string;
  email?: string;
  eventId: string;
  userName?: string;
  userRealName?: string;
  rating: number;
  comment: unknown;
  date?: string;
  avatarUrl?: string;
}

export async function listReviewsByEvent(eventId: string) {
  return db
    .select()
    .from(reviews)
    .where(eq(reviews.eventId, eventId))
    .orderBy(desc(reviews.createdAt));
}

/** Create or update the current user's single review for an event. */
export async function upsertReview(input: UpsertReviewInput) {
  const reviewDate = String(input.date || new Date().toISOString().slice(0, 10));
  const commentText =
    typeof input.comment === "object" ? JSON.stringify(input.comment) : String(input.comment);
  const eventId = String(input.eventId);

  const userRow = await getOrCreateUser(input.uid, input.email);

  const common = {
    userName: String(input.userName || "Anonymous"),
    userRealName: input.userRealName ? String(input.userRealName) : null,
    rating: Number(input.rating),
    comment: commentText,
    reviewDate,
    avatarUrl: input.avatarUrl ? String(input.avatarUrl) : null,
  };

  const [existing] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.eventId, eventId), eq(reviews.authorFirebaseUid, input.uid)))
    .limit(1);

  const [row] = existing
    ? await db
        .update(reviews)
        .set({ ...common, updatedAt: new Date() })
        .where(eq(reviews.id, existing.id))
        .returning()
    : await db
        .insert(reviews)
        .values({ ...common, eventId, authorFirebaseUid: input.uid, userId: userRow.id })
        .returning();

  return row;
}
