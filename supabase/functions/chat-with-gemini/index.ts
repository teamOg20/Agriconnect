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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured. Please contact support.' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client for database access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Processing chat request with', messages.length, 'messages');

    // Define tools for database access and navigation (OpenAI format)
    const tools = [
      {
        type: "function",
        function: {
          name: "query_products",
          description: "Query the products table to get information about available products, their prices, categories, and stock",
          parameters: {
            type: "object",
            properties: {
              filters: {
                type: "object",
                description: "Filters to apply (e.g., category, name contains)",
                properties: {
                  category: { type: "string" },
                  name: { type: "string" }
                }
              },
              limit: {
                type: "number",
                description: "Maximum number of results to return"
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "query_orders",
          description: "Query orders table to get order information, status, and customer details",
          parameters: {
            type: "object",
            properties: {
              customer_id: {
                type: "string",
                description: "Filter by customer ID"
              },
              status: {
                type: "string",
                description: "Filter by order status"
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "count_records",
          description: "Count records in any table (products, orders, users, profiles)",
          parameters: {
            type: "object",
            properties: {
              table: {
                type: "string",
                enum: ["products", "orders", "users", "profiles"],
                description: "Table to count records from"
              }
            },
            required: ["table"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "navigate_to_page",
          description: "Navigate to a different page on the website. Use this when user wants to go to marketplace, dashboard, orders, etc.",
          parameters: {
            type: "object",
            properties: {
              page: {
                type: "string",
                enum: ["/", "/marketplace", "/dashboard", "/orders", "/about", "/vendors", "/fertilizer-friend"],
                description: "The page route to navigate to"
              }
            },
            required: ["page"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "scroll_to_section",
          description: "Scroll to a specific section on the current page. Use for hero, features, pricing, problem, solution sections.",
          parameters: {
            type: "object",
            properties: {
              section: {
                type: "string",
                enum: ["hero", "problem", "solution", "features", "marketplace", "fertilizer", "pricing", "footer"],
                description: "The section to scroll to"
              }
            },
            required: ["section"]
          }
        }
      }
    ];

    // Prepare messages for Lovable AI (OpenAI format)
    const systemMessage = {
      role: 'system',
      content: `You are an AI assistant for AgriConnect, an agricultural marketplace platform. You have access to the following:

DATABASE TABLES:
- products: Contains agricultural products with name, price, category, vendor, stock_quantity (ordered by most recent)
- orders: Contains order information with customer details, status, delivery address
- users: Contains user profiles with name, email, phone, user_type
- profiles: Contains additional user profile information

NAVIGATION CAPABILITIES:
- You can navigate users to different pages: home (/), marketplace, dashboard, orders, about, vendors, fertilizer-friend
- You can scroll to sections on the home page: hero, problem, solution, features, marketplace, fertilizer, pricing, footer

INSTRUCTIONS:
- Use database query tools when users ask about products, prices, orders, or statistics
- All product queries return the most recent items first
- When no products match a search, be helpful: suggest viewing available products or navigating to the marketplace
- If available_products are provided in tool results, mention some of them as alternatives
- Use navigation tools when users want to go to a specific page or section (e.g., "take me to marketplace", "show me pricing")
- Always be helpful, conversational, and provide accurate information based on REAL database results
- When navigating, confirm the action (e.g., "Taking you to the marketplace now!")
- Understand voice commands naturally (e.g., "tomato prices" = query products for tomatoes)
- Never make up product information - only use data from actual database queries`
    };

    const conversationMessages = [systemMessage, ...messages];
    let navigationAction = null;

    // Main conversation loop to handle tool calls
    for (let iteration = 0; iteration < 5; iteration++) {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: conversationMessages,
          tools: tools,
          temperature: 0.7,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Lovable AI error:', response.status, errorText);
        
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: 'AI service is currently busy. Please try again in a moment.' }), 
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), 
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify({ error: 'Failed to get response from AI service.' }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      console.log('Lovable AI response:', JSON.stringify(data, null, 2));

      const choice = data.choices?.[0];
      if (!choice) {
        console.error('No choice in response');
        break;
      }

      const message = choice.message;
      conversationMessages.push(message);

      // Check if there are tool calls
      if (!message.tool_calls || message.tool_calls.length === 0) {
        // No more tool calls, return final response
        return new Response(
          JSON.stringify({ 
            message: message.content,
            navigation: navigationAction
          }), 
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Execute tool calls
      const toolResults = [];
      
      for (const toolCall of message.tool_calls) {
        console.log('Executing tool:', toolCall.function.name, 'with args:', toolCall.function.arguments);
        
        let result;
        const args = JSON.parse(toolCall.function.arguments);
        
        try {
          switch (toolCall.function.name) {
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
              let query = supabase.from('orders').select('*');
              
              if (args?.customer_id) {
                query = query.eq('customer_id', args.customer_id);
              }
              
              if (args?.status) {
                query = query.eq('status', args.status);
              }
              
              query = query.limit(10);
              
              const { data: orders, error } = await query;
              
              if (error) {
                console.error('Database error:', error);
                result = { error: 'Failed to query orders', details: error.message };
              } else {
                result = { orders, count: orders?.length || 0 };
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
        
        toolResults.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result)
        });
      }

      // Add tool results to conversation
      conversationMessages.push(...toolResults);
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
