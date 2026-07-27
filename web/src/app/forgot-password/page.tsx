"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";
      const res = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Error al solicitar restablecimiento de contraseña");
      }
      
      setMessage(data.message || "Revisa tu correo para continuar con el restablecimiento.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white font-sans flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background styling to match login */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-2/3 h-2/3 bg-[var(--primary)] opacity-10 blur-[150px] rounded-full mix-blend-screen pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-[var(--accent)] opacity-5 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
      </div>
      
      <div className="max-w-md w-full relative z-10 backdrop-blur-md bg-white/5 p-8 rounded-2xl border border-white/10 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tight mb-2 uppercase" style={{ color: "var(--primary)" }}>Recuperar Contraseña</h1>
          <p className="text-gray-400">Ingresa tu correo para recibir un enlace de restablecimiento.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-semibold tracking-wide text-gray-300">CORREO ELECTRÓNICO</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="p-3 rounded-lg focus:outline-none transition-all duration-300"
              style={{ backgroundColor: "var(--surface)", color: "var(--foreground)", border: "1px solid var(--border)" }}
              placeholder="tu@correo.com"
            />
          </div>
          
          {error && <div className="text-red-400 text-sm p-3 bg-red-400/10 rounded-lg">{error}</div>}
          {message && <div className="text-green-400 text-sm p-3 bg-green-400/10 rounded-lg">{message}</div>}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full p-4 rounded-lg font-bold text-black uppercase tracking-wider transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            style={{ backgroundColor: "var(--primary)" }}
          >
            {loading ? "Enviando..." : "Enviar enlace"}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-white/10 pt-6">
          <Link href="/login" className="text-sm font-semibold hover:underline" style={{ color: "var(--primary)" }}>
            ← Volver al Login
          </Link>
        </div>
      </div>
    </main>
  );
}
