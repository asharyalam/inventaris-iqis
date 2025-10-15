"use client";

import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSession } from './SessionContextProvider';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface BorrowRequest {
  id: string;
  item_id: string;
  user_id: string;
  quantity: number;
  request_date: string;
  due_date: string;
  borrow_start_date: string;
  status: string;
  admin_notes: string | null;
  returned_date: string | null; // New field
  items: { name: string };
}

const fetchBorrowRequests = async (userId: string): Promise<BorrowRequest[]> => {
  const { data, error } = await supabase
    .from('borrow_requests')
    .select(`
      id,
      item_id,
      user_id,
      quantity,
      request_date,
      due_date,
      borrow_start_date,
      status,
      admin_notes,
      returned_date,
      items ( name )
    `)
    .eq('user_id', userId)
    .order('request_date', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

const BorrowRequestList: React.FC = () => {
  const { user } = useSession();

  const { data: requests, isLoading, error } = useQuery<BorrowRequest[], Error>({
    queryKey: ['borrowRequests', user?.id],
    queryFn: () => fetchBorrowRequests(user!.id),
    enabled: !!user?.id,
  });

  if (!user) {
    return <div className="text-center text-red-500">Anda harus masuk untuk melihat permintaan Anda.</div>;
  }

  if (isLoading) {
    return <div className="text-center">Memuat permintaan peminjaman barang...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error.message}</div>;
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'Pending': // Keep for backward compatibility if old data exists
      case 'Menunggu Persetujuan':
        return { text: 'Menunggu Persetujuan', classes: 'bg-yellow-100 text-yellow-800' };
      case 'Disetujui':
        return { text: 'Disetujui', classes: 'bg-blue-100 text-blue-800' };
      case 'Diproses':
        return { text: 'Diproses', classes: 'bg-green-100 text-green-800' };
      case 'Dikembalikan': // New status
        return { text: 'Dikembalikan', classes: 'bg-purple-100 text-purple-800' };
      case 'Ditolak':
        return { text: 'Ditolak', classes: 'bg-red-100 text-red-800' };
      default:
        return { text: status, classes: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h3 className="text-2xl font-semibold mb-4">Permintaan Peminjaman Barang Anda</h3>
      {requests && requests.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Barang</TableHead>
              <TableHead>Kuantitas</TableHead>
              <TableHead>Tgl Permintaan</TableHead>
              <TableHead>Tgl Peminjaman</TableHead>
              <TableHead>Tgl Pengembalian</TableHead>
              <TableHead>Tgl Dikembalikan</TableHead> {/* New TableHead */}
              <TableHead>Status</TableHead>
              <TableHead>Catatan Admin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => {
              const statusDisplay = getStatusDisplay(request.status);
              return (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.items?.name || 'N/A'}</TableCell>
                  <TableCell>{request.quantity}</TableCell>
                  <TableCell>{format(new Date(request.request_date), 'dd MMM yyyy HH:mm', { locale: id })}</TableCell>
                  <TableCell>{format(new Date(request.borrow_start_date), 'dd MMM yyyy', { locale: id })}</TableCell>
                  <TableCell>{format(new Date(request.due_date), 'dd MMM yyyy', { locale: id })}</TableCell>
                  <TableCell>
                    {request.returned_date ? format(new Date(request.returned_date), 'dd MMM yyyy', { locale: id }) : '-'}
                  </TableCell> {/* New TableCell */}
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusDisplay.classes}`}>
                      {statusDisplay.text}
                    </span>
                  </TableCell>
                  <TableCell>{request.admin_notes || '-'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <p className="text-center text-gray-500">Anda belum mengajukan permintaan peminjaman barang.</p>
      )}
    </div>
  );
};

export default BorrowRequestList;