import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'lo';

interface LanguageContextType {
  lang: Language;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>('lo');

  useEffect(() => {
    document.documentElement.lang = lang;
    if (lang === 'lo') {
      document.body.classList.add('lang-lo');
      document.body.classList.remove('lang-en');
    } else {
      document.body.classList.add('lang-en');
      document.body.classList.remove('lang-lo');
    }
  }, [lang]);

  const toggleLanguage = () => {
    setLang(prev => prev === 'en' ? 'lo' : 'en');
  };

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
