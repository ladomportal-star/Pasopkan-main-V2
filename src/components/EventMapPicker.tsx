import React, { useState, useEffect } from 'react';
import { ExternalLink, Link as LinkIcon, AlertTriangle, Loader2, CheckCircle2, MapPin } from 'lucide-react';

interface EventMapPickerProps {
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
}

export const EventMapPicker: React.FC<EventMapPickerProps> = ({
  address = '',
  onChangeAddress,
  province = '',
  district = '',
  isReadOnly = false,
  latitude,
  longitude,
  lang = 'en',
  googleMapUrl = '',
  onChangeGoogleMapUrl
}) => {
  const [url, setUrl] = useState(googleMapUrl);
  const [resolvedEmbedSrc, setResolvedEmbedSrc] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [resolvedSuccess, setResolvedSuccess] = useState(false);
  
  useEffect(() => {
    setUrl(googleMapUrl);
  }, [googleMapUrl]);

  // Automatically resolve Google Maps shortlinks (e.g. https://maps.app.goo.gl/...)
  useEffect(() => {
    let isMounted = true;
    if (!url || !url.trim()) {
      setResolvedEmbedSrc(null);
      setResolvedSuccess(false);
      return;
    }

    if (url.includes('goo.gl') || url.includes('maps.app.goo.gl') || url.includes('google.com/maps')) {
      setIsResolving(true);
      setResolvedSuccess(false);

      const resolveTimer = setTimeout(() => {
        fetch(`/api/resolve-map-url?url=${encodeURIComponent(url.trim())}`)
          .then(res => res.json())
          .then(data => {
            if (!isMounted) return;
            setIsResolving(false);
            if (data.coords) {
              setResolvedEmbedSrc(`https://maps.google.com/maps?q=${data.coords.lat},${data.coords.lng}&t=m&z=15&ie=UTF8&iwloc=&output=embed`);
              setResolvedSuccess(true);
              if (onChangeAddress && data.coords) {
                onChangeAddress(address, data.coords.lat, data.coords.lng);
              }
            } else if (data.placeName) {
              setResolvedEmbedSrc(`https://maps.google.com/maps?q=${encodeURIComponent(data.placeName)}&t=m&z=15&ie=UTF8&iwloc=&output=embed`);
              setResolvedSuccess(true);
            } else if (data.resolvedUrl) {
              const resUrl = data.resolvedUrl;
              const match = resUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
              if (match) {
                setResolvedEmbedSrc(`https://maps.google.com/maps?q=${match[1]},${match[2]}&t=m&z=15&ie=UTF8&iwloc=&output=embed`);
              } else if (resUrl.includes('/maps/place/')) {
                const p = resUrl.split('/maps/place/')[1]?.split('/')[0];
                if (p) {
                  setResolvedEmbedSrc(`https://maps.google.com/maps?q=${p}&t=m&z=15&ie=UTF8&iwloc=&output=embed`);
                }
              } else {
                setResolvedEmbedSrc(`https://maps.google.com/maps?q=${encodeURIComponent(resUrl)}&t=m&z=15&ie=UTF8&iwloc=&output=embed`);
              }
              setResolvedSuccess(true);
            }
          })
          .catch(() => {
            if (!isMounted) return;
            setIsResolving(false);
          });
      }, 300);

      return () => {
        isMounted = false;
        clearTimeout(resolveTimer);
      };
    } else {
      setResolvedEmbedSrc(null);
      setResolvedSuccess(false);
    }
  }, [url]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    if (onChangeGoogleMapUrl) {
      onChangeGoogleMapUrl(newUrl);
    }
  };

  const getIframeSrc = () => {
    // 1. If explicit coordinates are provided
    if (typeof latitude === 'number' && typeof longitude === 'number' && !isNaN(latitude) && !isNaN(longitude) && latitude !== 0 && longitude !== 0) {
      return `https://maps.google.com/maps?q=${latitude},${longitude}&t=m&z=15&ie=UTF8&iwloc=&output=embed`;
    }

    // 2. If resolved shortlink embed URL is available
    if (resolvedEmbedSrc) return resolvedEmbedSrc;

    // 3. Parse map URL string if available
    const activeUrl = (url || googleMapUrl || '').trim();
    if (activeUrl) {
      if (activeUrl.includes('output=embed')) return activeUrl;

      // Extract coordinates from @lat,lng
      const coordMatch = activeUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (coordMatch) {
        return `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&t=m&z=15&ie=UTF8&iwloc=&output=embed`;
      }

      // Handle place links
      if (activeUrl.includes('/maps/place/')) {
        const placePart = activeUrl.split('/maps/place/')[1]?.split('/')[0];
        if (placePart) {
          const cleanPlace = decodeURIComponent(placePart).replace(/\+/g, ' ');
          return `https://maps.google.com/maps?q=${encodeURIComponent(cleanPlace)}&t=m&z=15&ie=UTF8&iwloc=&output=embed`;
        }
      }

      // Handle search links
      if (activeUrl.includes('/maps/search/')) {
        const searchPart = activeUrl.split('/maps/search/')[1]?.split('/')[0];
        if (searchPart) {
          const cleanSearch = decodeURIComponent(searchPart).replace(/\+/g, ' ');
          return `https://maps.google.com/maps?q=${encodeURIComponent(cleanSearch)}&t=m&z=15&ie=UTF8&iwloc=&output=embed`;
        }
      }

      return `https://maps.google.com/maps?q=${encodeURIComponent(activeUrl)}&t=m&z=15&ie=UTF8&iwloc=&output=embed`;
    }

    // 4. Fallback search query based on address / location
    const searchQuery = [address, district, province].filter(Boolean).join(', ') || 'Vientiane, Laos';
    return `https://maps.google.com/maps?q=${encodeURIComponent(searchQuery)}&t=m&z=15&ie=UTF8&iwloc=&output=embed`;
  };

  const iframeSrc = getIframeSrc();

  const getMapTargetUrl = () => {
    if (typeof latitude === 'number' && typeof longitude === 'number' && !isNaN(latitude) && !isNaN(longitude) && latitude !== 0 && longitude !== 0) {
      return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    }
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      return url;
    }
    if (googleMapUrl && (googleMapUrl.startsWith('http://') || googleMapUrl.startsWith('https://'))) {
      return googleMapUrl;
    }
    const searchAddr = address || [district, province].filter(Boolean).join(', ') || 'Vientiane';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchAddr)}`;
  };

  if (isReadOnly) {
    return (
      <div className="rounded-2xl overflow-hidden border border-gray-200/90 dark:border-zinc-800 shadow-sm relative bg-gray-100 dark:bg-zinc-900 h-[210px] sm:h-[270px] lg:h-[310px] w-full group">
        {/* Open Map overlay button */}
        <a
          href={getMapTargetUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 dark:bg-zinc-900/95 hover:bg-white dark:hover:bg-zinc-800 text-adv-slate dark:text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all border border-gray-200/80 dark:border-zinc-700 backdrop-blur-md cursor-pointer group/mapbtn"
        >
          <MapPin className="w-3.5 h-3.5 text-adv-orange group-hover/mapbtn:scale-110 transition-transform" />
          <span>{lang === 'lo' ? 'ເປີດແຜນທີ່' : 'Open map'}</span>
          <ExternalLink className="w-3 h-3 text-gray-400 dark:text-gray-500 group-hover/mapbtn:text-adv-orange transition-colors" />
        </a>

        <iframe 
          key={iframeSrc}
          style={{ border: 0 }} 
          loading="lazy" 
          allowFullScreen 
          src={iframeSrc}
          title="Location Map"
          className="w-full h-full object-cover"
        />
      </div>
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
            placeholder="https://maps.app.goo.gl/..."
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
            ? 'ວາງລິ້ງ Google Maps ເພື່ອສະແດງສະຖານທີ່ໃນແຜນທີ່'
            : 'Paste a Google Maps link to preview the location'}
        </p>
      </div>

      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm relative bg-gray-100 dark:bg-zinc-900 h-[260px] sm:h-[300px] w-full group mt-4">
        {/* Open Map overlay button */}
        <a
          href={getMapTargetUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-3 left-3 z-10 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 hover:bg-white text-adv-slate rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all border border-gray-200 backdrop-blur-md cursor-pointer group/mapbtn"
        >
          <MapPin className="w-3.5 h-3.5 text-adv-orange group-hover/mapbtn:scale-110 transition-transform" />
          <span>{lang === 'lo' ? 'ເປີດແຜນທີ່' : 'Open map'}</span>
          <ExternalLink className="w-3 h-3 text-gray-400 group-hover/mapbtn:text-adv-orange transition-colors" />
        </a>

        <iframe 
          key={iframeSrc}
          style={{ border: 0 }} 
          loading="lazy" 
          allowFullScreen 
          src={iframeSrc}
          title="Location Map"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};
