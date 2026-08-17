import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Calendar, Ticket, Compass, TrendingUp, Users, ShieldCheck, ArrowRight, Sparkles, MapPin } from 'lucide-react';
import { useLanguage } from '../LanguageContext';

const translations = {
  en: {
    title: 'About Pasopkan',
    subtitle: 'The ultimate event hosting and ticket-selling platform in Laos.',
    introTitle: 'Empowering Experiences, Connecting People',
    introText: 'Pasopkan (meaning "experience" in Lao) is a modern full-stack event management and ticketing platform designed to connect people with unforgettable moments. Whether you are hosting a community workshop, a major concert, a sports trek, or offering lifestyle vouchers, Pasopkan provides the complete suite of tools you need to turn your vision into a highly successful, fully booked reality.',
    
    // Core Pillars
    featuresTitle: 'Why Choose Pasopkan?',
    featuresSubtitle: 'Everything you need to successfully launch events and fill seats.',
    
    feature1Title: 'Create & Customize Events',
    feature1Desc: 'Design fully detailed event pages with ease. Support for both fixed dates and flexible date ranges, custom categories, elegant markdown descriptions, and interactive high-fidelity maps for exact venue coordinates.',
    
    feature2Title: 'Sell Tickets & Track Orders',
    feature2Desc: 'Setup multiple ticket tiers, offer promo coupons, and track transaction histories in real time. Attendees get automated secure booking confirmations, printable PDF tickets, and personalized QR codes.',
    
    feature3Title: 'In-app Verification & Scanning',
    feature3Desc: 'No external scanners required. Event organizers can use our secure built-in QR scanner directly on their mobile device or laptop to securely check-in and validate attendee tickets at the gate.',

    feature4Title: 'Live Reports & Analytics',
    feature4Desc: 'Gain valuable insights with our smart reports tab. Monitor ticketing charts, sales volume, daily attendee check-in ratios, and manage ticket distribution from a unified admin console.',

    // Simple 3 Step process
    processTitle: 'How It Works',
    processStep1Title: '1. Create Your Event',
    processStep1Desc: 'Enter your event name, date/time, upload an eye-catching banner, specify location, and set ticket price tiers.',
    processStep2Title: '2. Launch & Sell Tickets',
    processStep2Desc: 'Publish your event instantly on our platform. Attendees can browse, book tickets online, and receive digital QR codes.',
    processStep3Title: '3. Scan & Check-in',
    processStep3Desc: 'Open our secure mobile camera scanner at the door, scan attendees\' QR codes, verify their booking, and welcome them in.',

    // Stats
    statsHosts: 'Active Organizers',
    statsTickets: 'Tickets Sold',
    statsEvents: 'Events Hosted',
    statsHappy: 'Satisfied Customers',

    // CTA
    ctaTitle: 'Ready to launch your next experience?',
    ctaSubtitle: 'Join hundreds of event organizers in Laos who trust Pasopkan to power their ticket sales and crowd management.',
    ctaBtnCreate: 'Create Event Now',
    ctaBtnExplore: 'Browse Experiences',
  },
  lo: {
    title: 'ກ່ຽວກັບ Pasopkan',
    subtitle: 'ແພລດຟອມຈັດງານ ແລະ ຂາຍປີ້ແບບຄົບວົງຈອນອັນດັບໜຶ່ງໃນລາວ.',
    introTitle: 'ສ້າງປະສົບການທີ່ດີ, ເຊື່ອມຕໍ່ຜູ້ຄົນເຂົ້າກັນ',
    introText: 'Pasopkan (ປະສົບການ) ແມ່ນແພລດຟອມຈັດການ event ແລະ ຈອງປີ້ທີ່ທັນສະໄໝ ທີ່ອອກແບບມາເພື່ອເຊື່ອມຕໍ່ທຸກຄົນເຂົ້າກັບຊ່ວງເວລາທີ່ໜ້າຈົດຈຳ. ບໍ່ວ່າທ່ານຈະຈັດເວີກຊອບຂະໜາດນ້ອຍ, ຄອນເສີດໃຫຍ່, ການຜະຈົນໄພໃນປ່າ, ຫຼື ການສະເໜີບັດສ່ວນຫຼຸດ (Vouchers), Pasopkan ມີເຄື່ອງມືລະດັບພຣີມຽມທັງໝົດທີ່ທ່ານຕ້ອງການເພື່ອໃຫ້ປະສົບຜົນສຳເລັດ.',
    
    // Core Pillars
    featuresTitle: 'ເປັນຫຍັງຕ້ອງເລືອກ Pasopkan?',
    featuresSubtitle: 'ທຸກສິ່ງທີ່ທ່ານຕ້ອງການເພື່ອເລີ່ມຈັດງານ ແລະ ຂາຍປີ້ຢ່າງມີປະສິດທິພາບ.',
    
    feature1Title: 'ສ້າງ ແລະ ປັບແຕ່ງກິດຈະກຳ',
    feature1Desc: 'ອອກແບບໜ້າ event ທີ່ສວຍງາມ ແລະ ໜ້າສົນໃຈພາຍໃນບໍ່ເທົ່າໃດນາທີ. ຮອງຮັບທັງວັນທີຄົງທີ່ ແລະ ວັນທີແບບປ່ຽນແປງໄດ້, ການແບ່ງປະເພດທີ່ຊັດເຈນ, ພ້ອມກັບແຜນທີ່ປັກໝຸດສະຖານທີ່ຈັດງານ.',
    
    feature2Title: 'ຂາຍປີ້ ແລະ ຕິດຕາມຄຳສັ່ງຊື້',
    feature2Desc: 'ຕັ້ງຄ່າປີ້ໄດ້ຫຼາຍລະດັບ, ສະເໜີຄູປອງສ່ວນຫຼຸດ, ແລະ ຕິດຕາມປະຫວັດການຊື້ຂາຍແບບຮຽລທາມ. ຜູ້ເຂົ້າຮ່ວມຈະໄດ້ຮັບໃບຢືນຢັນການຈອງ, ປີ້ PDF ທີ່ປອດໄພ, ແລະ QR Code ສ່ວນຕົວ.',
    
    feature3Title: 'ສະແກນກວດສອບປີ້ໃນແອັບ',
    feature3Desc: 'ບໍ່ຈຳເປັນຕ້ອງໃຊ້ເຄື່ອງສະແກນພິເສດ. ຜູ້ຈັດງານສາມາດໃຊ້ລະບົບສະແກນ QR ທີ່ປອດໄພຂອງພວກເຮົາຜ່ານມືຖື ຫຼື ແລັບທັອບເພື່ອເຊັກອິນ ແລະ ຢືນຢັນປີ້ຂອງຜູ້ເຂົ້າຮ່ວມໄດ້ທັນທີ.',

    feature4Title: 'ລາຍງານ ແລະ ບົດວິເຄາະແບບຮຽລທາມ',
    feature4Desc: 'ຮັບຂໍ້ມູນເຈາະເລິກທີ່ເປັນປະໂຫຍດດ້ວຍແທັບລາຍງານອັດສະລິຍະ. ຕິດຕາມກຣາຟຍອດຂາຍ, ປະລິມານການຂາຍ, ອັດຕາການເຊັກອິນ, ແລະ ຈັດການປີ້ທັງໝົດຈາກບ່ອນດຽວ.',

    // Simple 3 Step process
    processTitle: 'ຂັ້ນຕອນການເຮັດວຽກ',
    processStep1Title: '1. ສ້າງກິດຈະກຳຂອງທ່ານ',
    processStep1Desc: 'ໃສ່ຊື່ກິດຈະກຳ, ວັນທີ/ເວລາ, ອັບໂຫຼດຮູບແບນເນີ, ລະບຸສະຖານທີ່ຈັດງານ, ແລະ ກຳນົດລາຄາປີ້.',
    processStep2Title: '2. ເຜີຍແຜ່ ແລະ ຂາຍປີ້',
    processStep2Desc: 'ເຜີຍແຜ່ກິດຈະກຳຂອງທ່ານເທິງແພລດຟອມທັນທີ. ຜູ້ເຂົ້າຮ່ວມສາມາດເລືອກຊື້ປີ້ອອນລາຍ ແລະ ຮັບ QR Code ທັນທີ.',
    processStep3Title: '3. ສະແກນ ແລະ ເຊັກອິນ',
    processStep3Desc: 'ເປີດກ້ອງສະແກນ QR ຢູ່ໜ້າປະຕູທາງເຂົ້າ, ສະແກນປີ້ຂອງຜູ້ເຂົ້າຮ່ວມເພື່ອຢືນຢັນ ແລະ ຕ້ອນຮັບພວກເຂົາເຂົ້າຮ່ວມງານ.',

    // Stats
    statsHosts: 'ຜູ້ຈັດງານທີ່ເຄື່ອນໄຫວ',
    statsTickets: 'ປີ້ທີ່ຂາຍແລ້ວ',
    statsEvents: 'ງານທີ່ໄດ້ຈັດຂຶ້ນ',
    statsHappy: 'ລູກຄ້າທີ່ພຶງພໍໃຈ',

    // CTA
    ctaTitle: 'ພ້ອມທີ່ຈະເລີ່ມສ້າງປະສົບການໃໝ່ຂອງທ່ານແລ້ວບໍ?',
    ctaSubtitle: 'ຮ່ວມເປັນສ່ວນໜຶ່ງກັບຜູ້ຈັດງານຫຼາຍຮ້ອຍຄົນໃນປະເທດລາວ ທີ່ໄວ້ວາງໃຈ Pasopkan ໃນການຂາຍປີ້ ແລະ ຈັດການຜູ້ເຂົ້າຮ່ວມງານ.',
    ctaBtnCreate: 'ສ້າງກິດຈະກຳຕອນນີ້',
    ctaBtnExplore: 'ຄົ້ນຫາກິດຈະກຳທັງໝົດ',
  }
};

export default function About() {
  const { lang } = useLanguage();
  const t = translations[lang as keyof typeof translations];

  return (
    <div className="pt-24 pb-16 min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Hero Section */}
        <div className="text-center mb-16 md:mb-24 relative">
          {/* Decorative gradients */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-72 h-72 bg-adv-orange/10 blur-[80px] rounded-full pointer-events-none" />

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-black text-adv-slate uppercase tracking-tight mb-6"
          >
            {t.title}
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-500 max-w-3xl mx-auto text-lg md:text-xl font-medium leading-relaxed"
          >
            {t.subtitle}
          </motion.p>
        </div>

        {/* Intro Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24 bg-gray-50/50 p-8 md:p-12 rounded-[32px] border border-gray-100">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            <h2 className="text-2xl md:text-3xl font-black text-adv-slate leading-tight">
              {t.introTitle}
            </h2>
            <p className="text-gray-600 leading-relaxed text-base font-medium">
              {t.introText}
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                to="/create"
                className="px-6 py-3 bg-adv-orange hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-orange-100 flex items-center gap-2"
              >
                {t.ctaBtnCreate}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/"
                className="px-6 py-3 bg-white hover:bg-gray-50 text-adv-slate border border-gray-200 rounded-xl font-bold text-sm transition-all"
              >
                {t.ctaBtnExplore}
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="relative rounded-3xl overflow-hidden shadow-xl aspect-video border border-gray-100 bg-white p-2"
          >
            <img 
              src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=1200&auto=format&fit=crop" 
              alt="People at Event" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-2xl"
            />
          </motion.div>
        </div>

        {/* Dynamic Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-24">
          {[
            { label: t.statsHosts, val: '250+', icon: Users, color: 'bg-orange-50 text-adv-orange' },
            { label: t.statsTickets, val: '50,000+', icon: Ticket, color: 'bg-emerald-50 text-emerald-600' },
            { label: t.statsEvents, val: '1,200+', icon: Calendar, color: 'bg-blue-50 text-blue-600' },
            { label: t.statsHappy, val: '99.4%', icon: Sparkles, color: 'bg-purple-50 text-purple-600' },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
              className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow text-center flex flex-col items-center justify-center space-y-3"
            >
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-black text-adv-slate tracking-tight">{stat.val}</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1">{stat.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Feature Highlights Block */}
        <div className="mb-24">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-adv-slate tracking-tight mb-4">
              {t.featuresTitle}
            </h2>
            <p className="text-gray-500 font-semibold">
              {t.featuresSubtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                title: t.feature1Title,
                desc: t.feature1Desc,
                icon: Calendar,
                tag: 'Creation',
              },
              {
                title: t.feature2Title,
                desc: t.feature2Desc,
                icon: Ticket,
                tag: 'Sales',
              },
              {
                title: t.feature3Title,
                desc: t.feature3Desc,
                icon: Compass,
                tag: 'Verification',
              },
              {
                title: t.feature4Title,
                desc: t.feature4Desc,
                icon: TrendingUp,
                tag: 'Analytics',
              },
            ].map((feat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 * idx }}
                className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="p-3 bg-orange-50 text-adv-orange rounded-2xl group-hover:bg-adv-orange group-hover:text-white transition-colors">
                      <feat.icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-extrabold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 uppercase tracking-wider">
                      {feat.tag}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-adv-slate">{feat.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed font-semibold">{feat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Simple Steps Section */}
        <div className="bg-gray-50 p-8 md:p-16 rounded-[40px] border border-gray-100 mb-24">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-black text-adv-slate tracking-tight mb-2">
              {t.processTitle}
            </h2>
            <p className="text-xs text-orange-600 font-extrabold uppercase tracking-widest">
              Simple 3-Step Lifecycle
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: t.processStep1Title, desc: t.processStep1Desc, bg: 'bg-white' },
              { title: t.processStep2Title, desc: t.processStep2Desc, bg: 'bg-white' },
              { title: t.processStep3Title, desc: t.processStep3Desc, bg: 'bg-white' },
            ].map((step, idx) => (
              <div key={idx} className={`${step.bg} p-8 rounded-3xl border border-gray-100/50 shadow-sm relative flex flex-col justify-between h-full`}>
                <div className="space-y-3">
                  <h3 className="text-base font-black text-adv-slate">{step.title}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed font-medium">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA section */}
        <div className="relative rounded-[40px] bg-adv-slate text-white p-8 md:p-16 overflow-hidden text-center">
          {/* Background orange blobs */}
          <div className="absolute -top-12 -left-12 w-96 h-96 bg-adv-orange/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-96 h-96 bg-orange-600/10 blur-[80px] rounded-full pointer-events-none" />
          
          <div className="relative max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-tight">
              {t.ctaTitle}
            </h2>
            <p className="text-zinc-400 text-sm md:text-base leading-relaxed max-w-2xl mx-auto font-medium">
              {t.ctaSubtitle}
            </p>
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <Link
                to="/create"
                className="px-8 py-4 bg-adv-orange hover:bg-orange-600 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-orange-950/20"
              >
                {t.ctaBtnCreate}
              </Link>
              <Link
                to="/"
                className="px-8 py-4 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-xl font-bold text-sm transition-all"
              >
                {t.ctaBtnExplore}
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
