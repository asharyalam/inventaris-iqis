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
  approved_by: string | null;
  approval_date: string | null;
  returned_date: string | null; // New field
  returned_by: string | null;   // New field
  items: { name: string };
  profiles: { first_name: string; last_name: string; instansi: string };
}

const fetchAllBorrowRequests = async (): Promise<BorrowRequest[]> => {
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
      approved_by,
      approval_date,
      returned_date,
      returned_by,
      items ( name ),
      profiles ( first_name, last_name, instansi )
    `)
    .order('request_date', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

const BorrowRequestsAdminPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, userProfile } = useSession();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BorrowRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const { data: requests, isLoading, error, refetch } = useQuery<BorrowRequest[], Error>({
    queryKey: ['adminBorrowRequests'],
    queryFn: fetchAllBorrowRequests,
  });

  const handleAction = async (actionType: 'approve' | 'reject' | 'handover' | 'return') => {
    if (!selectedRequest || !user) return;

    let newStatus: string;
    let successMessage: string;
    let shouldDecrementQuantity = false;
    let shouldIncrementQuantity = false;
    let updatePayload: any = {
      admin_notes: adminNotes,
      approved_by: user.id,
      approval_date: new Date().toISOString(),
    };

    if (actionType === 'approve') {
      newStatus = 'Disetujui';
      successMessage = "Permintaan peminjaman berhasil disetujui!";
    } else if (actionType === 'reject') {
      newStatus = 'Ditolak';
      successMessage = "Permintaan peminjaman berhasil ditolak!";
    } else if (actionType === 'handover') {
      newStatus = 'Diproses';
      successMessage = "Barang berhasil diserahkan kepada peminjam!";
      shouldDecrementQuantity = true;
    } else if (actionType === 'return') {
      newStatus = 'Dikembalikan';
      successMessage = "Barang berhasil dikembalikan!";
      shouldIncrementQuantity = true;
      updatePayload = {
        ...updatePayload,
        returned_date: new Date().toISOString(),
        returned_by: user.id,
      };
    } else {
      return;
    }

    updatePayload.status = newStatus;

    const { error: updateError } = await supabase
      .from('borrow_requests')
      .update(updatePayload)
      .eq('id', selectedRequest.id);

    if (updateError) {
      showError(`Gagal memperbarui permintaan: ${updateError.message}`);
    } else {
      showSuccess(successMessage);

      if (shouldDecrementQuantity || shouldIncrementQuantity) {
        const { data: itemData, error: itemError } = await supabase
          .from('items')
          .select('quantity')
          .eq('id', selectedRequest.item_id)
          .single();

        if (itemError) {
          showError(`Gagal mengambil kuantitas barang: ${itemError.message}`);
        } else {
          const newQuantity = shouldDecrementQuantity
            ? itemData.quantity - selectedRequest.quantity
            : itemData.quantity + selectedRequest.quantity;

          const { error: updateItemError } = await supabase
            .from('items')
            .update({ quantity: newQuantity })
            .eq('id', selectedRequest.item_id);

          if (updateItemError) {
            showError(`Gagal memperbarui kuantitas barang: ${updateItemError.message}`);
          } else {
            showSuccess("Kuantitas barang berhasil diperbarui.");
            queryClient.invalidateQueries({ queryKey: ['items'] });
            queryClient.invalidateQueries({ queryKey: ['inventorySummary'] });
            queryClient.invalidateQueries({ queryKey: ['availableItemsForBorrow'] });
          }
        }
      }
      queryClient.invalidateQueries({ queryKey: ['borrowRequests', selectedRequest.user_id] });
      refetch();
      setIsDialogOpen(false);
      setSelectedRequest(null);
      setAdminNotes('');
    }
  };

  const openDialog = (request: BorrowRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.admin_notes || '');
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div className="text-center">Memuat permintaan peminjaman...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error.message}</div>;
  }

  const isHeadmaster = userProfile?.role === 'Kepala Sekolah';
  const isAdmin = userProfile?.role === 'Admin';

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'Pending':
        return { text: 'Pending', classes: 'bg-yellow-100 text-yellow-800' };
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
    <div className="w-full max-w-6xl mx-auto p-4">
      <h2 className="text-3xl font-bold mb-6 text-center">Manajemen Permintaan Peminjaman</h2>
      {requests && requests.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Barang</TableHead>
              <TableHead>Peminjam</TableHead>
              <TableHead>Instansi</TableHead>
              <TableHead>Kuantitas</TableHead>
              <TableHead>Tgl Peminjaman</TableHead>
              <TableHead>Tgl Jatuh Tempo</TableHead>
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
                  <TableCell>{format(new Date(request.borrow_start_date), 'dd MMM yyyy', { locale: id })}</TableCell>
                  <TableCell>{format(new Date(request.due_date), 'dd MMM yyyy', { locale: id })}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statusDisplay.classes}`}>
                      {statusDisplay.text}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {isHeadmaster && request.status === 'Pending' && (
                      <Button variant="outline" size="sm" onClick={() => openDialog(request)}>
                        Tinjau
                      </Button>
                    )}
                    {isAdmin && request.status === 'Disetujui' && (
                      <Button variant="outline" size="sm" onClick={() => handleAction('handover')}>
                        Proses
                      </Button>
                    )}
                    {isAdmin && request.status === 'Diproses' && ( // New button for Admin to process return
                      <Button variant="outline" size="sm" onClick={() => handleAction('return')}>
                        Proses Pengembalian
                      </Button>
                    )}
                    {(isHeadmaster && request.status !== 'Pending') || (isAdmin && request.status !== 'Disetujui' && request.status !== 'Diproses') ? (
                      <Button variant="outline" size="sm" onClick={() => openDialog(request)}>
                        Lihat Detail
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <p className="text-center text-gray-500">Tidak ada permintaan peminjaman.</p>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tinjau Permintaan Peminjaman</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="item" className="text-right">Barang</Label>
                <Input id="item" value={selectedRequest.items?.name || 'N/A'} className="col-span-3" readOnly />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="user" className="text-right">Peminjam</Label>
                <Input id="user" value={`${selectedRequest.profiles?.first_name || ''} ${selectedRequest.profiles?.last_name || ''}`.trim() || 'N/A'} className="col-span-3" readOnly />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">Kuantitas</Label>
                <Input id="quantity" value={selectedRequest.quantity} className="col-span-3" readOnly />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="borrowStartDate" className="text-right">Tanggal Peminjaman</Label>
                <Input id="borrowStartDate" value={format(new Date(selectedRequest.borrow_start_date), 'dd MMM yyyy', { locale: id })} className="col-span-3" readOnly />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dueDate" className="text-right">Tanggal Jatuh Tempo</Label>
                <Input id="dueDate" value={format(new Date(selectedRequest.due_date), 'dd MMM yyyy', { locale: id })} className="col-span-3" readOnly />
              </div>
              {selectedRequest.returned_date && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="returnedDate" className="text-right">Tanggal Dikembalikan</Label>
                  <Input id="returnedDate" value={format(new Date(selectedRequest.returned_date), 'dd MMM yyyy', { locale: id })} className="col-span-3" readOnly />
                </div>
              )}
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">Catatan Admin</Label>
                <Textarea
                  id="notes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="col-span-3"
                  placeholder="Tambahkan catatan admin..."
                  readOnly={selectedRequest.status !== 'Pending' && selectedRequest.status !== 'Disetujui' && selectedRequest.status !== 'Diproses'}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            {isHeadmaster && selectedRequest?.status === 'Pending' && (
              <>
                <Button variant="destructive" onClick={() => handleAction('reject')}>Tolak</Button>
                <Button onClick={() => handleAction('approve')}>Setujui</Button>
              </>
            )}
            {isAdmin && selectedRequest?.status === 'Disetujui' && (
              <>
                <Button variant="destructive" onClick={() => handleAction('reject')}>Tolak</Button>
                <Button onClick={() => handleAction('handover')}>Proses</Button>
              </>
            )}
            {isAdmin && selectedRequest?.status === 'Diproses' && (
              <>
                <Button variant="destructive" onClick={() => handleAction('reject')}>Tolak</Button>
                <Button onClick={() => handleAction('return')}>Proses Pengembalian</Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BorrowRequestsAdminPage;