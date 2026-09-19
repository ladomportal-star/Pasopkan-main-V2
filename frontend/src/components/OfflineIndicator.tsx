import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useLanguage } from '../context/LanguageContext';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { lang } = useLanguage();

  if (isOnline) return null;

  return (
    <div 
      id="pwa-offline-banner"
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-adv-slate/95 text-white text-xs font-semibold shadow-2xl backdrop-blur-md border border-white/10 animate-bounce"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
      </span>
      <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
      <span>
        {lang === 'lo'
          ? 'ໂໝດອອຟລາຍ — ໃຊ້ງານຂໍ້ມູນທີ່ບັນທຶກໄວ້ໃນເຄື່ອງ'
          : 'Offline Mode — Using cached data & tickets'}
      </span>
    </div>
  );
};
