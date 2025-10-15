"use client";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "@/components/SessionContextProvider";
import { MadeWithDyad } from "@/components/made-with-dyad";

const Index = () => {
  const { session, isLoading, isAdmin, isHeadmaster } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (session) {
        if (isAdmin) {
          navigate('/admin/dashboard', { replace: true });
        } else if (isHeadmaster) {
          navigate('/headmaster/dashboard', { replace: true }); // Redirect Headmaster
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        navigate('/login', { replace: true });
      }
    }
  }, [session, isLoading, isAdmin, isHeadmaster, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Memuat Aplikasi...</h1>
          <p className="text-xl text-gray-600">Harap tunggu sebentar.</p>
        </div>
        <MadeWithDyad />
      </div>
    );
  }

  return null; // Will redirect, so no content needed here
};

export default Index;