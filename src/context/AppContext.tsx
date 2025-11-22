import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  image: string;
  category: string;
  vendor: string;
  description: string;
  stock_quantity: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  order_number: string;
  tracking_id: string;
  total_amount: number;
  status: string;
  delivery_address: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  created_at: string;
  items?: CartItem[];
}

export interface Vendor {
  id: number;
  name: string;
  location: string;
  rating: number;
  crops: string[];
  contact: string;
  image: string;
  verified: boolean;
}

interface AppContextType {
  cart: CartItem[];
  orders: Order[];
  vendors: Vendor[];
  products: Product[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  placeOrder: (address: string, customerData: { name: string; email: string; phone: string; deliveryTime?: string }) => Promise<void>;
  getTotalPrice: () => number;
  getTotalItems: () => number;
  loadProducts: () => Promise<void>;
  loadOrders: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([
    {
      id: 1,
      name: "Green Valley Farms",
      location: "Ludhiana, Punjab",
      rating: 4.8,
      crops: ["Wheat", "Rice", "Cotton", "Sugarcane"],
      contact: "+91 98765 43210",
      image: "🌾",
      verified: true
    },
    {
      id: 2,
      name: "Krishna Agro Industries",
      location: "Nashik, Maharashtra",
      rating: 4.6,
      crops: ["Onions", "Tomatoes", "Grapes", "Pomegranates"],
      contact: "+91 98234 56789",
      image: "🍇",
      verified: true
    },
    {
      id: 3,
      name: "Sunrise Organic Produce",
      location: "Mysore, Karnataka",
      rating: 4.9,
      crops: ["Coffee", "Cardamom", "Pepper", "Turmeric"],
      contact: "+91 97654 32109",
      image: "☕",
      verified: true
    },
    {
      id: 4,
      name: "Himalayan Fresh Farms",
      location: "Shimla, Himachal Pradesh",
      rating: 4.7,
      crops: ["Apples", "Pears", "Plums", "Cherries"],
      contact: "+91 96543 21098",
      image: "🍎",
      verified: true
    },
    {
      id: 5,
      name: "Rajasthan Spice Traders",
      location: "Jodhpur, Rajasthan",
      rating: 4.5,
      crops: ["Cumin", "Coriander", "Chili", "Mustard"],
      contact: "+91 95432 10987",
      image: "🌶️",
      verified: true
    },
    {
      id: 6,
      name: "Bengal Harvest Co.",
      location: "Kolkata, West Bengal",
      rating: 4.8,
      crops: ["Rice", "Jute", "Potatoes", "Mustard"],
      contact: "+91 94321 09876",
      image: "🌾",
      verified: true
    },
    {
      id: 7,
      name: "Tamil Nadu Agro Exports",
      location: "Coimbatore, Tamil Nadu",
      rating: 4.7,
      crops: ["Banana", "Coconut", "Turmeric", "Tapioca"],
      contact: "+91 93210 98765",
      image: "🥥",
      verified: true
    },
    {
      id: 8,
      name: "Madhya Pradesh Pulses Ltd",
      location: "Indore, Madhya Pradesh",
      rating: 4.6,
      crops: ["Soybeans", "Chickpeas", "Lentils", "Black Gram"],
      contact: "+91 92109 87654",
      image: "🫘",
      verified: true
    },
    {
      id: 9,
      name: "Haryana Dairy & Crops",
      location: "Karnal, Haryana",
      rating: 4.9,
      crops: ["Wheat", "Rice", "Mustard", "Sugarcane"],
      contact: "+91 91098 76543",
      image: "🌾",
      verified: true
    },
    {
      id: 10,
      name: "Gujarat Cotton Corporation",
      location: "Ahmedabad, Gujarat",
      rating: 4.5,
      crops: ["Cotton", "Groundnut", "Tobacco", "Castor"],
      contact: "+91 90987 65432",
      image: "🌱",
      verified: true
    },
    {
      id: 11,
      name: "Uttar Pradesh Grains Co.",
      location: "Meerut, UP",
      rating: 4.7,
      crops: ["Wheat", "Rice", "Sugarcane", "Potatoes"],
      contact: "+91 89876 54321",
      image: "🌾",
      verified: true
    },
    {
      id: 12,
      name: "Assam Tea Plantations",
      location: "Dibrugarh, Assam",
      rating: 4.8,
      crops: ["Tea", "Rice", "Jute", "Bamboo"],
      contact: "+91 88765 43210",
      image: "🍵",
      verified: true
    },
    {
      id: 13,
      name: "Kerala Spice Gardens",
      location: "Kochi, Kerala",
      rating: 4.7,
      crops: ["Pepper", "Cardamom", "Cloves", "Nutmeg"],
      contact: "+91 87654 32109",
      image: "🌿",
      verified: true
    },
    {
      id: 14,
      name: "Andhra Chili Growers",
      location: "Guntur, Andhra Pradesh",
      rating: 4.6,
      crops: ["Red Chilies", "Cotton", "Tobacco", "Rice"],
      contact: "+91 86543 21098",
      image: "🌶️",
      verified: true
    },
    {
      id: 15,
      name: "Telangana Rice Mills",
      location: "Warangal, Telangana",
      rating: 4.8,
      crops: ["Rice", "Cotton", "Turmeric", "Maize"],
      contact: "+91 85432 10987",
      image: "🌾",
      verified: true
    },
    {
      id: 16,
      name: "Odisha Vegetables Hub",
      location: "Bhubaneswar, Odisha",
      rating: 4.5,
      crops: ["Tomatoes", "Brinjal", "Cabbage", "Cauliflower"],
      contact: "+91 84321 09876",
      image: "🍅",
      verified: true
    },
    {
      id: 17,
      name: "Uttarakhand Organic Farms",
      location: "Dehradun, Uttarakhand",
      rating: 4.9,
      crops: ["Millets", "Wheat", "Rice", "Pulses"],
      contact: "+91 83210 98765",
      image: "🌾",
      verified: true
    },
    {
      id: 18,
      name: "Bihar Makhana Exports",
      location: "Darbhanga, Bihar",
      rating: 4.7,
      crops: ["Makhana", "Rice", "Wheat", "Lentils"],
      contact: "+91 82109 87654",
      image: "🌰",
      verified: true
    },
    {
      id: 19,
      name: "Jharkhand Tribal Produce",
      location: "Ranchi, Jharkhand",
      rating: 4.6,
      crops: ["Rice", "Maize", "Pulses", "Vegetables"],
      contact: "+91 81098 76543",
      image: "🌾",
      verified: true
    },
    {
      id: 20,
      name: "Chhattisgarh Forest Products",
      location: "Raipur, Chhattisgarh",
      rating: 4.5,
      crops: ["Rice", "Maize", "Groundnuts", "Pulses"],
      contact: "+91 80987 65432",
      image: "🌱",
      verified: true
    },
    {
      id: 21,
      name: "Meghalaya Ginger Co-op",
      location: "Shillong, Meghalaya",
      rating: 4.8,
      crops: ["Ginger", "Turmeric", "Potatoes", "Pineapple"],
      contact: "+91 79876 54321",
      image: "🫚",
      verified: true
    },
    {
      id: 22,
      name: "Sikkim Cardamom Growers",
      location: "Gangtok, Sikkim",
      rating: 4.9,
      crops: ["Cardamom", "Ginger", "Turmeric", "Tea"],
      contact: "+91 78765 43210",
      image: "🌿",
      verified: true
    },
    {
      id: 23,
      name: "Goa Cashew Producers",
      location: "Panaji, Goa",
      rating: 4.7,
      crops: ["Cashew", "Coconut", "Rice", "Fruits"],
      contact: "+91 77654 32109",
      image: "🥜",
      verified: true
    },
    {
      id: 24,
      name: "Manipur Organic Farmers",
      location: "Imphal, Manipur",
      rating: 4.6,
      crops: ["Rice", "Pineapple", "Ginger", "Vegetables"],
      contact: "+91 76543 21098",
      image: "🍍",
      verified: true
    },
    {
      id: 25,
      name: "Tripura Rubber & Agri",
      location: "Agartala, Tripura",
      rating: 4.5,
      crops: ["Rubber", "Rice", "Pineapple", "Jackfruit"],
      contact: "+91 75432 10987",
      image: "🌱",
      verified: true
    },
    {
      id: 26,
      name: "Nagaland Hill Crops",
      location: "Kohima, Nagaland",
      rating: 4.7,
      crops: ["Rice", "Maize", "Millet", "Chili"],
      contact: "+91 74321 09876",
      image: "🌾",
      verified: true
    },
    {
      id: 27,
      name: "Arunachal Valley Fruits",
      location: "Itanagar, Arunachal Pradesh",
      rating: 4.8,
      crops: ["Kiwi", "Apples", "Oranges", "Rice"],
      contact: "+91 73210 98765",
      image: "🥝",
      verified: true
    },
    {
      id: 28,
      name: "Mizoram Bamboo & Crops",
      location: "Aizawl, Mizoram",
      rating: 4.6,
      crops: ["Rice", "Ginger", "Turmeric", "Vegetables"],
      contact: "+91 72109 87654",
      image: "🎋",
      verified: true
    },
    {
      id: 29,
      name: "Jammu Apple Orchards",
      location: "Jammu, J&K",
      rating: 4.9,
      crops: ["Apples", "Walnuts", "Almonds", "Saffron"],
      contact: "+91 71098 76543",
      image: "🍎",
      verified: true
    },
    {
      id: 30,
      name: "Ladakh Apricot Farmers",
      location: "Leh, Ladakh",
      rating: 4.7,
      crops: ["Apricots", "Apples", "Walnuts", "Barley"],
      contact: "+91 70987 65432",
      image: "🍑",
      verified: true
    }
  ]);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load real vendor data from AI
  const loadVendors = async () => {
    try {
      console.log('Fetching real vendor data...');
      const { data, error } = await supabase.functions.invoke('fetch-vendor-data');

      if (error) {
        console.error('Error loading vendors:', error);
        toast({
          title: "Info",
          description: "Using cached vendor data",
        });
        return;
      }

      if (data?.vendors) {
        setVendors(data.vendors);
        console.log('Loaded real vendor data:', data.vendors.length, 'vendors');
      }
    } catch (error: any) {
      console.error('Error loading vendors:', error);
    }
  };

  // Load products from database
  const loadProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error('Error loading products:', error);
    }
  };

  // Load user's orders from database
  const loadOrders = async () => {
    if (!user) {
      setOrders([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load order items for each order
      const ordersWithItems = await Promise.all(
        (data || []).map(async (order) => {
          const { data: items } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);

          return {
            ...order,
            items: items?.map(item => ({
              id: item.product_id || '',
              name: item.product_name,
              price: Number(item.unit_price),
              unit: 'kg',
              image: item.product_image || '📦',
              category: '',
              vendor: '',
              description: '',
              stock_quantity: 0,
              quantity: item.quantity
            }))
          };
        })
      );

      setOrders(ordersWithItems);
    } catch (error: any) {
      console.error('Error loading orders:', error);
    }
  };

  // Load vendors and products on mount
  useEffect(() => {
    loadVendors();
    loadProducts();
  }, []);

  // Load orders when user changes
  useEffect(() => {
    loadOrders();
  }, [user]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existingItem = prev.find(item => item.id === product.id);
      if (existingItem) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    
    toast({
      title: "Added to cart",
      description: `${product.name} added to your cart`
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const placeOrder = async (address: string, customerData: { name: string; email: string; phone: string; deliveryTime?: string }) => {
    if (cart.length === 0 || !user) {
      toast({
        title: "Error",
        description: "Please sign in to place an order",
        variant: "destructive"
      });
      return;
    }

    try {
      const orderNumber = `ORD${Date.now()}`;
      const trackingId = `TRK${Date.now()}`;
      const total = getTotalPrice();

      // Insert order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_id: user.id,
          order_number: orderNumber,
          tracking_id: trackingId,
          total_amount: total,
          status: 'pending',
          delivery_address: address,
          customer_name: customerData.name,
          customer_email: customerData.email,
          customer_phone: customerData.phone,
          preferred_delivery_time: customerData.deliveryTime || null
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items
      const orderItems = cart.map(item => ({
        order_id: orderData.id,
        product_id: item.id,
        product_name: item.name,
        product_image: item.image,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Send email confirmation
      try {
        await supabase.functions.invoke('send-order-confirmation', {
          body: {
            customerName: customerData.name,
            customerEmail: customerData.email,
            customerPhone: customerData.phone,
            orderId: orderNumber,
            items: cart,
            total: total,
            address: address,
            deliveryTime: customerData.deliveryTime || '',
            trackingId: trackingId,
          }
        });
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }

      clearCart();
      await loadOrders();

      toast({
        title: "Order Placed Successfully! 🎉",
        description: `Order ${orderNumber} has been placed. Check your email for confirmation.`
      });
    } catch (error: any) {
      console.error('Error placing order:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to place order",
        variant: "destructive"
      });
      throw error;
    }
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const value: AppContextType = {
    cart,
    orders,
    vendors,
    products,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    placeOrder,
    getTotalPrice,
    getTotalItems,
    loadProducts,
    loadOrders
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
