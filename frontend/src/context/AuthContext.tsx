import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { safeStorage } from '../lib/storage';
import { api, BackendUser } from '../lib/api';
import DotsLoader from '../components/DotsLoader';

export type AppUser = User & {
  name?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
  role?: string;
  displayName?: string;
  photoURL?: string; // mapping for compatibility with older code
};

interface AuthContextType {
  token: string | null;
  user: AppUser | null;
  login: (token: string) => void;
  loginAnonymously: () => Promise<User>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
  syncProfileToSupabase: (profileData: any) => Promise<void>;
  syncProfileToFirestore: (profileData: any) => Promise<void>; // kept for compatibility
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(safeStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setToken(session.access_token);
        safeStorage.setItem('token', session.access_token);
        fetchAndSetUserProfile(session.user, session.access_token);
      } else {
        setLoading(false);
      }
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setToken(session.access_token);
        safeStorage.setItem('token', session.access_token);
        await fetchAndSetUserProfile(session.user, session.access_token);
      } else {
        setToken(null);
        setUser(null);
        safeStorage.removeItem('token');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /** Map the backend's `users` row onto the `AppUser` shape the UI reads. */
  const mergeBackendUser = (supabaseUser: User, backendUser: BackendUser): AppUser => ({
    ...supabaseUser,
    name: backendUser.displayName ?? undefined,
    phone: backendUser.phone ?? undefined,
    avatar: backendUser.avatarUrl ?? undefined,
    role: backendUser.role,
    displayName: backendUser.displayName || supabaseUser.email,
    photoURL: backendUser.avatarUrl ?? undefined,
  });

  /** Sync the Supabase session into our own `users` table (source of truth
   *  for `role` and profile fields) and load the result into state. */
  const fetchAndSetUserProfile = async (supabaseUser: User, accessToken: string) => {
    try {
      const { data, error } = await api.syncAccount(
        {
          email: supabaseUser.email ?? '',
          displayName: supabaseUser.user_metadata?.full_name || undefined,
          avatarUrl: supabaseUser.user_metadata?.avatar_url || undefined,
        },
        { token: accessToken, throwOnError: true },
      );
      if (error || !data) throw new Error(error || 'No data returned');
      setUser(mergeBackendUser(supabaseUser, data.user));
    } catch (e) {
      console.error('Error syncing user profile with backend:', e);
      setUser(supabaseUser); // fallback: signed in, but role/profile unknown
    } finally {
      setLoading(false);
    }
  };

  const login = (newToken: string) => {
    safeStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const loginAnonymously = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      if (data.user) {
        return data.user;
      }
      throw new Error('No user returned from anonymous sign in');
    } catch (error: any) {
      console.error('Anonymous sign-in failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
      // It will redirect away, so we don't setLoading(false) here
    } catch (error) {
      console.error('Google sign-in failed:', error);
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out failed', error);
    } finally {
      safeStorage.removeItem('token');
      setToken(null);
      setUser(null);
      setLoading(false);
      navigate('/login');
    }
  };

  /** Push profile edits to the backend. Only `displayName`/`phone`/`avatarUrl`
   *  are persisted server-side today — fields like gender/dob have no column
   *  in the `users` table yet, so they're kept in local state only. */
  const syncProfileToSupabase = async (profileData: any) => {
    if (!user || !token) return;

    const displayName =
      profileData.firstName || profileData.lastName
        ? `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim()
        : (user.displayName ?? undefined);

    try {
      const { data, error } = await api.syncAccount(
        {
          email: user.email ?? '',
          displayName,
          phone: profileData.phone ?? user.phone,
          avatarUrl: profileData.profilePic ?? profileData.avatarUrl ?? user.avatar,
        },
        { token, throwOnError: true },
      );
      if (error || !data) throw new Error(error || 'No data returned');

      setUser((prev) =>
        prev ? { ...prev, ...profileData, ...mergeBackendUser(prev, data.user) } : null,
      );
    } catch (e) {
      console.error('Failed to sync profile with backend', e);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      token, 
      user, 
      login, 
      loginAnonymously, 
      loginWithGoogle, 
      logout, 
      isAuthenticated: !!user,
      loading,
      syncProfileToSupabase,
      syncProfileToFirestore: syncProfileToSupabase // Compatibility alias
    }}>
      {loading ? (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center">
          <DotsLoader />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
