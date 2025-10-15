"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { useSession } from './SessionContextProvider';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import { showSuccess, showError } from '@/utils/toast';
import { LogOut, Home, Package, Handshake, Users, ClipboardList, RotateCcw } from 'lucide-react'; // Added RotateCcw

const Header: React.FC = () => {
  const { userProfile, isLoading, isAdmin, isHeadmaster } = useSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError(`Gagal logout: ${error.message}`);
    } else {
      showSuccess("Anda telah berhasil logout.");
      navigate('/login', { replace: true });
    }
  };

  if (isLoading) {
    return null; // Don't render header while session is loading
  }

  const getDashboardPath = () => {
    if (isAdmin) return '/admin/dashboard';
    if (isHeadmaster) return '/headmaster/dashboard';
    return '/dashboard';
  };

  return (
    <header className="bg-primary text-primary-foreground p-4 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <Link to={getDashboardPath()} className="text-2xl font-bold flex items-center gap-2">
          <Home className="h-6 w-6" /> Inventaris IQIS
        </Link>
        {userProfile && (
          <span className="text-sm opacity-80">
            Halo, {userProfile.first_name || 'Pengguna'} ({userProfile.role || 'Pengguna'})
          </span>
        )}
      </div>
      <nav className="flex flex-wrap items-center gap-4">
        {userProfile && (
          <>
            {userProfile.role === 'Pengguna' && (
              <>
                <Link to="/consumable-requests">
                  <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80">
                    <Package className="mr-2 h-4 w-4" /> Barang Habis Pakai
                  </Button>
                </Link>
                <Link to="/borrow-requests">
                  <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80">
                    <Handshake className="mr-2 h-4 w-4" /> Peminjaman Barang
                  </Button>
                </Link>
                <Link to="/return-requests">
                  <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80">
                    <RotateCcw className="mr-2 h-4 w-4" /> Pengembalian Barang
                  </Button>
                </Link>
              </>
            )}
            {userProfile.role === 'Admin' && (
              <>
                <Link to="/admin/items">
                  <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80">
                    <Package className="mr-2 h-4 w-4" /> Manajemen Barang
                  </Button>
                </Link>
                <Link to="/admin/consumable-processing">
                  <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80">
                    <ClipboardList className="mr-2 h-4 w-4" /> Proses Habis Pakai
                  </Button>
                </Link>
                <Link to="/admin/borrow-processing">
                  <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80">
                    <Handshake className="mr-2 h-4 w-4" /> Proses Peminjaman
                  </Button>
                </Link>
                <Link to="/admin/return-requests">
                  <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80">
                    <RotateCcw className="mr-2 h-4 w-4" /> Proses Pengembalian
                  </Button>
                </Link>
                <Link to="/admin/users">
                  <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80">
                    <Users className="mr-2 h-4 w-4" /> Manajemen Pengguna
                  </Button>
                </Link>
              </>
            )}
            {userProfile.role === 'Kepala Sekolah' && (
              <>
                <Link to="/headmaster/consumable-approvals">
                  <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80">
                    <Package className="mr-2 h-4 w-4" /> Persetujuan Habis Pakai
                  </Button>
                </Link>
                <Link to="/headmaster/borrow-approvals">
                  <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80">
                    <Handshake className="mr-2 h-4 w-4" /> Persetujuan Peminjaman
                  </Button>
                </Link>
              </>
            )}
            <Button onClick={handleLogout} variant="secondary" className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </>
        )}
      </nav>
    </header>
  );
};

export default Header;