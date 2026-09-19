import React, { useState } from 'react';
import { Download, Share, PlusSquare, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useLanguage } from '../context/LanguageContext';

export const PWAInstallButton: React.FC<{ variant?: 'nav' | 'floating' | 'banner' }> = ({ variant = 'nav' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const { lang } = useLanguage();

  // Hide button if already installed as standalone PWA
  if (isInstalled) {
    return null;
  }

  // Neither installable on Chromium nor iOS
  if (!isInstallable && !isIOS) {
    return null;
  }

  const handleAction = () => {
    if (isInstallable) {
      install();
    } else if (isIOS) {
      setShowIOSModal(true);
    }
  };

  const label = lang === 'lo' ? 'ຕິດຕັ້ງແອັບ' : 'Install App';

  return (
    <>
      {variant === 'nav' && (
        <button
          id="pwa-install-nav-btn"
          onClick={handleAction}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-full text-xs font-bold shadow-sm transition-all hover:scale-105 active:scale-95 shrink-0"
          title={label}
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      )}

      {/* iOS Safari Guided Add-to-Home-Screen Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl relative text-adv-slate border border-gray-100">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <img src="/pwa-192x192.png" alt="Pasopkan" className="w-12 h-12 rounded-2xl shadow-md" />
              <div>
                <h3 className="text-base font-extrabold text-adv-slate">
                  {lang === 'lo' ? 'ຕິດຕັ້ງ Pasopkan' : 'Install Pasopkan'}
                </h3>
                <p className="text-xs text-gray-500">
                  {lang === 'lo' ? 'ເພີ່ມໃສ່ໜ້າຈໍຫຼັກ iPhone / iPad' : 'Add to iPhone / iPad Home Screen'}
                </p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-gray-600 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-orange-100 text-adv-orange flex items-center justify-center shrink-0 font-bold text-xs">
                  1
                </div>
                <div>
                  <p className="font-semibold text-adv-slate">
                    {lang === 'lo' ? 'ກົດປຸ່ມ Share (ແບ່ງປັນ)' : 'Tap the Share icon'}
                  </p>
                  <p className="text-gray-500 text-[11px] flex items-center gap-1 mt-0.5">
                    <Share className="w-3.5 h-3.5 text-blue-500 inline" />
                    {lang === 'lo' ? 'ຢູ່ແຖບລຸ່ມຂອງ Safari' : 'in Safari toolbar at the bottom'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-orange-100 text-adv-orange flex items-center justify-center shrink-0 font-bold text-xs">
                  2
                </div>
                <div>
                  <p className="font-semibold text-adv-slate">
                    {lang === 'lo' ? 'ເລື່ອນລົງແລ້ວກົດ "Add to Home Screen"' : 'Scroll and select "Add to Home Screen"'}
                  </p>
                  <p className="text-gray-500 text-[11px] flex items-center gap-1 mt-0.5">
                    <PlusSquare className="w-3.5 h-3.5 text-gray-700 inline" />
                    {lang === 'lo' ? 'ເພີ່ມໃສ່ໜ້າຈໍຫຼັກ' : 'Add to Home Screen'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-orange-100 text-adv-orange flex items-center justify-center shrink-0 font-bold text-xs">
                  3
                </div>
                <div>
                  <p className="font-semibold text-adv-slate">
                    {lang === 'lo' ? 'ກົດ "Add" (ເພີ່ມ)' : 'Tap "Add" in top-right'}
                  </p>
                  <p className="text-gray-500 text-[11px]">
                    {lang === 'lo' ? 'ເພື່ອໃຊ້ງານແບບອອບໄລນ໌ໄດ້ທັນທີ' : 'Access tickets instantly even while offline'}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="mt-5 w-full py-3 bg-adv-orange hover:bg-orange-600 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-orange-100"
            >
              {lang === 'lo' ? 'ເຂົ້າໃຈແລ້ວ' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
