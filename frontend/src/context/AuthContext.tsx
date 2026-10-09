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
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  avatar?: string;
  avatarReference?: string;
  role?: string;
  displayName?: string;
  photoURL?: string; // mapping for compatibility with older code
};

interface AuthContextType {
  token: string | null;
  user: AppUser | null;
  login: (token: string) => void;
  loginWithPhoneSession: (session: { accessToken: string; refreshToken: string }) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
  syncProfileToSupabase: (profileData: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// A URL ending in /# has an empty location.hash, so checking hash === '#'
// never matches. Only remove the empty fragment after Supabase has read the
// OAuth callback; preserve meaningful anchors and auth parameters.
function removeEmptyOAuthFragment() {
  if (window.location.href.endsWith('#')) {
    window.history.replaceState(
      window.history.state,
      '',
      window.location.pathname + window.location.search,
    );
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(safeStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Private avatar links expire after five minutes; refresh only their display URL.
  useEffect(() => {
    const reference = user?.avatarReference;
    if (!token || !reference?.startsWith('storage://')) return;
    let active = true;
    const refresh = async () => {
      const result = await api.get<{ url: string }>(`/media/url?reference=${encodeURIComponent(reference)}`, { token });
      if (active && result.ok && result.data) {
        const url = result.data.url;
        setUser(previous => previous?.avatarReference === reference ? { ...previous, avatar: url, photoURL: url } : previous);
      }
    };
    const timer = window.setInterval(refresh, 4 * 60 * 1000);
    return () => { active = false; window.clearInterval(timer); };
  }, [token, user?.avatarReference]);

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
      removeEmptyOAuthFragment();
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setToken(session.access_token);
        safeStorage.setItem('token', session.access_token);
        removeEmptyOAuthFragment();
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
  const mergeBackendUser = (supabaseUser: User, backendUser: BackendUser): AppUser => {
    const name = [backendUser.firstName, backendUser.lastName].filter(Boolean).join(' ');
    return {
      ...supabaseUser,
      name: name || undefined,
      firstName: backendUser.firstName ?? undefined,
      lastName: backendUser.lastName ?? undefined,
      phone: backendUser.phone ?? undefined,
      gender: backendUser.gender ?? undefined,
      dateOfBirth: backendUser.dateOfBirth ?? undefined,
      avatar: backendUser.avatarUrlDisplay ?? backendUser.avatarUrl ?? undefined,
      avatarReference: backendUser.avatarUrl ?? undefined,
      role: backendUser.role,
      displayName: name || supabaseUser.email,
      photoURL: backendUser.avatarUrlDisplay ?? backendUser.avatarUrl ?? undefined,
    };
  };

  /** Sync the Supabase session into our own `users` table (source of truth
   *  for `role` and profile fields) and load the result into state. */
  const fetchAndSetUserProfile = async (supabaseUser: User, accessToken: string) => {
    try {
      const fullName: string = supabaseUser.user_metadata?.full_name || '';
      const [firstName, ...rest] = fullName.split(' ');
      const { data, error } = await api.syncAccount(
        {
          email: supabaseUser.email || undefined,
          firstName: firstName || undefined,
          lastName: rest.length > 0 ? rest.join(' ') : undefined,
          phone: supabaseUser.phone || undefined,
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

  /** Loads a session the backend minted for a phone number it already
   *  verified via OTP (see /api/otp/verify). Same identity every time the
   *  same phone number signs in — not a fresh anonymous user. */
  const loginWithPhoneSession = async (session: { accessToken: string; refreshToken: string }) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.setSession({
        access_token: session.accessToken,
        refresh_token: session.refreshToken,
      });
      if (error) throw error;
      // onAuthStateChange picks up the new session and clears `loading`.
    } catch (error: any) {
      console.error('Phone sign-in failed:', error);
      setLoading(false);
      throw error;
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

  /** Push profile edits (name, phone, gender, date of birth, avatar) to the backend. */
  const syncProfileToSupabase = async (profileData: any) => {
    if (!user || !token) return;

    const gender: 'male' | 'female' | 'other' | undefined = ['male', 'female', 'other'].includes(
      profileData.gender,
    )
      ? profileData.gender
      : undefined;

    try {
      const requestedAvatar = profileData.profilePic ?? profileData.avatarUrl ?? user.avatar;
      const { data, error } = await api.syncAccount(
        {
          email: user.email || undefined,
          firstName: profileData.firstName ?? user.firstName,
          lastName: profileData.lastName ?? user.lastName,
          phone: profileData.phone ?? user.phone,
          gender: gender ?? user.gender,
          dateOfBirth: profileData.dateOfBirth || profileData.dob || user.dateOfBirth,
          avatarUrl: requestedAvatar === user.avatar ? user.avatarReference : requestedAvatar,
        },
        { token, throwOnError: true },
      );
      if (error || !data) throw new Error(error || 'No data returned');

      setUser((prev) =>
        prev ? { ...prev, ...profileData, ...mergeBackendUser(prev, data.user) } : null,
      );
    } catch (e) {
      console.error('Failed to sync profile with backend', e);
      throw e;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      token,
      user,
      login,
      loginWithPhoneSession,
      loginWithGoogle,
      logout, 
      isAuthenticated: !!user,
      loading,
      syncProfileToSupabase,
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
