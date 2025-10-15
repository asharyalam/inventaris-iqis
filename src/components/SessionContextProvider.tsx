"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  instansi: string | null;
  role: string | null;
  avatar_url: string | null;
}

interface SessionContextType {
  session: Session | null;
  user: User | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  isAdmin: boolean;
  isHeadmaster: boolean;
  canAccessAdminDashboard: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionContextProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Initialize as true

  useEffect(() => {
    const setupAuth = async () => {
      setIsLoading(true); // Ensure loading is true at the start of auth setup
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        showError(`Error getting session: ${error.message}`);
      }
      setSession(session);
      setUser(session?.user || null);
      // Profile fetching will be handled by the next useEffect, which will then set isLoading to false
    };

    setupAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
        // isLoading will be managed by the profile fetching useEffect
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchProfileAndSetLoading = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, instansi, role, avatar_url')
          .eq('id', user.id)
          .single();

        if (error) {
          showError(`Error fetching profile: ${error.message}`);
          setUserProfile(null);
        } else {
          setUserProfile(data);
        }
      } else {
        setUserProfile(null); // No user, no profile
      }
      setIsLoading(false); // Set loading to false once profile (or lack thereof) is determined
    };

    // Only fetch profile if user state has been determined (not initial undefined)
    // and only if user is not null (i.e., authenticated)
    if (user !== undefined) {
      if (user) {
        fetchProfileAndSetLoading();
      } else {
        // If user is null (unauthenticated), we are done loading
        setUserProfile(null);
        setIsLoading(false);
      }
    }
  }, [user]); // Depend on user state

  const isAdmin = userProfile?.role === 'Admin';
  const isHeadmaster = userProfile?.role === 'Kepala Sekolah';
  const canAccessAdminDashboard = isAdmin || isHeadmaster;

  return (
    <SessionContext.Provider value={{ session, user, userProfile, isLoading, isAdmin, isHeadmaster, canAccessAdminDashboard }}>
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