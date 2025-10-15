"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SignUpForm from '@/components/SignUpForm'; // Import the new sign-up form

const Login = () => {
  const { session, isLoading, isAdmin } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && session) {
      if (isAdmin) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [session, isLoading, isAdmin, navigate]);

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
                }, // Kurung kurawal ekstra telah dihapus di sini
              }}
              theme="light"
              redirectTo={window.location.origin} // Redirect to current origin after auth
            />
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