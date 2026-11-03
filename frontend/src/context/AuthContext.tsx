import React, { createContext, useCallback, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { safeStorage } from '../lib/storage';
import { api, BackendUser } from '../lib/api';
import DotsLoader from '../components/DotsLoader';
import {
  hasAccountSession,
  SESSION_EXPIRED_EVENT,
  LAST_ACTIVITY_KEY,
  USER_ACTIVITY_EVENT,
  getIdleTimeoutMs,
  recordUserActivity,
  getLastActivityTime,
  clearLastActivity,
} from '../lib/authAccess';

export type AppUser = User & {
  publicId?: string;
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
  refreshProfile: () => Promise<void>;
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

/** Keep the Supabase identity and the backend-owned role/profile on one user object. */
function mergeBackendUser(supabaseUser: User, backendUser: BackendUser): AppUser {
  const name = [backendUser.firstName, backendUser.lastName].filter(Boolean).join(' ');
  return {
    ...supabaseUser,
    publicId: backendUser.publicId ?? undefined,
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
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const profileVersion = useRef(0);
  const activeAccountId = useRef<string | null>(null);
  const clearAccount = () => {
    profileVersion.current += 1;
    activeAccountId.current = null;
    setToken(null);
    setUser(null);
    safeStorage.removeItem('token');
    clearLastActivity();
    setLoading(false);
  };

  useEffect(() => {
    const expire = () => {
      clearAccount();
      void supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      const currentPath = window.location.pathname + window.location.search + window.location.hash;
      const returnTo = !/^\/(login|register)\/?$/i.test(window.location.pathname) ? currentPath : undefined;
      navigate('/login?reason=expired', {
        replace: true,
        state: { reason: 'expired', returnTo },
      });
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, expire);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, expire);
  }, [navigate]);

  const isAuthenticated = hasAccountSession(user, token);
  const lastActivityRef = useRef<number>(Date.now());

  const handleTimeoutLogout = useCallback(async () => {
    profileVersion.current += 1;
    activeAccountId.current = null;
    clearLastActivity();
    safeStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setLoading(false);
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (e) {
      console.error('Sign out on idle timeout failed:', e);
    }
    const currentPath = window.location.pathname + window.location.search + window.location.hash;
    const returnTo = !/^\/(login|register)\/?$/i.test(window.location.pathname) ? currentPath : undefined;
    navigate('/login?reason=timeout', {
      replace: true,
      state: { reason: 'timeout', returnTo },
    });
  }, [navigate]);

  // Standard idle timeout watcher
  useEffect(() => {
    if (!isAuthenticated) return;

    const idleTimeoutMs = getIdleTimeoutMs();
    const now = Date.now();
    const existingActivity = getLastActivityTime();
    if (!existingActivity || now - existingActivity >= idleTimeoutMs) {
      recordUserActivity();
      lastActivityRef.current = now;
    } else {
      lastActivityRef.current = existingActivity;
    }

    const onUserActivity = () => {
      lastActivityRef.current = Date.now();
      recordUserActivity();
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === LAST_ACTIVITY_KEY && e.newValue) {
        const parsed = parseInt(e.newValue, 10);
        if (parsed) lastActivityRef.current = Math.max(lastActivityRef.current, parsed);
      }
    };

    const onActivityEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ timestamp?: number }>;
      if (customEvent.detail?.timestamp) {
        lastActivityRef.current = Math.max(lastActivityRef.current, customEvent.detail.timestamp);
      }
    };

    const checkTimeout = () => {
      const latestActivity = Math.max(lastActivityRef.current, getLastActivityTime());
      if (Date.now() - latestActivity >= idleTimeoutMs) {
        void handleTimeoutLogout();
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkTimeout();
      }
    };

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'] as const;
    events.forEach((eventName) => {
      window.addEventListener(eventName, onUserActivity, { passive: true });
    });
    window.addEventListener('storage', onStorage);
    window.addEventListener(USER_ACTIVITY_EVENT, onActivityEvent);
    document.addEventListener('visibilitychange', onVisibilityChange);

    const intervalId = window.setInterval(checkTimeout, 10000);

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, onUserActivity);
      });
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(USER_ACTIVITY_EVENT, onActivityEvent);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.clearInterval(intervalId);
    };
  }, [isAuthenticated, handleTimeoutLogout]);

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
    let active = true;
    let receivedAuthEvent = false;
    const applySession = (session: { access_token: string; user: User } | null) => {
      if (!active) return;
      if (!session || session.user.is_anonymous) {
        clearAccount();
        return;
      }
      if (activeAccountId.current !== session.user.id) {
        setUser(null);
        setLoading(true);
      }
      activeAccountId.current = session.user.id;
      setToken(session.access_token);
      safeStorage.setItem('token', session.access_token);
      recordUserActivity();
      void fetchAndSetUserProfile(session.user, session.access_token);
    };
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active || receivedAuthEvent) return;
      applySession(session);
      removeEmptyOAuthFragment();
    }).catch(() => { if (active && !receivedAuthEvent) clearAccount(); });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      receivedAuthEvent = true;
      applySession(session);
      removeEmptyOAuthFragment();
    });

    return () => {
      active = false;
      profileVersion.current += 1;
      subscription.unsubscribe();
    };
  }, []);

  /** Sync the Supabase session into our own `users` table (source of truth
   *  for `role` and profile fields) and load the result into state. */
  const fetchAndSetUserProfile = async (supabaseUser: User, accessToken: string) => {
    const version = ++profileVersion.current;
    try {
      const { data, error } = await api.syncAccount(
        {},
        { token: accessToken },
      );
      if (error || !data) throw new Error(error || 'No data returned');
      if (version === profileVersion.current) setUser(mergeBackendUser(supabaseUser, data.user));
    } catch (e) {
      console.error('Error syncing user profile with backend:', e);
      if (version === profileVersion.current) clearAccount();
    } finally {
      if (version === profileVersion.current) setLoading(false);
    }
  };

  /** Reload a role changed by PskAdmin without asking the user to sign out. */
  const refreshProfile = useCallback(async () => {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session || session.user.is_anonymous) {
      throw new Error('Please sign in again to check your account status.');
    }
    const version = ++profileVersion.current;
    const { data, error } = await api.syncAccount({}, {
      token: session.access_token,
      throwOnError: true,
    });
    if (error || !data) throw new Error(error || 'Could not refresh your profile.');
    if (version === profileVersion.current && activeAccountId.current === session.user.id) {
      setToken(session.access_token);
      safeStorage.setItem('token', session.access_token);
      setUser(mergeBackendUser(session.user, data.user));
    }
  }, []);

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
    profileVersion.current += 1;
    clearLastActivity();
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

  /** Push editable profile details to the backend; auth identifiers are token-derived. */
  const syncProfileToSupabase = async (profileData: any) => {
    if (!user || !token) throw new Error('Please sign in before saving your profile.');

    const gender: 'male' | 'female' | 'other' | undefined = ['male', 'female', 'other'].includes(
      profileData.gender,
    )
      ? profileData.gender
      : undefined;

    try {
      const requestedAvatar = profileData.profilePic ?? profileData.avatarUrl ?? user.avatar;
      const { data, error } = await api.syncAccount(
        {
          firstName: profileData.firstName ?? user.firstName,
          lastName: profileData.lastName ?? user.lastName,
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
      isAuthenticated: hasAccountSession(user, token),
      loading,
      syncProfileToSupabase,
      refreshProfile,
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
