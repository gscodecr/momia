'use client';
import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, CheckCircle2, Circle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AthleteWorkouts() {
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkouts();
  }, []);

  const fetchWorkouts = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8001/workouts/', {
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
      const res = await fetch(`http://127.0.0.1:8001/workouts/${workout.id}`, {
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

  // Agrupar entrenamientos por fecha (ej. "Hoy", "Mañana", o fecha específica)
  const groupedWorkouts = workouts.reduce((acc: any, workout: any) => {
    const date = new Date(workout.scheduled_date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(workout);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>Mi Plan de Entrenamiento</h1>
        <p className="opacity-70 mt-1">Sigue tus rutinas y marca tu progreso diario.</p>
      </div>

      {workouts.length === 0 ? (
        <div className="glass-card p-12 text-center opacity-70 border border-dashed border-white/20">
          <CalendarIcon size={48} className="mx-auto mb-4 opacity-30" />
          <h2 className="text-xl font-bold mb-2">No hay rutinas asignadas</h2>
          <p className="text-sm">Tu entrenador aún no ha programado sesiones para ti.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.keys(groupedWorkouts).map(dateGroup => (
            <div key={dateGroup} className="space-y-4">
              <h3 className="text-xl font-bold border-b border-white/10 pb-2 capitalize">
                {dateGroup}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {groupedWorkouts[dateGroup].map((workout: any) => (
                  <div key={workout.id} className={`glass-card p-5 border flex flex-col relative transition-all ${workout.is_completed ? 'border-green-500/30 bg-green-500/5 opacity-80' : 'border-white/10 hover:border-[var(--primary)]/50'}`}>
                    
                    <div className="absolute top-3 right-3 text-xs px-2 py-1 bg-black/50 rounded-full capitalize font-semibold border border-white/10 shadow-sm">
                      {workout.discipline}
                    </div>

                    <h4 className={`text-lg font-bold mb-2 pr-12 leading-tight ${workout.is_completed ? 'line-through opacity-70' : ''}`}>
                      {workout.title}
                    </h4>
                    
                    <p className="text-sm opacity-70 mb-4 flex-1 whitespace-pre-wrap">
                      {workout.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs opacity-80 mb-6 bg-black/20 p-2 rounded-lg">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-[var(--primary)]" />
                        <span>{new Date(workout.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      {workout.tss_score && (
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[var(--primary)]">TSS:</span>
                          <span>{workout.tss_score}</span>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => handleToggleComplete(workout)}
                      className={`w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                        workout.is_completed 
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                          : 'btn-primary'
                      }`}
                    >
                      {workout.is_completed ? (
                        <>
                          <CheckCircle2 size={18} />
                          <span>Completado</span>
                        </>
                      ) : (
                        <>
                          <Circle size={18} />
                          <span>Marcar como Hecho</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
