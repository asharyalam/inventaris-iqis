import { MadeWithDyad } from "@/components/made-with-dyad";
import { useSession } from "@/components/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

interface UserProfile {
  first_name: string;
  last_name: string;
  instansi: string;
  role: string;
}

const Index = () => {
  const { user, session, isLoading } = useSession();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  console.log("Index component rendering.");
  console.log("Index - isLoading (session):", isLoading);
  console.log("Index - profileLoading:", profileLoading);
  console.log("Index - session:", session);
  console.log("Index - user:", user);
  console.log("Index - profile data:", profile);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        console.log("Index - Fetching profile for user:", user.id);
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, instansi, role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Index - Error fetching profile:", error);
        } else if (data) {
          console.log("Index - Profile data fetched:", data);
          setProfile(data);
        } else {
          console.log("Index - No profile found for user, data is null.");
        }
      } else {
        console.log("Index - User is null, cannot fetch profile.");
      }
      setProfileLoading(false);
      console.log("Index - profileLoading set to false.");
    };

    if (!isLoading && user) {
      fetchProfile();
    } else if (!isLoading && !user) {
      console.log("Index - Not loading, but no user. Redirecting to /login.");
      navigate('/login');
    } else if (isLoading) {
      console.log("Index - Session still loading, waiting...");
    }
  }, [user, isLoading, navigate]);

  const handleLogout = async () => {
    console.log("Index - Logging out...");
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (isLoading || profileLoading) {
    console.log("Index - Displaying loading screen.");
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    console.log("Index - No session found after loading, returning null (should be redirected by ProtectedRoute).");
    return null; // Should be redirected by ProtectedRoute
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      {/* TEMPORARY DEBUG INDICATOR */}
      <div className="absolute top-0 left-0 bg-red-500 text-white p-2 text-xs z-50">
        INDEX COMPONENT IS RENDERING
      </div>
      {/* END TEMPORARY DEBUG INDICATOR */}

      <div className="text-center bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-5xl font-extrabold text-gray-900 mb-6">Sistem Inventaris Barang IQIS</h1> {/* Judul Aplikasi */}
        <h2 className="text-4xl font-bold mb-4">Selamat Datang, {profile?.first_name || user?.email}!</h2>
        {profile && (
          <div className="mb-4 text-lg text-gray-700">
            <p><strong>Instansi:</strong> {profile.instansi}</p>
            <p><strong>Peran:</strong> {profile.role}</p>
          </div>
        )}
        <p className="text-xl text-gray-600 mb-6">
          Anda telah berhasil masuk.
        </p>
        <Button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white">
          Logout
        </Button>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;