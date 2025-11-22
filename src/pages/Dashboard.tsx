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
  location: string | null;
  soil_type: string | null;
  major_crops: string[] | null;
  field_size: string | null;
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

  const checkProfileCompletion = (profile: UserProfile) => {
    if (profile.user_type === 'farmer') {
      if (!profile.location || !profile.soil_type || !profile.major_crops || !profile.field_size) {
        navigate('/profile-completion');
        return false;
      }
    } else if (profile.user_type === 'businessman') {
      if (!profile.location) {
        navigate('/profile-completion');
        return false;
      }
    }
    return true;
  };

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      
      if (data && checkProfileCompletion(data)) {
        setProfile(data);
      }
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

              {profile.location && (
                <div className="flex items-start space-x-4">
                  <svg className="w-5 h-5 text-muted-foreground mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-semibold">{profile.location}</p>
                  </div>
                </div>
              )}

              {profile.user_type === 'farmer' && profile.soil_type && (
                <div className="flex items-start space-x-4">
                  <svg className="w-5 h-5 text-muted-foreground mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M3 7v1a3 3 0 003 3h12a3 3 0 003-3V7m-18 0V5a2 2 0 012-2h14a2 2 0 012 2v2M3 7h18" />
                  </svg>
                  <div>
                    <p className="text-sm text-muted-foreground">Soil Type</p>
                    <p className="font-semibold">{profile.soil_type}</p>
                  </div>
                </div>
              )}

              {profile.user_type === 'farmer' && profile.major_crops && (
                <div className="flex items-start space-x-4">
                  <Sprout className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Major Crops</p>
                    <p className="font-semibold">{profile.major_crops.join(', ')}</p>
                  </div>
                </div>
              )}

              {profile.user_type === 'farmer' && profile.field_size && (
                <div className="flex items-start space-x-4">
                  <svg className="w-5 h-5 text-muted-foreground mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                  </svg>
                  <div>
                    <p className="text-sm text-muted-foreground">Field Size</p>
                    <p className="font-semibold">{profile.field_size}</p>
                  </div>
                </div>
              )}
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