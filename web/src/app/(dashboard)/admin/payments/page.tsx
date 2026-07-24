'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, CheckCircle, Clock, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Payment {
  id: number;
  user_id: number;
  amount: string;
  currency: string;
  payment_method: string;
  status: string;
  receipt_url: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    address?: string;
    avatar_url?: string;
  };
}

export default function AdminPayments() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  const fetchPayments = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001") + '/payments/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      }
    } catch (err) {
      toast.error("Error al cargar pagos");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [router]);

  const approvePayment = async (paymentId: number) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001"}/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        toast.success("Pago Aprobado");
        fetchPayments();
      } else {
        toast.error("Error al aprobar");
      }
    } catch (err) {
      console.error("Error aprobando pago", err);
    }
  };

  const rejectPayment = async (paymentId: number) => {
    if(!confirm("¿Seguro que deseas rechazar este pago?")) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001"}/payments/${paymentId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        toast.success("Pago Rechazado");
        fetchPayments();
      } else {
        toast.error("Error al rechazar");
      }
    } catch (err) {
      console.error("Error rechazando pago", err);
    }
  };

  const filteredPayments = payments.filter(p => p.status === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-black/20 p-6 rounded-2xl border border-white/5 mb-8">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>Gestión de Pagos</h1>
          <p className="opacity-70 mt-1">Revisa comprobantes y aprueba transacciones manuales.</p>
        </div>
      </div>

      <div className="flex gap-4 border-b border-white/10 mb-6">
        <button 
          onClick={() => setActiveTab('PENDING')} 
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'PENDING' ? 'border-[var(--primary)] text-[var(--primary)]' : 'border-transparent opacity-60 hover:opacity-100'}`}
        >
          <Clock size={18} /> Pendientes
        </button>
        <button 
          onClick={() => setActiveTab('APPROVED')} 
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'APPROVED' ? 'border-green-500 text-green-500' : 'border-transparent opacity-60 hover:opacity-100'}`}
        >
          <CheckCircle size={18} /> Aprobados
        </button>
        <button 
          onClick={() => setActiveTab('REJECTED')} 
          className={`pb-3 px-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'REJECTED' ? 'border-red-500 text-red-500' : 'border-transparent opacity-60 hover:opacity-100'}`}
        >
          <XCircle size={18} /> Rechazados
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64 opacity-50">
           Cargando pagos...
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPayments.length === 0 ? (
            <div className="text-center p-12 glass-card opacity-70">
              No hay pagos {activeTab === 'PENDING' ? 'pendientes' : activeTab === 'APPROVED' ? 'aprobados' : 'rechazados'}.
            </div>
          ) : (
            filteredPayments.map((payment) => (
              <div key={payment.id} className={`glass-card flex flex-col md:flex-row justify-between items-center gap-4 ${payment.status === 'APPROVED' ? 'border-green-500/30' : payment.status === 'REJECTED' ? 'border-red-500/30' : ''}`}>
                <div className="flex-1 w-full md:w-auto border-b md:border-b-0 border-white/10 pb-4 md:pb-0">
                  <div className="flex items-center gap-3 mb-2">
                    {payment.user?.avatar_url ? (
                      <img src={`${payment.user.avatar_url?.startsWith(\"http\") ? \"\" : (process.env.NEXT_PUBLIC_API_URL || \"http://127.0.0.1:8001\")}${payment.user.avatar_url}`} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-white/10" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs" style={{ color: 'var(--primary)' }}>
                        {payment.user?.first_name?.[0]}{payment.user?.last_name?.[0]}
                      </div>
                    )}
                    <span className="font-bold text-lg">{payment.user ? `${payment.user.first_name} ${payment.user.last_name}` : `Usuario #${payment.user_id}`}</span>
                    <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-white/10">
                      {payment.payment_method}
                    </span>
                    {payment.status === 'APPROVED' && <span className="px-2 py-0.5 rounded text-xs font-bold text-green-400 bg-green-500/10">APROBADO</span>}
                    {payment.status === 'REJECTED' && <span className="px-2 py-0.5 rounded text-xs font-bold text-red-400 bg-red-500/10">RECHAZADO</span>}
                  </div>
                  
                  {payment.user && (
                    <div className="text-xs opacity-70 mb-3 space-y-1">
                      <p>📧 {payment.user.email}</p>
                      {payment.user.phone && <p>📱 {payment.user.phone}</p>}
                      {payment.user.address && <p>📍 {payment.user.address}</p>}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4">
                    <p className="text-2xl font-black text-[var(--primary)]">{payment.amount} {payment.currency}</p>
                    <button 
                      onClick={() => router.push(`/messages?userId=${payment.user_id}`)}
                      className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors text-xs font-semibold"
                    >
                      💬 Contactar
                    </button>
                  </div>
                </div>
                
                <div className="flex-1 w-full text-left md:text-center">
                  {payment.receipt_url ? (
                    <button onClick={() => setSelectedReceipt(payment.receipt_url)} className="text-sm font-semibold underline hover:text-[var(--primary)] transition-colors cursor-pointer">
                      Ver Comprobante Adjunto
                    </button>
                  ) : (
                    <span className="text-sm opacity-50">Sin comprobante</span>
                  )}
                </div>

                <div className="flex gap-2 w-full md:w-auto justify-end">
                  {payment.status === 'PENDING' && (
                    <>
                      <button onClick={() => approvePayment(payment.id)} className="btn-primary" style={{ backgroundColor: 'var(--success)', color: 'white' }}>
                        ✓ Aprobar
                      </button>
                      <button onClick={() => rejectPayment(payment.id)} className="btn-primary" style={{ backgroundColor: 'var(--error)', color: 'white' }}>
                        ✕ Rechazar
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {selectedReceipt && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedReceipt(null)}>
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedReceipt(null)} className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
              <X size={24} />
            </button>
            <div className="bg-zinc-900 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center min-w-[300px] min-h-[300px]">
              {selectedReceipt.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                <img src={selectedReceipt} alt="Comprobante" className="max-w-full max-h-[85vh] object-contain" />
              ) : selectedReceipt.match(/\.pdf$/i) ? (
                <iframe src={selectedReceipt} className="w-[80vw] max-w-4xl h-[85vh]" />
              ) : (
                <div className="p-8 text-center">
                  <p className="mb-4">No se puede previsualizar este tipo de archivo.</p>
                  <a href={selectedReceipt} target="_blank" rel="noopener noreferrer" className="btn-primary inline-block">Descargar o Abrir Archivo</a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
