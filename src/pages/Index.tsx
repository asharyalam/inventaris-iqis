import { useSession } from "@/components/SessionContextProvider";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Dashboard from "./Dashboard";
import AdminDashboard from "./AdminDashboard";

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
    // If session or profile is not available after loading, redirect to login
    navigate('/login');
    return null;
  }

  // Render dashboard based on user role
  if (profile.role === 'Admin') {
    return <AdminDashboard firstName={profile.first_name || user.email || ''} instansi={profile.instansi || 'N/A'} role={profile.role} />;
  } else {
    return <Dashboard firstName={profile.first_name || user.email || ''} instansi={profile.instansi || 'N/A'} role={profile.role} />;
  }
};

export default Index;