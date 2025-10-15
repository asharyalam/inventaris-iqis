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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';

const formSchema = z.object({
  item_id: z.string().uuid({ message: "Pilih barang yang valid." }),
  quantity: z.number().min(1, { message: "Kuantitas harus minimal 1." }),
  borrow_start_date: z.date({ required_error: "Tanggal peminjaman wajib diisi." }),
  due_date: z.date({ required_error: "Tanggal pengembalian wajib diisi." }),
}).refine((data) => data.due_date >= data.borrow_start_date, { // Changed from > to >=
  message: "Tanggal pengembalian harus setelah atau sama dengan tanggal peminjaman.",
  path: ["due_date"],
});

interface Item {
  id: string;
  name: string;
  quantity: number;
  type: 'consumable' | 'returnable';
}

const fetchAvailableReturnableItems = async (): Promise<Item[]> => {
  const { data, error } = await supabase
    .from('items')
    .select('id, name, quantity, type')
    .eq('type', 'returnable')
    .gt('quantity', 0); // Only show items with quantity > 0

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

const BorrowRequestForm: React.FC = () => {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: availableItems, isLoading: isLoadingItems, error: itemsError } = useQuery<Item[], Error>({
    queryKey: ['availableItemsForBorrow'], // Different query key for borrowable items
    queryFn: fetchAvailableReturnableItems,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      item_id: '',
      quantity: 1,
      borrow_start_date: undefined,
      due_date: undefined,
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

    const { error } = await supabase.from('borrow_requests').insert({
      item_id: values.item_id,
      user_id: user.id,
      quantity: values.quantity,
      borrow_start_date: values.borrow_start_date.toISOString(),
      due_date: values.due_date.toISOString(),
      status: 'Menunggu Persetujuan', // Standardized status
    });

    if (error) {
      showError(`Gagal membuat permintaan: ${error.message}`);
    } else {
      showSuccess("Permintaan peminjaman barang berhasil diajukan!");
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['borrowRequests'] });
      queryClient.invalidateQueries({ queryKey: ['availableItemsForBorrow'] }); // Invalidate to update available quantity
      queryClient.invalidateQueries({ queryKey: ['adminBorrowRequests'] }); // Invalidate for Headmaster/Admin view
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
                    <SelectValue placeholder="Pilih barang yang akan dipinjam" />
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
        <FormField
          control={form.control}
          name="borrow_start_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Tanggal Peminjaman</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pilih tanggal peminjaman</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < new Date()} // Disable past dates
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="due_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Tanggal Pengembalian</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pilih tanggal pengembalian</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) => date < (form.getValues('borrow_start_date') || new Date())} // Disable dates before borrow_start_date
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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

export default BorrowRequestForm;