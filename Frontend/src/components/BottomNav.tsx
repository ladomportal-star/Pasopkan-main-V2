import { Link, useLocation } from 'react-router-dom';
import { Home, Ticket, User, Compass, Target, Shield } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const translations = {
  en: {
    home: 'Discover',
    myTickets: 'Tickets',
    account: 'Account',
  },
  lo: {
    home: 'ຄົ້ນຫາ',
    myTickets: 'ປີ້',
    account: 'ບັນຊີ',
  }
};

export default function BottomNav() {
  const location = useLocation();
  const { lang } = useLanguage();
  const { isAuthenticated } = useAuth();
  const t = translations[lang];

  if (location.pathname === '/staff-scanner' || location.pathname === '/admin' || location.pathname === '/create') {
    return null;
  }
  
  return (
    <div 
      className="md:hidden fixed bottom-0 left-0 right-0 z-[60] bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)' }}
    >
      <div className="flex items-center justify-around h-16 px-2">
        <Link 
          to="/" 
          onClick={() => {
            if (location.pathname === '/') {
              window.scrollTo(0, 0);
            }
          }}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${
            location.pathname === '/' ? 'text-adv-orange' : 'text-gray-400'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold">{t.home}</span>
        </Link>
        
        <Link 
          to="/dashboard" 
          onClick={() => {
            if (location.pathname === '/dashboard') {
              window.scrollTo(0, 0);
            }
          }}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${
            location.pathname === '/dashboard' ? 'text-adv-orange' : 'text-gray-400'
          }`}
        >
          <Ticket className="w-5 h-5" />
          <span className="text-[10px] font-bold">{t.myTickets}</span>
        </Link>
        
        <Link 
          to="/account" 
          state={{ targetTab: 'profile', timestamp: Date.now() }}
          onClick={() => {
            if (location.pathname === '/account') {
              window.scrollTo(0, 0);
            }
          }}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${
            location.pathname === '/account' ? 'text-adv-orange' : 'text-gray-400'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-bold">{t.account}</span>
        </Link>
      </div>
    </div>
  );
}

