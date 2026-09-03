import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Facebook, Instagram, Youtube, Phone, Mail, MapPin } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { getContactSettings, ContactSettings, DEFAULT_CONTACT_SETTINGS } from '../lib/siteSettings';
import SEO from '../components/SEO';

// Adding a simple TikTok SVG since lucide doesn't have it natively
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/>
  </svg>
);

const translations = {
  en: {
    connectWithUs: 'Connect With Us',
    socialDesc: 'Follow our social media channels for the latest updates on events, exclusive offers, and more.',
    dropLine: 'Or drop us a line directly',
    chatWhatsApp: 'Chat on WhatsApp',
    ourOffice: 'Our Office',
    emailUs: 'Email Us',
    generalInquiries: 'For general inquiries:',
    callUs: 'Call Us',
    workHours: 'Mon-Fri from 8:00am to 5:00pm.',
    organizerSupport: 'Event Organizer Support',
    organizerSupportDesc: 'Are you an event organizer looking to partner with us or need assistance with your existing events?',
    contactPartner: 'Contact Partner Support',
  },
  lo: {
    connectWithUs: 'ເຊື່ອມຕໍ່ກັບພວກເຮົາ',
    socialDesc: 'ຕິດຕາມຊ່ອງທາງສື່ສັງຄົມຂອງພວກເຮົາສຳລັບການອັບເດດລ່າສຸດກ່ຽວກັບ event, ຂໍ້ສະເໜີພິເສດ ແລະ ອື່ນໆ.',
    dropLine: 'ຫຼື ສົ່ງຂໍ້ຄວາມຫາພວກເຮົາໂດຍກົງ',
    chatWhatsApp: 'ແຊັດຜ່ານ WhatsApp',
    ourOffice: 'ຫ້ອງການຂອງພວກເຮົາ',
    emailUs: 'ສົ່ງອີເມວຫາພວກເຮົາ',
    generalInquiries: 'ສຳລັບການສອບຖາມທົ່ວໄປ:',
    callUs: 'ໂທຫາພວກເຮົາ',
    workHours: 'ຈັນ-ສຸກ ເວລາ 8:00 ເຊົ້າ ຫາ 5:00 ແລງ.',
    organizerSupport: 'ຝ່າຍຊ່ວຍເຫຼືອຜູ້ຈັດງານ',
    organizerSupportDesc: 'ທ່ານເປັນຜູ້ຈັດງານທີ່ຕ້ອງການຮ່ວມມືກັບພວກເຮົາ ຫຼື ຕ້ອງການຄວາມຊ່ວຍເຫຼືອກ່ຽວກັບ event ຂອງທ່ານບໍ?',
    contactPartner: 'ຕິດຕໍ່ຝ່າຍຊ່ວຍເຫຼືອຄູ່ຄ້າ',
  }
};

export default function Contact() {
  const { lang } = useLanguage();
  const t = translations[lang as keyof typeof translations] || translations.en;
  
  const [settings, setSettings] = useState<ContactSettings>(DEFAULT_CONTACT_SETTINGS);

  useEffect(() => {
    const loadSettings = async () => {
      const data = await getContactSettings();
      setSettings(data);
    };
    loadSettings();
  }, []);

  const contactUs = lang === 'en' ? settings.contactUs_en : settings.contactUs_lo;
  const contactDesc = lang === 'en' ? settings.contactDesc_en : settings.contactDesc_lo;
  const officeAddress1 = lang === 'en' ? settings.officeAddress1_en : settings.officeAddress1_lo;
  const officeAddress2 = lang === 'en' ? settings.officeAddress2_en : settings.officeAddress2_lo;

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <SEO
        title={contactUs || (lang === 'lo' ? 'ຕິດຕໍ່ພວກເຮົາ' : 'Contact Us')}
        description={contactDesc || 'Get in touch with the Pasopkan support and partner team in Laos.'}
        keywords={['Contact Pasopkan', 'Event Organizer Support Laos', 'Pasopkan Office Vientiane']}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 uppercase tracking-tight mb-4 drop-shadow-xs"
          >
            {contactUs}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-500 max-w-2xl mx-auto text-lg font-medium"
          >
            {contactDesc}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          
          {/* Social Links Form (Connect With Us) */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-8 sm:p-10 rounded-3xl border border-gray-200/80 shadow-xl relative overflow-hidden"
          >
            {/* Decorative blob */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/5 blur-[60px] rounded-full pointer-events-none" />

            <h2 className="text-2xl font-bold text-adv-slate mb-6">{t.connectWithUs}</h2>
            <p className="text-gray-500 mb-8 font-medium">
              {t.socialDesc}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {settings.facebook && (
                <a 
                  href={settings.facebook} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 bg-gray-50/80 hover:bg-gray-100/80 p-4 rounded-2xl border border-gray-200/80 hover:border-[#1877F2]/50 transition-all group shadow-2xs"
                >
                  <div className="w-12 h-12 bg-[#1877F2]/10 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Facebook className="w-6 h-6 text-[#1877F2]" />
                  </div>
                  <div>
                    <h3 className="text-adv-slate font-semibold">Facebook</h3>
                    <p className="text-xs text-gray-400">@pasopkan</p>
                  </div>
                </a>
              )}

              {settings.instagram && (
                <a 
                  href={settings.instagram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 bg-gray-50/80 hover:bg-gray-100/80 p-4 rounded-2xl border border-gray-200/80 hover:border-[#E4405F]/50 transition-all group shadow-2xs"
                >
                  <div className="w-12 h-12 bg-[#E4405F]/10 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Instagram className="w-6 h-6 text-[#E4405F]" />
                  </div>
                  <div>
                    <h3 className="text-adv-slate font-semibold">Instagram</h3>
                    <p className="text-xs text-gray-400">@pasopkan</p>
                  </div>
                </a>
              )}

              {settings.tiktok && (
                <a 
                  href={settings.tiktok} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 bg-gray-50/80 hover:bg-gray-100/80 p-4 rounded-2xl border border-gray-200/80 hover:border-black/50 transition-all group shadow-2xs"
                >
                  <div className="w-12 h-12 bg-black/5 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <TikTokIcon className="w-6 h-6 text-black" />
                  </div>
                  <div>
                    <h3 className="text-adv-slate font-semibold">TikTok</h3>
                    <p className="text-xs text-gray-400">@pasopkans</p>
                  </div>
                </a>
              )}

              {settings.youtube && (
                <a 
                  href={settings.youtube} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 bg-gray-50/80 hover:bg-gray-100/80 p-4 rounded-2xl border border-gray-200/80 hover:border-[#FF0000]/50 transition-all group shadow-2xs"
                >
                  <div className="w-12 h-12 bg-[#FF0000]/10 rounded-full flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Youtube className="w-6 h-6 text-[#FF0000]" />
                  </div>
                  <div>
                    <h3 className="text-adv-slate font-semibold">YouTube</h3>
                    <p className="text-xs text-gray-400">Pasopkan</p>
                  </div>
                </a>
              )}
            </div>
            
            {settings.whatsapp && (
              <div className="mt-8 pt-8 border-t border-gray-100">
                <h3 className="text-adv-slate font-semibold mb-4">{t.dropLine}</h3>
                <a 
                  href={settings.whatsapp} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold transition-all shadow-md hover:shadow-emerald-500/25 active:scale-[0.98]"
                >
                  <Phone className="w-5 h-5" />
                  {t.chatWhatsApp} ({settings.phone})
                </a>
              </div>
            )}
          </motion.div>

          {/* Contact Details & Info */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-8"
          >
            <div className="flex gap-6 items-start">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-100 shadow-2xs">
                <MapPin className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-adv-slate mb-2">{t.ourOffice}</h3>
                <p className="text-gray-600 mb-1">{officeAddress1}</p>
                <p className="text-sm text-gray-400">{officeAddress2}</p>
              </div>
            </div>

            {settings.email && (
              <div className="flex gap-6 items-start">
                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center shrink-0 border border-green-100 shadow-2xs">
                  <Mail className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-adv-slate mb-2">{t.emailUs}</h3>
                  <p className="text-gray-500 mb-1">{t.generalInquiries}</p>
                  <a href={`mailto:${settings.email}`} className="text-emerald-600 hover:text-emerald-500 font-bold transition-colors">
                    {settings.email}
                  </a>
                </div>
              </div>
            )}

            {settings.phone && (
              <div className="flex gap-6 items-start">
                <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center shrink-0 border border-teal-100 shadow-2xs">
                  <Phone className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-adv-slate mb-2">{t.callUs}</h3>
                  <p className="text-gray-500 mb-1">{t.workHours}</p>
                  <p className="text-emerald-600 font-bold">
                    {settings.phone}
                  </p>
                </div>
              </div>
            )}

            <div className="p-6 rounded-2xl bg-gradient-to-br from-teal-50/80 via-emerald-50/80 to-green-50/80 border border-emerald-100/80 mt-8 relative overflow-hidden shadow-xs">
               <div className="absolute top-0 right-0 p-4 opacity-5 text-emerald-800">
                 <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
               </div>
               <h3 className="text-lg font-bold text-adv-slate mb-2 relative z-10">{t.organizerSupport}</h3>
               <p className="text-gray-600 text-sm mb-4 relative z-10">
                 {t.organizerSupportDesc}
               </p>
               <a 
                 href={`mailto:${settings.email || 'ladomportal@gmail.com'}`}
                 className="inline-flex items-center text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors relative z-10"
               >
                 {t.contactPartner} &rarr;
               </a>
            </div>

          </motion.div>

        </div>
      </div>
    </div>
  );
}
