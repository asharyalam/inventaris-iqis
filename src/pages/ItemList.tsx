"use client";

import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from '@/utils/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface Item {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  type: 'consumable' | 'returnable';
  created_at: string;
}

const formSchema = z.object({
  name: z.string().min(2, { message: "Nama barang harus minimal 2 karakter." }),
  description: z.string().optional(),
  quantity: z.number().min(0, { message: "Kuantitas tidak boleh negatif." }),
  type: z.enum(['consumable', 'returnable'], { message: "Pilih tipe barang yang valid." }),
});

const fetchAllItems = async (): Promise<Item[]> => {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

const ItemList: React.FC = () => {
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: items, isLoading, error, refetch } = useQuery<Item[], Error>({
    queryKey: ['items'],
    queryFn: fetchAllItems,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      quantity: 0,
      type: 'returnable',
    },
  });

  const handleEditClick = (item: Item) => {
    setSelectedItem(item);
    form.reset({
      name: item.name,
      description: item.description || '',
      quantity: item.quantity,
      type: item.type,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (item: Item) => {
    setSelectedItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleEditSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!selectedItem) return;
    setIsSubmitting(true);

    const { error: updateError } = await supabase
      .from('items')
      .update({
        name: values.name,
        description: values.description,
        quantity: values.quantity,
        type: values.type,
      })
      .eq('id', selectedItem.id);

    if (updateError) {
      showError(`Gagal memperbarui barang: ${updateError.message}`);
    } else {
      showSuccess("Barang berhasil diperbarui!");
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['inventorySummary'] });
      queryClient.invalidateQueries({ queryKey: ['availableItems'] });
      queryClient.invalidateQueries({ queryKey: ['availableItemsForBorrow'] });
      setIsEditDialogOpen(false);
    }
    setIsSubmitting(false);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItem) return;
    setIsSubmitting(true);

    const { error: deleteError } = await supabase
      .from('items')
      .delete()
      .eq('id', selectedItem.id);

    if (deleteError) {
      showError(`Gagal menghapus barang: ${deleteError.message}`);
    } else {
      showSuccess("Barang berhasil dihapus!");
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['inventorySummary'] });
      queryClient.invalidateQueries({ queryKey: ['availableItems'] });
      queryClient.invalidateQueries({ queryKey: ['availableItemsForBorrow'] });
      setIsDeleteDialogOpen(false);
      setSelectedItem(null);
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return <div className="text-center">Memuat daftar barang...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <h2 className="text-3xl font-bold mb-6 text-center">Manajemen Inventaris Barang</h2>
      {items && items.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Barang</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead>Kuantitas</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.description || '-'}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{item.type === 'consumable' ? 'Habis Pakai' : 'Harus Dikembalikan'}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditClick(item)}>
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteClick(item)}>
                    Hapus
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-center text-gray-500">Tidak ada barang dalam inventaris.</p>
      )}

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Barang</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleEditSubmit)} className="grid gap-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Barang</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Textarea {...field} />
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
                        <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
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
                      <Select onValueChange={field.onChange} value={field.value}>
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
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Item Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus Barang</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Apakah Anda yakin ingin menghapus barang "{selectedItem?.name}"?</p>
            <p className="text-sm text-red-500 mt-2">Tindakan ini tidak dapat dibatalkan.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isSubmitting}>
              {isSubmitting ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ItemList;