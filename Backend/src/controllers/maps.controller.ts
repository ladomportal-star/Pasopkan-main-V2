import type { Request, Response } from "express";
import { ok, fail } from "../utils/response.util.ts";
import { logger } from "../utils/logger.ts";

/** Resolve Google Maps shortlinks (maps.app.goo.gl/…) to coords + place name. */
export async function resolveMapUrl(req: Request, res: Response) {
  try {
    const targetUrl = req.query.url as string;
    if (
      !targetUrl ||
      (!targetUrl.includes("goo.gl") &&
        !targetUrl.includes("google.com") &&
        !targetUrl.includes("maps"))
    ) {
      return fail(res, "Invalid URL provided", 400);
    }

    const response = await fetch(targetUrl, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    const finalUrl = response.url || targetUrl;

    let coords: { lat: number; lng: number } | null = null;
    const coordMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordMatch) {
      coords = { lat: parseFloat(coordMatch[1]), lng: parseFloat(coordMatch[2]) };
    }

    let placeName: string | null = null;
    if (finalUrl.includes("/maps/place/")) {
      const placePart = finalUrl.split("/maps/place/")[1]?.split("/")[0];
      if (placePart) placeName = decodeURIComponent(placePart.replace(/\+/g, " "));
    }

    return ok(res, { resolvedUrl: finalUrl, coords, placeName });
  } catch (error: any) {
    logger.warn("[maps.controller] failed to resolve map URL:", error?.message);
    return fail(res, "Failed to resolve URL", 500);
  }
}
