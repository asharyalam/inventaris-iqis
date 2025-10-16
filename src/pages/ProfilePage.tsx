"use client";

import React, { useState } from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useQueryClient } from '@tanstack/react-query';

const instansiOptions = ["BPH", "TKIT", "SDIT", "SMPIT", "SMKIT", "BK"];

const formSchema = z.object({
  first_name: z.string().min(2, { message: "Nama depan harus minimal 2 karakter." }),
  last_name: z.string().min(2, { message: "Nama belakang harus minimal 2 karakter." }),
  instansi: z.enum(["BPH", "TKIT", "SDIT", "SMPIT", "SMKIT", "BK"], { message: "Pilih instansi yang valid." }),
  position: z.string().min(2, { message: "Jabatan harus minimal 2 karakter." }),
});

const ProfilePage: React.FC = () => {
  const { user, userProfile, isLoading } = useSession();
  const queryClient = useQueryClient();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: userProfile?.first_name || '',
      last_name: userProfile?.last_name || '',
      instansi: (userProfile?.instansi as "BPH" | "TKIT" | "SDIT" | "SMPIT" | "SMKIT" | "BK") || undefined,
      position: userProfile?.position || '',
    },
  });

  React.useEffect(() => {
    if (userProfile) {
      form.reset({
        first_name: userProfile.first_name || '',
        last_name: userProfile.last_name || '',
        instansi: (userProfile.instansi as "BPH" | "TKIT" | "SDIT" | "SMPIT" | "SMKIT" | "BK") || undefined,
        position: userProfile.position || '',
      });
    }
  }, [userProfile, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      showError("Anda harus masuk untuk memperbarui profil.");
      return;
    }
    setIsSubmitting(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        first_name: values.first_name,
        last_name: values.last_name,
        instansi: values.instansi,
        position: values.position,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      showError(`Gagal memperbarui profil: ${error.message}`);
    } else {
      showSuccess("Profil berhasil diperbarui!");
      queryClient.invalidateQueries({ queryKey: ['userProfile', user.id] }); // Invalidate to refetch latest profile
      setIsEditDialogOpen(false);
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Memuat profil...</div>;
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">Anda harus masuk untuk melihat profil Anda.</div>;
  }

  return (
    <div className="flex flex-col items-center justify-start w-full max-w-2xl mx-auto p-4 space-y-8">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Profil Pengguna</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Menghapus bagian Avatar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email || ''} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstName">Nama Depan</Label>
              <Input id="firstName" value={userProfile?.first_name || ''} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nama Belakang</Label>
              <Input id="lastName" value={userProfile?.last_name || ''} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="instansi">Instansi</Label>
              <Select value={userProfile?.instansi || ''} disabled>
                <SelectTrigger id="instansi" className="w-full">
                  <SelectValue placeholder="Pilih Instansi" />
                </SelectTrigger>
                <SelectContent>
                  {instansiOptions.map((instansi) => (
                    <SelectItem key={instansi} value={instansi}>
                      {instansi}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Jabatan</Label>
              <Input id="position" value={userProfile?.position || ''} readOnly />
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={() => setIsEditDialogOpen(true)}>Edit Profil</Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Profil Anda</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Depan</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Belakang</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="instansi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instansi</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Instansi" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {instansiOptions.map((instansi) => (
                          <SelectItem key={instansi} value={instansi}>
                            {instansi}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jabatan</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
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
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfilePage;