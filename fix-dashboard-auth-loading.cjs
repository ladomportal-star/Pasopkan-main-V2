const fs = require('fs');
let content = fs.readFileSync('Frontend/src/pages/Dashboard.tsx', 'utf-8');

// Use loading state
content = content.replace('const { user, logout, isAuthenticated } = useAuth();', 'const { user, logout, isAuthenticated, loading } = useAuth();');

const oldEffect = `  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { returnTo: location.pathname } });
    }
  }, [isAuthenticated, navigate, location.pathname]);`;

const newEffect = `  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { state: { returnTo: location.pathname } });
    }
  }, [isAuthenticated, loading, navigate, location.pathname]);`;

content = content.replace(oldEffect, newEffect);

fs.writeFileSync('Frontend/src/pages/Dashboard.tsx', content);
