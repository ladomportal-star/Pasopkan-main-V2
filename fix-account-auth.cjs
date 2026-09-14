const fs = require('fs');
let content = fs.readFileSync('Frontend/src/pages/Account.tsx', 'utf-8');

// Update useAuth
content = content.replace('const { logout } = useAuth();', 'const { logout, isAuthenticated, loading } = useAuth();');

// Add redirect effect
const effect = `  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { state: { returnTo: location.pathname } });
    }
  }, [isAuthenticated, loading, navigate, location.pathname]);

  const [profilePic, setProfilePic] = useState<string | null>(() => {`;

content = content.replace("  const [profilePic, setProfilePic] = useState<string | null>(() => {", effect);

// Ensure the page doesn't flash content while loading
const loadingCheck = `  if (loading) {
    return (
      <div className={\`min-h-screen pt-2 sm:pt-4 pb-20 animate-pulse \${
        theme === 'dark' ? 'bg-zinc-950' : 'bg-gray-50'
      }\`}>
        <div className="max-w-3xl mx-auto px-4"><div className="h-40 bg-gray-200 dark:bg-zinc-800 rounded-3xl mb-4"></div></div>
      </div>
    );
  }

  return (`;

content = content.replace('  return (\n    <div className={`min-h-screen pb-20 overflow-x-hidden ${', loadingCheck + '\n    <div className={`min-h-screen pb-20 overflow-x-hidden ${');

fs.writeFileSync('Frontend/src/pages/Account.tsx', content);
