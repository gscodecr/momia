import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Image, Modal, Alert } from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import { Theme } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function DashboardScreen() {
  const { user } = useContext(AuthContext);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [marketplaceItems, setMarketplaceItems] = useState<any[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<any[]>([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, productsRes, regRes] = await Promise.all([
          api.get('/events/'),
          api.get('/products/'),
          api.get('/events/my_registrations')
        ]);
        setUpcomingEvents(eventsRes.data);
        setMarketplaceItems(productsRes.data);
        setMyRegistrations(regRes.data);
      } catch (err) {
        console.log('Error fetching dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const latestWorkout = {
    title: 'Fondo Dominical - Volcán Irazú',
    distance: '85.4 km',
    time: '3h 45m',
    elevation: '1,240 m',
    date: 'Ayer, 05:30 AM'
  };

  const isRegistered = (eventId: number) => myRegistrations.some(r => r.event_id === eventId);

  const toggleRegistration = async (eventId: number) => {
    try {
      if (isRegistered(eventId)) {
        await api.delete(`/events/${eventId}/register`);
        setMyRegistrations(prev => prev.filter(r => r.event_id !== eventId));
        Alert.alert('Éxito', 'Te has desinscrito del evento');
      } else {
        const res = await api.post(`/events/${eventId}/register`);
        setMyRegistrations(prev => [...prev, res.data]);
        Alert.alert('Éxito', '¡Te has inscrito al evento!');
      }
      setSelectedEvent(null);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Error al procesar inscripción');
    }
  };

  const openProductModal = (product: any) => {
    setSelectedProduct(product);
    setQuantity(1);
    
    let parsedVariants: any[] = [];
    if (product.variants_json) {
      try {
        parsedVariants = JSON.parse(product.variants_json);
      } catch (e) {
        parsedVariants = [];
      }
    }
    setVariants(parsedVariants);

    if (parsedVariants.length > 0) {
      const colorsWithStock = Array.from(new Set(parsedVariants.filter(v => v.stock > 0).map(v => v.color)));
      const initialColor = (colorsWithStock[0] || parsedVariants[0].color) as string;
      setSelectedColor(initialColor);
      
      const sizesForColor = parsedVariants.filter(v => v.color === initialColor && v.stock > 0).map(v => v.size);
      setSelectedSize((sizesForColor[0] || '') as string);
    } else {
      setSelectedColor('');
      setSelectedSize('');
    }
  };

  const handleColorSelect = (c: string) => {
    setSelectedColor(c);
    const sizesForColor = variants.filter(v => v.color === c && v.stock > 0).map(v => v.size);
    if (!sizesForColor.includes(selectedSize)) {
      setSelectedSize(sizesForColor[0] || '');
    }
  };

  const addToCart = () => {
    if (!selectedProduct) return;
    
    let maxStock = selectedProduct.stock;
    if (variants.length > 0) {
      const currentVariant = variants.find(v => v.color === selectedColor && v.size === selectedSize);
      if (!currentVariant || currentVariant.stock < quantity) {
        Alert.alert('Error', 'No hay suficiente stock para esa combinación.');
        return;
      }
      maxStock = currentVariant.stock;
    } else if (selectedProduct.stock < quantity) {
      Alert.alert('Error', `Solo quedan ${selectedProduct.stock} unidades en stock.`);
      return;
    }

    const newItem = {
      ...selectedProduct,
      cartItemId: Math.random().toString(),
      selectedColor: variants.length > 0 ? selectedColor : '',
      selectedSize: variants.length > 0 ? selectedSize : '',
      quantity
    };

    setCart(prev => [...prev, newItem]);
    Alert.alert('Añadido', 'Producto añadido al carrito');
    setSelectedProduct(null);
  };

  const removeFromCart = (cartItemId: string) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const handleCheckout = async () => {
    try {
      const total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
      const payload = {
        items: cart.map(item => ({ product_id: item.id, quantity: item.quantity })),
        amount: total.toString(),
        description: 'Compra en MOMIA Store'
      };
      await api.post('/payments/store-tilopay', payload);
      setCart([]);
      setShowCartModal(false);
      Alert.alert('¡Compra Exitosa!', 'Tu pedido ha sido procesado correctamente.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.detail || 'Error en checkout');
    }
  };

  const renderImageUrl = (itemUrl: string | undefined, defaultImg: string) => {
    if (!itemUrl || itemUrl === 'null' || itemUrl === 'undefined' || itemUrl === '') return defaultImg;
    if (itemUrl.startsWith('http') || itemUrl.startsWith('data:')) return itemUrl;
    const path = itemUrl.startsWith('/') ? itemUrl : `/${itemUrl}`;
    return `${api.defaults.baseURL}${path}`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LoadingSpinner />
      </View>
    );
  }

  const cartTotal = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);

  // Modal helpers
  const availableColors = Array.from(new Set(variants.map(v => v.color))) as string[];
  const sizesForSelectedColor = variants.filter(v => v.color === selectedColor).map(v => v.size) as string[];
  const currentVariant = variants.find(v => v.color === selectedColor && v.size === selectedSize);
  const currentAvailableStock = variants.length > 0 ? (currentVariant?.stock || 0) : (selectedProduct?.stock || 0);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, {user?.first_name}</Text>
            <Text style={styles.subtitle}>Sigue superando tus límites</Text>
          </View>
          <TouchableOpacity 
            style={styles.avatar}
            onPress={() => router.push('/profile')}
          >
            {user?.avatar_url ? (
              <Image source={{ uri: renderImageUrl(user.avatar_url, '') }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Hero Banner (Strava Style) */}
        <View style={styles.heroContainer}>
          <LinearGradient
            colors={['#1a1a1a', '#000000']}
            style={StyleSheet.absoluteFill}
          />
          <Image 
            source={require('../../../assets/images/logo.png')} 
            style={[styles.radialGlow, { transform: [{ rotate: '-25deg' }, { scale: 1.2 }] }]} 
            resizeMode="contain" 
          />

          <View style={styles.heroContent}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Último Entrenamiento</Text>
            </View>
            <Text style={styles.heroTitle}>{latestWorkout.title}</Text>
            
            <View style={styles.statsRow}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Distancia</Text>
                <Text style={[styles.statValue, { color: Theme.colors.primary }]}>{latestWorkout.distance}</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Tiempo</Text>
                <Text style={styles.statValue}>{latestWorkout.time}</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Desnivel</Text>
                <Text style={styles.statValue}>{latestWorkout.elevation}</Text>
              </View>
            </View>
            
            <View style={styles.dateRow}>
              <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.5)" />
              <Text style={styles.dateText}>{latestWorkout.date}</Text>
            </View>
          </View>
        </View>

        {/* Share Button (Mobile specific design) */}
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-social" size={18} color="#fff" />
          <Text style={styles.shareText}>Compartir Logro</Text>
        </TouchableOpacity>

        {/* Próximos Eventos */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Próximos Eventos</Text>
            <TouchableOpacity onPress={() => router.push('/events')}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={upcomingEvents}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => {
              const imageUrl = renderImageUrl(item.image_url, 'https://images.unsplash.com/photo-1552674605-15cff24f3c88?auto=format&fit=crop&q=80&w=400');
              const registered = isRegistered(item.id);
              return (
              <TouchableOpacity style={styles.eventCard} onPress={() => setSelectedEvent(item)}>
                <Image source={{ uri: imageUrl }} style={styles.eventImage} />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,1)']} style={styles.eventOverlay} />
                <View style={styles.eventContent}>
                  <Text style={styles.eventTitle}>{item.title}</Text>
                  <View style={styles.eventDetailRow}>
                    <Ionicons name="calendar-outline" size={12} color={Theme.colors.primary} />
                    <Text style={styles.eventDetailText}>{new Date(item.date).toLocaleDateString()}</Text>
                  </View>
                  {registered && (
                    <View style={styles.registeredBadgeSm}>
                      <Text style={styles.registeredBadgeTextSm}>Inscrito</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Marketplace */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Momia Marketplace</Text>
            <TouchableOpacity onPress={() => router.push('/marketplace')}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={marketplaceItems}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => {
              const imageUrl = renderImageUrl(item.image_url, 'https://images.unsplash.com/photo-1595152220448-6932462e08cc?auto=format&fit=crop&q=80&w=400');
              return (
              <TouchableOpacity style={styles.marketCard} onPress={() => openProductModal(item)}>
                <Image source={{ uri: imageUrl }} style={styles.marketImage} />
                <View style={styles.marketContent}>
                  <Text style={styles.marketTitle} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.marketPrice}>₡{item.price}</Text>
                  <TouchableOpacity style={styles.buyButton} onPress={() => openProductModal(item)}>
                    <Ionicons name="cart" size={14} color="#000" />
                    <Text style={styles.buyButtonText}>Ver</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Network Momia */}
        <View style={[styles.sectionContainer, { marginBottom: 40 }]}>
          <TouchableOpacity 
            style={{
              backgroundColor: 'rgba(0,180,216,0.1)',
              borderRadius: 16,
              padding: 20,
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(0,180,216,0.3)',
            }}
            onPress={() => router.push('/network')}
          >
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: Theme.colors.primary,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 16
            }}>
              <Ionicons name="globe" size={24} color="#000" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>Network Momia</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Descubre productos y servicios de nuestra comunidad</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={Theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <TouchableOpacity style={styles.floatingCart} onPress={() => setShowCartModal(true)}>
          <Ionicons name="cart" size={24} color="#000" />
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cart.length}</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Event Details Modal */}
      <Modal visible={!!selectedEvent} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedEvent(null)}>
        <View style={styles.modalContainer}>
          {selectedEvent && (() => {
            const imageUrl = renderImageUrl(selectedEvent.image_url, 'https://images.unsplash.com/photo-1552674605-15cff24f3c88?auto=format&fit=crop&q=80&w=400');
            const registered = isRegistered(selectedEvent.id);
            return (
              <>
                <Image source={{ uri: imageUrl }} style={styles.modalImage} />
                <TouchableOpacity style={styles.closeModalBtn} onPress={() => setSelectedEvent(null)}>
                  <Ionicons name="close-circle" size={32} color="#fff" />
                </TouchableOpacity>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>{selectedEvent.title}</Text>
                  <Text style={styles.modalDesc}>{selectedEvent.description}</Text>
                  
                  <View style={styles.eventDetailRowLarge}>
                    <Ionicons name="calendar" size={20} color={Theme.colors.primary} />
                    <Text style={styles.eventDetailTextLarge}>{new Date(selectedEvent.date).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.eventDetailRowLarge}>
                    <Ionicons name="location" size={20} color={Theme.colors.primary} />
                    <Text style={styles.eventDetailTextLarge}>{selectedEvent.location || 'Ubicación Virtual / Por definir'}</Text>
                  </View>

                  <TouchableOpacity 
                    style={[styles.actionBtn, registered ? styles.cancelBtn : null]} 
                    onPress={() => toggleRegistration(selectedEvent.id)}
                  >
                    <Ionicons name={registered ? "close-circle" : "checkmark-circle"} size={20} color={registered ? "#fff" : "#000"} />
                    <Text style={[styles.actionBtnText, registered ? { color: '#fff' } : null]}>
                      {registered ? 'Cancelar Inscripción' : 'Inscribirse al Evento'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            );
          })()}
        </View>
      </Modal>

      {/* Product Details Modal with Variants */}
      <Modal visible={!!selectedProduct} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelectedProduct(null)}>
        <View style={styles.modalContainer}>
          {selectedProduct && (() => {
            const imageUrl = renderImageUrl(selectedProduct.image_url, 'https://images.unsplash.com/photo-1595152220448-6932462e08cc?auto=format&fit=crop&q=80&w=400');
            return (
              <>
                <Image source={{ uri: imageUrl }} style={styles.modalImageProduct} resizeMode="cover" />
                <TouchableOpacity style={styles.closeModalBtn} onPress={() => setSelectedProduct(null)}>
                  <Ionicons name="close-circle" size={32} color="#000" />
                </TouchableOpacity>
                <ScrollView style={styles.modalContent}>
                  <Text style={styles.modalTitle}>{selectedProduct.name}</Text>
                  <Text style={styles.modalPrice}>₡{selectedProduct.price}</Text>
                  <Text style={styles.modalDesc}>{selectedProduct.description || 'Sin descripción disponible.'}</Text>
                  
                  {variants.length > 0 && (
                    <View style={styles.variantsContainer}>
                      {/* Colors */}
                      <Text style={styles.variantLabel}>COLOR</Text>
                      <View style={styles.variantRow}>
                        {availableColors.map(c => {
                          const hasAnyStock = variants.some(v => v.color === c && v.stock > 0);
                          const isSelected = selectedColor === c;
                          return (
                            <TouchableOpacity 
                              key={c}
                              disabled={!hasAnyStock}
                              onPress={() => handleColorSelect(c)}
                              style={[
                                styles.variantBtn,
                                isSelected && styles.variantBtnActive,
                                !hasAnyStock && styles.variantBtnDisabled
                              ]}
                            >
                              <Text style={[styles.variantBtnText, isSelected && styles.variantBtnTextActive]}>{c}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {/* Sizes */}
                      {selectedColor ? (
                        <>
                          <Text style={[styles.variantLabel, { marginTop: 16 }]}>TALLA / TAMAÑO</Text>
                          <View style={styles.variantRow}>
                            {sizesForSelectedColor.map(s => {
                              const varStock = variants.find(v => v.color === selectedColor && v.size === s)?.stock || 0;
                              const hasStock = varStock > 0;
                              const isSelected = selectedSize === s;
                              return (
                                <TouchableOpacity 
                                  key={s}
                                  disabled={!hasStock}
                                  onPress={() => setSelectedSize(s)}
                                  style={[
                                    styles.variantBtn,
                                    isSelected && styles.variantBtnActive,
                                    !hasStock && styles.variantBtnDisabled
                                  ]}
                                >
                                  <Text style={[styles.variantBtnText, isSelected && styles.variantBtnTextActive]}>{s}</Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        </>
                      ) : null}
                    </View>
                  )}

                  <View style={styles.quantityRow}>
                    <View>
                      <Text style={styles.variantLabel}>CANTIDAD</Text>
                      <View style={styles.quantitySelector}>
                        <TouchableOpacity onPress={() => setQuantity(Math.max(1, quantity - 1))} style={styles.qtyBtn}>
                          <Ionicons name="remove" size={20} color={Theme.colors.foreground} />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{quantity}</Text>
                        <TouchableOpacity onPress={() => setQuantity(quantity + 1)} style={styles.qtyBtn}>
                          <Ionicons name="add" size={20} color={Theme.colors.foreground} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.stockBadge}>
                      <Text style={styles.stockText}>Disponibles: {currentAvailableStock}</Text>
                    </View>
                  </View>
                </ScrollView>
                <View style={[styles.modalFooter, { paddingBottom: Math.max(20, insets.bottom + 10) }]}>
                  <TouchableOpacity 
                    style={[styles.actionBtn, currentAvailableStock <= 0 && { opacity: 0.5 }]} 
                    onPress={addToCart}
                    disabled={currentAvailableStock <= 0}
                  >
                    <Ionicons name="cart" size={20} color="#000" />
                    <Text style={styles.actionBtnText}>
                      {currentAvailableStock <= 0 ? 'Agotado' : 'Añadir al Carrito'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            );
          })()}
        </View>
      </Modal>

      {/* Cart Modal */}
      <Modal visible={showCartModal} animationType="slide" presentationStyle="formSheet">
        <View style={styles.modalContainer}>
          <View style={styles.cartHeader}>
            <Text style={styles.modalTitle}>Tu Carrito</Text>
            <TouchableOpacity onPress={() => setShowCartModal(false)}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={{ padding: 20 }}>
            {cart.map((item, index) => (
              <View key={item.cartItemId || index} style={styles.cartItem}>
                <Image source={{ uri: renderImageUrl(item.image_url, 'https://images.unsplash.com/photo-1595152220448-6932462e08cc?auto=format&fit=crop&q=80&w=400') }} style={styles.cartItemImg} />
                <View style={styles.cartItemInfo}>
                  <Text style={styles.cartItemName}>{item.name}</Text>
                  {item.selectedColor && <Text style={styles.cartItemVariant}>Color: {item.selectedColor}</Text>}
                  {item.selectedSize && <Text style={styles.cartItemVariant}>Talla: {item.selectedSize}</Text>}
                  <Text style={styles.cartItemPrice}>₡{item.price} x {item.quantity || 1}</Text>
                </View>
                <TouchableOpacity onPress={() => removeFromCart(item.cartItemId)}>
                  <Ionicons name="trash" size={20} color={Theme.colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          <View style={[styles.modalFooter, { paddingBottom: Math.max(20, insets.bottom + 10) }]}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>₡{cartTotal.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.actionBtn} onPress={handleCheckout}>
              <Ionicons name="card" size={20} color="#000" />
              <Text style={styles.actionBtnText}>Procesar Compra</Text>
            </TouchableOpacity>
          </View>
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
  content: {
    padding: Theme.spacing.lg,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Theme.colors.primary,
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.foreground,
    opacity: 0.7,
    marginTop: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: Theme.colors.primary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  heroContainer: {
    borderRadius: Theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.colors.glassBorder,
    marginBottom: Theme.spacing.lg,
    position: 'relative',
  },
  radialGlow: {
    position: 'absolute',
    bottom: -30,
    right: -40,
    width: 200,
    height: 200,
    opacity: 0.15,
  },
  heroContent: {
    padding: Theme.spacing.lg,
    zIndex: 1,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginBottom: Theme.spacing.sm,
  },
  badgeText: {
    fontSize: 10,
    color: Theme.colors.foreground,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: Theme.colors.foreground,
    marginBottom: Theme.spacing.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: Theme.colors.foreground,
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.foreground,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Theme.spacing.xs,
  },
  dateText: {
    fontSize: 12,
    color: Theme.colors.foreground,
    opacity: 0.5,
    marginLeft: 6,
  },
  shareButton: {
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.full,
    marginBottom: Theme.spacing.xl,
  },
  shareText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  sectionContainer: {
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.foreground,
  },
  seeAllText: {
    color: Theme.colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  eventCard: {
    width: 280,
    height: 180,
    marginRight: 16,
    borderRadius: Theme.borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Theme.colors.surface,
  },
  eventImage: {
    width: '100%',
    height: '100%',
  },
  eventOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
  },
  eventContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Theme.spacing.md,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  eventDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventDetailText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 6,
  },
  registeredBadgeSm: {
    backgroundColor: Theme.colors.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  registeredBadgeTextSm: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  marketCard: {
    width: 160,
    marginRight: 16,
    backgroundColor: 'rgba(24,24,27,0.8)',
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
  },
  marketImage: {
    width: '100%',
    height: 120,
  },
  marketContent: {
    padding: Theme.spacing.sm,
  },
  marketTitle: {
    fontSize: 14,
    color: Theme.colors.foreground,
    fontWeight: '600',
    marginBottom: 8,
    height: 40,
  },
  marketPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.primary,
    marginBottom: 12,
  },
  buyButton: {
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: Theme.borderRadius.sm,
  },
  buyButtonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  floatingCart: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    backgroundColor: Theme.colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Theme.colors.error,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  modalImage: {
    width: '100%',
    height: 250,
  },
  modalImageProduct: {
    width: '100%',
    height: 350,
  },
  closeModalBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
  },
  modalContent: {
    padding: 24,
    flex: 1,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  modalPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.primary,
    marginBottom: 16,
  },
  modalDesc: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 24,
    marginBottom: 24,
  },
  eventDetailRowLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventDetailTextLarge: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 10,
  },
  actionBtn: {
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: Theme.borderRadius.lg,
    marginTop: 30,
  },
  cancelBtn: {
    backgroundColor: Theme.colors.error,
  },
  actionBtnText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  stockBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'flex-start',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  stockText: {
    color: '#fff',
    fontSize: 14,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    padding: 12,
    borderRadius: Theme.borderRadius.md,
    marginBottom: 10,
  },
  cartItemImg: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartItemVariant: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  cartItemPrice: {
    color: Theme.colors.primary,
    fontSize: 14,
    marginTop: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  totalLabel: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  totalValue: {
    color: Theme.colors.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  variantsContainer: {
    marginBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  variantLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
    letterSpacing: 1,
  },
  variantRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  variantBtn: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Theme.borderRadius.sm,
  },
  variantBtnActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  variantBtnDisabled: {
    opacity: 0.3,
  },
  variantBtnText: {
    color: Theme.colors.foreground,
    fontWeight: '600',
  },
  variantBtnTextActive: {
    color: '#000',
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 30,
  },
  quantitySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  qtyBtn: {
    padding: 10,
  },
  qtyText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    width: 30,
    textAlign: 'center',
  }
});
