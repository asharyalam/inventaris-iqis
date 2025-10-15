"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from './SessionContextProvider';
import { showSuccess, showError } from '@/utils/toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useQueryClient } from '@tanstack/react-query';

const formSchema = z.object({
  borrow_request_id: z.string().uuid({ message: "Pilih permintaan peminjaman yang valid." }),
  condition_description: z.string().optional(),
  // photo_url: z.string().optional(), // Optional: for future photo upload
});

interface BorrowedItem {
  id: string;
  item_id: string;
  quantity: number;
  status: string;
  items: { name: string };
  due_date: string;
}

const fetchUserBorrowedItems = async (userId: string): Promise<BorrowedItem[]> => {
  const { data, error } = await supabase
    .from('borrow_requests')
    .select(`
      id,
      item_id,
      quantity,
      status,
      due_date,
      items ( name )
    `)
    .eq('user_id', userId)
    .eq('status', 'Sedang Dipinjam'); // Only show items currently borrowed

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

const ReturnRequestForm: React.FC = () => {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: borrowedItems, isLoading: isLoadingBorrowedItems, error: borrowedItemsError } = useQuery<BorrowedItem[], Error>({
    queryKey: ['userBorrowedItems', user?.id],
    queryFn: () => fetchUserBorrowedItems(user!.id),
    enabled: !!user?.id,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      borrow_request_id: '',
      condition_description: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      showError("Anda harus masuk untuk membuat permintaan pengembalian.");
      return;
    }
    setIsSubmitting(true);

    const selectedBorrowRequest = borrowedItems?.find(req => req.id === values.borrow_request_id);
    if (!selectedBorrowRequest) {
      showError("Permintaan peminjaman tidak ditemukan atau tidak valid.");
      setIsSubmitting(false);
      return;
    }

    // Insert into return_requests table
    const { error: returnRequestError } = await supabase.from('return_requests').insert({
      item_id: selectedBorrowRequest.item_id,
      user_id: user.id,
      quantity: selectedBorrowRequest.quantity,
      status: 'Pending', // Initial status for return request
      condition_description: values.condition_description,
      // photo_url: values.photo_url,
    });

    if (returnRequestError) {
      showError(`Gagal mengajukan pengembalian: ${returnRequestError.message}`);
    } else {
      // Update the status of the original borrow request to 'Pending Return' or similar
      // For now, we'll just submit the return request and let admin handle the borrow request status change
      showSuccess("Pengajuan pengembalian barang berhasil!");
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['userBorrowedItems'] });
      queryClient.invalidateQueries({ queryKey: ['userReturnRequests'] });
      queryClient.invalidateQueries({ queryKey: ['adminReturnRequests'] }); // Invalidate admin page
    }
    setIsSubmitting(false);
  };

  if (!user) {
    return <div className="text-center text-red-500">Anda harus masuk untuk mengajukan pengembalian.</div>;
  }

  if (isLoadingBorrowedItems) {
    return <div className="text-center">Memuat daftar barang yang dipinjam...</div>;
  }

  if (borrowedItemsError) {
    return <div className="text-center text-red-500">Error: {borrowedItemsError.message}</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="borrow_request_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Barang yang Akan Dikembalikan</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih barang yang sedang Anda pinjam" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {borrowedItems?.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.items?.name || 'N/A'} (Kuantitas: {item.quantity}) - Jatuh Tempo: {format(new Date(item.due_date), 'dd MMM yyyy', { locale: id })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="condition_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deskripsi Kondisi Barang</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Jelaskan kondisi barang saat ini (misal: baik, ada goresan kecil, rusak ringan)"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Future: Add file input for photo upload */}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Mengajukan...' : 'Ajukan Pengembalian'}
        </Button>
      </form>
    </Form>
  );
};

export default ReturnRequestForm;