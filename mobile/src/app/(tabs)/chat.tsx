import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../../constants/theme';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import * as SecureStore from 'expo-secure-store';
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function ChatScreen() {
  const { user } = useContext(AuthContext);
  const [contacts, setContacts] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination state
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const { contact: contactParam } = useLocalSearchParams<{ contact?: string }>();
  
  const ws = useRef<WebSocket | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const selectedContactRef = useRef<any | null>(null);

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
    fetchContacts();
    
    // Connect WebSocket
    const connectWs = async () => {
      const token = await SecureStore.getItemAsync('token');
      if (user?.id && token) {
        // Usa tu IP local o dominio en lugar de localhost si pruebas en un dispositivo físico
        const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8001';
        const wsProtocol = API_URL.startsWith('https') ? 'wss:' : 'ws:';
        const host = API_URL.replace('http://', '').replace('https://', '');
        
        const wsUrl = `${wsProtocol}//${host}/chat/ws?token=${token}`;
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
            
            if (data.sender_id === selectedContactRef.current.id) {
              api.put(`/chat/read/${data.sender_id}`).catch(console.error);
            }
          } else {
            fetchContacts();
          }
        };
      }
    };
    
    connectWs();

    return () => {
      ws.current?.close();
    };
  }, [user]);

  useEffect(() => {
    if (selectedContact) {
      fetchHistory(selectedContact.id);
    }
  }, [selectedContact]);

  useEffect(() => {
    if (contacts.length > 0 && contactParam) {
      const contactId = parseInt(contactParam as string);
      const contact = contacts.find(c => c.id === contactId);
      if (contact) {
        setSelectedContact(contact);
        router.setParams({ contact: undefined }); // Clear param
      }
    }
  }, [contacts, contactParam]);

  useFocusEffect(
    useCallback(() => {
      fetchContacts();
    }, [])
  );

  const fetchContacts = async () => {
    try {
      const res = await api.get('/chat/contacts');
      setContacts(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingContacts(false);
    }
  };

  useEffect(() => {
    if (selectedContact) {
      setOffset(0);
      setHasMore(true);
      fetchHistory(selectedContact.id, 0);
    }
  }, [selectedContact]);

  const fetchHistory = async (targetId: number, currentOffset: number = 0) => {
    if (currentOffset === 0) setLoadingMessages(true);
    else setLoadingMore(true);
    
    try {
      const res = await api.get(`/chat/history/${targetId}?limit=50&offset=${currentOffset}`);
      const newData = res.data;
      
      if (newData.length < 50) {
        setHasMore(false);
      }
      
      if (currentOffset === 0) {
        setMessages(newData);
        setContacts(prev => prev.map(c => 
          c.id === targetId ? { ...c, unread_count: 0 } : c
        ));
      } else {
        setMessages(prev => [...newData, ...prev]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
      setLoadingMore(false);
    }
  };

  const loadMoreMessages = () => {
    if (hasMore && !loadingMore && selectedContact) {
      const newOffset = offset + 50;
      setOffset(newOffset);
      fetchHistory(selectedContact.id, newOffset);
    }
  };

  const handleImageSelect = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setSelectedImage(result.assets[0]);
    }
  };

  const sendMessage = async () => {
    if ((!inputText.trim() && !selectedImage) || !selectedContact || !ws.current) return;
    
    setIsUploading(true);
    let uploadedImageUrl = null;
    
    if (selectedImage) {
      const formData = new FormData();
      formData.append('file', {
        uri: selectedImage.uri,
        name: 'upload.jpg',
        type: 'image/jpeg'
      } as any);
      
      try {
        const res = await api.post('/chat/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (res.data.image_url) {
          uploadedImageUrl = res.data.image_url;
        }
      } catch (err) {
        console.error("Error uploading image:", err);
        setIsUploading(false);
        return;
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
    setIsUploading(false);
  };

  const getAvatarSource = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith('http')) return { uri: url };
    const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8001';
    return { uri: `${API_URL}${url}` };
  };

  if (loadingContacts) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  const filteredContacts = contacts.filter(c => 
    `${c.first_name} ${c.last_name}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- VIEW: CONTACT LIST ---
  if (!selectedContact) {
    return (
      <View style={styles.container}>
        <View style={styles.contactListHeader}>
          <Text style={styles.headerTitle}>Mensajes</Text>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color={Theme.colors.muted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar o iniciar chat..."
              placeholderTextColor={Theme.colors.muted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={Theme.colors.muted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={loadingContacts}
              onRefresh={() => {
                setLoadingContacts(true);
                fetchContacts();
              }}
              tintColor={Theme.colors.primary}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.contactItem}
              onPress={() => {
                setSelectedContact(item);
                setSearchQuery('');
              }}
            >
              <View style={styles.avatar}>
                {item.avatar_url ? (
                  <Image source={getAvatarSource(item.avatar_url)!} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="person" size={24} color={Theme.colors.foreground} />
                )}
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{item.first_name} {item.last_name}</Text>
                <Text style={styles.contactRole}>{item.role}</Text>
              </View>
              {item.unread_count > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unread_count}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color={Theme.colors.primary} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No tienes contactos disponibles</Text>
          }
        />
      </View>
    );
  }

  // --- VIEW: CHAT INTERFACE ---
  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity onPress={() => setSelectedContact(null)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.foreground} />
        </TouchableOpacity>
        <View style={styles.smallAvatar}>
          {selectedContact.avatar_url ? (
            <Image source={getAvatarSource(selectedContact.avatar_url)!} style={styles.avatarImage} />
          ) : (
            <Ionicons name="person" size={16} color={Theme.colors.foreground} />
          )}
        </View>
        <Text style={styles.chatHeaderTitle}>{selectedContact.first_name} {selectedContact.last_name}</Text>
      </View>

      {/* Messages */}
      {loadingMessages ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          onContentSizeChange={() => {
            if (offset === 0) flatListRef.current?.scrollToEnd({ animated: true });
          }}
          onLayout={() => {
            if (offset === 0) flatListRef.current?.scrollToEnd({ animated: true });
          }}
          contentContainerStyle={styles.messagesList}
          ListHeaderComponent={
            hasMore ? (
              <TouchableOpacity 
                onPress={loadMoreMessages} 
                style={{ padding: 10, alignItems: 'center' }}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <ActivityIndicator color={Theme.colors.primary} />
                ) : (
                  <Text style={{ color: Theme.colors.primary, fontSize: 13 }}>Cargar mensajes anteriores</Text>
                )}
              </TouchableOpacity>
            ) : null
          }
          renderItem={({ item }) => {
            const isMe = item.sender_id === user?.id;
            return (
              <View style={[styles.messageWrapper, isMe ? styles.messageMeWrapper : styles.messageThemWrapper]}>
                <View style={[styles.messageBubble, isMe ? styles.messageMe : styles.messageThem]}>
                  {item.image_url && (
                    <Image source={getAvatarSource(item.image_url)!} style={styles.messageImage} />
                  )}
                  {item.message ? (
                    <Text style={[styles.messageText, isMe ? styles.messageTextMe : styles.messageTextThem]}>
                      {item.message}
                    </Text>
                  ) : null}
                  <Text style={[styles.messageTime, isMe ? styles.messageTimeMe : styles.messageTimeThem]}>
                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyTextChatMessage}>Envía un mensaje para iniciar la conversación.</Text>
          }
        />
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        {selectedImage && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: selectedImage.uri }} style={styles.imagePreview} />
            <TouchableOpacity style={styles.removeImageBtn} onPress={() => setSelectedImage(null)}>
              <Ionicons name="close-circle" size={24} color="white" />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputArea}>
          <TouchableOpacity style={styles.imagePickerBtn} onPress={handleImageSelect} disabled={isUploading}>
            <Ionicons name="image" size={24} color={Theme.colors.primary} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity 
            style={[styles.sendBtn, (!inputText.trim() && !selectedImage) && styles.sendBtnDisabled]} 
            onPress={sendMessage}
            disabled={(!inputText.trim() && !selectedImage) || isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color={Theme.colors.background} />
            ) : (
              <Ionicons name="send" size={20} color={Theme.colors.background} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    paddingTop: 16,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactListHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Theme.colors.primary,
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: Theme.colors.foreground,
    fontSize: 15,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: Theme.colors.foreground,
    fontSize: 16,
    fontWeight: 'bold',
  },
  contactRole: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textTransform: 'capitalize',
    marginTop: 4,
  },
  emptyText: {
    color: Theme.colors.muted,
    textAlign: 'center',
    marginTop: 40,
  },
  emptyTextChatMessage: {
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: 40,
  },
  // Chat Interface Styles
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  backBtn: {
    marginRight: 12,
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  chatHeaderTitle: {
    color: Theme.colors.foreground,
    fontSize: 18,
    fontWeight: 'bold',
  },
  messagesList: {
    padding: 16,
    paddingBottom: 80,
  },
  messageWrapper: {
    marginBottom: 12,
    width: '100%',
    flexDirection: 'row',
  },
  messageMeWrapper: {
    justifyContent: 'flex-end',
  },
  messageThemWrapper: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  messageMe: {
    backgroundColor: Theme.colors.primary,
    borderTopRightRadius: 4,
  },
  messageThem: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextMe: {
    color: Theme.colors.background,
  },
  messageTextThem: {
    color: Theme.colors.foreground,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTimeMe: {
    color: 'rgba(0,0,0,0.5)',
  },
  messageTimeThem: {
    color: 'rgba(255,255,255,0.4)',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  unreadBadge: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    paddingHorizontal: 6,
  },
  unreadText: {
    color: Theme.colors.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
    resizeMode: 'cover',
  },
  inputContainer: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    marginBottom: Platform.OS === 'ios' ? 80 : 60,
  },
  imagePreviewContainer: {
    padding: 12,
    position: 'relative',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removeImageBtn: {
    position: 'absolute',
    top: 4,
    left: 92,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  imagePickerBtn: {
    padding: 8,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputArea: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    color: Theme.colors.foreground,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 100,
  }
});
