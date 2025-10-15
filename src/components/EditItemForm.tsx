"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { useQueryClient } from '@tanstack/react-query';

interface Item {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
}

const formSchema = z.object({
  name: z.string().min(2, { message: "Nama barang minimal 2 karakter." }),
  description: z.string().optional(),
  quantity: z.coerce.number().min(0, { message: "Kuantitas tidak boleh negatif." }),
});

interface EditItemFormProps {
  item: Item;
  onSuccess: () => void;
}

const EditItemForm: React.FC<EditItemFormProps> = ({ item, onSuccess }) => {
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: item.name,
      description: item.description || "",
      quantity: item.quantity,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const { error } = await supabase
      .from('items')
      .update({
        name: values.name,
        description: values.description,
        quantity: values.quantity,
      })
      .eq('id', item.id);

    if (error) {
      showError(`Gagal memperbarui barang: ${error.message}`);
    } else {
      showSuccess("Barang berhasil diperbarui!");
      queryClient.invalidateQueries({ queryKey: ['items'] }); // Invalidate and refetch items
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
        <Button type="submit" className="w-full">Simpan Perubahan</Button>
      </form>
    </Form>
  );
};

export default EditItemForm;