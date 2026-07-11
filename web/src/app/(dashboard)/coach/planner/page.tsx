'use client';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Edit2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function CoachPlanner() {
  const [currentWeek, setCurrentWeek] = useState('Semana Actual');
  const [athletes, setAthletes] = useState<any[]>([]);
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

  const days = [
    { name: 'Lunes', idx: 0 },
    { name: 'Martes', idx: 1 },
    { name: 'Miércoles', idx: 2 },
    { name: 'Jueves', idx: 3 },
    { name: 'Viernes', idx: 4 },
    { name: 'Sábado', idx: 5 },
    { name: 'Domingo', idx: 6 }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
      const [resAthletes, resWorkouts] = await Promise.all([
        fetch('http://127.0.0.1:8001/workouts/athletes', { headers }),
        fetch('http://127.0.0.1:8001/workouts/', { headers })
      ]);
      
      if (resAthletes.ok) setAthletes(await resAthletes.json());
      if (resWorkouts.ok) setWorkouts(await resWorkouts.json());
    } catch (err) {
      toast.error('Error al cargar datos');
    }
  };

  const openCreateModal = (athleteId: number, dayIdx: number) => {
    const date = new Date();
    date.setDate(date.getDate() - date.getDay() + dayIdx + 1); // Logic for current week's day
    
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
        ? 'http://127.0.0.1:8001/workouts/' 
        : `http://127.0.0.1:8001/workouts/${editingWorkoutId}`;
        
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
      const res = await fetch(`http://127.0.0.1:8001/workouts/${editingWorkoutId}`, {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>Planificador de Rutinas</h1>
          <p className="opacity-70 mt-1">Sincronizado con Base de Datos</p>
        </div>
        <div className="flex items-center justify-between md:justify-start gap-4 bg-white/5 rounded-lg p-2 border border-white/10 w-full md:w-auto">
          <button className="p-2 hover:bg-white/10 rounded-md transition-colors"><ChevronLeft size={20} /></button>
          <span className="font-semibold px-2 whitespace-nowrap">{currentWeek}</span>
          <button className="p-2 hover:bg-white/10 rounded-md transition-colors"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto pb-4">
          <table className="w-full text-left min-w-[1000px]">
            <thead>
              <tr>
                <th className="p-4 font-semibold border-b border-white/10 w-48 sticky left-0 bg-[#09090b] z-10 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">Atleta</th>
                {days.map(day => (
                  <th key={day.name} className="p-4 font-semibold border-b border-white/10 text-center">
                    <div>{day.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {athletes.map(athlete => (
                <tr key={athlete.id} className="border-b border-white/5">
                  <td className="p-4 font-semibold border-r border-white/5 sticky left-0 bg-[#09090b] z-10 shadow-[2px_0_5px_rgba(0,0,0,0.5)]">
                    {athlete.first_name} {athlete.last_name}
                  </td>
                  {days.map(day => {
                    const dayWorkouts = workouts.filter(w => {
                      const wDate = new Date(w.scheduled_date);
                      const jsDay = wDate.getDay();
                      const wDayIdx = jsDay === 0 ? 6 : jsDay - 1; 
                      return w.athlete_id === athlete.id && wDayIdx === day.idx;
                    });

                    return (
                      <td key={day.name} className="p-2 border-r border-white/5 last:border-r-0 min-w-[120px] align-top">
                        {dayWorkouts.map(w => (
                           <div 
                            key={w.id} 
                            onClick={() => openEditModal(w)}
                            className="bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-lg p-2 mb-2 hover:bg-[var(--primary)]/20 transition-colors cursor-pointer group relative"
                           >
                             <div className="flex justify-between items-center mb-1">
                               <span className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">{w.discipline}</span>
                               <Edit2 size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                             </div>
                             <div className="text-xs font-semibold truncate" title={w.title}>{w.title}</div>
                             {w.event_id && (
                               <div className="mt-1 flex items-center gap-1 text-[10px] text-blue-400 bg-blue-400/10 w-max px-1.5 py-0.5 rounded">
                                 <CheckCircle2 size={10} /> De Evento
                               </div>
                             )}
                           </div>
                        ))}
                        <div onClick={() => openCreateModal(athlete.id, day.idx)} className="h-8 rounded-lg bg-white/5 border border-white/5 border-dashed flex items-center justify-center opacity-30 hover:opacity-100 cursor-pointer transition-opacity text-xs mt-2">
                          <Plus size={14} /> Asignar
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {athletes.length === 0 && (
                <tr><td colSpan={8} className="p-8 text-center opacity-50">No hay atletas registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--primary)]">
                {modalMode === 'create' ? 'Asignar Nueva Rutina' : 'Editar Rutina'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs opacity-70 mb-1 block">Disciplina</label>
                <select value={discipline} onChange={e => setDiscipline(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm focus:border-[var(--primary)] outline-none capitalize">
                  <option value="ciclismo">Ciclismo</option>
                  <option value="natacion">Natación</option>
                  <option value="atletismo">Atletismo</option>
                  <option value="fuerza">Fuerza / Gimnasio</option>
                  <option value="triatlon">Triatlón</option>
                  <option value="otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="text-xs opacity-70 mb-1 block">Título</label>
                <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej. Fondo 100km" className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm focus:border-[var(--primary)] outline-none" />
              </div>

              <div>
                <label className="text-xs opacity-70 mb-1 block">Descripción detallada</label>
                <textarea required value={description} onChange={e => setDescription(e.target.value)} placeholder="Intervalos, zonas de esfuerzo, etc." className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm focus:border-[var(--primary)] outline-none h-32 resize-none" />
              </div>

              <div className="pt-4 flex justify-between items-center">
                {modalMode === 'edit' ? (
                  showDeleteConfirm ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-400 font-medium">¿Confirmar?</span>
                      <button type="button" onClick={handleDelete} className="px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors text-xs font-bold">
                        Sí, borrar
                      </button>
                      <button type="button" onClick={() => setShowDeleteConfirm(false)} className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors text-xs">
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setShowDeleteConfirm(true)} className="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors flex items-center gap-2 text-sm">
                      <Trash2 size={16} /> Eliminar
                    </button>
                  )
                ) : (
                  <div></div>
                )}
                
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors font-semibold text-sm">
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSubmitting} className="btn-primary text-sm">
                    {isSubmitting ? 'Guardando...' : 'Guardar Rutina'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
