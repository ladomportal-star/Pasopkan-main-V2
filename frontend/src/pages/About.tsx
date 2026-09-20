import React from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Rocket, Users, Smartphone, Sparkles, Server, QrCode, Globe, ArrowLeft, Building2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import SEO from '../components/SEO';

const translations = {
  en: {
    back: 'Back to Account',
    title: 'About Pasopkan',
    subtitle: 'Laos\' Premier Event Management & Ticketing Platform',
    introTitle: 'Elevating Event Experiences',
    introText: 'Pasopkan is the leading event management and ticketing platform in Laos. Whether you are hosting a local workshop or a massive concert, our platform makes it incredibly easy for anyone to create, manage, and attend unforgettable events with total peace of mind.',
    
    // Core Pillars
    featuresTitle: 'Platform Capabilities',
    featuresSubtitle: 'Built for ease of use, security, and seamless experiences for everyone.',
    
    feature1Title: 'Intuitive Event Creation',
    feature1Desc: 'Whether you are a first-time host or an experienced agency, our platform empowers anyone to easily set up and launch a professional event page in minutes.',
    
    feature2Title: 'Seamless Buyer Experience',
    feature2Desc: 'We provide a frictionless, mobile-optimized checkout process that makes discovering events and securing tickets incredibly easy for attendees.',
    
    feature3Title: 'Automated Refund Protection',
    feature3Desc: 'Buy with confidence. If an event gets officially canceled, our built-in protection policies ensure ticket buyers receive secure, hassle-free refunds.',
    
    feature4Title: 'Powerful Organizer Tools',
    feature4Desc: 'Manage your event on the go. From real-time sales analytics to built-in QR code scanning for lightning-fast gate check-ins, everything is right on your phone.',
    
    // Stats
    statsHosts: 'Active Organizers',
    statsTickets: 'Tickets Processed',
    statsEvents: 'Events Powered',
    statsUptime: 'Platform Uptime',
    
    // CTA
    ctaTitle: 'Experience the Standard',
    ctaSubtitle: 'Join the growing ecosystem of users and organizers who rely on Pasopkan every day.',
    ctaBtnExplore: 'Explore Upcoming Events',
    ctaBtnContact: 'Contact Support',
  },
  lo: {
    back: 'ກັບຄືນໄປໜ້າບັນຊີ',
    title: 'ກ່ຽວກັບ Pasopkan',
    subtitle: 'ແພລດຟອມຈັດງານ ແລະ ຂາຍປີ້ອັນດັບໜຶ່ງໃນລາວ',
    introTitle: 'ຍົກລະດັບປະສົບການການຈັດງານ',
    introText: 'Pasopkan ແມ່ນແພລດຟອມການຂາຍປີ້ ແລະ ຈັດການງານອັນດັບໜຶ່ງໃນລາວ. ບໍ່ວ່າທ່ານຈະຈັດເວີກຊັອບຂະໜາດນ້ອຍ ຫຼື ຄອນເສີດໃຫຍ່, ແພລດຟອມຂອງພວກເຮົາເຮັດໃຫ້ມັນງ່າຍດາຍສຳລັບທຸກຄົນໃນການສ້າງ, ຈັດການ ແລະ ເຂົ້າຮ່ວມງານຢ່າງໝັ້ນໃຈ.',
    
    // Core Pillars
    featuresTitle: 'ຄວາມສາມາດຂອງແພລດຟອມ',
    featuresSubtitle: 'ສ້າງຂຶ້ນເພື່ອຄວາມງ່າຍໃນການໃຊ້ງານ, ຄວາມປອດໄພ ແລະ ປະສົບການທີ່ດີສຳລັບທຸກຄົນ.',
    
    feature1Title: 'ສ້າງກິດຈະກຳໄດ້ງ່າຍສຳລັບທຸກຄົນ',
    feature1Desc: 'ບໍ່ວ່າທ່ານຈະເປັນຜູ້ຈັດງານມືໃໝ່ ຫຼື ບໍລິສັດໃຫຍ່, ແພລດຟອມຂອງພວກເຮົາຊ່ວຍໃຫ້ທຸກຄົນສາມາດສ້າງ ແລະ ເປີດຕົວງານລະດັບມືອາຊີບໄດ້ຢ່າງງ່າຍດາຍພາຍໃນບໍ່ເທົ່າໃດນາທີ.',
    
    feature2Title: 'ປະສົບການຊື້ປີ້ທີ່ສະດວກສະບາຍ',
    feature2Desc: 'ພວກເຮົາສະໜອງລະບົບການຊື້ປີ້ທີ່ລ່ຽນໄຫຼ ແລະ ຮອງຮັບມືຖືຢ່າງສົມບູນແບບ ເຮັດໃຫ້ການຄົ້ນຫາງານ ແລະ ການຊື້ປີ້ເປັນເລື່ອງງ່າຍສຳລັບທຸກຄົນ.',
    
    feature3Title: 'ລະບົບປົກປ້ອງການຄືນເງິນ',
    feature3Desc: 'ຊື້ປີ້ດ້ວຍຄວາມໝັ້ນໃຈ. ຫາກງານຖືກຍົກເລີກຢ່າງເປັນທາງການ, ລະບົບປົກປ້ອງຂອງພວກເຮົາຈະດຳເນີນການຄືນເງິນໃຫ້ຜູ້ຊື້ຢ່າງປອດໄພ ແລະ ບໍ່ຫຍຸ້ງຍາກ.',
    
    feature4Title: 'ເຄື່ອງມືຄົບວົງຈອນສຳລັບຜູ້ຈັດງານ',
    feature4Desc: 'ຈັດການງານຂອງທ່ານໄດ້ທຸກທີ່. ຕັ້ງແຕ່ການວິເຄາະຍອດຂາຍແບບຣຽລທາມ ຈົນເຖິງລະບົບສະແກນ QR code ເພື່ອກວດປີ້ໜ້າປະຕູຢ່າງວ່ອງໄວ ທຸກຢ່າງຢູ່ເທິງມືຖືຂອງທ່ານ.',
    
    // Stats
    statsHosts: 'ຜູ້ຈັດງານທີ່ເຄື່ອນໄຫວ',
    statsTickets: 'ປີ້ທີ່ປະມວນຜົນແລ້ວ',
    statsEvents: 'ງານທີ່ໃຊ້ລະບົບເຮົາ',
    statsUptime: 'ຄວາມໝັ້ນຄົງຂອງລະບົບ',
    
    // CTA
    ctaTitle: 'ສຳຜັດກັບມາດຕະຖານໃໝ່',
    ctaSubtitle: 'ເຂົ້າຮ່ວມກັບເຄືອຂ່າຍຜູ້ໃຊ້ ແລະ ຜູ້ຈັດງານທີ່ໄວ້ວາງໃຈໃນ Pasopkan ໃນທຸກໆມື້.',
    ctaBtnExplore: 'ຄົ້ນຫາກິດຈະກຳທັງໝົດ',
    ctaBtnContact: 'ຕິດຕໍ່ທີມງານຊ່ວຍເຫຼືອ',
  }
};

export default function About() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const t = translations[lang as keyof typeof translations];

  return (
    <div className="pt-4 sm:pt-6 pb-16 min-h-screen bg-[#F9FAFB]">
      <SEO
        title={t.title}
        description={t.subtitle}
        keywords={['About Pasopkan', 'Event Ticketing Platform Laos', 'Event Management Laos', 'Pasopkan Story']}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-adv-slate transition-colors mb-6 group cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-bold text-sm">{t.back}</span>
        </button>
        
        {/* Hero Section */}
        <div className="bg-white rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 md:p-16 mb-8 border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-adv-orange/5 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 text-adv-orange text-xs font-bold uppercase tracking-wider">
                <Building2 className="w-4 h-4" />
                <span>{t.title}</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-adv-slate leading-[1.1] tracking-tight">
                {t.introTitle}
              </h1>
              <p className="text-gray-500 leading-relaxed text-base sm:text-lg font-medium max-w-xl">
                {t.introText}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="relative rounded-[2rem] overflow-hidden shadow-xl aspect-[4/3] border border-gray-100 bg-white p-2"
            >
              <img 
                src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop" 
                alt="Professional Event Infrastructure" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-[1.5rem]"
              />
            </motion.div>
          </div>
        </div>

        {/* Dynamic Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-16">
          {[
            { label: t.statsHosts, val: '250+', icon: Users, color: 'bg-orange-50 text-adv-orange' },
            { label: t.statsTickets, val: '50,000+', icon: Sparkles, color: 'bg-emerald-50 text-emerald-600' },
            { label: t.statsEvents, val: '1,200+', icon: Globe, color: 'bg-blue-50 text-blue-600' },
            { label: t.statsUptime, val: '99.9%', icon: Server, color: 'bg-purple-50 text-purple-600' },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
              className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm flex flex-col items-center justify-center space-y-4 text-center"
            >
              <div className={`p-4 rounded-2xl ${stat.color}`}>
                <stat.icon className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-black text-adv-slate tracking-tight">{stat.val}</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Feature Highlights Block */}
        <div className="mb-16">
          <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-adv-slate tracking-tight mb-4">
              {t.featuresTitle}
            </h2>
            <p className="text-gray-500 font-medium">
              {t.featuresSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {[
              {
                title: t.feature1Title,
                desc: t.feature1Desc,
                icon: Rocket,
                tag: 'For Organizers',
              },
              {
                title: t.feature2Title,
                desc: t.feature2Desc,
                icon: Smartphone,
                tag: 'For Buyers',
              },
              {
                title: t.feature3Title,
                desc: t.feature3Desc,
                icon: ShieldCheck,
                tag: 'Protection',
              },
              {
                title: t.feature4Title,
                desc: t.feature4Desc,
                icon: QrCode,
                tag: 'Management',
              },
            ].map((feat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 * idx }}
                className="bg-white border border-gray-100 p-6 sm:p-8 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow flex gap-5 sm:gap-6"
              >
                <div className="shrink-0">
                  <div className="p-3 sm:p-4 bg-gray-50 text-adv-slate rounded-2xl border border-gray-100">
                    <feat.icon className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-adv-slate">{feat.title}</h3>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed font-medium">{feat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
