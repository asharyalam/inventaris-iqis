"use client";

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/components/SessionContextProvider';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { session, isLoading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && session) {
      navigate('/'); // Redirect authenticated users to the main page
    }
  }, [session, isLoading, navigate]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Masuk ke akun Anda
          </h2>
        </div>
        <Auth
          supabaseClient={supabase}
          providers={[]} // Anda bisa menambahkan 'google', 'github', dll. di sini jika diperlukan
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--primary-foreground))',
                },
              },
            },
          }}
          theme="light"
          redirectTo={window.location.origin} // Redirect ke halaman utama setelah login
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email Anda',
                password_label: 'Kata Sandi Anda',
                email_input_placeholder: 'Masukkan email Anda',
                password_input_placeholder: 'Masukkan kata sandi Anda',
                button_label: 'Masuk',
                social_auth_text: 'Atau masuk dengan',
                link_text: 'Sudah punya akun? Masuk',
                forgotten_password_text: 'Lupa kata sandi?',
                confirmation_text: 'Periksa email Anda untuk tautan konfirmasi',
              },
              sign_up: {
                email_label: 'Email Anda',
                password_label: 'Kata Sandi Anda',
                email_input_placeholder: 'Masukkan email Anda',
                password_input_placeholder: 'Buat kata sandi Anda',
                button_label: 'Daftar',
                social_auth_text: 'Atau daftar dengan',
                link_text: 'Belum punya akun? Daftar',
                confirmation_text: 'Periksa email Anda untuk tautan konfirmasi',
              },
              forgotten_password: {
                email_label: 'Email Anda',
                email_input_placeholder: 'Masukkan email Anda',
                button_label: 'Kirim instruksi reset',
                link_text: 'Lupa kata sandi?',
                confirmation_text: 'Periksa email Anda untuk tautan reset kata sandi',
              },
              update_password: {
                password_label: 'Kata Sandi Baru',
                password_input_placeholder: 'Masukkan kata sandi baru Anda',
                button_label: 'Perbarui kata sandi',
                confirmation_text: 'Kata sandi Anda telah diperbarui',
              },
            },
          }}
        />
      </div>
    </div>
  );
};

export default Login;