"use client";

import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSession } from './SessionContextProvider';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface ConsumableRequest {
  id: string;
  item_id: string;
  user_id: string;
  quantity: number;
  request_date: string;
  status: string;
  admin_notes: string | null;
  items: { name: string };
}

const fetchConsumableRequests = async (userId: string): Promise<ConsumableRequest[]> => {
  const { data, error } = await supabase
    .from('consumable_requests')
    .select(`
      id,
      item_id,
      user_id,
      quantity,
      request_date,
      status,
      admin_notes,
      items ( name )
    `)
    .eq('user_id', userId)
    .order('request_date', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

const ConsumableRequestList: React.FC = () => {
  const { user } = useSession();

  const { data: requests, isLoading, error } = useQuery<ConsumableRequest[], Error>({
    queryKey: ['consumableRequests', user?.id],
    queryFn: () => fetchConsumableRequests(user!.id),
    enabled: !!user?.id,
  });

  if (!user) {
    return <div className="text-center text-red-500">Anda harus masuk untuk melihat permintaan Anda.</div>;
  }

  if (isLoading) {
    return <div className="text-center">Memuat permintaan barang habis pakai...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error.message}</div>;
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'Pending':
      case 'Menunggu Persetujuan':
        return { text: 'Menunggu Persetujuan', classes: 'bg-yellow-100 text-yellow-800' };
      case 'Approved by Headmaster':
      case 'Disetujui':
        return { text: 'Disetujui', classes: 'bg-blue-100 text-blue-800' };
      case 'Approved':
      case 'Diproses':
      case 'Diserahkan': // Standardized status
        return { text: 'Diserahkan', classes: 'bg-green-100 text-green-800' };
      case 'Rejected':
      case 'Ditolak':
        return { text: 'Ditolak', classes: 'bg-red-100 text-red-800' };
      default:
        return { text: status, classes: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h3 className="text-2xl font-semibold mb-4">Permintaan Barang Habis Pakai Anda</h3>
      {requests && requests.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Barang</TableHead>
              <TableHead>Kuantitas</TableHead>
              <TableHead>Tanggal Permintaan</TableHead>
              <TableHead>Status</TableHead>
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
        <p className="text-center text-gray-500">Anda belum mengajukan permintaan barang habis pakai.</p>
      )}
    </div>
  );
};

export default ConsumableRequestList;