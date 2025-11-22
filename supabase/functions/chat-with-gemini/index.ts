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
      return new Response(
        JSON.stringify({ error: 'Messages must be an array' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize messages to handle both string content and array content (for images)
    const normalizedMessages = messages.map((msg: any) => {
      // If content is already an array (contains text + image), keep it as is
      if (Array.isArray(msg.content)) {
        return msg;
      }
      // Otherwise, wrap string content in standard format
      return {
        ...msg,
        content: msg.content
      };
    });

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase
    const authHeader = req.headers.get('authorization');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let userId = null;
    let isAuthenticated = false;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) {
        userId = user.id;
        isAuthenticated = true;
      }
    }

    console.log('Processing chat with', messages.length, 'messages', isAuthenticated ? '(authenticated)' : '(guest)');

    // Define tools for real-time data access
    const tools = [
      {
        type: "function",
        function: {
          name: "get_weather",
          description: "Get real-time weather information for any location including temperature, conditions, humidity, wind speed, and forecast.",
          parameters: {
            type: "object",
            properties: {
              location: {
                type: "string",
                description: "City name or location (e.g., 'Delhi', 'Mumbai', 'New York')"
              }
            },
            required: ["location"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "search_market_prices",
          description: "Search for current market prices, commodity rates, agricultural product prices, stock prices, or any market-related information in real-time.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "What to search for (e.g., 'wheat price today', 'gold rate', 'tomato market price', 'Bitcoin price')"
              }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "web_search",
          description: "Search the web for current information, news, facts, or any real-time data. Use this for questions about recent events, current data, or information not in your training.",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query (e.g., 'latest news India', 'current inflation rate', 'who won the match today')"
              }
            },
            required: ["query"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "query_products",
          description: "Search products in the AgriConnect marketplace database.",
          parameters: {
            type: "object",
            properties: {
              search_term: {
                type: "string",
                description: "Product name or category to search for"
              },
              limit: {
                type: "number",
                description: "Maximum number of results (default: 10)"
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "query_orders",
          description: "Get user's order information. Requires user to be logged in.",
          parameters: {
            type: "object",
            properties: {
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
          name: "navigate_to",
          description: "Navigate user to a specific page on the website.",
          parameters: {
            type: "object",
            properties: {
              route: {
                type: "string",
                description: "Page route (e.g., '/marketplace', '/dashboard', '/orders')"
              }
            },
            required: ["route"]
          }
        }
      }
    ];

    // System instruction
    const systemMessage = {
      role: "system",
      content: `You are AgriConnect AI, a helpful and versatile AI assistant with access to real-time information.

**YOUR CAPABILITIES:**
- General Knowledge: Answer ANY question about science, history, technology, culture, entertainment, education, etc.
- Real-Time Data Access: Get current weather, market prices, news, and web information
- Agricultural Expertise: Specialized knowledge in farming, crops, fertilizers
- Marketplace Access: Query AgriConnect products, orders, and user data

**REAL-TIME TOOLS AVAILABLE:**
- get_weather: Get current weather for any location
- search_market_prices: Get real-time prices for commodities, agricultural products, stocks, etc.
- web_search: Search the web for current information and news
- query_products: Search marketplace products
- query_orders: Check user orders (requires login)
- navigate_to: Navigate to different pages

**USER STATUS:** ${isAuthenticated ? 'Logged in (can access orders)' : 'Guest (login required for orders)'}

**INSTRUCTIONS:**
1. Answer ANY question - use tools when you need current/real-time information
2. For weather questions, ALWAYS use get_weather tool
3. For market prices, commodity rates, stocks, ALWAYS use search_market_prices
4. For current events, news, recent data, ALWAYS use web_search
5. Be conversational, friendly, and helpful
6. Provide accurate, well-informed responses using real-time data when available
7. If you don't know something and no tool is available, be honest about it`
    };

    // Conversation loop to handle tool calls
    const conversationMessages = [systemMessage, ...normalizedMessages];
    let navigationAction = null;
    let iterations = 0;
    const maxIterations = 10;

    while (iterations < maxIterations) {
      iterations++;
      console.log(`Iteration ${iterations}`);

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
          tool_choice: 'auto',
          temperature: 0.7,
          max_tokens: 2000
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Lovable AI error:', response.status, errorText);
        
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: 'AI service is busy. Please try again in a moment.' }), 
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: 'AI service credits exhausted. Please contact support or add credits to continue.' }), 
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(
          JSON.stringify({ error: 'Failed to get AI response' }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      
      if (!choice) {
        return new Response(
          JSON.stringify({ error: 'No response from AI' }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const message = choice.message;

      // Check if AI wants to call a function
      if (message.tool_calls && message.tool_calls.length > 0) {
        console.log('AI requested tool calls:', message.tool_calls.length);
        
        // Add assistant message with tool calls
        conversationMessages.push(message);

        // Execute each tool call
        for (const toolCall of message.tool_calls) {
          const functionName = toolCall.function.name;
          const functionArgs = JSON.parse(toolCall.function.arguments);
          
          console.log(`Executing tool: ${functionName}`, functionArgs);

          let toolResult;

          try {
            switch (functionName) {
              case 'get_weather': {
                // Get weather using wttr.in API
                const location = functionArgs.location;
                const weatherResponse = await fetch(`https://wttr.in/${encodeURIComponent(location)}?format=j1`);
                if (weatherResponse.ok) {
                  const weatherData = await weatherResponse.json();
                  const current = weatherData.current_condition[0];
                  toolResult = {
                    location: location,
                    temperature_c: current.temp_C,
                    temperature_f: current.temp_F,
                    condition: current.weatherDesc[0].value,
                    humidity: current.humidity,
                    wind_speed_kmph: current.windspeedKmph,
                    feels_like_c: current.FeelsLikeC,
                    visibility_km: current.visibility
                  };
                } else {
                  toolResult = { error: 'Unable to fetch weather data' };
                }
                break;
              }

              case 'search_market_prices': {
                // Use DuckDuckGo for market prices search
                const query = functionArgs.query;
                const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' current price rate')}`;
                
                try {
                  const searchResponse = await fetch(searchUrl, {
                    headers: {
                      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                  });
                  const searchHtml = await searchResponse.text();
                  
                  // Extract snippets from search results
                  const snippets = [];
                  const snippetRegex = /<a class="result__snippet"[^>]*>(.*?)<\/a>/g;
                  let match;
                  while ((match = snippetRegex.exec(searchHtml)) !== null && snippets.length < 3) {
                    snippets.push(match[1].replace(/<[^>]*>/g, '').substring(0, 200));
                  }
                  
                  toolResult = {
                    query: query,
                    information: snippets.length > 0 ? snippets.join(' | ') : 'Market price information not available. Try being more specific.'
                  };
                } catch (error) {
                  toolResult = { query: query, information: 'Unable to fetch current market prices. Please try rephrasing your query.' };
                }
                break;
              }

              case 'web_search': {
                // Use DuckDuckGo for web search
                const query = functionArgs.query;
                const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
                
                try {
                  const searchResponse = await fetch(searchUrl, {
                    headers: {
                      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                  });
                  const searchHtml = await searchResponse.text();
                  
                  // Extract snippets
                  const snippets = [];
                  const snippetRegex = /<a class="result__snippet"[^>]*>(.*?)<\/a>/g;
                  let match;
                  while ((match = snippetRegex.exec(searchHtml)) !== null && snippets.length < 5) {
                    snippets.push(match[1].replace(/<[^>]*>/g, ''));
                  }
                  
                  toolResult = {
                    query: query,
                    results: snippets.length > 0 ? snippets : ['No results found. Try rephrasing your query.']
                  };
                } catch (error) {
                  toolResult = { query: query, error: 'Unable to search the web at this time.' };
                }
                break;
              }

              case 'query_products': {
                let query = supabase.from('products').select('*');
                
                if (functionArgs.search_term) {
                  query = query.or(`name.ilike.%${functionArgs.search_term}%,description.ilike.%${functionArgs.search_term}%,category.ilike.%${functionArgs.search_term}%`);
                }
                
                query = query.limit(functionArgs.limit || 10);
                
                const { data: products, error } = await query;
                toolResult = error ? { error: error.message } : { products: products || [] };
                break;
              }

              case 'query_orders': {
                if (!userId) {
                  toolResult = { error: 'User must be logged in to view orders' };
                  break;
                }

                let query = supabase
                  .from('orders')
                  .select('*, order_items(*)')
                  .eq('customer_id', userId);

                if (functionArgs.status) {
                  query = query.eq('status', functionArgs.status);
                }

                const { data: orders, error } = await query;
                toolResult = error ? { error: error.message } : { orders: orders || [] };
                break;
              }

              case 'navigate_to': {
                navigationAction = functionArgs.route;
                toolResult = { success: true, route: functionArgs.route };
                break;
              }

              default:
                toolResult = { error: 'Unknown function' };
            }
          } catch (error) {
            console.error(`Error executing ${functionName}:`, error);
            toolResult = { error: `Failed to execute ${functionName}` };
          }

          // Add tool response to conversation
          conversationMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult)
          });
        }

        // Continue the loop to get AI's response with the tool results
        continue;
      }

      // No more tool calls, return the final response
      const finalMessage = message.content;
      
      if (!finalMessage) {
        return new Response(
          JSON.stringify({ error: 'No response from AI' }), 
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          message: finalMessage,
          navigation: navigationAction 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Max iterations reached
    return new Response(
      JSON.stringify({ 
        message: "I've gathered the information but need to process it further. Please try asking your question again.",
        navigation: null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in chat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
