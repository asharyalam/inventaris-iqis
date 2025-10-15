import { useSession } from "@/components/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Dashboard from "./Dashboard";
import AdminDashboard from "./AdminDashboard";
import MainLayout from "@/components/MainLayout"; // Import MainLayout

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

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name, instansi, role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error("Index - Error fetching profile:", error);
        } else if (data) {
          setProfile(data);
        }
      }
      setProfileLoading(false);
    };

    if (!isLoading && user) {
      fetchProfile();
    } else if (!isLoading && !user) {
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  if (isLoading || profileLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session || !profile) {
    navigate('/login');
    return null;
  }

  const userFirstName = profile.first_name || user.email || '';
  const userInstansi = profile.instansi || 'N/A';
  const userRole = profile.role || 'Pengguna';

  return (
    <MainLayout firstName={userFirstName} instansi={userInstansi} role={userRole}>
      {profile.role === 'Admin' ? (
        <AdminDashboard />
      ) : (
        <Dashboard />
      )}
    </MainLayout>
  );
};

export default Index;