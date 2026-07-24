'use client';
import { Send, MessageSquare, User, Loader2, Image as ImageIcon, Search, ChevronLeft, X, Megaphone, Check } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export default function MessagesPage() {
  const [user, setUser] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Image preview state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Mobile layout state
  const [showChatMobile, setShowChatMobile] = useState(false);
  
  // Pagination state
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Broadcast state
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTargetIds, setBroadcastTargetIds] = useState<number[]>([]);
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedContactRef = useRef<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const broadcastFileInputRef = useRef<HTMLInputElement>(null);
  
  const [broadcastImage, setBroadcastImage] = useState<File | null>(null);
  const [broadcastImagePreview, setBroadcastImagePreview] = useState<string | null>(null);

  useEffect(() => {
    selectedContactRef.current = selectedContact;
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        action: 'focus',
        target_id: selectedContact ? selectedContact.id : null
      }));
    }
  }, [selectedContact]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    fetch((process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001') + '/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => setUser(data))
      .catch(err => console.error(err));
      
    fetchContacts(token);
  }, []);

  useEffect(() => {
    // Si venimos de un redirect de notificación con ?contact=ID
    const searchParams = new URLSearchParams(window.location.search);
    const contactIdStr = searchParams.get('contact');
    
    if (contacts.length > 0 && contactIdStr) {
      const contactId = parseInt(contactIdStr);
      const contact = contacts.find(c => c.id === contactId);
      if (contact) {
        setSelectedContact(contact);
        setShowChatMobile(true);
        // Limpiar la URL para que no nos fuerce de vuelta a este chat al cambiar de contacto
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [contacts]);

  useEffect(() => {
    if (user?.id) {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001';
      let wsUrl = '';
      if (apiUrl.startsWith('http')) {
        wsUrl = apiUrl.replace('http', 'ws') + `/chat/ws?token=${token}`;
      } else {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${protocol}//${window.location.host}${apiUrl}/chat/ws?token=${token}`;
      }
      ws.current = new WebSocket(wsUrl);
      
      ws.current.onopen = () => {
        ws.current?.send(JSON.stringify({
          action: 'focus',
          target_id: selectedContactRef.current ? selectedContactRef.current.id : null
        }));
      };
      
      ws.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (selectedContactRef.current && (data.sender_id === selectedContactRef.current.id || data.sender_id === user.id)) {
          setMessages((prev) => {
            if (prev.find(m => m.id === data.id)) return prev;
            return [...prev, {
              id: data.id || Date.now(),
              sender_id: data.sender_id,
              target_id: user.id,
              message: data.message,
              image_url: data.image_url,
              created_at: data.created_at || new Date().toISOString()
            }];
          });
          
          // Si recibimos un mensaje del usuario que estamos viendo, lo marcamos como leído de inmediato
          if (data.sender_id === selectedContactRef.current.id) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'}/chat/read/${data.sender_id}`, {
              method: 'PUT',
              headers: { 'Authorization': `Bearer ${token}` }
            }).then(() => {
              window.dispatchEvent(new Event('refreshNotifications'));
            }).catch(console.error);
          }
        } else {
          // Re-fetch contacts to update UI (like moving to top or unread indicator if we add one)
          fetchContacts();
          window.dispatchEvent(new Event('refreshNotifications'));
        }
      };
      
      return () => {
        ws.current?.close();
      };
    }
  }, [user]);

  useEffect(() => {
    if (selectedContact) {
      setOffset(0);
      setHasMore(true);
      fetchHistory(selectedContact.id, 0);
    }
  }, [selectedContact]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (offset === 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fetchContacts = async (token?: string | null) => {
    const authToken = token || localStorage.getItem('token');
    if (!authToken) return;
    
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001') + '/chat/contacts', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setContacts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingContacts(false);
    }
  };

  const fetchHistory = async (targetId: number, currentOffset: number = 0) => {
    const authToken = localStorage.getItem('token');
    if (!authToken) return;
    
    if (currentOffset === 0) {
      setLoadingMessages(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'}/chat/history/${targetId}?limit=50&offset=${currentOffset}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        if (data.length < 50) {
          setHasMore(false);
        }
        
        if (currentOffset === 0) {
          setMessages(data);
        } else {
          setMessages(prev => [...data, ...prev]);
        }
      }
      
      if (currentOffset === 0) {
        // Clear unread count locally for this contact
        setContacts(prev => prev.map(c => 
          c.id === targetId ? { ...c, unread_count: 0 } : c
        ));
        // Notify DashboardLayout to clean bell icon
        window.dispatchEvent(new Event('refreshNotifications'));
      }
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
      setLoadingMore(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    if (scrollTop === 0 && hasMore && !loadingMore && selectedContact) {
      const newOffset = offset + 50;
      setOffset(newOffset);
      fetchHistory(selectedContact.id, newOffset);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedImage(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const sendMessage = async () => {
    if ((!inputText.trim() && !selectedImage) || !selectedContact || !ws.current) return;
    
    if (ws.current.readyState !== WebSocket.OPEN) {
      alert("Desconectado del chat. Por favor refresca la página.");
      return;
    }

    setIsUploading(true);
    let uploadedImageUrl = null;

    if (selectedImage) {
      const authToken = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', selectedImage);
      try {
        const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001') + '/chat/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${authToken}` },
          body: formData
        });
        const data = await res.json();
        if (data.image_url) {
          uploadedImageUrl = data.image_url;
        }
      } catch (err) {
        console.error("Error uploading image:", err);
        setIsUploading(false);
        return; // Detener el envío si la imagen falló
      }
    }

    const payload = {
      target_id: selectedContact.id,
      message: inputText.trim() || null,
      image_url: uploadedImageUrl
    };
    
    ws.current.send(JSON.stringify(payload));
    
    setMessages(prev => [...prev, {
      id: Date.now(),
      sender_id: user?.id,
      target_id: selectedContact.id,
      message: inputText.trim() || null,
      image_url: uploadedImageUrl,
      created_at: new Date().toISOString()
    }]);
    
    setInputText('');
    setSelectedImage(null);
    setImagePreviewUrl(null);
    setIsUploading(false);
  };

  const filteredContacts = contacts.filter(c => 
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAvatarUrl = (url: string | null) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `${url?.startsWith('http') ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001')}${url}`;
  };

  const handleBroadcastImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setBroadcastImage(file);
    setBroadcastImagePreview(URL.createObjectURL(file));
    
    if (broadcastFileInputRef.current) broadcastFileInputRef.current.value = '';
  };

  const handleBroadcast = async () => {
    if ((!broadcastMessage.trim() && !broadcastImage) || broadcastTargetIds.length === 0) return;
    
    setSendingBroadcast(true);
    const token = localStorage.getItem('token');
    let uploadedImageUrl = null;
    
    try {
      if (broadcastImage) {
        const formData = new FormData();
        formData.append('file', broadcastImage);
        const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001') + '/chat/upload', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        const data = await res.json();
        if (data.image_url) {
          uploadedImageUrl = data.image_url;
        }
      }

      await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001') + '/chat/broadcast', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: broadcastMessage.trim() || null,
          image_url: uploadedImageUrl,
          target_ids: broadcastTargetIds.includes(-1) ? [-1] : broadcastTargetIds
        })
      });
      
      setBroadcastMessage('');
      setBroadcastImage(null);
      setBroadcastImagePreview(null);
      setBroadcastTargetIds([]);
      setShowBroadcastModal(false);
      // Opcional: mostrar tostada de éxito
    } catch (error) {
      console.error(error);
    } finally {
      setSendingBroadcast(false);
    }
  };

  if (loadingContacts) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="animate-pulse flex flex-col gap-4 w-80">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/10 rounded-full shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-3/4"></div>
                <div className="h-3 bg-white/10 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6">
      {/* Contact List */}
      <div className={`glass-panel w-full md:w-80 flex-col h-full p-0 overflow-hidden border-r border-white/10 ${showChatMobile ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-white/10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold" style={{ color: 'var(--primary)' }}>Mensajes</h2>
            {(user?.role?.name === 'admin' || user?.role?.name === 'coach') && (
              <button 
                onClick={() => setShowBroadcastModal(true)}
                className="p-2 rounded-full hover:bg-white/10 text-[var(--primary)] transition-colors"
                title="Mensaje Masivo"
              >
                <Megaphone size={20} />
              </button>
            )}
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
            <input 
              type="text" 
              placeholder="Buscar contacto..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-full py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-[var(--primary)]"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredContacts.map((contact) => (
            <div 
              key={contact.id}
              onClick={() => { 
                setSelectedContact(contact); 
                setShowChatMobile(true);
              }}
              className={`p-4 border-b border-white/5 flex items-center gap-3 cursor-pointer transition-colors ${selectedContact?.id === contact.id ? 'bg-white/5 border-l-2 border-l-[var(--primary)]' : 'hover:bg-white/5'}`}
            >
              <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center font-bold overflow-hidden shrink-0">
                {contact.avatar_url ? (
                  <img src={getAvatarUrl(contact.avatar_url)!} alt={contact.first_name} className="w-full h-full object-cover" />
                ) : (
                  <User size={20} />
                )}
              </div>
              <div className="flex-1 truncate flex items-center justify-between gap-2">
                <div className="truncate">
                  <p className="font-semibold truncate">{contact.first_name} {contact.last_name}</p>
                  <p className="text-xs opacity-60 capitalize">{contact.role}</p>
                </div>
                {contact.unread_count > 0 && (
                  <span className="bg-[var(--primary)] text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                    {contact.unread_count}
                  </span>
                )}
              </div>
            </div>
          ))}
          {filteredContacts.length === 0 && (
            <div className="p-4 text-sm opacity-50 text-center">No se encontraron contactos.</div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`glass-panel flex-1 flex-col h-full p-0 overflow-hidden relative ${!showChatMobile ? 'hidden md:flex' : 'flex'}`}>
        {selectedContact ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20 shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  className="md:hidden mr-1 p-2 -ml-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  onClick={() => setShowChatMobile(false)}
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center font-bold overflow-hidden shrink-0">
                  {selectedContact.avatar_url ? (
                    <img src={getAvatarUrl(selectedContact.avatar_url)!} alt={selectedContact.first_name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={20} />
                  )}
                </div>
                <h2 className="font-bold truncate">{selectedContact.first_name} {selectedContact.last_name}</h2>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4" onScroll={handleScroll}>
              {loadingMore && (
                <div className="flex justify-center p-2">
                  <Loader2 className="animate-spin" size={16} style={{ color: 'var(--primary)' }} />
                </div>
              )}
              {loadingMessages ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => (
                    <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                      <div className="w-48 h-12 bg-white/10 rounded-2xl animate-pulse"></div>
                    </div>
                  ))}
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender_id === user?.id;
                  return (
                    <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div 
                        className={`p-3 rounded-2xl max-w-[85%] md:max-w-[70%] ${
                          isMe 
                            ? 'rounded-tr-sm text-black' 
                            : 'bg-zinc-800 rounded-tl-sm border border-white/5 text-white'
                        }`}
                        style={isMe ? { backgroundColor: 'var(--primary)' } : {}}
                      >
                        {msg.image_url && (
                          <img 
                            src={getAvatarUrl(msg.image_url)!} 
                            alt="Attachment" 
                            className="max-w-full rounded-lg mb-2 object-cover max-h-64"
                          />
                        )}
                        {msg.message && <p className="text-sm break-words">{msg.message}</p>}
                        <span className={`text-[10px] mt-1 block text-right ${isMe ? 'opacity-60 text-black' : 'opacity-50 text-white'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              {messages.length === 0 && !loadingMessages && (
                <div className="text-center text-white/50 text-sm mt-10">
                  Envía un mensaje para iniciar la conversación.
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-black/20 flex flex-col gap-3 shrink-0">
              
              {/* Image Preview Area */}
              {imagePreviewUrl && (
                <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/10">
                  <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => { setSelectedImage(null); setImagePreviewUrl(null); }}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="flex gap-2 items-center">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleImageSelect}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-3 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50 text-white/70 hover:text-white shrink-0"
                >
                  <ImageIcon size={20} />
                </button>
                
                <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Escribe un mensaje..." 
                  className="flex-1 p-3 rounded-lg focus:outline-none bg-zinc-900 border border-white/10 min-w-0"
                />
                <button 
                  onClick={sendMessage}
                  disabled={(!inputText.trim() && !selectedImage) || isUploading}
                  className="p-3 rounded-lg flex items-center justify-center bg-[var(--primary)] text-black hover:opacity-90 transition-opacity disabled:opacity-50 shrink-0"
                >
                  {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-white/50 p-6 text-center">
            <MessageSquare size={48} className="mb-4 opacity-50" />
            <p>Busca o selecciona un contacto para iniciar un chat</p>
          </div>
        )}
      </div>

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-md p-6 border border-white/10 rounded-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold" style={{ color: 'var(--primary)' }}>Mensaje Masivo</h3>
              <button onClick={() => setShowBroadcastModal(false)} className="p-1 hover:bg-white/10 rounded-full">
                <X size={20} />
              </button>
            </div>
            
            <div>
              <p className="text-sm opacity-70 mb-2">Selecciona a quién enviar (o a todos):</p>
              <div className="flex items-center gap-2 mb-3">
                <button 
                  onClick={() => {
                    if (broadcastTargetIds.includes(-1)) {
                      setBroadcastTargetIds([]);
                    } else {
                      setBroadcastTargetIds([-1]);
                    }
                  }}
                  className={`flex-1 py-2 border rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${broadcastTargetIds.includes(-1) ? 'bg-[var(--primary)] text-black border-[var(--primary)]' : 'border-white/20 hover:bg-white/5 text-white'}`}
                >
                  {broadcastTargetIds.includes(-1) && <Check size={16} />} Todos los usuarios
                </button>
              </div>
              
              {!broadcastTargetIds.includes(-1) && (
                <div className="max-h-40 overflow-y-auto border border-white/10 rounded-lg p-2 space-y-1">
                  {contacts.map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => {
                        setBroadcastTargetIds(prev => 
                          prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id]
                        );
                      }}
                      className="flex items-center gap-2 p-2 rounded hover:bg-white/5 cursor-pointer"
                    >
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${broadcastTargetIds.includes(c.id) ? 'bg-[var(--primary)] border-[var(--primary)] text-black' : 'border-white/30'}`}>
                        {broadcastTargetIds.includes(c.id) && <Check size={12} />}
                      </div>
                      <span className="text-sm">{c.first_name} {c.last_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div>
              <div className="flex justify-between items-end mb-2">
                <p className="text-sm opacity-70">Mensaje:</p>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={broadcastFileInputRef} 
                  onChange={handleBroadcastImageSelect}
                />
                <button 
                  onClick={() => broadcastFileInputRef.current?.click()}
                  className="text-xs flex items-center gap-1 text-[var(--primary)] hover:opacity-80 transition-opacity"
                >
                  <ImageIcon size={14} /> Adjuntar Imagen
                </button>
              </div>
              
              {broadcastImagePreview && (
                <div className="relative w-full h-32 mb-2 rounded-lg overflow-hidden border border-white/10">
                  <img src={broadcastImagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => { setBroadcastImage(null); setBroadcastImagePreview(null); }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/70 flex items-center justify-center text-white hover:bg-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
              
              <textarea 
                rows={4}
                value={broadcastMessage}
                onChange={e => setBroadcastMessage(e.target.value)}
                placeholder="Escribe el anuncio para enviar masivamente..."
                className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:outline-none focus:border-[var(--primary)] resize-none"
              ></textarea>
            </div>
            
            <button 
              onClick={handleBroadcast}
              disabled={sendingBroadcast || (!broadcastMessage.trim() && !broadcastImage) || broadcastTargetIds.length === 0}
              className="w-full py-3 rounded-xl font-bold bg-[var(--primary)] text-black hover:opacity-90 transition-opacity disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {sendingBroadcast ? <Loader2 className="animate-spin" size={20} /> : <Megaphone size={20} />}
              {sendingBroadcast ? 'Enviando...' : 'Enviar Difusión'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
