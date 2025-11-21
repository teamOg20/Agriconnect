import { useState } from 'react';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import ProblemSection from '@/components/ProblemSection';
import SolutionSection from '@/components/SolutionSection';
import FeaturesSection from '@/components/FeaturesSection';
import MarketplaceSection from '@/components/MarketplaceSection';
import FertilizerSection from '@/components/FertilizerSection';
import AIChatbotSection from '@/components/AIChatbotSection';
import PricingSection from '@/components/PricingSection';
import Footer from '@/components/Footer';
import FloatingAIChat from '@/components/FloatingAIChat';

const Index = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="min-h-screen">
      <Navigation />
      <FloatingAIChat isOpen={isChatOpen} onOpenChange={setIsChatOpen} />
      <div id="hero">
        <HeroSection onOpenChat={() => setIsChatOpen(true)} />
      </div>
      <div id="problem">
        <ProblemSection />
      </div>
      <div id="solution">
        <SolutionSection />
      </div>
      <div id="features">
        <FeaturesSection />
      </div>
      <div id="marketplace">
        <MarketplaceSection />
      </div>
      <div id="fertilizer">
        <FertilizerSection />
      </div>
      <div id="pricing">
        <PricingSection />
      </div>
      <div id="footer">
        <Footer />
      </div>
    </div>
  );
};

export default Index;
