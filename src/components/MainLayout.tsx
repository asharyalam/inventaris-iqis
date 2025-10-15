"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from './SessionContextProvider';
import Sidebar from './Sidebar'; // Import Sidebar component
import { useIsMobile } from '@/hooks/use-mobile'; // Import useIsMobile

interface MainLayoutProps {
  firstName: string;
  instansi: string;
  role: string;
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ firstName, instansi, role, children }) => {
  const navigate = useNavigate();
  const { userProfile } = useSession();
  const isAdmin = userProfile?.role === 'Admin';
  const isMobile = useIsMobile(); // Gunakan hook useIsMobile

  const handleLogout = async () => {
    console.log("MainLayout - Logging out...");
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {!isMobile && <Sidebar />} {/* Sidebar hanya terlihat di desktop */}
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 justify-between">
          {isMobile && <Sidebar />} {/* Sidebar trigger di header untuk mobile */}
          <div className="flex items-center space-x-4">
            <span className="text-lg text-gray-700">Selamat Datang, {firstName} ({role})</span>
          </div>
          <Button onClick={handleLogout} variant="destructive">
            Logout
          </Button>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
        <MadeWithDyad />
      </div>
    </div>
  );
};

export default MainLayout;