const fs = require('fs');
let content = fs.readFileSync('Frontend/src/pages/PastEvents.tsx', 'utf-8');

// Add useAuth if missing
if (!content.includes('import { useAuth }')) {
  content = content.replace("import { useLanguage } from '../context/LanguageContext';", "import { useLanguage } from '../context/LanguageContext';\nimport { useAuth } from '../context/AuthContext';");
}

// Ensure useAuth is used
if (!content.includes('const { isAuthenticated, loading } = useAuth();')) {
  content = content.replace('  const navigate = useNavigate();', '  const navigate = useNavigate();\n  const { isAuthenticated, loading } = useAuth();');
  
  const effect = `  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { state: { returnTo: location.pathname } });
    }
  }, [isAuthenticated, loading, navigate, location.pathname]);

  const getActiveName = () => {`;
  
  content = content.replace('  const getActiveName = () => {', effect);
  
  const loadingCheck = `  if (loading) {
    return (
      <div className="min-h-screen pt-2 sm:pt-4 pb-20 animate-pulse bg-gray-50 dark:bg-zinc-950">
        <div className="max-w-3xl mx-auto px-4"><div className="h-40 bg-gray-200 dark:bg-zinc-800 rounded-3xl mb-4"></div></div>
      </div>
    );
  }

  return (`;

  content = content.replace('  return (\n    <div className={`min-h-screen pb-20 transition-colors duration-300 ${theme === \'dark\' ? \'bg-zinc-950\' : \'bg-gray-50\'}`}>', loadingCheck + '\n    <div className={`min-h-screen pb-20 transition-colors duration-300 ${theme === \'dark\' ? \'bg-zinc-950\' : \'bg-gray-50\'}`}>');
}

fs.writeFileSync('Frontend/src/pages/PastEvents.tsx', content);
