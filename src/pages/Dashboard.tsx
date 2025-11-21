import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, User, Mail, Phone, Calendar, Briefcase, Sprout } from 'lucide-react';
import Navigation from '@/components/Navigation';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  user_type: string;
  created_at: string;
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signin');
      return;
    }

    if (user) {
      fetchProfile();
    }
  }, [user, authLoading, navigate]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Not Found</h1>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">My Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {profile.full_name}!</p>
          </div>

          <Card className="p-8 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">Profile Information</h2>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                {profile.user_type === 'farmer' ? (
                  <Sprout className="w-8 h-8 text-primary" />
                ) : (
                  <Briefcase className="w-8 h-8 text-primary" />
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Full Name</p>
                  <p className="font-semibold">{profile.full_name}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Email Address</p>
                  <p className="font-semibold">{profile.email}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Phone Number</p>
                  <p className="font-semibold">{profile.phone}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                {profile.user_type === 'farmer' ? (
                  <Sprout className="w-5 h-5 text-muted-foreground mt-0.5" />
                ) : (
                  <Briefcase className="w-5 h-5 text-muted-foreground mt-0.5" />
                )}
                <div>
                  <p className="text-sm text-muted-foreground">User Type</p>
                  <p className="font-semibold capitalize">{profile.user_type}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Member Since</p>
                  <p className="font-semibold">
                    {new Date(profile.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t flex gap-4">
              <Button onClick={() => navigate('/marketplace')} className="flex-1">
                Browse Marketplace
              </Button>
              <Button onClick={() => navigate('/orders')} variant="outline" className="flex-1">
                View Orders
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;