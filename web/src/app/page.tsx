import Link from 'next/link';
import { Activity, Calendar, LineChart, ArrowRight, Zap, Target, Users } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-50 font-sans selection:bg-[var(--primary)] selection:text-white overflow-x-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--primary)] opacity-20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600 opacity-10 blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(0,188,212,0.5)]">
            M
          </div>
          <span className="text-xl font-bold tracking-tight">Momia TS</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="text-sm font-medium hover:text-[var(--primary)] transition-colors">
            Iniciar Sesión
          </Link>
          <Link 
            href="/login" 
            className="text-sm font-bold bg-white/10 hover:bg-white/20 border border-white/10 px-5 py-2 rounded-full transition-all hover:scale-105 active:scale-95"
          >
            Comenzar
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center pt-32 pb-20 px-6 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] text-xs font-bold uppercase tracking-wider mb-8 animate-fade-in-up">
          <Zap size={14} /> La Plataforma Definitiva para Atletas
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-8 animate-fade-in-up animation-delay-100">
          Entrena más <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-blue-500">inteligente.</span><br />
          Compite más <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-[var(--primary)]">fuerte.</span>
        </h1>
        
        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-12 leading-relaxed animate-fade-in-up animation-delay-200">
          Momia TS conecta a entrenadores de élite con atletas apasionados. Planifica rutinas, analiza métricas y alcanza tus metas con la tecnología deportiva más avanzada.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up animation-delay-300">
          <Link 
            href="/login" 
            className="flex items-center justify-center gap-2 bg-[var(--primary)] hover:bg-[#0097a7] text-white px-8 py-4 rounded-full font-bold text-lg transition-all hover:shadow-[0_0_20px_rgba(0,188,212,0.4)] hover:-translate-y-1"
          >
            Únete a Momia TS <ArrowRight size={20} />
          </Link>
          <a 
            href="#features" 
            className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-full font-bold text-lg transition-all hover:-translate-y-1"
          >
            Descubre las funciones
          </a>
        </div>
      </main>

      {/* Features Showcase */}
      <section id="features" className="relative z-10 py-24 px-6 bg-black/40 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Todo lo que necesitas para triunfar</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">Herramientas diseñadas tanto para el entrenador perfeccionista como para el atleta comprometido.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/[0.07] transition-colors group">
              <div className="w-14 h-14 bg-[var(--primary)]/20 rounded-2xl flex items-center justify-center mb-6 text-[var(--primary)] group-hover:scale-110 transition-transform">
                <Calendar size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Planificador Dinámico</h3>
              <p className="text-zinc-400 leading-relaxed">
                Asigna entrenamientos de manera visual. Arrastra, copia y ajusta las cargas de la semana en segundos.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/[0.07] transition-colors group">
              <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform">
                <Activity size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Cumplimiento en Tiempo Real</h3>
              <p className="text-zinc-400 leading-relaxed">
                Dashboard inteligente que te alerta visualmente qué atletas están cumpliendo su plan y quiénes necesitan atención.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white/5 border border-white/10 p-8 rounded-3xl hover:bg-white/[0.07] transition-colors group">
              <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition-transform">
                <Target size={28} />
              </div>
              <h3 className="text-xl font-bold mb-3">Gestión de Eventos</h3>
              <p className="text-zinc-400 leading-relaxed">
                Inscripciones y calendarios de carreras integrados para que todo el equipo apunte a la misma meta.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-12 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-400">
            M
          </div>
          <span className="font-bold text-zinc-400">Momia TS</span>
        </div>
        <p className="text-zinc-600 text-sm">
          &copy; {new Date().getFullYear()} Momia TS. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
}
