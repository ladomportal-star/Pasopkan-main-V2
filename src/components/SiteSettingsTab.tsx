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
  FileCheck,
  Shield,
  ArrowUp,
  ArrowDown,
  Globe,
  Share2,
  AlertCircle,
  BookOpen,
  Search,
  X,
  Sparkles,
  Check,
  Grid
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
  getOrganizerTermsSettings,
  saveOrganizerTermsSettings,
  ContactSettings,
  SupportSettings,
  TermsSettings,
  PrivacySettings,
  OrganizerTermsSettings,
  OrganizerTermItem,
  FAQItem,
  TermSection,
  PrivacySection
} from '../lib/siteSettings';
import {
  TERM_ICON_LIST,
  TERM_ICON_CATEGORIES,
  renderTermIcon,
  TermIconOption
} from '../lib/termIcons';

interface SiteSettingsTabProps {
  lang: 'en' | 'lo';
  t: any;
  addActivityLog: (action: string, details: string) => void;
}

type SubTab = 'contact' | 'support' | 'terms' | 'organizer_terms' | 'privacy';

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
  const [organizerTermsForm, setOrganizerTermsForm] = useState<OrganizerTermsSettings | null>(null);

  // Icon Picker State for Organizer Terms
  const [pickingIconIndex, setPickingIconIndex] = useState<number | null>(null);
  const [iconSearchQuery, setIconSearchQuery] = useState<string>('');
  const [selectedIconCategory, setSelectedIconCategory] = useState<string>('all');

  // Load all settings on mount
  useEffect(() => {
    async function loadAllSettings() {
      try {
        setIsLoading(true);
        const [contact, support, terms, privacy, organizerTerms] = await Promise.all([
          getContactSettings(),
          getSupportSettings(),
          getTermsSettings(),
          getPrivacySettings(),
          getOrganizerTermsSettings()
        ]);
        setContactForm(contact);
        setSupportForm(support);
        setTermsForm(terms);
        setPrivacyForm(privacy);
        setOrganizerTermsForm(organizerTerms);
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

  const handleSaveOrganizerTerms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizerTermsForm) return;
    try {
      setIsSaving(true);
      setErrorMessage(null);
      await saveOrganizerTermsSettings(organizerTermsForm);
      addActivityLog('Site settings updated', 'Updated "Organizer Terms & Conditions" content');
      triggerSuccess(lang === 'en' ? 'Organizer Terms & Conditions saved successfully!' : 'ບັນທຶກເງື່ອນໄຂ ແລະ ຂໍ້ກຳນົດສຳລັບຜູ້ຈັດງານສຳເລັດແລ້ວ!');
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

  // Organizer Terms CRUD Helpers
  const addOrganizerTermSection = () => {
    if (!organizerTermsForm) return;
    const newTerm: OrganizerTermItem = {
      id: `term-${Date.now()}`,
      title_en: '',
      title_lo: '',
      content_en: '',
      content_lo: '',
      icon: 'file-check'
    };
    setOrganizerTermsForm({
      ...organizerTermsForm,
      sections: [...organizerTermsForm.sections, newTerm]
    });
  };

  const removeOrganizerTermSection = (index: number) => {
    if (!organizerTermsForm) return;
    const newSections = [...organizerTermsForm.sections];
    newSections.splice(index, 1);
    setOrganizerTermsForm({
      ...organizerTermsForm,
      sections: newSections
    });
  };

  const moveOrganizerTermSection = (index: number, direction: 'up' | 'down') => {
    if (!organizerTermsForm) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= organizerTermsForm.sections.length) return;

    const newSections = [...organizerTermsForm.sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    setOrganizerTermsForm({
      ...organizerTermsForm,
      sections: newSections
    });
  };

  const updateOrganizerTermSection = (index: number, key: keyof OrganizerTermItem, value: string) => {
    if (!organizerTermsForm) return;
    const newSections = [...organizerTermsForm.sections];
    newSections[index] = {
      ...newSections[index],
      [key]: value
    };
    setOrganizerTermsForm({
      ...organizerTermsForm,
      sections: newSections
    });
  };

  const filteredIcons = TERM_ICON_LIST.filter((icon) => {
    const matchesCategory = selectedIconCategory === 'all' || icon.category === selectedIconCategory;
    const query = iconSearchQuery.toLowerCase().trim();
    const matchesSearch = !query ||
      icon.value.toLowerCase().includes(query) ||
      icon.labelEn.toLowerCase().includes(query) ||
      icon.labelLo.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

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
          {lang === 'en' ? 'General Terms' : 'ເງື່ອນໄຂທົ່ວໄປ'}
        </button>

        <button
          type="button"
          onClick={() => { setActiveSubTab('organizer_terms'); setErrorMessage(null); }}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
            activeSubTab === 'organizer_terms'
              ? 'bg-adv-orange border-adv-orange text-white shadow-md shadow-orange-100'
              : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          {lang === 'en' ? 'Organizer Terms' : 'ເງື່ອນໄຂຜູ້ຈັດງານ'}
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

        {/* ORGANIZER TERMS & CONDITIONS FORM */}
        {activeSubTab === 'organizer_terms' && organizerTermsForm && (
          <form onSubmit={handleSaveOrganizerTerms} className="space-y-6">
            {/* Page Header and Intro */}
            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-6">
              <h3 className="text-sm font-black text-adv-slate uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-adv-orange" />
                {lang === 'en' ? 'Organizer Terms Header & Intro' : 'ຫົວຂໍ້ ແລະ ບົດນຳເງື່ອນໄຂຜູ້ຈັດງານ'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">
                    Page Title (EN)
                  </label>
                  <input
                    type="text"
                    required
                    value={organizerTermsForm.title_en}
                    onChange={(e) => setOrganizerTermsForm({ ...organizerTermsForm, title_en: e.target.value })}
                    className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-adv-slate font-bold shadow-sm focus:outline-none focus:border-adv-orange/30 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">
                    Page Title (LO)
                  </label>
                  <input
                    type="text"
                    required
                    value={organizerTermsForm.title_lo}
                    onChange={(e) => setOrganizerTermsForm({ ...organizerTermsForm, title_lo: e.target.value })}
                    className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-adv-slate font-bold shadow-sm focus:outline-none focus:border-adv-orange/30 transition-all"
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">
                    Introduction Statement (EN)
                  </label>
                  <textarea
                    required
                    value={organizerTermsForm.intro_en}
                    onChange={(e) => setOrganizerTermsForm({ ...organizerTermsForm, intro_en: e.target.value })}
                    className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-adv-slate font-medium shadow-sm focus:outline-none focus:border-adv-orange/30 transition-all min-h-[90px]"
                  />
                </div>

                <div className="col-span-1 md:col-span-2">
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">
                    Introduction Statement (LO)
                  </label>
                  <textarea
                    required
                    value={organizerTermsForm.intro_lo}
                    onChange={(e) => setOrganizerTermsForm({ ...organizerTermsForm, intro_lo: e.target.value })}
                    className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-adv-slate font-medium shadow-sm focus:outline-none focus:border-adv-orange/30 transition-all min-h-[90px]"
                  />
                </div>
              </div>
            </div>

            {/* Organizer Terms Cards List */}
            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-adv-slate uppercase tracking-wider flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-adv-orange" />
                    {lang === 'en' ? 'Organizer Terms Cards & Requirements' : 'ລາຍການຂໍ້ກຳນົດ ແລະ ເງື່ອນໄຂສຳລັບຜູ້ຈັດງານ'}
                  </h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                    {lang === 'en' ? 'Manage term requirements, descriptions and assigned icons.' : 'ຈັດການເງື່ອນໄຂ, ເນື້ອຫາ ແລະ ໄອຄອນສະແດງຜົນ.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addOrganizerTermSection}
                  className="flex items-center gap-1.5 px-4 py-2 border rounded-full text-[10px] font-black uppercase tracking-wider text-adv-orange border-orange-100 bg-orange-50/40 hover:bg-orange-50 transition-all shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {lang === 'en' ? 'Add Requirement Card' : 'ເພີ່ມຂໍ້ກຳນົດ'}
                </button>
              </div>

              <div className="space-y-6">
                {organizerTermsForm.sections.map((sect, index) => (
                  <div key={sect.id || index} className="p-6 bg-white border border-gray-100 rounded-2xl relative shadow-sm group hover:border-orange-200 transition-all">
                    {/* Ordering and Delete buttons */}
                    <div className="absolute top-4 right-4 flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveOrganizerTermSection(index, 'up')}
                        className="p-1.5 bg-gray-50 text-gray-400 rounded-lg hover:bg-gray-100 hover:text-adv-slate disabled:opacity-30 transition-all"
                        title={lang === 'en' ? 'Move Up' : 'ຍ້າຍຂຶ້ນ'}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === organizerTermsForm.sections.length - 1}
                        onClick={() => moveOrganizerTermSection(index, 'down')}
                        className="p-1.5 bg-gray-50 text-gray-400 rounded-lg hover:bg-gray-100 hover:text-adv-slate disabled:opacity-30 transition-all"
                        title={lang === 'en' ? 'Move Down' : 'ຍ້າຍລົງ'}
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeOrganizerTermSection(index)}
                        className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-all ml-1"
                        title={lang === 'en' ? 'Remove Card' : 'ລຶບກາດນີ້'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-adv-orange shadow-sm">
                          {renderTermIcon(sect.icon, "w-5 h-5")}
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-gray-400">
                            {lang === 'en' ? `Requirement #${index + 1}` : `ຂໍ້ກຳນົດທີ #${index + 1}`}
                          </div>
                          <div className="text-xs font-black text-adv-slate">
                            {sect.title_en || (lang === 'en' ? 'Untitled Requirement' : 'ຂໍ້ກຳນົດທີ່ບໍ່ມີຊື່')}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setPickingIconIndex(index);
                          setIconSearchQuery('');
                          setSelectedIconCategory('all');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-orange-200 bg-orange-50 text-adv-orange text-xs font-black hover:bg-adv-orange hover:text-white transition-all shadow-sm"
                      >
                        <Grid className="w-3.5 h-3.5" />
                        {lang === 'en' ? 'Change Icon (58 available)' : 'ປ່ຽນໄອຄອນ (ມີ 58 ໄອຄອນ)'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      {/* Quick Icon Selector Pills */}
                      <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">
                            {lang === 'en' ? 'Quick Choose Icon' : 'ເລືອກໄອຄອນດ່ວນ'}
                          </label>
                          <span className="text-[9px] font-bold text-gray-400">
                            {lang === 'en' ? 'Current: ' : 'ປະຈຸບັນ: '}
                            <span className="text-adv-orange font-black uppercase">{sect.icon || 'file-check'}</span>
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {TERM_ICON_LIST.slice(0, 14).map((item) => (
                            <button
                              key={item.value}
                              type="button"
                              onClick={() => updateOrganizerTermSection(index, 'icon', item.value)}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all border ${
                                (sect.icon || 'file-check') === item.value
                                  ? 'bg-adv-orange text-white border-adv-orange shadow-sm scale-105'
                                  : 'bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100'
                              }`}
                            >
                              {renderTermIcon(item.value, "w-3.5 h-3.5")}
                              <span>{lang === 'en' ? item.labelEn : item.labelLo}</span>
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              setPickingIconIndex(index);
                              setIconSearchQuery('');
                              setSelectedIconCategory('all');
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-black text-adv-orange border border-dashed border-orange-200 bg-orange-50/50 hover:bg-orange-100 transition-all"
                          >
                            <Plus className="w-3 h-3" />
                            {lang === 'en' ? '+ More Icons' : '+ ເບິ່ງໄອຄອນທັງໝົດ'}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">
                          Requirement Title (EN)
                        </label>
                        <input
                          type="text"
                          required
                          value={sect.title_en}
                          onChange={(e) => updateOrganizerTermSection(index, 'title_en', e.target.value)}
                          placeholder="e.g. Information Accuracy"
                          className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-adv-slate font-bold focus:bg-white focus:outline-none focus:border-adv-orange/30 transition-all"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">
                          Requirement Title (LO)
                        </label>
                        <input
                          type="text"
                          required
                          value={sect.title_lo}
                          onChange={(e) => updateOrganizerTermSection(index, 'title_lo', e.target.value)}
                          placeholder="ຕົວຢ່າງ: ຄວາມຖືກຕ້ອງຂອງຂໍ້ມູນ"
                          className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-adv-slate font-bold focus:bg-white focus:outline-none focus:border-adv-orange/30 transition-all"
                        />
                      </div>

                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">
                          Requirement Description (EN)
                        </label>
                        <textarea
                          required
                          value={sect.content_en}
                          onChange={(e) => updateOrganizerTermSection(index, 'content_en', e.target.value)}
                          placeholder="Explain what the organizer is responsible for in English..."
                          className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-adv-slate font-medium focus:bg-white focus:outline-none focus:border-adv-orange/30 transition-all min-h-[80px]"
                        />
                      </div>

                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">
                          Requirement Description (LO)
                        </label>
                        <textarea
                          required
                          value={sect.content_lo}
                          onChange={(e) => updateOrganizerTermSection(index, 'content_lo', e.target.value)}
                          placeholder="ອະທິບາຍລາຍລະອຽດຄວາມຮັບຜິດຊອບຂອງຜູ້ຈັດງານເປັນພາສາລາວ..."
                          className="w-full bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-3 text-sm text-adv-slate font-medium focus:bg-white focus:outline-none focus:border-adv-orange/30 transition-all min-h-[80px]"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {organizerTermsForm.sections.length === 0 && (
                  <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
                    <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-bold tracking-tight">No terms defined. Click "Add Requirement Card" above.</p>
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
                {lang === 'en' ? 'Save Organizer Terms' : 'ບັນທຶກເງື່ອນໄຂຜູ້ຈັດງານ'}
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

      {/* FULL ICON PICKER MODAL */}
      <AnimatePresence>
        {pickingIconIndex !== null && organizerTermsForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-200">
                    <Grid className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-adv-slate">
                      {lang === 'en' ? 'Choose Term Icon' : 'ເລືອກໄອຄອນຂໍ້ກຳນົດ'}
                    </h3>
                    <p className="text-xs text-gray-500 font-medium">
                      {lang === 'en'
                        ? `Selecting for Requirement #${pickingIconIndex + 1}: ${organizerTermsForm.sections[pickingIconIndex]?.title_en || 'Untitled'}`
                        : `ກຳລັງເລືອກໃຫ້ຂໍ້ກຳນົດທີ #${pickingIconIndex + 1}`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPickingIconIndex(null)}
                  className="p-2 text-gray-400 hover:text-adv-slate rounded-xl hover:bg-gray-100 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search & Category Filter */}
              <div className="p-6 border-b border-gray-100 space-y-4 bg-white">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={iconSearchQuery}
                    onChange={(e) => setIconSearchQuery(e.target.value)}
                    placeholder={lang === 'en' ? 'Search icons by name or keywords (e.g., trust, fee, venue, ticket, star)...' : 'ຄົ້ນຫາໄອຄອນຕາມຊື່ ຫຼື ຄຳສັບ (ຕົວຢ່າງ: ຄວາມປອດໄພ, ລາຄາ, ປີ້, ດາວ)...'}
                    className="w-full pl-11 pr-10 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-bold text-adv-slate focus:bg-white focus:outline-none focus:border-adv-orange/40 transition-all"
                    autoFocus
                  />
                  {iconSearchQuery && (
                    <button
                      type="button"
                      onClick={() => setIconSearchQuery('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-adv-slate"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Categories */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {TERM_ICON_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedIconCategory(cat.id)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all border ${
                        selectedIconCategory === cat.id
                          ? 'bg-adv-orange border-adv-orange text-white shadow-sm'
                          : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
                      }`}
                    >
                      {lang === 'en' ? cat.labelEn : cat.labelLo}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 px-1">
                  <span>
                    {lang === 'en'
                      ? `Showing ${filteredIcons.length} icon${filteredIcons.length === 1 ? '' : 's'}`
                      : `ສະແດງທັງໝົດ ${filteredIcons.length} ໄອຄອນ`}
                  </span>
                  <span>
                    {lang === 'en' ? 'Click any icon to apply' : 'ຄລິກໄອຄອນໃດກໍ່ໄດ້ເພື່ອເລືອກ'}
                  </span>
                </div>
              </div>

              {/* Icon Grid */}
              <div className="p-6 overflow-y-auto max-h-[420px] bg-gray-50/40">
                {filteredIcons.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {filteredIcons.map((item) => {
                      const isSelected = organizerTermsForm.sections[pickingIconIndex]?.icon === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => {
                            updateOrganizerTermSection(pickingIconIndex, 'icon', item.value);
                            setPickingIconIndex(null);
                          }}
                          className={`p-3.5 rounded-2xl flex flex-col items-center text-center gap-2 transition-all border group ${
                            isSelected
                              ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-200 scale-[1.02]'
                              : 'bg-white text-gray-700 border-gray-100 hover:border-adv-orange/40 hover:shadow-md hover:bg-orange-50/30'
                          }`}
                        >
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-gray-50 group-hover:bg-orange-100 text-adv-slate group-hover:text-adv-orange'
                            }`}
                          >
                            {renderTermIcon(item.value, "w-6 h-6")}
                          </div>
                          <div className="w-full">
                            <div className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-adv-slate'}`}>
                              {lang === 'en' ? item.labelEn : item.labelLo}
                            </div>
                            <div className={`text-[10px] font-bold truncate mt-0.5 ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                              {lang === 'en' ? item.labelLo : item.labelEn}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full mt-0.5">
                              <Check className="w-2.5 h-2.5" />
                              {lang === 'en' ? 'Selected' : 'ເລືອກແລ້ວ'}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <Search className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm font-bold text-gray-500">
                      {lang === 'en' ? `No icons found matching "${iconSearchQuery}"` : `ບໍ່ພົບໄອຄອນທີ່ກົງກັບ "${iconSearchQuery}"`}
                    </p>
                    <button
                      type="button"
                      onClick={() => { setIconSearchQuery(''); setSelectedIconCategory('all'); }}
                      className="mt-3 text-xs font-black text-adv-orange hover:underline"
                    >
                      {lang === 'en' ? 'Clear Filters' : 'ລ້າງຕົວກອງ'}
                    </button>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-100 bg-white flex items-center justify-between">
                <div className="text-xs text-gray-400 font-bold">
                  {lang === 'en' ? 'Total 58 icons available' : 'ມີທັງໝົດ 58 ໄອຄອນໃຫ້ເລືອກ'}
                </div>
                <button
                  type="button"
                  onClick={() => setPickingIconIndex(null)}
                  className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-adv-slate text-xs font-black rounded-xl transition-all"
                >
                  {lang === 'en' ? 'Close' : 'ປິດ'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
