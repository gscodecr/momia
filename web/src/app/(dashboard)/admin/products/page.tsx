'use client';
import { useState, useEffect } from 'react';
import { Plus, Package, Edit, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8001/products/', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setProducts(await res.json());
      }
    } catch (err) {
      toast.error('Error al cargar productos');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://127.0.0.1:8001/products/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name, price, description })
      });
      if (res.ok) {
        toast.success('Producto creado');
        setShowForm(false);
        setName(''); setPrice(''); setDescription('');
        fetchProducts();
      } else {
        toast.error('Error al crear producto');
      }
    } catch (err) {
      toast.error('Error de red');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Seguro que deseas eliminar este producto?')) return;
    try {
      const res = await fetch(`http://127.0.0.1:8001/products/${id}`, {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>Marketplace</h1>
          <p className="opacity-70 mt-1">Gestión de Productos y Servicios</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          {showForm ? <X size={20} /> : <Plus size={20} />}
          <span>{showForm ? 'Cancelar' : 'Nuevo Producto'}</span>
        </button>
      </div>

      {showForm && (
        <div className="glass-card mb-6">
          <h2 className="text-xl font-bold mb-4">Agregar Producto</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required placeholder="Nombre del producto" value={name} onChange={e => setName(e.target.value)} className="p-3 rounded-lg bg-black/20 border border-white/10" />
            <input required placeholder="Precio (ej. ₡45,000)" value={price} onChange={e => setPrice(e.target.value)} className="p-3 rounded-lg bg-black/20 border border-white/10" />
            <input placeholder="Descripción breve" value={description} onChange={e => setDescription(e.target.value)} className="p-3 rounded-lg bg-black/20 border border-white/10 md:col-span-2" />
            <button type="submit" className="btn-primary md:col-span-2 mt-2">Guardar Producto</button>
          </form>
        </div>
      )}

      <div className="glass-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 opacity-70">
                <th className="p-4 font-semibold">Producto</th>
                <th className="p-4 font-semibold">Descripción</th>
                <th className="p-4 font-semibold">Precio</th>
                <th className="p-4 font-semibold">Estado</th>
                <th className="p-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center">
                      <Package size={20} className="opacity-50" />
                    </div>
                    <span className="font-semibold">{p.name}</span>
                  </td>
                  <td className="p-4 text-sm opacity-70">{p.description || 'Sin descripción'}</td>
                  <td className="p-4">{p.price}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded">
                      {p.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(p.id)} className="p-2 opacity-70 hover:opacity-100 hover:text-red-400 transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center opacity-50">No hay productos registrados</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
