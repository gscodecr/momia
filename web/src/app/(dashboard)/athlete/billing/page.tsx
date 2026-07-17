'use client';
import { useState, useEffect, useRef } from 'react';
import { CreditCard, Download, Upload, CheckCircle, AlertCircle, RefreshCw, Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AthleteBilling() {
  const [billingInfo, setBillingInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // TiloPay state
  const [autoPay, setAutoPay] = useState(false);
  const [simulatingPayment, setSimulatingPayment] = useState(false);
  
  // SINPE state
  const [sinpeFile, setSinpeFile] = useState<File | null>(null);
  const [sinpePreview, setSinpePreview] = useState<string | null>(null);
  const [uploadingSinpe, setUploadingSinpe] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchBilling();
  }, []);

  const fetchBilling = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8001/payments/me', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBillingInfo(data);
        setAutoPay(data.auto_pay || false);
      }
    } catch (err) {
      toast.error('Error al cargar información de facturación');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutoPay = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setAutoPay(newValue);
    try {
      await fetch(`http://127.0.0.1:8001/payments/auto-pay?auto_pay=${newValue}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      toast.success(newValue ? 'Pago Automático activado' : 'Pago Automático desactivado');
    } catch (err) {
      toast.error('Error al actualizar preferencia');
      setAutoPay(!newValue); // revert
    }
  };

  const handleTiloPaySimulate = async () => {
    setSimulatingPayment(true);
    try {
      const amount = "40000"; // Dummy amount for now
      const desc = `Mensualidad ${new Date().toLocaleString('es-CR', { month: 'long', year: 'numeric' })}`;
      const res = await fetch(`http://127.0.0.1:8001/payments/tilopay/simulate?amount=${amount}&description=${desc}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        toast.success('Pago exitoso simulado. Fecha de corte actualizada.');
        fetchBilling(); // Refresh data
      }
    } catch (err) {
      toast.error('Error al procesar el pago');
    } finally {
      setSimulatingPayment(false);
    }
  };

  const handleSinpeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setSinpeFile(file);
    if (file.type.startsWith('image/')) {
      setSinpePreview(URL.createObjectURL(file));
    } else {
      setSinpePreview(null); // Probably PDF
    }
  };

  const handleSinpeSubmit = async () => {
    if (!sinpeFile) {
      toast.error('Selecciona un archivo primero');
      return;
    }
    
    setUploadingSinpe(true);
    const amount = "40000"; // Dummy amount
    const desc = `Mensualidad ${new Date().toLocaleString('es-CR', { month: 'long', year: 'numeric' })}`;
    
    const formData = new FormData();
    formData.append('file', sinpeFile);

    try {
      const res = await fetch(`http://127.0.0.1:8001/payments/report-sinpe?amount=${amount}&description=${desc}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      
      if (res.ok) {
        toast.success('Comprobante enviado exitosamente');
        setSinpeFile(null);
        setSinpePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        fetchBilling();
      } else {
        toast.error('Error al enviar comprobante');
      }
    } catch (err) {
      toast.error('Error de conexión');
    } finally {
      setUploadingSinpe(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-[var(--primary)]" size={32} /></div>;
  }

  const isUpToDate = billingInfo?.subscription_status === 'Activo';
  const isPaused = billingInfo?.subscription_status === 'Pausada';

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>Facturación y Pagos</h1>
        <p className="opacity-70 mt-1">Gestiona tu mensualidad y métodos de pago</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Estado de Cuenta */}
        <div className="lg:col-span-2 glass-card">
          <h2 className="text-xl font-bold mb-4 border-b border-white/10 pb-2">Estado Actual</h2>
          
          <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 p-6 rounded-xl border ${
            isUpToDate ? 'bg-green-500/10 border-green-500/20' : 
            isPaused ? 'bg-yellow-500/10 border-yellow-500/20' : 
            'bg-red-500/10 border-red-500/20'
          }`}>
            <div className="flex items-center gap-4">
              {isUpToDate ? <CheckCircle className="text-green-400 shrink-0" size={32} /> : 
               isPaused ? <AlertCircle className="text-yellow-400" size={32} /> :
               <AlertCircle className="text-red-400" size={32} />}
              <div>
                <p className={`font-bold text-lg mb-1 ${
                  isUpToDate ? 'text-green-400' : isPaused ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {isUpToDate ? '¡Suscripción Activa!' : isPaused ? 'Suscripción Pausada' : 'Pago Vencido'}
                </p>
                {billingInfo?.next_payment_date ? (
                  <p className="text-sm opacity-80">Próximo corte: {new Date(billingInfo.next_payment_date).toLocaleDateString('es-CR')}</p>
                ) : (
                  <p className="text-sm opacity-80">Próximo corte: No definido</p>
                )}
              </div>
            </div>
            <div className="w-full md:w-auto pt-4 md:pt-0 border-t border-white/10 md:border-t-0 text-left md:text-right">
              <p className="text-2xl font-bold">Suscripción</p>
              <p className="text-xs opacity-60 capitalize">{billingInfo?.subscription_type || 'No definido'}</p>
            </div>
          </div>

          <h2 className="text-xl font-bold mt-8 mb-4 border-b border-white/10 pb-2">Historial de Pagos</h2>
          <div className="space-y-3">
            {billingInfo?.payments?.length === 0 ? (
              <p className="text-center opacity-50 py-4">No hay pagos registrados aún.</p>
            ) : (
              billingInfo?.payments?.map((payment: any) => (
                <div key={payment.id} className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                      <CreditCard size={18} className={payment.status === 'APPROVED' ? 'text-green-400' : 'text-yellow-400'} />
                    </div>
                    <div>
                      <p className="font-semibold">{payment.description || 'Pago'}</p>
                      <p className="text-xs opacity-60">
                        {new Date(payment.created_at).toLocaleDateString('es-CR')} • {payment.payment_method} 
                        {payment.status === 'PENDING' && ' (En Revisión)'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold">₡{Number(payment.amount).toLocaleString('es-CR')}</span>
                    {payment.receipt_url && (
                      <a href={payment.receipt_url} target="_blank" rel="noreferrer" className="p-2 opacity-60 hover:opacity-100 hover:text-[var(--primary)] transition-colors">
                        <Download size={18} />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Métodos de Pago */}
        <div className="space-y-6">
          
          {/* Tilo Pay Box (If prefer Tarjeta) */}
          {billingInfo?.payment_preference === 'Tarjeta' ? (
            <div className="glass-card space-y-4">
              <h2 className="text-xl font-bold mb-2">Pago con Tarjeta</h2>
              <p className="text-sm opacity-70">Genera tu pago seguro de forma manual a través de Tilopay.</p>
              
              <button 
                onClick={handleTiloPaySimulate} 
                disabled={simulatingPayment}
                className="w-full btn-primary flex items-center justify-center gap-2"
              >
                {simulatingPayment ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                <span>Ir a Tilopay</span>
              </button>

              <div className="pt-4 border-t border-white/10">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center mt-0.5">
                    <input 
                      type="checkbox" 
                      checked={autoPay}
                      onChange={handleToggleAutoPay}
                      className="peer sr-only" 
                    />
                    <div className="w-5 h-5 rounded border border-white/20 bg-black/20 peer-checked:bg-[var(--primary)] peer-checked:border-[var(--primary)] transition-all"></div>
                    <CheckCircle size={14} className="absolute text-black opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm group-hover:text-white transition-colors">Pago Automático</p>
                    <p className="text-xs opacity-60 mt-1">Autorizo realizar el cobro automático de mi suscripción.</p>
                  </div>
                </label>
              </div>
            </div>
          ) : (
            /* SINPE/Transferencia Box */
            <div className="glass-card space-y-4">
              <h2 className="text-xl font-bold mb-2">Reportar SINPE / Transf.</h2>
              <p className="text-sm opacity-70">Sube la imagen o captura de tu comprobante de pago para revisión.</p>
              
              <div className="relative">
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleSinpeFileChange}
                  accept="image/*,.pdf"
                  className="hidden" 
                  id="receipt-upload"
                />
                <label htmlFor="receipt-upload" className="w-full p-6 rounded-xl border-2 border-dashed border-white/20 hover:border-white/40 bg-black/20 hover:bg-white/5 transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group">
                  {sinpePreview ? (
                    <img src={sinpePreview} alt="Preview" className="h-24 object-contain rounded" />
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-[var(--primary)]/20 group-hover:text-[var(--primary)] transition-colors">
                        <Upload size={24} />
                      </div>
                      <span className="text-sm font-semibold opacity-80 group-hover:opacity-100">{sinpeFile ? sinpeFile.name : 'Seleccionar Comprobante'}</span>
                    </>
                  )}
                </label>
              </div>

              {sinpeFile && (
                <button 
                  onClick={handleSinpeSubmit}
                  disabled={uploadingSinpe}
                  className="w-full btn-primary flex items-center justify-center gap-2 mt-4"
                >
                  {uploadingSinpe ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  <span>Enviar Comprobante</span>
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
