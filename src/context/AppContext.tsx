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
  const [vendors, setVendors] = useState<Vendor[]>([]);
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
