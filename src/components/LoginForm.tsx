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
import { Link, useNavigate } from 'react-router-dom';
import { AuthApiError } from '@supabase/supabase-js';

const formSchema = z.object({
  email: z.string().email({ message: "Masukkan alamat email yang valid." }),
  password: z.string().min(1, { message: "Kata sandi tidak boleh kosong." }),
});

const LoginForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const { email, password } = values;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error instanceof AuthApiError) {
        // Supabase often returns generic "Invalid login credentials" for security.
        // We'll try to parse it, but a combined message is often the most secure fallback.
        if (error.message.includes("Invalid login credentials")) {
          // This message typically covers both email not found and wrong password.
          // For security, Supabase doesn't differentiate to prevent user enumeration.
          showError("Email atau kata sandi yang dimasukkan salah.");
        } else if (error.message.includes("Email not confirmed")) {
          showError("Email Anda belum diverifikasi. Silakan periksa kotak masuk Anda.");
        } else {
          showError(`Gagal masuk: ${error.message}`);
        }
      } else {
        showError(`Gagal masuk: ${error.message}`);
      }
    } else {
      showSuccess("Berhasil masuk!");
      form.reset();
      // Redirection is handled by SessionContextProvider in App.tsx
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
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Masuk...' : 'Masuk'}
        </Button>
        <div className="mt-4 text-center text-sm">
          <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
            Lupa kata sandi?
          </Link>
        </div>
      </form>
    </Form>
  );
};

export default LoginForm;