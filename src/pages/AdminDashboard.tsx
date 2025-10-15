"use client";

import React from 'react';
import ItemList from '@/components/ItemList';
import AddItemForm from '@/components/AddItemForm';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Import Card components
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface InventorySummary {
  totalItems: number;
  totalValue: number;
}

const fetchInventorySummary = async (): Promise<InventorySummary> => {
  // Fetch total number of items
  const { count: totalItemsCount, error: itemsError } = await supabase
    .from('items')
    .select('*', { count: 'exact', head: true });

  if (itemsError) {
    throw new Error(`Error fetching total items: ${itemsError.message}`);
  }

  // Fetch total value of inventory
  const { data: itemsData, error: valueError } = await supabase
    .from('items')
    .select('quantity, price');

  if (valueError) {
    throw new Error(`Error fetching item values: ${valueError.message}`);
  }

  const totalValue = itemsData.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  return {
    totalItems: totalItemsCount || 0,
    totalValue: totalValue,
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
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
              <CardTitle className="text-sm font-medium">Total Nilai Inventaris</CardTitle>
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
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary?.totalValue.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
              </div>
              <p className="text-xs text-muted-foreground">
                Total nilai semua barang dalam inventaris.
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