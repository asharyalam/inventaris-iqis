"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { LayoutDashboard, Users } from 'lucide-react';
import { useSession } from './SessionContextProvider';

interface NavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon, label, isActive, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
      isActive && "bg-muted text-primary"
    )}
  >
    {icon}
    {label}
  </Link>
);

const SidebarContent: React.FC = () => {
  const location = useLocation();
  const { userProfile } = useSession();
  const isAdmin = userProfile?.role === 'Admin';

  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      <NavLink
        to="/"
        icon={<LayoutDashboard className="h-4 w-4" />}
        label="Dashboard"
        isActive={location.pathname === '/'}
      />
      {isAdmin && (
        <NavLink
          to="/admin/users"
          icon={<Users className="h-4 w-4" />}
          label="Manajemen Pengguna"
          isActive={location.pathname === '/admin/users'}
        />
      )}
    </nav>
  );
};

const Sidebar: React.FC = () => {
  return (
    <div className="border-r bg-muted/40 flex flex-col h-full max-h-screen">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span className="text-lg">IQIS Inventaris</span>
        </Link>
      </div>
      <div className="flex-1 py-4">
        <SidebarContent />
      </div>
    </div>
  );
};

export default Sidebar;