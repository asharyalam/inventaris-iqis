"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { showError, showSuccess } from '@/utils/toast';
import { useSession } from '@/components/SessionContextProvider';
import { Input } from '@/components/ui/input';

interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  instansi: string | null;
  role: string;
  email: string; // Tambahkan email untuk tampilan
}

const fetchUserProfiles = async (searchTerm: string = ''): Promise<UserProfile[]> => {
  let query = supabase
    .from('profiles')
    .select('id, first_name, last_name, instansi, role, auth_users:auth.users(email)'); // Join dengan auth.users untuk mendapatkan email

  if (searchTerm) {
    query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,instansi.ilike.%${searchTerm}%,role.ilike.%${searchTerm}%,auth_users.email.ilike.%${searchTerm}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  // Map data untuk menyertakan email langsung di objek profil
  return data.map(profile => ({
    ...profile,
    email: profile.auth_users?.email || 'N/A',
  }));
};

const updateUserRole = async ({ id, role }: { id: string; role: string }) => {
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
};

const UserManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const { userProfile, isLoading: isSessionLoading } = useSession();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: profiles, isLoading, error } = useQuery<UserProfile[], Error>({
    queryKey: ['userProfiles', searchTerm],
    queryFn: () => fetchUserProfiles(searchTerm),
    enabled: !isSessionLoading && userProfile?.role === 'Admin', // Hanya fetch jika admin
  });

  const updateRoleMutation = useMutation<void, Error, { id: string; role: string }>({
    mutationFn: updateUserRole,
    onSuccess: () => {
      showSuccess("Peran pengguna berhasil diperbarui!");
      queryClient.invalidateQueries({ queryKey: ['userProfiles'] });
    },
    onError: (err) => {
      showError(`Gagal memperbarui peran: ${err.message}`);
    },
  });

  if (isSessionLoading) {
    return <div className="text-center">Memuat sesi pengguna...</div>;
  }

  if (userProfile?.role !== 'Admin') {
    return <div className="text-center text-red-500">Anda tidak memiliki izin untuk mengakses halaman ini.</div>;
  }

  if (isLoading) {
    return <div className="text-center">Memuat daftar pengguna...</div>;
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error.message}</div>;
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Manajemen Pengguna</h2>
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Cari pengguna berdasarkan nama, email, instansi, atau peran..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>
      {profiles && profiles.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Lengkap</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Instansi</TableHead>
              <TableHead>Peran</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell className="font-medium">{`${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'N/A'}</TableCell>
                <TableCell>{profile.email}</TableCell>
                <TableCell>{profile.instansi || 'N/A'}</TableCell>
                <TableCell>
                  <Select
                    value={profile.role}
                    onValueChange={(newRole) => updateRoleMutation.mutate({ id: profile.id, role: newRole })}
                    disabled={updateRoleMutation.isPending || profile.id === userProfile.id} // Disable jika sedang update atau profil sendiri
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Pilih Peran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="Pengguna">Pengguna</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right">
                  {profile.id === userProfile.id ? (
                    <span className="text-gray-500 text-sm">Anda</span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateRoleMutation.mutate({ id: profile.id, role: profile.role === 'Admin' ? 'Pengguna' : 'Admin' })}
                      disabled={updateRoleMutation.isPending}
                    >
                      {profile.role === 'Admin' ? 'Jadikan Pengguna' : 'Jadikan Admin'}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-center text-gray-500">Tidak ada pengguna yang ditemukan.</p>
      )}
    </div>
  );
};

export default UserManagement;