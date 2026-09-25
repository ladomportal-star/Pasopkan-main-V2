import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link as LinkIcon, AlertTriangle, Loader2, CheckCircle2, MapPin, ExternalLink } from 'lucide-react';

interface EventMapPickerProps {
  venue?: string;
  address?: string;
  onChangeAddress?: (address: string, lat?: number, lng?: number) => void;
  province?: string;
  district?: string;
  isReadOnly?: boolean;
  latitude?: number;
  longitude?: number;
  lang?: 'en' | 'lo';
  googleMapUrl?: string;
  onChangeGoogleMapUrl?: (url: string) => void;
  showOpenInMapsButton?: boolean;
}

// Parses a user-provided Google Maps URL/embed code/My Maps link/coordinate string into
// a safe embed URL. Never pass an HTTP(S) URL into `q=` directly — Google Maps classic
// treats it as a deprecated KML file and errors ("Some custom on-map content...").
function parseMapEmbedUrl(rawUrl: string, lang = 'en'): string | null {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  let url = rawUrl.trim();

  // 1. If user pasted an <iframe> embed snippet from Google Maps
  const iframeMatch = url.match(/src=["'](https?:\/\/[^"']+)["']/i);
  if (iframeMatch) {
    url = iframeMatch[1];
  }

  // 2. If it's already an official Google Maps embed or output=embed
  if (url.includes('google.com/maps/embed') || url.includes('output=embed')) {
    return url.includes('disableDefaultUI=1') ? url : `${url}&disableDefaultUI=1`;
  }

  // 3. Google My Maps (/maps/d/) -> must use /maps/d/embed?mid=...
  if (url.includes('/maps/d/')) {
    const midMatch = url.match(/[?&]mid=([^&#]+)/);
    if (midMatch) {
      return `https://www.google.com/maps/d/embed?mid=${encodeURIComponent(midMatch[1])}&disableDefaultUI=1`;
    }
    const pathMidMatch = url.match(/\/maps\/d\/(?:viewer|edit|embed|u\/\d+\/viewer)\?.*mid=([^&#]+)/);
    if (pathMidMatch) {
      return `https://www.google.com/maps/d/embed?mid=${encodeURIComponent(pathMidMatch[1])}&disableDefaultUI=1`;
    }
  }

  // 4. Coordinates: @lat,lng
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
      const base = `https://maps.google.com/maps?q=${atMatch[1]},${atMatch[2]}&hl=${lang}&z=15&output=embed`;
      return `${base}&disableDefaultUI=1`;
    }
  
    // 5. Protobuf coordinates: !3dlat!4dlng
    const protoMatch = url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    if (protoMatch) {
      const base = `https://maps.google.com/maps?q=${protoMatch[1]},${protoMatch[2]}&hl=${lang}&z=15&output=embed`;
      return `${base}&disableDefaultUI=1`;
    }
  
    // 6. Parameter coordinates: ?q=lat,lng or ?query=lat,lng or ?ll=lat,lng
    const coordParam = url.match(/[?&](?:q|query|ll|center)=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordParam) {
      const base = `https://maps.google.com/maps?q=${coordParam[1]},${coordParam[2]}&hl=${lang}&z=15&output=embed`;
      return `${base}&disableDefaultUI=1`;
    }
  
    // 7. Place name in path: /maps/place/<PlaceName>
    if (url.includes('/maps/place/')) {
      const placePart = url.split('/maps/place/')[1]?.split('/')[0]?.split('?')[0];
      if (placePart && !placePart.startsWith('http')) {
        const cleanName = decodeURIComponent(placePart.replace(/\+/g, ' '));
        const base = `https://maps.google.com/maps?q=${encodeURIComponent(cleanName)}&hl=${lang}&z=15&output=embed`;
        return `${base}&disableDefaultUI=1`;
      }
    }
  
    // 8. Search in path: /maps/search/<Query>
    if (url.includes('/maps/search/')) {
      const searchPart = url.split('/maps/search/')[1]?.split('/')[0]?.split('?')[0];
      if (searchPart && !searchPart.startsWith('http')) {
        const cleanQuery = decodeURIComponent(searchPart.replace(/\+/g, ' '));
        const base = `https://maps.google.com/maps?q=${encodeURIComponent(cleanQuery)}&hl=${lang}&z=15&output=embed`;
        return `${base}&disableDefaultUI=1`;
      }
    }
  
    // 9. Query param text: ?q=text or ?query=text (only if NOT an HTTP URL)
    const qParam = url.match(/[?&](?:q|query)=([^&#]+)/);
    if (qParam) {
      const val = decodeURIComponent(qParam[1].replace(/\+/g, ' '));
      if (!val.startsWith('http://') && !val.startsWith('https://')) {
        const base = `https://maps.google.com/maps?q=${encodeURIComponent(val)}&hl=${lang}&z=15&output=embed`;
        return `${base}&disableDefaultUI=1`;
      }
    }
  
    // If it is a web URL (http:// or https://) that could not be parsed synchronously,
    // DO NOT pass it to q= ! Return null to let async resolution or fallback location handle it.
    if (url.startsWith('http://') || url.startsWith('https://') || url.includes('://')) {
      return null;
    }
  
    // If the user typed a plain text place/address directly
    const base = `https://maps.google.com/maps?q=${encodeURIComponent(url)}&hl=${lang}&z=15&output=embed`;
    return `${base}&disableDefaultUI=1`;
}

export const EventMapPicker: React.FC<EventMapPickerProps> = ({
  venue = '',
  address = '',
  onChangeAddress,
  province = '',
  district = '',
  isReadOnly = false,
  latitude,
  longitude,
  lang = 'en',
  googleMapUrl = '',
  onChangeGoogleMapUrl,
  showOpenInMapsButton = true
}) => {
  const [url, setUrl] = useState(googleMapUrl);
  const [resolvedEmbedSrc, setResolvedEmbedSrc] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [resolvedSuccess, setResolvedSuccess] = useState(false);
  const isResolvingRef = useRef(false);
  
  useEffect(() => {
    setUrl(googleMapUrl);
  }, [googleMapUrl]);

  // Construct a safe fallback query from location props
  const fallbackQuery = useMemo(() => {
    const parts = [venue, address, district, province, 'Laos'].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Vientiane, Laos';
  }, [venue, address, district, province]);

  // Fallback embed URL (never fails or shows KML error)
  const fallbackEmbedSrc = useMemo(() => {
    if (latitude && longitude) {
      return `https://maps.google.com/maps?q=${latitude},${longitude}&hl=${lang}&z=15&output=embed&disableDefaultUI=1`;
    }
    return `https://maps.google.com/maps?q=${encodeURIComponent(fallbackQuery)}&hl=${lang}&z=15&output=embed&disableDefaultUI=1`;
  }, [latitude, longitude, fallbackQuery, lang]);

  // Synchronously attempt to parse the URL
  const syncEmbedSrc = useMemo(() => {
    return parseMapEmbedUrl(url, lang);
  }, [url, lang]);

  // Automatically resolve Google Maps shortlinks (e.g. https://maps.app.goo.gl/...)
  useEffect(() => {
    let isMounted = true;
    const cleanUrl = url?.trim();

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
      return;
    }

    // Check if it's a shortlink or Google link that needs server-side redirection resolution
    const isShortlink = cleanUrl.includes('goo.gl') || 
                        cleanUrl.includes('maps.app.goo.gl') || 
                        cleanUrl.includes('google.com/maps');

    if (isShortlink) {
      setIsResolving(true);
      isResolvingRef.current = true;
      setResolvedSuccess(false);

      const resolveTimer = setTimeout(() => {
        fetch(`/api/resolve-map-url?url=${encodeURIComponent(cleanUrl)}`)
          .then(res => res.json())
          .then(data => {
            if (!isMounted) return;
            setIsResolving(false);
            isResolvingRef.current = false;

            const resData = data?.data || data;

            if (resData?.cleanEmbedUrl) {
              setResolvedEmbedSrc(resData.cleanEmbedUrl);
              setResolvedSuccess(true);
              if (onChangeAddress && resData.coords) {
                onChangeAddress(address, resData.coords.lat, resData.coords.lng);
              }
            } else if (resData?.coords) {
              const src = `https://maps.google.com/maps?q=${resData.coords.lat},${resData.coords.lng}&hl=${lang}&z=15&output=embed&disableDefaultUI=1`;
              setResolvedEmbedSrc(src);
              setResolvedSuccess(true);
              if (onChangeAddress) {
                onChangeAddress(address, resData.coords.lat, resData.coords.lng);
              }
            } else if (resData?.placeName) {
              const src = `https://maps.google.com/maps?q=${encodeURIComponent(resData.placeName)}&hl=${lang}&z=15&output=embed&disableDefaultUI=1`;
              setResolvedEmbedSrc(src);
              setResolvedSuccess(true);
            } else if (resData?.resolvedUrl) {
              // Try parsing the resolved URL
              const parsedAfterRedirect = parseMapEmbedUrl(resData.resolvedUrl, lang);
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
    const newUrl = e.target.value;
    setUrl(newUrl);
    if (onChangeGoogleMapUrl) {
      onChangeGoogleMapUrl(newUrl);
    }
  };

  const getExternalMapUrl = () => {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      return url;
    }
    if (latitude && longitude) {
      return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackQuery)}`;
  };

  // Determine final safe embed source
  const finalEmbedSrc = resolvedEmbedSrc || syncEmbedSrc || fallbackEmbedSrc;
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
          <div className="w-full h-[140px] sm:h-[180px] md:h-[220px] flex flex-col items-center justify-center bg-gray-50 text-gray-500 gap-2">
            <Loader2 className="w-5 h-5 text-adv-orange animate-spin" />
            <span className="text-[11px] sm:text-xs font-medium">
              {lang === 'lo' ? 'ກຳລັງໂຫລດແຜນທີ່...' : 'Loading map location...'}
            </span>
          </div>
        ) : (
          <>
            <div className="w-full h-[140px] sm:h-[180px] md:h-[220px] relative overflow-hidden pointer-events-none flex items-center justify-center">
              <iframe 
                key={finalEmbedSrc}
                src={finalEmbedSrc}
                style={{ 
                  border: 0, 
                  width: 'calc(100% + 120px)', 
                  height: 'calc(100% + 120px)', 
                  position: 'absolute',
                  top: '-60px',
                  left: '-60px',
                }} 
                allowFullScreen 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                className="bg-white block pointer-events-none max-w-none"
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
          {lang === 'lo' ? 'ລິ້ງ Google Maps' : 'Google Maps Link'}
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
          {lang === 'lo' 
            ? 'ວາງລິ້ງ Google Maps ຫຼື My Maps ເພື່ອສະແດງສະຖານທີ່ໃນແຜນທີ່'
            : 'Paste a Google Maps or My Maps link to preview the location'}
        </p>
      </div>

      <div className="rounded-[16px] h-[300px] overflow-hidden border border-gray-200 shadow-sm relative bg-gray-100 group mt-4">
        {isResolving ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-500 gap-2">
            <Loader2 className="w-6 h-6 text-adv-orange animate-spin" />
            <span className="text-xs font-medium">
              {lang === 'lo' ? 'ກຳລັງເຊື່ອມຕໍ່ສະຖານທີ່...' : 'Resolving map link...'}
            </span>
          </div>
        ) : (
          <div className="w-full h-full relative overflow-hidden pointer-events-none flex items-center justify-center">
            <iframe 
              key={finalEmbedSrc}
              style={{ 
                border: 0,
                width: 'calc(100% + 150px)', 
                height: 'calc(100% + 150px)', 
                position: 'absolute',
                top: '-75px',
                left: '-75px'
              }} 
              loading="lazy" 
              allowFullScreen 
              src={finalEmbedSrc}
              className="bg-white block pointer-events-none max-w-none"
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
            <span>{lang === 'lo' ? 'ທົດສອບແຜນທີ່' : 'Test Link'}</span>
            <ExternalLink className="w-2.5 h-2.5 opacity-60" />
          </a>
        </div>
        )}
      </div>
    </div>
  );
};
