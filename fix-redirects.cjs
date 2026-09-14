const fs = require('fs');

function removeRedirect(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  const effect = `  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { state: { returnTo: location.pathname } });
    }
  }, [isAuthenticated, loading, navigate, location.pathname]);`;
  
  if (content.includes(effect)) {
    content = content.replace(effect, '');
  }
  
  const loadingCheck = `  if (loading) {
    return (
      <div className={\`min-h-screen pt-2 sm:pt-4 pb-20 animate-pulse \${
        theme === 'dark' ? 'bg-zinc-950' : 'bg-gray-50'
      }\`}>
        <div className="max-w-3xl mx-auto px-4"><div className="h-40 bg-gray-200 dark:bg-zinc-800 rounded-3xl mb-4"></div></div>
      </div>
    );
  }`;
  
  const loadingCheck2 = `  if (loading) {
    return (
      <div className="min-h-screen pt-2 sm:pt-4 pb-20 animate-pulse bg-gray-50 dark:bg-zinc-950">
        <div className="max-w-3xl mx-auto px-4"><div className="h-40 bg-gray-200 dark:bg-zinc-800 rounded-3xl mb-4"></div></div>
      </div>
    );
  }`;
  
  if (content.includes(loadingCheck)) {
    content = content.replace(loadingCheck, '');
  }
  if (content.includes(loadingCheck2)) {
    content = content.replace(loadingCheck2, '');
  }
  
  // Dashboard isLoading fix
  if (filePath.includes('Dashboard.tsx')) {
    content = content.replace('if (isLoading || loading) {', 'if (isLoading) {');
    content = content.replace('const { user, logout, isAuthenticated, loading } = useAuth();', 'const { user, logout } = useAuth();');
  }

  if (filePath.includes('PastEvents.tsx')) {
    content = content.replace('const { isAuthenticated, loading } = useAuth();', '');
  }

  if (filePath.includes('Account.tsx')) {
    content = content.replace('const { logout, isAuthenticated, loading } = useAuth();', 'const { logout } = useAuth();');
  }

  fs.writeFileSync(filePath, content);
}

removeRedirect('Frontend/src/pages/Dashboard.tsx');
removeRedirect('Frontend/src/pages/PastEvents.tsx');
removeRedirect('Frontend/src/pages/Account.tsx');
