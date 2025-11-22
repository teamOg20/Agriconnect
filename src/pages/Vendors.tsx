import { useState } from 'react';
import { Star, MapPin, Phone, Mail, Filter, Search, Verified, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppContext } from '@/context/AppContext';
import Navigation from '@/components/Navigation';
import FloatingAIChat from '@/components/FloatingAIChat';
import { useTranslation } from 'react-i18next';

const Vendors = () => {
  const { vendors } = useAppContext();
  const { t } = useTranslation();
  const [selectedState, setSelectedState] = useState('All');
  const [selectedCrop, setSelectedCrop] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<number | null>(null);

  const states = ['All', 'Punjab', 'Haryana', 'Maharashtra', 'Madhya Pradesh', 'Karnataka', 'UP', 'Himachal', 'Rajasthan', 'Tamil Nadu'];
  const crops = ['All', 'Tomatoes', 'Rice', 'Wheat', 'Onions', 'Chilies', 'Potatoes', 'Soybeans', 'Pulses', 'Spices'];
  
  const getStateTranslation = (state: string) => {
    const stateMap: Record<string, string> = {
      'All': t('vendors.states.all'),
      'Punjab': t('vendors.states.punjab'),
      'Haryana': t('vendors.states.haryana'),
      'Maharashtra': t('vendors.states.maharashtra'),
      'Madhya Pradesh': t('vendors.states.madhyaPradesh'),
      'Karnataka': t('vendors.states.karnataka'),
      'UP': t('vendors.states.up'),
      'Himachal': t('vendors.states.himachal'),
      'Rajasthan': t('vendors.states.rajasthan'),
      'Tamil Nadu': t('vendors.states.tamilNadu'),
    };
    return stateMap[state] || state;
  };

  const getCropTranslation = (crop: string) => {
    const cropMap: Record<string, string> = {
      'All': t('vendors.crops.all'),
      'Tomatoes': t('vendors.crops.tomatoes'),
      'Rice': t('vendors.crops.rice'),
      'Wheat': t('vendors.crops.wheat'),
      'Onions': t('vendors.crops.onions'),
      'Chilies': t('vendors.crops.chilies'),
      'Potatoes': t('vendors.crops.potatoes'),
      'Soybeans': t('vendors.crops.soybeans'),
      'Pulses': t('vendors.crops.pulses'),
      'Spices': t('vendors.crops.spices'),
      'Basmati Rice': t('vendors.crops.basmatiRice'),
      'Maize': t('vendors.crops.maize'),
      'Grapes': t('vendors.crops.grapes'),
      'Pomegranate': t('vendors.crops.pomegranate'),
      'Sugarcane': t('vendors.crops.sugarcane'),
      'Mustard': t('vendors.crops.mustard'),
    };
    return cropMap[crop] || crop;
  };

  const filteredVendors = vendors.filter(vendor => {
    const matchesState = selectedState === 'All' || vendor.location.includes(selectedState);
    const matchesCrop = selectedCrop === 'All' || vendor.crops.some(crop => crop.toLowerCase().includes(selectedCrop.toLowerCase()));
    const matchesSearch = vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         vendor.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesState && matchesCrop && matchesSearch;
  });

  const contactVendor = (vendor: any) => {
    alert(`Contacting ${vendor.name} at ${vendor.contact}`);
  };

  const viewInventory = (vendor: any) => {
    setSelectedVendor(selectedVendor === vendor.id ? null : vendor.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <Navigation />
      <FloatingAIChat />
      
      <div className="pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              {t('vendors.title')}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('vendors.description')}
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-2xl shadow-soft p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder={t('vendors.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger>
                  <SelectValue placeholder={t('vendors.selectState')} />
                </SelectTrigger>
                <SelectContent>
                  {states.map(state => (
                    <SelectItem key={state} value={state}>{getStateTranslation(state)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCrop} onValueChange={setSelectedCrop}>
                <SelectTrigger>
                  <SelectValue placeholder={t('vendors.selectCrop')} />
                </SelectTrigger>
                <SelectContent>
                  {crops.map(crop => (
                    <SelectItem key={crop} value={crop}>{getCropTranslation(crop)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Vendors Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVendors.map((vendor) => (
              <Card key={vendor.id} className="card-field hover:shadow-xl transition-all duration-300">
                <div className="p-6">
                  {/* Vendor Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="text-4xl">{vendor.image}</div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center">
                          {vendor.name}
                          {vendor.verified && (
                            <Verified className="w-4 h-4 text-blue-600 ml-2" />
                          )}
                        </h3>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>{vendor.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-semibold text-gray-900 ml-1">{vendor.rating}</span>
                    </div>
                    <span className="text-gray-300">•</span>
                    <Badge variant="secondary">
                      {vendor.verified ? t('vendors.verified') : t('vendors.pending')}
                    </Badge>
                  </div>

                  {/* Crops Available */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">{t('vendors.cropsAvailable')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {vendor.crops.slice(0, 3).map((crop, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {getCropTranslation(crop)}
                        </Badge>
                      ))}
                      {vendor.crops.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{vendor.crops.length - 3} {t('vendors.more')}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="mb-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-2 mb-1">
                      <Phone className="w-4 h-4" />
                      <span>{vendor.contact}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => contactVendor(vendor)}
                      className="flex-1"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      {t('vendors.contact')}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => viewInventory(vendor)}
                      className="btn-hero flex-1"
                    >
                      {t('vendors.viewInventory')}
                    </Button>
                  </div>

                  {/* Expanded Inventory */}
                  {selectedVendor === vendor.id && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-semibold text-gray-900 mb-3">{t('vendors.currentInventory')}</h4>
                      <div className="space-y-2">
                        {vendor.crops.map((crop, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-sm font-medium">{getCropTranslation(crop)}</span>
                            <div className="text-right">
                              <div className="text-sm font-semibold text-green-600">{t('vendors.available')}</div>
                              <div className="text-xs text-gray-500">₹{20 + index * 5}/kg</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3">
                        <Button className="w-full btn-success" size="sm">
                          {t('vendors.placeBulkOrder')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {filteredVendors.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('vendors.noVendorsFound')}</h3>
              <p className="text-gray-600">{t('vendors.adjustSearch')}</p>
            </div>
          )}

          {/* Stats */}
          <div className="mt-16 grid md:grid-cols-3 gap-8">
            <div className="text-center bg-white rounded-xl p-6 shadow-soft">
              <div className="text-3xl font-bold text-green-600 mb-2">{vendors.length}+</div>
              <div className="text-gray-600">{t('vendors.verifiedVendors')}</div>
            </div>
            <div className="text-center bg-white rounded-xl p-6 shadow-soft">
              <div className="text-3xl font-bold text-blue-600 mb-2">15+</div>
              <div className="text-gray-600">{t('vendors.statesCovered')}</div>
            </div>
            <div className="text-center bg-white rounded-xl p-6 shadow-soft">
              <div className="text-3xl font-bold text-purple-600 mb-2">100+</div>
              <div className="text-gray-600">{t('vendors.cropVarieties')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Vendors;