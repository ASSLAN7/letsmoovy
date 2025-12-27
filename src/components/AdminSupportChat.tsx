import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Send, Loader2, MessageCircle, User, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  sender_type: 'user' | 'agent';
  created_at: string;
}

interface Conversation {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
}

const AdminSupportChat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadConversations();

    const channel = supabase
      .channel('admin-chat-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_conversations',
        },
        () => {
          loadConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!selectedConversation) return;

    const channel = supabase
      .channel(`admin-messages-${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation]);

  const loadConversations = async () => {
    setLoadingConversations(true);
    try {
      const { data: convData, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Get user profiles
      const userIds = [...new Set(convData?.map((c) => c.user_id) || [])];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      const conversationsWithProfiles = (convData || []).map((conv) => ({
        ...conv,
        profiles: profilesData?.find((p) => p.id === conv.user_id) || null,
      }));

      setConversations(conversationsWithProfiles);
    } catch (err) {
      console.error('Error loading conversations:', err);
      toast.error('Fehler beim Laden der Chats');
    } finally {
      setLoadingConversations(false);
    }
  };

  const selectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setLoadingMessages(true);

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversation.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []) as Message[]);
    } catch (err) {
      console.error('Error loading messages:', err);
      toast.error('Fehler beim Laden der Nachrichten');
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !selectedConversation || !user || sending) return;

    const content = inputValue.trim();
    setInputValue('');
    setSending(true);

    try {
      const { error } = await supabase.from('chat_messages').insert({
        conversation_id: selectedConversation.id,
        sender_id: user.id,
        sender_type: 'agent',
        content,
      });

      if (error) throw error;
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Nachricht konnte nicht gesendet werden');
      setInputValue(content);
    } finally {
      setSending(false);
    }
  };

  const closeConversation = async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('chat_conversations')
        .update({ status: 'closed' })
        .eq('id', conversationId);

      if (error) throw error;

      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }

      toast.success('Chat geschlossen');
      loadConversations();
    } catch (err) {
      console.error('Error closing conversation:', err);
      toast.error('Fehler beim Schließen');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const openConversations = conversations.filter((c) => c.status === 'open');
  const closedConversations = conversations.filter((c) => c.status === 'closed');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[600px]">
      {/* Conversation List */}
      <div className="glass rounded-xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Chats ({openConversations.length} offen)
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConversations ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Keine Chats vorhanden
            </div>
          ) : (
            <div className="divide-y divide-border">
              {openConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full p-4 text-left hover:bg-secondary/50 transition-colors ${
                    selectedConversation?.id === conv.id ? 'bg-secondary' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium truncate">
                      {conv.profiles?.full_name || conv.profiles?.email || 'Unbekannt'}
                    </span>
                    <Badge variant="default" className="text-xs">Offen</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(conv.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                  </p>
                </button>
              ))}
              {closedConversations.length > 0 && (
                <>
                  <div className="px-4 py-2 bg-muted/50 text-xs text-muted-foreground">
                    Geschlossen
                  </div>
                  {closedConversations.slice(0, 5).map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => selectConversation(conv)}
                      className={`w-full p-4 text-left hover:bg-secondary/50 transition-colors opacity-60 ${
                        selectedConversation?.id === conv.id ? 'bg-secondary' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium truncate">
                          {conv.profiles?.full_name || conv.profiles?.email || 'Unbekannt'}
                        </span>
                        <Badge variant="outline" className="text-xs">Geschlossen</Badge>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="md:col-span-2 glass rounded-xl overflow-hidden flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {selectedConversation.profiles?.full_name || 'Unbekannt'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedConversation.profiles?.email}
                  </p>
                </div>
              </div>
              {selectedConversation.status === 'open' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => closeConversation(selectedConversation.id)}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Schließen
                </Button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Keine Nachrichten
                </div>
              ) : (
                messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.sender_type === 'agent' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        message.sender_type === 'agent'
                          ? 'gradient-accent text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p
                        className={`text-xs mt-1 ${
                          message.sender_type === 'agent'
                            ? 'text-primary-foreground/70'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {format(new Date(message.created_at), 'HH:mm', { locale: de })}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {selectedConversation.status === 'open' && (
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Antwort schreiben..."
                    className="flex-1"
                    disabled={sending}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!inputValue.trim() || sending}
                    className="gradient-accent"
                    size="icon"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>Wähle einen Chat aus</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSupportChat;
