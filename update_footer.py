import re

with open('src/components/Footer.tsx', 'r') as f:
    content = f.read()

# 1. Update imports
content = content.replace(
"""  getTermsSettings,
  getPrivacySettings,
  TermsSettings,
  PrivacySettings,
  DEFAULT_TERMS_SETTINGS,
  DEFAULT_PRIVACY_SETTINGS
} from '../lib/siteSettings';""", 
"""  getTermsSettings,
  getPrivacySettings,
  getContactSettings,
  TermsSettings,
  PrivacySettings,
  ContactSettings,
  DEFAULT_TERMS_SETTINGS,
  DEFAULT_PRIVACY_SETTINGS,
  DEFAULT_CONTACT_SETTINGS
} from '../lib/siteSettings';"""
)

# 2. Add state for ContactSettings
target_state = """  const [termsSettings, setTermsSettings] = useState<TermsSettings>(DEFAULT_TERMS_SETTINGS);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS);"""
replacement_state = """  const [termsSettings, setTermsSettings] = useState<TermsSettings>(DEFAULT_TERMS_SETTINGS);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS);
  const [contactSettings, setContactSettings] = useState<ContactSettings>(DEFAULT_CONTACT_SETTINGS);"""

content = content.replace(target_state, replacement_state)

# 3. Fetch ContactSettings
target_fetch = """        const privacyData = await getPrivacySettings();
        setTermsSettings(termsData);
        setPrivacySettings(privacyData);"""
replacement_fetch = """        const privacyData = await getPrivacySettings();
        const contactData = await getContactSettings();
        setTermsSettings(termsData);
        setPrivacySettings(privacyData);
        setContactSettings(contactData);"""

content = content.replace(target_fetch, replacement_fetch)

# 4. Replace hardcoded social links block
target_social = """            <div className="flex items-center gap-3 justify-center">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-adv-orange hover:text-white transition-all shadow-sm">
                <Facebook className="w-4.5 h-4.5" />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-adv-orange hover:text-white transition-all shadow-sm">
                <Instagram className="w-4.5 h-4.5" />
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-adv-orange hover:text-white transition-all shadow-sm">
                <TikTokIcon className="w-4.5 h-4.5" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-adv-orange hover:text-white transition-all shadow-sm">
                <Youtube className="w-4.5 h-4.5" />
              </a>
            </div>"""

replacement_social = """            <div className="flex items-center gap-3 justify-center">
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
            </div>"""

content = content.replace(target_social, replacement_social)

# 5. Replace whatsapp link
target_wa = """<li><a href="https://wa.me/8562091951529" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-500 hover:text-adv-orange transition-colors">{t.contact}</a></li>"""
replacement_wa = """<li>
                {contactSettings.whatsapp ? (
                  <a href={contactSettings.whatsapp} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-gray-500 hover:text-adv-orange transition-colors">{t.contact}</a>
                ) : (
                  <Link to="/contact" className="text-sm font-medium text-gray-500 hover:text-adv-orange transition-colors">{t.contact}</Link>
                )}
              </li>"""

content = content.replace(target_wa, replacement_wa)

# 6. Replace contact info block
target_contact = """            <ul className="space-y-2.5">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-adv-orange mt-1 shrink-0" />
                <span className="text-sm text-gray-500 leading-relaxed font-medium">Buengkhayong Village, Vientiane, Laos</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-adv-orange shrink-0" />
                <a href="mailto:ladomportal@gmail.com" className="text-sm text-gray-500 font-medium hover:text-adv-orange transition-colors">ladomportal@gmail.com</a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-adv-orange shrink-0" />
                <span className="text-sm text-gray-500 font-medium">+856 20 919 515 29</span>
              </li>
            </ul>"""

replacement_contact = """            <ul className="space-y-2.5">
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
            </ul>"""

content = content.replace(target_contact, replacement_contact)

with open('src/components/Footer.tsx', 'w') as f:
    f.write(content)
