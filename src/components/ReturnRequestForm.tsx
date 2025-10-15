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
import { useQuery, useQueryClient } from '@tanstack/react-query';

const formSchema = z.object({
  borrow_request_id: z.string().uuid({ message: "Pilih permintaan peminjaman yang valid." }),
  quantity: z.number().min(1, { message: "Kuantitas harus minimal 1." }),
});

interface BorrowedItem {
  id: string;
  item_id: string;
  quantity: number;
  items: { name: string };
}

const fetchBorrowedItemsForReturn = async (userId: string): Promise<BorrowedItem[]> => {
  const { data, error } = await supabase
    .from('borrow_requests')
    .select(`
      id,
      item_id,
      quantity,
      items ( name )
    `)
    .eq('user_id', userId)
    .eq('status', 'Diproses'); // Only show items that are currently 'Diproses' (borrowed)

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

const ReturnRequestForm: React.FC = () => {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: borrowedItems, isLoading: isLoadingItems, error: itemsError } = useQuery<BorrowedItem[], Error>({
    queryKey: ['borrowedItemsForReturn', user?.id],
    queryFn: () => fetchBorrowedItemsForReturn(user!.id),
    enabled: !!user?.id,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      borrow_request_id: '',
      quantity: 1,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      showError("Anda harus masuk untuk membuat permintaan pengembalian.");
      return;
    }
    setIsSubmitting(true);

    const selectedBorrowedItem = borrowedItems?.find(item => item.id === values.borrow_request_id);
    if (!selectedBorrowedItem) {
      showError("Barang pinjaman tidak ditemukan atau tidak tersedia untuk dikembalikan.");
      setIsSubmitting(false);
      return;
    }

    if (values.quantity > selectedBorrowedItem.quantity) {
      showError(`Kuantitas yang diminta melebihi kuantitas yang dipinjam (${selectedBorrowedItem.quantity}).`);
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from('return_requests').insert({
      item_id: selectedBorrowedItem.item_id,
      user_id: user.id,
      quantity: values.quantity,
      status: 'Pending',
    });

    if (error) {
      showError(`Gagal membuat permintaan pengembalian: ${error.message}`);
    } else {
      showSuccess("Permintaan pengembalian barang berhasil diajukan!");
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['returnRequests', user.id] });
      queryClient.invalidateQueries({ queryKey: ['borrowedItemsForReturn', user.id] }); // Invalidate to update available quantity
      queryClient.invalidateQueries({ queryKey: ['adminReturnRequests'] }); // Invalidate for Admin view
    }
    setIsSubmitting(false);
  };

  if (isLoadingItems) {
    return <div className="text-center">Memuat daftar barang pinjaman...</div>;
  }

  if (itemsError) {
    return <div className="text-center text-red-500">Error: {itemsError.message}</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="borrow_request_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Barang yang Dipinjam</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih barang yang akan dikembalikan" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {borrowedItems?.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.items?.name || 'N/A'} (Kuantitas dipinjam: {item.quantity})
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
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kuantitas</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Masukkan kuantitas"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Mengajukan...' : 'Ajukan Pengembalian'}
        </Button>
      </form>
    </Form>
  );
};

export default ReturnRequestForm;