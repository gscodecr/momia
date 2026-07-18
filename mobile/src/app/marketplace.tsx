import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList, Image, Modal, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Theme } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function MarketplaceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Cart State
  const [cart, setCart] = useState<any[]>([]);
  const [showCartModal, setShowCartModal] = useState(false);

  // Product Modal State
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products/');
        setProducts(res.data);
      } catch (err) {
        console.log('Error fetching products', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const renderImageUrl = (itemUrl: string | undefined, defaultImg: string) => {
    if (!itemUrl || itemUrl === 'null' || itemUrl === 'undefined' || itemUrl === '') return defaultImg;
    if (itemUrl.startsWith('http') || itemUrl.startsWith('data:')) return itemUrl;
    const path = itemUrl.startsWith('/') ? itemUrl : `/${itemUrl}`;
    return `${api.defaults.baseURL}${path}`;
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

  const cartTotal = cart.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

  const handleCheckout = async () => {
    try {
      const payload = {
        items: cart.map(item => ({ 
          product_id: item.id, 
          quantity: item.quantity,
          selectedColor: item.selectedColor,
          selectedSize: item.selectedSize
        })),
        amount: cartTotal.toString(),
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

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LoadingSpinner />
      </View>
    );
  }

  // Modal helpers
  const availableColors = Array.from(new Set(variants.map(v => v.color))) as string[];
  const sizesForSelectedColor = variants.filter(v => v.color === selectedColor).map(v => v.size) as string[];
  const currentVariant = variants.find(v => v.color === selectedColor && v.size === selectedSize);
  const currentAvailableStock = variants.length > 0 ? (currentVariant?.stock || 0) : (selectedProduct?.stock || 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Theme.colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Marketplace</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={products}
        keyExtractor={item => String(item.id)}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => {
          const imageUrl = renderImageUrl(item.image_url, 'https://images.unsplash.com/photo-1595152220448-6932462e08cc?auto=format&fit=crop&q=80&w=400');
          return (
            <TouchableOpacity style={styles.marketCard} onPress={() => openProductModal(item)}>
              <Image source={{ uri: imageUrl }} style={styles.marketImage} />
              <View style={styles.marketContent}>
                <Text style={styles.marketTitle} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.marketPrice}>₡{item.price}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <TouchableOpacity style={styles.floatingCart} onPress={() => setShowCartModal(true)}>
          <Ionicons name="cart" size={24} color="#000" />
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cart.length}</Text>
          </View>
        </TouchableOpacity>
      )}

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
                  {item.selectedColor ? <Text style={styles.cartItemVariant}>Color: {item.selectedColor}</Text> : null}
                  {item.selectedSize ? <Text style={styles.cartItemVariant}>Talla: {item.selectedSize}</Text> : null}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  backButton: {
    padding: Theme.spacing.xs,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.foreground,
  },
  listContent: {
    padding: Theme.spacing.md,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  marketCard: {
    width: '48%',
    backgroundColor: 'rgba(24,24,27,0.8)',
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
  },
  marketImage: {
    width: '100%',
    height: 140,
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
  },
  floatingCart: {
    position: 'absolute',
    bottom: 40,
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
  },
  stockBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Theme.borderRadius.sm,
  },
  stockText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    backgroundColor: Theme.colors.surface,
  },
  actionBtn: {
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: Theme.borderRadius.lg,
  },
  actionBtnText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
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
  }
});
