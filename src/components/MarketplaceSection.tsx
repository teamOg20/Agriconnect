import { useState } from 'react';
import { ShoppingCart, Plus, Minus, Star, MapPin, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import marketplaceCrops from '@/assets/marketplace-crops.jpg';

interface Product {
  id: number;
  name: string;
  price: number;
  unit: string;
  rating: number;
  location: string;
  trend: string;
  image: string;
  category: string;
}

const MarketplaceSection = () => {
  const [cart, setCart] = useState<{[key: number]: number}>({});
  const [selectedCategory, setSelectedCategory] = useState('All');

  const products: Product[] = [
    { id: 1, name: 'Fresh Tomatoes', price: 25, unit: 'kg', rating: 4.5, location: 'Punjab', trend: '+12%', image: '🍅', category: 'Vegetables' },
    { id: 2, name: 'Basmati Rice', price: 45, unit: 'kg', rating: 4.8, location: 'Haryana', trend: '+8%', image: '🌾', category: 'Grains' },
    { id: 3, name: 'Fresh Onions', price: 18, unit: 'kg', rating: 4.2, location: 'Maharashtra', trend: '-5%', image: '🧅', category: 'Vegetables' },
    { id: 4, name: 'Wheat Flour', price: 35, unit: 'kg', rating: 4.6, location: 'MP', trend: '+15%', image: '🌾', category: 'Grains' },
    { id: 5, name: 'Green Chilies', price: 40, unit: 'kg', rating: 4.3, location: 'Karnataka', trend: '+20%', image: '🌶️', category: 'Spices' },
    { id: 6, name: 'Potatoes', price: 22, unit: 'kg', rating: 4.1, location: 'UP', trend: '+5%', image: '🥔', category: 'Vegetables' },
  ];

  const categories = ['All', 'Vegetables', 'Grains', 'Spices', 'Fruits'];

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const addToCart = (productId: number) => {
    setCart(prev => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1
    }));
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[productId] > 1) {
        newCart[productId]--;
      } else {
        delete newCart[productId];
      }
      return newCart;
    });
  };

  const getTotalPrice = () => {
    return Object.entries(cart).reduce((total, [productId, quantity]) => {
      const product = products.find(p => p.id === parseInt(productId));
      return total + (product?.price || 0) * quantity;
    }, 0);
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  };

  return (
    <section id="marketplace" className="py-20 bg-gradient-to-b from-white to-green-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-green-100 rounded-full mb-6">
            <ShoppingCart className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-700 font-medium">AgriConnect Marketplace</span>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Fresh From Farm to Your Doorstep
          </h2>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Buy directly from farmers at fair prices. Support local agriculture while getting fresh, 
            quality produce with real-time pricing and tracking.
          </p>

          {/* Hero Image */}
          <div className="relative rounded-2xl overflow-hidden shadow-xl mb-12">
            <img 
              src={marketplaceCrops} 
              alt="Fresh agricultural marketplace with various crops"
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-transparent"></div>
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-4">
              <div className="text-sm font-medium text-gray-900">Live Market Status</div>
              <div className="text-2xl font-bold text-green-600">2,847 Products Available</div>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className={selectedCategory === category ? "btn-hero" : ""}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
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
                  <Badge 
                    variant={product.trend.startsWith('+') ? "default" : "secondary"}
                    className={product.trend.startsWith('+') ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
                  >
                    {product.trend}
                  </Badge>
                </div>

                {/* Product Details */}
                <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
                
                <div className="flex items-center space-x-2 mb-3">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
                  </div>
                  <span className="text-gray-300">•</span>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600 ml-1">{product.location}</span>
                  </div>
                </div>

                {/* Pricing */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">₹{product.price}</span>
                    <span className="text-gray-600">/{product.unit}</span>
                  </div>
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">Fair Price</span>
                  </div>
                </div>

                {/* Add to Cart Controls */}
                <div className="flex items-center justify-between">
                  {cart[product.id] ? (
                    <div className="flex items-center space-x-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFromCart(product.id)}
                        className="w-8 h-8 p-0"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      
                      <span className="font-semibold text-lg min-w-[2rem] text-center">
                        {cart[product.id]}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addToCart(product.id)}
                        className="w-8 h-8 p-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => addToCart(product.id)}
                      className="btn-success flex-1"
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

        {/* Cart Summary */}
        {getTotalItems() > 0 && (
          <div className="fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl border p-6 z-40 min-w-[300px]">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-gray-900">Your Cart</h4>
              <Badge className="bg-green-100 text-green-700">
                {getTotalItems()} items
              </Badge>
            </div>
            
            <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
              {Object.entries(cart).map(([productId, quantity]) => {
                const product = products.find(p => p.id === parseInt(productId));
                if (!product) return null;
                
                return (
                  <div key={productId} className="flex justify-between items-center text-sm">
                    <span>{product.name} x{quantity}</span>
                    <span className="font-semibold">₹{product.price * quantity}</span>
                  </div>
                );
              })}
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-bold">Total: ₹{getTotalPrice()}</span>
              </div>
              
              <Button className="btn-hero w-full">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Proceed to Checkout
              </Button>
            </div>
          </div>
        )}

        {/* Trust Indicators */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Direct from Farmers</h4>
            <p className="text-gray-600">No middlemen, fair prices for everyone</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Real-time Pricing</h4>
            <p className="text-gray-600">Always updated market rates</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="w-8 h-8 text-purple-600" />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Quality Guaranteed</h4>
            <p className="text-gray-600">Verified sellers, fresh produce</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MarketplaceSection;