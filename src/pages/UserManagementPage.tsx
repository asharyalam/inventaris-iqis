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

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  instansi: string | null;
  role: string | null;
  avatar_url: string | null;
}

const fetchAllUserProfiles = async (): Promise<UserProfile[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, instansi, role, avatar_url')
    .order('first_name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

const UserManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [instansi, setInstansi] = useState('');
  const [role, setRole] = useState('');

  const { data: users, isLoading, error, refetch } = useQuery<UserProfile[], Error>({
    queryKey: ['userProfiles'],
    queryFn: fetchAllUserProfiles,
  });

  const handleEditClick = (userProfile: UserProfile) => {
    setEditingUser(userProfile);
    setFirstName(userProfile.first_name || '');
    setLastName(userProfile.last_name || '');
    setInstansi(userProfile.instansi || '');
    setRole(userProfile.role || 'Pengguna');
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        instansi: instansi,
        role: role,
      })
      .eq('id', editingUser.id);

    if (updateError) {
      showError(`Gagal memperbarui profil pengguna: ${updateError.message}`);
    } else {
      showSuccess("Profil pengguna berhasil diperbarui!");
      refetch();
      setIsDialogOpen(false);
    }
  };

  if (isLoading) {
    return <div className="text-center">Memuat daftar pengguna...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <h2 className="text-3xl font-bold mb-6 text-center">Manajemen Pengguna</h2>
      {users && users.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Depan</TableHead>
              <TableHead>Nama Belakang</TableHead>
              <TableHead>Instansi</TableHead>
              <TableHead>Peran</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((userProfile) => (
              <TableRow key={userProfile.id}>
                <TableCell className="font-medium">{userProfile.first_name || '-'}</TableCell>
                <TableCell>{userProfile.last_name || '-'}</TableCell>
                <TableCell>{userProfile.instansi || '-'}</TableCell>
                <TableCell>{userProfile.role || 'Pengguna'}</TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => handleEditClick(userProfile)}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-center text-gray-500">Tidak ada pengguna yang ditemukan.</p>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profil Pengguna</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="firstName" className="text-right">Nama Depan</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lastName" className="text-right">Nama Belakang</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="instansi" className="text-right">Instansi</Label>
                <Input id="instansi" value={instansi} onChange={(e) => setInstansi(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">Peran</Label>
                <Select onValueChange={setRole} value={role}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Pilih peran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Pengguna">Pengguna</SelectItem>
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

export default UserManagementPage;