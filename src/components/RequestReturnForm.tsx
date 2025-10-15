"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from './SessionContextProvider';

interface Item {
  id: string;
  name: string;
  quantity: number;
}

const formSchema = z.object({
  itemId: z.string().uuid({ message: "Pilih barang yang valid." }),
  quantity: z.coerce.number().min(1, { message: "Kuantitas minimal 1." }),
});

const fetchAvailableItems = async (): Promise<Item[]> => {
  const { data, error } = await supabase
    .from('items')
    .select('id, name, quantity')
    .gt('quantity', 0); // Hanya tampilkan barang yang tersedia

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

const RequestReturnForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useSession();

  const { data: items, isLoading: isLoadingItems, error: itemsError } = useQuery<Item[], Error>({
    queryKey: ['availableItems'],
    queryFn: fetchAvailableItems,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      itemId: "",
      quantity: 1,
    },
  });

  const submitReturnRequestMutation = useMutation<void, Error, z.infer<typeof formSchema>>({
    mutationFn: async (values) => {
      if (!user) {
        throw new Error("Anda harus login untuk mengajukan permintaan pengembalian.");
      }

      const selectedItem = items?.find(item => item.id === values.itemId);
      if (!selectedItem) {
        throw new Error("Barang tidak ditemukan.");
      }
      if (values.quantity > selectedItem.quantity) {
        throw new Error(`Kuantitas pengembalian tidak boleh melebihi stok yang tersedia (${selectedItem.quantity}).`);
      }

      const { error } = await supabase
        .from('return_requests')
        .insert({
          item_id: values.itemId,
          user_id: user.id,
          quantity: values.quantity,
          status: 'Pending', // Default status
        });

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: () => {
      showSuccess("Permintaan pengembalian berhasil diajukan!");
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['availableItems'] }); // Refresh item list
      queryClient.invalidateQueries({ queryKey: ['userReturnRequests'] }); // Invalidate user's return requests
    },
    onError: (err) => {
      showError(`Gagal mengajukan permintaan: ${err.message}`);
    },
  });

  if (isLoadingItems) {
    return <div className="text-center">Memuat daftar barang...</div>;
  }

  if (itemsError) {
    return <div className="text-center text-red-500">Error: {itemsError.message}</div>;
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-2xl font-semibold mb-4">Ajukan Permintaan Pengembalian</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(submitReturnRequestMutation.mutate)} className="space-y-4">
          <FormField
            control={form.control}
            name="itemId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pilih Barang</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih barang yang akan dikembalikan" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {items?.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} (Stok: {item.quantity})
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
                  <Input type="number" placeholder="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={submitReturnRequestMutation.isPending}>
            {submitReturnRequestMutation.isPending ? "Mengajukan..." : "Ajukan Pengembalian"}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default RequestReturnForm;