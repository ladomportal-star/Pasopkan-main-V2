import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.ts";
import { isGoogleMapsUrl } from "../src/controllers/maps.controller.ts";

const app = createApp();
afterEach(() => vi.restoreAllMocks());

describe("map link resolver only fetches Google", () => {
  it("accepts Google Maps hosts and rejects look-alikes", () => {
    for (const ok of [
      "https://maps.app.goo.gl/abc123",
      "https://goo.gl/maps/abc",
      "https://www.google.com/maps/place/Vientiane",
      "https://maps.google.com/?q=1,2",
      "https://consent.google.com/m?continue=x",
      "https://www.google.la/maps",
    ])
      expect(isGoogleMapsUrl(ok), ok).toBe(true);
    for (const bad of [
      "http://127.0.0.1/?maps",
      "http://localhost:3000/api/health?google.com",
      "http://169.254.169.254/latest/meta-data/?maps",
      "http://backend.railway.internal/maps",
      "https://google.com.evil.example/maps",
      "https://evilgoogle.com/maps",
      "https://www.google.com:8443/maps",
      "https://user:pass@www.google.com/maps",
      "file:///etc/passwd?maps",
    ])
      expect(isGoogleMapsUrl(bad), bad).toBe(false);
  });

  it("refuses internal URLs without fetching them", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const res = await request(app)
      .get("/api/resolve-map-url")
      .query({ url: "http://127.0.0.1:3000/internal?maps" });
    expect(res.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("stops when Google redirects off Google", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 302, headers: { location: "http://127.0.0.1/secret" } }),
    );
    const res = await request(app)
      .get("/api/resolve-map-url")
      .query({ url: "https://maps.app.goo.gl/abc123" });
    expect(res.status).toBe(500);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
