"use client";

import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SignUpForm from '@/components/SignUpForm';
import { showSuccess } from '@/utils/toast';
import LoginForm from '@/components/LoginForm'; // Import the new LoginForm

const Login = () => {
  const { session, isLoading, canAccessAdminDashboard } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && session) {
      if (canAccessAdminDashboard) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [session, isLoading, canAccessAdminDashboard, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset') === 'true') {
      showSuccess("Kata sandi Anda berhasil direset. Silakan masuk dengan kata sandi baru Anda.");
      // Clear the query parameter to prevent showing the toast again on refresh
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('reset');
      window.history.replaceState({}, document.title, newUrl.toString());
    }
  }, []);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Memuat...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Sistem Manajemen Barang SMPIT IQIS</h1>
          <img src="/favicon.png" alt="Logo Aplikasi" className="h-24 w-24 object-contain mx-auto" />
        </div>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Masuk</TabsTrigger>
            <TabsTrigger value="signup">Daftar</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <h2 className="mt-6 text-center text-xl font-extrabold text-gray-900">
              Masuk ke Akun Anda
            </h2>
            <LoginForm />
          </TabsContent>
          <TabsContent value="signup">
            <h2 className="mt-6 text-center text-xl font-extrabold text-gray-900">
              Buat Akun Baru
            </h2>
            <SignUpForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Login;