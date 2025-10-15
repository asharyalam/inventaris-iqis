"use client";

import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { showError } from '@/utils/toast';
import { useSession } from './SessionContextProvider';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface BorrowRequest {
  id: string;
  item_id: string;
  items: { name: string }; // Nested item name
  quantity: number;
  request_date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  admin_notes: string | null;
  approval_date: string | null;
  due_date: string | null;
}

const fetchUserBorrowRequests = async (userId: string): Promise<BorrowRequest[]> => {
  const { data, error } = await supabase
    .from('borrow_requests')
    .select(`
      id,
      item_id,
      quantity,
      request_date,
      status,
      admin_notes,
      approval_date,
      due_date,
      items ( name )
    `)
    .eq('user_id', userId)
    .order('request_date', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

const UserBorrowRequests: React.FC = () => {
  const { user, isLoading: isSessionLoading } = useSession();

  const { data: requests, isLoading, error } = useQuery<BorrowRequest[], Error>({
    queryKey: ['userBorrowRequests', user?.id],
    queryFn: () => fetchUserBorrowRequests(user!.id),
    enabled: !!user && !isSessionLoading,
  });

  if (isSessionLoading || isLoading) {
    return <div className="text-center">Memuat permintaan peminjaman Anda...</div>;
  }

  if (error) {
    showError(`Gagal memuat permintaan peminjaman: ${error.message}`);
    return <div className="text-center text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-2xl font-semibold mb-4">Riwayat Permintaan Peminjaman Anda</h3>
      {requests && requests.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Barang</TableHead>
              <TableHead>Kuantitas</TableHead>
              <TableHead>Tanggal Permintaan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Tanggal Jatuh Tempo</TableHead>
              <TableHead>Catatan Admin</TableHead>
              <TableHead>Tanggal Persetujuan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">{request.items?.name || 'N/A'}</TableCell>
                <TableCell>{request.quantity}</TableCell>
                <TableCell>{format(new Date(request.request_date), 'dd MMMM yyyy HH:mm', { locale: id })}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      request.status === 'Approved'
                        ? 'default'
                        : request.status === 'Rejected'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {request.status === 'Pending' && 'Menunggu'}
                    {request.status === 'Approved' && 'Disetujui'}
                    {request.status === 'Rejected' && 'Ditolak'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {request.due_date ? format(new Date(request.due_date), 'dd MMMM yyyy', { locale: id }) : '-'}
                </TableCell>
                <TableCell>{request.admin_notes || '-'}</TableCell>
                <TableCell>
                  {request.approval_date ? format(new Date(request.approval_date), 'dd MMMM yyyy HH:mm', { locale: id }) : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-center text-gray-500">Anda belum mengajukan permintaan peminjaman.</p>
      )}
    </div>
  );
};

export default UserBorrowRequests;