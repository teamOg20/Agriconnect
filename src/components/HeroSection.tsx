import { ArrowRight, MessageCircle, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroFarm from '@/assets/hero-farm.jpg';

interface HeroSectionProps {
  onOpenChat?: () => void;
}

const HeroSection = ({ onOpenChat }: HeroSectionProps) => {
  const scrollToSection = (href: string) => {
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroFarm} 
          alt="Modern sustainable farming with AI technology overlay"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6 animate-fade-in">
              <span className="text-sm font-medium text-white">🌱 India's #1 Farming Super-App</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 animate-slide-up">
              <span className="block">AgriConnect</span>
              <span className="block text-3xl lg:text-4xl font-normal text-white/90 mt-2">
                Connecting Farmers to the Future
              </span>
            </h1>

            {/* Description */}
            <p className="text-xl text-white/90 mb-8 max-w-2xl animate-slide-up" style={{ animationDelay: '0.2s' }}>
              Bridge the gap between farmers and markets. Get the right price for your crops, 
              access fertilizers directly, and fight inflation with our AI-powered platform.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <Button 
                onClick={() => scrollToSection('#marketplace')}
                className="btn-hero group"
                size="lg"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Explore Marketplace
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button 
                onClick={onOpenChat}
                variant="outline"
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                size="lg"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Talk to AI Assistant
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 mt-12 animate-fade-in" style={{ animationDelay: '0.6s' }}>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">200+</div>
                <div className="text-sm text-white/70">Features</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">10K+</div>
                <div className="text-sm text-white/70">Farmers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">₹50Cr+</div>
                <div className="text-sm text-white/70">Transactions</div>
              </div>
            </div>
          </div>

          {/* Floating Elements */}
          <div className="hidden lg:block relative">
            <div className="animate-float" style={{ animationDelay: '0.5s' }}>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-6">
                <div className="text-white/90 text-sm mb-2">Live Market Price</div>
                <div className="text-white text-2xl font-bold">Tomato: ₹25/kg</div>
                <div className="text-green-400 text-sm">↗ +12% from last week</div>
              </div>
            </div>

            <div className="animate-float" style={{ animationDelay: '1s' }}>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                <div className="text-white/90 text-sm mb-2">AI Recommendation</div>
                <div className="text-white text-lg">🌾 Best time to sell wheat</div>
                <div className="text-white/70 text-sm">High demand in Delhi NCR</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;