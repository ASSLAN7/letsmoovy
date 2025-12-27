import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Send, Loader2, MessageCircle, User, CheckCircle, Zap, Plus, Edit, Trash2, X, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  isDefault?: boolean;
}

const DEFAULT_TEMPLATES: Template[] = [
  { id: 'default-1', label: 'Begrüßung', content: 'Hallo! Vielen Dank für deine Nachricht. Wie kann ich dir heute helfen?', category: 'Allgemein', isDefault: true },
  { id: 'default-2', label: 'Buchung bestätigen', content: 'Deine Buchung wurde erfolgreich bestätigt. Du erhältst in Kürze eine E-Mail mit allen Details.', category: 'Buchung', isDefault: true },
  { id: 'default-3', label: 'Stornierung', content: 'Ich habe deine Stornierungsanfrage erhalten. Die Stornierung wird innerhalb von 24 Stunden bearbeitet und der Betrag wird erstattet.', category: 'Buchung', isDefault: true },
  { id: 'default-4', label: 'Verabschiedung', content: 'Vielen Dank für deine Anfrage! Falls du weitere Fragen hast, melde dich gerne. Einen schönen Tag noch! 🚗', category: 'Allgemein', isDefault: true },
];

const TEMPLATE_CATEGORIES = ['Allgemein', 'Buchung', 'Fahrzeuge', 'Preise', 'Zahlung', 'Support'];

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
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [templateForm, setTemplateForm] = useState({ label: '', content: '', category: 'Allgemein' });
  const [savingTemplate, setSavingTemplate] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const allTemplates = [...DEFAULT_TEMPLATES, ...customTemplates];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadConversations();
    loadCustomTemplates();

    const channel = supabase
      .channel('admin-chat-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_conversations' }, () => {
        loadConversations();
      })
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
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${selectedConversation.id}` },
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

  const loadCustomTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const { data, error } = await supabase
        .from('support_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomTemplates((data || []).map(t => ({ ...t, isDefault: false })));
    } catch (err) {
      console.error('Error loading templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const loadConversations = async () => {
    setLoadingConversations(true);
    try {
      const { data: convData, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;

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

  const openTemplateDialog = (template?: Template) => {
    if (template) {
      setEditingTemplate(template);
      setTemplateForm({ label: template.label, content: template.content, category: template.category });
    } else {
      setEditingTemplate(null);
      setTemplateForm({ label: '', content: '', category: 'Allgemein' });
    }
    setTemplateDialogOpen(true);
  };

  const saveTemplate = async () => {
    if (!templateForm.label.trim() || !templateForm.content.trim() || !user) {
      toast.error('Bitte fülle alle Felder aus');
      return;
    }

    setSavingTemplate(true);
    try {
      if (editingTemplate && !editingTemplate.isDefault) {
        const { error } = await supabase
          .from('support_templates')
          .update({
            label: templateForm.label.trim(),
            content: templateForm.content.trim(),
            category: templateForm.category,
          })
          .eq('id', editingTemplate.id);

        if (error) throw error;
        toast.success('Template aktualisiert');
      } else {
        const { error } = await supabase.from('support_templates').insert({
          label: templateForm.label.trim(),
          content: templateForm.content.trim(),
          category: templateForm.category,
          created_by: user.id,
        });

        if (error) throw error;
        toast.success('Template erstellt');
      }

      setTemplateDialogOpen(false);
      loadCustomTemplates();
    } catch (err) {
      console.error('Error saving template:', err);
      toast.error('Fehler beim Speichern');
    } finally {
      setSavingTemplate(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Template wirklich löschen?')) return;

    try {
      const { error } = await supabase.from('support_templates').delete().eq('id', templateId);
      if (error) throw error;
      toast.success('Template gelöscht');
      loadCustomTemplates();
    } catch (err) {
      console.error('Error deleting template:', err);
      toast.error('Fehler beim Löschen');
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
    <div className="space-y-4">
      {/* Template Manager Toggle */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowTemplateManager(!showTemplateManager)}
        >
          <Settings2 className="w-4 h-4 mr-2" />
          Templates verwalten
        </Button>
      </div>

      {/* Template Manager */}
      <AnimatePresence>
        {showTemplateManager && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="glass rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Antwort-Templates
                </h3>
                <Button size="sm" onClick={() => openTemplateDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Neues Template
                </Button>
              </div>

              <div className="space-y-2">
                {/* Default Templates */}
                <p className="text-xs text-muted-foreground font-medium mb-2">Standard-Templates</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                  {DEFAULT_TEMPLATES.map((template) => (
                    <div key={template.id} className="p-3 bg-secondary/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{template.label}</span>
                        <Badge variant="outline" className="text-xs">{template.category}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.content}</p>
                    </div>
                  ))}
                </div>

                {/* Custom Templates */}
                <p className="text-xs text-muted-foreground font-medium mb-2">Eigene Templates</p>
                {loadingTemplates ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  </div>
                ) : customTemplates.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Noch keine eigenen Templates erstellt
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {customTemplates.map((template) => (
                      <div key={template.id} className="p-3 bg-background rounded-lg border border-border">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{template.label}</span>
                          <div className="flex items-center gap-1">
                            <Badge variant="secondary" className="text-xs">{template.category}</Badge>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openTemplateDialog(template)}>
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteTemplate(template.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{template.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Grid */}
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
              <div className="text-center text-muted-foreground py-8">Keine Chats vorhanden</div>
            ) : (
              <div className="divide-y divide-border">
                {openConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`w-full p-4 text-left hover:bg-secondary/50 transition-colors ${selectedConversation?.id === conv.id ? 'bg-secondary' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium truncate">{conv.profiles?.full_name || conv.profiles?.email || 'Unbekannt'}</span>
                      <Badge variant="default" className="text-xs">Offen</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{format(new Date(conv.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}</p>
                  </button>
                ))}
                {closedConversations.length > 0 && (
                  <>
                    <div className="px-4 py-2 bg-muted/50 text-xs text-muted-foreground">Geschlossen</div>
                    {closedConversations.slice(0, 5).map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => selectConversation(conv)}
                        className={`w-full p-4 text-left hover:bg-secondary/50 transition-colors opacity-60 ${selectedConversation?.id === conv.id ? 'bg-secondary' : ''}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium truncate">{conv.profiles?.full_name || conv.profiles?.email || 'Unbekannt'}</span>
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
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                    <User className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedConversation.profiles?.full_name || 'Unbekannt'}</h3>
                    <p className="text-sm text-muted-foreground">{selectedConversation.profiles?.email}</p>
                  </div>
                </div>
                {selectedConversation.status === 'open' && (
                  <Button variant="outline" size="sm" onClick={() => closeConversation(selectedConversation.id)}>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Schließen
                  </Button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">Keine Nachrichten</div>
                ) : (
                  messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.sender_type === 'agent' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${message.sender_type === 'agent' ? 'gradient-accent text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${message.sender_type === 'agent' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {format(new Date(message.created_at), 'HH:mm', { locale: de })}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {selectedConversation.status === 'open' && (
                <div className="border-t border-border">
                  <AnimatePresence>
                    {showTemplates && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="p-3 bg-secondary/30 max-h-[200px] overflow-y-auto">
                          <div className="grid grid-cols-2 gap-2">
                            {allTemplates.map((template) => (
                              <button
                                key={template.id}
                                onClick={() => {
                                  setInputValue(template.content);
                                  setShowTemplates(false);
                                }}
                                className="text-left p-2 rounded-lg bg-background hover:bg-secondary transition-colors text-sm"
                              >
                                <span className="font-medium text-foreground">{template.label}</span>
                                {!template.isDefault && <Badge variant="secondary" className="ml-2 text-xs">Eigenes</Badge>}
                                <span className="block text-xs text-muted-foreground mt-0.5 truncate">{template.content.substring(0, 50)}...</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="p-4">
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => setShowTemplates(!showTemplates)} className={showTemplates ? 'bg-primary text-primary-foreground' : ''} title="Schnellantworten">
                        <Zap className="w-4 h-4" />
                      </Button>
                      <Input value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={handleKeyPress} placeholder="Antwort schreiben..." className="flex-1" disabled={sending} />
                      <Button onClick={sendMessage} disabled={!inputValue.trim() || sending} className="gradient-accent" size="icon">
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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

      {/* Template Dialog */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="glass max-w-md">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Template bearbeiten' : 'Neues Template'}</DialogTitle>
            <DialogDescription>Erstelle eine vorgefertigte Antwort für häufige Fragen.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="template-label">Name *</Label>
              <Input
                id="template-label"
                value={templateForm.label}
                onChange={(e) => setTemplateForm((prev) => ({ ...prev, label: e.target.value }))}
                placeholder="z.B. Buchung bestätigen"
              />
            </div>

            <div>
              <Label htmlFor="template-category">Kategorie</Label>
              <Select value={templateForm.category} onValueChange={(value) => setTemplateForm((prev) => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="template-content">Inhalt *</Label>
              <Textarea
                id="template-content"
                value={templateForm.content}
                onChange={(e) => setTemplateForm((prev) => ({ ...prev, content: e.target.value }))}
                placeholder="Die Nachricht, die gesendet wird..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>Abbrechen</Button>
            <Button onClick={saveTemplate} disabled={savingTemplate} className="gradient-accent">
              {savingTemplate ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSupportChat;
