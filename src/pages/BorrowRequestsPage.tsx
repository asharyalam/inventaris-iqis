"use client";

import React from 'react';
import BorrowRequestForm from '@/components/BorrowRequestForm';
import BorrowRequestList from '@/components/BorrowRequestList';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BorrowRequestsPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-start w-full max-w-4xl mx-auto p-4 space-y-8">
      <div className="text-center bg-white p-8 rounded-lg shadow-md w-full">
        <h2 className="text-4xl font-bold mb-4 text-blue-600">Permintaan Peminjaman Barang</h2>
        <p className="text-xl text-blue-600 mb-6">
          Ajukan permintaan untuk meminjam barang yang harus dikembalikan setelah digunakan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
        <Card>
          <CardHeader>
            <CardTitle>Ajukan Permintaan Baru</CardTitle>
          </CardHeader>
          <CardContent>
            <BorrowRequestForm />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Permintaan Anda</CardTitle>
          </CardHeader>
          <CardContent>
            <BorrowRequestList />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BorrowRequestsPage;