'use client';
import { CreditCard, Download, Upload } from 'lucide-react';

export default function AthleteBilling() {
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
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-6 bg-green-500/10 border border-green-500/20 rounded-xl">
            <div>
              <p className="text-green-400 font-bold text-lg mb-1">¡Estás al día!</p>
              <p className="text-sm opacity-80">Próximo corte: 15 de Noviembre</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">₡40,000</p>
              <p className="text-xs opacity-60">Mensualidad Base</p>
            </div>
          </div>

          <h2 className="text-xl font-bold mt-8 mb-4 border-b border-white/10 pb-2">Historial de Pagos</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 hover:bg-white/5 rounded-lg border border-transparent hover:border-white/10 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                  <CreditCard size={18} />
                </div>
                <div>
                  <p className="font-semibold">Mensualidad Octubre</p>
                  <p className="text-xs opacity-60">15 Oct 2026 • Tarjeta *4582</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-bold">₡40,000</span>
                <button className="p-2 opacity-60 hover:opacity-100 hover:text-[var(--primary)] transition-colors">
                  <Download size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Métodos de Pago */}
        <div className="space-y-6">
          <div className="glass-card">
            <h2 className="text-xl font-bold mb-4">Pagar con Tarjeta</h2>
            <p className="text-sm opacity-70 mb-4">Paga de forma segura usando nuestra pasarela de pagos Tilopay.</p>
            <button className="w-full btn-primary flex items-center justify-center gap-2">
              <CreditCard size={18} />
              <span>Ir a Tilopay</span>
            </button>
          </div>

          <div className="glass-card border border-white/5 bg-zinc-900/50">
            <h2 className="text-xl font-bold mb-4">Reportar SINPE</h2>
            <p className="text-sm opacity-70 mb-4">Si realizaste una transferencia, sube tu comprobante aquí.</p>
            <button className="w-full p-3 rounded-lg border border-dashed border-white/20 hover:bg-white/5 transition-colors flex flex-col items-center justify-center gap-2 opacity-80 hover:opacity-100 text-sm">
              <Upload size={24} className="opacity-50" />
              <span>Subir Imagen o PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
