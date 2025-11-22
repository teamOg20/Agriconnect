import { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, Filter, Mic, X, Clock, TrendingUp, Image as ImageIcon, Sparkles, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import FloatingAIChat from '@/components/FloatingAIChat';

const Search = () => {
  const { addToCart } = useAppContext();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([
    'tomatoes',
    'wheat flour',
    'organic fertilizer',
    'punjab onions',
    'basmati rice'
  ]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('relevance');
  
  // AI-powered search states
  const [aiMode, setAiMode] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Mock data for search
  const allItems = [
    { id: 1, name: 'Fresh Tomatoes', type: 'product', price: 25, unit: 'kg', category: 'Vegetables', location: 'Punjab', image: '🍅', vendor: 'Punjab Organic Farms' },
    { id: 2, name: 'Basmati Rice', type: 'product', price: 45, unit: 'kg', category: 'Grains', location: 'Haryana', image: '🌾', vendor: 'Haryana Rice Mills' },
    { id: 3, name: 'Organic Compost Plus', type: 'fertilizer', price: 450, unit: '40kg bag', category: 'Fertilizers', location: 'AgriConnect', image: '🌱', vendor: 'GreenGrow' },
    { id: 4, name: 'Punjab Organic Farms', type: 'vendor', rating: 4.8, crops: ['Tomatoes', 'Wheat'], location: 'Punjab', image: '👨‍🌾', contact: '+91 98765 43210' },
    { id: 5, name: 'Fresh Onions', type: 'product', price: 18, unit: 'kg', category: 'Vegetables', location: 'Maharashtra', image: '🧅', vendor: 'Maharashtra Onion Co-op' },
    { id: 6, name: 'Super NPK Complex', type: 'fertilizer', price: 850, unit: '50kg bag', category: 'Fertilizers', location: 'AgriConnect', image: '🧪', vendor: 'FertiFarm' },
    { id: 7, name: 'Haryana Rice Mills', type: 'vendor', rating: 4.6, crops: ['Rice', 'Wheat'], location: 'Haryana', image: '🏭', contact: '+91 98765 43211' },
    { id: 8, name: 'Green Chilies', type: 'product', price: 40, unit: 'kg', category: 'Spices', location: 'Karnataka', image: '🌶️', vendor: 'Karnataka Spice Gardens' }
  ];

  const trendingSearches = [
    'tomato prices today',
    'organic fertilizer',
    'wheat market rate',
    'punjab vendors',
    'rice exporters'
  ];

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = allItems.filter(item => {
        const matchesQuery = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (item.vendor && item.vendor.toLowerCase().includes(searchQuery.toLowerCase())) ||
                           (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase()));
        
        const matchesCategory = selectedCategory === 'All' || 
                               item.category === selectedCategory ||
                               item.type === selectedCategory.toLowerCase();
        
        return matchesQuery && matchesCategory;
      });

      // Sort results
      const sorted = [...filtered].sort((a, b) => {
        switch (sortBy) {
          case 'price-low':
            return (a.price || 0) - (b.price || 0);
          case 'price-high':
            return (b.price || 0) - (a.price || 0);
          case 'rating':
            return (b.rating || 0) - (a.rating || 0);
          default:
            return 0;
        }
      });

      setSearchResults(sorted);

      // Add to search history if not already present
      if (!searchHistory.includes(searchQuery.toLowerCase())) {
        setSearchHistory(prev => [searchQuery.toLowerCase(), ...prev.slice(0, 4)]);
      }
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, selectedCategory, sortBy, searchHistory]);

  const handleVoiceSearch = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setTimeout(() => {
        setIsListening(false);
        setSearchQuery("What are today's tomato prices?");
      }, 2000);
    }
  };

  const handleTrendingSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleHistorySearch = (query: string) => {
    setSearchQuery(query);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleAddToCart = (item: any) => {
    if (item.type === 'product' || item.type === 'fertilizer') {
      const product = {
        id: item.id,
        name: item.name,
        price: item.price,
        unit: item.unit,
        image: item.image,
        category: item.category,
        vendor: item.vendor,
        description: `Quality ${item.name} from ${item.location}`,
        stock_quantity: 100
      };
      addToCart(product);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Image too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result as string);
      setAiMode(true);
      toast({
        title: "Image uploaded",
        description: "Now ask a question about this image"
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAiSearch = async () => {
    if (!searchQuery.trim() && !uploadedImage) return;

    setIsAiLoading(true);
    setAiResponse('');

    try {
      const messages = [];
      
      if (uploadedImage) {
        messages.push({
          role: 'user',
          content: [
            { type: 'text', text: searchQuery || 'What is in this image? Provide detailed information.' },
            { type: 'image_url', image_url: { url: uploadedImage } }
          ]
        });
      } else {
        messages.push({
          role: 'user',
          content: searchQuery
        });
      }

      const { data, error } = await supabase.functions.invoke('chat-with-gemini', {
        body: { messages }
      });

      if (error) {
        // Handle 402 error specifically
        if (error.message?.includes('credits exhausted') || error.message?.includes('402')) {
          throw new Error('AI service is currently unavailable due to insufficient credits. Please contact support.');
        }
        throw error;
      }

      if (data?.message) {
        setAiResponse(data.message);
      } else {
        throw new Error('No response from AI');
      }
    } catch (error) {
      console.error('AI search error:', error);
      toast({
        title: "AI search failed",
        description: "Please try again or use regular search",
        variant: "destructive"
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const toggleAiMode = () => {
    setAiMode(!aiMode);
    setAiResponse('');
    setUploadedImage(null);
  };

  const removeImage = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navigation />
      <FloatingAIChat />
      
      <div className="pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Search AgriConnect
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Find crops, fertilizers, vendors, and more with our intelligent search
            </p>
          </div>

          {/* AI Mode Toggle */}
          <div className="max-w-4xl mx-auto mb-4">
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={toggleAiMode}
                variant={aiMode ? "default" : "outline"}
                className={aiMode ? "bg-gradient-to-r from-purple-600 to-blue-600" : ""}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI-Powered Search
              </Button>
              {aiMode && (
                <Badge variant="secondary" className="animate-pulse">
                  Ask anything • Real-time data • Image analysis
                </Badge>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto mb-8">
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && aiMode) {
                    handleAiSearch();
                  }
                }}
                placeholder={aiMode ? "Ask anything... (weather, prices, products, orders)" : "Search for crops, fertilizers, vendors..."}
                className={`pl-12 pr-32 py-4 text-lg rounded-2xl border-2 ${
                  aiMode ? 'border-purple-300 focus:border-purple-500' : 'border-gray-200 focus:border-green-500'
                }`}
              />
              
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                {aiMode && (
                  <>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-purple-600 hover:bg-purple-50"
                      title="Upload image"
                    >
                      <ImageIcon className="w-5 h-5" />
                    </Button>
                  </>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleVoiceSearch}
                  className={`${isListening ? 'bg-red-100 text-red-600' : 'text-gray-400'}`}
                >
                  <Mic className="w-5 h-5" />
                </Button>
                
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="text-gray-400"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                )}

                {aiMode && (
                  <Button
                    onClick={handleAiSearch}
                    disabled={isAiLoading || (!searchQuery.trim() && !uploadedImage)}
                    size="sm"
                    className="bg-gradient-to-r from-purple-600 to-blue-600"
                  >
                    {isAiLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>
            </div>

            {isListening && (
              <div className="flex items-center justify-center mt-4 text-red-600">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse mr-2"></div>
                <span>Listening... Speak now</span>
              </div>
            )}

            {uploadedImage && (
              <div className="mt-4 relative inline-block">
                <img src={uploadedImage} alt="Upload preview" className="max-w-xs rounded-lg border-2 border-purple-300" />
                <Button
                  onClick={removeImage}
                  size="sm"
                  variant="destructive"
                  className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Filters */}
          {searchQuery && (
            <div className="max-w-4xl mx-auto mb-8">
              <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-xl shadow-soft">
                <div className="flex items-center space-x-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <span className="text-sm font-medium text-gray-700">Filters:</span>
                </div>
                
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Categories</SelectItem>
                    <SelectItem value="Vegetables">Vegetables</SelectItem>
                    <SelectItem value="Grains">Grains</SelectItem>  
                    <SelectItem value="Fertilizers">Fertilizers</SelectItem>
                    <SelectItem value="vendor">Vendors</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                  </SelectContent>
                </Select>

                <Badge variant="outline" className="ml-auto">
                  {searchResults.length} results
                </Badge>
              </div>
            </div>
          )}

          {/* AI Response */}
          {aiMode && aiResponse && (
            <div className="max-w-4xl mx-auto mb-8">
              <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200">
                <div className="p-6">
                  <div className="flex items-start space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">AI Assistant</h3>
                      <Badge variant="secondary" className="text-xs">Real-time data enabled</Badge>
                    </div>
                  </div>
                  <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap pl-13">
                    {aiResponse}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Search Results */}
          {!aiMode && searchQuery && searchResults.length > 0 ? (
            <div className="max-w-4xl mx-auto">
              <div className="space-y-4">
                {searchResults.map((item) => (
                  <Card key={`${item.type}-${item.id}`} className="card-field hover:shadow-lg transition-all duration-300">
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="text-3xl">{item.image}</div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                              <Badge variant="outline" className="text-xs">
                                {item.type}
                              </Badge>
                            </div>
                            
                            <p className="text-gray-600 mb-2">
                              {item.type === 'vendor' 
                                ? `Crops: ${item.crops?.join(', ')} • ${item.location}` 
                                : `${item.location} • ${item.vendor || 'AgriConnect'}`
                              }
                            </p>
                            
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              {item.price && (
                                <span className="font-semibold text-green-600">₹{item.price}/{item.unit}</span>
                              )}
                              {item.rating && (
                                <span className="flex items-center">
                                  ⭐ {item.rating}
                                </span>
                              )}
                              {item.contact && (
                                <span>{item.contact}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          {(item.type === 'product' || item.type === 'fertilizer') && (
                            <Button
                              onClick={() => handleAddToCart(item)}
                              className="btn-success"
                              size="sm"
                            >
                              Add to Cart
                            </Button>
                          )}
                          {item.type === 'vendor' && (
                            <Button variant="outline" size="sm">
                              View Profile
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : !aiMode && searchQuery && searchResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search terms or filters</p>
              <Button onClick={clearSearch} variant="outline">
                Clear Search
              </Button>
            </div>
          ) : !aiMode ? (
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Trending Searches */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 text-orange-600 mr-2" />
                  Trending Searches
                </h3>
                <div className="flex flex-wrap gap-3">
                  {trendingSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleTrendingSearch(search)}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm hover:bg-orange-50 hover:border-orange-200 transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search History */}
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Clock className="w-5 h-5 text-blue-600 mr-2" />
                  Recent Searches
                </h3>
                <div className="flex flex-wrap gap-3">
                  {searchHistory.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleHistorySearch(search)}
                      className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm hover:bg-blue-50 hover:border-blue-200 transition-colors flex items-center"
                    >
                      <Clock className="w-3 h-3 text-gray-400 mr-2" />
                      {search}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Tips */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Tips</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <div className="font-medium text-gray-900 mb-2">🎯 Smart Search</div>
                    <div>Try "tomatoes punjab" or "organic fertilizer wheat"</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 mb-2">🎤 Voice Search</div>
                    <div>Click the mic icon and speak naturally</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 mb-2">🏷️ Categories</div>
                    <div>Filter by vegetables, grains, fertilizers, or vendors</div>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 mb-2">📍 Location</div>
                    <div>Include state names for location-specific results</div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default Search;