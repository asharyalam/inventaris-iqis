"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { useSession } from './SessionContextProvider';
import { Link } from 'react-router-dom';
import { Home, Menu } from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { userProfile, isLoading, isAdmin, isHeadmaster } = useSession();

  if (isLoading) {
    return null;
  }

  const getDashboardPath = () => {
    if (isAdmin) return '/admin/dashboard';
    if (isHeadmaster) return '/headmaster/dashboard';
    return '/dashboard';
  };

  return (
    <header className="bg-primary text-primary-foreground p-4 shadow-md flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
        <Link to={getDashboardPath()} className="text-2xl font-bold flex items-center gap-2">
          <Home className="h-6 w-6" /> Inventaris IQIS
        </Link>
      </div>
      {userProfile && (
        <span className="text-sm opacity-80">
          Halo, {userProfile.first_name || 'Pengguna'} ({userProfile.role || 'Pengguna'})
        </span>
      )}
    </header>
  );
};

export default Header;