"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { showSuccess, showError } from '@/utils/toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from 'react-router-dom';

const instansiOptions = ["BPH", "TKIT", "SDIT", "SMPIT", "SMKIT", "BK"];

const formSchema = z.object({
  email: z.string().email({ message: "Masukkan alamat email yang valid." }),
  password: z.string().min(6, { message: "Kata sandi harus minimal 6 karakter." }),
  first_name: z.string().min(2, { message: "Nama depan harus minimal 2 karakter." }),
  last_name: z.string().min(2, { message: "Nama belakang harus minimal 2 karakter." }),
  position: z.string().min(2, { message: "Jabatan harus minimal 2 karakter." }),
  instansi: z.enum(["BPH", "TKIT", "SDIT", "SMPIT", "SMKIT", "BK"], { message: "Pilih instansi yang valid." }),
});

const SignUpForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      position: '',
      instansi: undefined,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const { email, password, first_name, last_name, position, instansi } = values;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name,
          last_name,
          position,
          instansi,
          role: 'Pengguna', // Default role for new sign-ups
        },
      },
    });

    if (error) {
      showError(`Gagal mendaftar: ${error.message}`);
    } else if (data.user) {
      showSuccess("Pendaftaran berhasil! Silakan periksa email Anda untuk verifikasi.");
      form.reset();
      navigate('/login', { replace: true }); // Redirect to login after successful sign-up
    } else {
      showError("Pendaftaran gagal. Silakan coba lagi.");
    }
    setIsSubmitting(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kata Sandi</FormLabel>
              <FormControl>
                <Input type="password" placeholder="********" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="first_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Depan</FormLabel>
              <FormControl>
                <Input placeholder="Nama Depan Anda" {...field} />
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
                <Input placeholder="Nama Belakang Anda" {...field} />
              </FormControl>
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
                <Input placeholder="Jabatan Anda" {...field} />
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Mendaftar...' : 'Daftar'}
        </Button>
      </form>
    </Form>
  );
};

export default SignUpForm;