import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { safeStorage } from '../lib/storage';
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
        fetchAndSetUserProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setToken(session.access_token);
        safeStorage.setItem('token', session.access_token);
        await fetchAndSetUserProfile(session.user);
      } else {
        setToken(null);
        setUser(null);
        safeStorage.removeItem('token');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchAndSetUserProfile = async (supabaseUser: User) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();
      
      let appUser: AppUser = { ...supabaseUser };
      
      if (data && !error) {
        appUser = {
          ...appUser,
          name: data.name || data.first_name,
          firstName: data.first_name,
          lastName: data.last_name,
          phone: data.phone,
          avatar: data.profile_pic,
          role: data.role,
          displayName: data.name || data.first_name || supabaseUser.email,
          photoURL: data.profile_pic
        };
      } else {
        // If they don't have a profile yet, create one
        const nameParts = supabaseUser.user_metadata?.full_name?.split(' ') || [];
        const newProfile = {
          id: supabaseUser.id,
          email: supabaseUser.email,
          first_name: nameParts[0] || '',
          last_name: nameParts.slice(1).join(' ') || '',
          name: supabaseUser.user_metadata?.full_name || '',
          profile_pic: supabaseUser.user_metadata?.avatar_url || ''
        };
        await supabase.from('users').insert(newProfile);
        
        appUser = {
          ...appUser,
          name: newProfile.name,
          firstName: newProfile.first_name,
          lastName: newProfile.last_name,
          displayName: newProfile.name || supabaseUser.email,
          avatar: newProfile.profile_pic,
          photoURL: newProfile.profile_pic
        };
      }
      
      setUser(appUser);
    } catch (e) {
      console.error('Error fetching user profile from Supabase:', e);
      setUser(supabaseUser); // fallback
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

  const syncProfileToSupabase = async (profileData: any) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: profileData.firstName,
          last_name: profileData.lastName,
          name: `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim(),
          phone: profileData.phone,
          gender: profileData.gender,
          dob: profileData.dob,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
        
      if (error) throw error;
      
      // Update local state
      setUser(prev => prev ? { ...prev, ...profileData } : null);
    } catch (e) {
      console.error('Failed to sync profile to Supabase', e);
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
