'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001') + '/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email: email,
          password: password,
          role_id: 3 // Atleta por defecto
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Error al registrar');
      }

      toast.success('Cuenta creada exitosamente. Espera aprobación del administrador.');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: 'var(--background)' }}>
      <div className="glass-card w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center" style={{ color: 'var(--primary)' }}>Momia TS</h1>
        <h2 className="text-xl mb-6 text-center">Crear Cuenta de Atleta</h2>
        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Nombre"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="p-3 rounded-lg focus:outline-none w-full"
              style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
              required
            />
            <input
              type="text"
              placeholder="Apellidos"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="p-3 rounded-lg focus:outline-none w-full"
              style={{ backgroundColor: 'var(--surface)', color: 'var(--foreground)', border: '1px solid var(--border)' }}
              required
            />
          </div>
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
            autoComplete="new-password"
            required
          />
          <button type="submit" className="btn-primary mt-2">Registrarse</button>
        </form>
        <p className="mt-6 text-center text-sm" style={{ opacity: 0.7 }}>
          ¿Ya tienes cuenta? <a href="/login" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Inicia sesión</a>
        </p>
      </div>
    </div>
  );
}
