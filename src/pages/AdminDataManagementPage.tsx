"use client";

import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { showError, showSuccess } from '@/utils/toast';
import { useSession } from '@/components/SessionContextProvider';
import { useNavigate } from 'react-router-dom';

const AdminDataManagementPage: React.FC = () => {
  const { user, isAdmin, isLoading: isSessionLoading } = useSession();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isSessionLoading) {
    return <div className="text-center">Memuat...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Anda tidak memiliki izin untuk mengakses halaman ini.
      </div>
    );
  }

  const handleTruncateAllActivity = async () => {
    if (!user) {
      showError("Anda harus masuk untuk melakukan tindakan ini.");
      return;
    }
    setIsSubmitting(true);

    try {
      const { data, error: edgeFunctionError } = await supabase.functions.invoke('truncate-activity', {
        body: JSON.stringify({}), // No specific body needed for this function
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await supabase.auth.getSession().then(res => res.data.session?.access_token)}`,
        },
      });

      if (edgeFunctionError) {
        throw new Error(edgeFunctionError.message);
      }
      
      if (data && data.error) {
        throw new Error(data.error);
      }

      showSuccess("Semua data aktivitas berhasil dihapus!");
      // Invalidate all relevant queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ['consumableRequests'] });
      queryClient.invalidateQueries({ queryKey: ['borrowRequests'] });
      queryClient.invalidateQueries({ queryKey: ['returnRequests'] });
      queryClient.invalidateQueries({ queryKey: ['adminConsumableRequests'] });
      queryClient.invalidateQueries({ queryKey: ['adminBorrowRequests'] });
      queryClient.invalidateQueries({ queryKey: ['adminReturnRequests'] });
      queryClient.invalidateQueries({ queryKey: ['allTransactions'] });
      queryClient.invalidateQueries({ queryKey: ['availableItems'] });
      queryClient.invalidateQueries({ queryKey: ['availableItemsForBorrow'] });
      queryClient.invalidateQueries({ queryKey: ['borrowedItemsForReturn'] });
      
      setIsConfirmDialogOpen(false);
      navigate('/admin/dashboard'); // Redirect back to admin dashboard
    } catch (error: any) {
      showError(`Gagal menghapus data aktivitas: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start w-full max-w-4xl mx-auto p-4 space-y-8">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-red-600">Manajemen Data Admin</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-lg text-gray-700">
            Halaman ini memungkinkan Anda untuk melakukan operasi manajemen data tingkat tinggi.
            Harap berhati-hati karena tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex justify-center mt-6">
            <Button
              variant="destructive"
              onClick={() => setIsConfirmDialogOpen(true)}
              disabled={isSubmitting}
            >
              Hapus Semua Aktivitas
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Penghapusan Data Aktivitas</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus semua data permintaan peminjaman, pengembalian, dan barang habis pakai?
              <br />
              <span className="font-bold text-red-600">Tindakan ini tidak dapat dibatalkan.</span>
              <br />
              Data barang dan profil pengguna akan tetap dipertahankan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)} disabled={isSubmitting}>Batal</Button>
            <Button variant="destructive" onClick={handleTruncateAllActivity} disabled={isSubmitting}>
              {isSubmitting ? 'Menghapus...' : 'Hapus Sekarang'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDataManagementPage;