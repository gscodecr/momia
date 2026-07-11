import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';

interface Message {
  id: string;
  senderId: number;
  text: string;
  isMe: boolean;
}

export default function ChatView({ currentUserId, targetUserId }: { currentUserId: number, targetUserId: number }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Conectar al WebSocket de FastAPI
    ws.current = new WebSocket(`ws://localhost:8000/chat/ws/${currentUserId}`);

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.sender_id === targetUserId) {
          setMessages(prev => [...prev, { id: Date.now().toString(), senderId: data.sender_id, text: data.message, isMe: false }]);
        }
      } catch (e) {
        console.error("Error parsing message", e);
      }
    };

    return () => {
      ws.current?.close();
    };
  }, [currentUserId, targetUserId]);

  const sendMessage = () => {
    if (!inputText.trim()) return;

    // Agregar mensaje a la UI local
    setMessages(prev => [...prev, { id: Date.now().toString(), senderId: currentUserId, text: inputText, isMe: true }]);

    // Enviar por WebSocket al backend
    if (ws.current) {
      ws.current.send(JSON.stringify({
        target_id: targetUserId,
        message: inputText
      }));
    }
    
    setInputText('');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.messagesContainer}>
        {messages.map(msg => (
          <View key={msg.id} style={[styles.messageBubble, msg.isMe ? styles.myMessage : styles.theirMessage]}>
            <Text style={styles.messageText}>{msg.text}</Text>
          </View>
        ))}
      </ScrollView>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#a1a1aa"
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#09090b' },
  messagesContainer: { flex: 1, padding: 16 },
  messageBubble: { padding: 12, borderRadius: 12, marginBottom: 8, maxWidth: '80%' },
  myMessage: { backgroundColor: '#facc15', alignSelf: 'flex-end', borderBottomRightRadius: 2 },
  theirMessage: { backgroundColor: '#27272a', alignSelf: 'flex-start', borderBottomLeftRadius: 2 },
  messageText: { color: '#18181b', fontSize: 16 }, // Para sus mensajes debería ser blanco, esto es simplificado
  inputContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#18181b', borderTopWidth: 1, borderColor: '#27272a' },
  input: { flex: 1, color: '#fafafa', backgroundColor: '#27272a', borderRadius: 20, paddingHorizontal: 16, marginRight: 8 },
  sendButton: { backgroundColor: '#facc15', borderRadius: 20, justifyContent: 'center', paddingHorizontal: 16 },
  sendButtonText: { color: '#18181b', fontWeight: 'bold' }
});
