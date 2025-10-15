"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MadeWithDyad } from "@/components/made-with-dyad";

interface DashboardProps {
  firstName: string;
  instansi: string;
  role: string;
}

const Dashboard: React.FC<DashboardProps> = ({ firstName, instansi, role }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    console.log("Dashboard - Logging out...");
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="text-center bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-6">Sistem Inventaris Barang IQIS</h1>
        <h2 className="text-4xl font-bold mb-4">Selamat Datang, {firstName}!</h2>
        <div className="mb-4 text-lg text-gray-700">
          <p><strong>Instansi:</strong> {instansi}</p>
          <p><strong>Peran:</strong> {role}</p>
        </div>
        <p className="text-xl text-gray-600 mb-6">
          Ini adalah halaman dashboard Anda.
        </p>
        <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white">
          Logout
        </Button>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Dashboard;