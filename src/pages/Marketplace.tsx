import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Plus, Minus, MapPin, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppContext, Product } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import Navigation from '@/components/Navigation';
import FloatingAIChat from '@/components/FloatingAIChat';

const Marketplace = () => {
  const navigate = useNavigate();
  const { cart, products, addToCart, updateCartQuantity, getTotalPrice, getTotalItems, loadProducts } = useAppContext();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      await loadProducts();
      setLoading(false);
    };
    init();
  }, []);

  const categories = ['All', 'Vegetables', 'Grains', 'Spices', 'Fruits', 'Pulses', 'Dairy', 'Poultry'];
  const priceRanges = ['All', 'Under ₹25', '₹25-₹50', '₹50-₹100', 'Above ₹100'];

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         product.vendor.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesPrice = true;
    if (priceRange !== 'All') {
      switch (priceRange) {
        case 'Under ₹25':
          matchesPrice = product.price < 25;
          break;
        case '₹25-₹50':
          matchesPrice = product.price >= 25 && product.price <= 50;
          break;
        case '₹50-₹100':
          matchesPrice = product.price > 50 && product.price <= 100;
          break;
        case 'Above ₹100':
          matchesPrice = product.price > 100;
          break;
      }
    }
    
    return matchesCategory && matchesSearch && matchesPrice;
  });

  const getCartQuantity = (productId: string) => {
    return cart.find(item => item.id === productId)?.quantity || 0;
  };

  const handleAddToCart = (product: Product) => {
    if (!user) {
      navigate('/auth');
      return;
    }
    addToCart(product);
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    updateCartQuantity(productId, newQuantity);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <Navigation />
      <FloatingAIChat />
      
      <div className="pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              AgriConnect Marketplace
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Fresh produce directly from farmers. Fair prices, quality guaranteed.
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-2xl shadow-soft p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search crops, vendors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  {priceRanges.map(range => (
                    <SelectItem key={range} value={range}>{range}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="card-field hover:shadow-xl transition-all duration-300 group">
                <div className="p-6">
                  {/* Product Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-16 h-16 flex items-center justify-center">
                      {product.image && (product.image.startsWith('http://') || product.image.startsWith('https://')) ? (
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = '🌾';
                            e.currentTarget.parentElement!.classList.add('text-4xl');
                          }}
                        />
                      ) : (
                        <span className="text-4xl">{product.image || '🌾'}</span>
                      )}
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-700">
                      In Stock
                    </Badge>
                  </div>

                  {/* Product Details */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{product.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{product.description}</p>
                  
                  <div className="flex items-center space-x-2 mb-3">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 ml-1">{product.category}</span>
                    </div>
                    <span className="text-gray-300">•</span>
                    <Badge variant="secondary" className="text-xs">
                      Stock: {product.stock_quantity}
                    </Badge>
                  </div>

                  <div className="text-xs text-gray-500 mb-3">Vendor: {product.vendor}</div>

                  {/* Pricing */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-2xl font-bold text-gray-900">₹{product.price}</span>
                      <span className="text-gray-600">/{product.unit}</span>
                    </div>
                  </div>

                  {/* Add to Cart Controls */}
                  <div className="flex items-center justify-between">
                    {getCartQuantity(product.id) > 0 ? (
                      <div className="flex items-center space-x-3 w-full">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateQuantity(product.id, getCartQuantity(product.id) - 1)}
                          className="w-8 h-8 p-0"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        
                        <span className="font-semibold text-lg flex-1 text-center">
                          {getCartQuantity(product.id)}
                        </span>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateQuantity(product.id, getCartQuantity(product.id) + 1)}
                          className="w-8 h-8 p-0"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleAddToCart(product)}
                        className="btn-success w-full"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {getTotalItems() > 0 && (
            <div className="fixed bottom-24 right-6 bg-white rounded-2xl shadow-2xl border p-6 z-40 min-w-[300px]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-gray-900">Your Cart</h4>
                <Badge className="bg-green-100 text-green-700">
                  {getTotalItems()} items
                </Badge>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-bold">Total: ₹{getTotalPrice()}</span>
                </div>
                
                <Button className="btn-hero w-full" onClick={() => navigate('/checkout')}>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Proceed to Checkout
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Marketplace;