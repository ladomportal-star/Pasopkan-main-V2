import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "../config/database.ts";
import { notifications } from "../models/schema.ts";

/** `db` or a transaction handle, so a notification can commit atomically with the change that caused it. */
type Executor = Pick<typeof db, "insert" | "select" | "update" | "delete">;

export type NotificationType = (typeof notifications.$inferInsert)["type"];

export interface NewNotification {
  type?: NotificationType;
  title: string;
  titleLo?: string;
  message: string;
  messageLo?: string;
  /** Deep-link context, e.g. { eventId, orderId } */
  data?: Record<string, string>;
}

/** Shape the frontend consumes: `isUnread` derived from `read_at`. */
const toApi = (row: typeof notifications.$inferSelect) => ({
  id: row.id,
  type: row.type,
  title: row.title,
  titleLo: row.titleLo ?? undefined,
  message: row.message,
  messageLo: row.messageLo ?? undefined,
  data: row.data ?? undefined,
  isUnread: row.readAt === null,
  createdAt: row.createdAt.toISOString(),
});

/** Create a notification for one user. Pass a transaction to commit it with the triggering change. */
export async function createNotification(
  userUid: string,
  input: NewNotification,
  exec: Executor = db,
) {
  const [row] = await exec
    .insert(notifications)
    .values({ ...input, userUid, type: input.type ?? "system" })
    .returning();
  return toApi(row);
}

export async function listNotifications(userUid: string, opts: { unreadOnly?: boolean; limit: number }) {
  const where = opts.unreadOnly
    ? and(eq(notifications.userUid, userUid), isNull(notifications.readAt))
    : eq(notifications.userUid, userUid);

  const [rows, [{ unread }]] = await Promise.all([
    db.select().from(notifications).where(where).orderBy(desc(notifications.createdAt)).limit(opts.limit),
    db
      .select({ unread: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userUid, userUid), isNull(notifications.readAt))),
  ]);

  return { notifications: rows.map(toApi), unreadCount: unread };
}

/** Mark one of the caller's notifications read. Returns false if it isn't theirs / doesn't exist. */
export async function markRead(userUid: string, id: string) {
  const rows = await db
    .update(notifications)
    .set({ readAt: sql`coalesce(${notifications.readAt}, now())` })
    .where(and(eq(notifications.id, id), eq(notifications.userUid, userUid)))
    .returning({ id: notifications.id });
  return rows.length > 0;
}

export async function markAllRead(userUid: string) {
  const rows = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userUid, userUid), isNull(notifications.readAt)))
    .returning({ id: notifications.id });
  return rows.length;
}

export async function deleteNotification(userUid: string, id: string) {
  const rows = await db
    .delete(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.userUid, userUid)))
    .returning({ id: notifications.id });
  return rows.length > 0;
}

export async function clearNotifications(userUid: string) {
  const rows = await db
    .delete(notifications)
    .where(eq(notifications.userUid, userUid))
    .returning({ id: notifications.id });
  return rows.length;
}
