"use client";

import React from 'react';
import ItemList from '@/components/ItemList';
import AddItemForm from '@/components/AddItemForm';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface InventorySummary {
  totalItems: number;
  pendingReturnRequests: number;
  pendingBorrowRequests: number; // Add pending borrow requests count
}

const fetchInventorySummary = async (): Promise<InventorySummary> => {
  // Fetch total number of items
  const { count: totalItemsCount, error: itemsError } = await supabase
    .from('items')
    .select('*', { count: 'exact', head: true });

  if (itemsError) {
    throw new Error(`Error fetching total items: ${itemsError.message}`);
  }

  // Fetch total number of pending return requests
  const { count: pendingReturnRequestsCount, error: returnRequestsError } = await supabase
    .from('return_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Pending');

  if (returnRequestsError) {
    throw new Error(`Error fetching pending return requests: ${returnRequestsError.message}`);
  }

  // Fetch total number of pending borrow requests
  const { count: pendingBorrowRequestsCount, error: borrowRequestsError } = await supabase
    .from('borrow_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Pending');

  if (borrowRequestsError) {
    throw new Error(`Error fetching pending borrow requests: ${borrowRequestsError.message}`);
  }

  return {
    totalItems: totalItemsCount || 0,
    pendingReturnRequests: pendingReturnRequestsCount || 0,
    pendingBorrowRequests: pendingBorrowRequestsCount || 0,
  };
};

const AdminDashboard: React.FC = () => {
  const { data: summary, isLoading: isSummaryLoading, error: summaryError } = useQuery<InventorySummary, Error>({
    queryKey: ['inventorySummary'],
    queryFn: fetchInventorySummary,
  });

  return (
    <div className="flex flex-col items-center justify-start w-full max-w-6xl mx-auto p-4 space-y-8">
      <div className="text-center bg-white p-8 rounded-lg shadow-md w-full">
        <h2 className="text-4xl font-bold mb-4 text-blue-600">Dashboard Admin</h2>
        <p className="text-xl text-blue-600 mb-6">
          Ini adalah halaman dashboard khusus Admin. Anda memiliki akses penuh untuk mengelola inventaris.
        </p>
      </div>

      {isSummaryLoading ? (
        <div className="text-center">Memuat ringkasan inventaris...</div>
      ) : summaryError ? (
        <div className="text-center text-red-500">Error: {summaryError.message}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full"> {/* Changed to 3 columns for summary cards */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Barang</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.totalItems}</div>
              <p className="text-xs text-muted-foreground">
                Jumlah total item unik dalam inventaris.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Permintaan Pengembalian Menunggu</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.pendingReturnRequests}</div>
              <p className="text-xs text-muted-foreground">
                Jumlah permintaan pengembalian yang menunggu persetujuan.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Permintaan Peminjaman Menunggu</CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <path d="M14 2v6h6"></path>
                <path d="M12 17h.01"></path>
                <path d="M7 10h10"></path>
                <path d="M7 14h10"></path>
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.pendingBorrowRequests}</div>
              <p className="text-xs text-muted-foreground">
                Jumlah permintaan peminjaman yang menunggu persetujuan.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <AddItemForm />
      <ItemList />
    </div>
  );
};

export default AdminDashboard;