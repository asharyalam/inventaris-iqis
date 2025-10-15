"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MadeWithDyad } from "@/components/made-with-dyad";

interface AdminDashboardProps {
  firstName: string;
  instansi: string;
  role: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ firstName, instansi, role }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    console.log("AdminDashboard - Logging out...");
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-100 p-4">
      <div className="text-center bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-5xl font-extrabold text-blue-900 mb-6">Sistem Inventaris Barang IQIS</h1>
        <h2 className="text-4xl font-bold mb-4">Selamat Datang, Admin {firstName}!</h2>
        <div className="mb-4 text-lg text-blue-700">
          <p><strong>Instansi:</strong> {instansi}</p>
          <p><strong>Peran:</strong> {role}</p>
        </div>
        <p className="text-xl text-blue-600 mb-6">
          Ini adalah halaman dashboard khusus Admin. Anda memiliki akses penuh.
        </p>
        <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white">
          Logout
        </Button>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default AdminDashboard;