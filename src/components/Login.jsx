import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const manejarIngreso = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos.'
          : 'No se pudo iniciar sesión. Intenta de nuevo.'
      );
    }
    setCargando(false);
  };

  return (
    <div className="pantalla-login">
      <div className="tarjeta-login">
        <div className="login-encabezado">
          <span className="login-icono">🏥</span>
          <h1>Centro de Salud</h1>
          <p>Sistema de Control Clínico &amp; Stock</p>
        </div>

        {/* Firma visual: línea de electrocardiograma, un solo trazo */}
        <svg
          className="ecg-firma"
          viewBox="0 0 400 40"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <polyline
            points="0,20 60,20 75,20 85,4 95,36 105,20 130,20 145,20 155,8 162,32 170,20 400,20"
            fill="none"
            stroke="var(--color-primario)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <form onSubmit={manejarIngreso} className="form-login">
          <div className="grupo-campo">
            <label htmlFor="correo">Correo institucional</label>
            <input
              id="correo"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@centrosalud.org"
              autoComplete="username"
              required
              className="input-fino"
            />
          </div>

          <div className="grupo-campo">
            <label htmlFor="clave">Contraseña</label>
            <input   
              id="clave"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="input-fino"
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="btn-primario btn-login" disabled={cargando}>
            {cargando ? 'Verificando…' : 'Ingresar al sistema'}
          </button>
        </form>

        <p className="login-pie">Acceso exclusivo para personal autorizado del centro.</p>
      </div>
    </div>
  );
}