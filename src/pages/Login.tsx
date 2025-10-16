"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SignUpForm from '@/components/SignUpForm'; // Import the new sign-up form
import { showSuccess } from '@/utils/toast'; // Import showSuccess

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
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Masuk</TabsTrigger>
            <TabsTrigger value="signup">Daftar</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Masuk ke Akun Anda
            </h2>
            <Auth
              supabaseClient={supabase}
              providers={[]}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: 'hsl(222.2 47.4% 11.2%)', // primary color
                      brandAccent: 'hsl(217.2 91.2% 59.8%)', // accent color
                    },
                  },
                },
              }}
              theme="light"
              redirectTo={window.location.origin}
            />
            <div className="mt-4 text-center text-sm">
              <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                Lupa kata sandi?
              </Link>
            </div>
          </TabsContent>
          <TabsContent value="signup">
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
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