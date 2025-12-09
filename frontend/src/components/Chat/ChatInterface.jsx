import { useState, useRef, useEffect } from 'react';
import { chatAPI } from '../../services/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { useToast } from '../ui/use-toast';
import { Send, Bot, User, Copy, CheckCheck, Sparkles } from 'lucide-react';

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: 'Hello Jivit! I\'m your AI email assistant. I can help you search your emails, draft replies, and answer questions about your inbox. How can I help you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const scrollRef = useRef(null);
  const { toast } = useToast();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatAPI.query(userMessage.content);
      
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.answer || 'I apologize, but I couldn\'t process that request. Please try again.',
        timestamp: new Date(),
        sources: response.sources || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to get response from AI',
      });
      
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again or check your connection.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyMessage = (messageId, content) => {
    navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: 'Copied',
      description: 'Message copied to clipboard',
    });
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="flex flex-col pb-32 pt-10">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`w-full px-4 py-6 ${
                message.role === 'assistant' ? 'bg-transparent' : 'bg-transparent'
              }`}
            >
              <div className="max-w-3xl mx-auto flex gap-6">
                {/* Avatar */}
                <Avatar className={`h-8 w-8 shrink-0 ${
                  message.role === 'assistant' 
                    ? 'bg-zinc-100 border border-zinc-200' 
                    : 'bg-transparent'
                }`}>
                  <AvatarFallback
                    className={
                      message.role === 'user'
                        ? 'bg-transparent'
                        : 'bg-transparent text-zinc-900'
                    }
                  >
                    {message.role === 'user' ? null : <Bot className="h-5 w-5" />}
                  </AvatarFallback>
                </Avatar>

                {/* Content */}
                <div className={`flex-1 space-y-2 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                  <div className={`${
                    message.role === 'user' 
                      ? 'bg-zinc-100 text-zinc-900 rounded-3xl px-5 py-3 max-w-[85%]' 
                      : 'text-zinc-900 pt-1'
                  }`}>
                    <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                    
                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-zinc-100">
                        <p className="text-xs font-semibold text-zinc-500 mb-2 uppercase tracking-wider">
                          Sources
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {message.sources.slice(0, 3).map((source, idx) => (
                            <div
                              key={idx}
                              className="text-xs bg-zinc-50 text-zinc-600 px-2 py-1.5 rounded-md border border-zinc-200 truncate max-w-[200px]"
                            >
                              {source.subject || 'Email'}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions (Copy) */}
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mt-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-zinc-400 hover:text-zinc-900"
                        onClick={() => copyMessage(message.id, message.content)}
                      >
                        {copiedId === message.id ? (
                          <CheckCheck className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="w-full px-4 py-6">
              <div className="max-w-3xl mx-auto flex gap-6">
                <Avatar className="h-8 w-8 shrink-0 bg-zinc-100 border border-zinc-200">
                  <AvatarFallback className="bg-transparent text-zinc-900">
                    <Bot className="h-5 w-5" />
                  </AvatarFallback>
                </Avatar>
                <div className="pt-2">
                  <div className="flex gap-1.5">
                    <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-pulse" />
                    <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-pulse delay-75" />
                    <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-pulse delay-150" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-white via-white to-transparent pb-6 pt-10 px-4">
        <div className="max-w-3xl mx-auto relative">
          <div className="relative flex items-center bg-white rounded-2xl border border-zinc-200 shadow-lg shadow-zinc-200/50 focus-within:ring-1 focus-within:ring-zinc-200 focus-within:border-zinc-300">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message InboxIQ..."
              disabled={isLoading}
              className="flex-1 min-h-[52px] border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-3 text-base placeholder:text-zinc-400"
            />
            <div className="pr-2">
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
                className={`h-8 w-8 rounded-lg ${
                  input.trim() 
                    ? 'bg-zinc-900 text-zinc-50 hover:bg-zinc-800' 
                    : 'bg-zinc-100 text-zinc-300'
                }`}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <p className="text-[10px] text-zinc-400 mt-2 text-center">
            InboxIQ can make mistakes. Consider checking important information.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
