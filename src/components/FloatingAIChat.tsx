import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Mic, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: number;
  type: 'user' | 'bot';
  message: string;
  timestamp: string;
}

const FloatingAIChat = () => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      type: 'bot',
      message: 'Hello! I\'m your AgriConnect AI assistant powered by Gemini 2.5 Flash. I have access to our complete database and can help you with products, orders, farming advice, and much more. How can I help you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const { addToCart, cart, orders } = useAppContext();
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    // Check browser compatibility
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    // Handle speech recognition results
    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      setInterimTranscript(interim);

      if (final) {
        setNewMessage(final);
        setInterimTranscript('');
        // Auto-submit after a short delay
        setTimeout(() => {
          setIsListening(false);
          // Trigger send message
          const sendButton = document.querySelector('[data-send-message]') as HTMLButtonElement;
          if (sendButton) sendButton.click();
        }, 500);
      }
    };

    // Handle errors
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setInterimTranscript('');

      let errorMessage = 'Voice recognition failed. Please try again.';

      switch (event.error) {
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please enable microphone permissions in your browser settings.';
          break;
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your connection.';
          break;
        case 'aborted':
          errorMessage = 'Speech recognition aborted.';
          break;
      }

      toast({
        title: "Voice Input Error",
        description: errorMessage,
        variant: "destructive"
      });
    };

    // Handle recognition end
    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: messages.length + 1,
      type: 'user',
      message: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsLoading(true);

    try {
      // Prepare conversation history for Gemini
      const conversationHistory = [...messages, userMessage].map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.message
      }));

      console.log('Sending message to Gemini API...');

      // Call the Gemini edge function
      const { data, error } = await supabase.functions.invoke('chat-with-gemini', {
        body: { messages: conversationHistory }
      });

      if (error) {
        console.error('Error calling chat function:', error);
        throw new Error(error.message || 'Failed to get response from AI');
      }

      if (!data || !data.message) {
        console.error('Invalid response from chat function:', data);
        throw new Error('Invalid response from AI');
      }

      console.log('Received response from Gemini API');

      const botMessage: ChatMessage = {
        id: messages.length + 2,
        type: 'bot',
        message: data.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error: any) {
      console.error('Error in chat:', error);

      let errorMessage = 'Sorry, I encountered an error. Please try again.';

      if (error.message?.includes('busy')) {
        errorMessage = 'I\'m currently experiencing high demand. Please try again in a moment.';
      } else if (error.message?.includes('configured')) {
        errorMessage = 'The AI service is not properly configured. Please contact support.';
      }

      const errorBotMessage: ChatMessage = {
        id: messages.length + 2,
        type: 'bot',
        message: errorMessage,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, errorBotMessage]);

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Not Supported",
        description: "Speech recognition is not supported in your browser. Please try Chrome, Edge, or Safari.",
        variant: "destructive"
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setInterimTranscript('');
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast({
          title: "Listening",
          description: "Speak now... I'm listening to your question.",
        });
      } catch (error) {
        console.error('Error starting recognition:', error);
        toast({
          title: "Error",
          description: "Failed to start voice recognition. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-full btn-hero shadow-2xl hover:scale-110 transition-all duration-300 animate-pulse"
        >
          <MessageCircle className="w-8 h-8" />
        </Button>
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)]">
      <Card className="bg-white shadow-2xl rounded-2xl overflow-hidden max-h-[80vh] flex flex-col">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold">AgriConnect AI</h3>
              <p className="text-white/80 text-sm">Always here to help</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-80">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-2 max-w-xs ${
                message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.type === 'user' ? 'bg-blue-600' : 'bg-green-600'
                }`}>
                  {message.type === 'user' ? 
                    <User className="w-4 h-4 text-white" /> : 
                    <Bot className="w-4 h-4 text-white" />
                  }
                </div>
                <div className={`p-3 rounded-lg ${
                  message.type === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  <p className="text-sm leading-relaxed">{message.message}</p>
                  <p className={`text-xs mt-1 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-2 border-t bg-gray-50">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setNewMessage("Check my cart")}
              className="text-xs bg-white border border-gray-200 rounded-full px-3 py-1 hover:bg-blue-50 transition-colors"
            >
              Check Cart
            </button>
            <button
              onClick={() => setNewMessage("Track my orders")}
              className="text-xs bg-white border border-gray-200 rounded-full px-3 py-1 hover:bg-blue-50 transition-colors"
            >
              Track Orders
            </button>
            <button
              onClick={() => setNewMessage("Today's crop prices")}
              className="text-xs bg-white border border-gray-200 rounded-full px-3 py-1 hover:bg-blue-50 transition-colors"
            >
              Crop Prices
            </button>
          </div>
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t bg-white">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleVoice}
              className={`${isListening ? 'bg-red-100 border-red-300' : ''}`}
            >
              <Mic className={`w-4 h-4 ${isListening ? 'text-red-600' : 'text-gray-600'}`} />
            </Button>
            
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Ask me anything about farming..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isLoading}
              className="btn-hero px-4"
              data-send-message
            >
              {isLoading ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          {isListening && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-center text-red-600">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse mr-2"></div>
                <span className="text-sm font-medium">Listening...</span>
              </div>
              {interimTranscript && (
                <div className="text-xs text-gray-500 text-center italic">
                  "{interimTranscript}"
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default FloatingAIChat;