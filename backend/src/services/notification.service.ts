import { db } from "../config/database.ts";
import type { Prisma } from "../lib/prisma.ts";
import type { Notification } from "../generated/prisma/client.ts";
export type NotificationType = "upcomingEvent" | "ticket" | "promo" | "verified" | "system" | "noted";
export interface NewNotification {
  type?: NotificationType; title: string; titleLo?: string; message: string; messageLo?: string; data?: Record<string, string>;
}
const toApi = (row: Notification) => ({ ...row, userId: undefined, isUnread: row.readAt === null, createdAt: row.createdAt.toISOString() });
export async function createNotification(userUid: string, input: NewNotification, exec: Prisma.TransactionClient = db) {
  const user = await exec.user.upsert({ where: { authId: userUid }, create: { authId: userUid }, update: {} });
  return toApi(await exec.notification.create({ data: { ...input, userId: user.id } }));
}
const owner = (userUid: string) => ({ user: { authId: userUid } });
export async function listNotifications(userUid: string, opts: { unreadOnly?: boolean; limit: number }) {
  const [rows, unreadCount] = await Promise.all([
    db.notification.findMany({ where: { ...owner(userUid), ...(opts.unreadOnly ? { readAt: null } : {}) }, orderBy: { createdAt: "desc" }, take: opts.limit }),
    db.notification.count({ where: { ...owner(userUid), readAt: null } }),
  ]);
  return { notifications: rows.map(toApi), unreadCount };
}
export async function markRead(userUid: string, id: string) {
  const row = await db.notification.findFirst({ where: { id, ...owner(userUid) } });
  if (!row) return false;
  await db.notification.updateMany({ where: { id, ...owner(userUid), readAt: null }, data: { readAt: new Date() } });
  return true;
}
export async function markAllRead(userUid: string) {
  return (await db.notification.updateMany({ where: { ...owner(userUid), readAt: null }, data: { readAt: new Date() } })).count;
}
export async function deleteNotification(userUid: string, id: string) {
  return (await db.notification.deleteMany({ where: { id, ...owner(userUid) } })).count > 0;
}
export async function clearNotifications(userUid: string) {
  return (await db.notification.deleteMany({ where: owner(userUid) })).count;
}
