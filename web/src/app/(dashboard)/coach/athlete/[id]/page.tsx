'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Activity, Flame, ShieldAlert, Zap, Edit2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AthleteExpediente({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [athlete, setAthlete] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Edit states
  const [isEditing, setIsEditing] = useState(false);
  const [hrZones, setHrZones] = useState<any>({ z1: '', z2: '', z3: '', z4: '', z5: '' });
  const [injuriesList, setInjuriesList] = useState<any[]>([]);
  const [ftp, setFtp] = useState('');
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [discipline, setDiscipline] = useState('triatlon');

  const [showInjuryModal, setShowInjuryModal] = useState(false);
  const [currentInjury, setCurrentInjury] = useState<any>(null);

  const fetchAthleteInfo = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8001/workouts/athletes`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const allUsers = await res.json();
        const targetAthlete = allUsers.find((u: any) => u.id === Number(id));
        
        if (targetAthlete) {
          setAthlete(targetAthlete);
          const prof = targetAthlete.athlete_profile || {};
          
          setFtp(prof.ftp?.toString() || '');
          setWeight(prof.weight || '');
          setBodyFat(prof.body_fat || '');
          setDiscipline(prof.discipline || 'triatlon');
          
          if (prof.heart_rate_zones) {
            try { setHrZones(JSON.parse(prof.heart_rate_zones)); } catch (e) {}
          }
          if (prof.injuries) {
            try {
              const parsed = JSON.parse(prof.injuries);
              setInjuriesList(Array.isArray(parsed) ? parsed : [{ id: 1, title: 'Historial', date: '', description: prof.injuries, status: 'Observación' }]);
            } catch (e) {
              setInjuriesList([{ id: 1, title: 'Historial', date: '', description: prof.injuries, status: 'Observación' }]);
            }
          }
        } else {
          toast.error('Atleta no encontrado');
          router.push('/coach/dashboard');
        }
      }
    } catch (err) {
      toast.error('Error al cargar expediente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAthleteInfo();
  }, [id, router]);

  const handleSave = async () => {
    try {
      const payload: any = {
        ftp: ftp ? Number(ftp) : null,
        weight: weight,
        body_fat: bodyFat,
        discipline: discipline,
        heart_rate_zones: JSON.stringify(hrZones),
        injuries: injuriesList.length > 0 ? JSON.stringify(injuriesList) : ''
      };

      const res = await fetch(`http://127.0.0.1:8001/workouts/athletes/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        toast.success('Expediente actualizado');
        setIsEditing(false);
        fetchAthleteInfo();
      } else {
        toast.error('Error al guardar');
      }
    } catch (err) {
      toast.error('Error de red al guardar');
    }
  };

  if (loading) return <div className="p-12 text-center opacity-50">Cargando expediente...</div>;
  if (!athlete) return <div className="p-12 text-center opacity-50">Atleta no encontrado</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-[var(--primary)] flex items-center gap-3">
              Expediente: {athlete.first_name} {athlete.last_name}
            </h1>
            <p className="opacity-70 mt-1">{athlete.email}</p>
          </div>
        </div>
        
        {isEditing ? (
          <div className="flex items-center gap-2">
            <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors">
              <X size={18} /> Cancelar
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-black font-bold hover:opacity-90 transition-opacity">
              <Save size={18} /> Guardar
            </button>
          </div>
        ) : (
          <button onClick={() => setIsEditing(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors font-semibold">
            <Edit2 size={18} /> Editar Expediente
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Basic Stats */}
        <div className="glass-card flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="w-24 h-24 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-4xl font-bold text-[var(--primary)]">
            {athlete.first_name.charAt(0)}
          </div>
          <div>
            <h2 className="text-xl font-bold">{athlete.first_name} {athlete.last_name}</h2>
            <div className="flex justify-center gap-2 mt-2">
              <span className={`text-xs px-2 py-1 rounded ${athlete.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {athlete.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        </div>

        {/* Physical Metrics */}
        <div className="md:col-span-2 glass-card p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <h3 className="col-span-2 md:col-span-4 text-lg font-bold border-b border-white/10 pb-2 mb-2 flex items-center gap-2">
            <Activity size={18} className="text-[var(--primary)]" />
            Métricas Físicas Básicas
          </h3>
          
          <div className="col-span-2 md:col-span-4 grid grid-cols-2 gap-4">
            <div className="bg-black/20 rounded-lg p-4">
              <p className="text-xs opacity-60 uppercase font-bold tracking-wider mb-2">Disciplina Principal</p>
              {isEditing ? (
                <select value={discipline} onChange={e => setDiscipline(e.target.value)} className="w-full p-2 rounded bg-black/40 border border-white/10 focus:border-[var(--primary)] focus:outline-none">
                  <option value="triatlon">Triatlón</option>
                  <option value="ciclismo">Ciclismo</option>
                  <option value="running">Running</option>
                  <option value="natacion">Natación</option>
                  <option value="otro">Otro</option>
                </select>
              ) : (
                <div className="text-xl font-bold capitalize">{discipline || 'Sin disciplina'}</div>
              )}
            </div>

            <div className="bg-black/20 rounded-lg p-4">
              <p className="text-xs opacity-60 uppercase font-bold tracking-wider mb-2">FTP (Vatios)</p>
              {isEditing ? (
                <input type="number" value={ftp} onChange={e => setFtp(e.target.value)} className="w-full p-2 rounded bg-black/40 border border-white/10 focus:border-[var(--primary)] focus:outline-none" />
              ) : (
                <div className="text-xl font-bold flex items-end gap-1">
                  {ftp || '-'} {ftp && <span className="text-sm opacity-50 mb-0.5">W</span>}
                </div>
              )}
            </div>

            <div className="bg-black/20 rounded-lg p-4">
              <p className="text-xs opacity-60 uppercase font-bold tracking-wider mb-2">Peso</p>
              {isEditing ? (
                <input type="text" value={weight} onChange={e => setWeight(e.target.value)} placeholder="Ej: 70kg" className="w-full p-2 rounded bg-black/40 border border-white/10 focus:border-[var(--primary)] focus:outline-none" />
              ) : (
                <div className="text-xl font-bold flex items-end gap-1">{weight || '-'}</div>
              )}
            </div>

            <div className="bg-black/20 rounded-lg p-4">
              <p className="text-xs opacity-60 uppercase font-bold tracking-wider mb-2">% Grasa Corporal</p>
              {isEditing ? (
                <input type="text" value={bodyFat} onChange={e => setBodyFat(e.target.value)} placeholder="Ej: 15%" className="w-full p-2 rounded bg-black/40 border border-white/10 focus:border-[var(--primary)] focus:outline-none" />
              ) : (
                <div className="text-xl font-bold flex items-end gap-1">{bodyFat || '-'}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* HR Zones */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold border-b border-white/10 pb-2 mb-6 flex items-center gap-2">
          <Flame size={18} className="text-red-400" />
          Zonas de Frecuencia Cardíaca
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {['z1', 'z2', 'z3', 'z4', 'z5'].map((zone, idx) => {
            const colors = ['zinc', 'blue', 'green', 'yellow', 'red'];
            const names = ['Recuperación', 'Aeróbico', 'Tempo', 'Umbral', 'VO2 Max'];
            return (
              <div key={zone} className={`bg-${colors[idx]}-900/30 rounded-lg p-4 text-center border-t-2 border-${colors[idx]}-500`}>
                <p className={`text-xs font-bold uppercase mb-2 text-${colors[idx]}-400`}>Zona {idx + 1}</p>
                {isEditing ? (
                  <input type="text" value={hrZones[zone]} onChange={e => setHrZones({...hrZones, [zone]: e.target.value})} className="w-full p-1 text-center rounded bg-black/40 border border-white/10 text-sm focus:outline-none" />
                ) : (
                  <p className="font-semibold">{hrZones[zone] || '-'}</p>
                )}
                <p className="text-[10px] opacity-50 mt-1">{names[idx]}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Injuries */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <ShieldAlert size={18} className="text-yellow-400" />
            Historial de Lesiones
          </h3>
          {isEditing && (
            <button 
              onClick={() => {
                setCurrentInjury({ id: Date.now(), title: '', date: '', description: '', status: 'Activa' });
                setShowInjuryModal(true);
              }}
              className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded transition-colors"
            >
              + Añadir Lesión
            </button>
          )}
        </div>
        
        {injuriesList.length > 0 ? (
          <div className="overflow-x-auto border border-white/10 rounded-lg">
            <table className="w-full text-left text-sm min-w-[600px]">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="p-3 opacity-80">Fecha</th>
                  <th className="p-3 opacity-80">Lesión</th>
                  <th className="p-3 opacity-80">Estado</th>
                </tr>
              </thead>
              <tbody>
                {injuriesList.map(inj => (
                  <tr 
                    key={inj.id} 
                    onClick={() => { setCurrentInjury(inj); setShowInjuryModal(true); }}
                    className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <td className="p-3">{inj.date || '-'}</td>
                    <td className="p-3 font-semibold">{inj.title}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs ${inj.status === 'Activa' ? 'bg-red-500/20 text-red-400' : inj.status === 'Recuperado' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                        {inj.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center p-8 opacity-50 bg-black/20 rounded-lg">
            No se han registrado lesiones.
          </div>
        )}
      </div>

      {/* Injury Modal */}
      {showInjuryModal && currentInjury && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#09090b] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-xl font-bold">{isEditing ? 'Editar Lesión' : 'Detalle de Lesión'}</h3>
              <button onClick={() => setShowInjuryModal(false)} className="opacity-50 hover:opacity-100">✕</button>
            </div>
            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm opacity-70">Lesión / Molestia</label>
                {isEditing ? (
                  <input type="text" value={currentInjury.title} onChange={e => setCurrentInjury({ ...currentInjury, title: e.target.value })} className="w-full p-3 rounded-lg bg-black/20 border border-white/10 focus:border-[var(--primary)] focus:outline-none" />
                ) : (
                  <p className="font-semibold">{currentInjury.title}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm opacity-70">Fecha</label>
                  {isEditing ? (
                    <input type="date" value={currentInjury.date} onChange={e => setCurrentInjury({ ...currentInjury, date: e.target.value })} className="w-full p-3 rounded-lg bg-black/20 border border-white/10 focus:border-[var(--primary)] focus:outline-none [color-scheme:dark]" />
                  ) : (
                    <p className="font-semibold">{currentInjury.date || '-'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-sm opacity-70">Estado</label>
                  {isEditing ? (
                    <select value={currentInjury.status} onChange={e => setCurrentInjury({ ...currentInjury, status: e.target.value })} className="w-full p-3 rounded-lg bg-black/20 border border-white/10 focus:border-[var(--primary)] focus:outline-none">
                      <option value="Activa">Activa</option>
                      <option value="En Tratamiento">En Tratamiento</option>
                      <option value="Recuperado">Recuperado</option>
                    </select>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${currentInjury.status === 'Activa' ? 'bg-red-500/20 text-red-400' : currentInjury.status === 'Recuperado' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {currentInjury.status}
                    </span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm opacity-70">Descripción / Notas médicas</label>
                {isEditing ? (
                  <textarea value={currentInjury.description} onChange={e => setCurrentInjury({ ...currentInjury, description: e.target.value })} rows={4} className="w-full p-3 rounded-lg bg-black/20 border border-white/10 focus:border-[var(--primary)] focus:outline-none" />
                ) : (
                  <div className="bg-black/20 p-4 rounded-lg whitespace-pre-wrap text-sm border border-white/5">
                    {currentInjury.description || 'Sin descripción adicional.'}
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 border-t border-white/10 bg-black/20 flex justify-between">
              {isEditing ? (
                <>
                  <button onClick={() => { setInjuriesList(injuriesList.filter(i => i.id !== currentInjury.id)); setShowInjuryModal(false); }} className="text-red-400 hover:bg-red-400/10 px-4 py-2 rounded-lg transition-colors">Eliminar</button>
                  <div className="flex gap-2">
                    <button onClick={() => setShowInjuryModal(false)} className="px-4 py-2 rounded-lg hover:bg-white/5 transition-colors">Cancelar</button>
                    <button onClick={() => {
                        const exists = injuriesList.find(i => i.id === currentInjury.id);
                        if (exists) setInjuriesList(injuriesList.map(i => i.id === currentInjury.id ? currentInjury : i));
                        else setInjuriesList([...injuriesList, currentInjury]);
                        setShowInjuryModal(false);
                      }} className="px-6 py-2 rounded-lg bg-[var(--primary)] text-black font-bold hover:opacity-90">Confirmar</button>
                  </div>
                </>
              ) : (
                <button onClick={() => setShowInjuryModal(false)} className="w-full px-6 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors font-semibold">Cerrar</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
