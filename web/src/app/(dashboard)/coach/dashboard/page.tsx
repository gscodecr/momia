'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Athlete {
  id: number;
  discipline: string;
  weight: string;
  height: string;
}

export default function CoachDashboard() {
  const router = useRouter();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAthletes = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch('http://127.0.0.1:8001/admin/my_athletes', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error('Error al cargar atletas');
        }

        const data = await res.json();
        setAthletes(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAthletes();
  }, [router]);

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>Mis Atletas</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--primary)' }}></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Atleta 1 - Verde */}
          <div className="glass-card cursor-pointer hover:scale-[1.02] transition-transform relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-green-500"></div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-lg">MA</div>
              <div>
                <h3 className="font-bold text-lg">María Alfaro</h3>
                <p className="text-sm opacity-60">Triatlón</p>
              </div>
            </div>
            <div className="space-y-2 text-sm opacity-80">
              <div className="flex justify-between"><span>Cumplimiento Semanal:</span><span className="text-green-400 font-bold">100%</span></div>
              <div className="flex justify-between"><span>Último entreno:</span><span>Hoy, 06:00 AM</span></div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 text-center">
              <span className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider">Ver Detalle</span>
            </div>
          </div>

          {/* Atleta 2 - Rojo */}
          <div className="glass-card cursor-pointer hover:scale-[1.02] transition-transform relative overflow-hidden">
            <div className="absolute top-0 right-0 w-2 h-full bg-red-500"></div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-lg">CR</div>
              <div>
                <h3 className="font-bold text-lg">Carlos Ruiz</h3>
                <p className="text-sm opacity-60">Ciclismo</p>
              </div>
            </div>
            <div className="space-y-2 text-sm opacity-80">
              <div className="flex justify-between"><span>Cumplimiento Semanal:</span><span className="text-red-400 font-bold">20%</span></div>
              <div className="flex justify-between"><span>Último entreno:</span><span>Hace 4 días</span></div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 text-center">
              <span className="text-xs font-semibold text-[var(--primary)] uppercase tracking-wider">Ver Detalle / Enviar Alerta</span>
            </div>
          </div>

          {athletes.length === 0 ? (
            <div className="col-span-full text-center p-12 glass-card opacity-70">
              No tienes atletas asignados en este momento.
            </div>
          ) : (
            athletes.map((athlete) => (
              <div key={athlete.id} className="glass-card flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold">Atleta #{athlete.id}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-[var(--primary)] text-[var(--primary-foreground)]" style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                      {athlete.discipline}
                    </span>
                  </div>
                  <div className="space-y-2 opacity-80 text-sm">
                    <p><strong>Peso:</strong> {athlete.weight || 'N/A'}</p>
                    <p><strong>Altura:</strong> {athlete.height || 'N/A'}</p>
                  </div>
                </div>
                <button className="mt-6 w-full py-2 rounded-lg" style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', transition: 'background-color 0.2s' }}>
                  Ver Progreso Detallado
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
