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
import { Link } from 'react-router-dom';

const formSchema = z.object({
  email: z.string().email({ message: "Masukkan alamat email yang valid." }),
});

const ForgotPassword = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const { email } = values;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login?reset=true`, // Redirect back to login after reset request
    });

    if (error) {
      showError(`Gagal mengirim tautan reset kata sandi: ${error.message}`);
    } else {
      showSuccess("Tautan reset kata sandi telah dikirim ke email Anda. Silakan periksa kotak masuk Anda.");
      form.reset();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Lupa Kata Sandi Anda?
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Masukkan email Anda dan kami akan mengirimkan tautan untuk mereset kata sandi Anda.
        </p>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Mengirim...' : 'Kirim Tautan Reset Kata Sandi'}
            </Button>
          </form>
        </Form>
        <div className="text-center text-sm">
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Kembali ke Halaman Masuk
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;