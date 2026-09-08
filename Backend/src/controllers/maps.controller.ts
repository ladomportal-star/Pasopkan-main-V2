import type { Request, Response } from "express";
import { ok, fail } from "../utils/response.util.ts";
import { logger } from "../utils/logger.ts";

/** Resolve Google Maps shortlinks (maps.app.goo.gl/…) to coords + place name + clean embed URL. */
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

    // 1. Check for My Maps (/maps/d/)
    let myMapsMid: string | null = null;
    if (finalUrl.includes("/maps/d/")) {
      const midMatch = finalUrl.match(/[?&]mid=([^&#]+)/);
      if (midMatch) {
        myMapsMid = midMatch[1];
      }
    }

    // 2. Extract Coordinates from multiple formats
    let coords: { lat: number; lng: number } | null = null;
    
    // Format A: @lat,lng
    const atMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      coords = { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
    }

    // Format B: !3dlat!4dlng (protobuf format in modern Google Maps URLs)
    if (!coords) {
      const protoMatch = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
      if (protoMatch) {
        coords = { lat: parseFloat(protoMatch[1]), lng: parseFloat(protoMatch[2]) };
      }
    }

    // Format C: ?q=lat,lng or ?query=lat,lng or ?ll=lat,lng
    if (!coords) {
      const paramCoordMatch = finalUrl.match(/[?&](?:q|query|ll|center)=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (paramCoordMatch) {
        coords = { lat: parseFloat(paramCoordMatch[1]), lng: parseFloat(paramCoordMatch[2]) };
      }
    }

    // 3. Extract Place Name
    let placeName: string | null = null;
    if (finalUrl.includes("/maps/place/")) {
      const placePart = finalUrl.split("/maps/place/")[1]?.split("/")[0]?.split("?")[0];
      if (placePart && !placePart.startsWith("http")) {
        placeName = decodeURIComponent(placePart.replace(/\+/g, " "));
      }
    } else if (finalUrl.includes("/maps/search/")) {
      const searchPart = finalUrl.split("/maps/search/")[1]?.split("/")[0]?.split("?")[0];
      if (searchPart && !searchPart.startsWith("http")) {
        placeName = decodeURIComponent(searchPart.replace(/\+/g, " "));
      }
    }

    // 4. Build cleanEmbedUrl (CRITICAL: Never pass an HTTP/HTTPS URL into q=!)
    let cleanEmbedUrl: string | null = null;
    if (myMapsMid) {
      cleanEmbedUrl = `https://www.google.com/maps/d/embed?mid=${encodeURIComponent(myMapsMid)}`;
    } else if (coords) {
      cleanEmbedUrl = `https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=15&output=embed`;
    } else if (placeName) {
      cleanEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(placeName)}&z=15&output=embed`;
    }

    return ok(res, {
      resolvedUrl: finalUrl,
      coords,
      placeName,
      cleanEmbedUrl,
      isMyMaps: !!myMapsMid,
    });
  } catch (error: any) {
    logger.warn("[maps.controller] failed to resolve map URL:", error?.message);
    return fail(res, "Failed to resolve URL", 500);
  }
}
