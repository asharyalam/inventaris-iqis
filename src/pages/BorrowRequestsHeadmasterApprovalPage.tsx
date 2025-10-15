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
  status: string;
  admin_notes: string | null;
  items: { name: string };
  profiles: { first_name: string; last_name: string; instansi: string };
}

const fetchPendingBorrowRequests = async (): Promise<BorrowRequest[]> => {
  const { data, error } = await supabase
    .from('borrow_requests')
    .select(`
      id,
      item_id,
      user_id,
      quantity,
      request_date,
      due_date,
      status,
      admin_notes,
      items ( name ),
      profiles ( first_name, last_name, instansi )
    `)
    .eq('status', 'Pending')
    .order('request_date', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

const BorrowRequestsHeadmasterApprovalPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useSession();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<BorrowRequest | null>(null);
  const [headmasterNotes, setHeadmasterNotes] = useState('');

  const { data: requests, isLoading, error, refetch } = useQuery<BorrowRequest[], Error>({
    queryKey: ['headmasterBorrowApprovals'],
    queryFn: fetchPendingBorrowRequests,
  });

  const handleAction = async (status: 'Approved by Headmaster' | 'Rejected by Headmaster') => {
    if (!selectedRequest || !user) return;

    const { error: updateError } = await supabase
      .from('borrow_requests')
      .update({
        status: status,
        admin_notes: headmasterNotes, // Using admin_notes for headmaster notes for simplicity
        approved_by: user.id,
        approval_date: new Date().toISOString(),
      })
      .eq('id', selectedRequest.id);

    if (updateError) {
      showError(`Gagal memperbarui permintaan: ${updateError.message}`);
    } else {
      showSuccess(`Permintaan peminjaman berhasil ${status === 'Approved by Headmaster' ? 'disetujui' : 'ditolak'} oleh Kepala Sekolah!`);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['adminBorrowProcessing'] }); // Invalidate admin processing page
      setIsDialogOpen(false);
      setSelectedRequest(null);
      setHeadmasterNotes('');
    }
  };

  const openDialog = (request: BorrowRequest) => {
    setSelectedRequest(request);
    setHeadmasterNotes(request.admin_notes || '');
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div className="text-center">Memuat permintaan peminjaman...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <h2 className="text-3xl font-bold mb-6 text-center">Persetujuan Permintaan Peminjaman Barang</h2>
      {requests && requests.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Barang</TableHead>
              <TableHead>Peminjam</TableHead>
              <TableHead>Instansi</TableHead>
              <TableHead>Kuantitas</TableHead>
              <TableHead>Tanggal Permintaan</TableHead>
              <TableHead>Tanggal Jatuh Tempo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">{request.items?.name || 'N/A'}</TableCell>
                <TableCell>{`${request.profiles?.first_name || ''} ${request.profiles?.last_name || ''}`.trim() || 'N/A'}</TableCell>
                <TableCell>{request.profiles?.instansi || '-'}</TableCell>
                <TableCell>{request.quantity}</TableCell>
                <TableCell>{format(new Date(request.request_date), 'dd MMM yyyy HH:mm', { locale: id })}</TableCell>
                <TableCell>{format(new Date(request.due_date), 'dd MMM yyyy', { locale: id })}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                    request.status === 'Approved by Headmaster' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {request.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {request.status === 'Pending' && (
                    <Button variant="outline" size="sm" onClick={() => openDialog(request)}>
                      Tinjau
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-center text-gray-500">Tidak ada permintaan peminjaman barang yang perlu disetujui.</p>
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
                <Label htmlFor="dueDate" className="text-right">Tanggal Jatuh Tempo</Label>
                <Input id="dueDate" value={format(new Date(selectedRequest.due_date), 'dd MMM yyyy', { locale: id })} className="col-span-3" readOnly />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">Catatan Kepala Sekolah</Label>
                <Textarea
                  id="notes"
                  value={headmasterNotes}
                  onChange={(e) => setHeadmasterNotes(e.target.value)}
                  className="col-span-3"
                  placeholder="Tambahkan catatan..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="destructive" onClick={() => handleAction('Rejected by Headmaster')}>Tolak</Button>
            <Button onClick={() => handleAction('Approved by Headmaster')}>Setujui</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BorrowRequestsHeadmasterApprovalPage;