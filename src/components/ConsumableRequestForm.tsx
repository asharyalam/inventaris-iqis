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
  item_id: z.string().uuid({ message: "Pilih barang yang valid." }),
  quantity: z.number().min(1, { message: "Kuantitas harus minimal 1." }),
});

interface Item {
  id: string;
  name: string;
  quantity: number;
  type: 'consumable' | 'returnable';
}

const fetchAvailableConsumableItems = async (): Promise<Item[]> => {
  const { data, error } = await supabase
    .from('items')
    .select('id, name, quantity, type')
    .eq('type', 'consumable')
    .gt('quantity', 0); // Only show items with quantity > 0

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

const ConsumableRequestForm: React.FC = () => {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: availableItems, isLoading: isLoadingItems, error: itemsError } = useQuery<Item[], Error>({
    queryKey: ['availableItems'],
    queryFn: fetchAvailableConsumableItems,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      item_id: '',
      quantity: 1,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      showError("Anda harus masuk untuk membuat permintaan.");
      return;
    }
    setIsSubmitting(true);

    const selectedItem = availableItems?.find(item => item.id === values.item_id);
    if (!selectedItem) {
      showError("Barang tidak ditemukan atau tidak tersedia.");
      setIsSubmitting(false);
      return;
    }

    if (values.quantity > selectedItem.quantity) {
      showError(`Kuantitas yang diminta melebihi stok yang tersedia (${selectedItem.quantity}).`);
      setIsSubmitting(false);
      return;
    }

    const { error } = await supabase.from('consumable_requests').insert({
      item_id: values.item_id,
      user_id: user.id,
      quantity: values.quantity,
      status: 'Pending',
    });

    if (error) {
      showError(`Gagal membuat permintaan: ${error.message}`);
    } else {
      showSuccess("Permintaan barang habis pakai berhasil diajukan!");
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['consumableRequests'] });
      queryClient.invalidateQueries({ queryKey: ['availableItems'] }); // Invalidate to update available quantity
      queryClient.invalidateQueries({ queryKey: ['adminConsumableRequests'] }); // Invalidate for Headmaster/Admin view
    }
    setIsSubmitting(false);
  };

  if (isLoadingItems) {
    return <div className="text-center">Memuat daftar barang...</div>;
  }

  if (itemsError) {
    return <div className="text-center text-red-500">Error: {itemsError.message}</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="item_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Barang</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih barang habis pakai" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableItems?.map((item) => (
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
          {isSubmitting ? 'Mengajukan...' : 'Ajukan Permintaan'}
        </Button>
      </form>
    </Form>
  );
};

export default ConsumableRequestForm;