'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Users, CreditCard, LayoutDashboard, Calendar, ShoppingBag, Bell, MessageCircle, Menu, X, LogOut, Activity } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    if (!storedRole) {
      router.push('/login');
    } else {
      setRole(storedRole);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    router.push('/login');
  };

  if (!role) return null; // Avoid hydration mismatch

  const navItems = [
    // --- Admin Routes ---
    ...(role === 'admin' ? [
      { label: 'Admin Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
      { label: 'Usuarios', href: '/admin/users', icon: Users },
      { label: 'Pagos / SINPE', href: '/admin/payments', icon: CreditCard },
      { label: 'Marketplace', href: '/admin/products', icon: ShoppingBag },
    ] : []),
    // --- Coach Routes ---
    ...(role === 'coach' || role === 'admin' ? [
      { label: 'Coach Dashboard', href: '/coach/dashboard', icon: Home },
      { label: 'Planificador', href: '/coach/planner', icon: Calendar },
    ] : []),
    // --- Athlete Routes ---
    ...(role === 'athlete' ? [
      { label: 'Mi Progreso', href: '/athlete/dashboard', icon: Home },
      { label: 'Entrenamientos', href: '/athlete/workouts', icon: Activity },
      { label: 'Facturación', href: '/athlete/billing', icon: CreditCard },
      { label: 'Tienda', href: '/athlete/marketplace', icon: ShoppingBag },
    ] : []),
    // --- Shared Routes ---
    { label: 'Eventos', href: '/events', icon: Calendar },
    { label: 'Mensajes', href: '/messages', icon: MessageCircle },
  ];

  // Close dropdowns if clicking outside would be nice, but for simplicity we toggle
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Sidebar */}
      <aside className={`fixed z-50 inset-y-0 left-0 w-64 transform transition-transform duration-300 ease-in-out border-r md:translate-x-0 md:static ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="h-16 flex items-center justify-between px-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <h1 className="text-xl font-bold" style={{ color: 'var(--primary)' }}>Momia TS</h1>
          <button className="md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="mb-6 px-2">
            <p className="text-xs font-semibold uppercase tracking-wider opacity-50">Menú Principal</p>
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => { router.push(item.href); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left ${isActive ? 'bg-[var(--primary)] text-white font-semibold' : 'hover:bg-white/5 opacity-80 hover:opacity-100'}`}
              style={isActive ? { backgroundColor: 'var(--primary)', color: '#fff' } : {}}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>

    <div className="absolute bottom-0 w-full p-4 border-t" style={{ borderColor: 'var(--border)' }}>
      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-white/5 opacity-80 hover:opacity-100 transition-colors text-left">
        <LogOut size={20} />
        <span>Cerrar Sesión</span>
      </button>
    </div>
  </aside>

  {/* Main Content */}
  <div className="flex-1 flex flex-col min-w-0 relative">
    <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b relative z-30" style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
      <button className="md:hidden p-2 -ml-2 rounded-lg hover:bg-white/5" onClick={() => setIsMobileMenuOpen(true)}>
        <Menu size={24} />
      </button>
      <div className="flex-1"></div>
      <div className="flex items-center gap-4 relative">
        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsProfileOpen(false); }}
            className="relative p-2 rounded-full hover:bg-white/5 transition-colors"
          >
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--primary)' }}></span>
          </button>
          
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-white/10 shadow-2xl overflow-hidden glass-card p-0 z-50">
              <div className="p-4 border-b border-white/10 bg-black/20">
                <h3 className="font-bold">Notificaciones</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                <div className="p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                  <p className="text-sm font-semibold">Nuevo mensaje de Coach Gerardo</p>
                  <p className="text-xs opacity-60 mt-1">Hace 2 horas</p>
                </div>
                <div className="p-4 border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors">
                  <p className="text-sm font-semibold">Tu comprobante SINPE fue aprobado</p>
                  <p className="text-xs opacity-60 mt-1">Ayer</p>
                </div>
                <div className="p-4 hover:bg-white/5 cursor-pointer transition-colors">
                  <p className="text-sm font-semibold">Rutina de piscina actualizada</p>
                  <p className="text-xs opacity-60 mt-1">Ayer</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button 
            onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotificationsOpen(false); }}
            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white cursor-pointer hover:scale-105 transition-transform" 
            style={{ backgroundColor: 'var(--primary)' }}
          >
            {role[0].toUpperCase()}
          </button>
          
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 shadow-2xl overflow-hidden glass-card p-0 z-50">
              <div className="p-4 border-b border-white/10 bg-black/20">
                <p className="font-bold capitalize">{role}</p>
                <p className="text-xs opacity-60">usuario@ejemplo.com</p>
              </div>
              <div className="p-2">
                <button 
                  onClick={() => { router.push('/profile'); setIsProfileOpen(false); }}
                  className="w-full text-left p-2 text-sm rounded-lg hover:bg-white/10 transition-colors"
                >
                  Mi Perfil
                </button>
                <button 
                  className="w-full text-left p-2 text-sm rounded-lg hover:bg-white/10 transition-colors"
                >
                  Configuración
                </button>
                <div className="h-px bg-white/10 my-2"></div>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left p-2 text-sm rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>

        <main className="flex-1 overflow-auto p-4 md:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
      )}
    </div>
  );
}
