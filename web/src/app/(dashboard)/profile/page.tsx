'use client';
import { useState, useEffect } from 'react';
import { User, Mail, Shield, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setRole(localStorage.getItem('role'));
  }, []);

  const handleSave = () => {
    toast.success('Perfil actualizado correctamente');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>Mi Perfil</h1>
        <p className="opacity-70 mt-1">Gestiona tu información personal y preferencias</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Avatar & Basic Info */}
        <div className="glass-card flex flex-col items-center text-center">
          <div className="relative group cursor-pointer mb-6">
            <div className="w-32 h-32 rounded-full flex items-center justify-center text-5xl font-bold border-4 border-zinc-800" style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
              {role ? role[0].toUpperCase() : 'U'}
            </div>
            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={24} />
            </div>
          </div>
          
          <h2 className="text-xl font-bold mb-1">Nombre Apellido</h2>
          <p className="text-sm opacity-60 mb-4 capitalize">{role}</p>
          <div className="w-full flex items-center justify-between text-sm p-3 bg-white/5 rounded-lg border border-white/5">
            <span className="opacity-70">Estado</span>
            <span className="text-green-400 font-semibold bg-green-500/20 px-2 py-0.5 rounded">Activo</span>
          </div>
        </div>

        {/* Edit Form */}
        <div className="md:col-span-2 glass-card space-y-6">
          <h3 className="text-xl font-bold border-b border-white/10 pb-3">Datos Personales</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm opacity-70 flex items-center gap-2"><User size={16} /> Nombre</label>
              <input type="text" defaultValue="Nombre" className="w-full p-3 rounded-lg bg-black/20 border border-white/10 focus:border-[var(--primary)] focus:outline-none transition-colors" />
            </div>
            <div className="space-y-2">
              <label className="text-sm opacity-70 flex items-center gap-2"><User size={16} /> Apellido</label>
              <input type="text" defaultValue="Apellido" className="w-full p-3 rounded-lg bg-black/20 border border-white/10 focus:border-[var(--primary)] focus:outline-none transition-colors" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm opacity-70 flex items-center gap-2"><Mail size={16} /> Correo Electrónico</label>
              <input type="email" defaultValue="usuario@ejemplo.com" className="w-full p-3 rounded-lg bg-black/20 border border-white/10 focus:border-[var(--primary)] focus:outline-none transition-colors" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm opacity-70 flex items-center gap-2"><Shield size={16} /> Contraseña</label>
              <input type="password" placeholder="••••••••" className="w-full p-3 rounded-lg bg-black/20 border border-white/10 focus:border-[var(--primary)] focus:outline-none transition-colors" />
              <p className="text-xs opacity-50 mt-1">Déjalo en blanco si no deseas cambiarla.</p>
            </div>
          </div>

          <div className="pt-6 border-t border-white/10 flex justify-end">
            <button onClick={handleSave} className="btn-primary">
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
