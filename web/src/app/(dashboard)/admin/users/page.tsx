'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { UserPlus, Shield, Activity, User, CheckCircle2, XCircle, Search } from 'lucide-react';
import LogoLoader from '@/components/LogoLoader';

interface Role {
  id: number;
  name: string;
}

interface UserData {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_approved: boolean;
  is_active: boolean;
  role: Role;
}

export default function AdminUsers() {
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('Todos'); // 'Todos', 'Admin', 'Coach', 'Athlete'
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newRoleId, setNewRoleId] = useState<number>(3); // Default to athlete
  const [addingUser, setAddingUser] = useState(false);

  useEffect(() => {
    fetchData();
  }, [router]);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch((process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001") + '/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch((process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001") + '/admin/roles', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (usersRes.ok && rolesRes.ok) {
        setUsers(await usersRes.json());
        setRoles(await rolesRes.json());
      }
    } catch (err) {
      console.error(err);
      toast.error('Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingUser(true);
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001") + '/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          email: newEmail,
          password: newPassword,
          first_name: newFirstName,
          last_name: newLastName,
          role_id: Number(newRoleId)
        })
      });
      if (res.ok) {
        toast.success('Usuario creado exitosamente');
        setShowAddModal(false);
        setNewEmail(''); setNewPassword(''); setNewFirstName(''); setNewLastName(''); setNewRoleId(3);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.detail || 'Error al crear usuario');
      }
    } catch (err) {
      toast.error('Error de red');
    } finally {
      setAddingUser(false);
    }
  };

  const updateRole = async (userId: number, roleId: number) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001"}/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ role_id: roleId })
      });
      if (res.ok) {
        toast.success('Rol actualizado');
        fetchData();
      } else {
        toast.error('Error al actualizar rol');
      }
    } catch (err) {
      toast.error('Error de red');
    }
  };

  const updateStatus = async (userId: number, field: 'is_active' | 'is_approved', value: boolean) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001"}/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ [field]: value })
      });
      if (res.ok) {
        toast.success('Estado actualizado');
        fetchData();
      } else {
        toast.error('Error al actualizar estado');
      }
    } catch (err) {
      toast.error('Error de red');
    }
  };

  const updateCoach = async (userId: number, coachId: number | null) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001"}/admin/users/${userId}/coach`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ coach_id: coachId })
      });
      if (res.ok) {
        toast.success('Entrenador asignado');
        fetchData();
      } else {
        toast.error('Error al asignar entrenador');
      }
    } catch (err) {
      toast.error('Error de red');
    }
  };

  const coaches = users.filter(u => {
    const roleName = u.role?.name?.toLowerCase();
    return roleName === 'coach' || roleName === 'admin';
  });
  const filteredUsers = users.filter(u => {
    let matchRole = false;
    if (roleFilter === 'Todos') matchRole = true;
    else if (roleFilter === 'Pendientes') matchRole = !u.is_approved;
    else matchRole = u.role?.name?.toLowerCase() === roleFilter.toLowerCase();
    
    const searchStr = `${u.first_name} ${u.last_name} ${u.email}`.toLowerCase();
    const matchSearch = searchQuery.trim() === '' || searchStr.includes(searchQuery.toLowerCase());
    return matchRole && matchSearch;
  });

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>Gestión de Usuarios</h1>
          <p className="opacity-70 mt-1">Administra roles, accesos y aprobaciones del sistema.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <UserPlus size={18} />
          Añadir Usuario
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2 flex-1">
          {['Todos', 'Pendientes', 'Admin', 'Coach', 'Athlete'].map(filter => (
            <button
              key={filter}
              onClick={() => setRoleFilter(filter)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap ${roleFilter === filter ? 'bg-[var(--primary)] text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 opacity-50" />
          <input 
            type="text" 
            placeholder="Buscar por nombre o correo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/30 border border-white/10 focus:border-[var(--primary)] focus:outline-none transition-colors text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-screen">
          <LogoLoader size={96} />
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="border-b border-white/10 bg-black/20">
                  <th className="p-4 font-semibold opacity-80">Usuario</th>
                  <th className="p-4 font-semibold opacity-80">Contacto</th>
                  <th className="p-4 font-semibold opacity-80">Rol</th>
                  <th className="p-4 font-semibold opacity-80">Entrenador Asignado</th>
                  <th className="p-4 font-semibold opacity-80">Estado</th>
                  <th className="p-4 font-semibold opacity-80">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="font-bold flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] text-xs">
                          {user.first_name.charAt(0)}
                        </div>
                        {user.first_name} {user.last_name}
                      </div>
                    </td>
                    <td className="p-4 text-sm opacity-80">{user.email}</td>
                    <td className="p-4">
                      <select 
                        value={user.role?.id || ''}
                        onChange={(e) => updateRole(user.id, Number(e.target.value))}
                        className="bg-black/20 border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-[var(--primary)] capitalize"
                      >
                        {roles.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4">
                      {user.role?.name?.toLowerCase() === 'athlete' ? (
                        <select
                          value={(user as any).athlete_profile?.coach_id || ''}
                          onChange={(e) => updateCoach(user.id, e.target.value ? Number(e.target.value) : null)}
                          className="bg-black/20 border border-white/10 rounded px-2 py-1 text-sm outline-none focus:border-[var(--primary)]"
                        >
                          <option value="">Sin Asignar</option>
                          {coaches.map(c => (
                            <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-xs opacity-50">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-2">
                        {user.is_approved ? (
                          <span className="text-xs flex items-center gap-1 text-green-400 bg-green-500/10 px-2 py-0.5 rounded w-max">
                            <CheckCircle2 size={12} /> Aprobado
                          </span>
                        ) : (
                          <span className="text-xs flex items-center gap-1 text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded w-max">
                            <Activity size={12} /> Pendiente
                          </span>
                        )}
                        
                        {user.is_active ? (
                          <span className="text-xs flex items-center gap-1 text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded w-max">
                            <Shield size={12} /> Activo
                          </span>
                        ) : (
                          <span className="text-xs flex items-center gap-1 text-red-400 bg-red-500/10 px-2 py-0.5 rounded w-max">
                            <XCircle size={12} /> Inactivo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {!user.is_approved && (
                          <button 
                            onClick={() => updateStatus(user.id, 'is_approved', true)}
                            className="px-3 py-1 rounded text-xs font-semibold transition-colors border bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
                          >
                            Aprobar
                          </button>
                        )}
                        <button 
                          onClick={() => updateStatus(user.id, 'is_active', !user.is_active)}
                          className={`px-3 py-1 rounded text-xs font-semibold transition-colors border ${user.is_active ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20' : 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20'}`}
                        >
                          {user.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="p-8 text-center opacity-50">No hay usuarios registrados.</div>
            )}
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="glass-card w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2 text-[var(--primary)]">
                <UserPlus size={20} /> Añadir Usuario
              </h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs opacity-70 mb-1 block">Nombre</label>
                  <input required value={newFirstName} onChange={e => setNewFirstName(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm focus:border-[var(--primary)] outline-none" />
                </div>
                <div>
                  <label className="text-xs opacity-70 mb-1 block">Apellido</label>
                  <input required value={newLastName} onChange={e => setNewLastName(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm focus:border-[var(--primary)] outline-none" />
                </div>
              </div>
              
              <div>
                <label className="text-xs opacity-70 mb-1 block">Correo Electrónico</label>
                <input type="email" required value={newEmail} onChange={e => setNewEmail(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm focus:border-[var(--primary)] outline-none" />
              </div>

              <div>
                <label className="text-xs opacity-70 mb-1 block">Contraseña Temporal</label>
                <input type="text" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm focus:border-[var(--primary)] outline-none" />
              </div>

              <div>
                <label className="text-xs opacity-70 mb-1 block">Rol del Sistema</label>
                <select required value={newRoleId} onChange={e => setNewRoleId(Number(e.target.value))} className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-sm focus:border-[var(--primary)] outline-none capitalize">
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors font-semibold">
                  Cancelar
                </button>
                <button type="submit" disabled={addingUser} className="btn-primary">
                  {addingUser ? 'Creando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
