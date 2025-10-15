"use client";

import React from 'react';
import ReturnRequestForm from '@/components/ReturnRequestForm';
import ReturnRequestList from '@/components/ReturnRequestList';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ReturnRequestsPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-start w-full max-w-4xl mx-auto p-4 space-y-8">
      <div className="text-center bg-white p-8 rounded-lg shadow-md w-full">
        <h2 className="text-4xl font-bold mb-4 text-blue-600">Pengajuan Pengembalian Barang</h2>
        <p className="text-xl text-blue-600 mb-6">
          Ajukan pengembalian barang yang telah Anda pinjam.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
        <Card>
          <CardHeader>
            <CardTitle>Ajukan Pengembalian Baru</CardTitle>
          </CardHeader>
          <CardContent>
            <ReturnRequestForm />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Pengajuan Pengembalian Anda</CardTitle>
          </CardHeader>
          <CardContent>
            <ReturnRequestList />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReturnRequestsPage;