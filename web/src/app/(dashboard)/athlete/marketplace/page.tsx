'use client';
import { useState, useEffect } from 'react';
import { ShoppingBag, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AthleteMarketplace() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8001/products/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      toast.error('Error cargando productos');
    }
  };

  const handlePurchase = () => {
    toast.success('¡Agregado al carrito! Funcionalidad de pago pronto.');
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>Tienda Oficial</h1>
        <p className="opacity-70 mt-1">Uniformes, accesorios y servicios adicionales</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.length === 0 ? (
          <div className="col-span-full p-12 text-center opacity-70 glass-card">
            No hay productos disponibles en este momento.
          </div>
        ) : products.map(product => (
          <div key={product.id} className="glass-card flex flex-col items-center text-center hover:scale-[1.02] transition-transform cursor-pointer">
            <div className="w-32 h-32 bg-zinc-800 rounded-full flex items-center justify-center text-6xl mb-4 overflow-hidden">
              {product.image_url ? <img src={product.image_url} alt={product.name} className="object-cover w-full h-full" /> : '🛍️'}
            </div>
            <h3 className="text-lg font-bold mb-1">{product.name}</h3>
            {product.description && <p className="text-sm opacity-60 mb-2">{product.description}</p>}
            <p className="text-xl font-bold text-[var(--primary)] mb-6">{product.price}</p>
            <button onClick={handlePurchase} className="w-full btn-primary flex items-center justify-center gap-2">
              <ShoppingBag size={18} />
              <span>Comprar</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
