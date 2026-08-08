import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ArrowLeft, Save, User, CheckCircle2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../LanguageContext';
import { useAuth } from '../AuthContext';
import SocialLinksForm, { SocialLinks } from '../components/SocialLinksForm';

const translations = {
  en: {
    editProfile: 'Edit Profile',
    backToAccount: 'Back to Account',
    profilePicture: 'Profile Picture',
    clickToUpdate: 'Click on the image to update your photo.',
    personalInfo: 'Personal Information',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email Address',
    phone: 'Phone Number',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    other: 'Other',
    selectGender: 'Select Gender',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    saving: 'Saving...',
    saved: 'Saved!',
    successMessage: 'Profile updated successfully'
  },
  lo: {
    editProfile: 'ແກ້ໄຂໂປຣໄຟລ໌',
    backToAccount: 'ກັບໄປທີ່ບັນຊີ',
    profilePicture: 'ຮູບໂປຣໄຟລ໌',
    clickToUpdate: 'ຄລິກທີ່ຮູບເພື່ອອັບເດດຮູບຂອງທ່ານ.',
    personalInfo: 'ຂໍ້ມູນສ່ວນຕົວ',
    firstName: 'ຊື່',
    lastName: 'ນາມສະກຸນ',
    email: 'ທີ່ຢູ່ອີເມວ',
    phone: 'ເບີໂທລະສັບ',
    gender: 'ເພດ',
    male: 'ຊາຍ',
    female: 'ຍິງ',
    other: 'ອື່ນໆ',
    selectGender: 'ເລືອກເພດ',
    cancel: 'ຍົກເລີກ',
    saveChanges: 'ບັນທຶກການປ່ຽນແປງ',
    saving: 'ກຳລັງບັນທຶກ...',
    saved: 'ບັນທຶກແລ້ວ!',
    successMessage: 'ອັບເດດໂປຣໄຟລ໌ສຳເລັດແລ້ວ'
  }
};

export default function EditProfile() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { syncProfileToFirestore } = useAuth();
  const t = translations[lang];
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState(() => {
    try {
      const saved = localStorage.getItem('pasopkan_user_profile');
      if (saved) {
        return {
          firstName: 'Sirithida',
          lastName: 'Souksavat',
          email: 'sirithida.ssv@gmail.com',
          phone: '',
          gender: '' as 'male' | 'female' | 'other' | '',
          ...JSON.parse(saved)
        };
      }
    } catch (e) {
      console.error(e);
    }
    return {
      firstName: 'Sirithida',
      lastName: 'Souksavat',
      email: 'sirithida.ssv@gmail.com',
      phone: '',
      gender: '' as 'male' | 'female' | 'other' | '',
    };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Pic = reader.result as string;
        setProfilePic(base64Pic);
        try {
          localStorage.setItem('pasopkan_user_profile_pic', base64Pic);
          await syncProfileToFirestore({ profilePic: base64Pic });
        } catch (err) {
          console.error(err);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    try {
      const savedPic = localStorage.getItem('pasopkan_user_profile_pic');
      if (savedPic) setProfilePic(savedPic);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let processedValue = value;
    
    // Apply input restrictions: names cannot have numbers, phone numbers only numbers
    if (name === 'firstName' || name === 'lastName') {
      processedValue = value.replace(/[0-9]/g, '');
    } else if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '');
      const maxLen = 
        digitsOnly.startsWith('856020') ? 14 :
        digitsOnly.startsWith('85620') ? 13 :
        digitsOnly.startsWith('856') ? 14 :
        digitsOnly.startsWith('020') ? 11 : 10;
      processedValue = digitsOnly.slice(0, maxLen);
    }
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      localStorage.setItem('pasopkan_user_profile', JSON.stringify(formData));
      await syncProfileToFirestore(formData);
    } catch (err) {
      console.error(err);
    }
    
    setIsSaving(false);
    setShowSuccess(true);
    
    setTimeout(() => {
      navigate('/account');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-4 md:py-6">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-adv-slate transition-colors mb-4 group cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold text-sm">{t.backToAccount}</span>
        </button>

        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-adv-slate mb-5">{t.editProfile}</h1>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Profile Picture */}
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 flex flex-col items-center sm:flex-row gap-8 shadow-sm">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-28 h-28 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300 shrink-0 overflow-hidden">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-lg font-bold text-adv-slate mb-1">{t.profilePicture}</h3>
              <p className="text-sm text-gray-400 font-medium mb-3">{t.clickToUpdate}</p>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 space-y-8 shadow-sm">
            <h2 className="text-xl font-bold text-adv-slate mb-4">{t.personalInfo}</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label htmlFor="firstName" className="block text-xs font-bold text-gray-400 uppercase tracking-widest">{t.firstName}</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName || ""}
                  onChange={handleChange}
                  className="w-full bg-[#F9FAFB] border border-gray-100 rounded-2xl px-6 py-4 text-adv-slate font-bold focus:outline-none focus:ring-2 focus:ring-adv-orange transition-all"
                />
              </div>
              <div className="space-y-3">
                <label htmlFor="lastName" className="block text-xs font-bold text-gray-400 uppercase tracking-widest">{t.lastName}</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName || ""}
                  onChange={handleChange}
                  className="w-full bg-[#F9FAFB] border border-gray-100 rounded-2xl px-6 py-4 text-adv-slate font-bold focus:outline-none focus:ring-2 focus:ring-adv-orange transition-all"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="email" className="block text-xs font-bold text-gray-400 uppercase tracking-widest">{t.email}</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email || ""}
                onChange={handleChange}
                className="w-full bg-[#F9FAFB] border border-gray-100 rounded-2xl px-6 py-4 text-adv-slate font-bold focus:outline-none focus:ring-2 focus:ring-adv-orange transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label htmlFor="phone" className="block text-xs font-bold text-gray-400 uppercase tracking-widest">{t.phone}</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  maxLength={
                    formData.phone.startsWith('856020') ? 14 :
                    formData.phone.startsWith('85620') ? 13 :
                    formData.phone.startsWith('856') ? 14 :
                    formData.phone.startsWith('020') ? 11 : 10
                  }
                  value={formData.phone || ""}
                  onChange={handleChange}
                  placeholder="+856 20 ..."
                  className="w-full bg-[#F9FAFB] border border-gray-100 rounded-2xl px-6 py-4 text-adv-slate font-bold focus:outline-none focus:ring-2 focus:ring-adv-orange transition-all"
                />
              </div>
              <div className="space-y-3">
                <label htmlFor="gender" className="block text-xs font-bold text-gray-400 uppercase tracking-widest">{t.gender}</label>
                <div className="relative">
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender || ""}
                    onChange={handleChange}
                    className="w-full bg-[#F9FAFB] border border-gray-100 rounded-2xl px-6 py-4 text-adv-slate font-bold focus:outline-none focus:ring-2 focus:ring-adv-orange transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled>{t.selectGender}</option>
                    <option value="male">{t.male}</option>
                    <option value="female">{t.female}</option>
                    <option value="other">{t.other}</option>
                  </select>
                  <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Social Links Form Section */}
          <SocialLinksForm
            value={formData.socialLinks || {}}
            onChange={(links) => setFormData(prev => ({ ...prev, socialLinks: links }))}
            lang={lang}
            theme="light"
          />

          <div className="flex flex-col sm:flex-row justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/account')}
              className="px-8 py-4 rounded-2xl bg-white border border-gray-100 text-adv-slate font-bold hover:bg-gray-50 transition-colors order-2 sm:order-1"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isSaving || showSuccess}
              className="flex items-center justify-center gap-3 px-10 py-4 rounded-2xl bg-adv-slate text-white font-bold hover:bg-black transition-all disabled:opacity-70 shadow-xl shadow-gray-200 order-1 sm:order-2"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : showSuccess ? (
                <CheckCircle2 className="w-5 h-5 text-adv-orange" />
              ) : (
                <Save className="w-5 h-5 text-adv-orange" />
              )}
              {isSaving ? t.saving : showSuccess ? t.saved : t.saveChanges}
            </button>
          </div>
        </form>
      </div>
      
      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-adv-slate text-white px-8 py-4 rounded-2xl font-bold shadow-2xl flex items-center gap-3 z-50 border border-white/10"
          >
            <CheckCircle2 className="w-5 h-5 text-adv-orange" />
            {t.successMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
