"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from './SessionContextProvider';

interface Item {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  type: 'consumable' | 'returnable'; // Add type to Item interface
}

const formSchema = z.object({
  name: z.string().min(2, { message: "Nama barang minimal 2 karakter." }),
  description: z.string().optional(),
  quantity: z.coerce.number().min(0, { message: "Kuantitas tidak boleh negatif." }),
  type: z.enum(['consumable', 'returnable'], { message: "Pilih tipe barang yang valid." }), // New field for item type
});

interface EditItemFormProps {
  item: Item;
  onSuccess: () => void;
}

const EditItemForm: React.FC<EditItemFormProps> = ({ item, onSuccess }) => {
  const queryClient = useQueryClient();
  const { userProfile } = useSession();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: item.name,
      description: item.description || "",
      quantity: item.quantity,
      type: item.type, // Set default value from item
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (userProfile?.role !== 'Admin') {
      showError("Anda tidak memiliki izin untuk memperbarui barang.");
      return;
    }

    const { error } = await supabase
      .from('items')
      .update({
        name: values.name,
        description: values.description,
        quantity: values.quantity,
        type: values.type, // Include item type
      })
      .eq('id', item.id);

    if (error) {
      showError(`Gagal memperbarui barang: ${error.message}`);
    } else {
      showSuccess("Barang berhasil diperbarui!");
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['inventorySummary'] }); // Invalidate summary to update total items
      queryClient.invalidateQueries({ queryKey: ['availableItems'] }); // Invalidate available items for return form
      onSuccess();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Barang</FormLabel>
              <FormControl>
                <Input placeholder="Nama barang" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Deskripsi</FormLabel>
              <FormControl>
                <Textarea placeholder="Deskripsi barang (opsional)" {...field} />
              </FormControl>
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
                <Input type="number" placeholder="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipe Barang</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe barang" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="returnable">Harus Dikembalikan</SelectItem>
                  <SelectItem value="consumable">Habis Pakai</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">Simpan Perubahan</Button>
      </form>
    </Form>
  );
};

export default EditItemForm;