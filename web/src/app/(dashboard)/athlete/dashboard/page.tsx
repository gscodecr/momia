'use client';
import { useState, useRef } from 'react';
import { Share2, Activity, TrendingUp, Heart, Award, MapPin, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AthleteDashboard() {
  const heroRef = useRef<HTMLDivElement>(null);
  
  // Dummy latest workout
  const latestWorkout = {
    title: 'Fondo Dominical - Volcán Irazú',
    type: 'Ciclismo',
    distance: '85.4 km',
    time: '3h 45m',
    elevation: '1,240 m',
    date: 'Ayer, 05:30 AM'
  };

  const handleShare = () => {
    // En el futuro, usar html2canvas para descargar la imagen
    toast.success('Función de compartir en construcción. ¡Pronto podrás descargar tu arte tipo Strava!');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>Mi Progreso</h1>
        <p className="opacity-70 mt-1">Sigue superando tus límites</p>
      </div>

      {/* Hero Banner (Strava Style) */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
        {/* Abstract Background for the Hero */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-black z-0">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 150%, var(--primary) 0%, transparent 50%)' }}></div>
        </div>
        
        {/* Content */}
        <div ref={heroRef} className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 space-y-4 w-full">
            <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-sm border border-white/5">
              Último Entrenamiento
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">{latestWorkout.title}</h2>
            
            <div className="flex flex-wrap gap-6 pt-4">
              <div>
                <p className="text-sm opacity-60 uppercase tracking-wider mb-1">Distancia</p>
                <p className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>{latestWorkout.distance}</p>
              </div>
              <div>
                <p className="text-sm opacity-60 uppercase tracking-wider mb-1">Tiempo</p>
                <p className="text-3xl font-bold">{latestWorkout.time}</p>
              </div>
              <div>
                <p className="text-sm opacity-60 uppercase tracking-wider mb-1">Desnivel</p>
                <p className="text-3xl font-bold">{latestWorkout.elevation}</p>
              </div>
            </div>
            <p className="text-sm opacity-50 flex items-center gap-2 pt-2"><Clock size={14} /> {latestWorkout.date}</p>
          </div>
          
          {/* Share Button Block */}
          <div className="flex flex-col items-center gap-3 w-full md:w-auto">
            <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden backdrop-blur-md">
              <Activity size={40} style={{ color: 'var(--primary)' }} />
            </div>
            <button 
              onClick={handleShare}
              className="mt-2 w-full md:w-auto px-6 py-3 rounded-full bg-[var(--primary)] text-white font-bold flex items-center justify-center gap-2 hover:scale-105 transition-transform"
            >
              <Share2 size={18} />
              <span>Compartir Logro</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card flex flex-col justify-center">
          <p className="text-sm uppercase tracking-wider opacity-60 mb-2 flex items-center gap-2"><TrendingUp size={16} /> Semanal</p>
          <h3 className="text-3xl font-bold">120 km</h3>
          <p className="text-xs text-green-400 mt-2">+15 km vs sem pasada</p>
        </div>
        <div className="glass-card flex flex-col justify-center">
          <p className="text-sm uppercase tracking-wider opacity-60 mb-2 flex items-center gap-2"><Clock size={16} /> Horas Activas</p>
          <h3 className="text-3xl font-bold">8h 45m</h3>
          <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-[var(--primary)] h-full" style={{ width: '80%' }}></div>
          </div>
        </div>
        <div className="glass-card flex flex-col justify-center">
          <p className="text-sm uppercase tracking-wider opacity-60 mb-2 flex items-center gap-2"><Heart size={16} /> Carga (TSS)</p>
          <h3 className="text-3xl font-bold text-orange-400">450</h3>
          <p className="text-xs opacity-60 mt-2">Fatiga acumulada alta</p>
        </div>
        <div className="glass-card flex flex-col justify-center border-t-2 md:border-t-0 md:border-l-2" style={{ borderColor: 'var(--primary)' }}>
          <p className="text-sm uppercase tracking-wider opacity-60 mb-2 flex items-center gap-2"><Award size={16} /> Siguiente Evento</p>
          <h3 className="text-xl font-bold truncate">Ironman 70.3 CR</h3>
          <p className="text-xs font-semibold text-[var(--primary)] mt-2">En 45 días</p>
        </div>
      </div>
    </div>
  );
}
