"use client";

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, LayoutDashboard, Users, History, Handshake } from 'lucide-react'; // Import History and Handshake icons
import { useIsMobile } from '@/hooks/use-mobile';
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

const SidebarContent: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
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
        onClick={onClose}
      />
      {isAdmin && (
        <>
          <NavLink
            to="/admin/users"
            icon={<Users className="h-4 w-4" />}
            label="Manajemen Pengguna"
            isActive={location.pathname === '/admin/users'}
            onClick={onClose}
          />
          <NavLink
            to="/admin/return-requests"
            icon={<History className="h-4 w-4" />}
            label="Permintaan Pengembalian"
            isActive={location.pathname === '/admin/return-requests'}
            onClick={onClose}
          />
          <NavLink
            to="/admin/borrow-requests"
            icon={<Handshake className="h-4 w-4" />}
            label="Permintaan Peminjaman"
            isActive={location.pathname === '/admin/borrow-requests'}
            onClick={onClose}
          />
        </>
      )}
    </nav>
  );
};

const Sidebar: React.FC = () => {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = React.useState(false);

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <h1 className="text-2xl font-bold text-gray-900 p-4">IQIS Inventaris</h1>
          <SidebarContent onClose={() => setIsOpen(false)} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="text-lg">IQIS Inventaris</span>
          </Link>
        </div>
        <div className="flex-1">
          <SidebarContent />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;