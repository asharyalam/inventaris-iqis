"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, History, Handshake, RotateCcw } from 'lucide-react'; // Added RotateCcw icon
import { useSession } from '@/components/SessionContextProvider';
import { Button } from '@/components/ui/button';

const UserDashboard: React.FC = () => {
  const { userProfile } = useSession();

  return (
    <div className="flex flex-col items-center justify-start w-full max-w-4xl mx-auto p-4 space-y-8">
      <div className="text-center bg-white p-8 rounded-lg shadow-md w-full">
        <h2 className="text-4xl font-bold mb-4 text-blue-600">Selamat Datang, {userProfile?.first_name || 'Pengguna'}!</h2>
        <p className="text-xl text-blue-600 mb-6">
          Pilih opsi di bawah untuk mengelola permintaan barang Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permintaan Barang Habis Pakai</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Ajukan permintaan untuk barang-barang yang akan habis pakai dan tidak perlu dikembalikan.
            </p>
            <Link to="/consumable-requests">
              <Button className="w-full">Buat Permintaan</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permintaan Peminjaman Barang</CardTitle>
            <Handshake className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Ajukan permintaan untuk meminjam barang yang harus dikembalikan setelah digunakan.
            </p>
            <Link to="/borrow-requests">
              <Button className="w-full">Buat Permintaan</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pengajuan Pengembalian Barang</CardTitle>
            <RotateCcw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Ajukan pengembalian barang inventaris yang telah Anda pinjam.
            </p>
            <Link to="/return-requests">
              <Button className="w-full">Ajukan Pengembalian</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserDashboard;