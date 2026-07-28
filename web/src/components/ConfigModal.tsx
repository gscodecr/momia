'use client';
import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface ConfigModalProps {
  onClose: () => void;
}

export default function ConfigModal({ onClose }: ConfigModalProps) {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'}/settings/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSettings({
          sinpe_phone: data.sinpe_phone?.value || '',
          bank_account: data.bank_account?.value || '',
          contact_email: data.contact_email?.value || '',
          contact_phone: data.contact_phone?.value || ''
        });
      }
    } catch (error) {
      toast.error('Error al cargar configuraciones');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      settings: Object.keys(settings).map(key => ({
        key,
        value: settings[key]
      }))
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'}/settings/`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success('Configuración guardada exitosamente');
        onClose();
      } else {
        toast.error('Error al guardar configuración');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-900 border border-white/10 rounded-xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/40">
          <h2 className="text-xl font-bold">⚙️ Configuración del Negocio</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex justify-center p-8"><span className="animate-pulse">Cargando...</span></div>
          ) : (
            <>
              <div>
                <label className="text-xs font-bold opacity-70 mb-1 block">TELÉFONO SINPE MÓVIL</label>
                <input 
                  type="text" 
                  name="sinpe_phone"
                  value={settings.sinpe_phone}
                  onChange={handleChange}
                  className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-[var(--primary)] outline-none transition-colors"
                  placeholder="8888-8888"
                />
                <p className="text-xs opacity-50 mt-1">Número donde los atletas realizarán pagos por SINPE.</p>
              </div>

              <div>
                <label className="text-xs font-bold opacity-70 mb-1 block">CUENTA BANCARIA (IBAN)</label>
                <input 
                  type="text" 
                  name="bank_account"
                  value={settings.bank_account}
                  onChange={handleChange}
                  className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-[var(--primary)] outline-none transition-colors"
                  placeholder="CR120152010010XXXXXXX"
                />
                <p className="text-xs opacity-50 mt-1">Cuenta IBAN para transferencias bancarias.</p>
              </div>

              <div>
                <label className="text-xs font-bold opacity-70 mb-1 block">CORREO DE SOPORTE</label>
                <input 
                  type="email" 
                  name="contact_email"
                  value={settings.contact_email}
                  onChange={handleChange}
                  className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-[var(--primary)] outline-none transition-colors"
                  placeholder="info@momiats.com"
                />
              </div>

              <div>
                <label className="text-xs font-bold opacity-70 mb-1 block">TELÉFONO DE CONTACTO (WHATSAPP)</label>
                <input 
                  type="text" 
                  name="contact_phone"
                  value={settings.contact_phone}
                  onChange={handleChange}
                  className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm focus:border-[var(--primary)] outline-none transition-colors"
                  placeholder="8888-8888"
                />
              </div>
            </>
          )}
        </div>
        
        <div className="p-4 border-t border-white/10 flex justify-end gap-3 bg-black/20">
          <button onClick={onClose} className="px-4 py-2 font-bold opacity-70 hover:opacity-100 transition-opacity">
            Cancelar
          </button>
          <button 
            onClick={handleSave} 
            disabled={saving || loading}
            className="btn-primary flex items-center gap-2"
          >
            <Save size={18} />
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}
