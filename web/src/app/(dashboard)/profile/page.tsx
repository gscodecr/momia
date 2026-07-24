'use client';
import { useState, useEffect, useRef } from 'react';
import { User, Mail, Shield, Camera, Save, Activity, HeartPulse, Scale, Edit3, Trash2, Phone, Calendar, UserCircle, CreditCard, MapPin, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import LogoLoader from '@/components/LogoLoader';

export default function ProfilePage() {
  const [role, setRole] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [paymentPreference, setPaymentPreference] = useState('');
  const [subscriptionType, setSubscriptionType] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState('');
  
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  
  const [ftp, setFtp] = useState('');
  const [discipline, setDiscipline] = useState('');
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [injuries, setInjuries] = useState<any[]>([]);
  const [hrZones, setHrZones] = useState({ z1: '', z2: '', z3: '', z4: '', z5: '' });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Avatar Modal
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal for Injury
  const [showInjuryModal, setShowInjuryModal] = useState(false);
  const [currentInjury, setCurrentInjury] = useState<any>(null);

  useEffect(() => {
    setRole(localStorage.getItem('role'));
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001") + '/auth/me', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        setFirstName(data.first_name || '');
        setLastName(data.last_name || '');
        setAvatarUrl(data.avatar_url || '');
        setPhone(data.phone || '');
        setAddress(data.address || '');
        setBirthDate(data.birth_date || '');
        setGender(data.gender || '');
        setPaymentPreference(data.payment_preference || '');
        setSubscriptionType(data.subscription_type || '');
        setSubscriptionStatus(data.subscription_status || 'Activo');
        setEmergencyContactName(data.emergency_contact_name || '');
        setEmergencyContactPhone(data.emergency_contact_phone || '');
        
        if (data.athlete_profile) {
          setFtp(data.athlete_profile.ftp || '');
          setDiscipline(data.athlete_profile.discipline || '');
          setWeight(data.athlete_profile.weight || '');
          setBodyFat(data.athlete_profile.body_fat || '');
          if (data.athlete_profile.injuries) {
            try {
              const parsed = JSON.parse(data.athlete_profile.injuries);
              setInjuries(Array.isArray(parsed) ? parsed : []);
            } catch (e) {
              setInjuries([{ id: Date.now(), title: 'Historial', date: '', description: data.athlete_profile.injuries, status: 'Observación' }]);
            }
          } else {
            setInjuries([]);
          }
          if (data.athlete_profile.heart_rate_zones) {
            try {
              setHrZones(JSON.parse(data.athlete_profile.heart_rate_zones));
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      toast.error('Error al cargar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const submitAvatar = async () => {
    if (!avatarFile) return;
    
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('file', avatarFile);

    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001") + '/auth/me/avatar', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setAvatarUrl(data.avatar_url);
        toast.success('Avatar actualizado');
        setShowAvatarModal(false);
        window.dispatchEvent(new Event('profileUpdated'));
      } else {
        toast.error('Error al subir avatar');
      }
    } catch (error) {
      toast.error('Error de red al subir avatar');
    } finally {
      setUploadingAvatar(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {};
      if (firstName !== user?.first_name) payload.first_name = firstName;
      if (lastName !== user?.last_name) payload.last_name = lastName;
      if (password) payload.password = password;
      if (phone !== (user?.phone || '')) payload.phone = phone;
      if (address !== (user?.address || '')) payload.address = address;
      if (birthDate !== (user?.birth_date || '')) payload.birth_date = birthDate;
      if (gender !== (user?.gender || '')) payload.gender = gender;
      if (paymentPreference !== (user?.payment_preference || '')) payload.payment_preference = paymentPreference;
      if (subscriptionType !== (user?.subscription_type || '')) payload.subscription_type = subscriptionType;
      if (subscriptionStatus !== (user?.subscription_status || 'Activo')) payload.subscription_status = subscriptionStatus;
      if (emergencyContactName !== (user?.emergency_contact_name || '')) payload.emergency_contact_name = emergencyContactName;
      if (emergencyContactPhone !== (user?.emergency_contact_phone || '')) payload.emergency_contact_phone = emergencyContactPhone;
      
      if (role === 'athlete') {
        const currentFtp = user?.athlete_profile?.ftp || '';
        const currentInjuries = user?.athlete_profile?.injuries || '';
        const currentZones = user?.athlete_profile?.heart_rate_zones || '{}';
        
        if (String(ftp) !== String(currentFtp)) payload.ftp = ftp ? Number(ftp) : null;
        if (discipline !== (user?.athlete_profile?.discipline || '')) payload.discipline = discipline;
        if (weight !== (user?.athlete_profile?.weight || '')) payload.weight = weight;
        if (bodyFat !== (user?.athlete_profile?.body_fat || '')) payload.body_fat = bodyFat;
        
        const newInjuriesStr = injuries.length > 0 ? JSON.stringify(injuries) : '';
        if (newInjuriesStr !== currentInjuries) payload.injuries = newInjuriesStr;
        
        const newZonesStr = JSON.stringify(hrZones);
        if (newZonesStr !== currentZones) payload.heart_rate_zones = newZonesStr;
      }

      if (Object.keys(payload).length === 0) {
        toast('No hay cambios que guardar', { icon: 'ℹ️' });
        setSaving(false);
        return;
      }

      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001") + '/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        toast.success('Perfil actualizado correctamente');
        setPassword(''); // clear password field
        fetchProfile();
      } else {
        toast.error('Error al actualizar');
      }
    } catch (err) {
      toast.error('Error de red');
    } finally {
      setSaving(false);
    }
  };

  const saveInjuriesToBackend = async (newInjuries: any[]) => {
    try {
      const payload = { injuries: newInjuries.length > 0 ? JSON.stringify(newInjuries) : '' };
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001") + '/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) toast.error('Error guardando lesiones en el servidor');
    } catch (e) {
      toast.error('Error de red al guardar lesiones');
    }
  };

  const handleSaveInjury = () => {
    if (!currentInjury.title || !currentInjury.date) {
      toast.error('El título y la fecha son obligatorios');
      return;
    }
    
    let updated;
    if (injuries.find(i => i.id === currentInjury.id)) {
      updated = injuries.map(i => i.id === currentInjury.id ? currentInjury : i);
    } else {
      updated = [...injuries, currentInjury];
    }
    setInjuries(updated);
    saveInjuriesToBackend(updated);
    setShowInjuryModal(false);
  };

  const deleteInjury = (id: number) => {
    const updated = injuries.filter(i => i.id !== id);
    setInjuries(updated);
    saveInjuriesToBackend(updated);
    toast.success('Lesión eliminada del expediente');
  };

  if (loading) return <div className="p-12 text-center opacity-50">Cargando perfil...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-white to-white/50 bg-clip-text text-transparent">Configuración de Perfil</h1>
          <p className="opacity-60 mt-2 text-lg">Personaliza tu cuenta y mantén tu expediente deportivo al día</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="btn-primary flex items-center gap-2 px-8 py-3 text-lg font-bold shadow-lg shadow-[var(--primary)]/20"
        >
          {saving ? <LogoLoader size={20} /> : <Save size={20} />}
          <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar & Account Basic */}
        <div className="space-y-8">
          <div className="glass-card flex flex-col items-center text-center p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[var(--primary)]/20 to-transparent"></div>
            
            <div 
              onClick={() => {
                setAvatarFile(null);
                setAvatarPreview(null);
                setShowAvatarModal(true);
              }}
              className="relative group cursor-pointer mb-6 z-10"
            >
              <div className="w-40 h-40 rounded-full flex items-center justify-center text-6xl font-bold border-4 border-zinc-800 overflow-hidden bg-[var(--primary)] text-white shadow-2xl transition-transform duration-300 group-hover:scale-105">
                {uploadingAvatar ? (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <LogoLoader size={40} />
                  </div>
                ) : avatarUrl ? (
                  <img src={`${avatarUrl?.startsWith(\"http\") ? \"\" : (process.env.NEXT_PUBLIC_API_URL || \"http://127.0.0.1:8001\")}${avatarUrl}`} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  role ? role[0].toUpperCase() : 'U'
                )}
              </div>
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                <div className="flex flex-col items-center gap-2 text-white">
                  <Camera size={28} />
                  <span className="text-sm font-semibold">Cambiar Foto</span>
                </div>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-1 z-10">{user?.first_name} {user?.last_name}</h2>
            <div className="flex items-center gap-2 mb-4 z-10">
              <span className="px-3 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full text-xs font-bold uppercase tracking-wider">
                {role}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${user?.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {user?.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <p className="text-sm opacity-50 flex items-center gap-2 justify-center w-full bg-black/20 p-3 rounded-lg border border-white/5 z-10">
              <Mail size={16} /> {user?.email}
            </p>
          </div>

          {/* Security Card */}
          <div className="glass-card space-y-6 relative overflow-hidden">
            <h3 className="text-lg font-bold flex items-center gap-2 border-b border-white/10 pb-4 relative z-10">
              <Shield className="text-[var(--primary)]" size={20} /> Seguridad
            </h3>
            <div className="space-y-4 relative z-10">
              <div className="space-y-2">
                <label className="text-sm font-semibold opacity-70 ml-1">Contacto de Emergencia (Nombre)</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-[var(--primary)] transition-colors">
                    <User size={18} />
                  </div>
                  <input 
                    type="text" 
                    value={emergencyContactName} 
                    onChange={e => setEmergencyContactName(e.target.value)} 
                    placeholder="Ej: Mamá, Esposo..." 
                    className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 focus:border-[var(--primary)] focus:bg-white/10 focus:outline-none transition-all placeholder:text-white/20" 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold opacity-70 ml-1">Teléfono de Emergencia</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-[var(--primary)] transition-colors">
                    <Phone size={18} />
                  </div>
                  <input 
                    type="tel" 
                    value={emergencyContactPhone} 
                    onChange={e => setEmergencyContactPhone(e.target.value)} 
                    placeholder="+506 8888-8888" 
                    className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 focus:border-[var(--primary)] focus:bg-white/10 focus:outline-none transition-all placeholder:text-white/20" 
                  />
                </div>
              </div>
              
              <div className="space-y-2 pt-4 border-t border-white/5">
                <label className="text-sm font-semibold opacity-70 ml-1">Estado de Suscripción</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-[var(--primary)] transition-colors">
                    <Activity size={18} />
                  </div>
                  <select value={subscriptionStatus} onChange={e => setSubscriptionStatus(e.target.value)} className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 focus:border-[var(--primary)] focus:bg-white/10 focus:outline-none transition-all appearance-none cursor-pointer">
                    <option value="Activo" className="bg-zinc-900">Activo</option>
                    <option value="Pausada" className="bg-zinc-900">Pausada</option>
                    <option value="Cancelada" className="bg-zinc-900">Cancelada</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-white/5">
                <label className="text-sm font-semibold opacity-70 ml-1">Nueva Contraseña</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-[var(--primary)] transition-colors">
                    <Lock size={18} />
                  </div>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="••••••••" 
                    className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 focus:border-[var(--primary)] focus:bg-white/10 focus:outline-none transition-all placeholder:text-white/20" 
                  />
                </div>
                <p className="text-xs opacity-50 ml-1">Déjalo en blanco si no deseas cambiarla.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Profile details & Athlete Data */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Personal Info */}
          <div className="glass-card space-y-6">
            <h3 className="text-xl font-bold flex items-center gap-2 border-b border-white/10 pb-4">
              <User className="text-[var(--primary)]" size={24} /> Datos Personales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Nombre */}
              <div className="space-y-2">
                <label className="text-sm font-semibold opacity-70 ml-1">Nombre</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-[var(--primary)] transition-colors">
                    <User size={18} />
                  </div>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 focus:border-[var(--primary)] focus:bg-white/10 focus:outline-none transition-all placeholder:text-white/20" placeholder="Tu nombre" />
                </div>
              </div>
              
              {/* Apellido */}
              <div className="space-y-2">
                <label className="text-sm font-semibold opacity-70 ml-1">Apellido</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-[var(--primary)] transition-colors">
                    <User size={18} />
                  </div>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 focus:border-[var(--primary)] focus:bg-white/10 focus:outline-none transition-all placeholder:text-white/20" placeholder="Tu apellido" />
                </div>
              </div>
              
              {/* Correo Electrónico */}
              <div className="space-y-2">
                <label className="text-sm font-semibold opacity-70 ml-1">Correo Electrónico (Login)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/30">
                    <Mail size={18} />
                  </div>
                  <input type="email" value={user?.email || ''} readOnly className="w-full py-3.5 pl-11 pr-12 rounded-xl bg-black/40 border border-white/5 opacity-70 cursor-not-allowed focus:outline-none text-white/70" />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-white/30">
                    <Lock size={16} />
                  </div>
                </div>
                <p className="text-xs text-white/40 ml-1">No modificable por seguridad.</p>
              </div>
              
              {/* Celular */}
              <div className="space-y-2">
                <label className="text-sm font-semibold opacity-70 ml-1">Celular</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-[var(--primary)] transition-colors">
                    <Phone size={18} />
                  </div>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 focus:border-[var(--primary)] focus:bg-white/10 focus:outline-none transition-all placeholder:text-white/20" placeholder="+506 8888-8888" />
                </div>
              </div>
              
              {/* Fecha de Nacimiento */}
              <div className="space-y-2">
                <label className="text-sm font-semibold opacity-70 ml-1">Fecha de Nacimiento</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-[var(--primary)] transition-colors">
                    <Calendar size={18} />
                  </div>
                  <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 focus:border-[var(--primary)] focus:bg-white/10 focus:outline-none transition-all [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:invert" />
                </div>
              </div>
              
              {/* Género */}
              <div className="space-y-2">
                <label className="text-sm font-semibold opacity-70 ml-1">Género</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-[var(--primary)] transition-colors">
                    <UserCircle size={18} />
                  </div>
                  <select value={gender} onChange={e => setGender(e.target.value)} className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 focus:border-[var(--primary)] focus:bg-white/10 focus:outline-none transition-all appearance-none cursor-pointer">
                    <option value="" className="bg-zinc-900 text-white/50">Selecciona tu género</option>
                    <option value="Masculino" className="bg-zinc-900">Masculino</option>
                    <option value="Femenino" className="bg-zinc-900">Femenino</option>
                    <option value="Otro" className="bg-zinc-900">Otro</option>
                    <option value="Prefiero no decirlo" className="bg-zinc-900">Prefiero no decirlo</option>
                  </select>
                </div>
              </div>
              
              {/* Preferencia de Pago */}
              <div className="space-y-2">
                <label className="text-sm font-semibold opacity-70 ml-1">Preferencia de Pago</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-[var(--primary)] transition-colors">
                    <CreditCard size={18} />
                  </div>
                  <select value={paymentPreference} onChange={e => setPaymentPreference(e.target.value)} className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 focus:border-[var(--primary)] focus:bg-white/10 focus:outline-none transition-all appearance-none cursor-pointer">
                    <option value="" className="bg-zinc-900 text-white/50">Selecciona un método</option>
                    <option value="Tarjeta" className="bg-zinc-900">Tarjeta</option>
                    <option value="Transferencia" className="bg-zinc-900">Transferencia</option>
                    <option value="Sinpe" className="bg-zinc-900">Sinpe</option>
                  </select>
                </div>
              </div>
              
              {/* Tipo de Suscripción */}
              <div className="space-y-2">
                <label className="text-sm font-semibold opacity-70 ml-1">Tipo de Suscripción</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/40 group-focus-within:text-[var(--primary)] transition-colors">
                    <Calendar size={18} />
                  </div>
                  <select value={subscriptionType} onChange={e => setSubscriptionType(e.target.value)} className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 focus:border-[var(--primary)] focus:bg-white/10 focus:outline-none transition-all appearance-none cursor-pointer">
                    <option value="" className="bg-zinc-900 text-white/50">Selecciona un tipo</option>
                    <option value="Mensual" className="bg-zinc-900">Mensual</option>
                    <option value="Trimestral" className="bg-zinc-900">Trimestral</option>
                    <option value="Semestral" className="bg-zinc-900">Semestral</option>
                    <option value="Anual" className="bg-zinc-900">Anual</option>
                  </select>
                </div>
              </div>
              
              {/* Dirección */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-semibold opacity-70 ml-1">Dirección</label>
                <div className="relative group">
                  <div className="absolute top-4 left-0 pl-4 pointer-events-none text-white/40 group-focus-within:text-[var(--primary)] transition-colors">
                    <MapPin size={18} />
                  </div>
                  <textarea value={address} onChange={e => setAddress(e.target.value)} className="w-full py-3.5 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 focus:border-[var(--primary)] focus:bg-white/10 focus:outline-none transition-all placeholder:text-white/20 h-28 resize-none" placeholder="Provincia, Cantón, Distrito, Detalle exacto..." />
                </div>
              </div>
              
            </div>
          </div>

          {/* Athlete Profile */}
          {role === 'athlete' && (
            <div className="glass-card space-y-8">
              <h3 className="text-xl font-bold flex items-center gap-2 border-b border-white/10 pb-4">
                <Activity className="text-[var(--primary)]" size={24} /> Expediente Deportivo
              </h3>
              
              <div className="space-y-4 bg-black/20 p-6 rounded-2xl border border-white/5">
                <label className="text-sm font-semibold opacity-70 block mb-4">Disciplina(s) Principal(es)</label>
                <div className="flex flex-wrap gap-3">
                  {['triatlon', 'ciclismo', 'running', 'natacion'].map(d => {
                    const selected = discipline ? discipline.split(',').includes(d) : false;
                    return (
                      <label key={d} className={`flex items-center gap-2 px-5 py-3 rounded-xl cursor-pointer border-2 transition-all ${selected ? 'bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)] shadow-lg shadow-[var(--primary)]/10' : 'bg-black/40 border-white/5 opacity-70 hover:opacity-100 hover:border-white/20'}`}>
                        <input 
                          type="checkbox" 
                          className="hidden"
                          checked={selected}
                          onChange={(e) => {
                            let current = discipline ? discipline.split(',').filter(Boolean) : [];
                            if (e.target.checked) current.push(d);
                            else current = current.filter(item => item !== d);
                            setDiscipline(current.join(','));
                          }}
                        />
                        <span className="capitalize font-bold">{d}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                <div className="space-y-3">
                  <label className="text-sm font-semibold opacity-70 flex items-center gap-2 ml-1"><Scale size={16}/> Peso (kg)</label>
                  <input type="text" value={weight} onChange={e => setWeight(e.target.value)} placeholder="Ej: 70.5" className="w-full py-3.5 px-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 focus:border-[var(--primary)] focus:bg-white/10 focus:outline-none transition-all placeholder:text-white/20" />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-semibold opacity-70 flex items-center gap-2 ml-1"><Activity size={16}/> % Grasa</label>
                  <input type="text" value={bodyFat} onChange={e => setBodyFat(e.target.value)} placeholder="Ej: 15" className="w-full py-3.5 px-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 focus:border-[var(--primary)] focus:bg-white/10 focus:outline-none transition-all placeholder:text-white/20" />
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-semibold opacity-70 flex items-center gap-2 ml-1"><HeartPulse size={16}/> FTP (Vatios)</label>
                  <input type="number" value={ftp} onChange={e => setFtp(e.target.value)} placeholder="Ej: 250" className="w-full py-3.5 px-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 focus:border-[var(--primary)] focus:bg-white/10 focus:outline-none transition-all placeholder:text-white/20" />
                </div>
              </div>
              
              {/* HR Zones */}
              <div className="space-y-4 bg-black/20 p-6 rounded-2xl border border-white/5">
                <label className="text-sm font-semibold opacity-70 block mb-4">Zonas de Frecuencia Cardíaca (PPM)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {['z1', 'z2', 'z3', 'z4', 'z5'].map((zone, idx) => (
                    <div key={zone} className="space-y-2 bg-white/5 p-3 rounded-xl border border-white/10">
                      <label className="text-xs font-black uppercase text-[var(--primary)] block text-center">Z{idx + 1}</label>
                      <input 
                        type="text" 
                        value={hrZones[zone as keyof typeof hrZones]} 
                        onChange={e => setHrZones({ ...hrZones, [zone]: e.target.value })} 
                        placeholder="120-135" 
                        className="w-full p-2 text-sm text-center font-mono rounded-lg bg-black/40 border border-transparent focus:border-[var(--primary)] focus:bg-black/60 focus:outline-none transition-colors placeholder:text-white/20" 
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Injuries */}
              <div className="space-y-4 bg-black/20 p-6 rounded-2xl border border-white/5">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-b border-white/10 pb-4">
                  <label className="text-lg font-bold">Historial de Lesiones</label>
                  <button 
                    onClick={() => {
                      setCurrentInjury({ id: Date.now(), title: '', date: '', description: '', status: 'Activa' });
                      setShowInjuryModal(true);
                    }}
                    className="text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg transition-all"
                  >
                    + Añadir Lesión
                  </button>
                </div>
                
                {injuries.length === 0 ? (
                  <div className="text-center p-12 border-2 border-dashed border-white/10 rounded-2xl opacity-50 bg-black/20">
                    <HeartPulse size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="font-semibold">Sin lesiones registradas.</p>
                    <p className="text-sm">¡Excelente trabajo manteniéndote sano!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {injuries.map(injury => (
                      <div key={injury.id} className="bg-black/30 border border-white/10 rounded-xl p-5 hover:border-white/20 transition-colors relative group">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold text-lg text-[var(--primary)]">{injury.title}</h4>
                          <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${injury.status === 'Activa' ? 'bg-red-500/20 text-red-400' : injury.status === 'Recuperada' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                            {injury.status}
                          </span>
                        </div>
                        <p className="text-xs font-mono opacity-60 mb-3">{injury.date}</p>
                        <p className="text-sm opacity-80">{injury.description}</p>
                        
                        <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setCurrentInjury(injury); setShowInjuryModal(true); }} className="p-2 bg-black/60 rounded-lg hover:text-[var(--primary)] transition-colors"><Edit3 size={14}/></button>
                          <button onClick={() => deleteInjury(injury.id)} className="p-2 bg-black/60 rounded-lg hover:text-red-400 transition-colors"><Trash2 size={14}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Injury Modal */}
      {showInjuryModal && currentInjury && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#09090b] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-xl font-bold">Detalle de Lesión</h3>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold opacity-70 ml-1">Título de la lesión</label>
                <input 
                  type="text" 
                  value={currentInjury.title} 
                  onChange={e => setCurrentInjury({ ...currentInjury, title: e.target.value })}
                  className="w-full py-3.5 px-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 focus:border-[var(--primary)] focus:bg-white/10 focus:outline-none transition-all placeholder:text-white/20"
                  placeholder="Ej: Esguince de tobillo"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold opacity-70 ml-1">Fecha</label>
                  <input 
                    type="date" 
                    value={currentInjury.date} 
                    onChange={e => setCurrentInjury({ ...currentInjury, date: e.target.value })}
                    className="w-full py-3.5 px-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 focus:border-[var(--primary)] focus:bg-white/10 focus:outline-none transition-all [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold opacity-70 ml-1">Estado</label>
                  <select 
                    value={currentInjury.status} 
                    onChange={e => setCurrentInjury({ ...currentInjury, status: e.target.value })}
                    className="w-full py-3.5 px-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 focus:border-[var(--primary)] focus:bg-white/10 focus:outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="Activa" className="bg-zinc-900">Activa</option>
                    <option value="Observación" className="bg-zinc-900">En Observación</option>
                    <option value="Recuperada" className="bg-zinc-900">Recuperada</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold opacity-70 ml-1">Descripción / Tratamiento</label>
                <textarea 
                  value={currentInjury.description} 
                  onChange={e => setCurrentInjury({ ...currentInjury, description: e.target.value })}
                  className="w-full py-3.5 px-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 focus:border-[var(--primary)] focus:bg-white/10 focus:outline-none transition-all placeholder:text-white/20 h-28 resize-none"
                  placeholder="Detalles sobre el tratamiento, recuperación..."
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-white/5 bg-white/5 flex gap-3">
              <button onClick={() => setShowInjuryModal(false)} className="flex-1 py-3 rounded-xl font-bold bg-white/10 hover:bg-white/20 transition-colors">Cancelar</button>
              <button onClick={handleSaveInjury} className="flex-1 py-3 rounded-xl font-bold btn-primary text-black">Guardar Lesión</button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#09090b] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-bold">Actualizar Foto de Perfil</h3>
            </div>
            
            <div className="p-6 space-y-6 flex flex-col items-center">
              <div className="w-48 h-48 rounded-full flex items-center justify-center text-6xl font-bold border-4 border-zinc-800 overflow-hidden bg-[var(--primary)] text-white shadow-2xl">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : avatarUrl ? (
                  <img src={`${avatarUrl?.startsWith(\"http\") ? \"\" : (process.env.NEXT_PUBLIC_API_URL || \"http://127.0.0.1:8001\")}${avatarUrl}`} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  role ? role[0].toUpperCase() : 'U'
                )}
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleAvatarFileChange}
              />
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <Camera size={18} />
                {avatarFile ? 'Cambiar Selección' : 'Seleccionar Imagen'}
              </button>
            </div>
            
            <div className="p-6 border-t border-white/5 bg-white/5 flex gap-3">
              <button onClick={() => setShowAvatarModal(false)} className="flex-1 py-3 rounded-xl font-bold bg-white/10 hover:bg-white/20 transition-colors">Cancelar</button>
              <button 
                onClick={submitAvatar} 
                disabled={!avatarFile || uploadingAvatar}
                className="flex-1 py-3 rounded-xl font-bold btn-primary text-black disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {uploadingAvatar && <LogoLoader size={16} />}
                {uploadingAvatar ? 'Subiendo...' : 'Subir y Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
