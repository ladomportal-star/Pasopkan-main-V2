import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { db } from "../config/database.ts";
import { env } from "../config/env.ts";
import type { Prisma } from "../lib/prisma.ts";
import { HttpError } from "../middlewares/error.middleware.ts";
import { isLaoMobilePhone, normalizeLaoMobilePhone } from "../utils/phone.ts";
import { sendEventSubmissionOtp, SmsHookError } from "./sms-hook.service.ts";
import { getVerifiedPhone } from "./verified-phone.service.ts";

const TTL_MS = 5 * 60_000;
const COOLDOWN_MS = 60_000;
const MAX_ATTEMPTS = 5;

export type SubmissionProof = { challengeId: string; code: string };

function digest(uid: string, phone: string, code: string) {
  if (!env.smsHook.secret) throw new HttpError(503, "Event submission OTP is not configured");
  return createHmac("sha256", env.smsHook.secret)
    .update(`event-submission-otp:v1:${uid}:${phone}:${code}`)
    .digest("hex");
}

/** Keep an existing confirmed account phone bound; otherwise verify a new phone at submission. */
export async function issueEventSubmissionOtp(uid: string, enteredPhone: string) {
  const confirmedPhone = await getVerifiedPhone(uid);
  const phone = normalizeLaoMobilePhone(enteredPhone);
  if (!isLaoMobilePhone(phone)) throw new HttpError(400, "Enter a valid Lao mobile number");
  if (confirmedPhone && phone !== confirmedPhone)
    throw new HttpError(400, "Enter the verified phone on your account");
  const user = await db.user.findUnique({ where: { authId: uid }, include: { organizer: true } });
  if (!user || user.role !== "organizer" || !user.organizer)
    throw new HttpError(403, "An approved organizer account is required");
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  const now = new Date();
  const challenge = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${user.id}::uuid FOR UPDATE`;
    const latest = await tx.eventSubmissionOtp.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });
    if (latest && now.getTime() - latest.createdAt.getTime() < COOLDOWN_MS)
      throw new HttpError(429, "Wait before requesting another OTP");
    await tx.eventSubmissionOtp.deleteMany({ where: { userId: user.id, consumedAt: null } });
    return tx.eventSubmissionOtp.create({
      data: {
        userId: user.id,
        phone,
        codeDigest: digest(uid, phone, code),
        expiresAt: new Date(now.getTime() + TTL_MS),
      },
      select: { id: true, expiresAt: true },
    });
  });
  // A transport timeout may mean the provider accepted the SMS. Retain the
  // challenge so the code can still be submitted; never automatically resend.
  try {
    await sendEventSubmissionOtp(phone, code);
    return { challengeId: challenge.id, expiresAt: challenge.expiresAt, deliveryUncertain: false };
  } catch (error) {
    if (error instanceof SmsHookError && error.uncertain)
      return { challengeId: challenge.id, expiresAt: challenge.expiresAt, deliveryUncertain: true };
    await db.eventSubmissionOtp.delete({ where: { id: challenge.id } });
    throw error;
  }
}

/** Validate without consuming: the event transaction consumes atomically. */
export async function validateSubmissionOtp(uid: string, proof?: SubmissionProof) {
  if (!proof) throw new HttpError(403, "Event submission requires a fresh phone OTP");
  const confirmedPhone = await getVerifiedPhone(uid);
  const challenge = await db.eventSubmissionOtp.findUnique({ where: { id: proof.challengeId } });
  const user = await db.user.findUnique({ where: { authId: uid }, select: { id: true } });
  if (
    !user ||
    !challenge ||
    challenge.userId !== user.id ||
    !isLaoMobilePhone(challenge.phone) ||
    (confirmedPhone !== null && challenge.phone !== confirmedPhone) ||
    challenge.consumedAt ||
    challenge.expiresAt <= new Date() ||
    challenge.attempts >= MAX_ATTEMPTS
  )
    throw new HttpError(403, "OTP expired or unavailable; request a new code");
  const expected = Buffer.from(challenge.codeDigest, "hex");
  const supplied = Buffer.from(digest(uid, challenge.phone, proof.code), "hex");
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    await db.eventSubmissionOtp.updateMany({
      where: { id: challenge.id, consumedAt: null, attempts: { lt: MAX_ATTEMPTS } },
      data: { attempts: { increment: 1 } },
    });
    throw new HttpError(403, "Invalid OTP");
  }
  return {
    id: challenge.id,
    userId: user.id,
    phone: challenge.phone,
    codeDigest: challenge.codeDigest,
  };
}

export async function consumeSubmissionOtp(
  tx: Prisma.TransactionClient,
  challenge: Awaited<ReturnType<typeof validateSubmissionOtp>>,
) {
  const now = new Date();
  const consumed = await tx.eventSubmissionOtp.updateMany({
    where: {
      id: challenge.id,
      userId: challenge.userId,
      phone: challenge.phone,
      codeDigest: challenge.codeDigest,
      consumedAt: null,
      attempts: { lt: MAX_ATTEMPTS },
      expiresAt: { gt: now },
    },
    data: { consumedAt: now },
  });
  if (consumed.count !== 1) throw new HttpError(403, "OTP expired or already used");
}
