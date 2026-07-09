import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Login from './components/Login';
import VentanaEvaluacion from './components/VentanaEvaluacion';
import VentanaInventario from './components/VentanaInventario';

function App() {
  const [vista, setVista] = useState('evaluacion');
  const [sesion, setSesion] = useState(undefined); // undefined = cargando, null = sin sesión

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSesion(session);
    });

    const { data: escucha } = supabase.auth.onAuthStateChange((_evento, session) => {
      setSesion(session);
    });

    return () => escucha.subscription.unsubscribe();
  }, []);

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
  };

  // Evita el parpadeo del login mientras se verifica la sesión existente
  if (sesion === undefined) {
    return (
      <div className="pantalla-carga">
        <span className="ecg-pulso" aria-hidden="true" />
        <p>Cargando sistema…</p>
      </div>
    );
  }

  if (!sesion) {
    return <Login />;
  }

  return (
    <div>
      <header className="header-clinico">
        <div className="header-logo">
          <span style={{ fontSize: '2rem' }}>🏥</span>
          <div>
            <h1>Centro de Salud</h1>
            <p>Sistema de Control Clínico &amp; Stock</p>
          </div>
        </div>

        <div className="contenedor-tabs">
          <button
            onClick={() => setVista('evaluacion')}
            className={`btn-tab ${vista === 'evaluacion' ? 'activo' : ''}`}
          >
            Evaluación Médica
          </button>
          <button
            onClick={() => setVista('inventario')}
            className={`btn-tab ${vista === 'inventario' ? 'activo' : ''}`}
          >
            Inventario
          </button>
        </div>

        <div className="header-sesion">
          <span className="header-usuario" title={sesion.user?.email}>
            {sesion.user?.email}
          </span>
          <button onClick={cerrarSesion} className="btn-salir">
            Salir
          </button>
        </div>
      </header>

      <main className="contenedor-principal">
        {vista === 'evaluacion' ? <VentanaEvaluacion /> : <VentanaInventario />}
      </main>
    </div>
  );
}

export default App;