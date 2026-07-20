import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Modal, TextInput, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Theme } from '../constants/theme';
import api from '../services/api';

interface NetworkItem {
  id: string;
  title: string;
  description: string;
  photo_url: string;
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  category: string;
  created_at: string;
}

export default function NetworkScreen() {
  const router = useRouter();
  const [items, setItems] = useState<NetworkItem[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<NetworkItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('Todos');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await api.get('/network/');
      if (res.data) {
        setItems(res.data);
      }
    } catch (e) {
      console.log('Error fetching network items', e);
    }
  };

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permiso Requerido', 'Necesitas dar permisos para acceder a tus fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setPhotoUrl(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!title || !description || !contactName) {
      Alert.alert('Error', 'Por favor completa los campos principales (Título, Descripción, Nombre de contacto).');
      return;
    }

    try {
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('contact_name', contactName);
      if (contactPhone) formData.append('contact_phone', contactPhone);
      if (contactEmail) formData.append('contact_email', contactEmail);
      if (category) formData.append('category', category);
      
      if (photoUrl) {
        const filename = photoUrl.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        let type = match ? `image/${match[1]}` : `image/jpeg`;
        if (type === 'image/jpg') type = 'image/jpeg';
        
        formData.append('photo', {
          uri: photoUrl,
          name: filename,
          type,
        } as any);
      }

      const res = await api.post('/network/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data) {
        await fetchItems();
        
        setTitle('');
        setDescription('');
        setPhotoUrl('');
        setContactName('');
        setContactPhone('');
        setContactEmail('');
        setCategory('');
        
        setIsAddModalOpen(false);
      } else {
        Alert.alert('Error', 'No se pudo guardar la publicación.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Hubo un problema de conexión.');
    }
  };

  const categories = ['Todos', 'Salud', 'Equipo', 'Servicios', 'Otros'];
  const filteredItems = filterCategory === 'Todos' 
    ? items 
    : items.filter(item => (item.category || 'General') === filterCategory);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Network Momia</Text>
        <TouchableOpacity style={styles.addBtnHeader} onPress={() => setIsAddModalOpen(true)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {categories.map(cat => (
            <TouchableOpacity 
              key={cat} 
              style={[styles.filterPill, filterCategory === cat && styles.filterPillActive]}
              onPress={() => setFilterCategory(cat)}
            >
              <Text style={[styles.filterPillText, filterCategory === cat && styles.filterPillTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay publicaciones aún.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => setSelectedItem(item)}>
            <Image source={{ uri: item.photo_url ? `http://127.0.0.1:8001${item.photo_url}` : 'https://images.unsplash.com/photo-1595152220448-6932462e08cc?w=400&q=80' }} style={styles.cardImage} />
            <View style={styles.cardContent}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.category || 'General'}</Text>
              </View>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
              <View style={styles.cardFooter}>
                <View style={styles.contactRow}>
                  <Ionicons name="person" size={14} color="rgba(255,255,255,0.5)" />
                  <Text style={styles.contactText}>{item.contact_name}</Text>
                </View>
                <Text style={styles.dateText}>{new Date(item.created_at).toLocaleDateString('es-CR')}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Add Modal */}
      <Modal visible={isAddModalOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsAddModalOpen(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <Text style={styles.modalHeaderTitle}>Publicar</Text>
            <TouchableOpacity onPress={handleSave}>
              <Text style={styles.modalSaveText}>Guardar</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
            
            <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={styles.previewImage} />
              ) : (
                <>
                  <Ionicons name="camera" size={32} color={Theme.colors.primary} />
                  <Text style={styles.imagePickerText}>Agregar Foto</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>TÍTULO</Text>
              <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Ej. Fisioterapia..." placeholderTextColor="#666" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>DESCRIPCIÓN</Text>
              <TextInput style={[styles.input, {height: 80, textAlignVertical: 'top'}]} value={description} onChangeText={setDescription} placeholder="Detalles del producto o servicio" placeholderTextColor="#666" multiline />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CATEGORÍA</Text>
              <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4}}>
                {['Salud', 'Equipo', 'Servicios', 'Otros'].map(cat => (
                  <TouchableOpacity 
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={{
                      paddingHorizontal: 14, 
                      paddingVertical: 8, 
                      borderRadius: 16, 
                      backgroundColor: category === cat ? Theme.colors.primary : 'rgba(255,255,255,0.05)',
                      borderWidth: 1, 
                      borderColor: category === cat ? Theme.colors.primary : 'rgba(255,255,255,0.1)'
                    }}>
                    <Text style={{
                      color: category === cat ? '#fff' : 'rgba(255,255,255,0.7)', 
                      fontSize: 14,
                      fontWeight: category === cat ? 'bold' : 'normal'
                    }}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Text style={[styles.label, {marginTop: 16, marginBottom: 8}]}>CONTACTO</Text>
            <View style={styles.inputGroup}>
              <TextInput style={styles.input} value={contactName} onChangeText={setContactName} placeholder="Nombre completo" placeholderTextColor="#666" />
            </View>
            <View style={styles.inputGroup}>
              <TextInput style={styles.input} value={contactPhone} onChangeText={setContactPhone} placeholder="Teléfono" placeholderTextColor="#666" keyboardType="phone-pad" />
            </View>
            <View style={styles.inputGroup}>
              <TextInput style={styles.input} value={contactEmail} onChangeText={setContactEmail} placeholder="Correo Electrónico (Opcional)" placeholderTextColor="#666" keyboardType="email-address" autoCapitalize="none" />
            </View>

          </ScrollView>
        </View>
      </Modal>

      {/* Detail Modal */}
      <Modal visible={!!selectedItem} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedItem(null)}>
        <View style={styles.modalContainer}>
          {selectedItem && (
            <ScrollView bounces={false}>
              <View style={styles.detailImageContainer}>
                <Image source={{ uri: selectedItem.photo_url ? `http://127.0.0.1:8001${selectedItem.photo_url}` : 'https://images.unsplash.com/photo-1595152220448-6932462e08cc?w=400&q=80' }} style={styles.detailImage} />
                <TouchableOpacity style={styles.closeDetailBtn} onPress={() => setSelectedItem(null)}>
                  <Ionicons name="close-circle" size={32} color="#fff" />
                </TouchableOpacity>
              </View>
              <View style={styles.detailContent}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{selectedItem.category || 'General'}</Text>
                </View>
                <Text style={styles.detailTitle}>{selectedItem.title}</Text>
                <Text style={styles.detailDate}>Publicado el {new Date(selectedItem.created_at).toLocaleDateString('es-CR')}</Text>
                
                <Text style={styles.detailDesc}>{selectedItem.description}</Text>
                
                <Text style={[styles.label, {marginTop: 24, marginBottom: 12}]}>INFORMACIÓN DE CONTACTO</Text>
                <View style={styles.contactCard}>
                  <View style={styles.contactRowItem}>
                    <Ionicons name="person" size={18} color={Theme.colors.primary} />
                    <Text style={styles.contactCardText}>{selectedItem.contact_name}</Text>
                  </View>
                  {selectedItem.contact_phone && (
                    <View style={styles.contactRowItem}>
                      <Ionicons name="call" size={18} color={Theme.colors.primary} />
                      <Text style={styles.contactCardText}>{selectedItem.contact_phone}</Text>
                    </View>
                  )}
                  {selectedItem.contact_email && (
                    <View style={styles.contactRowItem}>
                      <Ionicons name="mail" size={18} color={Theme.colors.primary} />
                      <Text style={styles.contactCardText}>{selectedItem.contact_email}</Text>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  backBtn: {
    padding: 4,
  },
  addBtnHeader: {
    padding: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  filterContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterPillActive: {
    backgroundColor: Theme.colors.primary,
  },
  filterPillText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: 20,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: 40,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  cardImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#111',
  },
  cardContent: {
    padding: 16,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,180,216,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,180,216,0.2)',
  },
  badgeText: {
    color: Theme.colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  cardDesc: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 12,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '500',
  },
  dateText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  // Modals
  modalContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  modalCancelText: {
    color: '#fff',
    fontSize: 16,
  },
  modalHeaderTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalSaveText: {
    color: Theme.colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  imagePicker: {
    width: '100%',
    height: 200,
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imagePickerText: {
    color: Theme.colors.primary,
    marginTop: 8,
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  detailImageContainer: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  detailImage: {
    width: '100%',
    height: '100%',
  },
  closeDetailBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
  },
  detailContent: {
    padding: 24,
  },
  detailTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  detailDate: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginBottom: 20,
  },
  detailDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    lineHeight: 24,
  },
  contactCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    gap: 16,
  },
  contactRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactCardText: {
    color: '#fff',
    fontSize: 16,
  },
});
