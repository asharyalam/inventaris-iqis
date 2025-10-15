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
              <TableHead>Catatan Admin</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">{request.items?.name || 'N/A'}</TableCell>
                <TableCell>{request.quantity}</TableCell>
                <TableCell>{format(new Date(request.request_date), 'dd MMM yyyy HH:mm', { locale: id })}</TableCell>
                <TableCell>{request.status}</TableCell>
                <TableCell>{request.admin_notes || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-center text-gray-500">Anda belum mengajukan permintaan barang habis pakai.</p>
      )}
    </div>
  );
};

export default ConsumableRequestList;