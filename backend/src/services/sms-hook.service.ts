import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../config/env.ts";
import { prisma } from "../lib/prisma.ts";
import { logger } from "../utils/logger.ts";

export class SmsHookError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

type HookHeaders = { id?: string; timestamp?: string; signature?: string };
type HookPayload = {
  user?: { phone?: unknown; phone_change?: unknown };
  sms?: { phone?: unknown; otp?: unknown };
};

function signingKeys(secret: string): Buffer[] {
  return secret
    .split("|")
    .map((part) => part.trim().replace(/^v1,/, ""))
    .filter((part) => /^whsec_[A-Za-z0-9+/]+={0,2}$/.test(part))
    .map((part) => Buffer.from(part.slice("whsec_".length), "base64"))
    .filter((key) => key.length >= 24);
}

/** Verify Standard Webhooks using the unmodified body, before JSON parsing. */
export function verifySmsHook(
  body: Buffer,
  headers: HookHeaders,
  secret: string,
  now = Date.now(),
) {
  const { id, timestamp, signature } = headers;
  if (!id || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) return false;
  if (!timestamp || !/^\d{10}$/.test(timestamp)) return false;
  const seconds = Number(timestamp);
  if (!Number.isSafeInteger(seconds) || Math.abs(now - seconds * 1000) > 5 * 60_000) return false;
  if (!signature) return false;

  const signed = Buffer.concat([Buffer.from(`${id}.${timestamp}.`), body]);
  const provided = signature
    .split(/\s+/)
    .filter((part) => /^v1,[A-Za-z0-9+/]+={0,2}$/.test(part))
    .map((part) => Buffer.from(part.slice(3), "base64"));

  for (const key of signingKeys(secret)) {
    const expected = createHmac("sha256", key).update(signed).digest();
    if (
      provided.some((value) => value.length === expected.length && timingSafeEqual(value, expected))
    )
      return true;
  }
  return false;
}

function parsePayload(body: Buffer) {
  let payload: HookPayload;
  try {
    payload = JSON.parse(body.toString("utf8")) as HookPayload;
  } catch {
    throw new SmsHookError(400, "Invalid SMS hook payload");
  }
  // sms.phone is the actual recipient for phone_change; user.phone may still be the old number.
  const recipient = payload.sms?.phone ?? payload.user?.phone_change ?? payload.user?.phone;
  const match = typeof recipient === "string" && /^\+856(20\d{8})$/.exec(recipient);
  const otp = payload.sms?.otp;
  if (!match || typeof otp !== "string" || !/^\d{4,10}$/.test(otp)) {
    throw new SmsHookError(400, "Invalid SMS hook payload");
  }
  return { phoneNumber: match[1], otp };
}

function checkedConfig() {
  const { secret, wenovaToken, wenovaScriptId, header, apiUrl } = env.smsHook;
  const scriptId = !wenovaToken && wenovaScriptId ? Number(wenovaScriptId) : undefined;
  if (
    !signingKeys(secret).length ||
    (!wenovaToken && !scriptId) ||
    (!wenovaToken && wenovaScriptId && (!Number.isSafeInteger(scriptId) || (scriptId ?? 0) <= 0)) ||
    !/^[A-Za-z0-9_-]{2,32}$/.test(header) ||
    !apiUrl.startsWith("https://")
  ) {
    throw new SmsHookError(503, "SMS delivery is not configured");
  }
  return { secret, wenovaToken, scriptId, header, apiUrl };
}

class WenovaExplicitRejection extends SmsHookError {}

async function sendThroughWenova(
  phoneNumber: string,
  otp: string,
  config: ReturnType<typeof checkedConfig>,
) {
  const body = {
    header: config.header,
    phoneNumber,
    message: `Pasopkan verification code: ${otp}`,
    ...(config.wenovaToken ? { token: config.wenovaToken } : { scriptId: config.scriptId }),
    usePackage: true,
  };
  let response: Response;
  try {
    response = await fetch(config.apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3200), // Supabase HTTP hooks have a 5-second deadline.
    });
  } catch {
    // The gateway might have accepted the request before a timeout. Do not automatically resend.
    throw new SmsHookError(503, "SMS gateway response is uncertain");
  }

  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new SmsHookError(502, "SMS gateway response is uncertain");
  }
  const envelope = result as { success?: unknown; code?: unknown; data?: { resultCode?: unknown } };
  const resultCode = envelope?.data?.resultCode;
  if (response.ok && envelope?.success === true && Number(resultCode) === 20000) return;

  // Explicit Wenova business errors may be retried after configuration/balance is fixed.
  const code = Number(resultCode ?? envelope?.code);
  const hasGatewayResult = resultCode !== null && resultCode !== undefined;
  const explicitlyRejected =
    (hasGatewayResult && Number.isInteger(code) && code !== 20000) ||
    envelope?.success === false ||
    (response.status >= 400 && response.status < 500);
  if (explicitlyRejected) {
    if (Number.isInteger(code)) logger.warn({ code }, "Wenova rejected SMS hook delivery");
    throw new WenovaExplicitRejection(code === 30501 ? 429 : 502, "SMS gateway rejected delivery");
  }
  // A pending/unknown response must not be treated as delivered or retried automatically.
  throw new SmsHookError(502, "SMS gateway response is uncertain");
}

/** Signed, idempotent Supabase Auth SMS delivery. Never store or log the OTP. */
export async function deliverSmsHook(body: Buffer, headers: HookHeaders) {
  const config = checkedConfig();
  if (!verifySmsHook(body, headers, config.secret)) {
    throw new SmsHookError(401, "Invalid SMS hook signature");
  }
  const { phoneNumber, otp } = parsePayload(body);
  const id = headers.id!;
  // Keyed digest prevents offline guessing of a short OTP if the database is exposed.
  const payloadHash = createHmac("sha256", signingKeys(config.secret)[0])
    .update(body)
    .digest("hex");

  try {
    await prisma.smsHookDelivery.create({ data: { id, payloadHash } });
  } catch (error) {
    if ((error as { code?: string }).code !== "P2002") throw error;
    const previous = await prisma.smsHookDelivery.findUnique({ where: { id } });
    if (previous?.payloadHash === payloadHash && previous.status === "sent") return;
    throw new SmsHookError(503, "SMS hook delivery already in progress or needs review");
  }

  try {
    await sendThroughWenova(phoneNumber, otp, config);
    await prisma.smsHookDelivery.update({
      where: { id },
      data: { status: "sent", completedAt: new Date() },
    });
  } catch (error) {
    if (error instanceof WenovaExplicitRejection) {
      await prisma.smsHookDelivery.delete({ where: { id } });
    }
    // On timeout/ambiguous response, retain 'pending' to prevent duplicate paid SMS.
    throw error;
  }
}
