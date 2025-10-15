"use client";

import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSession } from './SessionContextProvider';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from '@/lib/utils';
import { Home, Package, Handshake, Users, ClipboardList, RotateCcw, PlusCircle, LogOut, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { userProfile, isAdmin, isHeadmaster } = useSession();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError(`Gagal logout: ${error.message}`);
    } else {
      showSuccess("Anda telah berhasil logout.");
      navigate('/login', { replace: true });
      onClose(); // Close sidebar after logout
    }
  };

  const commonLinkClasses = "flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-all hover:text-sidebar-primary";
  const activeLinkClasses = "bg-sidebar-accent text-sidebar-accent-foreground";

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex h-full w-64 flex-col border-r bg-sidebar-background transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex h-16 items-center border-b px-4 lg:px-6">
        <Link to={isAdmin ? '/admin/dashboard' : isHeadmaster ? '/headmaster/dashboard' : '/dashboard'} className="flex items-center gap-2 font-semibold text-sidebar-primary">
          <Home className="h-6 w-6" />
          <span>Inventaris IQIS</span>
        </Link>
        <Button variant="ghost" size="icon" className="ml-auto lg:hidden" onClick={onClose}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close sidebar</span>
        </Button>
      </div>
      <ScrollArea className="flex-1 py-4">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {userProfile?.role === 'Pengguna' && (
            <>
              <Link to="/dashboard" className={cn(commonLinkClasses, location.pathname === '/dashboard' && activeLinkClasses)} onClick={onClose}>
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
              <Link to="/consumable-requests" className={cn(commonLinkClasses, location.pathname === '/consumable-requests' && activeLinkClasses)} onClick={onClose}>
                <Package className="h-4 w-4" />
                Permintaan Habis Pakai
              </Link>
              <Link to="/borrow-requests" className={cn(commonLinkClasses, location.pathname === '/borrow-requests' && activeLinkClasses)} onClick={onClose}>
                <Handshake className="h-4 w-4" />
                Permintaan Peminjaman
              </Link>
              <Link to="/return-requests" className={cn(commonLinkClasses, location.pathname === '/return-requests' && activeLinkClasses)} onClick={onClose}>
                <RotateCcw className="h-4 w-4" />
                Pengajuan Pengembalian
              </Link>
            </>
          )}
          {isAdmin && (
            <>
              <Link to="/admin/dashboard" className={cn(commonLinkClasses, location.pathname === '/admin/dashboard' && activeLinkClasses)} onClick={onClose}>
                <Home className="h-4 w-4" />
                Dashboard Admin
              </Link>
              <Link to="/admin/items" className={cn(commonLinkClasses, location.pathname === '/admin/items' && activeLinkClasses)} onClick={onClose}>
                <Package className="h-4 w-4" />
                Manajemen Barang
              </Link>
              <Link to="/admin/add-item" className={cn(commonLinkClasses, location.pathname === '/admin/add-item' && activeLinkClasses)} onClick={onClose}>
                <PlusCircle className="h-4 w-4" />
                Tambah Barang Baru
              </Link>
              <Link to="/admin/consumable-processing" className={cn(commonLinkClasses, location.pathname === '/admin/consumable-processing' && activeLinkClasses)} onClick={onClose}>
                <ClipboardList className="h-4 w-4" />
                Pemrosesan Permintaan
              </Link>
              <Link to="/admin/borrow-processing" className={cn(commonLinkClasses, location.pathname === '/admin/borrow-processing' && activeLinkClasses)} onClick={onClose}>
                <Handshake className="h-4 w-4" />
                Proses Peminjaman
              </Link>
              <Link to="/admin/return-requests" className={cn(commonLinkClasses, location.pathname === '/admin/return-requests' && activeLinkClasses)} onClick={onClose}>
                <RotateCcw className="h-4 w-4" />
                Proses Pengembalian
              </Link>
              <Link to="/admin/users" className={cn(commonLinkClasses, location.pathname === '/admin/users' && activeLinkClasses)} onClick={onClose}>
                <Users className="h-4 w-4" />
                Manajemen Pengguna
              </Link>
            </>
          )}
          {isHeadmaster && (
            <>
              <Link to="/headmaster/dashboard" className={cn(commonLinkClasses, location.pathname === '/headmaster/dashboard' && activeLinkClasses)} onClick={onClose}>
                <Home className="h-4 w-4" />
                Dashboard Kepala Sekolah
              </Link>
              <Link to="/headmaster/consumable-approvals" className={cn(commonLinkClasses, location.pathname === '/headmaster/consumable-approvals' && activeLinkClasses)} onClick={onClose}>
                <Package className="h-4 w-4" />
                Persetujuan Habis Pakai
              </Link>
              <Link to="/headmaster/borrow-approvals" className={cn(commonLinkClasses, location.pathname === '/headmaster/borrow-approvals' && activeLinkClasses)} onClick={onClose}>
                <Handshake className="h-4 w-4" />
                Persetujuan Peminjaman
              </Link>
            </>
          )}
        </nav>
      </ScrollArea>
      {userProfile && (
        <div className="mt-auto p-4 border-t">
          <Button onClick={handleLogout} variant="destructive" className="w-full">
            <LogOut className="mr-2 h-4 w-4" /> Logout
          </Button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;