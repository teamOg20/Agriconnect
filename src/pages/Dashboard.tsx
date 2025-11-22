import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Mail, Phone, Calendar, Briefcase, Sprout, CheckCircle2, XCircle } from 'lucide-react';
import Navigation from '@/components/Navigation';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  user_type: string;
  created_at: string;
  city: string | null;
  state: string | null;
  pincode: string | null;
  soil_type: string | null;
  major_crops: string[] | null;
  field_size: string | null;
  annual_income: string | null;
  credit_score: string | null;
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const calculateProfileCompletion = (profile: UserProfile) => {
    const baseFields = [
      { name: 'Full Name', value: profile.full_name, required: true },
      { name: 'Email', value: profile.email, required: true },
      { name: 'Phone', value: profile.phone, required: true },
      { name: 'City', value: profile.city, required: true },
      { name: 'State', value: profile.state, required: true },
      { name: 'Pincode', value: profile.pincode, required: true },
      { name: 'Annual Income', value: profile.annual_income, required: true },
      { name: 'Credit Score', value: profile.credit_score, required: true },
    ];

    const farmerFields = [
      { name: 'Soil Type', value: profile.soil_type, required: true },
      { name: 'Major Crops', value: profile.major_crops, required: true },
      { name: 'Field Size', value: profile.field_size, required: true },
    ];

    const allFields = profile.user_type === 'farmer' 
      ? [...baseFields, ...farmerFields]
      : baseFields;

    const filledFields = allFields.filter(field => {
      if (Array.isArray(field.value)) {
        return field.value && field.value.length > 0;
      }
      return field.value && field.value.toString().trim() !== '';
    });

    const percentage = Math.round((filledFields.length / allFields.length) * 100);

    return {
      percentage,
      totalFields: allFields.length,
      filledFields: filledFields.length,
      fields: allFields.map(field => ({
        ...field,
        filled: Array.isArray(field.value) 
          ? field.value && field.value.length > 0
          : field.value && field.value.toString().trim() !== ''
      }))
    };
  };

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
    // Don't redirect, just return completion status
    if (profile.user_type === 'farmer') {
      if (!profile.city || !profile.state || !profile.pincode || !profile.soil_type || !profile.major_crops || !profile.field_size || !profile.annual_income || !profile.credit_score) {
        return false;
      }
    } else if (profile.user_type === 'businessman') {
      if (!profile.city || !profile.state || !profile.pincode || !profile.annual_income || !profile.credit_score) {
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
        .maybeSingle();

      if (error) throw error;
      
      // Show profile even if incomplete
      if (data) {
        setProfile(data);
      } else {
        // If no profile exists in users table, create one from auth metadata
        const newProfile: UserProfile = {
          id: user?.id || '',
          full_name: user?.user_metadata?.full_name || '',
          email: user?.email || '',
          phone: user?.user_metadata?.phone || '',
          user_type: user?.user_metadata?.user_type || '',
          created_at: new Date().toISOString(),
          city: null,
          state: null,
          pincode: null,
          soil_type: null,
          major_crops: null,
          field_size: null,
          annual_income: null,
          credit_score: null,
        };
        setProfile(newProfile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Even on error, show basic profile from auth
      if (user) {
        const basicProfile: UserProfile = {
          id: user.id,
          full_name: user.user_metadata?.full_name || '',
          email: user.email || '',
          phone: user.user_metadata?.phone || '',
          user_type: user.user_metadata?.user_type || '',
          created_at: new Date().toISOString(),
          city: null,
          state: null,
          pincode: null,
          soil_type: null,
          major_crops: null,
          field_size: null,
          annual_income: null,
          credit_score: null,
        };
        setProfile(basicProfile);
      }
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
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  const completionData = calculateProfileCompletion(profile);
  const isIncomplete = completionData.percentage < 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navigation />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">My Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {profile.full_name || 'User'}!</p>
            {isIncomplete && (
              <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-sm text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Your profile is incomplete. Complete it to unlock all features.
                  <Button 
                    onClick={() => navigate('/profile-completion')}
                    size="sm"
                    variant="outline"
                    className="ml-2"
                  >
                    Complete Now
                  </Button>
                </p>
              </div>
            )}
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

            {/* Profile Completion Progress */}
            <div className="mb-8 p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold mb-1">Profile Completion</h3>
                  <p className="text-sm text-muted-foreground">
                    {completionData.filledFields} of {completionData.totalFields} fields completed
                  </p>
                </div>
                <Badge 
                  variant={completionData.percentage === 100 ? "default" : "secondary"}
                  className="text-lg px-4 py-2"
                >
                  {completionData.percentage}%
                </Badge>
              </div>
              
              <Progress value={completionData.percentage} className="h-3 mb-4" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {completionData.fields.map((field, index) => (
                  <div 
                    key={index}
                    className={`flex items-center gap-2 text-sm ${
                      field.filled ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {field.filled ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className={field.filled ? 'font-medium' : ''}>
                      {field.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bio Section */}
            <div className="mb-8 p-6 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-start gap-6 mb-6">
                {/* Profile Logo */}
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0 shadow-lg">
                  {profile.user_type === 'farmer' ? (
                    <Sprout className="w-12 h-12 text-white" />
                  ) : (
                    <Briefcase className="w-12 h-12 text-white" />
                  )}
                </div>
                
                {/* Bio Header */}
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-1">{profile.full_name}</h3>
                  <p className="text-lg text-muted-foreground capitalize mb-2">{profile.user_type}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Member since {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</span>
                  </div>
                </div>
              </div>

              {/* Bio Information - Line by Line */}
              <div className="space-y-3 pl-2 border-l-4 border-primary/30 ml-2">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <span className="text-sm text-muted-foreground">Email: </span>
                    <span className="font-medium">{profile.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                  <div>
                    <span className="text-sm text-muted-foreground">Phone: </span>
                    <span className="font-medium">{profile.phone}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <span className="text-sm text-muted-foreground">Location: </span>
                    <span className={`font-medium ${!profile.city ? 'text-muted-foreground italic' : ''}`}>
                      {profile.city && profile.state && profile.pincode 
                        ? `${profile.city}, ${profile.state} - ${profile.pincode}`
                        : 'Not provided'}
                    </span>
                  </div>
                </div>

                {profile.user_type === 'farmer' && (
                  <>
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
                      </svg>
                      <div>
                        <span className="text-sm text-muted-foreground">Field Size: </span>
                        <span className={`font-medium ${!profile.field_size ? 'text-muted-foreground italic' : ''}`}>
                          {profile.field_size || 'Not provided'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M3 7v1a3 3 0 003 3h12a3 3 0 003-3V7m-18 0V5a2 2 0 012-2h14a2 2 0 012 2v2M3 7h18" />
                      </svg>
                      <div>
                        <span className="text-sm text-muted-foreground">Soil Type: </span>
                        <span className={`font-medium ${!profile.soil_type ? 'text-muted-foreground italic' : ''}`}>
                          {profile.soil_type || 'Not provided'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Sprout className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-sm text-muted-foreground">Major Crops: </span>
                        <span className={`font-medium ${!profile.major_crops || profile.major_crops.length === 0 ? 'text-muted-foreground italic' : ''}`}>
                          {profile.major_crops && profile.major_crops.length > 0 
                            ? profile.major_crops.join(', ') 
                            : 'Not provided'}
                        </span>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <span className="text-sm text-muted-foreground">Annual Income: </span>
                    <span className={`font-medium ${!profile.annual_income ? 'text-muted-foreground italic' : ''}`}>
                      {profile.annual_income === 'less-than-25000' && 'Less than ₹25,000'}
                      {profile.annual_income === '25000-50000' && '₹25,000 - ₹50,000'}
                      {profile.annual_income === '50000-75000' && '₹50,000 - ₹75,000'}
                      {profile.annual_income === '75000-100000' && '₹75,000 - ₹1,00,000'}
                      {profile.annual_income === 'more-than-100000' && 'More than ₹1,00,000'}
                      {!profile.annual_income && 'Not provided'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <div>
                    <span className="text-sm text-muted-foreground">Credit Score: </span>
                    <span className={`font-medium ${!profile.credit_score ? 'text-muted-foreground italic' : ''}`}>
                      {profile.credit_score ? `${profile.credit_score}/10` : 'Not provided'}
                    </span>
                  </div>
                </div>
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

              {profile.city && (
                <div className="flex items-start space-x-4">
                  <svg className="w-5 h-5 text-muted-foreground mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-muted-foreground">City</p>
                    <p className="font-semibold">{profile.city}</p>
                  </div>
                </div>
              )}

              {profile.state && (
                <div className="flex items-start space-x-4">
                  <svg className="w-5 h-5 text-muted-foreground mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-muted-foreground">State</p>
                    <p className="font-semibold">{profile.state}</p>
                  </div>
                </div>
              )}

              {profile.pincode && (
                <div className="flex items-start space-x-4">
                  <svg className="w-5 h-5 text-muted-foreground mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <p className="text-sm text-muted-foreground">Pincode</p>
                    <p className="font-semibold">{profile.pincode}</p>
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

              {profile.annual_income && (
                <div className="flex items-start space-x-4">
                  <svg className="w-5 h-5 text-muted-foreground mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm text-muted-foreground">Annual Income</p>
                    <p className="font-semibold">
                      {profile.annual_income === 'less-than-25000' && 'Less than ₹25,000'}
                      {profile.annual_income === '25000-50000' && '₹25,000 - ₹50,000'}
                      {profile.annual_income === '50000-75000' && '₹50,000 - ₹75,000'}
                      {profile.annual_income === '75000-100000' && '₹75,000 - ₹1,00,000'}
                      {profile.annual_income === 'more-than-100000' && 'More than ₹1,00,000'}
                    </p>
                  </div>
                </div>
              )}

              {profile.credit_score && (
                <div className="flex items-start space-x-4">
                  <svg className="w-5 h-5 text-muted-foreground mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <div>
                    <p className="text-sm text-muted-foreground">Credit Score</p>
                    <p className="font-semibold">{profile.credit_score}/10</p>
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