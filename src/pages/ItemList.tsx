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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface Item {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  type: 'consumable' | 'returnable';
  created_at: string;
}

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
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemQuantity, setItemQuantity] = useState(0);
  const [itemType, setItemType] = useState<'consumable' | 'returnable'>('returnable');

  const { data: items, isLoading, error, refetch } = useQuery<Item[], Error>({
    queryKey: ['items'],
    queryFn: fetchAllItems,
  });

  const handleEditClick = (item: Item) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemDescription(item.description || '');
    setItemQuantity(item.quantity);
    setItemType(item.type);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingItem) return;

    const { error: updateError } = await supabase
      .from('items')
      .update({
        name: itemName,
        description: itemDescription,
        quantity: itemQuantity,
        type: itemType,
      })
      .eq('id', editingItem.id);

    if (updateError) {
      showError(`Gagal memperbarui barang: ${updateError.message}`);
    } else {
      showSuccess("Barang berhasil diperbarui!");
      refetch();
      queryClient.invalidateQueries({ queryKey: ['inventorySummary'] });
      queryClient.invalidateQueries({ queryKey: ['availableItems'] });
      queryClient.invalidateQueries({ queryKey: ['availableItemsForBorrow'] });
      setIsDialogOpen(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus barang ini?")) {
      const { error: deleteError } = await supabase
        .from('items')
        .delete()
        .eq('id', itemId);

      if (deleteError) {
        showError(`Gagal menghapus barang: ${deleteError.message}`);
      } else {
        showSuccess("Barang berhasil dihapus!");
        refetch();
        queryClient.invalidateQueries({ queryKey: ['inventorySummary'] });
        queryClient.invalidateQueries({ queryKey: ['availableItems'] });
        queryClient.invalidateQueries({ queryKey: ['availableItemsForBorrow'] });
      }
    }
  };

  if (isLoading) {
    return <div className="text-center">Memuat daftar barang...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <h2 className="text-3xl font-bold mb-6 text-center">Manajemen Barang Inventaris</h2>
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
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Barang</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Nama Barang</Label>
                <Input id="name" value={itemName} onChange={(e) => setItemName(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Deskripsi</Label>
                <Textarea id="description" value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">Kuantitas</Label>
                <Input id="quantity" type="number" value={itemQuantity} onChange={(e) => setItemQuantity(Number(e.target.value))} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">Tipe Barang</Label>
                <Select onValueChange={(value: 'consumable' | 'returnable') => setItemType(value)} value={itemType}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Pilih tipe barang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="returnable">Harus Dikembalikan</SelectItem>
                    <SelectItem value="consumable">Habis Pakai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleSave}>Simpan Perubahan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ItemList;