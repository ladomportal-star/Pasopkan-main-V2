import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ArrowLeft, Save, User, CheckCircle2, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { DateInputDDMMYYYY } from '../components/DateInputDDMMYYYY';
import SEO from '../components/SEO';
import { safeStorage } from '../lib/storage';

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
    dateOfBirth: 'Date of Birth',
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
    dateOfBirth: 'ວັນເດືອນປີເກີດ',
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
        const parsed = JSON.parse(saved);
        return {
          firstName: 'Sirithida',
          lastName: 'Souksavat',
          email: 'sirithida.ssv@gmail.com',
          phone: '',
          gender: '' as 'male' | 'female' | 'other' | '',
          dateOfBirth: parsed.dateOfBirth || parsed.dob || '',
          dob: parsed.dob || parsed.dateOfBirth || '',
          ...parsed
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
      dateOfBirth: '',
      dob: '',
    };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 256;
          const MAX_HEIGHT = 256;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const base64Pic = canvas.toDataURL('image/jpeg', 0.7);
          
          setProfilePic(base64Pic);
          
          try {
            safeStorage.setItem('pasopkan_user_profile_pic', base64Pic);
          } catch (err) {
            console.error('LocalStorage quota exceeded, skipping local cache', err);
          }
          
          try {
            await syncProfileToFirestore({ profilePic: base64Pic });
          } catch (err) {
            console.error('Firestore sync error:', err);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    try {
      const savedPic = safeStorage.getItem('pasopkan_user_profile_pic') || localStorage.getItem('pasopkan_user_profile_pic');
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
      const payload = {
        ...formData,
        dateOfBirth: formData.dateOfBirth || formData.dob || '',
        dob: formData.dateOfBirth || formData.dob || '',
      };
      safeStorage.setItem('pasopkan_user_profile', JSON.stringify(payload));
      await syncProfileToFirestore(payload);
    } catch (err) {
      console.error(err);
    }
    
    setIsSaving(false);
    setShowSuccess(true);
    
    setTimeout(() => {
      navigate('/account');
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-4 md:py-6">
      <SEO
        title={t.editProfile || (lang === 'lo' ? 'ແກ້ໄຂໂປຣໄຟລ໌' : 'Edit Profile')}
        description="Update your personal details, name, and profile picture on Pasopkan."
        noindex={true}
      />
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
          <div className="bg-white border border-gray-100 rounded-3xl p-6 flex flex-col items-center sm:flex-row gap-6 shadow-sm">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-24 h-24 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300 shrink-0 overflow-hidden">
                {profilePic ? (
                  <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div className="absolute bottom-0 right-0 w-7 h-7 sm:w-8 sm:h-8 bg-adv-orange rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                <Camera className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
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
              <h3 className="text-base font-bold text-adv-slate mb-1">{t.profilePicture}</h3>
              <p className="text-xs text-gray-400 font-medium mb-2">{t.clickToUpdate}</p>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-white border border-gray-100 rounded-3xl p-5 sm:p-6 space-y-5 shadow-sm">
            <h2 className="text-lg font-bold text-adv-slate mb-2">{t.personalInfo}</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="space-y-1.5">
                <label htmlFor="firstName" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.firstName}</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName || ""}
                  onChange={handleChange}
                  className="w-full bg-[#F9FAFB] border border-gray-100 rounded-xl px-4 py-2.5 text-sm text-adv-slate font-bold focus:outline-none focus:ring-2 focus:ring-adv-orange transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="lastName" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.lastName}</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName || ""}
                  onChange={handleChange}
                  className="w-full bg-[#F9FAFB] border border-gray-100 rounded-xl px-4 py-2.5 text-sm text-adv-slate font-bold focus:outline-none focus:ring-2 focus:ring-adv-orange transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:gap-5">
              <div className="space-y-1.5">
                <label htmlFor="phone" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.phone}</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  maxLength={
                    formData.phone?.startsWith('856020') ? 14 :
                    formData.phone?.startsWith('85620') ? 13 :
                    formData.phone?.startsWith('856') ? 14 :
                    formData.phone?.startsWith('020') ? 11 : 10
                  }
                  value={formData.phone || ""}
                  onChange={handleChange}
                  placeholder="+856 20 ..."
                  className="w-full bg-[#F9FAFB] border border-gray-100 rounded-xl px-4 py-2.5 text-sm text-adv-slate font-bold focus:outline-none focus:ring-2 focus:ring-adv-orange transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="gender" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.gender}</label>
                <div className="relative">
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender || ""}
                    onChange={handleChange}
                    className="w-full bg-[#F9FAFB] border border-gray-100 rounded-xl px-4 py-2.5 text-sm text-adv-slate font-bold focus:outline-none focus:ring-2 focus:ring-adv-orange transition-all appearance-none cursor-pointer"
                  >
                    <option value="" disabled>{t.selectGender}</option>
                    <option value="male">{t.male}</option>
                    <option value="female">{t.female}</option>
                    <option value="other">{t.other}</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.email}</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email || ""}
                onChange={handleChange}
                className="w-full bg-[#F9FAFB] border border-gray-100 rounded-xl px-4 py-2.5 text-sm text-adv-slate font-bold focus:outline-none focus:ring-2 focus:ring-adv-orange transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="dateOfBirth" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.dateOfBirth}</label>
              <div className="relative w-full" onClick={(e) => e.stopPropagation()}>
                <DateInputDDMMYYYY
                  id="dateOfBirth"
                  value={formData.dateOfBirth || formData.dob || ""}
                  onChange={(val) => setFormData(prev => ({ ...prev, dateOfBirth: val, dob: val }))}
                  placeholder="DD/MM/YYYY"
                  lang={lang}
                  maxDate={new Date()}
                  className="w-full [&_input]:bg-[#F9FAFB] [&_input]:border-gray-100 [&_input]:rounded-xl [&_input]:h-[42px] [&_input]:px-4 [&_input]:text-sm [&_input]:text-adv-slate [&_input]:font-bold focus-within:[&_input]:ring-2 focus-within:[&_input]:ring-adv-orange focus-within:[&_input]:border-adv-orange"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/account')}
              className="px-6 py-2.5 rounded-xl bg-white border border-gray-100 text-adv-slate font-bold text-sm hover:bg-gray-50 transition-colors order-2 sm:order-1"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isSaving || showSuccess}
              className="flex items-center justify-center gap-2 px-8 py-2.5 rounded-xl bg-adv-slate text-white font-bold text-sm hover:bg-black transition-all disabled:opacity-70 shadow-lg shadow-gray-200 order-1 sm:order-2"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : showSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Save className="w-4 h-4 text-adv-orange" />
              )}
              {isSaving ? t.saving : showSuccess ? t.saved : t.saveChanges}
            </button>
          </div>
        </form>
      </div>
      
      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <div className="fixed bottom-24 sm:bottom-12 right-1/2 translate-x-1/2 z-[300] flex flex-col gap-3 w-full max-w-sm px-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className="p-4 sm:p-5 rounded-2xl sm:rounded-[1.5rem] shadow-2xl flex items-center gap-3.5 border relative overflow-hidden pointer-events-auto bg-white border-gray-200 text-black"
            >
              
              <span className="font-bold text-xs sm:text-sm flex-1 leading-snug">{t.successMessage}</span>
              
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
