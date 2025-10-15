"use client";

import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { showError } from '@/utils/toast';

interface Item {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  price: number;
  created_at: string;
}

const fetchItems = async (): Promise<Item[]> => {
  const { data, error } = await supabase.from('items').select('*').order('created_at', { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return data;
};

const ItemList: React.FC = () => {
  const { data: items, isLoading, error, refetch } = useQuery<Item[], Error>({
    queryKey: ['items'],
    queryFn: fetchItems,
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus barang ini?")) {
      return;
    }
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) {
      showError(`Gagal menghapus barang: ${error.message}`);
    } else {
      refetch(); // Refresh the list after deletion
    }
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
      {items && items.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Deskripsi</TableHead>
              <TableHead>Kuantitas</TableHead>
              <TableHead>Harga</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.description || '-'}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{item.price ? `Rp${item.price.toLocaleString('id-ID')}` : 'Rp0'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(item.id)}>
                    Hapus
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-center text-gray-500">Belum ada barang yang ditambahkan.</p>
      )}
    </div>
  );
};

export default ItemList;