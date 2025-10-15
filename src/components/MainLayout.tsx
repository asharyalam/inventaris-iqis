"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface MainLayoutProps {
  firstName: string;
  instansi: string;
  role: string;
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ firstName, instansi, role, children }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    console.log("MainLayout - Logging out...");
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">Sistem Inventaris Barang IQIS</h1>
          <span className="text-gray-600">|</span>
          <span className="text-lg text-gray-700">Selamat Datang, {firstName} ({role})</span>
        </div>
        <Button onClick={handleLogout} variant="destructive">
          Logout
        </Button>
      </header>
      <main className="flex-grow flex items-center justify-center p-4">
        {children}
      </main>
      <MadeWithDyad />
    </div>
  );
};

export default MainLayout;