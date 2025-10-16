"use client";

import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from '@/utils/toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useSession } from '@/components/SessionContextProvider';

interface ReturnRequest {
  id: string;
  item_id: string;
  user_id: string;
  quantity: number;
  request_date: string;
  status: string;
  admin_notes: string | null;
  borrow_request_id: string; // New: Link to the specific borrow request
  items: { name: string };
  profiles: { first_name: string; last_name: string; instansi: string };
  borrow_requests: { quantity: number; remaining_quantity: number; borrow_start_date: string; due_date: string } | null; // New: Details from the associated borrow request
}

const fetchAllReturnRequests = async (): Promise<ReturnRequest[]> => {
  const { data, error } = await supabase
    .from('return_requests')
    .select(`
      id,
      item_id,
      user_id,
      quantity,
      request_date,
      status,
      admin_notes,
      borrow_request_id,
      items ( name ),
      profiles ( first_name, last_name, instansi ),
      borrow_requests ( quantity, remaining_quantity, borrow_start_date, due_date )
    `)
    .order('request_date', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

const ReturnRequestsAdminPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, userProfile } = useSession();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ReturnRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const { data: requests, isLoading, error, refetch } = useQuery<ReturnRequest[], Error>({
    queryKey: ['adminReturnRequests'],
    queryFn: fetchAllReturnRequests,
  });

  const handleAction = async (status: 'Disetujui' | 'Ditolak') => {
    if (!selectedRequest || !user) return;

    const { error: updateError } = await supabase
      .from('return_requests')
      .update({
        status: status,
        admin_notes: adminNotes,
        approved_by: user.id,
        approval_date: new Date().toISOString(),
      })
      .eq('id', selectedRequest.id);

    if (updateError) {
      showError(`Gagal memperbarui permintaan: ${updateError.message}`);
    } else {
      showSuccess(`Permintaan pengembalian berhasil ${status === 'Disetujui' ? 'disetujui' : 'ditolak'}!`);
      
      // Invalidate queries to reflect changes, item quantity update is handled by trigger
      queryClient.invalidateQueries({ queryKey: ['returnRequests', selectedRequest.user_id] });
      queryClient.invalidateQueries({ queryKey: ['borrowedItemsForReturn', selectedRequest.user_id] }); // Update user's view of what's still borrowed
      queryClient.invalidateQueries({ queryKey: ['adminBorrowRequests'] }); // Update admin's view of borrow requests (remaining_quantity)
      queryClient.invalidateQueries({ queryKey: ['allTransactions'] }); // Update monitoring page
      queryClient.invalidateQueries({ queryKey: ['adminReturnRequests'] }); // Refetch this page's data
      refetch();
      setIsDialogOpen(false);
      setSelectedRequest(null);
      setAdminNotes('');
    }
  };

  const openDialog = (request: ReturnRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.admin_notes || '');
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div className="text-center">Memuat permintaan pengembalian...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error.message}</div>;
  }

  const isAdmin = userProfile?.role === 'Admin';
  const isHeadmaster = userProfile?.role === 'Kepala Sekolah';

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'Pending':
      case 'Menunggu Persetujuan':
        return { text: 'Menunggu Persetujuan', classes: 'bg-yellow-100 text-yellow-800' };
      case 'Disetujui':
        return { text: 'Disetujui', classes: 'bg-green-100 text-green-800' };
      case 'Ditolak':
        return { text: 'Ditolak', classes: 'bg-red-100 text-red-800' };
      default:
        return { text: status, classes: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <h2 className="text-3xl font-bold mb-6 text-center">Manajemen Permintaan Pengembalian</h2>
      {requests && requests.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Barang</TableHead>
              <TableHead>Pengaju</TableHead>
              <TableHead>Instansi</TableHead>
              <TableHead>Kuantitas Dikembalikan</TableHead>
              <TableHead>Kuantitas Dipinjam Awal</TableHead>
              <TableHead>Kuantitas Tersisa</TableHead>
              <TableHead>Tanggal Permintaan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => {
              const statusDisplay = getStatusDisplay(request.status);
              return (
                <TableRow key={request.id}>
                  <TableCell className="font-medium">{request.items?.name || 'N/A'}</TableCell>
                  <TableCell>{`${request.profiles?.first_name || ''} ${request.profiles?.last_name || ''}`.trim() || 'N/A'}</TableCell>
                  <TableCell>{request.profiles?.instansi || '-'}</TableCell>
                  <TableCell>{request.quantity}</TableCell>
                  <TableCell>{request.borrow_requests?.quantity || '-'}</TableCell>
                  <TableCell>{request.borrow_requests?.remaining_quantity || '-'}</TableCell>
                  <TableCell>{format(new Date(request.request_date), 'dd MMM yyyy HH:mm', { locale: id })}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusDisplay.classes}`}>
                      {statusDisplay.text}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {isAdmin && request.status === 'Menunggu Persetujuan' && (
                      <Button variant="outline" size="sm" onClick={() => openDialog(request)}>
                        Tinjau
                      </Button>
                    )}
                    {((isAdmin || isHeadmaster) && request.status !== 'Menunggu Persetujuan') && (
                      <Button variant="outline" size="sm" onClick={() => openDialog(request)}>
                        Lihat Detail
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <p className="text-center text-gray-500">Tidak ada permintaan pengembalian.</p>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tinjau Permintaan Pengembalian</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="item" className="text-right">Barang</Label>
                <Input id="item" value={selectedRequest.items?.name || 'N/A'} className="col-span-3" readOnly />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="user" className="text-right">Pengaju</Label>
                <Input id="user" value={`${selectedRequest.profiles?.first_name || ''} ${selectedRequest.profiles?.last_name || ''}`.trim() || 'N/A'} className="col-span-3" readOnly />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">Kuantitas Dikembalikan</Label>
                <Input id="quantity" value={selectedRequest.quantity} className="col-span-3" readOnly />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="borrowedQuantity" className="text-right">Kuantitas Dipinjam Awal</Label>
                <Input id="borrowedQuantity" value={selectedRequest.borrow_requests?.quantity || '-'} className="col-span-3" readOnly />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="remainingQuantity" className="text-right">Kuantitas Tersisa</Label>
                <Input id="remainingQuantity" value={selectedRequest.borrow_requests?.remaining_quantity || '-'} className="col-span-3" readOnly />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">Catatan Admin</Label>
                <Textarea
                  id="notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="col-span-3"
                  placeholder="Tambahkan catatan admin..."
                  readOnly={selectedRequest.status !== 'Menunggu Persetujuan'}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            {isAdmin && selectedRequest?.status === 'Menunggu Persetujuan' && (
              <>
                <Button variant="destructive" onClick={() => handleAction('Ditolak')}>Tolak</Button>
                <Button onClick={() => handleAction('Disetujui')}>Setujui</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReturnRequestsAdminPage;