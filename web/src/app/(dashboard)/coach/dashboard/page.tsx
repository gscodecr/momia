'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Clock, Search, Users, UserCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CoachDashboard() {
  const router = useRouter();
  const [athletesData, setAthletesData] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'MY_ATHLETES' | 'ALL'>('MY_ATHLETES');

  useEffect(() => {
    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      // Fetch user info, athletes and workouts
      const [resMe, resAthletes, resWorkouts] = await Promise.all([
        fetch(process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001" + '/auth/me', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001" + '/workouts/athletes', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001" + '/workouts/', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (!resAthletes.ok || !resWorkouts.ok || !resMe.ok) {
        throw new Error('Error al cargar datos');
      }

      const me = await resMe.json();
      const athletes = await resAthletes.json();
      const workouts = await resWorkouts.json();
      
      setCurrentUserId(me.id);

      // Determine current week bounds (Monday to Sunday)
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const day = now.getDay();
      const diffMon = now.getDate() - day + (day === 0 ? -6 : 1);
      
      const startOfWeek = new Date(now.setDate(diffMon));
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      // Process each athlete
      const processedAthletes = athletes.map((athlete: any) => {
        // All workouts for this athlete
        const athWorkouts = workouts.filter((w: any) => w.athlete_id === athlete.id);
        
        // Workouts strictly for the current week
        const weekWorkouts = athWorkouts.filter((w: any) => {
          const d = new Date(w.scheduled_date);
          return d >= startOfWeek && d <= endOfWeek;
        });

        const totalWeek = weekWorkouts.length;
        const completedWeek = weekWorkouts.filter((w: any) => w.is_completed).length;
        
        let compliance = 0;
        let colorClass = 'bg-zinc-500';
        let textClass = 'text-zinc-400';

        if (totalWeek > 0) {
          compliance = Math.round((completedWeek / totalWeek) * 100);
          if (compliance === 100) {
            colorClass = 'bg-green-500';
            textClass = 'text-green-400';
          } else if (compliance > 0) {
            colorClass = 'bg-yellow-500';
            textClass = 'text-yellow-400';
          } else {
            colorClass = 'bg-red-500';
            textClass = 'text-red-400';
          }
        }

        const completedWorkouts = athWorkouts.filter((w: any) => w.is_completed);
        completedWorkouts.sort((a: any, b: any) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime());
        const lastWorkout = completedWorkouts.length > 0 ? new Date(completedWorkouts[0].scheduled_date) : null;

        return {
          ...athlete,
          totalWeek,
          completedWeek,
          compliance,
          colorClass,
          textClass,
          lastWorkout
        };
      });

      // Sort by compliance (worst first)
      processedAthletes.sort((a: any, b: any) => a.compliance - b.compliance);
      setAthletesData(processedAthletes);

    } catch (err) {
      toast.error('Error al cargar panel');
    } finally {
      setLoading(false);
    }
  };

  const formatLastWorkout = (date: Date | null) => {
    if (!date) return 'Sin actividad reciente';
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoy';
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString();
  };

  // Filter Logic
  const filteredAthletes = athletesData.filter(athlete => {
    // 1. Search Query
    const searchStr = `${athlete.first_name} ${athlete.last_name} ${athlete.email}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchQuery.toLowerCase());
    
    // 2. Tab Filter
    let matchesTab = true;
    if (activeTab === 'MY_ATHLETES') {
      matchesTab = athlete.athlete_profile?.coach_id === currentUserId;
    }

    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-black/20 p-6 rounded-2xl border border-white/5 mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>Mis Atletas</h1>
          <p className="opacity-70 mt-1">Monitorea el cumplimiento semanal y la actividad reciente del equipo.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
        <div className="flex gap-4 border-b border-white/10 w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('MY_ATHLETES')} 
            className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'MY_ATHLETES' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent opacity-60 hover:opacity-100'}`}
          >
            <UserCheck size={18} /> Mis Atletas
          </button>
          <button 
            onClick={() => setActiveTab('ALL')} 
            className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'ALL' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent opacity-60 hover:opacity-100'}`}
          >
            <Users size={18} /> Todos los Atletas
          </button>
        </div>
        
        <div className="relative w-full md:w-64">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-50" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o correo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 focus:border-[var(--primary)] focus:outline-none transition-colors text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center opacity-50 animate-pulse">
          Analizando datos de rendimiento...
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr>
                  <th className="p-4 font-semibold border-b border-white/10 opacity-70 text-sm">Atleta</th>
                  <th className="p-4 font-semibold border-b border-white/10 opacity-70 text-sm">Cumplimiento Semanal</th>
                  <th className="p-4 font-semibold border-b border-white/10 opacity-70 text-sm">Última Actividad</th>
                  <th className="p-4 font-semibold border-b border-white/10 opacity-70 text-sm text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredAthletes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-12 text-center opacity-70">
                      <Activity size={48} className="mx-auto mb-4 opacity-30" />
                      <p className="font-semibold text-lg">No se encontraron atletas</p>
                      <p className="text-sm">Intenta ajustar tu búsqueda o filtros.</p>
                    </td>
                  </tr>
                ) : (
                  filteredAthletes.map((athlete) => (
                    <tr key={athlete.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-4">
                          {athlete.avatar_url ? (
                            <img src={`${process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001" + ""}${athlete.avatar_url}`} alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-white/10 shadow-lg" />
                          ) : (
                            <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg border border-white/10" style={{ backgroundColor: 'var(--primary)', color: 'white' }}>
                              {athlete.first_name[0]}{athlete.last_name[0]}
                            </div>
                          )}
                          <div>
                            <p className="font-bold leading-tight group-hover:text-[var(--primary)] transition-colors">{athlete.first_name} {athlete.last_name}</p>
                            <p className="text-xs opacity-60 mt-0.5">{athlete.email}</p>
                            {activeTab === 'ALL' && (
                              <span className="text-[9px] px-1.5 py-0.5 mt-1 inline-block rounded bg-white/10 opacity-70 uppercase tracking-wider">
                                {!athlete.athlete_profile?.coach_id ? 'Sin Entrenador' : athlete.athlete_profile.coach_id !== currentUserId ? `Coach: ${athlete.athlete_profile.coach?.first_name || 'Otro'}` : 'Tu Atleta'}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="p-4 align-middle w-64">
                        <div className="flex justify-between text-xs opacity-70 mb-1">
                          <span className={`font-bold ${athlete.textClass}`}>{athlete.compliance}%</span>
                          <span>{athlete.completedWeek} / {athlete.totalWeek} ses</span>
                        </div>
                        <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden shadow-inner">
                          <div 
                            className={`h-full rounded-full transition-all duration-1000 ${athlete.colorClass}`}
                            style={{ width: `${athlete.compliance}%` }}
                          ></div>
                        </div>
                      </td>
                      
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="opacity-50" />
                          <span className="text-sm font-medium">{formatLastWorkout(athlete.lastWorkout)}</span>
                        </div>
                      </td>
                      
                      <td className="p-4 align-middle text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => router.push(`/coach/athlete/${athlete.id}`)}
                            className="px-4 py-2 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 transition-colors text-xs font-bold"
                          >
                            Expediente
                          </button>
                          <button 
                            onClick={() => router.push(`/coach/planner?athleteId=${athlete.id}`)}
                            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-xs font-bold"
                          >
                            Planificador
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
