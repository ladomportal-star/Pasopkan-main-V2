import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Link as LinkIcon,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { apiUrl } from "../lib/api";
import { laosProvinces, getDistrictsForProvince } from "../lib/laosLocations";

interface EventMapPickerProps {
  venue?: string;
  address?: string;
  onChangeAddress?: (address: string, lat?: number, lng?: number) => void;
  province?: string;
  district?: string;
  isReadOnly?: boolean;
  latitude?: number;
  longitude?: number;
  lang?: "en" | "lo";
  googleMapUrl?: string;
  onChangeGoogleMapUrl?: (url: string) => void;
  showOpenInMapsButton?: boolean;
}

// Helper to extract clean URL from iframes, multi-word mobile share strings, or URLs missing https://
function cleanInputMapUrl(input: string): string {
  if (!input || typeof input !== "string") return "";
  let val = input.trim();
  const iframeMatch = val.match(/src=["'](https?:\/\/[^"']+)["']/i);
  if (iframeMatch) {
    return iframeMatch[1];
  }
  const urlMatch = val.match(/(https?:\/\/[^\s"'<>]+)/i);
  if (urlMatch) {
    return urlMatch[1];
  }
  const noProtoMatch = val.match(
    /^((?:maps\.app\.goo\.gl|goo\.gl\/maps|google\.com\/maps|www\.google\.com\/maps)[^\s"'<>]*)/i,
  );
  if (noProtoMatch) {
    return `https://${noProtoMatch[1]}`;
  }
  return val;
}

// Helper to extract coordinates from URL if present
function extractCoordsFromMapUrl(
  url: string,
): { lat: number; lng: number } | null {
  if (!url) return null;

  // 1. Protobuf coordinates: !3dlat!4dlng (exact place pin marker)
  const proto3d = url.match(/!3d(-?\d+\.\d+)/);
  const proto4d = url.match(/!4d(-?\d+\.\d+)/);
  if (proto3d && proto4d) {
    return { lat: parseFloat(proto3d[1]), lng: parseFloat(proto4d[1]) };
  }

  // 2. Query param coordinates: ?q=lat,lng or ?query= or ?ll=
  const coordParam = url.match(
    /[?&](?:q|query|ll|center)=(-?\d+\.\d+),(-?\d+\.\d+)/,
  );
  if (coordParam) {
    return { lat: parseFloat(coordParam[1]), lng: parseFloat(coordParam[2]) };
  }

  // 3. Fallback: Camera center coordinates @lat,lng (only if no pin coordinates)
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  }

  return null;
}

// Parses a user-provided Google Maps URL/embed code/My Maps link/coordinate string into
// a safe embed URL. Never pass an HTTP(S) URL into `q=` directly — Google Maps classic
// treats it as a deprecated KML file and errors ("Some custom on-map content...").
function parseMapEmbedUrl(rawUrl: string, lang = "en"): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  let url = cleanInputMapUrl(rawUrl);

  // 1. If it's already an official Google Maps embed or output=embed
  if (url.includes("google.com/maps/embed") || url.includes("output=embed")) {
    return url.includes("disableDefaultUI=1")
      ? url
      : `${url}&disableDefaultUI=1`;
  }

  // 2. Google My Maps (/maps/d/) -> must use /maps/d/embed?mid=...
  if (url.includes("/maps/d/")) {
    const midMatch = url.match(/[?&]mid=([^&#]+)/);
    if (midMatch) {
      return `https://www.google.com/maps/d/embed?mid=${encodeURIComponent(midMatch[1])}&disableDefaultUI=1`;
    }
    const pathMidMatch = url.match(
      /\/maps\/d\/(?:viewer|edit|embed|u\/\d+\/viewer)\?.*mid=([^&#]+)/,
    );
    if (pathMidMatch) {
      return `https://www.google.com/maps/d/embed?mid=${encodeURIComponent(pathMidMatch[1])}&disableDefaultUI=1`;
    }
  }

  // 3. Protobuf coordinates: !3dlat!4dlng (CRITICAL: exact place pin marker)
  const proto3d = url.match(/!3d(-?\d+\.\d+)/);
  const proto4d = url.match(/!4d(-?\d+\.\d+)/);
  if (proto3d && proto4d) {
    const base = `https://maps.google.com/maps?ll=${proto3d[1]},${proto4d[1]}&q=${proto3d[1]},${proto4d[1]}&hl=${lang}&z=16&output=embed`;
    return `${base}&disableDefaultUI=1`;
  }

  // 4. Parameter coordinates: ?q=lat,lng or ?query=lat,lng or ?ll=lat,lng
  const coordParam = url.match(
    /[?&](?:q|query|ll|center)=(-?\d+\.\d+),(-?\d+\.\d+)/,
  );
  if (coordParam) {
    const base = `https://maps.google.com/maps?ll=${coordParam[1]},${coordParam[2]}&q=${coordParam[1]},${coordParam[2]}&hl=${lang}&z=16&output=embed`;
    return `${base}&disableDefaultUI=1`;
  }

  // 5. Camera coordinates in URL: @lat,lng (prioritize over text search to prevent wrong-country geocoding)
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    const base = `https://maps.google.com/maps?ll=${atMatch[1]},${atMatch[2]}&q=${atMatch[1]},${atMatch[2]}&hl=${lang}&z=16&output=embed`;
    return `${base}&disableDefaultUI=1`;
  }

  // 6. Place name in path: /maps/place/<PlaceName>
  if (url.includes("/maps/place/")) {
    const placePart = url
      .split("/maps/place/")[1]
      ?.split("/")[0]
      ?.split("?")[0];
    if (placePart && !placePart.startsWith("http")) {
      let cleanName = decodeURIComponent(placePart.replace(/\+/g, " "));
      if (!cleanName.toLowerCase().includes("laos")) {
        cleanName = `${cleanName}, Laos`;
      }
      const base = `https://maps.google.com/maps?q=${encodeURIComponent(cleanName)}&hl=${lang}&z=16&output=embed`;
      return `${base}&disableDefaultUI=1`;
    }
  }

  // 7. Search in path: /maps/search/<Query>
  if (url.includes("/maps/search/")) {
    const searchPart = url
      .split("/maps/search/")[1]
      ?.split("/")[0]
      ?.split("?")[0];
    if (searchPart && !searchPart.startsWith("http")) {
      let cleanSearch = decodeURIComponent(searchPart.replace(/\+/g, " "));
      if (!cleanSearch.toLowerCase().includes("laos")) {
        cleanSearch = `${cleanSearch}, Laos`;
      }
      const base = `https://maps.google.com/maps?q=${encodeURIComponent(cleanSearch)}&hl=${lang}&z=16&output=embed`;
      return `${base}&disableDefaultUI=1`;
    }
  }

  // 8. Query param text: ?q=text or ?query=text (only if NOT an HTTP URL)
  const qParam = url.match(/[?&](?:q|query)=([^&#]+)/);
  if (qParam) {
    let val = decodeURIComponent(qParam[1].replace(/\+/g, " "));
    if (!val.startsWith("http://") && !val.startsWith("https://")) {
      if (!val.toLowerCase().includes("laos")) {
        val = `${val}, Laos`;
      }
      const base = `https://maps.google.com/maps?q=${encodeURIComponent(val)}&hl=${lang}&z=16&output=embed`;
      return `${base}&disableDefaultUI=1`;
    }
  }

  // If it is a web URL (http:// or https://) that could not be parsed synchronously,
  // DO NOT pass it to q= ! Return null to let async resolution or fallback location handle it.
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.includes("://")
  ) {
    return null;
  }

  // If the user typed a plain text place/address directly
  const query = url.toLowerCase().includes("laos") ? url : `${url}, Laos`;
  const base = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&hl=${lang}&z=16&output=embed`;
  return `${base}&disableDefaultUI=1`;
}

export const EventMapPicker: React.FC<EventMapPickerProps> = ({
  venue = "",
  address = "",
  onChangeAddress,
  province = "",
  district = "",
  isReadOnly = false,
  latitude,
  longitude,
  lang = "en",
  googleMapUrl = "",
  onChangeGoogleMapUrl,
  showOpenInMapsButton = true,
}) => {
  const [url, setUrl] = useState(googleMapUrl);
  const [resolvedEmbedSrc, setResolvedEmbedSrc] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [resolvedSuccess, setResolvedSuccess] = useState(false);
  const isResolvingRef = useRef(false);

  useEffect(() => {
    setUrl(googleMapUrl);
  }, [googleMapUrl]);

  const cleanProvince = useMemo(() => {
    if (!province) return "";
    const p = laosProvinces.find(
      (item) =>
        item.id === province ||
        item.name.toLowerCase() === province.toLowerCase() ||
        item.nameLo === province,
    );
    return p ? (lang === "lo" ? p.nameLo : p.name) : province;
  }, [province, lang]);

  const cleanDistrict = useMemo(() => {
    if (!district) return "";
    const p = laosProvinces.find(
      (item) =>
        item.id === province ||
        item.name.toLowerCase() === province.toLowerCase() ||
        item.nameLo === province,
    );
    const pId = p ? p.id : province;
    const dList = getDistrictsForProvince(pId || "");
    const d = dList.find(
      (item) =>
        item.id === district ||
        item.name.toLowerCase() === district.toLowerCase() ||
        item.nameLo === district,
    );
    return d ? (lang === "lo" ? d.nameLo : d.name) : district;
  }, [district, province, lang]);

  // Construct a safe fallback query from location props
  const fallbackQuery = useMemo(() => {
    const parts = [venue, address, cleanDistrict, cleanProvince, "Laos"].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Vientiane, Laos";
  }, [venue, address, cleanDistrict, cleanProvince]);

  // Fallback embed URL (never fails or shows KML error)
  const fallbackEmbedSrc = useMemo(() => {
    if (latitude && longitude) {
      return `https://maps.google.com/maps?ll=${latitude},${longitude}&q=${latitude},${longitude}&hl=${lang}&z=16&output=embed&disableDefaultUI=1`;
    }
    return `https://maps.google.com/maps?q=${encodeURIComponent(fallbackQuery)}&hl=${lang}&z=16&output=embed&disableDefaultUI=1`;
  }, [latitude, longitude, fallbackQuery, lang]);

  // Exact coordinates embed URL if latitude and longitude are valid numbers
  const coordsEmbedSrc = useMemo(() => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0) {
      return `https://maps.google.com/maps?ll=${lat},${lng}&q=${lat},${lng}&hl=${lang}&z=16&output=embed&disableDefaultUI=1`;
    }
    return null;
  }, [latitude, longitude, lang]);

  // Synchronously attempt to parse the URL
  const syncEmbedSrc = useMemo(() => {
    return parseMapEmbedUrl(url, lang);
  }, [url, lang]);

  // Automatically resolve Google Maps shortlinks (e.g. https://maps.app.goo.gl/...)
  useEffect(() => {
    let isMounted = true;
    const cleanUrl = cleanInputMapUrl(url);

    if (!cleanUrl) {
      setResolvedEmbedSrc(null);
      setResolvedSuccess(false);
      setIsResolving(false);
      return;
    }

    // If synchronous parsing already succeeded (e.g., coordinates, place, My Maps embed), no resolution needed
    if (syncEmbedSrc) {
      setResolvedEmbedSrc(syncEmbedSrc);
      setResolvedSuccess(true);
      setIsResolving(false);

      const syncCoords = extractCoordsFromMapUrl(cleanUrl);
      if (syncCoords && onChangeAddress) {
        onChangeAddress(address, syncCoords.lat, syncCoords.lng);
      }
      return;
    }

    // Check if it's a shortlink or Google link that needs server-side redirection resolution
    const isShortlink =
      cleanUrl.includes("goo.gl") ||
      cleanUrl.includes("maps.app.goo.gl") ||
      cleanUrl.includes("google.com/maps");

    if (isShortlink) {
      setIsResolving(true);
      isResolvingRef.current = true;
      setResolvedSuccess(false);

      const resolveTimer = setTimeout(() => {
        fetch(apiUrl(`/resolve-map-url?url=${encodeURIComponent(cleanUrl)}`))
          .then(async (res) => {
            const data = await res.json();
            if (!res.ok) {
              throw new Error(data?.error || `HTTP ${res.status}`);
            }
            return data;
          })
          .then((data) => {
            if (!isMounted) return;
            setIsResolving(false);
            isResolvingRef.current = false;

            const resData = data?.data || data;

            if (resData?.cleanEmbedUrl) {
              setResolvedEmbedSrc(resData.cleanEmbedUrl);
              setResolvedSuccess(true);
              if (onChangeAddress && resData.coords) {
                onChangeAddress(
                  address || resData.placeName || "",
                  resData.coords.lat,
                  resData.coords.lng,
                );
              }
            } else if (resData?.coords) {
              const src = `https://maps.google.com/maps?ll=${resData.coords.lat},${resData.coords.lng}&q=${resData.coords.lat},${resData.coords.lng}&hl=${lang}&z=16&output=embed&disableDefaultUI=1`;
              setResolvedEmbedSrc(src);
              setResolvedSuccess(true);
              if (onChangeAddress) {
                onChangeAddress(
                  address || resData.placeName || "",
                  resData.coords.lat,
                  resData.coords.lng,
                );
              }
            } else if (resData?.placeName) {
              const q = resData.placeName.toLowerCase().includes("laos")
                ? resData.placeName
                : `${resData.placeName}, Laos`;
              const src = `https://maps.google.com/maps?q=${encodeURIComponent(q)}&hl=${lang}&z=16&output=embed&disableDefaultUI=1`;
              setResolvedEmbedSrc(src);
              setResolvedSuccess(true);
              if (onChangeAddress && !address) {
                onChangeAddress(resData.placeName);
              }
            } else if (resData?.resolvedUrl) {
              // Try parsing the resolved URL
              const parsedAfterRedirect = parseMapEmbedUrl(
                resData.resolvedUrl,
                lang,
              );
              if (parsedAfterRedirect) {
                setResolvedEmbedSrc(parsedAfterRedirect);
                setResolvedSuccess(true);
              } else {
                // Safe fallback to venue/coordinates — NEVER pass the raw URL to q=
                setResolvedEmbedSrc(fallbackEmbedSrc);
                setResolvedSuccess(true);
              }
            } else {
              setResolvedEmbedSrc(fallbackEmbedSrc);
            }
          })
          .catch(() => {
            if (!isMounted) return;
            setIsResolving(false);
            isResolvingRef.current = false;
            // On resolution failure, safely fall back to known venue / address
            setResolvedEmbedSrc(fallbackEmbedSrc);
          });
      }, 250);

      return () => {
        isMounted = false;
        clearTimeout(resolveTimer);
      };
    } else {
      setResolvedEmbedSrc(null);
      setResolvedSuccess(false);
      setIsResolving(false);
    }
  }, [url, syncEmbedSrc, fallbackEmbedSrc, lang, address, onChangeAddress]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const cleaned = cleanInputMapUrl(rawVal);
    setUrl(cleaned);
    if (onChangeGoogleMapUrl) {
      onChangeGoogleMapUrl(cleaned);
    }
    const coords = extractCoordsFromMapUrl(cleaned);
    if (coords && onChangeAddress) {
      onChangeAddress(address, coords.lat, coords.lng);
    }
  };

  const getExternalMapUrl = () => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0) {
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }
    const cleaned = cleanInputMapUrl(url);
    if (cleaned && (cleaned.startsWith("http://") || cleaned.startsWith("https://"))) {
      return cleaned;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackQuery)}`;
  };

  const isMyMaps = useMemo(() => {
    return !!(url && url.includes("/maps/d/"));
  }, [url]);

  // Determine final safe embed source:
  // If exact coordinates are provided, prioritize coordsEmbedSrc to guarantee the marker is centered and accurate!
  // If My Maps, prioritize My Maps embed.
  const finalEmbedSrc = isMyMaps
    ? resolvedEmbedSrc || syncEmbedSrc || coordsEmbedSrc || fallbackEmbedSrc
    : coordsEmbedSrc || resolvedEmbedSrc || syncEmbedSrc || fallbackEmbedSrc;
  const externalMapLink = getExternalMapUrl();

  if (isReadOnly) {
    return (
      <a
        href={externalMapLink}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block rounded-xl sm:rounded-2xl overflow-hidden border border-gray-200/80 shadow-xs bg-gray-100 group cursor-pointer hover:border-adv-orange/30 hover:shadow-sm transition-all"
      >
        {isResolving ? (
          <div className="w-full h-[180px] sm:h-[220px] md:h-[260px] flex flex-col items-center justify-center bg-gray-50 text-gray-500 gap-2">
            <Loader2 className="w-5 h-5 text-adv-orange animate-spin" />
            <span className="text-[11px] sm:text-xs font-medium">
              {lang === "lo" ? "ກຳລັງໂຫລດແຜນທີ່..." : "Loading map location..."}
            </span>
          </div>
        ) : (
          <>
            <div className="w-full h-[180px] sm:h-[220px] md:h-[260px] relative overflow-hidden pointer-events-none flex items-center justify-center">
              <iframe
                key={finalEmbedSrc}
                src={finalEmbedSrc}
                style={{
                  border: 0,
                  width: "100%",
                  height: "100%",
                }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="bg-white block pointer-events-none max-w-none w-full h-full"
              />
            </div>
            {/* The overlay MUST intercept clicks to trigger the outer <a> tag's href, while hiding map UI controls */}
            <div className="absolute inset-0 z-10 bg-transparent group-hover:bg-black/5 transition-colors" />
          </>
        )}
      </a>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-adv-slate uppercase tracking-wider mb-2">
          {lang === "lo" ? "ລິ້ງ Google Maps" : "Google Maps Link"}
        </label>
        <div className="relative">
          <input
            type="text"
            value={url}
            onChange={handleUrlChange}
            placeholder="https://maps.app.goo.gl/... or place link"
            className="w-full pl-11 pr-10 py-3.5 bg-white border border-gray-200/80 text-adv-slate rounded-2xl focus:ring-4 focus:ring-adv-orange/15 focus:border-adv-orange outline-none transition-all font-medium text-sm shadow-sm"
          />
          <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          {isResolving && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-adv-orange animate-spin" />
          )}
          {!isResolving && resolvedSuccess && (
            <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
          )}
        </div>
        <p className="mt-2 text-xs text-gray-500 font-medium flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
          {lang === "lo"
            ? "ວາງລິ້ງ Google Maps ຫຼື My Maps ເພື່ອສະແດງສະຖານທີ່ໃນແຜນທີ່"
            : "Paste a Google Maps or My Maps link to preview the location"}
        </p>
      </div>

      <div className="rounded-[16px] h-[300px] overflow-hidden border border-gray-200 shadow-sm relative bg-gray-100 group mt-4">
        {isResolving ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-500 gap-2">
            <Loader2 className="w-6 h-6 text-adv-orange animate-spin" />
            <span className="text-xs font-medium">
              {lang === "lo"
                ? "ກຳລັງເຊື່ອມຕໍ່ສະຖານທີ່..."
                : "Resolving map link..."}
            </span>
          </div>
        ) : (
          <div className="w-full h-full relative overflow-hidden pointer-events-none flex items-center justify-center">
            <iframe
              key={finalEmbedSrc}
              style={{
                border: 0,
                width: "100%",
                height: "100%",
              }}
              loading="lazy"
              allowFullScreen
              src={finalEmbedSrc}
              className="bg-white block pointer-events-none max-w-none w-full h-full"
            />
            {/* Overlay intercepts clicks to block iframe map UI */}
            <div className="absolute inset-0 z-[5] bg-transparent" />
          </div>
        )}

        {/* Quick action to test map link in new tab */}
        {showOpenInMapsButton && (
          <div className="absolute top-2.5 right-2.5 z-10">
            <a
              href={externalMapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white/95 hover:bg-white text-adv-slate hover:text-adv-orange text-[11px] font-semibold rounded-lg shadow-sm border border-gray-200/80 backdrop-blur-xs transition-all"
            >
              <MapPin className="w-3 h-3 text-adv-orange" />
              <span>{lang === "lo" ? "ທົດສອບແຜນທີ່" : "Test Link"}</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-60" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
