"use client";

import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Request {
  id: string;
  item_id: string;
  user_id: string;
  quantity: number;
  request_date: string;
  status: string;
  type: 'Peminjaman' | 'Pengembalian' | 'Habis Pakai';
  items: { name: string };
  profiles: { first_name: string; last_name: string; instansi: string };
  due_date?: string; // Only for borrow requests
  borrow_start_date?: string; // Add borrow_start_date for borrow requests
  returned_date?: string; // New field for borrow requests
}

interface Item {
  id: string;
  name: string;
  quantity: number;
  type: 'consumable' | 'returnable';
}

const fetchAllTransactions = async (): Promise<Request[]> => {
  const { data: borrowData, error: borrowError } = await supabase
    .from('borrow_requests')
    .select(`
      id,
      item_id,
      user_id,
      quantity,
      request_date,
      status,
      due_date,
      borrow_start_date,
      returned_date,
      items ( name ),
      profiles ( first_name, last_name, instansi )
    `);

  if (borrowError) throw new Error(borrowError.message);

  const { data: returnData, error: returnError } = await supabase
    .from('return_requests')
    .select(`
      id,
      item_id,
      user_id,
      quantity,
      request_date,
      status,
      items ( name ),
      profiles ( first_name, last_name, instansi )
    `);

  if (returnError) throw new Error(returnError.message);

  const { data: consumableData, error: consumableError } = await supabase
    .from('consumable_requests')
    .select(`
      id,
      item_id,
      user_id,
      quantity,
      request_date,
      status,
      items ( name ),
      profiles ( first_name, last_name, instansi )
    `);

  if (consumableError) throw new Error(consumableError.message);

  const allRequests: Request[] = [
    ...(borrowData || []).map(req => ({ ...req, type: 'Peminjaman' as const })),
    ...(returnData || []).map(req => ({ ...req, type: 'Pengembalian' as const })),
    ...(consumableData || []).map(req => ({ ...req, type: 'Habis Pakai' as const })),
  ];

  // Sort by request_date descending
  return allRequests.sort((a, b) => new Date(b.request_date).getTime() - new Date(a.request_date).getTime());
};

const fetchAllItems = async (): Promise<Item[]> => {
  const { data, error } = await supabase
    .from('items')
    .select('id, name, quantity, type')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

const MonitoringReportingPage: React.FC = () => {
  const { data: transactions, isLoading: isLoadingTransactions, error: transactionsError } = useQuery<Request[], Error>({
    queryKey: ['allTransactions'],
    queryFn: fetchAllTransactions,
  });

  const { data: items, isLoading: isLoadingItems, error: itemsError } = useQuery<Item[], Error>({
    queryKey: ['allItems'],
    queryFn: fetchAllItems,
  });

  if (isLoadingTransactions || isLoadingItems) {
    return <div className="text-center">Memuat laporan...</div>;
  }

  if (transactionsError) {
    return <div className="text-center text-red-500">Error memuat transaksi: {transactionsError.message}</div>;
  }

  if (itemsError) {
    return <div className="text-center text-red-500">Error memuat stok barang: {itemsError.message}</div>;
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'Pending':
      case 'Menunggu Persetujuan':
        return { text: 'Menunggu Persetujuan', classes: 'bg-yellow-100 text-yellow-800' };
      case 'Disetujui':
        return { text: 'Disetujui', classes: 'bg-blue-100 text-blue-800' };
      case 'Approved': // Old status, will be replaced by 'Diserahkan'
      case 'Diproses': // Old status, will be replaced by 'Diserahkan'
      case 'Diserahkan':
        return { text: 'Diserahkan', classes: 'bg-green-100 text-green-800' };
      case 'Dikembalikan':
        return { text: 'Dikembalikan', classes: 'bg-purple-100 text-purple-800' };
      case 'Rejected':
      case 'Ditolak':
        return { text: 'Ditolak', classes: 'bg-red-100 text-red-800' };
      default:
        return { text: status, classes: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-8">
      <h2 className="text-3xl font-bold mb-6 text-center">Pemantauan & Pelaporan</h2>

      <Card>
        <CardHeader>
          <CardTitle>Laporan Stok Barang</CardTitle>
        </CardHeader>
        <CardContent>
          {items && items.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Barang</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Kuantitas Tersedia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.type === 'consumable' ? 'Habis Pakai' : 'Harus Dikembalikan'}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-gray-500">Tidak ada barang dalam inventaris.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Semua Aktivitas Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions && transactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipe Permintaan</TableHead>
                  <TableHead>Barang</TableHead>
                  <TableHead>Pengaju</TableHead>
                  <TableHead>Instansi</TableHead>
                  <TableHead>Kuantitas</TableHead>
                  <TableHead>Tgl Peminjaman</TableHead>
                  <TableHead>Tgl Jatuh Tempo</TableHead>
                  <TableHead>Tgl Dikembalikan</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => {
                  const statusDisplay = getStatusDisplay(transaction.status);
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.type}</TableCell>
                      <TableCell>{transaction.items?.name || 'N/A'}</TableCell>
                      <TableCell>{`${transaction.profiles?.first_name || ''} ${transaction.profiles?.last_name || ''}`.trim() || 'N/A'}</TableCell>
                      <TableCell>{transaction.profiles?.instansi || '-'}</TableCell>
                      <TableCell>{transaction.quantity}</TableCell>
                      <TableCell>
                        {transaction.type === 'Peminjaman' && transaction.borrow_start_date
                          ? format(new Date(transaction.borrow_start_date), 'dd MMM yyyy', { locale: id })
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {transaction.type === 'Peminjaman' && transaction.due_date
                          ? format(new Date(transaction.due_date), 'dd MMM yyyy', { locale: id })
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {transaction.type === 'Peminjaman' && transaction.returned_date
                          ? format(new Date(transaction.returned_date), 'dd MMM yyyy', { locale: id })
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusDisplay.classes}`}>
                          {statusDisplay.text}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-gray-500">Tidak ada aktivitas transaksi yang ditemukan.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MonitoringReportingPage;