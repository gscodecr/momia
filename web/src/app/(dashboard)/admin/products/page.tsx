'use client';
import { useState, useEffect } from 'react';
import { Plus, Package, Edit, Trash2, X, Upload, CheckCircle, CheckCircle2, ShoppingBag, Truck, User } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'ORDERS'>('PRODUCTS');

  // --- PRODUCTS STATE ---
  const [products, setProducts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [discipline, setDiscipline] = useState('');
  
  const [useVariants, setUseVariants] = useState(false);
  const [stock, setStock] = useState('0');
  
  const [variants, setVariants] = useState<{id: string, color: string, size: string, stock: number}[]>([]);
  
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // --- ORDERS STATE ---
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchProducts();
    fetchOrders();
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
      toast.error('Error al cargar productos');
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001") + '/admin/orders', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (err) {
      toast.error('Error al cargar órdenes');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001") + '/products/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      
      if (res.ok) {
        const data = await res.json();
        setImageUrl(data.url);
        toast.success('Imagen optimizada y cargada');
      } else {
        toast.error('Error al subir imagen');
      }
    } catch (err) {
      toast.error('Error de red al subir imagen');
    } finally {
      setUploading(false);
    }
  };

  const addVariant = () => {
    setVariants([...variants, { id: Math.random().toString(36).substr(2, 9), color: '', size: '', stock: 0 }]);
  };

  const updateVariant = (id: string, field: string, value: string | number) => {
    setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const removeVariant = (id: string) => {
    setVariants(variants.filter(v => v.id !== id));
  };

  const calculateTotalStock = () => {
    if (!useVariants) return parseInt(stock) || 0;
    return variants.reduce((acc, v) => acc + (v.stock || 0), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const totalStock = calculateTotalStock();
      const variants_json = useVariants ? JSON.stringify(variants.map(({color, size, stock}) => ({color, size, stock}))) : null;

      const url = editingProductId ? `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001"}/products/${editingProductId}` : (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001") + '/products/';
      const method = editingProductId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          name, 
          price, 
          description, 
          discipline, 
          image_url: imageUrl, 
          color: '',
          size: '',
          stock: totalStock,
          variants_json
        })
      });
      if (res.ok) {
        toast.success(editingProductId ? 'Producto actualizado' : 'Producto creado');
        resetForm();
        fetchProducts();
      } else {
        toast.error('Error al guardar producto');
      }
    } catch (err) {
      toast.error('Error de red');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingProductId(null);
    setName(''); setPrice(''); setDescription(''); setDiscipline(''); setImageUrl('');
    setStock('0'); setUseVariants(false); setVariants([]);
  };

  const startEdit = (product: any) => {
    setEditingProductId(product.id);
    setName(product.name || '');
    setPrice(product.price || '');
    setDescription(product.description || '');
    setDiscipline(product.discipline || '');
    setImageUrl(product.image_url || '');
    
    if (product.variants_json) {
      try {
        const parsed = JSON.parse(product.variants_json);
        setVariants(parsed.map((v: any) => ({ ...v, id: Math.random().toString(36).substr(2, 9) })));
        setUseVariants(true);
        setStock('0');
      } catch (e) {
        setUseVariants(false);
        setStock(product.stock !== undefined ? product.stock.toString() : '0');
      }
    } else {
      setUseVariants(false);
      setStock(product.stock !== undefined ? product.stock.toString() : '0');
      setVariants([]);
    }
    
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este producto?')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001"}/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        toast.success('Producto eliminado');
        fetchProducts();
      }
    } catch (err) {
      toast.error('Error de red');
    }
  };

  const handleDeliverOrder = async (orderId: number) => {
    if (!confirm('¿Marcar esta orden como entregada?')) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001"}/admin/orders/${orderId}/deliver`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        toast.success('Orden marcada como entregada');
        fetchOrders();
      } else {
        toast.error('Error al actualizar orden');
      }
    } catch (err) {
      toast.error('Error de red');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-black/20 p-6 rounded-2xl border border-white/5 gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>Marketplace</h1>
          <p className="opacity-70 mt-1">Gestión de Productos y Órdenes</p>
        </div>
        
        <div className="flex gap-4 border-b border-white/10">
          <button 
            onClick={() => setActiveTab('PRODUCTS')} 
            className={`pb-2 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'PRODUCTS' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent opacity-60 hover:opacity-100'}`}
          >
            <Package size={18} /> Productos
          </button>
          <button 
            onClick={() => setActiveTab('ORDERS')} 
            className={`pb-2 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'ORDERS' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent opacity-60 hover:opacity-100'}`}
          >
            <ShoppingBag size={18} /> Órdenes
          </button>
        </div>

        {activeTab === 'PRODUCTS' && (
          <button onClick={() => {
            if (showForm) resetForm();
            else setShowForm(true);
          }} className="btn-primary flex items-center gap-2">
            {showForm ? <X size={20} /> : <Plus size={20} />}
            <span>{showForm ? 'Cancelar' : 'Nuevo Producto'}</span>
          </button>
        )}
      </div>

      {activeTab === 'PRODUCTS' && showForm && (
        <div className="glass-card animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
            <div className="w-10 h-10 rounded-full bg-[var(--primary)]/20 flex items-center justify-center">
              <Package size={20} className="text-[var(--primary)]" />
            </div>
            <h2 className="text-xl font-bold">{editingProductId ? 'Editar Producto' : 'Detalles del Nuevo Producto'}</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold opacity-70">Nombre del Producto</label>
                <input required value={name} onChange={e => setName(e.target.value)} className="w-full p-3 rounded-xl bg-black/40 border border-white/10 focus:border-[var(--primary)] focus:outline-none transition-colors" placeholder="Ej: Uniforme Oficial 2026" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold opacity-70">Precio (₡)</label>
                <input required value={price} onChange={e => setPrice(e.target.value)} className="w-full p-3 rounded-xl bg-black/40 border border-white/10 focus:border-[var(--primary)] focus:outline-none transition-colors" placeholder="Ej: 15000" />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold opacity-70">Descripción</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 rounded-xl bg-black/40 border border-white/10 focus:border-[var(--primary)] focus:outline-none transition-colors min-h-[100px]" placeholder="Breve descripción del producto..." />
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold opacity-70">Disciplina / Categoría</label>
                  <p className="text-[10px] opacity-50 mt-1 mb-2">Nota: Si no marcas ninguna, será un producto general.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {['Triatlon', 'Natacion', 'Running', 'Ciclismo'].map(d => {
                    const isChecked = discipline.includes(d);
                    return (
                      <label key={d} className="flex items-center gap-2 cursor-pointer bg-black/30 border border-white/10 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={() => {
                            const current = discipline.split(',').map(s => s.trim()).filter(Boolean);
                            if (current.includes(d)) {
                              setDiscipline(current.filter(x => x !== d).join(', '));
                            } else {
                              setDiscipline([...current, d].join(', '));
                            }
                          }}
                          className="accent-[var(--primary)]"
                        />
                        <span className="text-sm font-semibold opacity-80">{d}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold opacity-70">Imagen del Producto</label>
                <div className="border-2 border-dashed border-white/20 rounded-xl p-4 text-center hover:border-[var(--primary)] transition-colors relative flex flex-col items-center justify-center overflow-hidden h-24">
                  {imageUrl ? (
                    <div className="flex items-center gap-3 w-full justify-center">
                       <img src={`${imageUrl?.startsWith(\"http\") ? \"\" : (process.env.NEXT_PUBLIC_API_URL || \"http://127.0.0.1:8001\")}${imageUrl}`} alt="preview" className="h-16 w-16 object-cover rounded-lg border border-white/10" />
                       <div className="text-left flex flex-col">
                         <span className="text-sm font-bold text-green-400 flex items-center gap-1"><CheckCircle size={14}/> Imagen Cargada</span>
                         <span className="text-xs opacity-50 cursor-pointer hover:underline text-white">Cambiar imagen</span>
                       </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="mb-2 opacity-50" size={20} />
                      <span className="text-xs font-semibold opacity-70">{uploading ? 'Subiendo...' : 'Haz clic para subir imagen'}</span>
                    </>
                  )}
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={handleFileUpload} />
                </div>
              </div>
            </div>

            {/* --- VARIANTS TOGGLE SECTION --- */}
            <div className="border-t border-white/10 pt-6 mt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-lg">Inventario y Opciones</h3>
                  <p className="text-sm opacity-60">Controla el stock de este producto.</p>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <span className="text-sm font-semibold opacity-80">
                    {useVariants ? 'Múltiples Variantes (Color/Talla)' : 'Stock General'}
                  </span>
                  <div className="relative">
                    <input type="checkbox" className="sr-only" checked={useVariants} onChange={(e) => setUseVariants(e.target.checked)} />
                    <div className={`block w-14 h-8 rounded-full transition-colors ${useVariants ? 'bg-[var(--primary)]' : 'bg-white/20'}`}></div>
                    <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${useVariants ? 'translate-x-6' : ''}`}></div>
                  </div>
                </label>
              </div>

              {!useVariants ? (
                <div className="space-y-2 md:w-1/3">
                  <label className="text-sm font-semibold opacity-70">Stock General Disponibles</label>
                  <input type="number" min="0" required value={stock} onChange={e => setStock(e.target.value)} className="w-full p-3 rounded-xl bg-black/40 border border-white/10 focus:border-[var(--primary)] focus:outline-none transition-colors font-bold text-xl" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                    {variants.length === 0 ? (
                      <p className="opacity-50 text-center py-4 text-sm">No hay variantes agregadas. Añade una para controlar el stock.</p>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-12 gap-3 text-xs font-bold opacity-60 uppercase tracking-wider px-2">
                          <div className="col-span-4">Color</div>
                          <div className="col-span-3">Talla</div>
                          <div className="col-span-4">Stock</div>
                          <div className="col-span-1"></div>
                        </div>
                        {variants.map(v => (
                          <div key={v.id} className="grid grid-cols-12 gap-3 items-center">
                            <div className="col-span-4">
                              <input value={v.color} onChange={e => updateVariant(v.id, 'color', e.target.value)} className="w-full p-2 rounded bg-black/50 border border-white/10 text-sm" placeholder="Ej: Negro" />
                            </div>
                            <div className="col-span-3">
                              <input value={v.size} onChange={e => updateVariant(v.id, 'size', e.target.value)} className="w-full p-2 rounded bg-black/50 border border-white/10 text-sm" placeholder="Ej: S, M..." />
                            </div>
                            <div className="col-span-4">
                              <input type="number" min="0" value={v.stock} onChange={e => updateVariant(v.id, 'stock', parseInt(e.target.value) || 0)} className="w-full p-2 rounded bg-black/50 border border-white/10 text-sm font-bold" />
                            </div>
                            <div className="col-span-1 text-right">
                              <button type="button" onClick={() => removeVariant(v.id)} className="text-red-400 hover:text-red-300 p-2"><Trash2 size={16} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <button type="button" onClick={addVariant} className="mt-4 text-sm font-bold text-[var(--primary)] hover:underline flex items-center gap-1">
                      <Plus size={16}/> Añadir Variante
                    </button>
                  </div>
                  <div className="text-right">
                    <span className="text-sm opacity-60 mr-2">Stock Total Calculado:</span>
                    <span className="font-bold text-xl">{calculateTotalStock()}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div className="pt-6 flex justify-end gap-3 border-t border-white/10 mt-6">
              <button type="button" onClick={resetForm} className="px-6 py-3 rounded-xl hover:bg-white/10 transition-colors font-semibold">Cancelar</button>
              <button type="submit" className="px-6 py-3 rounded-xl bg-[var(--primary)] text-black font-bold hover:opacity-90 transition-opacity flex items-center gap-2">
                {editingProductId ? <Edit size={18} /> : <Plus size={18} />}
                {editingProductId ? 'Actualizar Producto' : 'Guardar Producto'}
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'PRODUCTS' && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-white/10 text-sm font-semibold opacity-70">
                  <th className="p-4">Producto</th>
                  <th className="p-4">Disciplina</th>
                  <th className="p-4">Precio</th>
                  <th className="p-4">Variantes</th>
                  <th className="p-4">Stock Total</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center opacity-50">No hay productos disponibles</td></tr>
                ) : products.map(p => {
                  const isVariants = !!p.variants_json;
                  const variantsCount = isVariants ? (JSON.parse(p.variants_json).length) : 0;

                  return (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-zinc-800 rounded flex items-center justify-center overflow-hidden">
                            {p.image_url ? <img src={`${p.image_url?.startsWith(\"http\") ? \"\" : (process.env.NEXT_PUBLIC_API_URL || \"http://127.0.0.1:8001\")}${p.image_url}`} className="object-cover w-full h-full" alt="" /> : <Package size={20} className="opacity-50"/>}
                          </div>
                          <div>
                            <p className="font-bold">{p.name}</p>
                            <p className="text-xs opacity-50 truncate max-w-[200px]">{p.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm opacity-80">
                        {p.discipline ? <span className="bg-white/10 px-2 py-1 rounded-md text-xs">{p.discipline}</span> : '-'}
                      </td>
                      <td className="p-4 font-bold">₡{p.price.replace(/[^\d]/g, '')}</td>
                      <td className="p-4">
                        {isVariants ? (
                          <span className="text-xs font-semibold bg-[var(--primary)]/20 text-[var(--primary)] px-2 py-1 rounded">
                            {variantsCount} Variante(s)
                          </span>
                        ) : (
                          <span className="text-xs opacity-50">General</span>
                        )}
                      </td>
                      <td className="p-4 font-bold">
                        <span className={p.stock > 0 ? "text-green-400" : "text-red-400"}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1 flex-nowrap min-w-max">
                          <button type="button" onClick={() => startEdit(p)} aria-label="Editar producto" className="p-3 min-w-[44px] min-h-[44px] flex justify-center items-center opacity-70 hover:opacity-100 hover:text-[var(--primary)] transition-colors">
                            <Edit size={18} />
                          </button>
                          <button type="button" onClick={() => handleDelete(p.id)} aria-label="Eliminar producto" className="p-3 min-w-[44px] min-h-[44px] flex justify-center items-center opacity-70 hover:opacity-100 hover:text-red-400 transition-colors">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'ORDERS' && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="border-b border-white/10 text-sm font-semibold opacity-70">
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Detalle del Pedido</th>
                  <th className="p-4">Monto Total</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center opacity-70">
                      <ShoppingBag size={48} className="mx-auto mb-4 opacity-30" />
                      <p className="font-semibold text-lg">No hay órdenes</p>
                      <p className="text-sm">Aún no se han realizado compras en la tienda.</p>
                    </td>
                  </tr>
                ) : orders.map(order => {
                  let items = [];
                  try {
                    items = JSON.parse(order.items_json);
                  } catch (e) {}

                  return (
                    <tr key={order.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4 align-top">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[var(--primary)]/20 rounded-full flex items-center justify-center text-[var(--primary)] font-bold text-sm">
                            {order.user?.first_name?.charAt(0)}{order.user?.last_name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold leading-tight">{order.user?.first_name} {order.user?.last_name}</p>
                            <p className="text-xs opacity-60 mt-0.5">{order.user?.email}</p>
                            <p className="text-xs opacity-60 mt-0.5">{order.user?.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-top">
                        <div className="space-y-2">
                          {items.map((item: any, i: number) => {
                            const product = products.find(p => p.id === item.product_id);
                            return (
                              <div key={i} className="text-sm border-l-2 border-white/10 pl-3 py-1">
                                <p className="font-semibold">{product?.name || item.name_fallback || 'Producto Eliminado'}</p>
                                <div className="flex flex-wrap gap-2 mt-1 text-xs opacity-80">
                                  <span className="bg-white/10 px-2 py-0.5 rounded">Cant: {item.quantity}</span>
                                  {item.selectedColor && <span className="bg-white/10 px-2 py-0.5 rounded">Color: {item.selectedColor}</span>}
                                  {item.selectedSize && <span className="bg-white/10 px-2 py-0.5 rounded">Talla: {item.selectedSize}</span>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="p-4 font-bold align-top pt-5">
                        ₡{order.total_amount.replace(/[^\d]/g, '')}
                      </td>
                      <td className="p-4 align-top pt-5">
                        <div className="flex flex-col items-start gap-2">
                          {order.status === 'PENDIENTE' ? (
                            <span className="text-xs font-semibold bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded border border-yellow-500/30 inline-flex items-center gap-1">
                              Pendiente Entrega
                            </span>
                          ) : (
                            <span className="text-xs font-semibold bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/30 inline-flex items-center gap-1">
                              <CheckCircle2 size={12} /> Entregado
                            </span>
                          )}
                          
                          {order.payment && order.payment.status === 'PENDING' && (
                            <span className="text-[10px] font-bold bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded border border-orange-500/30 inline-flex items-center gap-1">
                              Pago en Revisión
                            </span>
                          )}
                          {order.payment && order.payment.status === 'APPROVED' && (
                            <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded border border-green-500/30 inline-flex items-center gap-1">
                              Pago Aprobado
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right align-top pt-5">
                        {order.status === 'PENDIENTE' && (
                          <button 
                            onClick={() => handleDeliverOrder(order.id)}
                            className="text-xs font-bold bg-[var(--primary)] text-black px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity inline-flex items-center gap-1"
                          >
                            <Truck size={14} /> Marcar Entregado
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
