"use client";

import React from 'react';
import { useSession } from '@/components/SessionContextProvider';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Import Select components

const instansiOptions = ["BPH", "TKIT", "SDIT", "SMPIT", "SMKIT", "BK"]; // Define instansi options

const ProfilePage: React.FC = () => {
  const { user, userProfile, isLoading } = useSession();

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
          <div className="flex justify-center">
            <Avatar className="h-24 w-24">
              <AvatarImage src={userProfile?.avatar_url || "https://github.com/shadcn.png"} alt="Avatar" />
              <AvatarFallback>{userProfile?.first_name ? userProfile.first_name[0] : 'U'}</AvatarFallback>
            </Avatar>
          </div>
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
              <Select value={userProfile?.instansi || ''} disabled> {/* Changed to Select */}
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
            <div className="space-y-2">
              <Label htmlFor="role">Peran</Label>
              <Input id="role" value={userProfile?.role || 'Pengguna'} readOnly />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;