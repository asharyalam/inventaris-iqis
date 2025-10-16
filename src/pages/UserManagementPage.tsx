"use client";

import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { showSuccess, showError } from '@/utils/toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"; // Import DialogDescription
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
  email: string; // Now fetched directly from profiles table
  position: string | null;
}

const fetchAllUserProfiles = async (): Promise<UserProfile[]> => {
  // Fetch profiles including the new email column
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      first_name,
      last_name,
      instansi,
      role,
      avatar_url,
      position,
      email
    `)
    .order('first_name', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

const UserManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [instansi, setInstansi] = useState('');
  const [role, setRole] = useState('');
  const [position, setPosition] = useState('');

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
    setPosition(userProfile.position || '');
    setIsEditDialogOpen(true);
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
        position: position,
      })
      .eq('id', editingUser.id);

    if (updateError) {
      showError(`Gagal memperbarui profil pengguna: ${updateError.message}`);
    } else {
      showSuccess("Profil pengguna berhasil diperbarui!");
      refetch();
      queryClient.invalidateQueries({ queryKey: ['userProfile', editingUser.id] });
      setIsEditDialogOpen(false);
    }
  };

  const handleResetPasswordClick = (userProfile: UserProfile) => {
    setUserToResetPassword(userProfile);
    setIsResetPasswordDialogOpen(true);
  };

  const confirmResetPassword = async () => {
    if (!userToResetPassword) return;

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(userToResetPassword.email, {
      redirectTo: `${window.location.origin}/login?reset=true`,
    });

    if (resetError) {
      showError(`Gagal mengirim tautan reset kata sandi ke ${userToResetPassword.email}: ${resetError.message}`);
    } else {
      showSuccess(`Tautan reset kata sandi telah dikirim ke email ${userToResetPassword.email}.`);
    }
    setIsResetPasswordDialogOpen(false);
    setUserToResetPassword(null);
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
              <TableHead>Email</TableHead>
              <TableHead>Instansi</TableHead>
              <TableHead>Jabatan</TableHead>
              <TableHead>Peran</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((userProfile) => (
              <TableRow key={userProfile.id}>
                <TableCell className="font-medium">{userProfile.first_name || '-'}</TableCell>
                <TableCell>{userProfile.last_name || '-'}</TableCell>
                <TableCell>{userProfile.email || '-'}</TableCell>
                <TableCell>{userProfile.instansi || '-'}</TableCell>
                <TableCell>{userProfile.position || '-'}</TableCell>
                <TableCell>{userProfile.role || 'Pengguna'}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditClick(userProfile)}>
                    Edit
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleResetPasswordClick(userProfile)}>
                    Reset Kata Sandi
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-center text-gray-500">Tidak ada pengguna yang ditemukan.</p>
      )}

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
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
                <Label htmlFor="position" className="text-right">Jabatan</Label>
                <Input id="position" value={position} onChange={(e) => setPosition(e.target.value)} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">Peran</Label>
                <Select onValueChange={setRole} value={role}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Pilih peran" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Kepala Sekolah">Kepala Sekolah</SelectItem>
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

      {/* Reset Password Confirmation Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Reset Kata Sandi</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin mengirim tautan reset kata sandi ke {userToResetPassword?.email}?
              Pengguna akan menerima email untuk mengatur ulang kata sandi mereka.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={confirmResetPassword}>Kirim Tautan Reset</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementPage;