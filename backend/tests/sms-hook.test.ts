import { createHmac, randomBytes } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => new Map<string, { payloadHash: string; status: string }>());
const deliveries = vi.hoisted(() => ({
  create: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("../src/lib/prisma.ts", () => ({ prisma: { smsHookDelivery: deliveries } }));

const key = randomBytes(32);
process.env.SUPABASE_SEND_SMS_HOOK_SECRET = `v1,whsec_${key.toString("base64")}`;
process.env.WENOVA_SMS_TOKEN = "test-token";
process.env.WENOVA_SMS_SCRIPT_ID = "";
process.env.WENOVA_SMS_HEADER = "WNV-OTP";
process.env.WENOVA_SMS_API_URL = "https://apimicroservices.wenova.fun/sms/package";
const { deliverSmsHook } = await import("../src/services/sms-hook.service.ts");

function signed(body: object, id = "msg_test_1", time = Math.floor(Date.now() / 1000)) {
  const raw = JSON.stringify(body);
  const signature = createHmac("sha256", key).update(`${id}.${time}.${raw}`).digest("base64");
  return { raw, id, time, signature: `v1,${signature}` };
}

async function postSigned(payload: ReturnType<typeof signed>, signature = payload.signature) {
  try {
    await deliverSmsHook(Buffer.from(payload.raw), {
      id: payload.id,
      timestamp: String(payload.time),
      signature,
    });
    return { status: 200, body: {} as { error?: { message: string } } };
  } catch (error) {
    return {
      status: (error as { status: number }).status,
      body: { error: { message: (error as Error).message } },
    };
  }
}

const phoneChange = {
  user: { phone: "+8562011111111" },
  sms: { phone: "+8562022222222", otp: "123456" },
};

describe("Supabase Send SMS hook -> Wenova", () => {
  beforeEach(() => {
    db.clear();
    vi.restoreAllMocks();
    deliveries.create.mockImplementation(
      async ({ data }: { data: { id: string; payloadHash: string } }) => {
        if (db.has(data.id)) throw { code: "P2002" };
        db.set(data.id, { payloadHash: data.payloadHash, status: "pending" });
      },
    );
    deliveries.findUnique.mockImplementation(
      async ({ where }: { where: { id: string } }) => db.get(where.id) ?? null,
    );
    deliveries.update.mockImplementation(async ({ where }: { where: { id: string } }) => {
      const record = db.get(where.id)!;
      record.status = "sent";
    });
    deliveries.delete.mockImplementation(async ({ where }: { where: { id: string } }) => {
      db.delete(where.id);
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { resultCode: 20000 } }),
      }),
    );
  });

  it("sends the new phone number, Supabase OTP, and package billing only once", async () => {
    const event = signed(phoneChange);
    expect((await postSigned(event)).status).toBe(200);
    const [url, options] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("https://apimicroservices.wenova.fun/sms/package");
    expect(JSON.parse(String(options?.body))).toEqual({
      header: "WNV-OTP",
      phoneNumber: "2022222222",
      message: "Pasopkan verification code: 123456",
      token: "test-token",
      usePackage: true,
    });
    expect((await postSigned(event)).status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each(["8562033334444", "+8562033334444", "02033334444", "2033334444"])(
    "accepts a valid Lao recipient in the %s format",
    async (phone) => {
      expect((await postSigned(signed({ user: { phone }, sms: { otp: "012345" } }))).status).toBe(
        200,
      );
      const [, options] = vi.mocked(fetch).mock.calls[0];
      expect(JSON.parse(String(options?.body))).toMatchObject({
        phoneNumber: "2033334444",
        message: "Pasopkan verification code: 012345",
      });
    },
  );

  it("uses the account phone when optional recipient fields are blank", async () => {
    const event = signed({
      user: { phone: "+8562033334444", phone_change: "" },
      sms: { phone: "", otp: "123456" },
    });
    expect((await postSigned(event)).status).toBe(200);
    const [, options] = vi.mocked(fetch).mock.calls[0];
    expect(JSON.parse(String(options?.body)).phoneNumber).toBe("2033334444");
  });

  it("rejects invalid signatures and stale timestamps without contacting Wenova", async () => {
    const event = signed(phoneChange);
    expect((await postSigned(event, "v1,invalid")).status).toBe(401);
    expect(
      (await postSigned(signed(phoneChange, "msg_stale", Math.floor(Date.now() / 1000) - 3600)))
        .status,
    ).toBe(401);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects malformed recipients and OTPs", async () => {
    const event = signed({ user: { phone: "+12025550123" }, sms: { otp: "123456" } });
    expect((await postSigned(event)).status).toBe(400);
    expect(
      (
        await postSigned(
          signed({ user: { phone: "+8562033334444" }, sms: { otp: "not-a-code" } }, "msg_bad_otp"),
        )
      ).status,
    ).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("does not mark a provider business error as delivered", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: false, data: { resultCode: 30105 } }),
      }),
    );
    const result = await postSigned(signed(phoneChange));
    expect(result.status).toBe(502);
    expect(result.body.error.message).toBe("SMS gateway rejected delivery");
    expect(db.size).toBe(0);
  });

  it("holds an ambiguous timeout instead of paying twice", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("timeout")));
    const event = signed(phoneChange);
    expect((await postSigned(event)).status).toBe(503);
    expect((await postSigned(event)).status).toBe(503);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(db.get(event.id)?.status).toBe("pending");
  });

  it("holds a gateway-pending response even when the outer API reports success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, code: 90001, data: { resultCode: null } }),
      }),
    );
    const event = signed(phoneChange);
    expect((await postSigned(event)).status).toBe(502);
    expect((await postSigned(event)).status).toBe(503);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(db.get(event.id)?.status).toBe("pending");
  });
});
