"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Package, History, Handshake, Users, ShoppingBag } from 'lucide-react'; // Import ShoppingBag icon

interface InventorySummary {
  totalItems: number;
  pendingReturnRequests: number;
  pendingBorrowRequests: number;
  pendingConsumableRequests: number; // New field for consumable requests
  recentPendingBorrowRequests: RecentRequest[];
  recentPendingReturnRequests: RecentRequest[];
  recentPendingConsumableRequests: RecentRequest[]; // New field for recent consumable requests
}

interface RecentRequest {
  id: string;
  item_id: string;
  user_id: string;
  quantity: number;
  request_date: string;
  items: { name: string };
  profiles: { first_name: string; last_name: string; instansi: string };
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

  // Fetch total number of pending consumable requests
  const { count: pendingConsumableRequestsCount, error: consumableRequestsError } = await supabase
    .from('consumable_requests') // Fetch from new table
    .select('*', { count: 'exact', head: true })
    .eq('status', 'Pending');

  if (consumableRequestsError) {
    throw new Error(`Error fetching pending consumable requests: ${consumableRequestsError.message}`);
  }

  // Fetch recent pending borrow requests
  const { data: recentPendingBorrowRequestsData, error: recentBorrowError } = await supabase
    .from('borrow_requests')
    .select(`
      id,
      item_id,
      user_id,
      quantity,
      request_date,
      items ( name ),
      profiles ( first_name, last_name, instansi )
    `)
    .eq('status', 'Pending')
    .order('request_date', { ascending: false })
    .limit(5);

  if (recentBorrowError) {
    throw new Error(`Error fetching recent pending borrow requests: ${recentBorrowError.message}`);
  }

  // Fetch recent pending return requests
  const { data: recentPendingReturnRequestsData, error: recentReturnError } = await supabase
    .from('return_requests')
    .select(`
      id,
      item_id,
      user_id,
      quantity,
      request_date,
      items ( name ),
      profiles ( first_name, last_name, instansi )
    `)
    .eq('status', 'Pending')
    .order('request_date', { ascending: false })
    .limit(5);

  if (recentReturnError) {
    throw new Error(`Error fetching recent pending return requests: ${recentReturnError.message}`);
  }

  // Fetch recent pending consumable requests
  const { data: recentPendingConsumableRequestsData, error: recentConsumableError } = await supabase
    .from('consumable_requests') // Fetch from new table
    .select(`
      id,
      item_id,
      user_id,
      quantity,
      request_date,
      items ( name ),
      profiles ( first_name, last_name, instansi )
    `)
    .eq('status', 'Pending')
    .order('request_date', { ascending: false })
    .limit(5);

  if (recentConsumableError) {
    throw new Error(`Error fetching recent pending consumable requests: ${recentConsumableError.message}`);
  }

  return {
    totalItems: totalItemsCount || 0,
    pendingReturnRequests: pendingReturnRequestsCount || 0,
    pendingBorrowRequests: pendingBorrowRequestsCount || 0,
    pendingConsumableRequests: pendingConsumableRequestsCount || 0, // Include new count
    recentPendingBorrowRequests: recentPendingBorrowRequestsData || [],
    recentPendingReturnRequests: recentPendingReturnRequestsData || [],
    recentPendingConsumableRequests: recentPendingConsumableRequestsData || [], // Include new recent requests
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
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full"> {/* Adjusted grid for 4 cards */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Barang</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.totalItems}</div>
                <p className="text-xs text-muted-foreground">
                  Jumlah total item unik dalam inventaris.
                </p>
                <Link to="/admin/items">
                  <Button variant="link" className="p-0 h-auto text-xs mt-2">Lihat Manajemen Barang</Button>
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Permintaan Pengembalian Menunggu</CardTitle>
                <History className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.pendingReturnRequests}</div>
                <p className="text-xs text-muted-foreground">
                  Jumlah permintaan pengembalian yang menunggu persetujuan.
                </p>
                <Link to="/admin/return-requests">
                  <Button variant="link" className="p-0 h-auto text-xs mt-2">Lihat Semua Permintaan</Button>
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Permintaan Peminjaman Menunggu</CardTitle>
                <Handshake className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.pendingBorrowRequests}</div>
                <p className="text-xs text-muted-foreground">
                  Jumlah permintaan peminjaman yang menunggu persetujuan.
                </p>
                <Link to="/admin/borrow-requests">
                  <Button variant="link" className="p-0 h-auto text-xs mt-2">Lihat Semua Permintaan</Button>
                </Link>
              </CardContent>
            </Card>
            <Card> {/* New card for consumable requests */}
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Permintaan Barang Habis Pakai Menunggu</CardTitle>
                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary?.pendingConsumableRequests}</div>
                <p className="text-xs text-muted-foreground">
                  Jumlah permintaan barang habis pakai yang menunggu persetujuan.
                </p>
                <Link to="/admin/consumable-requests">
                  <Button variant="link" className="p-0 h-auto text-xs mt-2">Lihat Semua Permintaan</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full mt-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Permintaan Peminjaman Terbaru (Menunggu)</CardTitle>
              </CardHeader>
              <CardContent>
                {summary?.recentPendingBorrowRequests && summary.recentPendingBorrowRequests.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Barang</TableHead>
                        <TableHead>Peminjam</TableHead>
                        <TableHead>Kuantitas</TableHead>
                        <TableHead>Tanggal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.recentPendingBorrowRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.items?.name || 'N/A'}</TableCell>
                          <TableCell>{`${request.profiles?.first_name || ''} ${request.profiles?.last_name || ''}`.trim() || 'N/A'}</TableCell>
                          <TableCell>{request.quantity}</TableCell>
                          <TableCell>{format(new Date(request.request_date), 'dd MMM yyyy', { locale: id })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-gray-500">Tidak ada permintaan peminjaman yang menunggu.</p>
                )}
                <div className="text-right mt-4">
                  <Link to="/admin/borrow-requests">
                    <Button variant="outline" size="sm">Lihat Semua</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Permintaan Pengembalian Terbaru (Menunggu)</CardTitle>
              </CardHeader>
              <CardContent>
                {summary?.recentPendingReturnRequests && summary.recentPendingReturnRequests.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Barang</TableHead>
                        <TableHead>Pengaju</TableHead>
                        <TableHead>Kuantitas</TableHead>
                        <TableHead>Tanggal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.recentPendingReturnRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.items?.name || 'N/A'}</TableCell>
                          <TableCell>{`${request.profiles?.first_name || ''} ${request.profiles?.last_name || ''}`.trim() || 'N/A'}</TableCell>
                          <TableCell>{request.quantity}</TableCell>
                          <TableCell>{format(new Date(request.request_date), 'dd MMM yyyy', { locale: id })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-gray-500">Tidak ada permintaan pengembalian yang menunggu.</p>
                )}
                <div className="text-right mt-4">
                  <Link to="/admin/return-requests">
                    <Button variant="outline" size="sm">Lihat Semua</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2"> {/* New card for recent consumable requests, spanning two columns on large screens */}
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Permintaan Barang Habis Pakai Terbaru (Menunggu)</CardTitle>
              </CardHeader>
              <CardContent>
                {summary?.recentPendingConsumableRequests && summary.recentPendingConsumableRequests.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Barang</TableHead>
                        <TableHead>Pengaju</TableHead>
                        <TableHead>Instansi</TableHead>
                        <TableHead>Kuantitas</TableHead>
                        <TableHead>Tanggal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.recentPendingConsumableRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell className="font-medium">{request.items?.name || 'N/A'}</TableCell>
                          <TableCell>{`${request.profiles?.first_name || ''} ${request.profiles?.last_name || ''}`.trim() || 'N/A'}</TableCell>
                          <TableCell>{request.profiles?.instansi || 'N/A'}</TableCell>
                          <TableCell>{request.quantity}</TableCell>
                          <TableCell>{format(new Date(request.request_date), 'dd MMM yyyy', { locale: id })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-gray-500">Tidak ada permintaan barang habis pakai yang menunggu.</p>
                )}
                <div className="text-right mt-4">
                  <Link to="/admin/consumable-requests">
                    <Button variant="outline" size="sm">Lihat Semua</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;