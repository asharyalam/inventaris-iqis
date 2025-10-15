"use client";

import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-4xl font-bold mb-4 text-red-600">Akses Ditolak</h1>
        <p className="text-xl text-gray-700 mb-6">
          Anda tidak memiliki izin untuk mengakses halaman ini.
        </p>
        <Link to="/" className="text-blue-500 hover:text-blue-700 underline">
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;