"use client";

import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showError } from '@/utils/toast';
import { useSession } from './SessionContextProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import EditItemForm from './EditItemForm';
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationLink, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components

interface Item {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  type: 'consumable' | 'returnable'; // Add type to Item interface
  created_at: string;
}

interface PaginatedItems {
  items: Item[];
  totalCount: number;
}

type ItemTypeFilter = 'all' | 'consumable' | 'returnable';

const fetchItems = async (searchTerm: string = '', page: number, pageSize: number, typeFilter: ItemTypeFilter): Promise<PaginatedItems> => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from('items').select('*', { count: 'exact' });

  if (searchTerm) {
    query = query.ilike('name', `%${searchTerm}%`);
  }

  if (typeFilter !== 'all') {
    query = query.eq('type', typeFilter);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(error.message);
  }

  return { items: data || [], totalCount: count || 0 };
};

const ItemList: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<ItemTypeFilter>('all'); // New state for type filter
  const itemsPerPage = 10;

  const { data, isLoading, error, refetch } = useQuery<PaginatedItems, Error>({
    queryKey: ['items', searchTerm, currentPage, itemsPerPage, typeFilter], // Add typeFilter to queryKey
    queryFn: () => fetchItems(searchTerm, currentPage, itemsPerPage, typeFilter),
  });

  const items = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

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
      // Invalidate inventory summary as well
      queryClient.invalidateQueries({ queryKey: ['inventorySummary'] });
      queryClient.invalidateQueries({ queryKey: ['availableItems'] });
      queryClient.invalidateQueries({ queryKey: ['availableItemsForBorrow'] }); // Invalidate for borrow form
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

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleTypeFilterChange = (value: ItemTypeFilter) => {
    setTypeFilter(value);
    setCurrentPage(1); // Reset to first page when filter changes
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
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <Input
          type="text"
          placeholder="Cari barang berdasarkan nama..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="flex-1"
        />
        <Select onValueChange={handleTypeFilterChange} defaultValue={typeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter Tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="returnable">Harus Dikembalikan</SelectItem>
            <SelectItem value="consumable">Habis Pakai</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {items && items.length > 0 ? (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Kuantitas</TableHead>
                <TableHead>Tipe</TableHead>
                {isAdmin && <TableHead className="text-right">Aksi</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.description || '-'}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.type === 'consumable' ? 'Habis Pakai' : 'Harus Dikembalikan'}</TableCell>
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
          {totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                </PaginationItem>
                {[...Array(totalPages)].map((_, index) => (
                  <PaginationItem key={index}>
                    <PaginationLink
                      isActive={currentPage === index + 1}
                      onClick={() => handlePageChange(index + 1)}
                    >
                      {index + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      ) : (
        <p className="text-center text-gray-500">Tidak ada barang yang ditemukan.</p>
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