"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  instansi: string | null;
  role: string | null;
  avatar_url: string | null;
  updated_at: string | null;
}

interface SessionContextType {
  session: Session | null;
  user: User | null;
  userProfile: UserProfile | null; // Tambahkan userProfile
  isLoading: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null); // State untuk profil
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error("SessionContextProvider - Error fetching user profile:", error);
      setUserProfile(null);
    } else if (data) {
      setUserProfile(data);
    }
  };

  useEffect(() => {
    const handleSession = async (currentSession: Session | null) => {
      setSession(currentSession);
      setUser(currentSession?.user || null);
      if (currentSession?.user) {
        await fetchUserProfile(currentSession.user.id);
      } else {
        setUserProfile(null);
      }
      setIsLoading(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <SessionContext.Provider value={{ session, user, userProfile, isLoading }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionContextProvider');
  }
  return context;
};