"use client";

import React from 'react';

const Dashboard: React.FC = () => {
  return (
    <div className="text-center bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-4xl font-bold mb-4">Dashboard Pengguna</h2>
      <p className="text-xl text-gray-600 mb-6">
        Ini adalah halaman dashboard Anda.
      </p>
      {/* Konten spesifik pengguna bisa ditambahkan di sini */}
    </div>
  );
};

export default Dashboard;