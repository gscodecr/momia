'use client';
import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, MapPin, Users, Plus, Activity, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EventsPage() {
  const [role, setRole] = useState<string | null>(null);
  const [filterDiscipline, setFilterDiscipline] = useState('Todas');
  const [events, setEvents] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [discipline, setDiscipline] = useState('ciclismo');

  // Modal & Registrations State
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [sendingPlan, setSendingPlan] = useState(false);
  
  // Individual Plan State
  const [assigningPlanFor, setAssigningPlanFor] = useState<number | null>(null);
  const [indivPlanTitle, setIndivPlanTitle] = useState('');
  const [indivPlanDesc, setIndivPlanDesc] = useState('');
  const [sendingIndivPlan, setSendingIndivPlan] = useState(false);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Registrations State for Athlete
  const [myRegistrations, setMyRegistrations] = useState<number[]>([]);

  useEffect(() => {
    setRole(localStorage.getItem('role'));
    fetchEvents();
    fetchMyRegistrations();
  }, []);

  const fetchMyRegistrations = async () => {
    if (localStorage.getItem('role') !== 'athlete') return;
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001') + '/events/my_registrations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMyRegistrations(data.map((r: any) => r.event_id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEvents = async () => {
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001') + '/events/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001') + '/events/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title,
          date: new Date(date).toISOString(),
          location,
          location_url: locationUrl,
          description,
          image_url: imageUrl,
          discipline
        })
      });
      if (res.ok) {
        toast.success('Evento creado exitosamente');
        setShowForm(false);
        setTitle(''); setDate(''); setLocation(''); setDiscipline('ciclismo');
        setLocationUrl(''); setDescription(''); setImageUrl('');
        fetchEvents();
      } else {
        toast.error('Error al crear evento');
      }
    } catch (err) {
      toast.error('Error de red');
    }
  };

  const handleRegister = async (eventId: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'}/events/${eventId}/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        toast.success('¡Te has inscrito al evento exitosamente!');
        fetchMyRegistrations();
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Error al inscribirse');
      }
    } catch (err) {
      toast.error('Error de red');
    }
  };

  const handleUnregister = async (eventId: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'}/events/${eventId}/register`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        toast.success('Inscripción cancelada');
        fetchMyRegistrations();
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Error al cancelar inscripción');
      }
    } catch (err) {
      toast.error('Error de red');
    }
  };

  const handleOpenEventDetails = async (event: any) => {
    setSelectedEvent(event);
    setAssigningPlanFor(null); // Reset when opening new event
    if (localStorage.getItem('role') !== 'athlete') {
      setLoadingRegs(true);
      setRegistrations([]);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'}/events/${event.id}/registrations`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setRegistrations(data);
        } else {
          toast.error('No se pudieron cargar los inscritos');
        }
      } catch (err) {
        toast.error('Error de red al cargar inscritos');
      } finally {
        setLoadingRegs(false);
      }
    }
  };

  const handleSendSessionPlan = async () => {
    if (!selectedEvent || registrations.length === 0) return;
    
    setSendingPlan(true);
    let successCount = 0;
    let failCount = 0;

    for (const reg of registrations) {
      try {
        const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001') + '/workouts/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            title: `Plan: ${selectedEvent.title}`,
            description: `Plan genérico para el evento: ${selectedEvent.title}`,
            scheduled_date: new Date(selectedEvent.date).toISOString(),
            discipline: selectedEvent.discipline || 'otro',
            athlete_id: reg.user_id,
            tss_score: 50,
            event_id: selectedEvent.id
          })
        });
        if (res.ok) successCount++;
        else failCount++;
      } catch (err) {
        failCount++;
      }
    }
    
    setSendingPlan(false);
    
    // Refresh registrations to get updated has_plan status
    const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'}/events/${selectedEvent.id}/registrations`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (refreshRes.ok) {
      setRegistrations(await refreshRes.json());
    }

    if (failCount === 0) {
      toast.success(`Plan de sesión enviado a ${successCount} atletas exitosamente`);
    } else {
      toast.error(`Se enviaron ${successCount} planes, pero hubo errores con ${failCount} atletas`);
    }
  };

  const openIndividualPlan = (athleteId: number) => {
    setAssigningPlanFor(assigningPlanFor === athleteId ? null : athleteId);
    setIndivPlanTitle(`Plan: ${selectedEvent.title}`);
    setIndivPlanDesc(selectedEvent.description || '');
  };

  const handleSendIndividualPlan = async (e: React.FormEvent, athleteId: number) => {
    e.preventDefault();
    setSendingIndivPlan(true);
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001') + '/workouts/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: indivPlanTitle,
          description: indivPlanDesc,
          scheduled_date: new Date(selectedEvent.date).toISOString(),
          discipline: selectedEvent.discipline || 'otro',
          athlete_id: athleteId,
          tss_score: 50, // Default
          event_id: selectedEvent.id
        })
      });
      if (res.ok) {
        toast.success('Plan individual enviado exitosamente');
        setAssigningPlanFor(null);
        
        // Refresh registrations
        const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'}/events/${selectedEvent.id}/registrations`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (refreshRes.ok) {
          setRegistrations(await refreshRes.json());
        }
      } else {
        toast.error('Error al enviar el plan individual');
      }
    } catch (err) {
      toast.error('Error de red');
    } finally {
      setSendingIndivPlan(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Calendar Logic ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    let day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Hacer que Lunes sea 0 y Domingo 6
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  // --- Filtering ---
  // First, filter by discipline. This affects BOTH the calendar and the cards.
  const eventsByDiscipline = events.filter(event => {
    return filterDiscipline === 'Todas' || (event.discipline && event.discipline.toLowerCase() === filterDiscipline.toLowerCase());
  });

  // Then, filter by date for the cards below
  const filteredCards = eventsByDiscipline.filter(event => {
    const eventDate = new Date(event.date);
    if (selectedDate) {
      return eventDate.toDateString() === selectedDate.toDateString();
    }
    // If no selected date, show events for the currently viewed month
    return eventDate.getFullYear() === year && eventDate.getMonth() === month;
  });

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>Próximos Eventos</h1>
          <p className="opacity-70 mt-1">Explora e inscríbete en entrenamientos y competencias</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <select 
            className="bg-black/20 border border-white/10 rounded-lg p-2 focus:outline-none"
            value={filterDiscipline}
            onChange={(e) => setFilterDiscipline(e.target.value)}
          >
            <option value="Todas">Todas las disciplinas</option>
            <option value="triatlon">Triatlón</option>
            <option value="ciclismo">Ciclismo</option>
            <option value="atletismo">Atletismo</option>
            <option value="natacion">Natación</option>
          </select>
          {(role === 'admin' || role === 'coach') && (
            <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center justify-center gap-2">
              <Plus size={20} />
              <span>{showForm ? 'Cancelar' : 'Crear Evento'}</span>
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="glass-card mb-8 border-[var(--primary)] border shadow-[0_0_20px_rgba(13,131,177,0.15)] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
            <div className="p-2 bg-[var(--primary)]/20 rounded-lg text-[var(--primary)]">
              <CalendarIcon size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Programar Nuevo Evento</h2>
              <p className="text-sm opacity-60">Completa los detalles para invitar a tus atletas.</p>
            </div>
          </div>
          
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold opacity-80">Título del evento *</label>
              <input required placeholder="Ej. Fondo Ciclismo 100k" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 rounded-xl bg-black/20 border border-white/10 focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] outline-none transition-all" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold opacity-80">Fecha y Hora *</label>
              <input 
                required 
                type="datetime-local" 
                value={date} 
                onChange={e => setDate(e.target.value)} 
                onClick={(e) => {
                  try {
                    (e.target as HTMLInputElement).showPicker();
                  } catch (err) {
                    // Fallback
                  }
                }}
                className="w-full p-3 rounded-xl bg-black/20 border border-white/10 focus:border-[var(--primary)] outline-none transition-all cursor-pointer" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold opacity-80">Ubicación *</label>
              <input required placeholder="Lugar o punto de encuentro" value={location} onChange={e => setLocation(e.target.value)} className="w-full p-3 rounded-xl bg-black/20 border border-white/10 focus:border-[var(--primary)] outline-none transition-all" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold opacity-80">Disciplina *</label>
              <select required value={discipline} onChange={e => setDiscipline(e.target.value)} className="w-full p-3 rounded-xl bg-black/20 border border-white/10 focus:border-[var(--primary)] outline-none transition-all">
                <option value="ciclismo">Ciclismo</option>
                <option value="atletismo">Atletismo</option>
                <option value="natacion">Natación</option>
                <option value="triatlon">Triatlón</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold opacity-80">Enlace de Waze / Maps (Opcional)</label>
              <input placeholder="https://waze.com/ul/..." type="url" value={locationUrl} onChange={e => setLocationUrl(e.target.value)} className="w-full p-3 rounded-xl bg-black/20 border border-white/10 focus:border-[var(--primary)] outline-none transition-all" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold opacity-80">Descripción del Evento *</label>
              <textarea required placeholder="Indicaciones, equipo requerido, etc." value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 rounded-xl bg-black/20 border border-white/10 focus:border-[var(--primary)] outline-none transition-all h-28 resize-none" />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold opacity-80">Imagen de Portada</label>
              <div className="w-full">
                <input type="file" accept="image/*" id="event-image" className="hidden" onChange={handleImageUpload} />
                <label 
                  htmlFor="event-image"
                  className="w-full h-32 border-2 border-dashed border-[var(--primary)]/50 rounded-xl bg-[var(--primary)]/5 flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--primary)]/10 hover:border-[var(--primary)] transition-all group overflow-hidden"
                >
                  {imageUrl ? (
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <Plus size={24} className="text-[var(--primary)] mb-1 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-semibold text-[var(--primary)]">Upload Imagen</span>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="md:col-span-2 pt-4 flex justify-end gap-3 border-t border-white/10 mt-2">
              <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 rounded-lg bg-white/5 hover:bg-white/10 font-semibold transition-colors">Cancelar</button>
              <button type="submit" className="btn-primary px-8">Guardar Evento</button>
            </div>
          </form>
        </div>
      )}

      {/* --- Events Cards --- */}
      <div className="flex items-center justify-between mb-4 mt-2">
        <div className="flex items-center gap-2">
          <h3 className="text-xl font-bold">
            {selectedDate ? `Eventos del ${selectedDate.toLocaleDateString()}` : `Eventos de ${monthNames[month]}`}
          </h3>
          <span className="bg-white/10 px-2 py-1 rounded-full text-xs">{filteredCards.length}</span>
        </div>
        <button 
          onClick={() => setIsCalendarOpen(!isCalendarOpen)}
          className="text-sm font-semibold text-[var(--primary)] hover:underline flex items-center gap-2 bg-[var(--primary)]/10 px-4 py-2 rounded-lg transition-colors"
        >
          <CalendarIcon size={16} />
          {isCalendarOpen ? 'Ocultar Calendario' : 'Abrir Calendario'}
        </button>
      </div>

      {isCalendarOpen && (
        <div className="glass-card mb-8 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{monthNames[month]} {year}</h2>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 hover:bg-white/10 rounded-lg transition-colors border border-white/5">&lt;</button>
              <button onClick={() => setSelectedDate(null)} className="px-4 py-2 hover:bg-white/10 rounded-lg transition-colors border border-white/5 text-sm">Mes Completo</button>
              <button onClick={nextMonth} className="p-2 hover:bg-white/10 rounded-lg transition-colors border border-white/5">&gt;</button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center font-semibold text-xs md:text-sm opacity-60 pb-1 md:pb-2">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {/* Empty cells for padding */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[50px] md:min-h-[100px] bg-white/5 rounded-lg md:rounded-xl opacity-20 border border-white/5"></div>
            ))}
            
            {/* Actual days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const iterDate = new Date(year, month, dayNum);
              const isSelected = selectedDate && iterDate.toDateString() === selectedDate.toDateString();
              const isToday = new Date().toDateString() === iterDate.toDateString();
              
              // Find events for this day ONLY from the filtered discipline list
              const dayEvents = eventsByDiscipline.filter(e => new Date(e.date).toDateString() === iterDate.toDateString());

              return (
                <div 
                  key={dayNum} 
                  onClick={() => setSelectedDate(iterDate)}
                  className={`min-h-[50px] md:min-h-[100px] p-1 md:p-2 rounded-lg md:rounded-xl border cursor-pointer transition-all flex flex-col items-center md:items-stretch ${
                    isSelected ? 'border-[var(--primary)] bg-[var(--primary)]/10 shadow-[0_0_15px_rgba(13,131,177,0.3)]' : 
                    isToday ? 'border-white/30 bg-white/10' : 'border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-1 md:mb-2 w-full gap-1 md:gap-0">
                    <span className={`text-xs md:text-sm font-bold w-6 h-6 md:w-7 md:h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-[var(--primary)] text-white' : ''}`}>
                      {dayNum}
                    </span>
                    {dayEvents.length > 0 && <span className="text-[9px] md:text-xs font-bold bg-[var(--primary)]/20 text-[var(--primary)] px-1.5 md:px-2 py-0.5 rounded-full">{dayEvents.length}</span>}
                  </div>
                  
                  <div className="hidden md:block space-y-1 w-full">
                    {dayEvents.slice(0, 2).map(ev => (
                      <div key={ev.id} className="text-[10px] bg-black/40 px-1.5 py-1 rounded truncate border border-white/5" title={ev.title}>
                        {ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] text-center opacity-60">+{dayEvents.length - 2} más</div>
                    )}
                  </div>
                  
                  {/* Mobile indicators (dots) instead of text */}
                  <div className="flex md:hidden gap-0.5 mt-auto pb-1 flex-wrap justify-center">
                    {dayEvents.slice(0, 3).map(ev => (
                      <div key={ev.id} className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredCards.length === 0 ? (
          <div className="col-span-full p-12 text-center opacity-70 glass-card border border-dashed border-white/20">
            No hay eventos programados para esta fecha.
          </div>
        ) : filteredCards.map(event => (
          <div key={event.id} className="glass-card p-4 hover:scale-[1.02] transition-transform flex flex-col border border-white/10">
            <div className="h-28 -mx-4 -mt-4 mb-3 bg-zinc-800 rounded-t-2xl flex items-center justify-center relative overflow-hidden">
              {event.image_url ? (
                <img src={event.image_url} alt={event.title} className="object-cover w-full h-full" />
              ) : (
                <CalendarIcon size={32} className="opacity-20" />
              )}
              <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-semibold text-white capitalize border border-white/10 shadow-lg">
                {event.discipline}
              </div>
            </div>
            <h3 className="text-lg font-bold mb-1 leading-tight">{event.title}</h3>
            {event.description && <p className="text-xs opacity-70 mb-3 line-clamp-2">{event.description}</p>}
            
            <div className="space-y-1.5 mt-auto text-xs opacity-80">
              <div className="flex items-center gap-1.5">
                <CalendarIcon size={14} className="text-[var(--primary)]" />
                <span>{new Date(event.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin size={14} className="text-[var(--primary)]" />
                <span className="truncate">{event.location}</span>
              </div>
              {event.location_url && (
                <div className="pl-5">
                  <a href={event.location_url} target="_blank" rel="noreferrer" className="text-[var(--primary)] hover:underline text-[10px] bg-[var(--primary)]/10 px-2 py-0.5 rounded-full inline-block">
                    Abrir Mapa
                  </a>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-white/10">
              <button onClick={() => handleOpenEventDetails(event)} className="w-full py-1.5 text-sm rounded-lg bg-white/5 hover:bg-white/10 transition-all font-semibold border border-white/10 flex items-center justify-center gap-2">
                <span>Ver Detalles</span>
                {role === 'athlete' && myRegistrations.includes(event.id) && (
                  <CheckCircle2 size={16} className="text-green-400" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* --- Registrations Modal --- */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-2xl font-bold">{selectedEvent.title}</h2>
                <div className="flex gap-2 text-sm opacity-70 mt-1">
                  <span>{new Date(selectedEvent.date).toLocaleDateString()}</span>
                  <span>•</span>
                  <span className="capitalize">{selectedEvent.discipline}</span>
                </div>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {/* Event Image & Description */}
              {selectedEvent.image_url && (
                <div className="w-full h-48 rounded-xl overflow-hidden mb-6">
                  <img src={selectedEvent.image_url} alt={selectedEvent.title} className="w-full h-full object-cover" />
                </div>
              )}
              {selectedEvent.description && (
                <div className="mb-6 p-4 bg-white/5 rounded-xl border border-white/5">
                  <h3 className="font-semibold mb-2 opacity-80">Descripción del Evento</h3>
                  <p className="text-sm opacity-90 whitespace-pre-wrap">{selectedEvent.description}</p>
                  
                  <div className="mt-4 pt-4 border-t border-white/10 flex flex-col gap-2 text-sm opacity-80">
                    <div className="flex items-center gap-2">
                      <MapPin size={16} className="text-[var(--primary)]" />
                      <span>{selectedEvent.location}</span>
                    </div>
                    {selectedEvent.location_url && (
                      <a href={selectedEvent.location_url} target="_blank" rel="noreferrer" className="text-[var(--primary)] hover:underline flex items-center gap-1 ml-6">
                        Abrir ubicación en Waze / Google Maps
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Athletes Section */}
              {role === 'athlete' ? (
                <div className="flex justify-center p-6 bg-white/5 rounded-xl border border-white/5 mb-4">
                  {myRegistrations.includes(selectedEvent.id) ? (
                    <div className="text-center w-full">
                      <div className="flex items-center justify-center gap-2 text-green-400 font-bold mb-4 bg-green-400/10 py-2 rounded-lg">
                        <CheckCircle2 size={20} />
                        ¡Estás inscrito en este evento!
                      </div>
                      <button onClick={() => handleUnregister(selectedEvent.id)} className="px-6 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors font-semibold border border-red-500/30 w-full sm:w-auto">
                        Cancelar Inscripción
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => handleRegister(selectedEvent.id)} className="btn-primary w-full sm:w-auto px-12 py-3 text-lg flex items-center justify-center gap-2">
                      <CheckCircle2 size={20} />
                      Inscribirme Ahora
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold mb-4 text-[var(--primary)] flex items-center gap-2">
                    Atletas Inscritos <span className="bg-[var(--primary)]/20 px-2 py-0.5 rounded-full text-xs">{registrations.length}</span>
                  </h3>
                  
                  {loadingRegs ? (
                    <div className="p-8 text-center opacity-50 animate-pulse">Cargando inscritos...</div>
                  ) : registrations.length === 0 ? (
                    <div className="p-8 text-center opacity-50 bg-white/5 rounded-xl border border-dashed border-white/10">
                      Aún no hay atletas inscritos en este evento.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {registrations.map(reg => (
                        <div key={reg.id} className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] font-bold">
                                {reg.user?.first_name?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <div className="font-semibold">{reg.user?.first_name} {reg.user?.last_name}</div>
                                <div className="text-xs opacity-60">{reg.user?.email}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap justify-start sm:justify-end w-full sm:w-auto">
                              {reg.has_plan && (
                                <div className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full font-medium border border-blue-500/30 flex items-center gap-1">
                                  <CheckCircle2 size={12} />
                                  Plan Asignado
                                </div>
                              )}
                              <div className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-medium border border-green-500/30">
                                Confirmado
                              </div>
                              <button 
                                onClick={() => openIndividualPlan(reg.user_id)}
                                className="text-xs bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white px-2 py-1 rounded-lg font-medium border border-[var(--primary)]/30 transition-colors flex items-center gap-1"
                              >
                                Plan Personalizado
                              </button>
                            </div>
                          </div>
                          
                          {/* Expanded Form for Individual Plan */}
                          {assigningPlanFor === reg.user_id && (
                            <form onSubmit={(e) => handleSendIndividualPlan(e, reg.user_id)} className="mt-4 pt-4 border-t border-white/10 animate-in slide-in-from-top-2 fade-in duration-200">
                              <h4 className="text-sm font-semibold mb-3 text-[var(--primary)]">Crear Plan para {reg.user?.first_name}</h4>
                              <div className="space-y-3">
                                <div>
                                  <label className="text-xs opacity-70 mb-1 block">Título</label>
                                  <input 
                                    required
                                    value={indivPlanTitle}
                                    onChange={e => setIndivPlanTitle(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm focus:border-[var(--primary)] outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs opacity-70 mb-1 block">Descripción / Detalles de la Rutina</label>
                                  <textarea 
                                    required
                                    value={indivPlanDesc}
                                    onChange={e => setIndivPlanDesc(e.target.value)}
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm focus:border-[var(--primary)] outline-none h-24 resize-none"
                                  />
                                </div>
                                <div className="flex justify-end gap-2">
                                  <button type="button" onClick={() => setAssigningPlanFor(null)} className="px-3 py-1.5 text-xs rounded-lg hover:bg-white/10 transition-colors">
                                    Cancelar
                                  </button>
                                  <button type="submit" disabled={sendingIndivPlan} className="btn-primary px-4 py-1.5 text-xs flex items-center gap-1">
                                    {sendingIndivPlan ? 'Enviando...' : 'Enviar Rutina'}
                                  </button>
                                </div>
                              </div>
                            </form>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {role !== 'athlete' && (
              <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <p className="text-xs opacity-60 sm:max-w-[250px]">
                  Asigna automáticamente un entrenamiento a todos los inscritos para este día.
                </p>
                <button 
                  onClick={handleSendSessionPlan} 
                  disabled={registrations.length === 0 || sendingPlan}
                  className={`btn-primary w-full sm:w-auto flex items-center justify-center gap-2 ${registrations.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {sendingPlan ? (
                    <span className="animate-pulse">Enviando...</span>
                  ) : (
                    <>
                      <Activity size={18} />
                      <span>Asignar Plan de Sesión</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
