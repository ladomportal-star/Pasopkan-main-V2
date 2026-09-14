const fs = require('fs');
let content = fs.readFileSync('Frontend/src/pages/Dashboard.tsx', 'utf-8');

// Update useAuth destructing to include isAuthenticated
content = content.replace('const { user, logout } = useAuth();', 'const { user, logout, isAuthenticated } = useAuth();');

// Add redirect effect
const redirectEffect = `  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { returnTo: location.pathname } });
    }
  }, [isAuthenticated, navigate, location.pathname]);

  useEffect(() => {`;

content = content.replace('  useEffect(() => {\n    setIsLoading(true);\n    // Instant execution for mobile responsiveness', redirectEffect + '\n    setIsLoading(true);\n    // Instant execution for mobile responsiveness');

fs.writeFileSync('Frontend/src/pages/Dashboard.tsx', content);
