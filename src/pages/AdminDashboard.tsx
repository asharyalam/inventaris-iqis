"use client";

import React from 'react';

const AdminDashboard: React.FC = () => {
  return (
    <div className="text-center bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-4xl font-bold mb-4">Dashboard Admin</h2>
      <p className="text-xl text-blue-600 mb-6">
        Ini adalah halaman dashboard khusus Admin. Anda memiliki akses penuh.
      </p>
      {/* Konten spesifik admin bisa ditambahkan di sini */}
    </div>
  );
};

export default AdminDashboard;