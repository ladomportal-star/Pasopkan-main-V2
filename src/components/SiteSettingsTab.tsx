import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
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
  Grid,
  Image as ImageIcon,
  Sliders,
  RotateCcw,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  Eye,
  Layers,
  Award,
  Building2,
  ExternalLink,
  Clock,
  Calendar,
  AlertTriangle
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
  getHomeHeroSettings,
  saveHomeHeroSettings,
  getTicketSponsorSettings,
  saveTicketSponsorSettings,
  ContactSettings,
  SupportSettings,
  TermsSettings,
  PrivacySettings,
  OrganizerTermsSettings,
  OrganizerTermItem,
  FAQItem,
  TermSection,
  PrivacySection,
  HomeHeroSettings,
  HeroSlide,
  TicketSponsorSettings,
  SponsorItem,
  DEFAULT_HOME_HERO_SETTINGS,
  DEFAULT_HERO_SLIDES,
  DEFAULT_TICKET_SPONSOR_SETTINGS,
  resolveTicketAd,
  ResolvedTicketAd
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

type SubTab = 'home_hero' | 'ticket_sponsors' | 'contact' | 'support' | 'terms' | 'organizer_terms' | 'privacy';

export default function SiteSettingsTab({ lang, t, addActivityLog }: SiteSettingsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('home_hero');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form States
  const [homeHeroForm, setHomeHeroForm] = useState<HomeHeroSettings | null>(null);
  const [previewSlideIdx, setPreviewSlideIdx] = useState<number>(0);
  const [ticketSponsorsForm, setTicketSponsorsForm] = useState<TicketSponsorSettings | null>(null);
  const [adSubTab, setAdSubTab] = useState<'content' | 'schedule' | 'fallback'>('content');
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
        const [contact, support, terms, privacy, organizerTerms, homeHero, ticketSponsors] = await Promise.all([
          getContactSettings(),
          getSupportSettings(),
          getTermsSettings(),
          getPrivacySettings(),
          getOrganizerTermsSettings(),
          getHomeHeroSettings(),
          getTicketSponsorSettings()
        ]);
        setContactForm(contact);
        setSupportForm(support);
        setTermsForm(terms);
        setPrivacyForm(privacy);
        setOrganizerTermsForm(organizerTerms);
        setHomeHeroForm(homeHero);
        setTicketSponsorsForm(ticketSponsors);
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
  const handleSaveHomeHero = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!homeHeroForm) return;
    if (!homeHeroForm.slides || homeHeroForm.slides.length === 0) {
      setErrorMessage(lang === 'en' ? 'Please include at least one slide image.' : 'ກະລຸນາເພີ່ມຮູບສະໄລດ໌ຢ່າງໜ້ອຍ 1 ຮູບ.');
      return;
    }
    // Validate that each slide has an image url
    const hasEmptyUrl = homeHeroForm.slides.some(s => !s.imageUrl.trim());
    if (hasEmptyUrl) {
      setErrorMessage(lang === 'en' ? 'Every slide must have a valid Image URL or uploaded image.' : 'ທຸກສະໄລດ໌ຕ້ອງມີ URL ຮູບພາບ ຫຼື ຮູບທີ່ອັບໂຫຼດ.');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);
      await saveHomeHeroSettings(homeHeroForm);
      addActivityLog('Site settings updated', 'Updated Home Page hero title and slide images');
      triggerSuccess(lang === 'en' ? 'Home page slider & hero text saved successfully!' : 'ບັນທຶກສະໄລດ໌ ແລະ ຫົວຂໍ້ໜ້າຫຼັກສຳເລັດແລ້ວ!');
    } catch (err) {
      setErrorMessage(lang === 'en' ? 'Failed to save hero settings.' : 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ.');
    } finally {
      setIsSaving(false);
    }
  };

  // Home Hero CRUD Helpers
  const addHeroSlide = () => {
    if (!homeHeroForm) return;
    const newSlide: HeroSlide = {
      id: `slide-${Date.now()}`,
      imageUrl: '',
      title_en: '',
      title_lo: ''
    };
    setHomeHeroForm({
      ...homeHeroForm,
      slides: [...homeHeroForm.slides, newSlide]
    });
    setPreviewSlideIdx(homeHeroForm.slides.length);
  };

  const removeHeroSlide = (index: number) => {
    if (!homeHeroForm) return;
    if (homeHeroForm.slides.length <= 1) {
      setErrorMessage(lang === 'en' ? 'At least one slide image is required.' : 'ຕ້ອງມີຮູບສະໄລດ໌ຢ່າງໜ້ອຍ 1 ຮູບ.');
      return;
    }
    const newSlides = [...homeHeroForm.slides];
    newSlides.splice(index, 1);
    setHomeHeroForm({
      ...homeHeroForm,
      slides: newSlides
    });
    if (previewSlideIdx >= newSlides.length) {
      setPreviewSlideIdx(Math.max(0, newSlides.length - 1));
    }
  };

  const moveHeroSlide = (index: number, direction: 'up' | 'down') => {
    if (!homeHeroForm) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= homeHeroForm.slides.length) return;

    const newSlides = [...homeHeroForm.slides];
    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIndex];
    newSlides[targetIndex] = temp;

    setHomeHeroForm({
      ...homeHeroForm,
      slides: newSlides
    });
    setPreviewSlideIdx(targetIndex);
  };

  const updateHeroSlide = (index: number, key: keyof HeroSlide, value: string) => {
    if (!homeHeroForm) return;
    const newSlides = [...homeHeroForm.slides];
    newSlides[index] = {
      ...newSlides[index],
      [key]: value
    };
    setHomeHeroForm({
      ...homeHeroForm,
      slides: newSlides
    });
  };

  const handleHeroSlideFileUpload = (index: number, file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        updateHeroSlide(index, 'imageUrl', result);
      }
    };
    reader.readAsDataURL(file);
  };

  const resetHeroSlidesToDefault = () => {
    if (!homeHeroForm) return;
    setHomeHeroForm({
      ...homeHeroForm,
      slides: DEFAULT_HERO_SLIDES
    });
    setPreviewSlideIdx(0);
    triggerSuccess(lang === 'en' ? 'Reset to default Laos landmark slides' : 'ຣີເຊັດເປັນຮູບພາບມາດຕະຖານແລ້ວ');
  };

  const handleSaveTicketSponsors = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSponsorsForm) return;
    try {
      setIsSaving(true);
      setErrorMessage(null);
      // Ensure sync between single ad top-level fields and sponsors array for backward compatibility
      const syncedForm: TicketSponsorSettings = {
        ...ticketSponsorsForm,
        adName: ticketSponsorsForm.adName || ticketSponsorsForm.sponsors?.[0]?.name || 'LOCA Laos',
        adBannerUrl: ticketSponsorsForm.adBannerUrl || ticketSponsorsForm.sponsors?.[0]?.logoUrl || '/Loca banner.png',
        adWebsiteUrl: ticketSponsorsForm.adWebsiteUrl || ticketSponsorsForm.sponsors?.[0]?.websiteUrl || 'https://loca.la',
        isActive: ticketSponsorsForm.isActive !== undefined ? ticketSponsorsForm.isActive : (ticketSponsorsForm.sponsors?.[0]?.isActive ?? true),
        hasSchedule: ticketSponsorsForm.hasSchedule ?? false,
        startDate: ticketSponsorsForm.startDate || '',
        endDate: ticketSponsorsForm.endDate || '',
        defaultBannerUrl: ticketSponsorsForm.defaultBannerUrl || '/Pasopkan ads.png',
        defaultWebsiteUrl: ticketSponsorsForm.defaultWebsiteUrl || 'https://pasopkan.com',
        sponsors: [
          {
            id: ticketSponsorsForm.sponsors?.[0]?.id || 'sp-main',
            name: ticketSponsorsForm.adName || ticketSponsorsForm.sponsors?.[0]?.name || 'LOCA Laos',
            logoUrl: ticketSponsorsForm.adBannerUrl || ticketSponsorsForm.sponsors?.[0]?.logoUrl || '/Loca banner.png',
            websiteUrl: ticketSponsorsForm.adWebsiteUrl || ticketSponsorsForm.sponsors?.[0]?.websiteUrl || 'https://loca.la',
            isActive: ticketSponsorsForm.isActive !== undefined ? ticketSponsorsForm.isActive : (ticketSponsorsForm.sponsors?.[0]?.isActive ?? true),
            hasSchedule: ticketSponsorsForm.hasSchedule ?? false,
            startDate: ticketSponsorsForm.startDate || '',
            endDate: ticketSponsorsForm.endDate || ''
          }
        ]
      };
      await saveTicketSponsorSettings(syncedForm);
      setTicketSponsorsForm(syncedForm);
      addActivityLog('Site settings updated', 'Updated ticket ad sponsor banner and schedule settings');
      triggerSuccess(lang === 'en' ? 'Ticket ad banner & schedule settings saved successfully!' : 'ບັນທຶກໂຄສະນາ ແລະ ການຕັ້ງເວລາສະແດງເທິງປີ້ສຳເລັດແລ້ວ!');
    } catch (err) {
      setErrorMessage(lang === 'en' ? 'Failed to save settings.' : 'ເກີດຂໍ້ຜິດພາດໃນການບັນທຶກ.');
    } finally {
      setIsSaving(false);
    }
  };

  const applyAdPreset = (preset: { name: string; logoUrl: string; websiteUrl?: string }) => {
    if (!ticketSponsorsForm) return;
    setTicketSponsorsForm({
      ...ticketSponsorsForm,
      adName: preset.name,
      adBannerUrl: preset.logoUrl,
      adWebsiteUrl: preset.websiteUrl || '',
      isActive: true,
      sponsors: [
        {
          id: 'sp-main',
          name: preset.name,
          logoUrl: preset.logoUrl,
          websiteUrl: preset.websiteUrl || '',
          isActive: true,
          hasSchedule: ticketSponsorsForm.hasSchedule,
          startDate: ticketSponsorsForm.startDate,
          endDate: ticketSponsorsForm.endDate
        }
      ]
    });
  };

  const handleAdBannerUpload = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage(lang === 'en' ? 'Please upload an image file (PNG, JPG, SVG, WebP).' : 'ກະລຸນາເລືອກໄຟລ໌ຮູບພາບ.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setErrorMessage(lang === 'en' ? 'Image size is too large (maximum 3MB recommended).' : 'ຂະໜາດຮູບໃຫຍ່ເກີນໄປ (ສູງສຸດ 3MB).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl && ticketSponsorsForm) {
        setTicketSponsorsForm({
          ...ticketSponsorsForm,
          adBannerUrl: dataUrl,
          sponsors: [
            {
              id: ticketSponsorsForm.sponsors?.[0]?.id || 'sp-main',
              name: ticketSponsorsForm.adName || 'Custom Ad',
              logoUrl: dataUrl,
              websiteUrl: ticketSponsorsForm.adWebsiteUrl || '',
              isActive: ticketSponsorsForm.isActive ?? true,
              hasSchedule: ticketSponsorsForm.hasSchedule,
              startDate: ticketSponsorsForm.startDate,
              endDate: ticketSponsorsForm.endDate
            }
          ]
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const setAdScheduleDurationHours = (hours: number) => {
    if (!ticketSponsorsForm) return;
    const now = new Date();
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    const formatLocal = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    
    const startStr = formatLocal(now);
    const end = new Date(now.getTime() + hours * 60 * 60 * 1000);
    const endStr = formatLocal(end);

    setTicketSponsorsForm({
      ...ticketSponsorsForm,
      hasSchedule: true,
      startDate: startStr,
      endDate: endStr
    });
  };

  const clearAdSchedule = () => {
    if (!ticketSponsorsForm) return;
    setTicketSponsorsForm({
      ...ticketSponsorsForm,
      hasSchedule: false,
      startDate: '',
      endDate: ''
    });
  };

  const resetSponsorsToDefault = () => {
    if (!ticketSponsorsForm) return;
    setTicketSponsorsForm({
      ...DEFAULT_TICKET_SPONSOR_SETTINGS
    });
    triggerSuccess(lang === 'en' ? 'Reset to default ad banner (Loca Laos / Pasopkan fallback)' : 'ຣີເຊັດເປັນຄ່າມາດຕະຖານແລ້ວ');
  };

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
          onClick={() => { setActiveSubTab('home_hero'); setErrorMessage(null); }}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
            activeSubTab === 'home_hero'
              ? 'bg-adv-orange border-adv-orange text-white shadow-md shadow-orange-100'
              : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          {lang === 'en' ? 'Home Slide & Hero' : 'ສະໄລດ໌ & ຫົວຂໍ້ໜ້າຫຼັກ'}
        </button>

        <button
          type="button"
          onClick={() => { setActiveSubTab('ticket_sponsors'); setErrorMessage(null); }}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
            activeSubTab === 'ticket_sponsors'
              ? 'bg-adv-orange border-adv-orange text-white shadow-md shadow-orange-100'
              : 'bg-white border-gray-100 text-gray-500 hover:bg-gray-50'
          }`}
        >
          <Award className="w-4 h-4" />
          {lang === 'en' ? 'Ticket Sponsors' : 'ຜູ້ສະໜັບສະໜູນປີ້'}
        </button>

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
        {/* HOME HERO & SLIDER FORM */}
        {activeSubTab === 'home_hero' && homeHeroForm && (
          <form onSubmit={handleSaveHomeHero} className="space-y-8">
            {/* Header description */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-black text-adv-slate flex items-center gap-2 uppercase tracking-wide">
                  <ImageIcon className="w-5 h-5 text-adv-orange" />
                  {lang === 'en' ? 'Home Page Hero & Slide Images' : 'ສະໄລດ໌ຮູບພາບ ແລະ ຂໍ້ຄວາມໜ້າຫຼັກ'}
                </h3>
                <p className="text-xs font-medium text-gray-400 mt-1">
                  {lang === 'en' 
                    ? 'Customize the hero headline text, rotation speed, and manage the background slide images displayed on the homepage.' 
                    : 'ປັບແຕ່ງຫົວຂໍ້ໃຫຍ່, ຄວາມໄວໃນການປ່ຽນຮູບ, ແລະ ຈັດການຮູບພາບສະໄລດ໌ພື້ນຫຼັງທີ່ສະແດງຢູ່ໜ້າຫຼັກ.'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={resetHeroSlidesToDefault}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all"
                  title={lang === 'en' ? 'Reset to default landmark images' : 'ຣີເຊັດເປັນຮູບພາບມາດຕະຖານ'}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                  {lang === 'en' ? 'Reset Defaults' : 'ຣີເຊັດມາດຕະຖານ'}
                </button>
                <button
                  type="button"
                  onClick={addHeroSlide}
                  className="flex items-center gap-1.5 px-4 py-2 bg-orange-50 hover:bg-orange-100 text-adv-orange text-xs font-black rounded-xl transition-all border border-orange-200/60"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {lang === 'en' ? 'Add Slide' : 'ເພີ່ມຮູບສະໄລດ໌'}
                </button>
              </div>
            </div>

            {/* Live Interactive Hero Banner Preview */}
            <div className="bg-gray-900 rounded-3xl overflow-hidden border border-gray-800 shadow-xl">
              <div className="px-5 py-3 bg-black/60 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-adv-orange" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    {lang === 'en' ? 'Live Hero Banner Preview' : 'ຕົວຢ່າງສະແດງຜົນຕົວຈິງ'}
                  </span>
                </div>
                <div className="text-[11px] font-bold text-gray-400">
                  {lang === 'en' ? `Slide ${previewSlideIdx + 1} of ${homeHeroForm.slides.length}` : `ຮູບທີ ${previewSlideIdx + 1} ຈາກ ${homeHeroForm.slides.length}`}
                </div>
              </div>

              <div className="relative h-48 sm:h-64 md:h-72 w-full flex flex-col items-center justify-center text-center p-6 overflow-hidden">
                {/* Background image preview */}
                {homeHeroForm.slides[previewSlideIdx]?.imageUrl ? (
                  <img
                    src={homeHeroForm.slides[previewSlideIdx].imageUrl}
                    alt="Preview"
                    className="absolute inset-0 w-full h-full object-cover transition-all duration-700"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 to-slate-800 flex items-center justify-center text-gray-500 text-xs font-bold">
                    No image URL specified
                  </div>
                )}

                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/45 backdrop-blur-[0.5px]" />

                {/* Overlay Title */}
                <div className="relative z-10 max-w-2xl px-4">
                  <h1 className="text-xl sm:text-3xl md:text-4xl text-white font-black tracking-tight uppercase leading-[0.95] drop-shadow-md">
                    {lang === 'lo' ? (homeHeroForm.mainTitle_lo || 'ປະສົບການໃໝ່ໆລໍຖ້າທ່ານຢູ່') : (homeHeroForm.mainTitle_en || 'Your Next Adventure Awaits')}
                  </h1>
                  {homeHeroForm.slides[previewSlideIdx]?.title_en && (
                    <p className="mt-2 inline-block px-3 py-1 bg-black/50 backdrop-blur-md rounded-full text-[10px] sm:text-xs font-semibold text-white/90 border border-white/20">
                      📍 {lang === 'lo' ? (homeHeroForm.slides[previewSlideIdx].title_lo || homeHeroForm.slides[previewSlideIdx].title_en) : homeHeroForm.slides[previewSlideIdx].title_en}
                    </p>
                  )}
                </div>

                {/* Preview Prev / Next Controls */}
                {homeHeroForm.slides.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setPreviewSlideIdx((prev) => (prev > 0 ? prev - 1 : homeHeroForm.slides.length - 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all border border-white/20"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewSlideIdx((prev) => (prev + 1) % homeHeroForm.slides.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-all border border-white/20"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Dots indicator */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
                      {homeHeroForm.slides.map((_, dotIdx) => (
                        <button
                          key={dotIdx}
                          type="button"
                          onClick={() => setPreviewSlideIdx(dotIdx)}
                          className={`h-2 rounded-full transition-all ${
                            dotIdx === previewSlideIdx ? 'w-6 bg-adv-orange' : 'w-2 bg-white/50 hover:bg-white'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Main Title & General Settings */}
            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100 space-y-6">
              <h3 className="text-sm font-black text-adv-slate uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-adv-orange" />
                {lang === 'en' ? 'Main Hero Headline Text' : 'ຂໍ້ຄວາມຫົວຂໍ້ໃຫຍ່ໜ້າຫຼັກ'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">
                    Main Title (English) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={homeHeroForm.mainTitle_en}
                    onChange={(e) => setHomeHeroForm({ ...homeHeroForm, mainTitle_en: e.target.value })}
                    placeholder="e.g. Your Next Adventure Awaits"
                    className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-adv-slate font-bold shadow-sm focus:outline-none focus:border-adv-orange/30 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-1">
                    Main Title (Lao - ພາສາລາວ) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={homeHeroForm.mainTitle_lo}
                    onChange={(e) => setHomeHeroForm({ ...homeHeroForm, mainTitle_lo: e.target.value })}
                    placeholder="ຕົວຢ່າງ: ປະສົບການໃໝ່ໆລໍຖ້າທ່ານຢູ່"
                    className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-adv-slate font-bold shadow-sm focus:outline-none focus:border-adv-orange/30 transition-all"
                  />
                </div>

                <div className="col-span-1 md:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-gray-100">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">
                      {lang === 'en' ? 'Slide Rotation Speed (Seconds)' : 'ຄວາມໄວໃນການປ່ຽນສະໄລດ໌ (ວິນາທີ)'}
                    </label>
                    <p className="text-xs text-gray-400 font-medium pl-1">
                      {lang === 'en' ? 'How long each background photo is displayed before moving to the next.' : 'ໄລຍະເວລາສະແດງຮູບແຕ່ລະແຜ່ນກ່ອນປ່ຽນໄປຮູບຖັດໄປ.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {[3, 5, 8, 10].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setHomeHeroForm({ ...homeHeroForm, slideIntervalSeconds: sec })}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                          homeHeroForm.slideIntervalSeconds === sec
                            ? 'bg-adv-orange text-white shadow-xs'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                    <div className="flex items-center gap-1 ml-2">
                      <input
                        type="number"
                        min="2"
                        max="30"
                        value={homeHeroForm.slideIntervalSeconds || 5}
                        onChange={(e) => setHomeHeroForm({ ...homeHeroForm, slideIntervalSeconds: Math.max(2, parseInt(e.target.value) || 5) })}
                        className="w-16 bg-white border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-center font-bold text-adv-slate focus:outline-none focus:border-adv-orange"
                      />
                      <span className="text-xs font-bold text-gray-400">sec</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Slide Images List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-adv-slate uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-adv-orange" />
                    {lang === 'en' ? `Slide Background Images (${homeHeroForm.slides.length})` : `ລາຍການຮູບພາບສະໄລດ໌ (${homeHeroForm.slides.length})`}
                  </h3>
                  <p className="text-xs font-medium text-gray-400 mt-0.5">
                    {lang === 'en' ? 'Add, replace, reorder, or upload high-resolution photos for the hero background.' : 'ເພີ່ມ, ປ່ຽນ, ຈັດລຳດັບ, ຫຼື ອັບໂຫຼດຮູບພາບຄວາມລະອຽດສູງ.'}
                  </p>
                </div>
                
                <button
                  type="button"
                  onClick={addHeroSlide}
                  className="flex items-center gap-1.5 px-4 py-2 bg-adv-orange hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  {lang === 'en' ? 'Add Slide' : 'ເພີ່ມຮູບສະໄລດ໌'}
                </button>
              </div>

              <div className="space-y-4">
                {homeHeroForm.slides.map((slide, idx) => (
                  <div
                    key={slide.id || idx}
                    className="p-5 bg-gray-50/70 border border-gray-150 rounded-2xl transition-all hover:border-gray-200 space-y-4"
                  >
                    {/* Top Slide Row: Index & Controls */}
                    <div className="flex items-center justify-between pb-3 border-b border-gray-200/70">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-orange-100 text-adv-orange font-black text-xs flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <span className="text-xs font-black text-adv-slate uppercase tracking-wider">
                          {slide.title_en || slide.title_lo || (lang === 'en' ? `Slide Image #${idx + 1}` : `ຮູບສະໄລດ໌ #${idx + 1}`)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveHeroSlide(idx, 'up')}
                          className="p-1.5 bg-white border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title={lang === 'en' ? 'Move Up' : 'ຍ້າຍຂຶ້ນ'}
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === homeHeroForm.slides.length - 1}
                          onClick={() => moveHeroSlide(idx, 'down')}
                          className="p-1.5 bg-white border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title={lang === 'en' ? 'Move Down' : 'ຍ້າຍລົງ'}
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={homeHeroForm.slides.length <= 1}
                          onClick={() => removeHeroSlide(idx)}
                          className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors ml-1"
                          title={lang === 'en' ? 'Delete Slide' : 'ລຶບຮູບສະໄລດ໌'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Image Preview & URL Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                      {/* Thumbnail Preview */}
                      <div className="md:col-span-4 lg:col-span-3">
                        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-gray-200 border border-gray-300 group">
                          {slide.imageUrl ? (
                            <img
                              src={slide.imageUrl}
                              alt={`Slide ${idx + 1}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLElement).style.opacity = '0.3';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-2 text-center">
                              <ImageIcon className="w-6 h-6 mb-1 text-gray-300" />
                              <span className="text-[10px] font-bold">No Image</span>
                            </div>
                          )}

                          <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[11px] font-black cursor-pointer transition-opacity">
                            <UploadCloud className="w-5 h-5 mb-1" />
                            <span>{lang === 'en' ? 'Upload Image' : 'ອັບໂຫຼດຮູບ'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleHeroSlideFileUpload(idx, file);
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* URL and Caption inputs */}
                      <div className="md:col-span-8 lg:col-span-9 space-y-3">
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">
                            {lang === 'en' ? 'Image URL or Uploaded Data' : 'URL ຮູບພາບ ຫຼື ໄຟລ໌ທີ່ອັບໂຫຼດ'} <span className="text-red-500">*</span>
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              required
                              value={slide.imageUrl}
                              onChange={(e) => updateHeroSlide(idx, 'imageUrl', e.target.value)}
                              placeholder="https://images.unsplash.com/... or upload a file"
                              className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-mono text-adv-slate shadow-2xs focus:outline-none focus:border-adv-orange"
                            />
                            <label className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-adv-slate rounded-xl text-xs font-bold cursor-pointer transition-all shadow-2xs">
                              <UploadCloud className="w-3.5 h-3.5 text-adv-orange" />
                              <span>{lang === 'en' ? 'Upload' : 'ອັບໂຫຼດ'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleHeroSlideFileUpload(idx, file);
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">
                              Caption / Landmark (EN)
                            </label>
                            <input
                              type="text"
                              value={slide.title_en || ''}
                              onChange={(e) => updateHeroSlide(idx, 'title_en', e.target.value)}
                              placeholder="e.g. Luang Prabang Kuang Si Falls"
                              className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-medium text-adv-slate shadow-2xs focus:outline-none focus:border-adv-orange"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 pl-1">
                              Caption / Landmark (LO)
                            </label>
                            <input
                              type="text"
                              value={slide.title_lo || ''}
                              onChange={(e) => updateHeroSlide(idx, 'title_lo', e.target.value)}
                              placeholder="ຕົວຢ່າງ: ຕາດກວາງຊີ ຫຼວງພະບາງ"
                              className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-medium text-adv-slate shadow-2xs focus:outline-none focus:border-adv-orange"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-4">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-8 py-4 bg-adv-orange hover:bg-orange-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-orange-100 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {lang === 'en' ? 'Saving Settings...' : 'ກຳລັງບັນທຶກ...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {lang === 'en' ? 'Save Home Hero & Slide Changes' : 'ບັນທຶກການຕັ້ງຄ່າສະໄລດ໌ & ຫົວຂໍ້'}
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* TICKET SPONSORS & ADS FORM */}
        {activeSubTab === 'ticket_sponsors' && ticketSponsorsForm && (() => {
          const resolvedPreviewAd = resolveTicketAd(ticketSponsorsForm);
          const currentAdName = ticketSponsorsForm.adName || ticketSponsorsForm.sponsors?.[0]?.name || 'LOCA Laos';
          const currentAdBanner = ticketSponsorsForm.adBannerUrl || ticketSponsorsForm.sponsors?.[0]?.logoUrl || '/Loca banner.png';
          const currentAdLink = ticketSponsorsForm.adWebsiteUrl || ticketSponsorsForm.sponsors?.[0]?.websiteUrl || 'https://loca.la';
          const isCustomActive = ticketSponsorsForm.isActive !== undefined ? ticketSponsorsForm.isActive : (ticketSponsorsForm.sponsors?.[0]?.isActive ?? true);

          return (
            <form onSubmit={handleSaveTicketSponsors} className="space-y-8">
              {/* Header description & quick actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-base font-black text-adv-slate flex items-center gap-2 uppercase tracking-wide">
                    <Award className="w-5 h-5 text-adv-orange" />
                    {lang === 'en' ? 'E-Ticket Sponsor Ad & Schedule' : 'ໂຄສະນາຜູ້ສະໜັບສະໜູນ & ຕັ້ງເວລາເທິງປີ້ E-Ticket'}
                  </h3>
                  <p className="text-xs font-medium text-gray-400 mt-1">
                    {lang === 'en'
                      ? 'Configure a single sponsor ad banner and display schedule. If time is expired or over time, tickets automatically fall back to "Pasopkan ads.png".'
                      : 'ຈັດການປ້າຍໂຄສະນາ 1 ຕຳແໜ່ງ ແລະ ຕັ້ງເວລາສະແດງ. ຖ້າໝົດເວລາ ລະບົບຈະສະແດງຮູບມາດຕະຖານ "Pasopkan ads.png" ອັດຕະໂນມັດ.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={resetSponsorsToDefault}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all"
                    title={lang === 'en' ? 'Reset to default ad banner' : 'ຣີເຊັດເປັນຄ່າມາດຕະຖານ'}
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                    {lang === 'en' ? 'Reset Defaults' : 'ຣີເຊັດມາດຕະຖານ'}
                  </button>
                </div>
              </div>

              {/* Master Toggle & General Configuration */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Form Controls & Tabs */}
                <div className="lg:col-span-6 space-y-5">
                  {/* Master Switch Card */}
                  <div className={`p-5 rounded-2xl border transition-all ${
                    ticketSponsorsForm.isEnabled 
                      ? 'bg-orange-50/40 border-orange-200 shadow-xs' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${ticketSponsorsForm.isEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                          <h4 className="text-sm font-black text-adv-slate">
                            {lang === 'en' ? 'Show Ad Banner on E-Tickets' : 'ສະແດງປ້າຍໂຄສະນາເທິງປີ້ E-Ticket'}
                          </h4>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {lang === 'en'
                            ? 'When enabled, the sponsor ad banner is rendered underneath the QR code.'
                            : 'ເມື່ອເປີດໃຊ້, ປ້າຍໂຄສະນາຈະສະແດງຢູ່ກ້ອງ QR Code.'}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setTicketSponsorsForm({ ...ticketSponsorsForm, isEnabled: !ticketSponsorsForm.isEnabled })}
                        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
                          ticketSponsorsForm.isEnabled ? 'bg-adv-orange' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                            ticketSponsorsForm.isEnabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Setting Sub-Tabs (Content / Schedule / Fallback) */}
                  <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-2xl border border-gray-200/60">
                    <button
                      type="button"
                      onClick={() => setAdSubTab('content')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black transition-all ${
                        adSubTab === 'content'
                          ? 'bg-white text-adv-slate shadow-xs border border-gray-150'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-adv-orange" />
                      <span>{lang === 'en' ? '1. Ad Content' : '1. ປ້າຍໂຄສະນາ'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdSubTab('schedule')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black transition-all ${
                        adSubTab === 'schedule'
                          ? 'bg-white text-adv-slate shadow-xs border border-gray-150'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 text-adv-orange" />
                      <span>{lang === 'en' ? '2. Display Time' : '2. ຕັ້ງເວລາສະແດງ'}</span>
                      {ticketSponsorsForm.hasSchedule && (
                        <span className="w-2 h-2 rounded-full bg-adv-orange animate-ping" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdSubTab('fallback')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-black transition-all ${
                        adSubTab === 'fallback'
                          ? 'bg-white text-adv-slate shadow-xs border border-gray-150'
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 text-adv-orange" />
                      <span>{lang === 'en' ? '3. Default Image' : '3. ຮູບມາດຕະຖານ'}</span>
                    </button>
                  </div>

                  {/* TAB 1: AD BANNER & CONTENT */}
                  {adSubTab === 'content' && (
                    <div className="space-y-4">
                      {/* Preset Fast-Select Buttons */}
                      <div className="p-4 bg-gray-50/70 border border-gray-150 rounded-2xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-adv-slate uppercase tracking-wider flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-adv-orange" />
                            {lang === 'en' ? 'Quick Choose Partner / Preset' : 'ເລືອກໂຄສະນາດ່ວນ'}
                          </h4>
                          <span className="text-[10px] font-bold text-gray-400">
                            {lang === 'en' ? '1 Ad Slot Active' : 'ສະແດງ 1 ໂຄສະນາ'}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          {[
                            { name: 'LOCA Laos (Official Ride Partner)', logoUrl: '/Loca banner.png', websiteUrl: 'https://loca.la' },
                            { name: 'Pasopkan Ads (Default)', logoUrl: '/Pasopkan ads.png', websiteUrl: 'https://pasopkan.com' },
                          ].map((preset) => {
                            const isSelected = currentAdBanner === preset.logoUrl;
                            return (
                              <button
                                key={preset.logoUrl}
                                type="button"
                                onClick={() => applyAdPreset(preset)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-2xs ${
                                  isSelected
                                    ? 'bg-orange-500 text-white border-orange-500 shadow-sm'
                                    : 'bg-white border-gray-200 text-gray-700 hover:border-adv-orange/50 hover:bg-orange-50/20'
                                }`}
                              >
                                <img 
                                  src={preset.logoUrl} 
                                  alt={preset.name} 
                                  className="h-3.5 w-auto object-contain" 
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                                <span className="truncate max-w-[130px]">{preset.name}</span>
                                {isSelected ? (
                                  <Check className="w-3 h-3 text-white shrink-0" />
                                ) : (
                                  <Plus className="w-3 h-3 text-adv-orange shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Single Ad Details Card */}
                      <div className="p-5 bg-white border border-gray-200 rounded-2xl space-y-4 shadow-xs">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-orange-100 text-adv-orange font-black text-xs flex items-center justify-center">
                              #1
                            </span>
                            <span className="text-xs font-black text-adv-slate">
                              {currentAdName || (lang === 'en' ? 'Sponsor Ad Slot' : 'ຊ່ອງໂຄສະນາ')}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const newActive = !isCustomActive;
                                setTicketSponsorsForm({
                                  ...ticketSponsorsForm,
                                  isActive: newActive,
                                  sponsors: [
                                    {
                                      id: 'sp-main',
                                      name: currentAdName,
                                      logoUrl: currentAdBanner,
                                      websiteUrl: currentAdLink,
                                      isActive: newActive,
                                      hasSchedule: ticketSponsorsForm.hasSchedule,
                                      startDate: ticketSponsorsForm.startDate,
                                      endDate: ticketSponsorsForm.endDate
                                    }
                                  ]
                                });
                              }}
                              className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                                isCustomActive
                                  ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                                  : 'bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200'
                              }`}
                            >
                              {isCustomActive ? (lang === 'en' ? 'Custom Ad Enabled' : 'ເປີດໃຊ້ໂຄສະນານີ້') : (lang === 'en' ? 'Custom Ad Disabled' : 'ປິດໃຊ້')}
                            </button>
                          </div>
                        </div>

                        {/* Partner Name Input */}
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 pl-1">
                            {lang === 'en' ? 'Sponsor / Advertiser Name *' : 'ຊື່ຜູ້ສະໜັບສະໜູນ / ໂຄສະນາ *'}
                          </label>
                          <input
                            type="text"
                            required
                            value={currentAdName}
                            onChange={(e) => {
                              const val = e.target.value;
                              setTicketSponsorsForm({
                                ...ticketSponsorsForm,
                                adName: val,
                                sponsors: [
                                  {
                                    id: 'sp-main',
                                    name: val,
                                    logoUrl: currentAdBanner,
                                    websiteUrl: currentAdLink,
                                    isActive: isCustomActive,
                                    hasSchedule: ticketSponsorsForm.hasSchedule,
                                    startDate: ticketSponsorsForm.startDate,
                                    endDate: ticketSponsorsForm.endDate
                                  }
                                ]
                              });
                            }}
                            placeholder="e.g. LOCA Laos (Official Ride Partner)"
                            className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-adv-slate shadow-2xs focus:outline-none focus:border-adv-orange"
                          />
                        </div>

                        {/* Target Website URL */}
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 pl-1">
                            {lang === 'en' ? 'Target Website / Landing URL (Optional)' : 'ລິ້ງເວັບໄຊປາຍທາງ (ຖ້າມີ)'}
                          </label>
                          <div className="relative">
                            <input
                              type="url"
                              value={currentAdLink}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTicketSponsorsForm({
                                  ...ticketSponsorsForm,
                                  adWebsiteUrl: val,
                                  sponsors: [
                                    {
                                      id: 'sp-main',
                                      name: currentAdName,
                                      logoUrl: currentAdBanner,
                                      websiteUrl: val,
                                      isActive: isCustomActive,
                                      hasSchedule: ticketSponsorsForm.hasSchedule,
                                      startDate: ticketSponsorsForm.startDate,
                                      endDate: ticketSponsorsForm.endDate
                                    }
                                  ]
                                });
                              }}
                              placeholder="https://loca.la"
                              className="w-full bg-white border border-gray-200 rounded-xl pl-3.5 pr-9 py-2.5 text-xs font-medium text-adv-slate shadow-2xs focus:outline-none focus:border-adv-orange"
                            />
                            {currentAdLink && (
                              <a
                                href={currentAdLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-adv-orange"
                                title="Open Website"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Banner Image URL and Upload */}
                        <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 pl-1">
                            {lang === 'en' ? 'Banner Image (URL or Upload)' : 'ຮູບປ້າຍໂຄສະນາ (URL ຫຼື ອັບໂຫຼດ)'}
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              required
                              value={currentAdBanner}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTicketSponsorsForm({
                                  ...ticketSponsorsForm,
                                  adBannerUrl: val,
                                  sponsors: [
                                    {
                                      id: 'sp-main',
                                      name: currentAdName,
                                      logoUrl: val,
                                      websiteUrl: currentAdLink,
                                      isActive: isCustomActive,
                                      hasSchedule: ticketSponsorsForm.hasSchedule,
                                      startDate: ticketSponsorsForm.startDate,
                                      endDate: ticketSponsorsForm.endDate
                                    }
                                  ]
                                });
                              }}
                              placeholder="/Loca banner.png or https://..."
                              className="flex-1 bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-mono text-adv-slate shadow-2xs focus:outline-none focus:border-adv-orange"
                            />

                            <label className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-50 hover:bg-orange-100 text-adv-orange border border-orange-200 rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0">
                              <UploadCloud className="w-3.5 h-3.5 text-adv-orange" />
                              <span>{lang === 'en' ? 'Upload' : 'ອັບໂຫຼດ'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleAdBannerUpload(file);
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        {/* Banner Preview Box */}
                        <div className="p-3 bg-gray-50 rounded-xl border border-gray-150 flex flex-col items-center justify-center min-h-[70px]">
                          {currentAdBanner ? (
                            <img
                              src={currentAdBanner}
                              alt={currentAdName}
                              className="w-full max-h-16 object-contain rounded-lg drop-shadow-2xs"
                              onError={(e) => {
                                (e.target as HTMLElement).style.opacity = '0.3';
                              }}
                            />
                          ) : (
                            <div className="flex items-center gap-2 text-gray-400 text-xs">
                              <ImageIcon className="w-4 h-4" />
                              <span>No Banner Image Selected</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: DISPLAY TIME & SCHEDULE SETTINGS */}
                  {adSubTab === 'schedule' && (
                    <div className="p-5 bg-white border border-gray-200 rounded-2xl space-y-5 shadow-xs">
                      {/* Schedule Master Toggle */}
                      <div className={`p-4 rounded-xl border transition-all ${
                        ticketSponsorsForm.hasSchedule 
                          ? 'bg-orange-50/50 border-orange-200' 
                          : 'bg-gray-50/80 border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <Clock className={`w-4 h-4 ${ticketSponsorsForm.hasSchedule ? 'text-adv-orange' : 'text-gray-400'}`} />
                              <h5 className="text-xs font-black text-adv-slate">
                                {lang === 'en' ? 'Enable Time Schedule for Ad' : 'ເປີດການຕັ້ງເວລາສະແດງໂຄສະນາ'}
                              </h5>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-1">
                              {lang === 'en'
                                ? 'If enabled, the ad will only show between Start & End dates. If over time, it reverts to "Pasopkan ads.png".'
                                : 'ເມື່ອເປີດໃຊ້, ໂຄສະນາຈະສະແດງສະເພາະໄລຍະເວລາທີ່ກຳນົດ. ເມື່ອໝົດເວລາ ຈະກັບໄປໃຊ້ຮູບ "Pasopkan ads.png".'}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              const newSched = !ticketSponsorsForm.hasSchedule;
                              setTicketSponsorsForm({
                                ...ticketSponsorsForm,
                                hasSchedule: newSched
                              });
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                              ticketSponsorsForm.hasSchedule ? 'bg-adv-orange' : 'bg-gray-300'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                ticketSponsorsForm.hasSchedule ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </div>
                      </div>

                      {/* Start and End Date Inputs */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 pl-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-adv-orange" />
                              {lang === 'en' ? 'Start Date & Time' : 'ວັນທີ & ເວລາເລີ່ມຕົ້ນ'}
                            </label>
                            <input
                              type="datetime-local"
                              disabled={!ticketSponsorsForm.hasSchedule}
                              value={ticketSponsorsForm.startDate || ''}
                              onChange={(e) => setTicketSponsorsForm({ ...ticketSponsorsForm, startDate: e.target.value })}
                              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-adv-slate disabled:bg-gray-100 disabled:text-gray-400 shadow-2xs focus:outline-none focus:border-adv-orange"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 pl-1 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-adv-orange" />
                              {lang === 'en' ? 'End Date & Time (Expiration)' : 'ວັນທີ & ເວລາສິ້ນສຸດ (ໝົດອາຍຸ)'}
                            </label>
                            <input
                              type="datetime-local"
                              disabled={!ticketSponsorsForm.hasSchedule}
                              value={ticketSponsorsForm.endDate || ''}
                              onChange={(e) => setTicketSponsorsForm({ ...ticketSponsorsForm, endDate: e.target.value })}
                              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-adv-slate disabled:bg-gray-100 disabled:text-gray-400 shadow-2xs focus:outline-none focus:border-adv-orange"
                            />
                          </div>
                        </div>

                        {/* Quick Presets for Duration */}
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 pl-1">
                            {lang === 'en' ? 'Quick Duration Helpers (From Now):' : 'ເລືອກໄລຍະເວລາດ່ວນ (ນັບຈາກຕອນນີ້):'}
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { label: '+24 Hours', hours: 24 },
                              { label: '+3 Days', hours: 72 },
                              { label: '+7 Days', hours: 168 },
                              { label: '+14 Days', hours: 336 },
                              { label: '+30 Days', hours: 720 },
                            ].map((dur) => (
                              <button
                                key={dur.label}
                                type="button"
                                onClick={() => setAdScheduleDurationHours(dur.hours)}
                                className="px-2.5 py-1 bg-gray-50 hover:bg-orange-50 text-gray-700 hover:text-adv-orange border border-gray-200 hover:border-orange-200 rounded-lg text-xs font-bold transition-colors"
                              >
                                {dur.label}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={clearAdSchedule}
                              className="px-2.5 py-1 bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-lg text-xs font-bold transition-colors"
                            >
                              {lang === 'en' ? 'Clear' : 'ລ້າງ'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Live Schedule Status Card */}
                      <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                        resolvedPreviewAd.status === 'active_custom'
                          ? 'bg-green-50/70 border-green-200 text-green-900'
                          : resolvedPreviewAd.status === 'expired_fallback'
                          ? 'bg-red-50/70 border-red-200 text-red-900'
                          : resolvedPreviewAd.status === 'scheduled_future'
                          ? 'bg-yellow-50/70 border-yellow-200 text-yellow-900'
                          : 'bg-gray-50 border-gray-200 text-gray-700'
                      }`}>
                        {resolvedPreviewAd.status === 'active_custom' && <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />}
                        {resolvedPreviewAd.status === 'expired_fallback' && <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />}
                        {resolvedPreviewAd.status === 'scheduled_future' && <Clock className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />}
                        {resolvedPreviewAd.status === 'inactive_fallback' && <AlertCircle className="w-5 h-5 text-gray-500 shrink-0 mt-0.5" />}

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase tracking-wider">
                              {resolvedPreviewAd.status === 'active_custom' && (lang === 'en' ? 'Status: Active (Within Schedule)' : 'ສະຖານະ: ກຳລັງສະແດງຜົນ (ຢູ່ໃນເວລາ)')}
                              {resolvedPreviewAd.status === 'expired_fallback' && (lang === 'en' ? 'Status: Over Time (Expired)' : 'ສະຖານະ: ໝົດເວລາແລ້ວ (Over Time)')}
                              {resolvedPreviewAd.status === 'scheduled_future' && (lang === 'en' ? 'Status: Scheduled (Upcoming)' : 'ສະຖານະ: ຕັ້ງເວລາໄວ້ (ຍັງບໍ່ຮອດເວລາ)')}
                              {resolvedPreviewAd.status === 'inactive_fallback' && (lang === 'en' ? 'Status: Custom Ad Disabled' : 'ສະຖານະ: ປິດໃຊ້ໂຄສະນາ')}
                            </span>
                          </div>
                          <p className="text-xs opacity-90 leading-relaxed">
                            {resolvedPreviewAd.status === 'active_custom' && (
                              lang === 'en' 
                                ? `Displaying "${currentAdName}" custom banner on all E-tickets.` 
                                : `ກຳລັງສະແດງປ້າຍໂຄສະນາ "${currentAdName}" ເທິງປີ້ E-ticket.`
                            )}
                            {resolvedPreviewAd.status === 'expired_fallback' && (
                              lang === 'en' 
                                ? 'The scheduled end time has passed. Tickets automatically fall back to "Pasopkan ads.png".' 
                                : 'ກາຍເວລາທີ່ກຳນົດແລ້ວ! ລະບົບປີ້ E-ticket ຈະສະແດງຮູບພາບມາດຕະຖານ "Pasopkan ads.png" ແທນອັດຕະໂນມັດ.'
                            )}
                            {resolvedPreviewAd.status === 'scheduled_future' && (
                              lang === 'en' 
                                ? 'Start time is in the future. Tickets will display default "Pasopkan ads.png" until start date.' 
                                : 'ຍັງບໍ່ຮອດເວລາເລີ່ມຕົ້ນ. ລະບົບຈະສະແດງຮູບມາດຕະຖານ "Pasopkan ads.png" ຈົນກວ່າຈະຮອດເວລາ.'
                            )}
                            {resolvedPreviewAd.status === 'inactive_fallback' && (
                              lang === 'en' 
                                ? 'Showing default "Pasopkan ads.png" fallback banner.' 
                                : 'ກຳລັງສະແດງຮູບມາດຕະຖານ "Pasopkan ads.png".'
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: DEFAULT FALLBACK IMAGE */}
                  {adSubTab === 'fallback' && (
                    <div className="p-5 bg-white border border-gray-200 rounded-2xl space-y-4 shadow-xs">
                      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                        <Layers className="w-4 h-4 text-adv-orange" />
                        <h4 className="text-xs font-black text-adv-slate uppercase tracking-wider">
                          {lang === 'en' ? 'Default Fallback Banner ("Pasopkan ads.png")' : 'ຮູບພາບມາດຕະຖານ ("Pasopkan ads.png")'}
                        </h4>
                      </div>

                      <p className="text-xs text-gray-500 leading-relaxed">
                        {lang === 'en'
                          ? 'This official default banner image is automatically presented whenever no custom ad is running or when a custom ad campaign has finished its scheduled time window.'
                          : 'ຮູບປ້າຍນີ້ຈະສະແດງອັດຕະໂນມັດເມື່ອໂຄສະນາໝົດເວລາ (Over time), ປິດໃຊ້ງານ, ຫຼື ບໍ່ມີໂຄສະນາສະເພາະ.'}
                      </p>

                      <div className="p-4 bg-gray-50 rounded-2xl border border-gray-150 flex flex-col items-center justify-center space-y-2">
                        <img 
                          src={ticketSponsorsForm.defaultBannerUrl || '/Pasopkan ads.png'} 
                          alt="Pasopkan Ads Default" 
                          className="w-full max-h-24 object-contain rounded-xl drop-shadow-sm" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/pasopkan_logo.png';
                          }}
                        />
                        <span className="text-[11px] font-mono font-bold text-gray-400">
                          {ticketSponsorsForm.defaultBannerUrl || '/Pasopkan ads.png'}
                        </span>
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 pl-1">
                          {lang === 'en' ? 'Default Fallback Target URL' : 'ລິ້ງປາຍທາງຮູບມາດຕະຖານ'}
                        </label>
                        <input
                          type="url"
                          value={ticketSponsorsForm.defaultWebsiteUrl || 'https://pasopkan.com'}
                          onChange={(e) => setTicketSponsorsForm({ ...ticketSponsorsForm, defaultWebsiteUrl: e.target.value })}
                          placeholder="https://pasopkan.com"
                          className="w-full bg-white border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs font-medium text-adv-slate shadow-2xs focus:outline-none focus:border-adv-orange"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Live E-Ticket Sponsor Preview (White Theme) */}
                <div className="lg:col-span-6">
                  {/* Clean White Container as requested */}
                  <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-200/90 text-gray-900 shadow-xl space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Eye className="w-4 h-4 text-adv-orange" />
                        <span className="text-xs font-black uppercase tracking-wider text-adv-slate">
                          {lang === 'en' ? 'Live E-Ticket Preview' : 'ຕົວຢ່າງສະແດງຜົນເທິງປີ້ E-Ticket ຕົວຈິງ'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                          resolvedPreviewAd.status === 'active_custom'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : resolvedPreviewAd.status === 'expired_fallback'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : resolvedPreviewAd.status === 'scheduled_future'
                            ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                          {resolvedPreviewAd.status === 'active_custom' && (lang === 'en' ? 'Custom Ad Live' : 'ໂຄສະນາສະແດງ')}
                          {resolvedPreviewAd.status === 'expired_fallback' && (lang === 'en' ? 'Expired → Pasopkan Fallback' : 'ໝົດເວລາ → ຮູບມາດຕະຖານ')}
                          {resolvedPreviewAd.status === 'scheduled_future' && (lang === 'en' ? 'Upcoming → Pasopkan Fallback' : 'ຕັ້ງເວລາ → ຮູບມາດຕະຖານ')}
                          {resolvedPreviewAd.status === 'inactive_fallback' && (lang === 'en' ? 'Pasopkan Default' : 'ຮູບມາດຕະຖານ')}
                          {resolvedPreviewAd.status === 'default_fallback' && (lang === 'en' ? 'Ad Bar Hidden' : 'ເຊື່ອງໄວ້')}
                        </span>
                      </div>
                    </div>

                    {/* Full E-Ticket Mockup Frame Matching ETicketModal */}
                    <div className="w-full max-w-[340px] sm:max-w-[360px] mx-auto rounded-[28px] bg-gradient-to-b from-[#FF5500] via-[#F24E00] to-[#E04500] text-white p-3.5 shadow-2xl flex flex-col justify-between overflow-hidden border border-orange-400/30">
                      {/* Top Bar Header in Ticket */}
                      <div className="flex items-center justify-between mb-2.5 px-1 pt-0.5 shrink-0">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center bg-black/15 text-white">
                          <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                        </div>
                        <h2 className="text-sm font-bold text-white tracking-tight">
                          {lang === 'lo' ? 'ປີ້ E-Ticket ຂອງທ່ານ' : 'Your E-Ticket'}
                        </h2>
                        <div className="w-7 h-7" />
                      </div>

                      {/* White E-Ticket Inner Card */}
                      <div className="relative flex-1 flex flex-col justify-between bg-white rounded-[22px] text-gray-900 shadow-xl overflow-hidden pt-3.5 pb-3 px-4 min-h-0">
                        {/* Top Ticket Details */}
                        <div className="shrink-0">
                          {/* Brand Logo Header Bar */}
                          <div className="flex items-center justify-center pb-2 mb-2 border-b border-gray-100 shrink-0">
                            <img 
                              src="/pasopkan_logo.png" 
                              alt="Pasopkan" 
                              className="h-12 sm:h-14 md:h-16 w-auto max-w-[260px] object-contain drop-shadow-sm transition-transform" 
                              referrerPolicy="no-referrer"
                            />
                          </div>

                          {/* Event Title */}
                          <h1 className="text-base sm:text-lg md:text-xl font-black text-gray-950 leading-tight mb-2 tracking-tight line-clamp-1">
                            Senglao Acoustic Night 2026
                          </h1>

                          {/* 2-Column Info Grid */}
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-2">
                            <div>
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                {lang === 'lo' ? 'ວັນທີ' : 'Date'}
                              </p>
                              <p className="text-xs font-bold text-gray-950 leading-tight">
                                28 Aug 2026
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                {lang === 'lo' ? 'ເວລາ' : 'Time'}
                              </p>
                              <p className="text-xs font-bold text-gray-950 leading-tight">
                                19:00
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                {lang === 'lo' ? 'ປະເພດການເຂົ້າ' : 'Check In Type'}
                              </p>
                              <p className="text-xs font-bold text-gray-950 leading-tight truncate">
                                VIP Access
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                                {lang === 'lo' ? 'ລະຫັດອໍເດີ' : 'Order ID'}
                              </p>
                              <p className="text-xs font-bold text-gray-950 font-mono tracking-tight leading-tight">
                                EBP948201AC
                              </p>
                            </div>
                          </div>

                          {/* Place / Venue */}
                          <div>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                              {lang === 'lo' ? 'ສະຖານທີ່' : 'Place'}
                            </p>
                            <p className="text-xs font-semibold text-gray-900 leading-snug truncate">
                              National Convention Centre, Vientiane
                            </p>
                          </div>
                        </div>

                        {/* Perforated Divider with Circular Concave Cutouts */}
                        <div className="relative my-2.5 -mx-4 py-1 flex items-center shrink-0">
                          {/* Left Cutout */}
                          <div className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#F24E00] z-10" />
                          
                          {/* Dashed Perforation Line */}
                          <div className="w-full border-t-2 border-dashed border-gray-200 mx-4" />

                          {/* Right Cutout */}
                          <div className="absolute -right-3.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#F24E00] z-10" />
                        </div>

                        {/* Direct QR Code Section */}
                        <div className="py-1 flex-1 flex flex-col items-center justify-center min-h-0">
                          <div className="p-3 sm:p-4 bg-white rounded-2xl sm:rounded-3xl border border-gray-200 shadow-md flex items-center justify-center shrink-0">
                            <QRCodeSVG
                              value="PREVIEW-TICKET-EBP948201AC"
                              size={300}
                              className="w-52 h-52 sm:w-60 sm:h-60 md:w-64 md:h-64"
                              level="H"
                              includeMargin={false}
                            />
                          </div>
                        </div>

                        {/* Dynamic Sponsor Ad Banner under QR Code */}
                        {ticketSponsorsForm.isEnabled && resolvedPreviewAd.isDisplayed && resolvedPreviewAd.bannerUrl ? (
                          <div className="pt-2 pb-0.5 flex flex-col items-center justify-center shrink-0 border-t border-gray-100/80 mt-1 w-full">
                            {/* Full-width sponsor banner */}
                            <div className="w-full h-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-200/80 shadow-2xs">
                              <img 
                                src={resolvedPreviewAd.bannerUrl} 
                                alt={resolvedPreviewAd.name || 'Ad Banner'} 
                                className="w-full h-full object-cover object-center rounded-xl hover:scale-[1.02] transition-transform duration-200" 
                                referrerPolicy="no-referrer" 
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/Pasopkan ads.png';
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="pt-2 pb-1 text-center border-t border-gray-100 mt-1">
                            <span className="text-[10px] italic font-medium text-gray-400">
                              {lang === 'en' ? '(Ad banner disabled on E-Tickets)' : '(ປິດການສະແດງຜົນໂຄສະນາເທິງປີ້)'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-center pt-1">
                      <p className="text-[11px] font-bold text-gray-600">
                        {resolvedPreviewAd.status === 'active_custom' ? (
                          <span className="text-green-600">● {lang === 'en' ? `Showing Custom Ad: ${resolvedPreviewAd.name}` : `ກຳລັງສະແດງ: ${resolvedPreviewAd.name}`}</span>
                        ) : resolvedPreviewAd.status === 'expired_fallback' ? (
                          <span className="text-red-600">● {lang === 'en' ? 'Time Expired → Reverted to default "Pasopkan ads.png"' : 'ໝົດເວລາ → ກັບໄປໃຊ້ "Pasopkan ads.png"'}</span>
                        ) : resolvedPreviewAd.status === 'scheduled_future' ? (
                          <span className="text-yellow-600">● {lang === 'en' ? 'Upcoming → Reverted to default "Pasopkan ads.png"' : 'ຍັງບໍ່ຮອດເວລາ → ໃຊ້ "Pasopkan ads.png"'}</span>
                        ) : (
                          <span className="text-gray-400">{lang === 'en' ? 'Showing Default "Pasopkan ads.png"' : 'ສະແດງຮູບມາດຕະຖານ "Pasopkan ads.png"'}</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-4">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-8 py-4 bg-adv-orange hover:bg-orange-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-orange-100 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {lang === 'en' ? 'Saving Settings...' : 'ກຳລັງບັນທຶກ...'}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {lang === 'en' ? 'Save Ticket Ad & Schedule' : 'ບັນທຶກໂຄສະນາ & ການຕັ້ງເວລາ'}
                    </>
                  )}
                </button>
              </div>
            </form>
          );
        })()}

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
