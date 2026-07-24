'use client';
import { useState, useEffect } from 'react';
import { Loader2, Users, DollarSign, AlertCircle, ArrowUpRight, ArrowDownRight, X } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showMorososModal, setShowMorososModal] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001") + '/admin/dashboard-stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="h-[50vh] flex flex-col items-center justify-center text-zinc-500">
        <Loader2 className="animate-spin w-8 h-8 mb-4 text-[var(--primary)]" />
        <p>Cargando métricas globales...</p>
      </div>
    );
  }

  // Format currency
  const formatter = new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 0
  });

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
            <h2 className="text-4xl font-bold">{formatter.format(stats?.ingresos_mes || 0)}</h2>
            <p className="text-sm flex items-center gap-1 mt-2 text-green-400">
              <ArrowUpRight size={16} /> En tiempo real
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
            <h2 className="text-4xl font-bold">{stats?.atletas_activos || 0}</h2>
            <p className="text-sm flex items-center gap-1 mt-2 text-green-400">
              <ArrowUpRight size={16} /> Suscritos
            </p>
          </div>
          <div className="w-14 h-14 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-400">
            <Users size={28} />
          </div>
        </div>

        {/* KPI: Morosidad */}
        <div 
          onClick={() => stats?.atletas_morosos > 0 && setShowMorososModal(true)}
          className={`glass-card flex items-center justify-between border-l-4 ${stats?.atletas_morosos > 0 ? 'cursor-pointer hover:bg-white/5 transition-colors' : ''}`} 
          style={{ borderLeftColor: 'var(--error)' }}
        >
          <div>
            <p className="text-sm uppercase tracking-wider opacity-60 mb-1">Atletas Morosos</p>
            <h2 className="text-4xl font-bold text-red-400">{stats?.atletas_morosos || 0}</h2>
            <p className="text-sm flex items-center gap-1 mt-2 text-red-400">
              <ArrowDownRight size={16} /> {stats?.atletas_morosos > 0 ? "Requiere atención" : "Todo al día"}
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
            {stats?.ultimos_registros?.length === 0 ? (
              <p className="text-sm opacity-70">No hay atletas registrados aún.</p>
            ) : (
              stats.ultimos_registros.map((atleta: any) => (
                <div key={atleta.id} className="p-3 rounded-lg bg-black/20 flex justify-between items-center border border-white/5">
                  <div className="flex items-center gap-3">
                    {atleta.avatar_url ? (
                      <img src={atleta.avatar_url.startsWith('http') ? atleta.avatar_url : `${atleta.avatar_url?.startsWith(\"http\") ? \"\" : (process.env.NEXT_PUBLIC_API_URL || \"http://127.0.0.1:8001\")}${atleta.avatar_url}`} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs">
                        {atleta.first_name?.[0]}{atleta.last_name?.[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{atleta.first_name} {atleta.last_name}</p>
                      <p className="text-xs opacity-60 capitalize">{atleta.discipline}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${atleta.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {atleta.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notificaciones del Sistema */}
        <div className="glass-card">
          <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--primary)' }}>Alertas del Sistema</h3>
          <ul className="space-y-3">
            {stats?.alertas?.comprobantes_pendientes === 0 && stats?.alertas?.atletas_por_aprobar === 0 && (
              <li className="text-sm opacity-70">No hay alertas pendientes en este momento.</li>
            )}
            
            {stats?.alertas?.comprobantes_pendientes > 0 && (
              <li className="flex gap-3 text-sm">
                <AlertCircle size={18} className="text-yellow-400 flex-shrink-0" />
                <span>Tienes <strong>{stats.alertas.comprobantes_pendientes} comprobantes</strong> SINPE pendientes de revisión.</span>
              </li>
            )}
            
            {stats?.alertas?.atletas_por_aprobar > 0 && (
              <li className="flex gap-3 text-sm">
                <AlertCircle size={18} className="text-yellow-400 flex-shrink-0" />
                <span>Hay <strong>{stats.alertas.atletas_por_aprobar} atletas</strong> esperando aprobación de ingreso.</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Morosos Modal */}
      {showMorososModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card w-full max-w-md max-h-[80vh] flex flex-col relative border border-red-500/30">
            <button 
              onClick={() => setShowMorososModal(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-2 text-red-400 flex items-center gap-2">
              <AlertCircle size={20} /> 
              Atletas Morosos
            </h3>
            <p className="text-sm opacity-70 mb-4">La fecha de cobro de estos atletas ha expirado.</p>
            
            <div className="overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {stats?.morosos_list?.map((atleta: any) => (
                <div key={atleta.id} className="p-3 rounded-lg bg-black/30 border border-red-500/10 flex items-center gap-3">
                  {atleta.avatar_url ? (
                    <img src={atleta.avatar_url.startsWith('http') ? atleta.avatar_url : `${atleta.avatar_url?.startsWith(\"http\") ? \"\" : (process.env.NEXT_PUBLIC_API_URL || \"http://127.0.0.1:8001\")}${atleta.avatar_url}`} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-red-950 flex items-center justify-center text-xs text-red-400 font-bold">
                      {atleta.first_name?.[0]}{atleta.last_name?.[0]}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{atleta.first_name} {atleta.last_name}</p>
                    <p className="text-xs text-red-400">
                      Vencido: {atleta.next_payment_date ? new Date(atleta.next_payment_date).toLocaleDateString('es-CR') : 'Desconocida'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
