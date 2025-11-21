import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DatabaseQueryTool {
  table: string;
  operation: 'select' | 'count';
  filters?: Record<string, any>;
  columns?: string;
}

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

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured');
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

    // Define tools for database access
    const tools = [
      {
        function_declarations: [
          {
            name: "query_products",
            description: "Query the products table to get information about available products, their prices, categories, and stock",
            parameters: {
              type: "object",
              properties: {
                filters: {
                  type: "object",
                  description: "Filters to apply (e.g., category, name contains)"
                },
                limit: {
                  type: "number",
                  description: "Maximum number of results to return"
                }
              }
            }
          },
          {
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
          },
          {
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
        ]
      }
    ];

    // Prepare messages for Gemini
    const geminiMessages = messages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Add system context as first message
    geminiMessages.unshift({
      role: 'user',
      parts: [{
        text: `You are an AI assistant for AgriConnect, an agricultural marketplace platform. You have access to the following database tables:
- products: Contains agricultural products with name, price, category, vendor, stock_quantity
- orders: Contains order information with customer details, status, delivery address
- users: Contains user profiles with name, email, phone, user_type
- profiles: Contains additional user profile information

Use the provided tools to query the database when users ask about products, orders, or statistics. Always be helpful and provide accurate information based on the database.`
      }]
    });

    geminiMessages.push({
      role: 'model',
      parts: [{ text: 'I understand. I will help users with product information, orders, and other queries about AgriConnect.' }]
    });

    let conversationHistory = [...geminiMessages];
    let finalResponse = '';

    // Main conversation loop to handle tool calls
    for (let iteration = 0; iteration < 5; iteration++) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: conversationHistory,
            tools: tools,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', response.status, errorText);
        
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
      console.log('Gemini response:', JSON.stringify(data, null, 2));

      const candidate = data.candidates?.[0];
      if (!candidate) {
        console.error('No candidate in response');
        break;
      }

      // Add assistant response to history
      conversationHistory.push({
        role: 'model',
        parts: candidate.content.parts
      });

      // Check if there are function calls
      const functionCalls = candidate.content.parts.filter((part: any) => part.functionCall);
      
      if (functionCalls.length === 0) {
        // No more function calls, extract final text
        const textParts = candidate.content.parts.filter((part: any) => part.text);
        finalResponse = textParts.map((part: any) => part.text).join('');
        break;
      }

      // Execute function calls
      const functionResponses = [];
      
      for (const part of functionCalls) {
        const functionCall = part.functionCall;
        console.log('Executing function:', functionCall.name, 'with args:', functionCall.args);
        
        let result;
        
        try {
          switch (functionCall.name) {
            case 'query_products': {
              let query = supabase.from('products').select('*');
              
              if (functionCall.args?.filters) {
                const filters = functionCall.args.filters;
                if (filters.category) {
                  query = query.ilike('category', `%${filters.category}%`);
                }
                if (filters.name) {
                  query = query.ilike('name', `%${filters.name}%`);
                }
              }
              
              if (functionCall.args?.limit) {
                query = query.limit(functionCall.args.limit);
              } else {
                query = query.limit(10);
              }
              
              const { data: products, error } = await query;
              
              if (error) {
                console.error('Database error:', error);
                result = { error: 'Failed to query products', details: error.message };
              } else {
                result = { products, count: products?.length || 0 };
              }
              break;
            }
            
            case 'query_orders': {
              let query = supabase.from('orders').select('*');
              
              if (functionCall.args?.customer_id) {
                query = query.eq('customer_id', functionCall.args.customer_id);
              }
              
              if (functionCall.args?.status) {
                query = query.eq('status', functionCall.args.status);
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
              const table = functionCall.args?.table;
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
        
        functionResponses.push({
          functionResponse: {
            name: functionCall.name,
            response: result
          }
        });
      }

      // Add function responses to conversation
      conversationHistory.push({
        role: 'user',
        parts: functionResponses as any
      });
    }

    if (!finalResponse) {
      console.error('No final response generated');
      return new Response(
        JSON.stringify({ error: 'Failed to generate response' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Sending final response');
    return new Response(
      JSON.stringify({ message: finalResponse }), 
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
