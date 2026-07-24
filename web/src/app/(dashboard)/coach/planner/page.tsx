'use client';
import { useState, useEffect, Suspense } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit2, CheckCircle2, UserCircle, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';

function CoachPlannerContent() {
  const searchParams = useSearchParams();
  const initialAthleteId = searchParams.get('athleteId');
  
  const [currentWeek, setCurrentWeek] = useState('Semana Actual');
  const [athletes, setAthletes] = useState<any[]>([]);
  const [athleteSearchQuery, setAthleteSearchQuery] = useState('');
  const [workouts, setWorkouts] = useState<any[]>([]);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
  // Form State
  const [editingWorkoutId, setEditingWorkoutId] = useState<number | null>(null);
  const [selectedAthleteId, setSelectedAthleteId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discipline, setDiscipline] = useState('ciclismo');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.getFullYear(), d.getMonth(), diff);
  });

  const getWeekDays = () => {
    const dArr = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      dArr.push({
        date: d,
        name: d.toLocaleDateString('es-ES', { weekday: 'long' }),
        dayNumber: d.getDate(),
        fullDateStr: d.toISOString().split('T')[0],
        idx: i
      });
    }
    return dArr;
  };

  const weekDays = getWeekDays();

  const prevWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  const nextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(newStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  const endOfWeek = new Date(currentWeekStart);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  const currentWeekText = `${currentWeekStart.getDate()} ${currentWeekStart.toLocaleDateString('es-ES', {month:'short'})} - ${endOfWeek.getDate()} ${endOfWeek.toLocaleDateString('es-ES', {month:'short'})} ${endOfWeek.getFullYear()}`;

  useEffect(() => {
    fetchData();
  }, []);
  
  // Sync if URL param changes
  useEffect(() => {
    const athleteId = searchParams.get('athleteId');
    if (athleteId && athletes.length > 0) {
      const athlete = athletes.find(a => a.id.toString() === athleteId);
      if (athlete) {
        setAthleteSearchQuery(`${athlete.first_name} ${athlete.last_name}`);
      }
    }
  }, [searchParams, athletes]);

  const fetchData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
      const [resAthletes, resWorkouts] = await Promise.all([
        fetch(process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001" + '/workouts/athletes', { headers }),
        fetch(process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001" + '/workouts/', { headers })
      ]);
      
      if (resAthletes.ok) {
        const athletesData = await resAthletes.json();
        setAthletes(athletesData);
      }
      if (resWorkouts.ok) setWorkouts(await resWorkouts.json());
    } catch (err) {
      toast.error('Error al cargar datos');
    }
  };

  const openCreateModal = (athleteId: number, dayIdx: number) => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + dayIdx); 
    
    setSelectedAthleteId(athleteId);
    setSelectedDate(date);
    setTitle('');
    setDescription('');
    setDiscipline('ciclismo');
    setModalMode('create');
    setShowDeleteConfirm(false);
    setShowModal(true);
  };

  const openEditModal = (workout: any) => {
    setEditingWorkoutId(workout.id);
    setSelectedAthleteId(workout.athlete_id);
    setSelectedDate(new Date(workout.scheduled_date));
    setTitle(workout.title);
    setDescription(workout.description);
    setDiscipline(workout.discipline || 'ciclismo');
    setModalMode('edit');
    setShowDeleteConfirm(false);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAthleteId || !selectedDate) return;
    setIsSubmitting(true);

    const payload = {
      title,
      description,
      scheduled_date: selectedDate.toISOString(),
      discipline,
      athlete_id: selectedAthleteId
    };

    try {
      const url = modalMode === 'create' 
        ? process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001" + '/workouts/' 
        : `${process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001" + ""}/workouts/${editingWorkoutId}`;
        
      const res = await fetch(url, {
        method: modalMode === 'create' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        toast.success(modalMode === 'create' ? 'Rutina asignada' : 'Rutina actualizada');
        setShowModal(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Error al guardar');
      }
    } catch (err) {
      toast.error('Error de red');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingWorkoutId) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001" + ""}/workouts/${editingWorkoutId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        toast.success('Rutina eliminada');
        setShowModal(false);
        fetchData();
      } else {
        toast.error('Error al eliminar');
      }
    } catch (err) {
      toast.error('Error de red');
    }
  };
  
  const displayedAthletes = athleteSearchQuery.trim() === '' 
    ? athletes 
    : athletes.filter(a => {
        const searchStr = `${a.first_name} ${a.last_name} ${a.email}`.toLowerCase();
        return searchStr.includes(athleteSearchQuery.toLowerCase());
      });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8 bg-black/20 p-6 rounded-2xl border border-white/5">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>Planificador de Rutinas</h1>
          <p className="opacity-70 mt-1">Sincronizado con Base de Datos</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="relative w-full md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-50" />
            <input 
              type="text" 
              placeholder="Buscar atleta por nombre..."
              value={athleteSearchQuery}
              onChange={(e) => setAthleteSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/30 border border-white/10 focus:border-[var(--primary)] focus:outline-none transition-colors text-sm"
            />
          </div>

          <div className="flex items-center justify-between md:justify-start gap-4 bg-white/5 rounded-lg p-2 border border-white/10 w-full md:w-auto">
            <button onClick={prevWeek} className="p-2 hover:bg-white/10 rounded-md transition-colors"><ChevronLeft size={20} /></button>
            <span className="font-semibold px-2 whitespace-nowrap">{currentWeekText}</span>
            <button onClick={nextWeek} className="p-2 hover:bg-white/10 rounded-md transition-colors"><ChevronRight size={20} /></button>
          </div>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto pb-4">
          <table className="w-full text-left min-w-[1000px]">
            <thead>
              <tr>
                <th className="p-4 font-semibold border-b border-white/10 w-32 md:w-40 sticky left-0 bg-[#09090b] z-10 shadow-[2px_0_5px_rgba(0,0,0,0.5)] text-center">Atleta</th>
                {weekDays.map(day => {
                  const isToday = day.fullDateStr === new Date().toISOString().split('T')[0];
                  return (
                    <th key={day.name} className="p-4 font-semibold border-b border-white/10 text-center min-w-[140px]">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-xs capitalize tracking-wider opacity-60">{day.name}</span>
                        <span className={`text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full ${isToday ? 'bg-[var(--primary)] text-white' : ''}`}>
                          {day.dayNumber}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {displayedAthletes.map(athlete => (
                <tr key={athlete.id} className="border-b border-white/5">
                  <td className="p-4 border-r border-white/5 sticky left-0 bg-[#09090b] z-10 shadow-[2px_0_5px_rgba(0,0,0,0.5)] align-middle">
                    <div className="flex flex-col items-center justify-center gap-2 text-center py-2">
                      {athlete.avatar_url ? (
                         <img src={`${process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001" + ""}${athlete.avatar_url}`} alt="Avatar" className="w-12 h-12 rounded-full object-cover border border-white/10 shadow-sm" />
                      ) : (
                         <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/50 shadow-sm">
                           <UserCircle size={28} />
                         </div>
                      )}
                      <div className="w-full px-2">
                        <p className="font-bold text-sm leading-tight break-words">{athlete.first_name} {athlete.last_name}</p>
                        <p className="text-[10px] opacity-50 font-mono mt-1">ID: {athlete.id}</p>
                      </div>
                    </div>
                  </td>
                  {weekDays.map(day => {
                    const athleteWorkoutsForDay = workouts.filter(w => 
                      w.athlete_id === athlete.id && w.scheduled_date.startsWith(day.fullDateStr)
                    );
                    const isPast = new Date(day.fullDateStr) < new Date(new Date().setHours(0,0,0,0));

                    return (
                      <td key={day.name} className={`p-2 border-r border-b border-white/5 align-top min-w-[140px] ${isPast ? 'bg-black/10' : ''}`}>
                        {athleteWorkoutsForDay.map(w => (
                           <div 
                            key={w.id} 
                            onClick={() => openEditModal(w)}
                            className={`bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-lg p-2 mb-2 hover:bg-[var(--primary)]/20 transition-colors cursor-pointer group relative ${w.is_completed ? 'opacity-50' : ''}`}
                           >
                             <div className="flex justify-between items-center mb-1">
                               <span className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">{w.discipline}</span>
                               <Edit2 size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                             </div>
                             <div className={`text-xs font-semibold truncate ${w.is_completed ? 'line-through' : ''}`} title={w.title}>{w.title}</div>
                             {w.event_id && (
                               <div className="mt-1 flex items-center gap-1 text-[10px] text-blue-400 bg-blue-400/10 w-max px-1.5 py-0.5 rounded">
                                 <CheckCircle2 size={10} /> De Evento
                               </div>
                             )}
                           </div>
                        ))}
                        <div onClick={() => {
                            const clickedDate = new Date(day.date);
                            setSelectedDate(clickedDate);
                            openCreateModal(athlete.id, day.idx);
                        }} className="h-8 rounded-lg bg-white/5 border border-white/5 border-dashed flex items-center justify-center opacity-30 hover:opacity-100 cursor-pointer transition-opacity text-xs mt-2">
                          <Plus size={14} /> Asignar
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
              <h2 className="text-xl font-bold">{modalMode === 'create' ? 'Asignar Nueva Rutina' : 'Editar Rutina'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold opacity-70">Fecha Programada</label>
                  <input type="date" required value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''} onChange={(e) => setSelectedDate(new Date(e.target.value))} className="w-full p-3 rounded-xl bg-black/40 border border-white/10 focus:border-[var(--primary)] focus:outline-none transition-colors" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold opacity-70">Disciplina</label>
                  <select value={discipline} onChange={(e) => setDiscipline(e.target.value)} className="w-full p-3 rounded-xl bg-black/40 border border-white/10 focus:border-[var(--primary)] focus:outline-none transition-colors">
                    <option value="ciclismo">Ciclismo</option>
                    <option value="natacion">Natación</option>
                    <option value="carrera">Carrera</option>
                    <option value="fuerza">Fuerza</option>
                    <option value="movilidad">Movilidad</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold opacity-70">Título</label>
                <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Z2 Recovery 45min" className="w-full p-3 rounded-xl bg-black/40 border border-white/10 focus:border-[var(--primary)] focus:outline-none transition-colors" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold opacity-70">Descripción / Detalles</label>
                <textarea required value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Bloques de trabajo, TSS esperado..." className="w-full p-3 rounded-xl bg-black/40 border border-white/10 focus:border-[var(--primary)] focus:outline-none transition-colors h-32" />
              </div>

              <div className="pt-4 flex flex-col md:flex-row justify-between gap-4 border-t border-white/10">
                {modalMode === 'edit' ? (
                  <button type="button" onClick={() => setShowDeleteConfirm(true)} className="text-red-400 hover:bg-red-400/10 hover:text-red-300 text-sm font-semibold py-3 px-4 flex justify-center items-center gap-2 rounded-xl transition-colors order-3 md:order-1">
                    <Trash2 size={16} /> Eliminar
                  </button>
                ) : <div className="hidden md:block order-3 md:order-1"></div>}
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto order-1 md:order-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-3 md:py-2 rounded-xl bg-white/5 md:bg-transparent hover:bg-white/10 transition-colors font-semibold w-full md:w-auto text-center order-2 md:order-1">Cancelar</button>
                  <button type="submit" disabled={isSubmitting} className="btn-primary flex items-center justify-center gap-2 py-3 md:py-2 w-full md:w-auto order-1 md:order-2">
                    {isSubmitting ? 'Guardando...' : (modalMode === 'create' ? <><Plus size={18}/> Asignar</> : 'Guardar Cambios')}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl p-6 text-center">
             <Trash2 size={48} className="mx-auto text-red-500 mb-4 opacity-80" />
             <h3 className="text-xl font-bold mb-2">¿Eliminar esta rutina?</h3>
             <p className="text-sm opacity-70 mb-6">Esta acción no se puede deshacer.</p>
             <div className="flex gap-3 justify-center">
               <button onClick={() => setShowDeleteConfirm(false)} className="px-6 py-2 rounded-xl hover:bg-white/10 font-semibold transition-colors">Cancelar</button>
               <button onClick={handleDelete} className="px-6 py-2 rounded-xl bg-red-500 hover:bg-red-600 font-bold transition-colors text-white">Sí, eliminar</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CoachPlanner() {
  return (
    <Suspense fallback={<div className="p-8 text-center opacity-50">Cargando planificador...</div>}>
      <CoachPlannerContent />
    </Suspense>
  );
}
