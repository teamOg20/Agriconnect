import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Sprout, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';

const ProfileCompletion = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userType, setUserType] = useState<string>('');
  
  const [farmerData, setFarmerData] = useState({
    location: '',
    soil_type: '',
    major_crops: '',
    field_size: '',
  });

  const [businessmanData, setBusinessmanData] = useState({
    location: '',
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signin');
      return;
    }

    if (user) {
      checkProfile();
    }
  }, [user, authLoading, navigate]);

  const checkProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      if (!data) {
        navigate('/signin');
        return;
      }

      setUserType(data.user_type);

      // Check if profile is already complete
      if (data.user_type === 'farmer') {
        if (data.location && data.soil_type && data.major_crops && data.field_size) {
          navigate('/dashboard');
          return;
        }
      } else if (data.user_type === 'businessman') {
        if (data.location) {
          navigate('/dashboard');
          return;
        }
      }
    } catch (error) {
      console.error('Error checking profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFarmerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!farmerData.location || !farmerData.soil_type || !farmerData.major_crops || !farmerData.field_size) {
      toast({
        title: 'Incomplete Form',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const cropsArray = farmerData.major_crops.split(',').map(crop => crop.trim()).filter(crop => crop);

      const { error } = await supabase
        .from('users')
        .update({
          location: farmerData.location,
          soil_type: farmerData.soil_type,
          major_crops: cropsArray,
          field_size: farmerData.field_size,
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: 'Profile Updated!',
        description: 'Your farmer profile has been completed successfully.',
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBusinessmanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!businessmanData.location) {
      toast({
        title: 'Incomplete Form',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          location: businessmanData.location,
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: 'Profile Updated!',
        description: 'Your business profile has been completed successfully.',
      });

      navigate('/dashboard');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8 shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2">Complete Your Profile</h1>
                <p className="text-muted-foreground">
                  Help us personalize your experience
                </p>
              </div>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                {userType === 'farmer' ? (
                  <Sprout className="w-8 h-8 text-primary" />
                ) : (
                  <Briefcase className="w-8 h-8 text-primary" />
                )}
              </div>
            </div>

            {userType === 'farmer' ? (
              <form onSubmit={handleFarmerSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    type="text"
                    placeholder="City, State"
                    value={farmerData.location}
                    onChange={(e) => setFarmerData({ ...farmerData, location: e.target.value })}
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="soil_type">Soil Type</Label>
                  <Input
                    id="soil_type"
                    type="text"
                    placeholder="e.g., Clay, Sandy, Loamy"
                    value={farmerData.soil_type}
                    onChange={(e) => setFarmerData({ ...farmerData, soil_type: e.target.value })}
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="major_crops">Major Crops</Label>
                  <Input
                    id="major_crops"
                    type="text"
                    placeholder="e.g., Wheat, Rice, Corn (separate with commas)"
                    value={farmerData.major_crops}
                    onChange={(e) => setFarmerData({ ...farmerData, major_crops: e.target.value })}
                    disabled={submitting}
                    required
                  />
                  <p className="text-sm text-muted-foreground">Separate multiple crops with commas</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="field_size">Field Size</Label>
                  <Input
                    id="field_size"
                    type="text"
                    placeholder="e.g., 10 acres, 5 hectares"
                    value={farmerData.field_size}
                    onChange={(e) => setFarmerData({ ...farmerData, field_size: e.target.value })}
                    disabled={submitting}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Profile...
                    </>
                  ) : (
                    'Complete Profile'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleBusinessmanSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="location">Business Location</Label>
                  <Input
                    id="location"
                    type="text"
                    placeholder="City, State"
                    value={businessmanData.location}
                    onChange={(e) => setBusinessmanData({ ...businessmanData, location: e.target.value })}
                    disabled={submitting}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Profile...
                    </>
                  ) : (
                    'Complete Profile'
                  )}
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletion;
