"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Package, Handshake, History } from 'lucide-react';
import { useSession } from '@/components/SessionContextProvider';

const KepalaSekolahDashboard: React.FC = () => {
  const { userProfile } = useSession();

  return (
    <div className="flex flex-col items-center justify-start w-full max-w-6xl mx-auto p-4 space-y-8">
      <div className="text-center bg-white p-8 rounded-lg shadow-md w-full">
        <h2 className="text-4xl font-bold mb-4 text-blue-600">Selamat Datang, Kepala Sekolah {userProfile?.first_name || ''}!</h2>
        <p className="text-xl text-blue-600 mb-6">
          Pilih opsi di bawah untuk meninjau dan menyetujui permintaan.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        <Link to="/headmaster/consumable-approvals">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Persetujuan Barang Habis Pakai</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">Tinjau</p>
              <p className="text-xs text-muted-foreground">Setujui atau tolak permintaan barang habis pakai.</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/headmaster/borrow-approvals">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Persetujuan Peminjaman Barang</CardTitle>
              <Handshake className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">Tinjau</p>
              <p className="text-xs text-muted-foreground">Setujui atau tolak permintaan peminjaman barang.</p>
            </CardContent>
          </Card>
        </Link>

        {/* Placeholder for future reports for Headmaster */}
        <Card className="opacity-70 cursor-not-allowed">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laporan & Analitik</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">Segera Hadir</p>
            <p className="text-xs text-muted-foreground">Lihat laporan stok dan aktivitas transaksi.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default KepalaSekolahDashboard;