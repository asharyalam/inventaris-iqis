"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from './SessionContextProvider';

const formSchema = z.object({
  name: z.string().min(2, { message: "Nama barang harus minimal 2 karakter." }),
  description: z.string().optional(),
  quantity: z.number().min(0, { message: "Kuantitas tidak boleh negatif." }),
  type: z.enum(['consumable', 'returnable'], { message: "Pilih tipe barang yang valid." }),
});

const AddItemForm: React.FC = () => {
  const { user } = useSession();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      quantity: 0,
      type: 'returnable', // Default to returnable
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      showError("Anda harus masuk untuk menambahkan barang.");
      return;
    }
    setIsSubmitting(true);

    const { error } = await supabase.from('items').insert({
      name: values.name,
      description: values.description,
      quantity: values.quantity,
      type: values.type,
      user_id: user.id, // Assuming the admin adding the item is the user_id
    });

    if (error) {
      showError(`Gagal menambahkan barang: ${error.message}`);
    } else {
      showSuccess("Barang berhasil ditambahkan!");
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['inventorySummary'] });
      queryClient.invalidateQueries({ queryKey: ['availableItems'] });
      queryClient.invalidateQueries({ queryKey: ['availableItemsForBorrow'] });
    }
    setIsSubmitting(false);
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
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
                  <Input
                    type="number"
                    placeholder="Kuantitas"
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
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Menambahkan...' : 'Tambah Barang'}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default AddItemForm;