'use client';
import { Send, MessageSquare } from 'lucide-react';

export default function MessagesPage() {
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6">
      {/* Contact List */}
      <div className="glass-card w-full md:w-80 flex flex-col h-full p-0 overflow-hidden border-r border-white/10">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-xl font-bold" style={{ color: 'var(--primary)' }}>Mensajes</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {/* Dummy Contact */}
          <div className="p-4 border-b border-white/5 flex items-center gap-3 cursor-pointer bg-white/5 border-l-2 border-l-[var(--primary)]">
            <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-black flex items-center justify-center font-bold">
              CG
            </div>
            <div>
              <p className="font-semibold">Coach Gerardo</p>
              <p className="text-xs opacity-60 truncate">¡Nos vemos en el fondo de mañana!</p>
            </div>
          </div>
          {/* Another Contact */}
          <div className="p-4 border-b border-white/5 flex items-center gap-3 cursor-pointer hover:bg-white/5 transition-colors">
            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center font-bold">
              GA
            </div>
            <div>
              <p className="font-semibold">Grupo: Aguas Abiertas</p>
              <p className="text-xs opacity-60 truncate">Recuerden llevar boya obligatoria.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="glass-card flex-1 flex flex-col h-full p-0 overflow-hidden relative">
        {/* Chat Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--primary)] text-black flex items-center justify-center font-bold">
              CG
            </div>
            <h2 className="font-bold">Coach Gerardo</h2>
          </div>
          {/* WhatsApp Link Button */}
          <button className="px-4 py-2 text-sm font-semibold bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors flex items-center gap-2 border border-green-500/20">
            <MessageSquare size={16} />
            <span>WhatsApp</span>
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          <div className="flex justify-start">
            <div className="bg-zinc-800 p-3 rounded-2xl rounded-tl-sm max-w-[80%] border border-white/5">
              <p className="text-sm">Hola, ¿cómo te sientes para el chequeo de mañana?</p>
              <span className="text-[10px] opacity-50 mt-1 block">10:45 AM</span>
            </div>
          </div>
          <div className="flex justify-end">
            <div className="p-3 rounded-2xl rounded-tr-sm max-w-[80%] text-black" style={{ backgroundColor: 'var(--primary)' }}>
              <p className="text-sm">Súper bien coach, descansé bien esta semana.</p>
              <span className="text-[10px] opacity-50 mt-1 block text-black/60">11:02 AM</span>
            </div>
          </div>
          <div className="flex justify-start">
            <div className="bg-zinc-800 p-3 rounded-2xl rounded-tl-sm max-w-[80%] border border-white/5">
              <p className="text-sm">¡Excelente! Nos vemos a las 5:00 AM en punto. ¡Descansa!</p>
              <span className="text-[10px] opacity-50 mt-1 block">11:05 AM</span>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/10 bg-black/20 flex gap-2">
          <input 
            type="text" 
            placeholder="Escribe un mensaje..." 
            className="flex-1 p-3 rounded-lg focus:outline-none bg-zinc-900 border border-white/10"
          />
          <button className="p-3 rounded-lg flex items-center justify-center bg-[var(--primary)] text-black hover:opacity-90 transition-opacity">
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
