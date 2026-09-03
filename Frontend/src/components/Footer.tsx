import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube, Mail, Phone, MapPin, Ticket, X, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import Logo from './Logo';
import { 
  getTermsSettings, 
  getPrivacySettings, 
  getContactSettings,
  TermsSettings, 
  PrivacySettings, 
  ContactSettings,
  DEFAULT_TERMS_SETTINGS, 
  DEFAULT_PRIVACY_SETTINGS,
  DEFAULT_CONTACT_SETTINGS
} from '../lib/siteSettings';

const translations = {
  en: {
    tagline: 'Your gateway to the best events and experiences. Discover, book, and enjoy.',
    categories: 'Categories',
    company: 'Company',
    supportContact: 'Support & Contact us',
    about: 'About Us',
    contact: 'Contact Us',
    help: 'Help Center',
    privacy: 'Privacy Policy',
    terms: 'Terms & Conditions',
    allRights: 'All rights reserved.',
    weAccept: 'Accepted Payments',
    sports: 'Adventure and Tour',
    festivals: 'Festivals',
    workshops: 'Workshops',
    concerts: 'Concerts',
    vouchers: 'Voucher and Booking',
    admin: 'Admin Portal'
  },
  lo: {
    tagline: 'ປະຕູສູ່ກິດຈະກຳ และ ປະສົບການທີ່ດີທີ່ສຸດ. ຄົ້ນພົບ, ຈອງ, ແລະ ມ່ວນຊື່ນ.',
    categories: 'ປະເພດ',
    company: 'ບໍລິສັດ',
    supportContact: 'ຊ່ວຍເຫຼືອ & ຕິດຕໍ່ພວກເຮົາ',
    about: 'ກ່ຽວກັບພວກເຮົາ',
    contact: 'ຕິດຕໍ່ພວກເຮົາ',
    help: 'ສູນຊ່ວຍເຫຼືອ',
    privacy: 'ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ',
    terms: 'ເງື່ອນໄຂການນຳໃຊ້',
    allRights: 'ສະຫງວນລິຂະສິດ.',
    weAccept: 'ຊ່ອງທາງການຊຳລະເງິນ',
    sports: 'ການຜະຈົນໄພ ແລະ ທ່ອງທ່ຽວ',
    festivals: 'ເທດສະການ',
    workshops: 'ເວີກຊອບ',
    concerts: 'ຄອນເສີດ',
    vouchers: 'Voucher ແລະ ການຈອງ',
    admin: 'ລະບົບແອດມິນ'
  }
};

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

const VisaIcon = () => (
  <svg className="h-5 w-auto text-gray-400 hover:text-[#1A1F71] transition-colors" viewBox="0 0 24 24" fill="currentColor" width="36" height="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.021 15.35h1.905L13.12 7.74h-1.905l-1.194 7.61zm6.064-7.406c-.464-.187-1.196-.388-2.096-.388-2.203 0-3.754 1.135-3.764 2.748-.014 1.197 1.11 1.864 1.954 2.263.865.412 1.157.674 1.154 1.042-.005.565-.702.823-1.353.823-.902 0-1.383-.131-2.115-.439l-.297-.135-.316 1.895c.53.235 1.512.44 2.457.45 2.342 0 3.863-1.117 3.882-2.848.01-.95-.584-1.674-1.867-2.264-.78-.384-1.258-.642-1.255-1.033.003-.356.41-.736 1.294-.736.715-.013 1.233.15 1.63.313l.194.088.313-1.848zm4.493-.204h-1.77c-.547 0-.959.155-1.198.71l-3.394 7.838h2.002l.399-1.071h2.443l.23 1.071h1.761l-1.523-7.548zm-1.635 5.163l.799-2.124.457 2.124h-1.256zM3.422 7.74L1.46 15.35h1.964l1.961-7.61H3.422z" />
  </svg>
);

const MastercardIcon = () => (
  <svg className="h-5 w-auto text-gray-400 hover:text-[#EB001B] transition-colors" viewBox="0 0 24 24" fill="currentColor" width="36" height="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 15.3a4.5 4.5 0 0 0 0-6.6 4.5 4.5 0 0 0 0 6.6z" opacity="0.8" />
    <path d="M8.2 15.3A4.5 4.5 0 1 1 12 8.7a4.5 4.5 0 0 0 0 6.6 4.5 4.5 0 0 1-3.8 0z" />
    <path d="M15.8 15.3a4.5 4.5 0 0 0 0-6.6 4.5 4.5 0 1 1 0 6.6z" />
  </svg>
);

const WeChatPayIcon = () => (
  <svg className="h-5 w-auto text-gray-400 hover:text-[#09B83E] transition-colors" viewBox="0 0 24 24" fill="currentColor" width="36" height="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.5 14.5c0-2.3 2.1-4.2 4.8-4.2s4.8 1.9 4.8 4.2c0 2.3-2.1 4.2-4.8 4.2-.6 0-1.2-.1-1.8-.3l-1.8.9.4-1.7c-.9-.8-1.6-1.9-1.6-3.1zm9.5-6c0-2.8-2.6-5-5.8-5-3.2 0-5.8 2.2-5.8 5 0 1.5.8 2.9 2 3.8l-.5 2 2.2-1.1c.6.2 1.3.3 2.1.3 3.2 0 5.8-2.2 5.8-5zm-8.8.2c-.3 0-.6-.3-.6-.6s.3-.6.6-.6.6.3.6.6-.3.6-.6.6zm3.5 0c-.3 0-.6-.3-.6-.6s.3-.6.6-.6.6.3.6.6-.3.6-.6.6zm-1.8 7.3c-.2 0-.4-.2-.4-.4s.2-.4.4-.4.4.2.4.4-.2.4-.4.4zm2.5 0c-.2 0-.4-.2-.4-.4s.2-.4.4-.4.4.2.4.4-.2.4-.4.4z" />
  </svg>
);

const AlipayIcon = () => (
  <svg className="h-5 w-auto text-gray-400 hover:text-[#00A0E9] transition-colors" viewBox="0 0 24 24" fill="currentColor" width="36" height="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.2 13.8c-.8.5-1.9.8-3 .8-2 0-3.2-1.1-3.2-2.7 0-1.9 1.6-3 3.6-3 1.1 0 2 .2 2.6.5v-.5c0-1.1-.6-1.7-1.8-1.7-1.1 0-2.1.4-2.8 1l-1-1.2c1.1-1 2.8-1.5 4.8-1.5 2.5 0 3.8 1.2 3.8 3.5v4.3h-1.8v-1.1s-.4.6-1.2 1.1zm-2.4-1c.9 0 1.7-.3 2.2-.8v-1.5c-.5-.3-1.1-.4-1.9-.4-1.2 0-2 .5-2 1.4s.6 1.3 1.7 1.3z" />
  </svg>
);

export default function Footer() {
  const { lang } = useLanguage();
  const t = translations[lang as keyof typeof translations] || translations.en;
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

  const [termsSettings, setTermsSettings] = useState<TermsSettings>(DEFAULT_TERMS_SETTINGS);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS);
  const [contactSettings, setContactSettings] = useState<ContactSettings>(DEFAULT_CONTACT_SETTINGS);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const termsData = await getTermsSettings();
        const privacyData = await getPrivacySettings();
        const contactData = await getContactSettings();
        setTermsSettings(termsData);
        setPrivacySettings(privacyData);
        setContactSettings(contactData);
      } catch (err) {
        console.warn('Error loading footer settings:', err);
      }
    };
    loadSettings();
  }, []);

  return (
    <footer className="hidden md:block bg-white border-t border-gray-100 pt-12 pb-8">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand Section */}
          <div className="space-y-4 flex flex-col items-center">
            <Link to="/" className="flex items-center justify-center shrink-0">
              <img 
                src="/pasopkan_logo.png" 
                alt="Pasopkan Logo" 
                className="h-30 sm:h-36 w-auto object-contain transition-transform duration-300 hover:scale-[1.03]" 
                referrerPolicy="no-referrer"
              />
            </Link>
            <div className="flex items-center gap-3 justify-center">
              {contactSettings.facebook && (
                <a href={contactSettings.facebook} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-adv-orange hover:text-white transition-all shadow-sm">
                  <Facebook className="w-4.5 h-4.5" />
                </a>
              )}
              {contactSettings.instagram && (
                <a href={contactSettings.instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-adv-orange hover:text-white transition-all shadow-sm">
                  <Instagram className="w-4.5 h-4.5" />
                </a>
              )}
              {contactSettings.tiktok && (
                <a href={contactSettings.tiktok} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-adv-orange hover:text-white transition-all shadow-sm">
                  <TikTokIcon className="w-4.5 h-4.5" />
                </a>
              )}
              {contactSettings.youtube && (
                <a href={contactSettings.youtube} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-adv-orange hover:text-white transition-all shadow-sm">
                  <Youtube className="w-4.5 h-4.5" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links - Categories */}
          <div>
            <h4 className="font-bold text-adv-slate mb-4 uppercase text-xs tracking-widest">{t.categories}</h4>
            <ul className="space-y-2.5">
              <li><Link to="/category/workshop" className="text-sm font-medium text-gray-500 hover:text-adv-orange transition-colors">{t.workshops}</Link></li>
              <li><Link to="/category/sports" className="text-sm font-medium text-gray-500 hover:text-adv-orange transition-colors">{t.sports}</Link></li>
              <li><Link to="/category/festival" className="text-sm font-medium text-gray-500 hover:text-adv-orange transition-colors">{t.festivals}</Link></li>
              <li><Link to="/category/voucher" className="text-sm font-medium text-gray-500 hover:text-adv-orange transition-colors">{t.vouchers}</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-bold text-adv-slate mb-4 uppercase text-xs tracking-widest">{t.company}</h4>
            <ul className="space-y-2.5">
              <li><Link to="/about" className="text-sm font-medium text-gray-500 hover:text-adv-orange transition-colors">{t.about}</Link></li>
              <li>
                <Link to="/contact" className="text-sm font-medium text-gray-500 hover:text-adv-orange transition-colors">
                  {t.supportContact}
                </Link>
              </li>
              <li><button onClick={() => setIsTermsOpen(true)} className="text-sm font-medium text-gray-500 hover:text-adv-orange transition-colors text-left focus:outline-none cursor-pointer">{t.terms}</button></li>
              <li><button onClick={() => setIsPrivacyOpen(true)} className="text-sm font-medium text-gray-500 hover:text-adv-orange transition-colors text-left focus:outline-none cursor-pointer">{t.privacy}</button></li>
              <li><Link to="/admin" className="text-sm font-medium text-gray-500 hover:text-adv-orange transition-colors inline-flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-adv-orange" />{t.admin}</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-bold text-adv-slate mb-4 uppercase text-xs tracking-widest">{t.contact}</h4>
            <ul className="space-y-2.5">
              {(contactSettings.officeAddress1_en || contactSettings.officeAddress1_lo) && (
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-adv-orange mt-1 shrink-0" />
                  <span className="text-sm text-gray-500 leading-relaxed font-medium">
                    {lang === 'en' ? contactSettings.officeAddress1_en : contactSettings.officeAddress1_lo}
                  </span>
                </li>
              )}
              {contactSettings.email && (
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-adv-orange shrink-0" />
                  <a href={`mailto:${contactSettings.email}`} className="text-sm text-gray-500 font-medium hover:text-adv-orange transition-colors">
                    {contactSettings.email}
                  </a>
                </li>
              )}
              {contactSettings.phone && (
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-adv-orange shrink-0" />
                  <span className="text-sm text-gray-500 font-medium">{contactSettings.phone}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 pt-8" />

        {/* Bottom Bar: Copyright & Payment Methods */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-xs text-gray-400 font-medium">
            © {new Date().getFullYear()} Pasopkan. {t.allRights}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              {t.weAccept}
            </span>
            <div className="flex items-center justify-center bg-white px-3 py-1.5 rounded-2xl border border-gray-100 shadow-2xs hover:border-adv-orange/20 transition-all duration-300">
              <img 
                src="/payment_methods.png" 
                alt="Accepted Payment Methods" 
                className="h-9 sm:h-10.5 w-auto object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Terms & Conditions Modal */}
      <AnimatePresence>
        {isTermsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTermsOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-10"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-adv-orange">
                    <Ticket className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-adv-slate tracking-tight">{t.terms}</h3>
                </div>
                <button
                  onClick={() => setIsTermsOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6 text-sm text-gray-500 leading-relaxed font-sans">
                {termsSettings.sections && termsSettings.sections.map((section, idx) => (
                  <div key={idx}>
                    <h4 className="font-bold text-adv-slate text-base mb-2">
                      {lang === 'en' ? section.title_en : section.title_lo}
                    </h4>
                    <p className="whitespace-pre-wrap">
                      {lang === 'en' ? section.content_en : section.content_lo}
                    </p>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                <button
                  onClick={() => setIsTermsOpen(false)}
                  className="px-5 py-2 rounded-xl bg-adv-orange hover:bg-orange-600 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  {lang === 'en' ? 'I Understand' : 'ຂ້ອຍເຂົ້າໃຈແລ້ວ'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Privacy Policy Modal */}
      <AnimatePresence>
        {isPrivacyOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPrivacyOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-10"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-adv-orange">
                    <Mail className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-adv-slate tracking-tight">{t.privacy}</h3>
                </div>
                <button
                  onClick={() => setIsPrivacyOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6 text-sm text-gray-500 leading-relaxed font-sans">
                {privacySettings.sections && privacySettings.sections.map((section, idx) => (
                  <div key={idx}>
                    <h4 className="font-bold text-adv-slate text-base mb-2">
                      {lang === 'en' ? section.title_en : section.title_lo}
                    </h4>
                    <p className="whitespace-pre-wrap">
                      {lang === 'en' ? section.content_en : section.content_lo}
                    </p>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                <button
                  onClick={() => setIsPrivacyOpen(false)}
                  className="px-5 py-2 rounded-xl bg-adv-orange hover:bg-orange-600 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  {lang === 'en' ? 'I Understand' : 'ຂ້ອຍເຂົ້າໃຈແລ້ວ'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </footer>
  );
}


