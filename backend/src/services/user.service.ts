import { db } from "../config/database.ts";
import { randomInt } from "node:crypto";
import type { Prisma } from "../lib/prisma.ts";
import { assertMediaReferences } from "./media.service.ts";
export interface ProfileInput {
  firstName?: string;
  lastName?: string;
  gender?: "male" | "female" | "other";
  dateOfBirth?: string;
  avatarUrl?: string;
}
export const getOrCreateUser = (uid: string, email?: string) => upsertUserProfile(uid, {}, email);

const newPublicId = () => `P${randomInt(100_000_000, 1_000_000_000)}`;

function isPublicIdCollision(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const issue = error as { code?: string; meta?: { target?: unknown } };
  return issue.code === "P2002" && String(issue.meta?.target ?? "").includes("publicId");
}

export async function upsertUserProfile(
  uid: string,
  profile: ProfileInput,
  verifiedAuthEmail?: string,
  verifiedAuthPhone?: string,
) {
  assertMediaReferences(profile.avatarUrl, uid, "private");
  const { dateOfBirth, ...fields } = profile;
  const data = {
    ...fields,
    ...(verifiedAuthEmail
      ? {
          email: verifiedAuthEmail.trim().toLowerCase(),
          authEmail: verifiedAuthEmail.trim().toLowerCase(),
        }
      : {}),
    ...(verifiedAuthPhone ? { phone: verifiedAuthPhone.trim() } : {}),
    ...(dateOfBirth !== undefined ? { dateOfBirth: new Date(dateOfBirth) } : {}),
  };
  // The public ID is for display only. Keep the UUID/auth ID as the internal identity.
  // Existing accounts receive an ID on their next sync without overwriting their profile.
  for (let attempt = 0; attempt < 8; attempt++) {
    try {
      const user = await db.user.upsert({
        where: { authId: uid },
        create: { authId: uid, publicId: newPublicId(), ...data },
        update: data,
      });
      if (user.publicId) return user;

      await db.user.updateMany({
        where: { authId: uid, publicId: null },
        data: { publicId: newPublicId() },
      });
      return db.user.findUniqueOrThrow({ where: { authId: uid } });
    } catch (error) {
      if (!isPublicIdCollision(error) || attempt === 7) throw error;
    }
  }
  throw new Error("Could not allocate a public user ID");
}
export async function getAuthUidByPhone(phone: string) {
  return (await db.user.findUnique({ where: { phone } }))?.authId;
}
export async function getUserRole(uid: string, exec: Prisma.TransactionClient = db) {
  return (
    (await exec.user.findUnique({ where: { authId: uid }, select: { role: true } }))?.role ?? "user"
  );
}

export async function isUserSuspended(uid: string) {
  const user = await db.user.findUnique({
    where: { authId: uid },
    select: { isSuspended: true, deletedAt: true },
  });
  return Boolean(user?.isSuspended || user?.deletedAt);
}
