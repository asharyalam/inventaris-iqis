"use client";

import React from 'react';
import ItemList from '@/components/ItemList';
import RequestReturnForm from '@/components/RequestReturnForm';
import UserReturnRequests from '@/components/UserReturnRequests';
import RequestBorrowForm from '@/components/RequestBorrowForm'; // Import RequestBorrowForm
import UserBorrowRequests from '@/components/UserBorrowRequests'; // Import UserBorrowRequests

const Dashboard: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-start w-full max-w-6xl mx-auto p-4 space-y-8">
      <div className="text-center bg-white p-8 rounded-lg shadow-md w-full">
        <h2 className="text-4xl font-bold mb-4 text-gray-900">Dashboard Pengguna</h2>
        <p className="text-xl text-gray-600 mb-6">
          Ini adalah halaman dashboard Anda. Anda dapat melihat daftar barang yang tersedia, mengajukan peminjaman, dan pengembalian.
        </p>
      </div>
      <RequestBorrowForm /> {/* Tambahkan formulir peminjaman */}
      <UserBorrowRequests /> {/* Tambahkan daftar permintaan peminjaman pengguna */}
      <RequestReturnForm />
      <UserReturnRequests />
      <ItemList />
    </div>
  );
};

export default Dashboard;