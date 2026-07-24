'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Users, CreditCard, LayoutDashboard, Calendar, ShoppingBag, Bell, MessageCircle, Menu, X, LogOut, Activity, Globe } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const storedRole = localStorage.getItem('role');
    const token = localStorage.getItem('token');
    if (!storedRole || !token) {
      router.push('/login');
    } else {
      setRole(storedRole);
      // Fetch latest user data
      const fetchUserData = () => {
        fetch((process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001') + '/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
          if (data.first_name) {
            setUserName(`${data.first_name} ${data.last_name || ''}`.trim());
            localStorage.setItem('first_name', data.first_name);
          }
          if (data.avatar_url) {
            setAvatarUrl(data.avatar_url);
          } else {
            setAvatarUrl(null);
          }
        })
        .catch(() => {});
      };
      const fetchNotifications = () => {
        fetch((process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001') + '/notifications/', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
          if(Array.isArray(data)) setNotifications(data);
        })
        .catch(() => {});
      };
      
      fetchUserData();
      fetchNotifications();
      
      const interval = setInterval(fetchNotifications, 30000); // poll every 30s
      
      window.addEventListener('profileUpdated', fetchUserData);
      window.addEventListener('refreshNotifications', fetchNotifications);
      return () => {
        window.removeEventListener('profileUpdated', fetchUserData);
        window.removeEventListener('refreshNotifications', fetchNotifications);
        clearInterval(interval);
      };
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    router.push('/login');
  };

  const markAsRead = (id: number) => {
    const token = localStorage.getItem('token');
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'}/notifications/${id}/read`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(() => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    });
  };

  const markAllAsRead = () => {
    const token = localStorage.getItem('token');
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'}/notifications/read-all`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(() => {
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    });
  };

  const handleNotificationClick = (notif: any) => {
    if (!notif.is_read) {
      markAsRead(notif.id);
    }
    setIsNotificationsOpen(false);
    if (notif.type === 'CHAT') {
      if (notif.related_id) {
        router.push(`/messages?contact=${notif.related_id}`);
      } else {
        router.push('/messages');
      }
    } else if (notif.type === 'EVENT') {
      router.push('/events');
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

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
    { label: 'Network Momia', href: '/network', icon: Globe },
  ];

  // Close dropdowns if clicking outside would be nice, but for simplicity we toggle
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Sidebar */}
      <aside className={`fixed z-50 inset-y-0 left-0 w-64 flex flex-col transform transition-transform duration-300 ease-in-out border-r md:sticky md:top-0 md:h-screen md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <img src="/logo_horizontal-04.png" alt="MOMIA" className="h-8 md:h-12 w-auto object-contain" style={{ filter: 'drop-shadow(0px 0px 8px rgba(0,180,216,0.15))' }} />
          <button className="md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto">
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

        <div className="mt-auto w-full p-4 border-t" style={{ borderColor: 'var(--border)' }}>
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
        <div className="relative" ref={notifMenuRef}>
          <button 
            onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsProfileOpen(false); }}
            className="relative p-2 rounded-full hover:bg-white/5 transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full border border-black" style={{ backgroundColor: 'var(--primary)' }}></span>
            )}
          </button>
          
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border border-white/10 shadow-2xl overflow-hidden bg-[#09090b] p-0 z-50">
              <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
                <h3 className="font-bold">Notificaciones</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-primary hover:underline">Marcar todo como leído</button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.filter(n => !(n.type === 'CHAT' && n.is_read)).length === 0 ? (
                  <div className="p-4 text-center text-sm opacity-50">No tienes notificaciones</div>
                ) : (
                  notifications.filter(n => !(n.type === 'CHAT' && n.is_read)).map(notif => (
                    <div 
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`p-4 border-b border-white/5 cursor-pointer transition-colors ${notif.is_read ? 'opacity-60 hover:bg-white/5' : 'bg-white/5 hover:bg-white/10'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-semibold">{notif.title}</p>
                        {!notif.is_read && <span className="w-2 h-2 rounded-full bg-primary mt-1"></span>}
                      </div>
                      <p className="text-xs">{notif.message}</p>
                      <p className="text-xs opacity-50 mt-2">{new Date(notif.created_at).toLocaleString('es-CR')}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative" ref={profileMenuRef}>
          <button 
            onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotificationsOpen(false); }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            {userName && <span className="hidden md:block text-sm font-medium opacity-80 group-hover:opacity-100 transition-opacity">{userName}</span>}
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white group-hover:scale-105 transition-transform overflow-hidden" style={{ backgroundColor: 'var(--primary)' }}>
              {avatarUrl ? (
                <img src={`${avatarUrl?.startsWith('http') ? '' : (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001')}${avatarUrl}`} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                role[0].toUpperCase()
              )}
            </div>
          </button>
          
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 shadow-2xl overflow-hidden bg-[#09090b] p-0 z-50">
              <div className="p-4 border-b border-white/10 bg-white/5">
                <p className="font-bold">{userName || 'Usuario'}</p>
                <p className="text-xs opacity-60 capitalize truncate">{role}</p>
              </div>
              <div className="p-2">
                <button 
                  onClick={() => { router.push('/profile'); setIsProfileOpen(false); }}
                  className="w-full text-left p-2 text-sm rounded-lg hover:bg-white/10 transition-colors"
                >
                  Mi Perfil
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
