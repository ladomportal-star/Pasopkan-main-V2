import React, { useState, useEffect } from 'react';
import { Link as LinkIcon, AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';

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

    // Check if it's a shortlink or google maps link that needs resolution
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
    if (resolvedEmbedSrc) return resolvedEmbedSrc;

    if (url) {
      if (url.includes('output=embed')) return url;
      
      // Handle place links
      if (url.includes('/maps/place/')) {
        const urlParts = url.split('?')[0].split('/maps/place/')[1];
        if (urlParts) {
          const placeName = urlParts.split('/')[0];
          return `https://maps.google.com/maps?q=${placeName}&t=m&z=15&ie=UTF8&iwloc=&output=embed`;
        }
      }
      
      // Handle search links
      if (url.includes('/maps/search/')) {
        const urlParts = url.split('?')[0].split('/maps/search/')[1];
        if (urlParts) {
          const placeName = urlParts.split('/')[0];
          return `https://maps.google.com/maps?q=${placeName}&t=m&z=15&ie=UTF8&iwloc=&output=embed`;
        }
      }

      return `https://maps.google.com/maps?q=${encodeURIComponent(url)}&t=m&z=15&ie=UTF8&iwloc=&output=embed`;
    }
    return `https://maps.google.com/maps?q=${encodeURIComponent(address || 'Vientiane')}&t=m&z=15&ie=UTF8&iwloc=&output=embed`;
  };

  const iframeSrc = getIframeSrc();

  if (isReadOnly) {
    return (
      <iframe 
        key={iframeSrc}
        src={iframeSrc}
        width="100%" 
        height="320" 
        style={{ border: 0 }} 
        allowFullScreen 
        loading="lazy" 
        referrerPolicy="no-referrer-when-downgrade"
        className="rounded-xl overflow-hidden bg-white"
      />
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

      <div className="rounded-[16px] h-[300px] overflow-hidden border border-gray-200 shadow-sm relative bg-gray-100 group mt-4">
        <iframe 
          key={iframeSrc}
          style={{ border: 0 }} 
          loading="lazy" 
          allowFullScreen 
          src={iframeSrc}
          className="w-[calc(100%+60px)] h-[calc(100%+120px)] -mt-[62px] -ml-[15px] -mb-[45px] -mr-[45px]"
        />
      </div>
    </div>
  );
};
