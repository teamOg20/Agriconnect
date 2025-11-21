import { Target, Heart, Award, Mail, Phone, MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Navigation from '@/components/Navigation';
import FloatingAIChat from '@/components/FloatingAIChat';

const About = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thank you for your message! We will get back to you soon.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navigation />
      <FloatingAIChat />
      
      <div className="pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              About AgriConnect
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Empowering farmers with technology to create a more sustainable and profitable agriculture ecosystem
            </p>
          </div>

          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <Card className="card-field p-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
              <p className="text-gray-600 leading-relaxed">
                To revolutionize agriculture by connecting farmers directly with markets, eliminating middlemen, 
                and ensuring fair prices for quality produce. We leverage AI and technology to empower farmers 
                with real-time market insights, quality fertilizers, and expert guidance.
              </p>
            </Card>

            <Card className="card-field p-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <Heart className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Vision</h3>
              <p className="text-gray-600 leading-relaxed">
                To create a world where every farmer has access to fair markets, modern technology, and sustainable 
                farming practices. We envision an agriculture ecosystem that is profitable for farmers, affordable 
                for consumers, and sustainable for our planet.
              </p>
            </Card>
          </div>

          {/* Our Story */}
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Our Story</h2>
            <div className="max-w-4xl mx-auto">
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                AgriConnect was born from a simple observation: farmers in India were struggling to get fair prices 
                for their crops while consumers in cities were paying high prices for the same produce. The problem? 
                Multiple layers of middlemen who were taking significant cuts without adding real value.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                Our founder, while visiting rural Punjab, met farmers who were selling tomatoes at ₹8 per kg, 
                while the same tomatoes were being sold at ₹35 per kg in Delhi markets. This massive price gap 
                inspired the creation of AgriConnect - a platform that directly connects farmers with consumers 
                and businesses, ensuring fair prices for everyone.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Today, AgriConnect serves thousands of farmers across India, helping them access better markets, 
                quality fertilizers, and AI-powered farming advice. We're not just a marketplace - we're a 
                comprehensive platform for modern agriculture.
              </p>
            </div>
          </div>


          {/* Impact Stats */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-8 mb-16 text-white">
            <h2 className="text-3xl font-bold text-center mb-12">Our Impact</h2>
            <div className="grid md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">10,000+</div>
                <div className="text-green-100">Farmers Connected</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">₹50L+</div>
                <div className="text-green-100">Farmer Income Increased</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">100+</div>
                <div className="text-green-100">Cities Served</div>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">25%</div>
                <div className="text-green-100">Average Price Improvement</div>
              </div>
            </div>
          </div>

          {/* Contact Section */}
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Get in Touch</h2>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Phone className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Phone</div>
                    <div className="text-gray-600">+91 98765 43210</div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Email</div>
                    <div className="text-gray-600">hello@agriconnect.in</div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Address</div>
                    <div className="text-gray-600">
                      Tech Hub, Sector 18<br />
                      Gurugram, Haryana 122015
                    </div>
                  </div>
                </div>
              </div>

              {/* Awards */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <Award className="w-6 h-6 text-yellow-600 mr-2" />
                  Recognition
                </h3>
                <div className="space-y-2 text-gray-600">
                  <div>🏆 Best AgriTech Startup 2024 - India AgriTech Awards</div>
                  <div>🌟 Top 10 Social Impact Startups - TechCrunch India</div>
                  <div>🎯 Farmers' Choice Award - National Farmers Federation</div>
                </div>
              </div>
            </div>

            <Card className="card-field p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Send us a Message</h3>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <Input placeholder="First Name" required />
                  <Input placeholder="Last Name" required />
                </div>
                
                <Input type="email" placeholder="Email Address" required />
                <Input placeholder="Subject" required />
                
                <Textarea 
                  placeholder="Your Message" 
                  className="min-h-[120px]" 
                  required 
                />
                
                <Button type="submit" className="btn-hero w-full">
                  <Send className="w-5 h-5 mr-2" />
                  Send Message
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;