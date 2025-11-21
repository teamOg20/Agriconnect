import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sprout, Briefcase, Home } from 'lucide-react';

const UserType = () => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<'farmer' | 'businessman' | null>(null);

  const handleSelection = (type: 'farmer' | 'businessman') => {
    setSelectedType(type);
    sessionStorage.setItem('selectedUserType', type);
    setTimeout(() => {
      navigate('/register');
    }, 300);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            <Home className="w-4 h-4 mr-1" />
            Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Welcome! Please Choose Your Role
          </h1>
          <p className="text-muted-foreground text-lg">
            Select the option that best describes you
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Farmer Card */}
          <Card
            className={`p-8 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 ${
              selectedType === 'farmer'
                ? 'border-primary bg-primary/5 scale-105'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => handleSelection('farmer')}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Sprout className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Farmer</h2>
              <p className="text-muted-foreground">
                For individuals involved in agriculture, farming, livestock, or crop management.
              </p>
              <Button
                variant={selectedType === 'farmer' ? 'default' : 'outline'}
                className="w-full mt-4"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelection('farmer');
                }}
              >
                Select Farmer
              </Button>
            </div>
          </Card>

          {/* Businessman Card */}
          <Card
            className={`p-8 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 ${
              selectedType === 'businessman'
                ? 'border-primary bg-primary/5 scale-105'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => handleSelection('businessman')}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Briefcase className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Businessman</h2>
              <p className="text-muted-foreground">
                For entrepreneurs, shop owners, traders, or business service providers.
              </p>
              <Button
                variant={selectedType === 'businessman' ? 'default' : 'outline'}
                className="w-full mt-4"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelection('businessman');
                }}
              >
                Select Businessman
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default UserType;