import type { Request, Response } from "express";
import { ok, fail } from "../utils/response.util.ts";
import { logger } from "../utils/logger.ts";

/** Helper to clean raw URL in controller */
function normalizeUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  let val = rawUrl.trim();
  const iframeMatch = val.match(/src=["'](https?:\/\/[^"']+)["']/i);
  if (iframeMatch) {
    val = iframeMatch[1];
  } else {
    const urlMatch = val.match(/(https?:\/\/[^\s"'<>]+)/i);
    if (urlMatch) {
      val = urlMatch[1];
    } else if (/^(?:maps\.app\.goo\.gl|goo\.gl\/maps|google\.com\/maps|www\.google\.com\/maps)/i.test(val)) {
      val = `https://${val}`;
    }
  }
  return val;
}

/** This endpoint is public and fetches the URL server-side, so it must only ever reach Google.
 *  A substring check ("contains maps") let callers point it at internal hosts. */
const GOOGLE_HOST = /^(?:[a-z0-9-]+\.)*google\.(?:com|la|co\.th|com\.vn)$/;
const SHORTLINK_HOSTS = new Set(["goo.gl", "maps.app.goo.gl"]);

export function isGoogleMapsUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  const host = url.hostname.toLowerCase();
  return (
    (url.protocol === "https:" || url.protocol === "http:") &&
    !url.username &&
    !url.password &&
    url.port === "" &&
    (SHORTLINK_HOSTS.has(host) || GOOGLE_HOST.test(host))
  );
}

/** Fetch with redirects followed by hand, re-checking that every hop stays on Google. */
async function fetchGoogle(start: string, headers: Record<string, string>) {
  let current = start;
  for (let hop = 0; hop < 6; hop++) {
    if (!isGoogleMapsUrl(current)) throw new Error("Map link redirected outside Google");
    const response = await fetch(current, {
      method: "GET",
      redirect: "manual",
      headers,
      signal: AbortSignal.timeout(8_000),
    });
    const location =
      response.status >= 300 && response.status < 400 ? response.headers.get("location") : null;
    if (!location) return { response, url: current };
    current = new URL(location, current).toString();
  }
  throw new Error("Too many map link redirects");
}

/** Resolve Google Maps shortlinks (maps.app.goo.gl/…) to coords + place name + clean embed URL. */
export async function resolveMapUrl(req: Request, res: Response) {
  try {
    const targetUrl = normalizeUrl((req.query.url as string) || "");
    if (!targetUrl || !isGoogleMapsUrl(targetUrl)) {
      return fail(res, "Invalid URL provided", 400);
    }

    // If it's already an official embed or My Maps embed, return immediately
    if (targetUrl.includes("google.com/maps/embed") || targetUrl.includes("/maps/d/embed")) {
      return ok(res, {
        resolvedUrl: targetUrl,
        coords: null,
        placeName: null,
        cleanEmbedUrl: targetUrl,
        isMyMaps: targetUrl.includes("/maps/d/"),
      });
    }

    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      "Cookie":
        "SOCS=CAISNQgDEitib3FfaWRlbnRpdHlmcm9udGVuZHVpc2VydmVyXzIwMjMwODI5LjA2X3AxGgJlbiACGgYIgLCtpgY; CONSENT=YES+1",
    };

    const first = await fetchGoogle(targetUrl, headers);
    const response = first.response;

    let finalUrl = first.url;
    let responseHtml = "";

    // Handle Google Consent redirect: https://consent.google.com/m?continue=...
    if (finalUrl.includes("consent.google.com")) {
      try {
        const u = new URL(finalUrl);
        const cont = u.searchParams.get("continue");
        if (cont && isGoogleMapsUrl(cont)) {
          finalUrl = cont;
          // Follow continue URL with consent cookies to get real Maps page
          const second = await fetchGoogle(cont, headers);
          finalUrl = second.url;
          responseHtml = await second.response.text();
        }
      } catch {
        // Consent follow-up is best effort; fall back to the first response.
      }
    } else {
      try {
        responseHtml = await response.text();
      } catch {
        // An unreadable body only means no HTML fallback is available.
      }
    }

    // Check meta refresh or canonical in HTML if still on a shortlink or consent page
    if (
      finalUrl.includes("goo.gl") ||
      finalUrl.includes("consent.google.com") ||
      !finalUrl.includes("@")
    ) {
      const metaRefreshMatch = responseHtml.match(
        /<meta[^>]*http-equiv=["']refresh["'][^>]*content=["'][^"']*url=([^"'>]+)["']/i,
      );
      if (metaRefreshMatch && metaRefreshMatch[1]) {
        let refreshUrl = metaRefreshMatch[1].trim();
        if (refreshUrl.startsWith("'") || refreshUrl.startsWith('"')) {
          refreshUrl = refreshUrl.slice(1, -1);
        }
        if (refreshUrl.includes("google.com/maps")) {
          finalUrl = refreshUrl;
        }
      }

      const canonicalMatch = responseHtml.match(
        /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i,
      );
      if (canonicalMatch && canonicalMatch[1] && canonicalMatch[1].includes("google.com/maps")) {
        finalUrl = canonicalMatch[1];
      }
    }

    // 1. Check for My Maps (/maps/d/)
    let myMapsMid: string | null = null;
    if (finalUrl.includes("/maps/d/")) {
      const midMatch = finalUrl.match(/[?&]mid=([^&#]+)/);
      if (midMatch) {
        myMapsMid = midMatch[1];
      }
    }

    // 2. Extract Coordinates from multiple formats
    // CRITICAL: Prioritize exact place pin coordinates (!3d!4d, static map markers, meta) over camera viewport center (@lat,lng)
    let coords: { lat: number; lng: number } | null = null;

    // Format A: Protobuf coordinates !3dlat and !4dlng (exact place pin marker in Google Maps)
    const proto3d =
      finalUrl.match(/!3d(-?\d+\.\d+)/) ||
      (responseHtml ? responseHtml.match(/!3d(-?\d+\.\d+)/) : null);
    const proto4d =
      finalUrl.match(/!4d(-?\d+\.\d+)/) ||
      (responseHtml ? responseHtml.match(/!4d(-?\d+\.\d+)/) : null);
    if (proto3d && proto4d) {
      coords = { lat: parseFloat(proto3d[1]), lng: parseFloat(proto4d[1]) };
    }

    // Format B: Google static map markers in meta tags (og:image / itemprop="image")
    if (!coords && responseHtml) {
      const markerMatch =
        responseHtml.match(/markers=(-?\d+\.\d+)%2C(-?\d+\.\d+)/i) ||
        responseHtml.match(/markers=(-?\d+\.\d+),(-?\d+\.\d+)/i);
      if (markerMatch) {
        coords = { lat: parseFloat(markerMatch[1]), lng: parseFloat(markerMatch[2]) };
      }
    }

    // Format C: Standard schema itemprop latitude/longitude or geo.position
    if (!coords && responseHtml) {
      const itemLat =
        responseHtml.match(/itemprop=["']latitude["'][^>]*content=["'](-?\d+\.\d+)["']/i) ||
        responseHtml.match(/content=["'](-?\d+\.\d+)["'][^>]*itemprop=["']latitude["']/i);
      const itemLng =
        responseHtml.match(/itemprop=["']longitude["'][^>]*content=["'](-?\d+\.\d+)["']/i) ||
        responseHtml.match(/content=["'](-?\d+\.\d+)["'][^>]*itemprop=["']longitude["']/i);
      if (itemLat && itemLng) {
        coords = { lat: parseFloat(itemLat[1]), lng: parseFloat(itemLng[1]) };
      }
    }

    // Format D: Explicit parameter coordinates: ?q=lat,lng or ?query=lat,lng or ?ll=lat,lng
    if (!coords) {
      const paramCoordMatch = finalUrl.match(
        /[?&](?:q|query|ll|center)=(-?\d+\.\d+),(-?\d+\.\d+)/,
      );
      if (paramCoordMatch) {
        coords = { lat: parseFloat(paramCoordMatch[1]), lng: parseFloat(paramCoordMatch[2]) };
      }
    }

    // Format E: [null,null,lat,lng] in Google Maps script state
    if (!coords && responseHtml) {
      const arrayCoordMatch = responseHtml.match(/\[null,null,(-?\d+\.\d+),(-?\d+\.\d+)\]/);
      if (arrayCoordMatch) {
        coords = { lat: parseFloat(arrayCoordMatch[1]), lng: parseFloat(arrayCoordMatch[2]) };
      }
    }

    // Format F: Fallback to @lat,lng (camera viewport center - only if no pin coordinates found)
    if (!coords) {
      const atMatch =
        finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) ||
        (responseHtml ? responseHtml.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) : null);
      if (atMatch) {
        coords = { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
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

    // Fallback placeName from HTML title / og:title
    if (!placeName && responseHtml) {
      const titleMatch =
        responseHtml.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
        responseHtml.match(/<title>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        const extractedTitle = titleMatch[1].replace(/ - Google Maps/i, "").trim();
        if (
          extractedTitle &&
          !extractedTitle.toLowerCase().includes("google maps") &&
          !extractedTitle.toLowerCase().includes("before you continue")
        ) {
          placeName = extractedTitle;
        }
      }
    }

    // 4. Build cleanEmbedUrl (CRITICAL: Never pass an HTTP/HTTPS URL into q=!)
    let cleanEmbedUrl: string | null = null;
    if (myMapsMid) {
      cleanEmbedUrl = `https://www.google.com/maps/d/embed?mid=${encodeURIComponent(myMapsMid)}`;
    } else if (coords) {
      cleanEmbedUrl = `https://maps.google.com/maps?ll=${coords.lat},${coords.lng}&q=${coords.lat},${coords.lng}&z=16&output=embed`;
    } else if (placeName) {
      const q = placeName.toLowerCase().includes("laos") ? placeName : `${placeName}, Laos`;
      cleanEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=16&output=embed`;
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
