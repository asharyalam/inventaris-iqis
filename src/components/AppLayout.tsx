"use client";

import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '@/components/SessionContextProvider';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Home, Package, Handshake, History, Users, PlusCircle, LogOut, Menu, User as UserIcon, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: Home, roles: ["Pengguna"] },
  { title: "Dashboard", href: "/admin/dashboard", icon: Home, roles: ["Admin", "Kepala Sekolah"] },
  { title: "Profil", href: "/profile", icon: UserIcon, roles: ["Pengguna", "Admin", "Kepala Sekolah"] },
  { title: "Permintaan Habis Pakai", href: "/consumable-requests", icon: Package, roles: ["Pengguna"] },
  { title: "Permintaan Peminjaman", href: "/borrow-requests", icon: Handshake, roles: ["Pengguna"] },
  { title: "Manajemen Barang", href: "/admin/items", icon: Package, roles: ["Admin"] },
  { title: "Tambah Barang Baru", href: "/admin/add-item", icon: PlusCircle, roles: ["Admin"] },
  { title: "Manajemen Persetujuan Peminjaman", href: "/admin/borrow-requests", icon: Handshake, roles: ["Admin", "Kepala Sekolah"] }, // Diperbarui: Admin juga bisa melihat
  { title: "Manajemen Persetujuan Pengembalian", href: "/admin/return-requests", icon: History, roles: ["Admin"] },
  { title: "Manajemen Persetujuan Habis Pakai", href: "/admin/consumable-requests", icon: Package, roles: ["Kepala Sekolah"] },
  { title: "Manajemen Pengguna", href: "/admin/users", icon: Users, roles: ["Admin"] },
  { title: "Pemantauan & Pelaporan", href: "/admin/monitoring-reporting", icon: BarChart3, roles: ["Kepala Sekolah"] },
];

const SidebarContent: React.FC<{ userRole: string | null; closeSheet?: () => void }> = ({ userRole, closeSheet }) => {
  const location = useLocation();

  const filteredNavItems = navItems.filter(item =>
    item.roles.includes(userRole || 'Pengguna')
  );

  return (
    <ScrollArea className="h-full px-3 py-4">
      <div className="space-y-1">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={closeSheet}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-900 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                isActive ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-50" : ""
              )}
            >
              <Icon className="h-4 w-4" />
              {item.title}
            </Link>
          );
        })}
      </div>
    </ScrollArea>
  );
};

const AppLayout: React.FC = () => {
  const { session, userProfile, isLoading, canAccessAdminDashboard } = useSession();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError(`Gagal keluar: ${error.message}`);
    } else {
      showSuccess("Anda telah berhasil keluar.");
      navigate('/login', { replace: true });
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Memuat...</div>;
  }

  if (!session) {
    return <Outlet />;
  }

  const userRole = userProfile?.role || 'Pengguna';

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="hidden border-r bg-muted/40 md:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
              <Link to={canAccessAdminDashboard ? "/admin/dashboard" : "/dashboard"} className="flex items-center gap-2 font-semibold">
                <Package className="h-6 w-6" />
                <span>Inventaris IQIS</span>
              </Link>
            </div>
            <div className="flex-1">
              <SidebarContent userRole={userRole} />
            </div>
            <div className="mt-auto p-4 border-t">
              <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Keluar
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col">
        {/* Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          {isMobile && (
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0 md:hidden"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col w-[280px] sm:w-[320px]">
                <nav className="grid gap-2 text-lg font-medium">
                  <Link to={canAccessAdminDashboard ? "/admin/dashboard" : "/dashboard"} className="flex items-center gap-2 text-lg font-semibold mb-4">
                    <Package className="h-6 w-6" />
                    <span>Inventaris IQIS</span>
                  </Link>
                  <SidebarContent userRole={userRole} closeSheet={() => setIsSheetOpen(false)} />
                </nav>
                <div className="mt-auto border-t pt-4">
                  <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Keluar
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          )}
          <div className="w-full flex-1">
            {/* You can add a search bar or other header elements here */}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{userProfile?.first_name || 'Pengguna'} ({userRole})</span>
            {!isMobile && (
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Keluar</span>
              </Button>
            )}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;