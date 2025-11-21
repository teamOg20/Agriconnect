import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid messages format:', messages);
      return new Response(
        JSON.stringify({ error: 'Messages must be an array' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const GOOGLE_GEMINI_API_KEY = Deno.env.get('GOOGLE_GEMINI_API_KEY');
    if (!GOOGLE_GEMINI_API_KEY) {
      console.error('GOOGLE_GEMINI_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured. Please contact support.' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get authorization header for user-specific queries
    const authHeader = req.headers.get('authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Create user-specific client if authenticated
    const supabase = authHeader 
      ? createClient(supabaseUrl, supabaseAnonKey, {
          global: { headers: { Authorization: authHeader } }
        })
      : createClient(supabaseUrl, supabaseAnonKey);

    // Get current user if authenticated
    const { data: { user } } = await supabase.auth.getUser();
    const isAuthenticated = !!user;

    console.log('Processing chat request with', messages.length, 'messages', isAuthenticated ? '(authenticated)' : '(guest)');

    // Define tools for database access and navigation (Gemini format)
    const tools = [
      {
        functionDeclarations: [
          {
            name: "query_products",
            description: "Query the products table to get information about available products, their prices, categories, and stock",
            parameters: {
              type: "OBJECT",
              properties: {
                filters: {
                  type: "OBJECT",
                  description: "Filters to apply (e.g., category, name contains)",
                  properties: {
                    category: { type: "STRING" },
                    name: { type: "STRING" }
                  }
                },
                limit: {
                  type: "NUMBER",
                  description: "Maximum number of results to return"
                }
              }
            }
          },
          {
            name: "query_orders",
            description: "Query the authenticated user's orders to get order information, status, and delivery details. Only works for logged-in users.",
            parameters: {
              type: "OBJECT",
              properties: {
                status: {
                  type: "STRING",
                  description: "Filter by order status (e.g., pending, completed, cancelled)"
                },
                limit: {
                  type: "NUMBER",
                  description: "Maximum number of orders to return (default: 10)"
                }
              }
            }
          },
          {
            name: "query_cart",
            description: "Query the authenticated user's shopping cart to see items they've added. Only works for logged-in users.",
            parameters: {
              type: "OBJECT",
              properties: {}
            }
          },
          {
            name: "count_records",
            description: "Count records in any table (products, orders, users, profiles)",
            parameters: {
              type: "OBJECT",
              properties: {
                table: {
                  type: "STRING",
                  description: "Table to count records from (products, orders, users, profiles)"
                }
              },
              required: ["table"]
            }
          },
          {
            name: "navigate_to_page",
            description: "Navigate to a different page on the website. Use this when user wants to go to marketplace, dashboard, orders, etc.",
            parameters: {
              type: "OBJECT",
              properties: {
                page: {
                  type: "STRING",
                  description: "The page route to navigate to (/, /marketplace, /dashboard, /orders, /about, /vendors, /fertilizer-friend)"
                }
              },
              required: ["page"]
            }
          },
          {
            name: "scroll_to_section",
            description: "Scroll to a specific section on the current page. Use for hero, features, pricing, problem, solution sections.",
            parameters: {
              type: "OBJECT",
              properties: {
                section: {
                  type: "STRING",
                  description: "The section to scroll to (hero, problem, solution, features, marketplace, fertilizer, pricing, footer)"
                }
              },
              required: ["section"]
            }
          }
        ]
      }
    ];

    // Prepare messages for Gemini API
    const systemInstruction = `You are an AI assistant for AgriConnect, an agricultural marketplace platform. You have access to the following:

DATABASE TABLES:
- products: Contains agricultural products with name, price, category, vendor, stock_quantity (ordered by most recent)
- orders: Contains user's order history with tracking, status, and delivery information
- cart: Contains user's current shopping cart items
- users: Contains user profiles with name, email, phone, user_type
- profiles: Contains additional user profile information

USER AUTHENTICATION:
- The user is ${isAuthenticated ? 'LOGGED IN' : 'NOT logged in (guest)'}
- ${isAuthenticated ? 'You can query their orders and cart' : 'Orders and cart queries require login - suggest they sign in'}

NAVIGATION CAPABILITIES:
- You can navigate users to different pages: home (/), marketplace, dashboard, orders, about, vendors, fertilizer-friend
- You can scroll to sections on the home page: hero, problem, solution, features, marketplace, fertilizer, pricing, footer

INSTRUCTIONS:
- Use database query tools when users ask about products, prices, orders, cart, or statistics
- For orders and cart queries: Only query if user is authenticated, otherwise politely ask them to sign in
- All product queries return the most recent items first
- When no products match a search, be helpful: suggest viewing available products or navigating to the marketplace
- If available_products are provided in tool results, mention some of them as alternatives
- Use navigation tools when users want to go to a specific page or section (e.g., "take me to marketplace", "show me orders")
- Always be helpful, conversational, and provide accurate information based on REAL database results
- When navigating, confirm the action (e.g., "Taking you to the marketplace now!")
- Understand voice commands naturally (e.g., "tomato prices" = query products for tomatoes, "my orders" = query orders, "check cart" = query cart)
- NEVER make up or hallucinate data - only use actual database query results
- If a query returns no data, clearly state that and offer alternatives or navigation options`;

    // Convert messages to Gemini format
    const contents = messages.map((msg: any) => {
      if (msg.role === 'user') {
        return { role: 'user', parts: [{ text: msg.content }] };
      } else if (msg.role === 'assistant') {
        return { role: 'model', parts: [{ text: msg.content }] };
      }
      return null;
    }).filter(Boolean);
    let navigationAction = null;

    // Main conversation loop to handle tool calls
    for (let iteration = 0; iteration < 5; iteration++) {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: contents,
          tools: tools,
          generationConfig: {
            temperature: 0.7,
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Google Gemini API error:', response.status, errorText);
        
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: 'AI service is currently busy. Please try again in a moment.' }), 
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify({ error: 'Failed to get response from AI service.' }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      console.log('Google Gemini API response:', JSON.stringify(data, null, 2));

      const candidate = data.candidates?.[0];
      if (!candidate) {
        console.error('No candidate in response');
        break;
      }

      const part = candidate.content?.parts?.[0];
      if (!part) {
        console.error('No parts in response');
        break;
      }

      // Check if there are function calls
      if (part.functionCall) {
        const functionCall = part.functionCall;

        console.log('Executing function:', functionCall.name, 'with args:', JSON.stringify(functionCall.args));
        
        let result;
        const args = functionCall.args;
        
        try {
          switch (functionCall.name) {
            case 'query_products': {
              let query = supabase.from('products').select('*');
              
              if (args?.filters) {
                if (args.filters.category) {
                  query = query.ilike('category', `%${args.filters.category}%`);
                }
                if (args.filters.name) {
                  query = query.ilike('name', `%${args.filters.name}%`);
                }
              }
              
              // Order by most recent first
              query = query.order('created_at', { ascending: false });
              
              const limit = args?.limit || 10;
              query = query.limit(limit);
              
              const { data: products, error } = await query;
              
              if (error) {
                console.error('Database error:', error);
                result = { error: 'Failed to query products', details: error.message };
              } else {
                // Include helpful context when no results found
                if (products && products.length === 0) {
                  // Get all available products as alternative
                  const { data: allProducts } = await supabase
                    .from('products')
                    .select('name, category')
                    .order('created_at', { ascending: false })
                    .limit(10);
                  
                  result = { 
                    products: [], 
                    count: 0,
                    message: 'No products found matching your search.',
                    available_products: allProducts || []
                  };
                } else {
                  result = { products, count: products?.length || 0 };
                }
              }
              break;
            }
            
            case 'query_orders': {
              // Check if user is authenticated
              if (!isAuthenticated) {
                result = { 
                  error: 'Authentication required',
                  message: 'Please sign in to view your orders',
                  suggestion: 'navigate_to_signin'
                };
                break;
              }

              // Query only the authenticated user's orders
              let query = supabase
                .from('orders')
                .select(`
                  *,
                  order_items(
                    id,
                    product_name,
                    quantity,
                    unit_price,
                    total_price
                  )
                `)
                .eq('customer_id', user.id)
                .order('created_at', { ascending: false });
              
              if (args?.status) {
                query = query.eq('status', args.status);
              }
              
              const limit = args?.limit || 10;
              query = query.limit(limit);
              
              const { data: orders, error } = await query;
              
              if (error) {
                console.error('Database error:', error);
                result = { error: 'Failed to query orders', details: error.message };
              } else {
                result = { 
                  orders, 
                  count: orders?.length || 0,
                  message: orders?.length === 0 ? 'No orders found' : undefined
                };
              }
              break;
            }

            case 'query_cart': {
              // Check if user is authenticated
              if (!isAuthenticated) {
                result = { 
                  error: 'Authentication required',
                  message: 'Please sign in to view your cart',
                  suggestion: 'navigate_to_signin'
                };
                break;
              }

              // Query the user's cart with product details
              const { data: cartItems, error } = await supabase
                .from('cart')
                .select(`
                  id,
                  quantity,
                  created_at,
                  products(
                    id,
                    name,
                    price,
                    unit,
                    image,
                    category,
                    vendor,
                    stock_quantity
                  )
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });
              
              if (error) {
                console.error('Database error:', error);
                result = { error: 'Failed to query cart', details: error.message };
              } else {
                const totalItems = cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
                const totalPrice = cartItems?.reduce((sum, item) => {
                  const product = Array.isArray(item.products) ? item.products[0] : item.products;
                  const price = product?.price || 0;
                  return sum + (price * item.quantity);
                }, 0) || 0;

                result = { 
                  cart_items: cartItems || [],
                  count: cartItems?.length || 0,
                  total_items: totalItems,
                  total_price: totalPrice,
                  message: cartItems?.length === 0 ? 'Your cart is empty' : undefined
                };
              }
              break;
            }
            
            case 'count_records': {
              const table = args?.table;
              if (!table) {
                result = { error: 'Table parameter is required' };
                break;
              }
              
              const { count, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
              
              if (error) {
                console.error('Database error:', error);
                result = { error: `Failed to count ${table}`, details: error.message };
              } else {
                result = { table, count };
              }
              break;
            }
            
            case 'navigate_to_page': {
              const page = args?.page;
              if (!page) {
                result = { error: 'Page parameter is required' };
                break;
              }
              navigationAction = { action: 'navigate', page, success: true };
              result = { action: 'navigate', page, success: true };
              break;
            }
            
            case 'scroll_to_section': {
              const section = args?.section;
              if (!section) {
                result = { error: 'Section parameter is required' };
                break;
              }
              navigationAction = { action: 'scroll', section, success: true };
              result = { action: 'scroll', section, success: true };
              break;
            }
            
            default:
              result = { error: 'Unknown function' };
          }
        } catch (error) {
          console.error('Function execution error:', error);
          result = { 
            error: 'Function execution failed', 
            details: error instanceof Error ? error.message : 'Unknown error'
          };
        }
        
        // Add function response to contents for next iteration
        contents.push({
          role: 'model',
          parts: [{ functionCall: functionCall } as any]
        });
        
        contents.push({
          role: 'user',
          parts: [{
            functionResponse: {
              name: functionCall.name,
              response: result
            }
          } as any]
        });
      } else if (part.text) {
        // No more function calls, return final response
        return new Response(
          JSON.stringify({ 
            message: part.text,
            navigation: navigationAction
          }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        console.error('Unexpected response format');
        break;
      }
    }

    return new Response(
      JSON.stringify({ 
        message: 'I apologize, but I reached the maximum number of iterations. Please try rephrasing your request.',
        navigation: navigationAction
      }), 
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error in chat-with-gemini:', error);
    return new Response(
      JSON.stringify({ 
        error: 'An unexpected error occurred. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
