'use client';
import { useState, useEffect } from 'react';
import { Users, DollarSign, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>Resumen Global</h1>
        <p className="opacity-70 mt-1">Métricas y KPIs de la Academia Momia TS</p>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI: Ingresos */}
        <div className="glass-card flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-wider opacity-60 mb-1">Ingresos del Mes</p>
            <h2 className="text-4xl font-bold">₡450,000</h2>
            <p className="text-sm flex items-center gap-1 mt-2 text-green-400">
              <ArrowUpRight size={16} /> +12% vs mes anterior
            </p>
          </div>
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-green-500/10 text-green-400">
            <DollarSign size={28} />
          </div>
        </div>

        {/* KPI: Atletas Activos */}
        <div className="glass-card flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-wider opacity-60 mb-1">Atletas Activos</p>
            <h2 className="text-4xl font-bold">124</h2>
            <p className="text-sm flex items-center gap-1 mt-2 text-green-400">
              <ArrowUpRight size={16} /> +5 nuevos esta semana
            </p>
          </div>
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-400">
            <Users size={28} />
          </div>
        </div>

        {/* KPI: Morosidad */}
        <div className="glass-card flex items-center justify-between border-l-4" style={{ borderLeftColor: 'var(--error)' }}>
          <div>
            <p className="text-sm uppercase tracking-wider opacity-60 mb-1">Atletas Morosos</p>
            <h2 className="text-4xl font-bold text-red-400">8</h2>
            <p className="text-sm flex items-center gap-1 mt-2 text-red-400">
              <ArrowDownRight size={16} /> Requiere atención
            </p>
          </div>
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-red-500/10 text-red-400">
            <AlertCircle size={28} />
          </div>
        </div>
      </div>

      {/* Quick Actions / Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Atletas Recientes */}
        <div className="glass-card">
          <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--primary)' }}>Últimos Registros</h3>
          <div className="space-y-4">
            <p className="text-sm opacity-70">Aquí se mostrarán los últimos atletas en registrarse...</p>
            {/* Aquí luego inyectamos datos de la base de datos */}
            <div className="p-3 rounded-lg bg-black/20 flex justify-between items-center border border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs">MA</div>
                <div>
                  <p className="font-semibold">María Alfaro</p>
                  <p className="text-xs opacity-60">Triatlón</p>
                </div>
              </div>
              <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">Activa</span>
            </div>
          </div>
        </div>

        {/* Notificaciones del Sistema */}
        <div className="glass-card">
          <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--primary)' }}>Alertas del Sistema</h3>
          <ul className="space-y-3">
            <li className="flex gap-3 text-sm">
              <AlertCircle size={18} className="text-yellow-400 flex-shrink-0" />
              <span>Tienes <strong>3 comprobantes</strong> SINPE pendientes de revisión.</span>
            </li>
            <li className="flex gap-3 text-sm">
              <AlertCircle size={18} className="text-yellow-400 flex-shrink-0" />
              <span>Hay <strong>2 atletas</strong> esperando aprobación de ingreso.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
