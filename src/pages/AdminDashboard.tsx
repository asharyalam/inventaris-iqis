"use client";

import React from 'react';
import ItemList from '@/components/ItemList'; // Import ItemList
import AddItemForm from '@/components/AddItemForm'; // Import AddItemForm

const AdminDashboard: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-start w-full max-w-6xl mx-auto p-4 space-y-8">
      <div className="text-center bg-white p-8 rounded-lg shadow-md w-full">
        <h2 className="text-4xl font-bold mb-4 text-blue-600">Dashboard Admin</h2>
        <p className="text-xl text-blue-600 mb-6">
          Ini adalah halaman dashboard khusus Admin. Anda memiliki akses penuh untuk mengelola inventaris.
        </p>
      </div>

      <AddItemForm /> {/* Form untuk menambah barang */}
      <ItemList /> {/* Daftar barang */}
    </div>
  );
};

export default AdminDashboard;