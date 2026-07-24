'use client';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, CheckCircle2, Circle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AthleteWorkouts() {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkout, setSelectedWorkout] = useState<any | null>(null);

  // Date Logic for Week Navigation
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // 0 = Sun, 1 = Mon...
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.getFullYear(), d.getMonth(), diff);
  });

  const getWeekDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      days.push({
        date: d,
        name: d.toLocaleDateString('es-ES', { weekday: 'short' }),
        dayNumber: d.getDate(),
        fullDateStr: d.toISOString().split('T')[0] // For comparison
      });
    }
    return days;
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

  const formatWeekTitle = () => {
    const end = new Date(currentWeekStart);
    end.setDate(end.getDate() + 6);
    const startStr = currentWeekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    const endStr = end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001") + '/workouts/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        // Ordenar por fecha, más próximos primero
        data.sort((a: any, b: any) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
        setWorkouts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleComplete = async (workout: any) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001"}/workouts/${workout.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          is_completed: !workout.is_completed
        })
      });
      if (res.ok) {
        toast.success(workout.is_completed ? 'Entrenamiento marcado como pendiente' : '¡Entrenamiento completado!');
        fetchWorkouts();
      } else {
        toast.error('Error al actualizar estado');
      }
    } catch (err) {
      toast.error('Error de red');
    }
  };

  if (loading) {
    return <div className="p-12 text-center opacity-50 animate-pulse">Cargando tus entrenamientos...</div>;
  }

  // Helper to filter workouts for a specific day
  const getWorkoutsForDay = (dateStr: string) => {
    return workouts.filter(w => w.scheduled_date.startsWith(dateStr));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>Mi Plan de Entrenamiento</h1>
          <p className="opacity-70 mt-1">Sigue tus rutinas y marca tu progreso diario.</p>
        </div>
        <div className="flex items-center justify-between md:justify-start gap-4 bg-white/5 rounded-lg p-2 border border-white/10 w-full md:w-auto">
          <button onClick={prevWeek} className="p-2 hover:bg-white/10 rounded-md transition-colors"><ChevronLeft size={20} /></button>
          <span className="font-semibold px-2 whitespace-nowrap capitalize">{formatWeekTitle()}</span>
          <button onClick={nextWeek} className="p-2 hover:bg-white/10 rounded-md transition-colors"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto pb-4 snap-x snap-mandatory hide-scrollbar">
          <div className="flex w-max min-w-full">
            {weekDays.map(day => {
              const isToday = day.fullDateStr === new Date().toISOString().split('T')[0];
              const dayWorkouts = getWorkoutsForDay(day.fullDateStr);
              const isPast = new Date(day.fullDateStr) < new Date(new Date().setHours(0,0,0,0));

              return (
                <div key={day.fullDateStr} className={`w-[280px] md:w-auto md:flex-1 shrink-0 snap-center border-r border-white/5 last:border-r-0 ${isPast ? 'bg-black/10' : ''}`}>
                  <div className="p-4 border-b border-white/10 text-center relative h-[84px] flex flex-col justify-center">
                    <span className="text-xs uppercase tracking-wider opacity-60 mb-1">{day.name}</span>
                    <span className={`text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full mx-auto ${isToday ? 'bg-[var(--primary)] text-white shadow-[0_0_10px_var(--primary)]' : ''}`}>
                      {day.dayNumber}
                    </span>
                  </div>
                  <div className="p-2 min-h-[200px]">
                    {dayWorkouts.map(w => (
                       <div 
                        key={w.id} 
                        onClick={() => setSelectedWorkout(w)}
                        className={`border rounded-lg p-3 mb-3 transition-colors cursor-pointer group relative ${
                          w.is_completed 
                            ? 'bg-green-500/10 border-green-500/30 opacity-80' 
                            : 'bg-[var(--primary)]/10 border-[var(--primary)]/30 hover:bg-[var(--primary)]/20 shadow-sm'
                        }`}
                       >
                         <div className="flex justify-between items-center mb-2">
                           <span className={`text-[10px] font-bold uppercase tracking-wider ${w.is_completed ? 'text-green-400' : 'text-[var(--primary)]'}`}>
                             {w.discipline}
                           </span>
                           {w.is_completed && <CheckCircle2 size={12} className="text-green-400" />}
                         </div>
                         <div className={`text-sm font-semibold leading-tight line-clamp-2 ${w.is_completed ? 'line-through opacity-70' : ''}`} title={w.title}>
                           {w.title}
                         </div>
                         
                         {w.event_id && (
                           <div className="mt-2 flex items-center gap-1 text-[10px] text-blue-400 bg-blue-400/10 w-max px-1.5 py-0.5 rounded-full border border-blue-500/20">
                             De Evento
                           </div>
                         )}
                         
                         <div className="flex items-center gap-1.5 text-xs opacity-60 mt-3">
                           <Clock size={12} />
                           {new Date(w.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                         </div>
                       </div>
                    ))}
                    {dayWorkouts.length === 0 && (
                      <div className="h-full min-h-[150px] w-full flex items-center justify-center opacity-0 hover:opacity-30 transition-opacity">
                        <span className="text-[10px] uppercase tracking-wider font-semibold border border-dashed border-white/20 px-3 py-1.5 rounded-full">Día Libre</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Workout Detail Modal */}
      {selectedWorkout && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-start mb-6 p-6 pb-0">
              <div className="pr-8">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2 py-1 bg-[var(--primary)]/20 text-[var(--primary)] rounded-full capitalize font-semibold border border-[var(--primary)]/30">
                    {selectedWorkout.discipline}
                  </span>
                  {selectedWorkout.tss_score && (
                    <span className="text-xs px-2 py-1 bg-white/10 rounded-full font-semibold border border-white/10">
                      TSS: {selectedWorkout.tss_score}
                    </span>
                  )}
                </div>
                <h2 className="text-2xl font-bold text-[var(--primary)] leading-tight">
                  {selectedWorkout.title}
                </h2>
                <div className="flex items-center gap-1.5 text-sm opacity-70 mt-2">
                  <Clock size={16} />
                  <span>
                    {new Date(selectedWorkout.scheduled_date).toLocaleString('en-GB', {
                      timeZone: 'America/Costa_Rica',
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    }).replace(',', '')}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedWorkout(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors shrink-0">
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="bg-black/20 rounded-xl p-4 border border-white/5 mb-6">
                <h3 className="text-sm font-semibold opacity-70 mb-2">Instrucciones del Plan</h3>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {selectedWorkout.description}
                </p>
              </div>

              {selectedWorkout.event_id && (
                <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20 mb-6 flex items-start gap-3">
                  <CalendarIcon size={20} className="text-blue-400 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-blue-400">Parte de un Evento</h3>
                    <p className="text-xs opacity-80 mt-1">Esta rutina fue asignada específicamente en base a un evento próximo de tu calendario.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 pt-0 mt-auto">
              <button 
                onClick={() => {
                  handleToggleComplete(selectedWorkout);
                  setSelectedWorkout(null);
                }}
                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  selectedWorkout.is_completed 
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                    : 'btn-primary'
                }`}
              >
                {selectedWorkout.is_completed ? (
                  <>
                    <Circle size={20} />
                    <span>Marcar como Pendiente</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={20} />
                    <span>¡Completar Rutina Ahora!</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
