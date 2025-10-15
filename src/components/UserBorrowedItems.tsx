"use client";

import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { showError } from '@/utils/toast';
import { useSession } from './SessionContextProvider';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RequestReturnForm from './RequestReturnForm';

interface BorrowedItem {
  id: string; // borrow_request ID
  item_id: string;
  items: { name: string; type: 'consumable' | 'returnable' }; // Nested item name and type
  quantity: number;
  request_date: string;
  approval_date: string | null;
  due_date: string | null;
  admin_notes: string | null;
}

const fetchUserBorrowedItems = async (userId: string): Promise<BorrowedItem[]> => {
  const { data, error } = await supabase
    .from('borrow_requests')
    .select(`
      id,
      item_id,
      quantity,
      request_date,
      approval_date,
      due_date,
      admin_notes,
      items ( name, type )
    `)
    .eq('user_id', userId)
    .eq('status', 'Approved')
    .order('approval_date', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

const UserBorrowedItems: React.FC = () => {
  const { user, isLoading: isSessionLoading } = useSession();
  const [isReturnFormOpen, setIsReturnFormOpen] = useState(false);
  const [selectedItemForReturn, setSelectedItemForReturn] = useState<{ id: string; name: string; quantity: number } | null>(null);

  const { data: borrowedItems, isLoading, error, refetch } = useQuery<BorrowedItem[], Error>({
    queryKey: ['userBorrowedItems', user?.id],
    queryFn: () => fetchUserBorrowedItems(user!.id),
    enabled: !!user && !isSessionLoading,
  });

  const handleInitiateReturn = (item: BorrowedItem) => {
    setSelectedItemForReturn({
      id: item.item_id,
      name: item.items.name,
      quantity: item.quantity, // Pre-fill with the borrowed quantity
    });
    setIsReturnFormOpen(true);
  };

  const handleReturnSuccess = () => {
    setIsReturnFormOpen(false);
    setSelectedItemForReturn(null);
    refetch(); // Re-fetch borrowed items after a successful return request
  };

  if (isSessionLoading || isLoading) {
    return <div className="text-center">Memuat barang yang dipinjam...</div>;
  }

  if (error) {
    showError(`Gagal memuat barang yang dipinjam: ${error.message}`);
    return <div className="text-center text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-2xl font-semibold mb-4">Barang yang Sedang Anda Pinjam</h3>
      {borrowedItems && borrowedItems.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Barang</TableHead>
              <TableHead>Kuantitas</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Tanggal Disetujui</TableHead>
              <TableHead>Tanggal Jatuh Tempo</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {borrowedItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.items?.name || 'N/A'}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{item.items?.type === 'consumable' ? 'Habis Pakai' : 'Harus Dikembalikan'}</TableCell>
                <TableCell>
                  {item.approval_date ? format(new Date(item.approval_date), 'dd MMMM yyyy HH:mm', { locale: id }) : '-'}
                </TableCell>
                <TableCell>
                  {item.due_date ? format(new Date(item.due_date), 'dd MMMM yyyy', { locale: id }) : '-'}
                </TableCell>
                <TableCell className="text-right">
                  {item.items?.type === 'returnable' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleInitiateReturn(item)}
                    >
                      Ajukan Pengembalian
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-center text-gray-500">Anda tidak sedang meminjam barang apapun.</p>
      )}

      {selectedItemForReturn && (
        <Dialog open={isReturnFormOpen} onOpenChange={setIsReturnFormOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Ajukan Pengembalian untuk {selectedItemForReturn.name}</DialogTitle>
            </DialogHeader>
            <RequestReturnForm
              initialItemId={selectedItemForReturn.id}
              initialQuantity={selectedItemForReturn.quantity}
              onReturnSuccess={handleReturnSuccess}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default UserBorrowedItems;