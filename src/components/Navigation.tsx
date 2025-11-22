import { useState } from 'react';
import { Menu, X, Sprout, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const navItems = [
    { name: t('nav.home'), href: '/' },
    { name: t('nav.marketplace'), href: '/marketplace' },
    { name: t('nav.orders'), href: '/orders' },
    { name: t('nav.orderHistory'), href: '/order-history' },
    { name: t('nav.vendors'), href: '/vendors' },
    { name: t('nav.fertilizerFriend'), href: '/fertilizer' },
    { name: t('nav.search'), href: '/search' },
    { name: t('nav.aboutUs'), href: '/about' },
    { name: t('nav.bio'), href: '/dashboard' },
  ];

  const handleNavigation = (href: string) => {
    if (href.startsWith('/')) {
      navigate(href);
    } else {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    navigate('/signin');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => handleNavigation('/')}>
            <div className="w-10 h-10 bg-gradient-hero rounded-lg flex items-center justify-center">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">AgriConnect</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-1">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  className="nav-link px-3 py-2 rounded-md text-sm font-medium"
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-2">
            <LanguageSwitcher />
            {user ? (
              <>
                {user.email === 'admin@agriconnect.com' && (
                  <Button 
                    onClick={() => handleNavigation('/admin')}
                    variant="outline"
                  >
                    {t('nav.admin')}
                  </Button>
                )}
                <Button 
                  onClick={handleSignOut}
                  variant="ghost"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('nav.logout')}
                </Button>
              </>
            ) : (
              <>
                <Button 
                  onClick={() => handleNavigation('/signin')}
                  variant="ghost"
                >
                  {t('nav.signIn')}
                </Button>
                <Button 
                  onClick={() => handleNavigation('/usertype')}
                  className="btn-hero"
                >
                  {t('nav.register')}
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-foreground hover:text-primary focus:outline-none"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-background border-t border-border">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-foreground hover:text-primary hover:bg-muted transition-smooth"
              >
                {item.name}
              </button>
            ))}
            <div className="px-3 py-2">
              <LanguageSwitcher />
            </div>
            {user ? (
              <>
                {user.email === 'admin@agriconnect.com' && (
                  <button
                    onClick={() => handleNavigation('/admin')}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-foreground hover:text-primary hover:bg-muted transition-smooth"
                  >
                    {t('nav.admin')}
                  </button>
                )}
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-foreground hover:text-primary hover:bg-muted transition-smooth"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <div className="space-y-2 mt-4">
                <Button 
                  onClick={() => handleNavigation('/signin')}
                  variant="ghost"
                  className="w-full"
                >
                  {t('nav.signIn')}
                </Button>
                <Button 
                  onClick={() => handleNavigation('/usertype')}
                  className="btn-hero w-full"
                >
                  {t('nav.register')}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
