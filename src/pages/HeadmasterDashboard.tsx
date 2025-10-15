"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Handshake, History, Package, BarChart3 } from 'lucide-react';
import { useSession } from '@/components/SessionContextProvider';

const HeadmasterDashboard: React.FC = () => {
  const { userProfile } = useSession();

  return (
    <div className="flex flex-col items-center justify-start w-full max-w-6xl mx-auto space-y-8">
      <div className="text-center bg-white p-8 rounded-lg shadow-md w-full">
        <h2 className="text-4xl font-bold mb-4 text-blue-600">Selamat Datang, Kepala Sekolah {userProfile?.first_name || ''}!</h2>
        <p className="text-xl text-blue-600 mb-6">
          Pilih opsi di bawah untuk meninjau permintaan dan memantau inventaris.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        <Link to="/admin/borrow-requests">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Persetujuan Peminjaman</CardTitle>
              <Handshake className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">Tinjau</p>
              <p className="text-xs text-muted-foreground">Setujui atau tolak permintaan peminjaman.</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/return-requests">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Persetujuan Pengembalian</CardTitle>
              <History className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">Tinjau</p>
              <p className="text-xs text-muted-foreground">Setujui atau tolak permintaan pengembalian.</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/consumable-requests">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Persetujuan Habis Pakai</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">Tinjau</p>
              <p className="text-xs text-muted-foreground">Setujui atau tolak permintaan barang habis pakai.</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/monitoring-reporting">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pemantauan & Pelaporan</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">Lihat Laporan</p>
              <p className="text-xs text-muted-foreground">Lihat semua transaksi dan stok barang.</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default HeadmasterDashboard;