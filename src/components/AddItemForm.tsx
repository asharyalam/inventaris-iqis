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

const formSchema = z.object({
  name: z.string().min(2, { message: "Nama barang minimal 2 karakter." }),
  description: z.string().optional(),
  quantity: z.coerce.number().min(0, { message: "Kuantitas tidak boleh negatif." }),
  type: z.enum(['consumable', 'returnable'], { message: "Pilih tipe barang yang valid." }), // New field for item type
});

const AddItemForm: React.FC = () => {
  const queryClient = useQueryClient();
  const { user, userProfile } = useSession();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      quantity: 0,
      type: "returnable", // Default to 'returnable'
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user || userProfile?.role !== 'Admin') {
      showError("Anda tidak memiliki izin untuk menambahkan barang.");
      return;
    }

    const { data, error } = await supabase
      .from('items')
      .insert({
        name: values.name,
        description: values.description,
        quantity: values.quantity,
        type: values.type, // Include item type
        user_id: user.id,
      })
      .select();

    if (error) {
      showError(`Gagal menambahkan barang: ${error.message}`);
    } else {
      showSuccess("Barang berhasil ditambahkan!");
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['inventorySummary'] }); // Invalidate summary to update total items
      queryClient.invalidateQueries({ queryKey: ['availableItems'] }); // Invalidate available items for return form
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-2xl font-semibold mb-4">Tambah Barang Baru</h3>
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
          <Button type="submit" className="w-full">Tambah Barang</Button>
        </form>
      </Form>
    </div>
  );
};

export default AddItemForm;