/**
 * Hook para gerenciar autenticação e tipo de usuário
 */

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  name: string;
  type: 'admin' | 'locadora';
  locadora_id?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetching to avoid deadlock
        if (session?.user) {
          setTimeout(async () => {
            try {
              const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .single();
              
              if (error) {
                console.error('Error fetching profile:', error);
                setProfile(null);
              } else {
                setProfile(profileData as UserProfile);
              }
            } catch (error) {
              console.error('Error fetching profile:', error);
              setProfile(null);
            }
          }, 0);
        } else {
          setProfile(null);
        }
        
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Fetch user profile
        const fetchProfile = async () => {
          try {
            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single();
            
            if (error) {
              console.error('Error fetching profile:', error);
            } else {
              setProfile(profileData as UserProfile);
            }
          } catch (error) {
            console.error('Error fetching profile:', error);
          }
          setIsLoading(false);
        };
        
        fetchProfile();
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = profile?.type === 'admin';
  const isLocadora = profile?.type === 'locadora';

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return {
    user,
    session,
    profile,
    isAdmin,
    isLocadora,
    isLoading,
    isAuthenticated: !!user,
    logout
  };
}