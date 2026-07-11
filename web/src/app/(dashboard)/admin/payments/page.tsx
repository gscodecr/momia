'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Payment {
  id: number;
  user_id: number;
  amount: string;
  currency: string;
  payment_method: string;
  status: string;
  receipt_url: string;
}

export default function AdminPayments() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    try {
      const res = await fetch('http://127.0.0.1:8001/payments/pending', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPayments(data);
      }
    } catch (err) {
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
      const res = await fetch(`http://localhost:8000/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        // Recargar la lista después de aprobar
        fetchPayments();
      }
    } catch (err) {
      console.error("Error aprobando pago", err);
    }
  };

  return (
    <div className="min-h-screen p-8" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold" style={{ color: 'var(--primary)' }}>Gestión de Pagos</h1>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--primary)' }}></div>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.length === 0 ? (
            <div className="text-center p-12 glass-card opacity-70">
              No hay pagos pendientes de aprobación.
            </div>
          ) : (
            payments.map((payment) => (
              <div key={payment.id} className="glass-card flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="font-bold text-lg">Usuario #{payment.user_id}</span>
                    <span className="px-2 py-1 rounded text-xs font-semibold" style={{ backgroundColor: '#27272a', border: '1px solid var(--border)' }}>
                      {payment.payment_method}
                    </span>
                  </div>
                  <p className="text-2xl font-light" style={{ color: 'var(--primary)' }}>{payment.amount} {payment.currency}</p>
                </div>
                
                {payment.receipt_url && (
                  <div className="flex-1">
                    <a href={payment.receipt_url} target="_blank" rel="noopener noreferrer" className="text-sm underline hover:text-[var(--primary)] transition-colors">
                      Ver Comprobante Adjunto
                    </a>
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => approvePayment(payment.id)} className="btn-primary" style={{ backgroundColor: 'var(--success)', color: 'white' }}>
                    ✓ Aprobar
                  </button>
                  <button className="btn-primary" style={{ backgroundColor: 'var(--error)', color: 'white' }}>
                    ✕ Rechazar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
