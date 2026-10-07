import { db } from "../config/database.ts";
import type { Prisma } from "../lib/prisma.ts";
import { assertMediaReferences } from "./media.service.ts";
export interface ProfileInput {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  gender?: "male" | "female" | "other";
  dateOfBirth?: string;
  avatarUrl?: string;
}
export const getOrCreateUser = (uid: string, email?: string) => upsertUserProfile(uid, { email });
export async function upsertUserProfile(uid: string, profile: ProfileInput) {
  assertMediaReferences(profile.avatarUrl, uid, "private");
  const { dateOfBirth, ...fields } = profile;
  const data = {
    ...fields,
    ...(dateOfBirth !== undefined ? { dateOfBirth: new Date(dateOfBirth) } : {}),
  };
  return db.user.upsert({ where: { authId: uid }, create: { authId: uid, ...data }, update: data });
}
export async function getAuthUidByPhone(phone: string) {
  return (await db.user.findUnique({ where: { phone } }))?.authId;
}
export async function getUserRole(uid: string, exec: Prisma.TransactionClient = db) {
  return (
    (await exec.user.findUnique({ where: { authId: uid }, select: { role: true } }))?.role ?? "user"
  );
}
