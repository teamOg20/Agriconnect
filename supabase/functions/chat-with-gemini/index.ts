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
            name: "get_weather",
            description: "Get current weather and forecast for a specific location. Use this when users ask about weather conditions, temperature, rainfall, etc.",
            parameters: {
              type: "OBJECT",
              properties: {
                location: {
                  type: "STRING",
                  description: "City name or location (e.g., 'Delhi', 'Mumbai', 'Bangalore')"
                }
              },
              required: ["location"]
            }
          },
          {
            name: "search_agricultural_prices",
            description: "Search for real-time agricultural commodity prices, crop prices, market rates, and farming-related information using AI-powered search.",
            parameters: {
              type: "OBJECT",
              properties: {
                query: {
                  type: "STRING",
                  description: "What to search for (e.g., 'wheat price today', 'tomato market rate', 'fertilizer costs')"
                }
              },
              required: ["query"]
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
          },
          {
            name: "query_fertilizers",
            description: "Search fertilizers database based on crop type, disease name, soil type, or organic preference. Returns matching fertilizers with details.",
            parameters: {
              type: "OBJECT",
              properties: {
                crop: {
                  type: "STRING",
                  description: "Crop name to find suitable fertilizers for (e.g., 'tomatoes', 'wheat', 'rice')"
                },
                disease: {
                  type: "STRING",
                  description: "Disease name to find fertilizers that treat it (e.g., 'blight', 'rust', 'chlorosis')"
                },
                soil_type: {
                  type: "STRING",
                  description: "Soil type (e.g., 'clay', 'sandy', 'loam', 'black', 'alluvial')"
                },
                organic_only: {
                  type: "BOOLEAN",
                  description: "Filter to show only organic fertilizers"
                },
                fertilizer_type: {
                  type: "STRING",
                  description: "Type of fertilizer: 'organic', 'chemical', 'bio-fertilizer', 'specialized'"
                },
                limit: {
                  type: "NUMBER",
                  description: "Maximum number of results (default: 10)"
                }
              }
            }
          },
          {
            name: "recommend_fertilizer_for_disease",
            description: "Get AI-powered fertilizer recommendations for specific crop diseases. Provides treatment strategy + fertilizer suggestions.",
            parameters: {
              type: "OBJECT",
              properties: {
                crop: {
                  type: "STRING",
                  description: "Crop affected by disease (e.g., 'tomatoes', 'wheat')"
                },
                disease: {
                  type: "STRING",
                  description: "Disease name or symptoms (e.g., 'early blight', 'yellowing leaves', 'wilting')"
                },
                soil_type: {
                  type: "STRING",
                  description: "Optional: Soil type for better recommendations"
                }
              },
              required: ["crop", "disease"]
            }
          },
          {
            name: "query_farmers",
            description: "Query farmer profiles to find farmers by location, crops they grow, or soil type. Returns public farmer information.",
            parameters: {
              type: "OBJECT",
              properties: {
                location: {
                  type: "STRING",
                  description: "Location to search for farmers (e.g., 'Punjab', 'Maharashtra')"
                },
                crop: {
                  type: "STRING",
                  description: "Crop to find farmers who grow it (e.g., 'rice', 'wheat')"
                },
                soil_type: {
                  type: "STRING",
                  description: "Soil type to find farmers with that soil"
                },
                limit: {
                  type: "NUMBER",
                  description: "Maximum number of results (default: 10)"
                }
              }
            }
          },
          {
            name: "get_soil_recommendations",
            description: "Get comprehensive fertilizer and nutrient recommendations based on soil type and crop. Provides application rates and timing.",
            parameters: {
              type: "OBJECT",
              properties: {
                soil_type: {
                  type: "STRING",
                  description: "Type of soil (e.g., 'clay', 'sandy', 'loam', 'black', 'alluvial')"
                },
                crop: {
                  type: "STRING",
                  description: "Crop to be grown (e.g., 'wheat', 'rice', 'tomatoes')"
                },
                field_size: {
                  type: "STRING",
                  description: "Optional: Field size for calculating quantities"
                }
              },
              required: ["soil_type", "crop"]
            }
          }
        ]
      }
    ];

    // Prepare messages for Gemini API
    const systemInstruction = `You are an AI assistant for AgriConnect, an agricultural marketplace platform. You are an expert in agriculture, crop diseases, soil science, and fertilizer management.

DATABASE TABLES:
- products: Agricultural products with name, price, category, vendor, stock
- orders: User order history with tracking and status
- cart: User's current shopping cart items
- users: User profiles with farmer info (field_size, location, soil_type, major_crops)
- profiles: Basic user profile information
- fertilizers: Comprehensive fertilizer database with types, NPK ratios, suitable crops, disease treatments, soil compatibility

REAL-TIME DATA ACCESS:
- Weather: Current conditions, temperature, humidity, rainfall, forecasts for any location
- Agricultural Prices: Real-time crop prices, commodity rates, fertilizer costs, market information
- Fertilizers: Query by crop, disease, soil type, organic preference
- Farmers: Search farmer profiles by location, crops, soil type

AGRICULTURAL EXPERTISE:
You have expert knowledge about:
- Common crop diseases: Early blight, late blight, powdery mildew, leaf rust, blast, wilts, chlorosis, nutrient deficiencies
- Fertilizer types: Organic (vermicompost, neem cake, compost), Chemical (NPK, urea, DAP), Bio-fertilizers (rhizobium, azotobacter), Specialized (micronutrients, calcium nitrate)
- Soil types: Clay (heavy, water-retentive), Sandy (light, well-draining), Loam (balanced), Black (fertile, cotton-suitable), Alluvial (river deposits, very fertile)
- NPK ratios: High N for leaf growth, high P for roots/flowers, high K for fruits/stress tolerance
- Organic farming: Natural pest control, soil health, sustainable practices

USER AUTHENTICATION:
- User is ${isAuthenticated ? 'LOGGED IN' : 'NOT logged in (guest)'}
- ${isAuthenticated ? 'Can query orders, cart, and personal data' : 'Suggest login for personalized features'}

TOOLS AVAILABLE:
Database Queries:
- query_products: Search products by name, category
- query_orders: View user's orders (auth required)
- query_cart: Check cart items (auth required)
- query_fertilizers: Search fertilizers by crop, disease, soil, organic filter
- query_farmers: Find farmers by location, crops, soil type
- count_records: Count records in tables

AI-Powered Recommendations:
- recommend_fertilizer_for_disease: Get disease diagnosis + treatment strategy + fertilizer suggestions
- get_soil_recommendations: Get comprehensive fertilizer plan based on soil + crop

External Data:
- get_weather: Current weather and forecast for any location
- search_agricultural_prices: Real-time crop and commodity prices

Navigation:
- navigate_to_page: Go to different pages (/, /marketplace, /dashboard, etc.)
- scroll_to_section: Scroll to sections on home page

INSTRUCTIONS:
1. Be conversational, helpful, and farmer-friendly
2. Use query_fertilizers when users ask: "fertilizer for tomatoes", "organic fertilizers", "what treats blight"
3. Use recommend_fertilizer_for_disease for: "my wheat has rust", "tomato blight treatment", disease-specific queries
4. Use get_soil_recommendations for: "clay soil wheat fertilizer", "sandy soil recommendations"
5. Use query_farmers for: "farmers in Punjab", "who grows rice", farmer directory queries
6. Use get_weather for weather queries, always mention farming-relevant info (rainfall, temperature)
7. Use search_agricultural_prices for market rates, crop prices, commodity information
8. Combine tools intelligently: Weather + fertilizer recommendations, disease + soil + fertilizer
9. Provide practical advice: application rates, timing, prevention tips
10. NEVER make up data - always use actual database and API results
11. If no results found, suggest alternatives or navigation to marketplace/fertilizer sections
12. Understand natural voice commands: "what to use for tomato disease" = recommend_fertilizer_for_disease
13. Be especially helpful to farmers - provide cost-effective solutions, organic alternatives when possible
14. When suggesting fertilizers, mention NPK ratios, benefits, and application timing
15. For auth-required features, politely ask users to sign in`;

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

    // Main conversation loop to handle tool calls (increased limit for complex queries)
    for (let iteration = 0; iteration < 15; iteration++) {
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
        console.error('No parts in response, iteration:', iteration);
        // If we got an empty response early in the loop, it might be an API issue
        if (iteration === 0) {
          return new Response(
            JSON.stringify({ 
              error: 'Unable to process your request. Please try rephrasing your question.' 
            }), 
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        // Otherwise, return the last successful response if any
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
            
            case 'get_weather': {
              const location = args?.location;
              if (!location) {
                result = { error: 'Location parameter is required' };
                break;
              }

              try {
                // Use Open-Meteo Geocoding API to get coordinates
                const geoResponse = await fetch(
                  `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
                );
                const geoData = await geoResponse.json();

                if (!geoData.results || geoData.results.length === 0) {
                  result = { error: 'Location not found', message: `Could not find location: ${location}` };
                  break;
                }

                const { latitude, longitude, name, country } = geoData.results[0];

                // Get current weather and forecast
                const weatherResponse = await fetch(
                  `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,weather_code&timezone=auto`
                );
                const weatherData = await weatherResponse.json();

                result = {
                  location: `${name}, ${country}`,
                  coordinates: { latitude, longitude },
                  current: {
                    temperature: weatherData.current.temperature_2m,
                    feels_like: weatherData.current.apparent_temperature,
                    humidity: weatherData.current.relative_humidity_2m,
                    precipitation: weatherData.current.precipitation,
                    rain: weatherData.current.rain,
                    wind_speed: weatherData.current.wind_speed_10m,
                    weather_code: weatherData.current.weather_code
                  },
                  forecast: {
                    max_temp: weatherData.daily.temperature_2m_max[0],
                    min_temp: weatherData.daily.temperature_2m_min[0],
                    precipitation: weatherData.daily.precipitation_sum[0],
                    rain: weatherData.daily.rain_sum[0]
                  },
                  units: {
                    temperature: '°C',
                    precipitation: 'mm',
                    wind_speed: 'km/h'
                  }
                };
              } catch (error) {
                console.error('Weather API error:', error);
                result = { error: 'Failed to fetch weather data', details: error instanceof Error ? error.message : 'Unknown error' };
              }
              break;
            }

            case 'search_agricultural_prices': {
              const query = args?.query;
              if (!query) {
                result = { error: 'Query parameter is required' };
                break;
              }

              try {
                // Use Gemini itself to search for agricultural prices
                const searchResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_GEMINI_API_KEY}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    contents: [{
                      parts: [{
                        text: `Search and provide current information about: ${query}. Focus on Indian agricultural markets, commodity prices, and farming-related information. Provide specific numbers, sources, and current market rates where available. Keep the response concise and factual.`
                      }]
                    }],
                    generationConfig: {
                      temperature: 0.2,
                      maxOutputTokens: 500
                    }
                  })
                });

                if (!searchResponse.ok) {
                  throw new Error(`Search failed: ${searchResponse.status}`);
                }

                const searchData = await searchResponse.json();
                const searchResult = searchData.candidates?.[0]?.content?.parts?.[0]?.text || 'No information found';

                result = {
                  query: query,
                  information: searchResult,
                  note: 'Information is based on available data and may need verification with local markets'
                };
              } catch (error) {
                console.error('Agricultural price search error:', error);
                result = { 
                  error: 'Failed to search agricultural prices', 
                  details: error instanceof Error ? error.message : 'Unknown error',
                  message: 'Please try again or check local market rates'
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

            case 'query_fertilizers': {
              let query = supabase.from('fertilizers').select('*');
              
              // Apply filters
              if (args?.crop) {
                query = query.contains('suitable_for_crops', [args.crop.toLowerCase()]);
              }
              if (args?.disease) {
                query = query.contains('treats_diseases', [args.disease.toLowerCase()]);
              }
              if (args?.soil_type) {
                query = query.contains('soil_compatibility', [args.soil_type.toLowerCase()]);
              }
              if (args?.organic_only === true) {
                query = query.eq('organic', true);
              }
              if (args?.fertilizer_type) {
                query = query.eq('type', args.fertilizer_type);
              }
              
              const limit = args?.limit || 10;
              query = query.limit(limit).order('rating', { ascending: false });
              
              const { data: fertilizers, error } = await query;
              
              if (error) {
                result = { error: 'Failed to query fertilizers', details: error.message };
              } else {
                result = { 
                  fertilizers: fertilizers || [], 
                  count: fertilizers?.length || 0,
                  message: fertilizers?.length === 0 ? 'No fertilizers found matching criteria' : undefined
                };
              }
              break;
            }

            case 'recommend_fertilizer_for_disease': {
              const crop = args?.crop;
              const disease = args?.disease;
              const soilType = args?.soil_type;
              
              if (!crop || !disease) {
                result = { error: 'Crop and disease parameters are required' };
                break;
              }
              
              // First, query database for matching fertilizers
              let query = supabase
                .from('fertilizers')
                .select('*')
                .contains('suitable_for_crops', [crop.toLowerCase()]);
                
              if (disease) {
                query = query.or(`treats_diseases.cs.{${disease.toLowerCase()}}`);
              }
              
              const { data: matchingFertilizers } = await query.limit(5);
              
              // Use Gemini for intelligent disease analysis and recommendations
              const analysisPrompt = `As an agricultural expert, analyze this crop disease and provide recommendations:
  
Crop: ${crop}
Disease/Problem: ${disease}
Soil Type: ${soilType || 'not specified'}

Available fertilizers in database: ${JSON.stringify(matchingFertilizers || [])}

Please provide:
1. Disease identification and cause
2. Treatment strategy (cultural, chemical, organic methods)
3. Specific fertilizer recommendations from the available options
4. Application timing and rates
5. Prevention tips for future

Keep response practical and farmer-friendly.`;

              const analysisResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: analysisPrompt }] }],
                  generationConfig: { temperature: 0.3, maxOutputTokens: 800 }
                })
              });
              
              const analysisData = await analysisResponse.json();
              const recommendation = analysisData.candidates?.[0]?.content?.parts?.[0]?.text || 'Analysis unavailable';
              
              result = {
                crop,
                disease,
                soil_type: soilType,
                recommendation,
                matching_fertilizers: matchingFertilizers || [],
                count: matchingFertilizers?.length || 0
              };
              break;
            }

            case 'query_farmers': {
              let query = supabase
                .from('users')
                .select('full_name, location, field_size, soil_type, major_crops, user_type')
                .eq('user_type', 'farmer');
              
              if (args?.location) {
                query = query.ilike('location', `%${args.location}%`);
              }
              if (args?.crop) {
                query = query.contains('major_crops', [args.crop.toLowerCase()]);
              }
              if (args?.soil_type) {
                query = query.ilike('soil_type', `%${args.soil_type}%`);
              }
              
              const limit = args?.limit || 10;
              query = query.limit(limit);
              
              const { data: farmers, error } = await query;
              
              if (error) {
                result = { error: 'Failed to query farmers', details: error.message };
              } else {
                result = {
                  farmers: farmers || [],
                  count: farmers?.length || 0,
                  message: farmers?.length === 0 ? 'No farmers found matching criteria' : undefined
                };
              }
              break;
            }

            case 'get_soil_recommendations': {
              const soilType = args?.soil_type;
              const crop = args?.crop;
              const fieldSize = args?.field_size;
              
              if (!soilType || !crop) {
                result = { error: 'Soil type and crop parameters are required' };
                break;
              }
              
              // Query fertilizers suitable for this soil and crop
              const { data: suitableFertilizers } = await supabase
                .from('fertilizers')
                .select('*')
                .contains('suitable_for_crops', [crop.toLowerCase()])
                .contains('soil_compatibility', [soilType.toLowerCase()])
                .order('rating', { ascending: false })
                .limit(5);
              
              // Get AI recommendations
              const recommendationPrompt = `As a soil scientist and agronomist, provide comprehensive fertilizer recommendations:

Soil Type: ${soilType}
Crop: ${crop}
Field Size: ${fieldSize || 'not specified'}

Available suitable fertilizers: ${JSON.stringify(suitableFertilizers || [])}

Provide:
1. Soil characteristics and nutrient availability
2. Crop nutrient requirements
3. Recommended fertilizers from the available options
4. NPK ratio recommendations
5. Application timing (basal, top-dressing)
6. Application rates per acre/hectare
7. Soil amendment suggestions if needed

Be specific with quantities and timing.`;

              const recommendationResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: recommendationPrompt }] }],
                  generationConfig: { temperature: 0.2, maxOutputTokens: 1000 }
                })
              });
              
              const recommendationData = await recommendationResponse.json();
              const recommendations = recommendationData.candidates?.[0]?.content?.parts?.[0]?.text || 'Recommendations unavailable';
              
              result = {
                soil_type: soilType,
                crop,
                field_size: fieldSize,
                recommendations,
                suitable_fertilizers: suitableFertilizers || [],
                count: suitableFertilizers?.length || 0
              };
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
