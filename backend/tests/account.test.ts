import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.ts";
import { db } from "../src/config/database.ts";
import { as } from "./helpers/auth.ts";

const app = createApp();

describe("account profile", () => {
  it("assigns a stable, distinct short public ID without changing the private auth ID", async () => {
    const firstAuth = await as("public-id-first");
    const secondAuth = await as("public-id-second");
    const first = await request(app).post("/api/account/sync").set(firstAuth).send({});
    const second = await request(app).post("/api/account/sync").set(secondAuth).send({});
    const again = await request(app).post("/api/account/sync").set(firstAuth).send({
      firstName: "Mali",
    });

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(again.status).toBe(200);
    expect(first.body.user.publicId).toMatch(/^P\d{9}$/);
    expect(second.body.user.publicId).toMatch(/^P\d{9}$/);
    expect(second.body.user.publicId).not.toBe(first.body.user.publicId);
    expect(again.body.user.publicId).toBe(first.body.user.publicId);
    expect(again.body.user.authId).toBe("public-id-first");
    expect(again.body.user.firstName).toBe("Mali");
  });

  it("backfills an existing account on its next sync", async () => {
    await db.user.upsert({
      where: { authId: "existing-public-id-user" },
      create: { authId: "existing-public-id-user", firstName: "Noy" },
      update: { publicId: null },
    });
    const response = await request(app)
      .post("/api/account/sync")
      .set(await as("existing-public-id-user"))
      .send({});
    expect(response.status).toBe(200);
    expect(response.body.user.publicId).toMatch(/^P\d{9}$/);
    expect(response.body.user.firstName).toBe("Noy");
  });
});
