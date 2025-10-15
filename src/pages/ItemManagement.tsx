"use client";

import React from 'react';
import AddItemForm from '@/components/AddItemForm';
import ItemList from '@/components/ItemList';
import { useSession } from '@/components/SessionContextProvider';

const ItemManagement: React.FC = () => {
  const { userProfile, isLoading: isSessionLoading } = useSession();

  if (isSessionLoading) {
    return <div className="text-center">Memuat sesi pengguna...</div>;
  }

  if (userProfile?.role !== 'Admin') {
    return <div className="text-center text-red-500">Anda tidak memiliki izin untuk mengakses halaman ini.</div>;
  }

  return (
    <div className="flex flex-col items-center justify-start w-full max-w-6xl mx-auto p-4 space-y-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Manajemen Barang</h2>
      <AddItemForm />
      <ItemList />
    </div>
  );
};

export default ItemManagement;