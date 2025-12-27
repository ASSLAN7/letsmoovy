import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Send, Loader2, MessageCircle, User, CheckCircle, Zap, ChevronDown } from 'lucide-react';
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

interface Template {
  id: string;
  label: string;
  content: string;
  category: string;
}

const RESPONSE_TEMPLATES: Template[] = [
  {
    id: '1',
    label: 'Begrüßung',
    content: 'Hallo! Vielen Dank für deine Nachricht. Wie kann ich dir heute helfen?',
    category: 'Allgemein',
  },
  {
    id: '2',
    label: 'Buchung bestätigen',
    content: 'Deine Buchung wurde erfolgreich bestätigt. Du erhältst in Kürze eine E-Mail mit allen Details.',
    category: 'Buchung',
  },
  {
    id: '3',
    label: 'Stornierung',
    content: 'Ich habe deine Stornierungsanfrage erhalten. Die Stornierung wird innerhalb von 24 Stunden bearbeitet und der Betrag wird erstattet.',
    category: 'Buchung',
  },
  {
    id: '4',
    label: 'Fahrzeug nicht verfügbar',
    content: 'Leider ist das gewünschte Fahrzeug zum angegebenen Zeitpunkt nicht verfügbar. Möchtest du, dass ich dir Alternativen zeige?',
    category: 'Fahrzeuge',
  },
  {
    id: '5',
    label: 'Preisanfrage',
    content: 'Die Preise variieren je nach Fahrzeugkategorie und Buchungsdauer. Du findest alle aktuellen Preise in unserer Preisübersicht auf der Startseite.',
    category: 'Preise',
  },
  {
    id: '6',
    label: 'Technisches Problem',
    content: 'Entschuldige die Unannehmlichkeiten. Könntest du mir bitte mehr Details zu dem Problem geben? Welchen Browser verwendest du?',
    category: 'Support',
  },
  {
    id: '7',
    label: 'Zahlungsproblem',
    content: 'Bei Zahlungsproblemen überprüfe bitte, ob deine Zahlungsmethode aktuell ist. Wenn das Problem weiterhin besteht, wende dich an deine Bank.',
    category: 'Zahlung',
  },
  {
    id: '8',
    label: 'Verabschiedung',
    content: 'Vielen Dank für deine Anfrage! Falls du weitere Fragen hast, melde dich gerne. Einen schönen Tag noch! 🚗',
    category: 'Allgemein',
  },
];

const AdminSupportChat = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
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
              <div className="border-t border-border">
                {/* Quick Templates */}
                <AnimatePresence>
                  {showTemplates && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 bg-secondary/30 max-h-[200px] overflow-y-auto">
                        <div className="grid grid-cols-2 gap-2">
                          {RESPONSE_TEMPLATES.map((template) => (
                            <button
                              key={template.id}
                              onClick={() => {
                                setInputValue(template.content);
                                setShowTemplates(false);
                              }}
                              className="text-left p-2 rounded-lg bg-background hover:bg-secondary transition-colors text-sm"
                            >
                              <span className="font-medium text-foreground">{template.label}</span>
                              <span className="block text-xs text-muted-foreground mt-0.5 truncate">
                                {template.content.substring(0, 50)}...
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="p-4">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowTemplates(!showTemplates)}
                      className={showTemplates ? 'bg-primary text-primary-foreground' : ''}
                      title="Schnellantworten"
                    >
                      <Zap className="w-4 h-4" />
                    </Button>
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
