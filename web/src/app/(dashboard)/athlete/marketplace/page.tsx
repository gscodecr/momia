'use client';
import { useState, useEffect } from 'react';
import { ShoppingBag, CreditCard, X, ChevronRight, CheckCircle, Upload, Trash2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AthleteMarketplace() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Cart State
  const [cart, setCart] = useState<any[]>([]);
  const [showCart, setShowCart] = useState(false);

  // Product Modal State
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [variants, setVariants] = useState<any[]>([]);

  // Checkout State
  const [checkoutMode, setCheckoutMode] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(''); // 'TILOPAY' or 'SINPE'
  const [sinpeFile, setSinpeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001") + '/products/', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setProducts(await res.json());
      }
    } catch (err) {
      toast.error('Error cargando productos');
    } finally {
      setLoading(false);
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
      // Get colors that have at least some stock
      const colorsWithStock = Array.from(new Set(parsedVariants.filter(v => v.stock > 0).map(v => v.color)));
      const initialColor = colorsWithStock[0] || parsedVariants[0].color;
      setSelectedColor(initialColor);
      
      // Get sizes for the initial color
      const sizesForColor = parsedVariants.filter(v => v.color === initialColor && v.stock > 0).map(v => v.size);
      setSelectedSize(sizesForColor[0] || '');
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
    
    // Check stock depending on if it has variants or not
    let maxStock = selectedProduct.stock;
    if (variants.length > 0) {
      const currentVariant = variants.find(v => v.color === selectedColor && v.size === selectedSize);
      if (!currentVariant || currentVariant.stock < quantity) {
        toast.error('No hay suficiente stock para esa combinación.');
        return;
      }
      maxStock = currentVariant.stock;
    } else if (selectedProduct.stock < quantity) {
      toast.error(`Solo quedan ${selectedProduct.stock} unidades en stock.`);
      return;
    }

    const newItem = {
      ...selectedProduct,
      cartId: Math.random().toString(36).substring(7),
      selectedColor: variants.length > 0 ? selectedColor : '',
      selectedSize: variants.length > 0 ? selectedSize : '',
      quantity
    };

    setCart([...cart, newItem]);
    toast.success('Agregado al carrito');
    setSelectedProduct(null);
  };

  const removeFromCart = (cartId: string) => {
    setCart(cart.filter(item => item.cartId !== cartId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (parseFloat(item.price.replace(/[^\d.]/g, '')) * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    if (paymentMethod === 'TILOPAY') {
      const payload = {
        items: cart.map(item => ({ product_id: item.id, quantity: item.quantity, selectedColor: item.selectedColor, selectedSize: item.selectedSize })),
        amount: cartTotal.toString(),
        description: `Compra Tienda: ${cart.map(i => `${i.quantity}x ${i.name}`).join(', ')}`
      };

      try {
        const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001") + '/payments/store-tilopay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          toast.success('Compra exitosa con Tilo Pay');
          setCart([]);
          setCheckoutMode(false);
          setShowCart(false);
          fetchProducts(); // Refresh stock
        } else {
          toast.error('Error procesando el pago');
        }
      } catch (err) {
        toast.error('Error de red');
      }
    } else if (paymentMethod === 'SINPE') {
      if (!sinpeFile) {
        toast.error('Debe adjuntar el comprobante');
        return;
      }
      setUploading(true);
      const formData = new FormData();
      formData.append('amount', cartTotal.toString());
      formData.append('description', `Compra Tienda: ${cart.map(i => `${i.quantity}x ${i.name}`).join(', ')}`);
      formData.append('items_json', JSON.stringify(cart.map(item => ({ product_id: item.id, quantity: item.quantity, selectedColor: item.selectedColor, selectedSize: item.selectedSize }))));
      formData.append('file', sinpeFile);

      try {
        const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001") + '/payments/store-sinpe', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: formData
        });
        if (res.ok) {
          toast.success('Orden enviada y pendiente de aprobación');
          setCart([]);
          setCheckoutMode(false);
          setShowCart(false);
          fetchProducts(); // Refresh stock
        } else {
          toast.error('Error al subir el comprobante');
        }
      } catch (err) {
        toast.error('Error de red');
      } finally {
        setUploading(false);
      }
    }
  };

  // Helper for Modal
  const availableColors = Array.from(new Set(variants.map(v => v.color)));
  const sizesForSelectedColor = variants.filter(v => v.color === selectedColor).map(v => v.size);
  const currentVariant = variants.find(v => v.color === selectedColor && v.size === selectedSize);
  const currentAvailableStock = variants.length > 0 ? (currentVariant?.stock || 0) : (selectedProduct?.stock || 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>Tienda Oficial</h1>
          <p className="opacity-70 mt-1">Uniformes, accesorios y servicios adicionales</p>
        </div>
        <button onClick={() => setShowCart(true)} className="btn-primary relative flex items-center gap-2">
          <ShoppingBag size={20} />
          <span className="hidden md:inline">Carrito</span>
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-white text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 opacity-50">Cargando productos...</div>
        ) : products.length === 0 ? (
          <div className="col-span-full p-12 text-center opacity-70 glass-card">
            No hay productos disponibles en este momento.
          </div>
        ) : products.map(product => (
          <div key={product.id} onClick={() => openProductModal(product)} className="glass-card flex flex-col items-center text-center hover:scale-[1.02] transition-transform cursor-pointer relative overflow-hidden group">
            {product.stock <= 0 && (
              <div className="absolute inset-0 bg-black/60 z-10 flex items-center justify-center">
                <span className="bg-red-500 text-white font-bold px-4 py-2 rounded-xl rotate-[-15deg] text-xl border-2 border-white shadow-xl">Agotado</span>
              </div>
            )}
            
            <div className="w-full h-48 bg-zinc-800 rounded-lg flex items-center justify-center text-6xl mb-4 overflow-hidden relative">
              {product.image_url ? (
                <img src={`${product.image_url?.startsWith(\"http\") ? \"\" : (process.env.NEXT_PUBLIC_API_URL || \"http://127.0.0.1:8001\")}${product.image_url}`} alt={product.name} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" />
              ) : '🛍️'}
              {product.discipline && (
                <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                  {product.discipline.split(',').map((d: string) => (
                    <span key={d} className="bg-[var(--primary)] text-black text-[10px] font-bold uppercase px-2 py-1 rounded shadow-lg">
                      {d}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <h3 className="text-lg font-bold mb-1 w-full truncate px-2">{product.name}</h3>
            {product.description && <p className="text-sm opacity-60 mb-2 line-clamp-2 px-2">{product.description}</p>}
            
            <div className="mt-auto pt-4 flex items-center justify-between w-full border-t border-white/10 px-2">
               <p className="text-xl font-bold text-[var(--primary)]">₡{product.price.replace(/[^\d]/g, '')}</p>
               <span className="text-xs opacity-50 font-semibold bg-white/10 px-2 py-1 rounded">
                 Stock Total: {product.stock}
               </span>
            </div>
          </div>
        ))}
      </div>

      {/* PRODUCT MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative">
            <button onClick={() => setSelectedProduct(null)} className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-white/20 rounded-full transition-colors">
              <X size={20} />
            </button>
            
            <div className="w-full md:w-1/2 h-64 md:h-auto bg-zinc-800 relative">
              {selectedProduct.image_url ? (
                <img src={`${selectedProduct.image_url?.startsWith(\"http\") ? \"\" : (process.env.NEXT_PUBLIC_API_URL || \"http://127.0.0.1:8001\")}${selectedProduct.image_url}`} className="w-full h-full object-cover" alt="" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl">🛍️</div>
              )}
            </div>
            
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col">
              <div className="mb-2">
                <span className="text-[var(--primary)] text-xs font-bold uppercase tracking-wider">{selectedProduct.discipline || 'General'}</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">{selectedProduct.name}</h2>
              <p className="text-3xl font-black text-[var(--primary)] mb-4">₡{selectedProduct.price.replace(/[^\d]/g, '')}</p>
              
              <div className="opacity-80 text-sm mb-6 flex-1">
                {selectedProduct.description || 'Sin descripción detallada.'}
              </div>
              
              {variants.length > 0 && (
                <>
                  <div className="mb-4">
                    <label className="text-xs font-bold opacity-70 mb-2 block">COLOR</label>
                    <div className="flex flex-wrap gap-2">
                      {availableColors.map((c: string) => {
                        const hasAnyStock = variants.some(v => v.color === c && v.stock > 0);
                        return (
                          <button 
                            key={c} 
                            disabled={!hasAnyStock}
                            onClick={() => handleColorSelect(c)} 
                            className={`px-4 py-2 rounded border text-sm font-semibold transition-colors ${selectedColor === c ? 'bg-[var(--primary)] text-black border-[var(--primary)]' : !hasAnyStock ? 'opacity-30 cursor-not-allowed border-white/10' : 'border-white/20 hover:border-white/50'}`}
                          >
                            {c}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {selectedColor && (
                    <div className="mb-4">
                      <label className="text-xs font-bold opacity-70 mb-2 block">TALLA / TAMAÑO</label>
                      <div className="flex flex-wrap gap-2">
                        {sizesForSelectedColor.map((s: string) => {
                          const varStock = variants.find(v => v.color === selectedColor && v.size === s)?.stock || 0;
                          const hasStock = varStock > 0;
                          return (
                            <button 
                              key={s} 
                              disabled={!hasStock}
                              onClick={() => setSelectedSize(s)} 
                              className={`px-4 py-2 rounded border text-sm font-semibold transition-colors ${selectedSize === s ? 'bg-[var(--primary)] text-black border-[var(--primary)]' : !hasStock ? 'opacity-30 cursor-not-allowed border-white/10' : 'border-white/20 hover:border-white/50'}`}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
              
              <div className="mb-6 flex items-center justify-between">
                <div>
                   <label className="text-xs font-bold opacity-70 block mb-2">CANTIDAD</label>
                   <div className="flex items-center gap-4 bg-black/30 rounded-lg p-1 border border-white/10 w-min">
                     <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded">-</button>
                     <span className="font-bold w-4 text-center">{quantity}</span>
                     <button onClick={() => setQuantity(quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded">+</button>
                   </div>
                </div>
                <div className="text-right">
                  <span className="text-xs opacity-50 block mb-1">Disponibles</span>
                  <span className="font-bold text-lg">{currentAvailableStock}</span>
                </div>
              </div>

              <button 
                onClick={addToCart} 
                disabled={currentAvailableStock <= 0}
                className="w-full btn-primary py-4 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                <ShoppingBag size={20} />
                {currentAvailableStock <= 0 ? 'Agotado' : 'Añadir al Carrito'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CART SIDEBAR / OVERLAY */}
      {showCart && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm animate-in fade-in" onClick={() => setShowCart(false)}></div>
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-zinc-900 z-50 shadow-2xl border-l border-white/10 flex flex-col animate-in slide-in-from-right duration-300">
            
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
              <div className="flex items-center gap-3">
                <ShoppingBag className="text-[var(--primary)]" />
                <h2 className="text-xl font-bold">Tu Carrito</h2>
              </div>
              <button onClick={() => setShowCart(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-50 space-y-4">
                  <ShoppingBag size={48} />
                  <p>Tu carrito está vacío</p>
                </div>
              ) : checkoutMode ? (
                // CHECKOUT VIEW
                <div className="animate-in fade-in slide-in-from-right-4">
                  <button onClick={() => setCheckoutMode(false)} className="text-sm font-semibold opacity-70 hover:opacity-100 flex items-center gap-2 mb-6">
                    <ChevronRight size={16} className="rotate-180" /> Volver al carrito
                  </button>
                  
                  <h3 className="font-bold text-lg mb-4">Método de Pago</h3>
                  <div className="grid grid-cols-2 gap-3 mb-8">
                    <button onClick={() => setPaymentMethod('TILOPAY')} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-colors ${paymentMethod === 'TILOPAY' ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' : 'border-white/10 hover:border-white/30'}`}>
                      <CreditCard size={24} />
                      <span className="font-bold text-sm">Tarjeta</span>
                    </button>
                    <button onClick={() => setPaymentMethod('SINPE')} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-colors ${paymentMethod === 'SINPE' ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' : 'border-white/10 hover:border-white/30'}`}>
                      <span className="font-black text-xl leading-none">S</span>
                      <span className="font-bold text-sm">SINPE</span>
                    </button>
                  </div>

                  {paymentMethod === 'SINPE' && (
                    <div className="space-y-4 mb-8 bg-black/30 p-4 rounded-xl border border-white/5">
                      <p className="text-sm opacity-80">Por favor realiza el SINPE al <strong className="text-[var(--primary)]">8888-8888</strong> y adjunta el comprobante a continuación:</p>
                      
                      <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-[var(--primary)] transition-colors relative">
                        {sinpeFile ? (
                           <div className="flex flex-col items-center gap-2">
                             <CheckCircle className="text-green-400" size={32} />
                             <span className="text-sm font-semibold">{sinpeFile.name}</span>
                             <button onClick={() => setSinpeFile(null)} className="text-xs text-red-400 hover:underline mt-2">Quitar archivo</button>
                           </div>
                        ) : (
                          <>
                            <Upload className="mx-auto mb-2 opacity-50" size={24} />
                            <span className="text-sm font-semibold opacity-70">Haz clic para subir comprobante</span>
                          </>
                        )}
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={(e) => {
                          if (e.target.files?.[0]) setSinpeFile(e.target.files[0]);
                        }}/>
                      </div>
                    </div>
                  )}

                  <div className="border-t border-white/10 pt-4 space-y-2 mb-8">
                    <div className="flex justify-between text-sm opacity-70">
                      <span>Subtotal ({cart.length} items)</span>
                      <span>₡{cartTotal.toLocaleString('es-CR')}</span>
                    </div>
                    <div className="flex justify-between font-black text-xl">
                      <span>Total a pagar</span>
                      <span className="text-[var(--primary)]">₡{cartTotal.toLocaleString('es-CR')}</span>
                    </div>
                  </div>

                </div>
              ) : (
                // CART LIST VIEW
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.cartId} className="flex gap-4 p-4 bg-black/20 rounded-xl border border-white/5 relative group">
                      <button onClick={() => removeFromCart(item.cartId)} className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-all">
                        <Trash2 size={16} />
                      </button>
                      <div className="w-16 h-16 bg-black rounded-lg overflow-hidden flex-shrink-0">
                        {item.image_url ? (
                           <img src={`${item.image_url?.startsWith(\"http\") ? \"\" : (process.env.NEXT_PUBLIC_API_URL || \"http://127.0.0.1:8001\")}${item.image_url}`} className="w-full h-full object-cover" alt=""/>
                        ) : (
                           <div className="w-full h-full flex items-center justify-center">🛍️</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold pr-6 leading-tight mb-1">{item.name}</h4>
                        <div className="text-xs opacity-60 flex gap-2 mb-2">
                          {item.selectedColor && <span className="bg-white/10 px-2 py-0.5 rounded">Color: {item.selectedColor}</span>}
                          {item.selectedSize && <span className="bg-white/10 px-2 py-0.5 rounded">Talla: {item.selectedSize}</span>}
                        </div>
                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-sm font-semibold opacity-80">{item.quantity} x ₡{item.price.replace(/[^\d]/g, '')}</span>
                          <span className="font-bold text-[var(--primary)]">₡{(parseFloat(item.price.replace(/[^\d.]/g, '')) * item.quantity).toLocaleString('es-CR')}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* CART FOOTER */}
            {cart.length > 0 && !checkoutMode && (
              <div className="p-6 bg-black/40 border-t border-white/10">
                <div className="flex justify-between font-bold text-xl mb-6">
                  <span>Total</span>
                  <span className="text-[var(--primary)]">₡{cartTotal.toLocaleString('es-CR')}</span>
                </div>
                <button onClick={() => setCheckoutMode(true)} className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-lg">
                  Continuar al Pago <ArrowRight size={20} />
                </button>
              </div>
            )}
            
            {cart.length > 0 && checkoutMode && (
              <div className="p-6 bg-black/40 border-t border-white/10">
                <button 
                  onClick={handleCheckout}
                  disabled={!paymentMethod || uploading || (paymentMethod === 'SINPE' && !sinpeFile)}
                  className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Procesando...' : `Confirmar Pago de ₡${cartTotal.toLocaleString('es-CR')}`}
                </button>
              </div>
            )}

          </div>
        </>
      )}
    </div>
  );
}
