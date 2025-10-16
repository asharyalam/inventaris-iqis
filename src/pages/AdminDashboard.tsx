"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, Handshake, History, PlusCircle, Database } from 'lucide-react'; // Import Database icon
import { useSession } from '@/components/SessionContextProvider';
import HeadmasterDashboard from './HeadmasterDashboard';

const AdminDashboard: React.FC = () => {
  const { userProfile, isAdmin, isHeadmaster } = useSession();

  if (isHeadmaster && !isAdmin) { // If user is Headmaster but not also an Admin
    return <HeadmasterDashboard />;
  }

  // Render Admin Dashboard content for Admin role
  return (
    <div className="flex flex-col items-center justify-start w-full max-w-6xl mx-auto space-y-8">
      <div className="text-center bg-white p-8 rounded-lg shadow-md w-full">
        <h2 className="text-4xl font-bold mb-4 text-blue-600">Selamat Datang, Admin {userProfile?.first_name || ''}!</h2>
        <p className="text-xl text-blue-600 mb-6">
          Pilih opsi di bawah untuk mengelola sistem inventaris.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        <Link to="/admin/items">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manajemen Barang</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">Inventaris</p>
              <p className="text-xs text-muted-foreground">Lihat dan kelola semua barang.</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/add-item">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tambah Barang Baru</CardTitle>
              <PlusCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">Barang</p>
              <p className="text-xs text-muted-foreground">Tambahkan item baru ke inventaris.</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/borrow-requests">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manajemen Peminjaman Barang</CardTitle>
              <Handshake className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">Tinjau</p>
              <p className="text-xs text-muted-foreground">Kelola permintaan peminjaman barang.</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/return-requests">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manajemen Pengembalian</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">Tinjau</p>
              <p className="text-xs text-muted-foreground">Kelola permintaan pengembalian barang.</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/consumable-requests">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manajemen Permintaan Barang</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">Tinjau</p>
              <p className="text-xs text-muted-foreground">Kelola permintaan barang habis pakai.</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/users">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manajemen Pengguna</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">Pengguna</p>
              <p className="text-xs text-muted-foreground">Kelola peran dan profil pengguna.</p>
            </CardContent>
          </Card>
        </Link>

        {/* New Card for Data Management */}
        <Link to="/admin/data-management">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manajemen Data</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">Hapus Aktivitas</p>
              <p className="text-xs text-muted-foreground">Hapus semua riwayat permintaan.</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default AdminDashboard;