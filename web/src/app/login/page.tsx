'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001") + '/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: email,
          password: password,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('role', data.role);
        
        toast.success('Sesión iniciada');
        
        if (data.role === 'admin') {
          router.push('/admin/users');
        } else if (data.role === 'coach') {
          router.push('/coach/dashboard');
        } else {
          router.push('/athlete/dashboard');
        }
      } else {
        const errData = await res.json();
        toast.error(errData.detail || 'Error al iniciar sesión');
      }
    } catch (err: any) {
      toast.error('Error de conexión');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--background)' }}>
      <div className="glass-card w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img src="/logo_horizontal-04.png" alt="MOMIA Training System" className="h-12 object-contain" style={{ filter: 'drop-shadow(0px 0px 10px rgba(0,180,216,0.3))' }} />
        </div>
        <h2 className="text-xl mb-6 text-center">Iniciar Sesión</h2>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 rounded-lg focus:outline-none"
            style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 rounded-lg focus:outline-none"
            style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
            autoComplete="current-password"
            required
          />
          <button type="submit" className="btn-primary mt-2">Ingresar</button>
        </form>
        <p className="mt-6 text-center text-sm" style={{ opacity: 0.7 }}>
          ¿No tienes cuenta? <a href="/register" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Regístrate aquí</a>
        </p>
      </div>
    </div>
  );
}
