"use client";

import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { showError, showSuccess } from '@/utils/toast';
import { useSession } from '@/components/SessionContextProvider';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface ConsumableRequest {
  id: string;
  item_id: string;
  user_id: string;
  items: { name: string; quantity: number }; // Nested item name and current quantity
  profiles: { first_name: string; last_name: string; instansi: string }; // Nested user profile
  quantity: number;
  request_date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  admin_notes: string | null;
  approval_date: string | null;
}

const fetchAllConsumableRequests = async (): Promise<ConsumableRequest[]> => {
  const { data, error } = await supabase
    .from('consumable_requests') // Fetch from new table
    .select(`
      id,
      item_id,
      user_id,
      quantity,
      request_date,
      status,
      admin_notes,
      approval_date,
      items ( name, quantity ),
      profiles ( first_name, last_name, instansi )
    `)
    .order('request_date', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

const AdminConsumableRequests: React.FC = () => {
  const queryClient = useQueryClient();
  const { userProfile, isLoading: isSessionLoading } = useSession();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ConsumableRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const { data: requests, isLoading, error } = useQuery<ConsumableRequest[], Error>({
    queryKey: ['allConsumableRequests'], // Unique query key
    queryFn: fetchAllConsumableRequests,
    enabled: !isSessionLoading && userProfile?.role === 'Admin',
  });

  const updateRequestStatusMutation = useMutation<void, Error, { requestId: string; status: 'Approved' | 'Rejected'; notes: string; item_id: string; quantity: number }>({
    mutationFn: async ({ requestId, status, notes, item_id, quantity }) => {
      if (!userProfile || userProfile.role !== 'Admin') {
        throw new Error("Anda tidak memiliki izin untuk melakukan tindakan ini.");
      }

      const { error: updateError } = await supabase
        .from('consumable_requests') // Update new table
        .update({
          status: status,
          admin_notes: notes,
          approval_date: new Date().toISOString(),
          approved_by: userProfile.id,
        })
        .eq('id', requestId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // If approved, decrease item quantity (consumable items are "used up")
      if (status === 'Approved') {
        const { data: itemData, error: fetchItemError } = await supabase
          .from('items')
          .select('quantity')
          .eq('id', item_id)
          .single();

        if (fetchItemError) {
          throw new Error(`Gagal mengambil kuantitas barang: ${fetchItemError.message}`);
        }

        const newQuantity = (itemData?.quantity || 0) - quantity;
        if (newQuantity < 0) {
          throw new Error("Kuantitas barang tidak mencukupi untuk permintaan ini.");
        }

        const { error: updateItemError } = await supabase
          .from('items')
          .update({ quantity: newQuantity })
          .eq('id', item_id);

        if (updateItemError) {
          throw new Error(`Gagal memperbarui kuantitas barang: ${updateItemError.message}`);
        }
      }
    },
    onSuccess: () => {
      showSuccess("Permintaan barang habis pakai berhasil diperbarui!");
      queryClient.invalidateQueries({ queryKey: ['allConsumableRequests'] });
      queryClient.invalidateQueries({ queryKey: ['userConsumableRequests'] });
      queryClient.invalidateQueries({ queryKey: ['availableConsumableItems'] }); // Invalidate available items for consumable form
      queryClient.invalidateQueries({ queryKey: ['items'] }); // Invalidate item list if quantity changed
      queryClient.invalidateQueries({ queryKey: ['inventorySummary'] }); // Invalidate summary
      setIsDialogOpen(false);
      setSelectedRequest(null);
      setAdminNotes('');
    },
    onError: (err) => {
      showError(`Gagal memperbarui permintaan: ${err.message}`);
    },
  });

  const handleActionClick = (request: ConsumableRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.admin_notes || '');
    setIsDialogOpen(true);
  };

  const handleApprove = () => {
    if (selectedRequest) {
      updateRequestStatusMutation.mutate({
        requestId: selectedRequest.id,
        status: 'Approved',
        notes: adminNotes,
        item_id: selectedRequest.item_id,
        quantity: selectedRequest.quantity,
      });
    }
  };

  const handleReject = () => {
    if (selectedRequest) {
      updateRequestStatusMutation.mutate({
        requestId: selectedRequest.id,
        status: 'Rejected',
        notes: adminNotes,
        item_id: selectedRequest.item_id, // Still pass item_id and quantity, but no update will happen for rejected
        quantity: selectedRequest.quantity,
      });
    }
  };

  if (isSessionLoading) {
    return <div className="text-center">Memuat sesi pengguna...</div>;
  }

  if (userProfile?.role !== 'Admin') {
    return <div className="text-center text-red-500">Anda tidak memiliki izin untuk mengakses halaman ini.</div>;
  }

  if (isLoading) {
    return <div className="text-center">Memuat daftar permintaan barang habis pakai...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Manajemen Permintaan Barang Habis Pakai</h2>
      {requests && requests.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Barang</TableHead>
              <TableHead>Pengaju</TableHead>
              <TableHead>Instansi</TableHead>
              <TableHead>Kuantitas</TableHead>
              <TableHead>Tanggal Permintaan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">{request.items?.name || 'N/A'}</TableCell>
                <TableCell>{`${request.profiles?.first_name || ''} ${request.profiles?.last_name || ''}`.trim() || 'N/A'}</TableCell>
                <TableCell>{request.profiles?.instansi || 'N/A'}</TableCell>
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
                <TableCell className="text-right">
                  {request.status === 'Pending' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleActionClick(request)}
                      disabled={updateRequestStatusMutation.isPending}
                    >
                      Tinjau
                    </Button>
                  )}
                  {request.status !== 'Pending' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleActionClick(request)}
                    >
                      Lihat Detail
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-center text-gray-500">Tidak ada permintaan barang habis pakai yang ditemukan.</p>
      )}

      {selectedRequest && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Tinjau Permintaan Barang Habis Pakai</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Barang:</Label>
                <span className="col-span-3 font-medium">{selectedRequest.items?.name}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Pengaju:</Label>
                <span className="col-span-3">{`${selectedRequest.profiles?.first_name || ''} ${selectedRequest.profiles?.last_name || ''}`.trim()}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Instansi:</Label>
                <span className="col-span-3">{selectedRequest.profiles?.instansi}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Kuantitas:</Label>
                <span className="col-span-3">{selectedRequest.quantity}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Status:</Label>
                <Badge
                  className="col-span-3 w-fit"
                  variant={
                    selectedRequest.status === 'Approved'
                      ? 'default'
                      : selectedRequest.status === 'Rejected'
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {selectedRequest.status === 'Pending' && 'Menunggu'}
                  {selectedRequest.status === 'Approved' && 'Disetujui'}
                  {selectedRequest.status === 'Rejected' && 'Ditolak'}
                </Badge>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="adminNotes" className="text-right pt-2">Catatan Admin:</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="col-span-3"
                  placeholder="Tambahkan catatan admin..."
                  disabled={selectedRequest.status !== 'Pending'}
                />
              </div>
            </div>
            <DialogFooter>
              {selectedRequest.status === 'Pending' && (
                <>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={updateRequestStatusMutation.isPending}
                  >
                    Tolak
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={updateRequestStatusMutation.isPending}
                  >
                    Setujui
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Tutup</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminConsumableRequests;