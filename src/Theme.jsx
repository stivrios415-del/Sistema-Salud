@import url('https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600;700&display=swap');

/* ============ Variables de diseño — identidad "Ficha Clínica" ============ */
:root {
  --bg-principal: #eef3f0;
  --bg-tarjeta: #fbf8f2;
  --bg-sutil: #f5f1e9;
  --texto-principal: #132420;
  --texto-secundario: #5c6d66;
  --texto-tenue: #93a29c;
  --borde-fino: #dce4df;
  --borde-suave: #e8eeeb;

  --color-primario: #1f5d4f;
  --color-primario-hover: #163f36;
  --color-primario-suave: #e6efec;

  --color-acento: #b5652a;
  --color-acento-suave: #f7ebe0;

  --color-exito: #2f7d5c;
  --color-exito-bg: #eaf5ef;
  --color-alerta: #a23b2e;
  --color-alerta-bg: #fbeeec;

  --fuente-titulo: 'Zilla Slab', Georgia, serif;
  --fuente-cuerpo: 'IBM Plex Sans', 'Segoe UI', Roboto, sans-serif;
  --fuente-datos: 'IBM Plex Mono', 'Courier New', monospace;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: var(--fuente-cuerpo);
  background-color: var(--bg-principal);
  color: var(--texto-principal);
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3 {
  font-family: var(--fuente-titulo);
  letter-spacing: -0.01em;
}

/* ============ Sello de ficha (elemento distintivo) ============ */
.sello-ficha {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background-color: var(--color-primario);
  color: #ffffff;
  font-family: var(--fuente-datos);
  font-size: 0.64rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: 0.25rem 0.6rem;
  border-radius: 5px;
  margin-bottom: 0.6rem;
}
.sello-ficha.acento { background-color: var(--color-acento); }

/* ============ Header ============ */
.header-clinico {
  background-color: var(--bg-tarjeta);
  border-bottom: 1px solid var(--borde-fino);
  padding: 0.85rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 1px 3px rgba(19, 36, 32, 0.04);
}

.header-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.header-logo-icono {
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: 10px;
  background-color: var(--color-primario);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  box-shadow: 0 2px 6px rgba(31, 93, 79, 0.25);
}

.header-logo h1 {
  margin: 0;
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--texto-principal);
}

.header-logo p {
  margin: 0;
  font-size: 0.72rem;
  color: var(--texto-secundario);
  font-family: var(--fuente-datos);
  letter-spacing: 0.02em;
}

.header-sesion {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.header-usuario {
  font-size: 0.78rem;
  font-family: var(--fuente-datos);
  color: var(--texto-secundario);
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-salir {
  background: none;
  border: 1px solid var(--borde-fino);
  color: var(--texto-secundario);
  padding: 0.45rem 0.9rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-salir:hover {
  border-color: var(--color-alerta);
  color: var(--color-alerta);
  background-color: var(--color-alerta-bg);
}

/* ============ Nav Tabs ============ */
.contenedor-tabs {
  background-color: var(--bg-principal);
  padding: 0.3rem;
  border-radius: 12px;
  display: flex;
  gap: 0.25rem;
}

.btn-tab {
  background: none;
  border: none;
  padding: 0.55rem 1.25rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--texto-secundario);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: var(--fuente-cuerpo);
}

.btn-tab.activo {
  background-color: var(--color-primario);
  color: #ffffff;
  box-shadow: 0 2px 6px rgba(31, 93, 79, 0.25);
}

/* ============ Contenedor de Ventanas ============ */
.contenedor-principal {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1.5rem;
}

/* ============ Tarjetas ============ */
.tarjeta-blanca {
  background-color: var(--bg-tarjeta);
  border: 1px solid var(--borde-fino);
  border-radius: 18px;
  padding: 1.5rem;
  box-shadow: 0 1px 2px rgba(19, 36, 32, 0.04), 0 8px 24px -12px rgba(19, 36, 32, 0.10);
  margin-bottom: 2rem;
}

.titulo-seccion {
  font-size: 1.05rem;
  margin-top: 0;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--fuente-titulo);
}

.indicador-azul { width: 4px; height: 16px; background-color: var(--color-primario); border-radius: 2px; }
.indicador-verde { width: 4px; height: 16px; background-color: var(--color-exito); border-radius: 2px; }
.indicador-acento { width: 4px; height: 16px; background-color: var(--color-acento); border-radius: 2px; }

/* ============ Formularios ============ */
.grid-formulario {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.25rem;
}

.col-completa { grid-column: 1 / -1; }

.grupo-campo label {
  display: block;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--texto-secundario);
  margin-bottom: 0.4rem;
}

.input-fino {
  width: 100%;
  background-color: var(--bg-sutil);
  border: 1px solid var(--borde-fino);
  border-radius: 10px;
  padding: 0.7rem 0.85rem;
  font-size: 0.9rem;
  font-family: var(--fuente-cuerpo);
  color: var(--texto-principal);
  transition: all 0.15s;
}

.input-fino:focus {
  outline: none;
  border-color: var(--color-primario);
  background-color: #ffffff;
  box-shadow: 0 0 0 3px var(--color-primario-suave);
}

/* ============ Botones ============ */
.btn-primario {
  background-color: var(--color-primario);
  color: #ffffff;
  border: none;
  padding: 0.7rem 1.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s;
  font-family: var(--fuente-cuerpo);
}

.btn-primario:hover { background-color: var(--color-primario-hover); }
.btn-primario:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-oscuro {
  background-color: var(--texto-principal);
  color: #ffffff;
  border: none;
  padding: 0.65rem 1.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
}

.btn-oscuro:hover { background-color: #0c1815; }

.btn-reporte {
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  border-radius: 8px;
  cursor: pointer;
  background: none;
}
.btn-excel { color: var(--color-primario); border: 1px solid var(--borde-fino); background-color: var(--color-primario-suave); }
.btn-pdf { color: var(--color-alerta); border: 1px solid #f0c9c3; background-color: var(--color-alerta-bg); }

/* ============ Tablas Clínicas ============ */
.tabla-contenedor {
  overflow-x: auto;
  border: 1px solid var(--borde-fino);
  border-radius: 12px;
}

.tabla-fina {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.9rem;
}

.tabla-fina th {
  background-color: var(--color-primario);
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-family: var(--fuente-datos);
  padding: 0.85rem 1rem;
}

.tabla-fina td {
  padding: 0.9rem 1rem;
  border-bottom: 1px solid var(--borde-suave);
  font-family: var(--fuente-datos);
  font-size: 0.85rem;
}

.tabla-fina tr:nth-child(even) td { background-color: var(--bg-sutil); }
.tabla-fina tr:last-child td { border-bottom: none; }

/* ============ Badges de Estado ============ */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.2rem 0.6rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}
.badge-optimo { background-color: var(--color-exito-bg); color: var(--color-exito); border: 1px solid #b9ddc9; }
.badge-critico { background-color: var(--color-alerta-bg); color: var(--color-alerta); border: 1px solid #f0c9c3; }
.badge-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
.badge-optimo .badge-dot { background-color: var(--color-exito); }
.badge-critico .badge-dot { background-color: var(--color-alerta); }

/* ============ Totales Inferiores ============ */
.contenedor-totales {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  background-color: var(--bg-principal);
  padding: 1.25rem;
  border-top: 1px solid var(--borde-fino);
}

.tarjeta-total {
  background: white;
  border: 1px solid var(--borde-fino);
  padding: 1rem;
  border-radius: 10px;
}

.tarjeta-total p:first-child {
  margin: 0;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--texto-tenue);
}

.tarjeta-total p:last-child {
  margin: 0.25rem 0 0 0;
  font-size: 1.5rem;
  font-weight: 800;
  font-family: var(--fuente-titulo);
}

/* ============ Pantalla de carga ============ */
.pantalla-carga {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--texto-secundario);
  font-family: var(--fuente-cuerpo);
  font-size: 0.85rem;
}

.ecg-pulso {
  width: 46px;
  height: 46px;
  border: 3px solid var(--borde-fino);
  border-top-color: var(--color-primario);
  border-radius: 50%;
  animation: girar 0.8s linear infinite;
}

@keyframes girar {
  to { transform: rotate(360deg); }
}
/* ============ Pantalla de Login ============ */
.pantalla-login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-principal);
  background-image:
    radial-gradient(circle at 15% 15%, rgba(31, 93, 79, 0.07), transparent 40%),
    radial-gradient(circle at 85% 85%, rgba(181, 101, 42, 0.05), transparent 40%);
  padding: 1.5rem;
}

.tarjeta-login {
  width: 100%;
  max-width: 380px;
  background-color: var(--bg-tarjeta);
  border: 1px solid var(--borde-fino);
  border-radius: 18px;
  padding: 2.25rem 2rem 1.75rem;
  box-shadow: 0 8px 30px rgba(19, 36, 32, 0.08);
}

.login-encabezado {
  text-align: center;
  margin-bottom: 0.5rem;
}

.login-icono {
  font-size: 2.2rem;
  display: block;
  margin-bottom: 0.5rem;
}

.login-encabezado h1 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 700;
}

.login-encabezado p {
  margin: 0.25rem 0 0 0;
  font-size: 0.75rem;
  color: var(--texto-secundario);
  font-family: var(--fuente-datos);
  letter-spacing: 0.02em;
}

.ecg-firma {
  width: 100%;
  height: 32px;
  margin: 0.75rem 0 1.25rem;
  opacity: 0.55;
}

.form-login {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

/* Contenedor relativo para posicionar el botón del ojo */
.contenedor-input-icono {
  position: relative;
  width: 100%;
}

.contenedor-input-icono .input-fino {
  padding-right: 2.5rem; /* Evita que el texto de la clave se superponga al botón */
}

/* Botón de visibilidad de contraseña */
.btn-revelar-clave {
  position: absolute;
  top: 50%;
  right: 0.75rem;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--texto-tenue);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s;
}

.btn-revelar-clave:hover {
  color: var(--texto-secundario);
}

.btn-revelar-clave svg {
  width: 20px;
  height: 20px;
}

/* Spinner animado para simular carga en el botón */
.spinner-login {
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #ffffff;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: girar 0.8s linear infinite;
  display: inline-block;
}

.flex-btn-contenido {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.btn-login {
  width: 100%;
  margin-top: 0.25rem;
}

.login-error {
  margin: -0.4rem 0 0 0;
  font-size: 0.78rem;
  color: var(--color-alerta);
  background-color: var(--color-alerta-bg);
  border: 1px solid #f0c9c3;
  padding: 0.55rem 0.75rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.login-error svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.login-pie {
  text-align: center;
  font-size: 0.7rem;
  color: var(--texto-tenue);
  margin: 1.5rem 0 0 0;
}

/* ============ Responsive ============ */
@media (max-width: 768px) {
  .header-clinico {
    flex-wrap: wrap;
    padding: 0.9rem 1rem;
    gap: 0.75rem;
    row-gap: 0.85rem;
  }
  .header-logo-icono {
    width: 36px;
    height: 36px;
    min-width: 36px;
    font-size: 1.1rem;
    border-radius: 9px;
  }
  .header-logo h1 {
    font-size: 1rem;
  }
  .header-logo p {
    font-size: 0.66rem;
  }
  .contenedor-tabs {
    order: 3;
    width: 100%;
  }
  .btn-tab {
    flex: 1;
    text-align: center;
    padding: 0.6rem 0.5rem;
    font-size: 0.68rem;
  }
  .header-sesion {
    order: 2;
    margin-left: auto;
    gap: 0.5rem;
  }
  .header-usuario {
    max-width: 110px;
    font-size: 0.7rem;
  }
  .btn-salir {
    padding: 0.4rem 0.7rem;
    font-size: 0.7rem;
    white-space: nowrap;
  }

  .contenedor-principal {
    margin: 1rem auto;
    padding: 0 0.85rem;
  }

  .tarjeta-blanca {
    padding: 1rem;
    border-radius: 12px;
    margin-bottom: 1.25rem;
  }

  .grid-formulario {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .btn-primario,
  .btn-oscuro {
    width: 100%;
    padding: 0.8rem 1rem;
  }

  .btn-reporte {
    flex: 1;
  }

  .tabla-contenedor {
    -webkit-overflow-scrolling: touch;
  }
  .tabla-fina th,
  .tabla-fina td {
    padding: 0.65rem 0.7rem;
    font-size: 0.78rem;
  }

  .contenedor-totales {
    grid-template-columns: 1fr;
    gap: 0.75rem;
    padding: 1rem;
  }
  .tarjeta-total p:last-child {
    font-size: 1.25rem;
  }

  .tarjeta-login {
    padding: 1.75rem 1.25rem 1.25rem;
    border-radius: 14px;
  }
  .login-encabezado h1 {
    font-size: 1.1rem;
  }
}

@media (max-width: 400px) {
  .header-logo h1 {
    font-size: 0.95rem;
  }
  .header-logo p {
    font-size: 0.65rem;
  }
  .titulo-seccion {
    font-size: 0.9rem;
  }
  .tabla-fina th,
  .tabla-fina td {
    padding: 0.55rem 0.6rem;
    font-size: 0.72rem;
  }
}
