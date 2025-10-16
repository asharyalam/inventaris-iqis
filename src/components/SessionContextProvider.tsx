"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { useQuery } from '@tanstack/react-query'; // Import useQuery

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  instansi: string | null;
  role: string | null;
  avatar_url: string | null;
  position: string | null; // Added position
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
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // Pisahkan status loading untuk sesi otentikasi

  useEffect(() => {
    const setupAuth = async () => {
      setIsLoadingAuth(true);
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        showError(`Error getting session: ${error.message}`);
      }
      setSession(session);
      setUser(session?.user || null);
      setIsLoadingAuth(false); // Sesi otentikasi selesai dimuat
    };

    setupAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Gunakan useQuery untuk mengambil profil pengguna, yang dapat dibatalkan dari komponen lain
  const { data: userProfile, isLoading: isLoadingProfile } = useQuery<UserProfile, Error>({
    queryKey: ['userProfile', user?.id], // Kunci kueri unik untuk profil pengguna individu
    queryFn: async () => {
      if (!user) {
        throw new Error("User not authenticated.");
      }
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, instansi, role, avatar_url, position') // Added position
        .eq('id', user.id)
        .single();

      if (error) {
        throw new Error(error.message);
      }
      return data;
    },
    enabled: !!user, // Hanya jalankan kueri jika pengguna tersedia
    staleTime: 1000 * 60 * 5, // Data profil dapat dianggap segar selama 5 menit
  });

  const isLoading = isLoadingAuth || isLoadingProfile; // Status loading keseluruhan

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