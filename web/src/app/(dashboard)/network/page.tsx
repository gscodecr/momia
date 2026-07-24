'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Phone, Mail, MapPin, Users } from 'lucide-react';

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

export default function NetworkPage() {
  const [items, setItems] = useState<NetworkItem[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<NetworkItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('Todos');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [category, setCategory] = useState('');
  
  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001") + '/network/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSave = async () => {
    if (!title || !description || !contactName) {
      alert('Por favor completa los campos principales (Título, Descripción, Nombre de contacto)');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('contact_name', contactName);
      if (contactPhone) formData.append('contact_phone', contactPhone);
      if (contactEmail) formData.append('contact_email', contactEmail);
      if (category) formData.append('category', category);
      if (selectedFile) formData.append('photo', selectedFile);

      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001") + '/network/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        await fetchItems();
        // Reset form
        setTitle('');
        setDescription('');
        setSelectedFile(null);
        setPhotoPreview(null);
        setContactName('');
        setContactPhone('');
        setContactEmail('');
        setCategory('');
        setIsAddModalOpen(false);
      } else {
        alert('Error al publicar el servicio');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión');
    }
  };

  const openDetail = (item: NetworkItem) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const categories = ['Todos', 'Salud', 'Equipo', 'Servicios', 'Otros'];
  
  const filteredItems = filterCategory === 'Todos' 
    ? items 
    : items.filter(item => (item.category || 'General') === filterCategory);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Network Momia</h1>
          <p className="opacity-70 mt-1">Directorio de productos y servicios de nuestra comunidad.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:brightness-110 transition-all font-semibold"
        >
          <Plus size={20} />
          Agregar
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filterCategory === cat 
                ? 'bg-[var(--primary)] text-white' 
                : 'bg-white/5 hover:bg-white/10 text-white/70'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Desktop & Mobile Responsive List */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl overflow-hidden shadow-lg">
        
        {/* Mobile View: Cards */}
        <div className="md:hidden flex flex-col divide-y divide-[var(--border)]">
          {filteredItems.map((item) => (
            <div key={item.id} onClick={() => openDetail(item)} className="p-4 hover:bg-white/5 cursor-pointer transition-colors flex gap-4">
              <div className="w-20 h-20 rounded-lg bg-[var(--background)] overflow-hidden flex-shrink-0 border border-white/5">
                <img src={item.photo_url ? `${item.photo_url?.startsWith(\"http\") ? \"\" : (process.env.NEXT_PUBLIC_API_URL || \"http://127.0.0.1:8001\")}${item.photo_url}` : 'https://via.placeholder.com/400x300?text=Sin+Imagen'} alt={item.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-1">
                  <span className="px-2 py-0.5 bg-[var(--primary)]/20 text-[var(--primary)] rounded text-[10px] font-bold uppercase tracking-wider">
                    {item.category || 'General'}
                  </span>
                  <span className="text-[10px] opacity-50">
                    {new Date(item.created_at).toLocaleDateString('es-CR')}
                  </span>
                </div>
                <p className="font-bold text-sm truncate">{item.title}</p>
                <p className="text-xs opacity-60 line-clamp-1 mb-2">{item.description}</p>
                <div className="flex items-center gap-1 text-xs opacity-80">
                  <Users size={12} />
                  <span className="truncate">{item.contact_name}</span>
                </div>
              </div>
            </div>
          ))}
          {filteredItems.length === 0 && (
            <div className="p-8 text-center opacity-50">No se encontraron publicaciones.</div>
          )}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-black/20">
                <th className="p-4 font-semibold opacity-70">Servicio / Producto</th>
                <th className="p-4 font-semibold opacity-70">Categoría</th>
                <th className="p-4 font-semibold opacity-70">Contacto</th>
                <th className="p-4 font-semibold opacity-70 text-right">Publicado</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr 
                  key={item.id} 
                  onClick={() => openDetail(item)}
                  className="border-b border-[var(--border)] hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-[var(--background)] overflow-hidden flex-shrink-0 border border-white/5">
                        <img src={item.photo_url ? `${item.photo_url?.startsWith(\"http\") ? \"\" : (process.env.NEXT_PUBLIC_API_URL || \"http://127.0.0.1:8001\")}${item.photo_url}` : 'https://via.placeholder.com/400x300?text=Sin+Imagen'} alt={item.title} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <p className="font-bold">{item.title}</p>
                        <p className="text-sm opacity-60 line-clamp-1 max-w-md">{item.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-medium border border-white/10">
                      {item.category || 'General'}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="font-medium">{item.contact_name}</p>
                    {item.contact_phone && <p className="text-sm opacity-60 flex items-center gap-1"><Phone size={12}/> {item.contact_phone}</p>}
                  </td>
                  <td className="p-4 text-right opacity-70 text-sm">
                    {new Date(item.created_at).toLocaleDateString('es-CR')}
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center opacity-50">
                    No se encontraron publicaciones.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-[var(--border)] flex justify-between items-center bg-black/20">
              <h2 className="text-xl font-bold">Publicar en Network Momia</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="opacity-70 hover:opacity-100 bg-white/5 p-2 rounded-full hover:bg-white/10 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 opacity-70 uppercase tracking-wide">Título</label>
                  <input 
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Ej. Servicio de Nutrición, Venta de Garmin..." 
                    className="w-full p-4 rounded-xl bg-[var(--background)] border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 opacity-70 uppercase tracking-wide">Descripción</label>
                  <textarea 
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe los detalles..." 
                    rows={4}
                    className="w-full p-4 rounded-xl bg-[var(--background)] border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2 opacity-70 uppercase tracking-wide">Categoría</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full p-4 rounded-xl bg-[var(--background)] border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all appearance-none"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="Salud">Salud y Bienestar</option>
                      <option value="Equipo">Equipo Deportivo</option>
                      <option value="Servicios">Servicios Profesionales</option>
                      <option value="Otros">Otros</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 opacity-70 uppercase tracking-wide">Foto</label>
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedFile(file);
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setPhotoPreview(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--primary)] file:text-white hover:file:bg-[var(--primary)]/90"
                    />
                    {photoPreview && (
                      <div className="mt-2 h-20 w-32 rounded bg-black/20 overflow-hidden border border-white/10">
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--border)] mt-6">
                  <h3 className="font-bold mb-4 text-lg">Información de Contacto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1 opacity-70">Nombre</label>
                      <input 
                        type="text"
                        value={contactName}
                        onChange={e => setContactName(e.target.value)}
                        className="w-full p-3 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:border-[var(--primary)] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 opacity-70">Teléfono</label>
                      <input 
                        type="text"
                        value={contactPhone}
                        onChange={e => setContactPhone(e.target.value)}
                        className="w-full p-3 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:border-[var(--primary)] outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold mb-1 opacity-70">Correo Electrónico (Opcional)</label>
                      <input 
                        type="email"
                        value={contactEmail}
                        onChange={e => setContactEmail(e.target.value)}
                        className="w-full p-3 rounded-lg bg-[var(--background)] border border-[var(--border)] focus:border-[var(--primary)] outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-[var(--border)] bg-black/20 flex justify-end gap-3">
              <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-3 rounded-xl font-semibold hover:bg-white/5 transition-colors border border-transparent hover:border-white/10">Cancelar</button>
              <button onClick={handleSave} className="px-6 py-3 rounded-xl bg-[var(--primary)] text-white font-bold hover:brightness-110 transition-all shadow-lg shadow-[var(--primary)]/20">Publicar</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {isDetailModalOpen && selectedItem && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
            <button onClick={() => setIsDetailModalOpen(false)} className="absolute top-4 right-4 z-10 bg-black/50 backdrop-blur-md p-2 rounded-full hover:bg-black/80 transition-colors text-white">
              <X size={20} />
            </button>
            
            <div className="h-64 bg-[var(--background)] relative w-full">
              <img src={selectedItem.photo_url ? `${selectedItem.photo_url?.startsWith(\"http\") ? \"\" : (process.env.NEXT_PUBLIC_API_URL || \"http://127.0.0.1:8001\")}${selectedItem.photo_url}` : 'https://via.placeholder.com/400x300?text=Sin+Imagen'} alt={selectedItem.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface)] via-transparent to-transparent" />
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="px-3 py-1 bg-[var(--primary)]/20 text-[var(--primary)] rounded-full text-xs font-bold uppercase tracking-wider mb-2 inline-block">
                    {selectedItem.category || 'General'}
                  </span>
                  <h2 className="text-2xl font-bold">{selectedItem.title}</h2>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-60">Publicado</p>
                  <p className="font-semibold">{new Date(selectedItem.created_at).toLocaleDateString('es-CR')}</p>
                </div>
              </div>
              
              <p className="text-lg opacity-80 mb-8 whitespace-pre-wrap">{selectedItem.description}</p>
              
              <div className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-3">
                <h3 className="font-semibold opacity-70 text-sm uppercase tracking-wide mb-1">Información de Contacto</h3>
                <div className="flex items-center gap-3">
                  <Users size={18} className="text-[var(--primary)]" />
                  <span>{selectedItem.contact_name}</span>
                </div>
                {selectedItem.contact_phone && (
                  <div className="flex items-center gap-3">
                    <Phone size={18} className="text-[var(--primary)]" />
                    <span>{selectedItem.contact_phone}</span>
                  </div>
                )}
                {selectedItem.contact_email && (
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-[var(--primary)]" />
                    <span>{selectedItem.contact_email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
