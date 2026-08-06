import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Youtube,
  Plus,
  Trash2,
  Save,
  Loader2,
  CheckCircle2,
  HelpCircle,
  FileText,
  Shield,
  ArrowUp,
  ArrowDown,
  Globe,
  Share2,
  AlertCircle
} from 'lucide-react';
import {
  getContactSettings,
  saveContactSettings,
  getSupportSettings,
  saveSupportSettings,
  getTermsSettings,
  saveTermsSettings,
  getPrivacySettings,
  savePrivacySettings,
  ContactSettings,
  SupportSettings,
  TermsSettings,
  PrivacySettings,
  FAQItem,
  TermSection,
  PrivacySection
} from '../lib/siteSettings';

interface SiteSettingsTabProps {
  lang: 'en' | 'lo';
  t: any;
  addActivityLog: (action: string, details: string) => void;
}

type SubTab = 'contact' | 'support' | 'terms' | 'privacy';

export default function SiteSettingsTab({ lang, t, addActivityLog }: SiteSettingsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('contact');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form States
  const [contactForm, setContactForm] = useState<ContactSettings | null>(null);
  const [supportForm, setSupportForm] = useState<SupportSettings | null>(null);
  const [termsForm, setTermsForm] = useState<TermsSettings | null>(null);
  const [privacyForm, setPrivacyForm] = useState<PrivacySettings | null>(null);

  // Load all settings on mount
  useEffect(() => {
    async function loadAllSettings() {
      try {
        setIsLoading(true);
        const [contact, support, terms, privacy] = await Promise.all([
          getContactSettings(),
          getSupportSettings(),
          getTermsSettings(),
          getPrivacySettings()
        ]);
        setContactForm(contact);
        setSupportForm(support);
        setTermsForm(terms);
        setPrivacyForm(privacy);
      } catch (error) {
        console.error('Error loading site settings:', error);
        setErrorMessage(lang === 'en' ? 'Failed to load site settings. Please try again.' : 'ບໍ່ສາມາດໂຫຼດຂໍ້ມູນການຕັ້ງຄ່າເວັບໄຊໄດ້. ກະລຸນາລອງໃໝ່.');
      } finally {
        setIsLoading(false);
      }
    }
    loadAllSettings();
  }, [lang]);

  // Show temporary success message
  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  // Handlers for Saving
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm) return;
    try {
      setIsSaving(true);
      setErrorMessage(null);
      await saveContactSettings(contactForm);
      addActivityLog('Site settings updated', 'Updated "Contact Us" page information');
      triggerSuccess(lang === 'en' ? 'Contact information saved successfully!' : 'ບັນທຶກຂໍ້ມູນການຕິດຕໍ່ສຳເລັດແລ້ວ!');
    } catch (err) {
      setErrorMessage(lang === 'en' ? 'Failed to save settings.' : 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSupport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportForm) return;
    try {
      setIsSaving(true);
      setErrorMessage(null);
      await saveSupportSettings(supportForm);
      addActivityLog('Site settings updated', 'Updated "Support & FAQs" page information');
      triggerSuccess(lang === 'en' ? 'Support & FAQ settings saved successfully!' : 'ບັນທຶກຂໍ້ມູນຊ່ວຍເຫຼືອ ແລະ FAQ ສຳເລັດແລ້ວ!');
    } catch (err) {
      setErrorMessage(lang === 'en' ? 'Failed to save settings.' : 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTerms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsForm) return;
    try {
      setIsSaving(true);
      setErrorMessage(null);
      await saveTermsSettings(termsForm);
      addActivityLog('Site settings updated', 'Updated "Terms & Conditions" content');
      triggerSuccess(lang === 'en' ? 'Terms & Conditions saved successfully!' : 'ບັນທຶກເງື່ອນໄຂ ແລະ ຂໍ້ກຳນົດສຳເລັດແລ້ວ!');
    } catch (err) {
      setErrorMessage(lang === 'en' ? 'Failed to save settings.' : 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePrivacy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privacyForm) return;
    try {
      setIsSaving(true);
      setErrorMessage(null);
      await savePrivacySettings(privacyForm);
      addActivityLog('Site settings updated', 'Updated "Privacy Policy" content');
      triggerSuccess(lang === 'en' ? 'Privacy Policy saved successfully!' : 'ບັນທຶກນະໂຍບາຍຄວາມເປັນສ່ວນຕົວສຳເລັດແລ້ວ!');
    } catch (err) {
      setErrorMessage(lang === 'en' ? 'Failed to save settings.' : 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ.');
    } finally {
      setIsSaving(false);
    }
  };

  // FAQ CRUD Helpers
  const addFAQItem = () => {
    if (!supportForm) return;
    const newItem: FAQItem = {
      q_en: '',
      q_lo: '',
      a_en: '',
      a_lo: ''
    };
    setSupportForm({
      ...supportForm,
      faqs: [...supportForm.faqs, newItem]
    });
  };

  const removeFAQItem = (index: number) => {
    if (!supportForm) return;
    const newFaqs = [...supportForm.faqs];
    newFaqs.splice(index, 1);
    setSupportForm({
      ...supportForm,
      faqs: newFaqs
    });
  };

  const updateFAQItem = (index: number, key: keyof FAQItem, value: string) => {
    if (!supportForm) return;
    const newFaqs = [...supportForm.faqs];
    newFaqs[index] = {
      ...newFaqs[index],
      [key]: value
    };
    setSupportForm({
      ...supportForm,
      faqs: newFaqs
    });
  };

  // Terms Section CRUD Helpers
  const addTermsSection = () => {
    if (!termsForm) return;
    const newSection: TermSection = {
      title_en: '',
      title_lo: '',
      content_en: '',
      content_lo: ''
    };
    setTermsForm({
      ...termsForm,
      sections: [...termsForm.sections, newSection]
    });
  };

  const removeTermsSection = (index: number) => {
    if (!termsForm) return;
    const newSections = [...termsForm.sections];
    newSections.splice(index, 1);
    setTermsForm({
      ...termsForm,
      sections: newSections
    });
  };

  const moveTermsSection = (index: number, direction: 'up' | 'down') => {
    if (!termsForm) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= termsForm.sections.length) return;

    const newSections = [...termsForm.sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    setTermsForm({
      ...termsForm,
      sections: newSections
    });
  };

  const updateTermsSection = (index: number, key: keyof TermSection, value: string) => {
    if (!termsForm) return;
    const newSections = [...termsForm.sections];
    newSections[index] = {
      ...newSections[index],
      [key]: value
    };
    setTermsForm({
      ...termsForm,
      sections: newSections
    });
  };

  // Privacy Section CRUD Helpers
  const addPrivacySection = () => {
    if (!privacyForm) return;
    const newSection: PrivacySection = {
      title_en: '',
      title_lo: '',
      content_en: '',
      content_lo: ''
    };
    setPrivacyForm({
      ...privacyForm,
      sections: [...privacyForm.sections, newSection]
    });
  };

  const removePrivacySection = (index: number) => {
    if (!privacyForm) return;
    const newSections = [...privacyForm.sections];
    newSections.splice(index, 1);
    setPrivacyForm({
      ...privacyForm,
      sections: newSections
    });
  };

  const movePrivacySection = (index: number, direction: 'up' | 'down') => {
    if (!privacyForm) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= privacyForm.sections.length) return;

    const newSections = [...privacyForm.sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    setPrivacyForm({
      ...privacyForm,
      sections: newSections
    });
  };

  const updatePrivacySection = (index: number, key: keyof PrivacySection, value: string) => {
    if (!privacyForm) return;
    const newSections = [...privacyForm.sections];
    newSections[index] = {
      ...newSections[index],
      [key]: value
    };
    setPrivacyForm({
      ...privacyForm,
      sections: newSections
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-adv-orange" />
        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
          {lang === 'en' ? 'Loading Settings Editor...' : 'ກຳລັງໂຫຼດໜ້າແກ້ໄຂການຕັ້ງຄ່າ...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Alert/Status Banner */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl flex items-center gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
            <span className="text-xs font-semibold">{successMessage}</span>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <span className="text-xs font-semibold">{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Sub-Tabs Selection */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-gray-100">
        <button
          type="button"
          onClick={() => { setActiveSubTab('contact'); setErrorMessage(null); }}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
            activeSubTab === 'contact'
              ? 'bg-adv-orange border-adv-orange text-white shadow-md shadow-orange-100'
              : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Mail className="w-4 h-4" />
          {lang === 'en' ? 'Contact Us' : 'ຕິດຕໍ່ພວກເຮົາ'}
        </button>

        <button
          type="button"
          onClick={() => { setActiveSubTab('support'); setErrorMessage(null); }}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
            activeSubTab === 'support'
              ? 'bg-adv-orange border-adv-orange text-white shadow-md shadow-orange-100'
              : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          {lang === 'en' ? 'Support & FAQs' : 'ຊ່ວຍເຫຼືອ ແລະ FAQ'}
        </button>

        <button
          type="button"
          onClick={() => { setActiveSubTab('terms'); setErrorMessage(null); }}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
            activeSubTab === 'terms'
              ? 'bg-adv-orange border-adv-orange text-white shadow-md shadow-orange-100'
              : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          {lang === 'en' ? 'Terms & Conditions' : 'ເງື່ອນໄຂ & ຂໍ້ກຳນົດ'}
        </button>

        <button
          type="button"
          onClick={() => { setActiveSubTab('privacy'); setErrorMessage(null); }}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
            activeSubTab === 'privacy'
              ? 'bg-adv-orange border-adv-orange text-white shadow-md shadow-orange-100'
              : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Shield className="w-4 h-4" />
          {lang === 'en' ? 'Privacy Policy' : 'ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ'}
        </button>
      </div>

      {/* Editor Content Area */}
      <div className="bg-white rounded-3xl p-2">
        {/* CONTACT US FORM */}
        {activeSubTab === 'contact' && contactForm && (
          <form onSubmit={handleSaveContact} className="space-y-6">
            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
              <h3 className="text-sm font-black text-adv-slate uppercase tracking-wider mb-6 flex items-center gap-2">
                <Globe className="w-4 h-4 text-adv-orange" />
                {lang === 'en' ? 'Page Titles & Introductions' : 'ຫົວຂໍ້ໜ້າ & ບົດນຳສະເໜີ'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">
                    Contact Us Title (EN)
                  </label>
                  <input
                    type="text"
                    required
                    value={contactForm.contactUs_en}
                    onChange={(e) => setContactForm({ ...contactForm, contactUs_en: e.target.value })}
                    className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-adv-slate font-bold shadow-sm focus:outline-none focus:border-adv-orange/30 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">
                    Contact Us Title (LO)
                  </label>
                  <input
                    type="text"
                    required
                    value={contactForm.contactUs_lo}
                    onChange={(e) => setContactForm({ ...contactForm, contactUs_lo: e.target.value })}
                    className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-adv-slate font-bold shadow-sm focus:outline-none focus:border-adv-orange/30 transition-all"
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">
                    Contact Description (EN)
                  </label>
                  <textarea
                    required
                    value={contactForm.contactDesc_en}
                    onChange={(e) => setContactForm({ ...contactForm, contactDesc_en: e.target.value })}
                    className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-adv-slate font-medium shadow-sm focus:outline-none focus:border-adv-orange/30 transition-all min-h-[80px]"
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">
                    Contact Description (LO)
                  </label>
                  <textarea
                    required
                    value={contactForm.contactDesc_lo}
                    onChange={(e) => setContactForm({ ...contactForm, contactDesc_lo: e.target.value })}
                    className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-adv-slate font-medium shadow-sm focus:outline-none focus:border-adv-orange/30 transition-all min-h-[80px]"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
              <h3 className="text-sm font-black text-adv-slate uppercase tracking-wider mb-6 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-adv-orange" />
                {lang === 'en' ? 'Direct Contact & Office Address' : 'ຂໍ້ມູນຕິດຕໍ່ & ທີ່ຢູ່ຫ້ອງການ'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-adv-slate font-bold shadow-sm focus:outline-none focus:border-adv-orange/30 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                      className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-adv-slate font-bold shadow-sm focus:outline-none focus:border-adv-orange/30 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">
                    Office Address Line 1 (EN)
                  </label>
                  <input
                    type="text"
                    required
                    value={contactForm.officeAddress1_en}
                    onChange={(e) => setContactForm({ ...contactForm, officeAddress1_en: e.target.value })}
                    className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-adv-slate font-bold shadow-sm focus:outline-none focus:border-adv-orange/30 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">
                    Office Address Line 1 (LO)
                  </label>
                  <input
                    type="text"
                    required
                    value={contactForm.officeAddress1_lo}
                    onChange={(e) => setContactForm({ ...contactForm, officeAddress1_lo: e.target.value })}
                    className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-adv-slate font-bold shadow-sm focus:outline-none focus:border-adv-orange/30 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">
                    Office Address Line 2 (EN)
                  </label>
                  <input
                    type="text"
                    required
                    value={contactForm.officeAddress2_en}
                    onChange={(e) => setContactForm({ ...contactForm, officeAddress2_en: e.target.value })}
                    className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-adv-slate font-bold shadow-sm focus:outline-none focus:border-adv-orange/30 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">
                    Office Address Line 2 (LO)
                  </label>
                  <input
                    type="text"
                    required
                    value={contactForm.officeAddress2_lo}
                    onChange={(e) => setContactForm({ ...contactForm, officeAddress2_lo: e.target.value })}
                    className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-adv-slate font-bold shadow-sm focus:outline-none focus:border-adv-orange/30 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
              <h3 className="text-sm font-black text-adv-slate uppercase tracking-wider mb-6 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-adv-orange" />
                {lang === 'en' ? 'Social Media Links' : 'ລີ້ງໂຊຊຽວມີເດຍ'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">
                    Facebook Link
                  </label>
                  <div className="relative">
                    <Facebook className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      value={contactForm.facebook}
                      onChange={(e) => setContactForm({ ...contactForm, facebook: e.target.value })}
                      className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-adv-slate font-bold shadow-sm focus:outline-none focus:border-adv-orange/30 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">
                    Instagram Link
                  </label>
                  <div className="relative">
                    <Instagram className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      value={contactForm.instagram}
                      onChange={(e) => setContactForm({ ...contactForm, instagram: e.target.value })}
                      className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-adv-slate font-bold shadow-sm focus:outline-none focus:border-adv-orange/30 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">
                    TikTok Link
                  </label>
                  <div className="relative">
                    <Share2 className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      value={contactForm.tiktok}
                      onChange={(e) => setContactForm({ ...contactForm, tiktok: e.target.value })}
                      className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-adv-slate font-bold shadow-sm focus:outline-none focus:border-adv-orange/30 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">
                    YouTube Link
                  </label>
                  <div className="relative">
                    <Youtube className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      value={contactForm.youtube}
                      onChange={(e) => setContactForm({ ...contactForm, youtube: e.target.value })}
                      className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-adv-slate font-bold shadow-sm focus:outline-none focus:border-adv-orange/30 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">
                    WhatsApp Chat Link
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="url"
                      value={contactForm.whatsapp}
                      onChange={(e) => setContactForm({ ...contactForm, whatsapp: e.target.value })}
                      className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-adv-slate font-bold shadow-sm focus:outline-none focus:border-adv-orange/30 transition-all"
                      placeholder="e.g. https://wa.me/8562091951529"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-adv-orange text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-100 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {lang === 'en' ? 'Save Contact Settings' : 'ບັນທຶກການຕັ້ງຄ່າການຕິດຕໍ່'}
              </button>
            </div>
          </form>
        )}

        {/* SUPPORT & FAQ FORM */}
        {activeSubTab === 'support' && supportForm && (
          <form onSubmit={handleSaveSupport} className="space-y-6">
            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
              <h3 className="text-sm font-black text-adv-slate uppercase tracking-wider mb-6 flex items-center gap-2">
                <Globe className="w-4 h-4 text-adv-orange" />
                {lang === 'en' ? 'Support Title & Communication Channels' : 'ຫົວຂໍ້ໜ້າ & ຊ່ອງທາງການສື່ສານ'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">
                    Help & Support Title (EN)
                  </label>
                  <input
                    type="text"
                    required
                    value={supportForm.helpSupport_en}
                    onChange={(e) => setSupportForm({ ...supportForm, helpSupport_en: e.target.value })}
                    className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-adv-slate font-bold shadow-sm focus:outline-none focus:border-adv-orange/30 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">
                    Help & Support Title (LO)
                  </label>
                  <input
                    type="text"
                    required
                    value={supportForm.helpSupport_lo}
                    onChange={(e) => setSupportForm({ ...supportForm, helpSupport_lo: e.target.value })}
                    className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-adv-slate font-bold shadow-sm focus:outline-none focus:border-adv-orange/30 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">
                    Support Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={supportForm.emailAddress}
                      onChange={(e) => setSupportForm({ ...supportForm, emailAddress: e.target.value })}
                      className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-adv-slate font-bold shadow-sm focus:outline-none focus:border-adv-orange/30 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">
                    Support WhatsApp Number (Country code + numbers, no spaces)
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={supportForm.whatsappNumber}
                      onChange={(e) => setSupportForm({ ...supportForm, whatsappNumber: e.target.value })}
                      placeholder="8562091951529"
                      className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-adv-slate font-bold shadow-sm focus:outline-none focus:border-adv-orange/30 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">
                    WhatsApp Button Label (EN)
                  </label>
                  <input
                    type="text"
                    required
                    value={supportForm.whatsappLabel_en}
                    onChange={(e) => setSupportForm({ ...supportForm, whatsappLabel_en: e.target.value })}
                    className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-adv-slate font-bold shadow-sm focus:outline-none focus:border-adv-orange/30 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">
                    WhatsApp Button Label (LO)
                  </label>
                  <input
                    type="text"
                    required
                    value={supportForm.whatsappLabel_lo}
                    onChange={(e) => setSupportForm({ ...supportForm, whatsappLabel_lo: e.target.value })}
                    className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-adv-slate font-bold shadow-sm focus:outline-none focus:border-adv-orange/30 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* FAQs List */}
            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-adv-slate uppercase tracking-wider flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-adv-orange" />
                  {lang === 'en' ? 'Frequently Asked Questions' : 'ຄຳຖາມທີ່ພົບເລື້ອຍ (FAQs)'}
                </h3>
                <button
                  type="button"
                  onClick={addFAQItem}
                  className="flex items-center gap-1.5 px-4 py-2 border rounded-full text-[10px] font-black uppercase tracking-wider text-adv-orange border-orange-100 bg-orange-50/40 hover:bg-orange-50 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {lang === 'en' ? 'Add FAQ' : 'ເພີ່ມຄຳຖາມ'}
                </button>
              </div>

              <div className="space-y-6">
                {supportForm.faqs.map((faq, index) => (
                  <div key={index} className="p-6 bg-white border border-gray-100 rounded-2xl relative shadow-sm group">
                    <button
                      type="button"
                      onClick={() => removeFAQItem(index)}
                      className="absolute top-4 right-4 p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all"
                      title={lang === 'en' ? 'Remove FAQ' : 'ລຶບຄຳຖາມ'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="text-[11px] font-bold text-gray-400 mb-4">
                      #{index + 1}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">
                          Question (EN)
                        </label>
                        <input
                          type="text"
                          required
                          value={faq.q_en}
                          onChange={(e) => updateFAQItem(index, 'q_en', e.target.value)}
                          className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-adv-slate font-bold focus:bg-white focus:outline-none focus:border-adv-orange/30 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">
                          Question (LO)
                        </label>
                        <input
                          type="text"
                          required
                          value={faq.q_lo}
                          onChange={(e) => updateFAQItem(index, 'q_lo', e.target.value)}
                          className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-adv-slate font-bold focus:bg-white focus:outline-none focus:border-adv-orange/30 transition-all"
                        />
                      </div>

                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">
                          Answer (EN)
                        </label>
                        <textarea
                          required
                          value={faq.a_en}
                          onChange={(e) => updateFAQItem(index, 'a_en', e.target.value)}
                          className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-adv-slate font-medium focus:bg-white focus:outline-none focus:border-adv-orange/30 transition-all min-h-[60px]"
                        />
                      </div>

                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">
                          Answer (LO)
                        </label>
                        <textarea
                          required
                          value={faq.a_lo}
                          onChange={(e) => updateFAQItem(index, 'a_lo', e.target.value)}
                          className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-adv-slate font-medium focus:bg-white focus:outline-none focus:border-adv-orange/30 transition-all min-h-[60px]"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {supportForm.faqs.length === 0 && (
                  <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
                    <HelpCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-bold tracking-tight">No FAQ items defined. Add some above.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-adv-orange text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-100 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {lang === 'en' ? 'Save Support & FAQ' : 'ບັນທຶກຂໍ້ມູນຊ່ວຍເຫຼືອ & FAQ'}
              </button>
            </div>
          </form>
        )}

        {/* TERMS & CONDITIONS FORM */}
        {activeSubTab === 'terms' && termsForm && (
          <form onSubmit={handleSaveTerms} className="space-y-6">
            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-adv-slate uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-adv-orange" />
                    {lang === 'en' ? 'Terms & Conditions Sections' : 'ຫົວຂໍ້ ແລະ ເນື້ອຫາ ເງື່ອນໄຂການບໍລິການ'}
                  </h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                    {lang === 'en' ? 'Organize terms sections chronologically. Use drag/order controls.' : 'ຈັດລຽງເງື່ອນໄຂຕາມລຳດັບ. ໃຊ້ປຸ່ມປ່ຽນລຳດັບຂຶ້ນ-ລົງ.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addTermsSection}
                  className="flex items-center gap-1.5 px-4 py-2 border rounded-full text-[10px] font-black uppercase tracking-wider text-adv-orange border-orange-100 bg-orange-50/40 hover:bg-orange-50 transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {lang === 'en' ? 'Add Section' : 'ເພີ່ມຫົວຂໍ້'}
                </button>
              </div>

              <div className="space-y-6">
                {termsForm.sections.map((sect, index) => (
                  <div key={index} className="p-6 bg-white border border-gray-100 rounded-2xl relative shadow-sm group">
                    {/* Ordering and Delete buttons */}
                    <div className="absolute top-4 right-4 flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveTermsSection(index, 'up')}
                        className="p-1.5 bg-gray-50 text-gray-400 rounded-lg hover:bg-gray-100 hover:text-adv-slate disabled:opacity-30 transition-all"
                        title={lang === 'en' ? 'Move Up' : 'ຍ້າຍຂຶ້ນ'}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === termsForm.sections.length - 1}
                        onClick={() => moveTermsSection(index, 'down')}
                        className="p-1.5 bg-gray-50 text-gray-400 rounded-lg hover:bg-gray-100 hover:text-adv-slate disabled:opacity-30 transition-all"
                        title={lang === 'en' ? 'Move Down' : 'ຍ້າຍລົງ'}
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeTermsSection(index)}
                        className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-all ml-1"
                        title={lang === 'en' ? 'Remove Section' : 'ລຶບຫົວຂໍ້'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-[11px] font-bold text-gray-400 mb-4">
                      {lang === 'en' ? `Section #${index + 1}` : `ສ່ວນທີ #${index + 1}`}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">
                          Section Title (EN)
                        </label>
                        <input
                          type="text"
                          required
                          value={sect.title_en}
                          onChange={(e) => updateTermsSection(index, 'title_en', e.target.value)}
                          className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-adv-slate font-bold focus:bg-white focus:outline-none focus:border-adv-orange/30 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">
                          Section Title (LO)
                        </label>
                        <input
                          type="text"
                          required
                          value={sect.title_lo}
                          onChange={(e) => updateTermsSection(index, 'title_lo', e.target.value)}
                          className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-adv-slate font-bold focus:bg-white focus:outline-none focus:border-adv-orange/30 transition-all"
                        />
                      </div>

                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">
                          Section Content (EN)
                        </label>
                        <textarea
                          required
                          value={sect.content_en}
                          onChange={(e) => updateTermsSection(index, 'content_en', e.target.value)}
                          className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-adv-slate font-medium focus:bg-white focus:outline-none focus:border-adv-orange/30 transition-all min-h-[100px]"
                        />
                      </div>

                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">
                          Section Content (LO)
                        </label>
                        <textarea
                          required
                          value={sect.content_lo}
                          onChange={(e) => updateTermsSection(index, 'content_lo', e.target.value)}
                          className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-adv-slate font-medium focus:bg-white focus:outline-none focus:border-adv-orange/30 transition-all min-h-[100px]"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {termsForm.sections.length === 0 && (
                  <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
                    <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-bold tracking-tight">No sections defined. Create a new section above.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-adv-orange text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-100 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {lang === 'en' ? 'Save Terms & Conditions' : 'ບັນທຶກເງື່ອນໄຂ & ຂໍ້ກຳນົດ'}
              </button>
            </div>
          </form>
        )}

        {/* PRIVACY POLICY FORM */}
        {activeSubTab === 'privacy' && privacyForm && (
          <form onSubmit={handleSavePrivacy} className="space-y-6">
            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-adv-slate uppercase tracking-wider flex items-center gap-2">
                    <Shield className="w-4 h-4 text-adv-orange" />
                    {lang === 'en' ? 'Privacy Policy Sections' : 'ຫົວຂໍ້ ແລະ ເນື້ອຫາ ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ'}
                  </h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                    {lang === 'en' ? 'Organize policy sections chronologically. Use drag/order controls.' : 'ຈັດລຽງເນື້ອຫານະໂຍບາຍ. ໃຊ້ປຸ່ມປ່ຽນລຳດັບຂຶ້ນ-ລົງ.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addPrivacySection}
                  className="flex items-center gap-1.5 px-4 py-2 border rounded-full text-[10px] font-black uppercase tracking-wider text-adv-orange border-orange-100 bg-orange-50/40 hover:bg-orange-50 transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {lang === 'en' ? 'Add Section' : 'ເພີ່ມຫົວຂໍ້'}
                </button>
              </div>

              <div className="space-y-6">
                {privacyForm.sections.map((sect, index) => (
                  <div key={index} className="p-6 bg-white border border-gray-100 rounded-2xl relative shadow-sm group">
                    {/* Ordering and Delete buttons */}
                    <div className="absolute top-4 right-4 flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => movePrivacySection(index, 'up')}
                        className="p-1.5 bg-gray-50 text-gray-400 rounded-lg hover:bg-gray-100 hover:text-adv-slate disabled:opacity-30 transition-all"
                        title={lang === 'en' ? 'Move Up' : 'ຍ້າຍຂຶ້ນ'}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === privacyForm.sections.length - 1}
                        onClick={() => movePrivacySection(index, 'down')}
                        className="p-1.5 bg-gray-50 text-gray-400 rounded-lg hover:bg-gray-100 hover:text-adv-slate disabled:opacity-30 transition-all"
                        title={lang === 'en' ? 'Move Down' : 'ຍ້າຍລົງ'}
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removePrivacySection(index)}
                        className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-all ml-1"
                        title={lang === 'en' ? 'Remove Section' : 'ລຶບຫົວຂໍ້'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-[11px] font-bold text-gray-400 mb-4">
                      {lang === 'en' ? `Section #${index + 1}` : `ສ່ວນທີ #${index + 1}`}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">
                          Section Title (EN)
                        </label>
                        <input
                          type="text"
                          required
                          value={sect.title_en}
                          onChange={(e) => updatePrivacySection(index, 'title_en', e.target.value)}
                          className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-adv-slate font-bold focus:bg-white focus:outline-none focus:border-adv-orange/30 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">
                          Section Title (LO)
                        </label>
                        <input
                          type="text"
                          required
                          value={sect.title_lo}
                          onChange={(e) => updatePrivacySection(index, 'title_lo', e.target.value)}
                          className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-adv-slate font-bold focus:bg-white focus:outline-none focus:border-adv-orange/30 transition-all"
                        />
                      </div>

                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">
                          Section Content (EN)
                        </label>
                        <textarea
                          required
                          value={sect.content_en}
                          onChange={(e) => updatePrivacySection(index, 'content_en', e.target.value)}
                          className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-adv-slate font-medium focus:bg-white focus:outline-none focus:border-adv-orange/30 transition-all min-h-[100px]"
                        />
                      </div>

                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">
                          Section Content (LO)
                        </label>
                        <textarea
                          required
                          value={sect.content_lo}
                          onChange={(e) => updatePrivacySection(index, 'content_lo', e.target.value)}
                          className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-adv-slate font-medium focus:bg-white focus:outline-none focus:border-adv-orange/30 transition-all min-h-[100px]"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {privacyForm.sections.length === 0 && (
                  <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
                    <Shield className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-bold tracking-tight">No sections defined. Create a new section above.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-adv-orange text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-orange-100 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {lang === 'en' ? 'Save Privacy Policy' : 'ບັນທຶກນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
