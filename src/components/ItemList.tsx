"use client";

import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Import Input component
import { showError } from '@/utils/toast';
import { useSession } from './SessionContextProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EditItemForm from './EditItemForm';

interface Item {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  price: number;
  created_at: string;
}

// Modifikasi fetchItems untuk menerima searchTerm
const fetchItems = async (searchTerm: string = ''): Promise<Item[]> => {
  let query = supabase.from('items').select('*');

  if (searchTerm) {
    query = query.ilike('name', `%${searchTerm}%`); // Mencari berdasarkan nama barang
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return data;
};

const ItemList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState(''); // State untuk input pencarian
  const { data: items, isLoading, error, refetch } = useQuery<Item[], Error>({
    queryKey: ['items', searchTerm], // Tambahkan searchTerm ke queryKey
    queryFn: () => fetchItems(searchTerm), // Panggil fetchItems dengan searchTerm
  });
  const { userProfile } = useSession();
  const isAdmin = userProfile?.role === 'Admin';

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus barang ini?")) {
      return;
    }
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) {
      showError(`Gagal menghapus barang: ${error.message}`);
    } else {
      refetch();
    }
  };

  const handleEditClick = (item: Item) => {
    setEditingItem(item);
    setIsEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    setEditingItem(null);
    refetch();
  };

  if (isLoading) {
    return <div className="text-center">Memuat daftar barang...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h3 className="text-2xl font-semibold mb-4">Daftar Barang</h3>
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Cari barang berdasarkan nama..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>
      {items && items.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead>Kuantitas</TableHead>
              <TableHead>Harga</TableHead>
              {isAdmin && <TableHead className="text-right">Aksi</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.description || '-'}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{item.price ? `Rp${item.price.toLocaleString('id-ID')}` : 'Rp0'}</TableCell>
                {isAdmin && (
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(item)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                      Hapus
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-center text-gray-500">Belum ada barang yang ditambahkan atau tidak ditemukan.</p>
      )}

      {editingItem && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Barang</DialogTitle>
            </DialogHeader>
            <EditItemForm item={editingItem} onSuccess={handleEditSuccess} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ItemList;