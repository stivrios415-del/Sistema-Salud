import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import XLSX from 'xlsx-js-style';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { THEME as T, estiloSello } from '../Theme';

export default function VentanaEvaluacion() {
  const [codigo, setCodigo] = useState('');
  const [unidadPrest, setUnidadPrest] = useState('TAB');
  const [medicamentoId, setMedicamentoId] = useState('');
  const [fecha, setFecha] = useState('');
  const [unidades, setUnidades] = useState('');
  const [observacion, setObservacion] = useState('');
  const [medicamentos, setMedicamentos] = useState([]);
  const [consumos, setConsumos] = useState([]);
  
  // --- Buscador para el Historial ---
  const [busqueda, setBusqueda] = useState('');
  
  // --- Buscador para el Formulario de Registro ---
  const [busquedaMed, setBusquedaMed] = useState('');
  const [mostrarDropdownMed, setMostrarDropdownMed] = useState(false);
  const dropdownRef = useRef(null);
  
  // --- Filtros por fecha ---
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const [esMovil, setEsMovil] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // --- Estado para edición ---
  const [editandoId, setEditandoId] = useState(null);
  const [edicion, setEdicion] = useState(null);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  // --- Estado para eliminación ---
  const [eliminandoId, setEliminandoId] = useState(null);

  useEffect(() => {
    obtenerMedicamentos();
    obtenerConsumos();
    
    const hacerClicFuera = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMostrarDropdownMed(false);
      }
    };
    document.addEventListener('mousedown', hacerClicFuera);

    const verificarResolucion = () => setEsMovil(window.innerWidth < 768);
    verificarResolucion();
    window.addEventListener('resize', verificarResolucion);
    
    return () => {
      window.removeEventListener('resize', verificarResolucion);
      document.removeEventListener('mousedown', hacerClicFuera);
    };
  }, []);

  const obtenerMedicamentos = async () => {
    const { data } = await supabase.from('medicamentos').select('id, nombre, existencia, unidad_prestacion').order('nombre', { ascending: true });
    if (data) setMedicamentos(data);
  };

  const obtenerConsumos = async () => {
    const { data, error } = await supabase
      .from('consumos')
      .select('*, medicamentos(nombre)')
      .order('fecha', { ascending: false });
    if (error) { console.error('Error al cargar consumos:', error); return; }
    if (data) setConsumos(data);
  };

  const seleccionarMedicamento = (med) => {
    setMedicamentoId(med.id);
    setBusquedaMed(med.nombre);
    setUnidadPrest(med.unidad_prestacion || 'TAB');
    setMostrarDropdownMed(false);
  };

  const manejarGuardar = async (e) => {
    e.preventDefault();
    const unidadesUtilizadas = parseInt(unidades);
    const med = medicamentos.find(m => m.id?.toString() === medicamentoId?.toString());

    if (!med || med.existencia < unidadesUtilizadas) {
      alert('Stock insuficiente o fármaco no seleccionado correctamente.');
      return;
    }

    setGuardando(true);
    const { error } = await supabase.from('consumos').insert([{
      codigo, unidad_prestacion: unidadPrest, medicamento_id: medicamentoId,
      fecha, unidades_utilizadas: unidadesUtilizadas, observacion
    }]);

    if (error) { alert('Error al guardar: ' + error.message); setGuardando(false); return; }

    await supabase.from('medicamentos').update({ existencia: med.existencia - unidadesUtilizadas }).eq('id', medicamentoId);

    setCodigo(''); 
    setUnidades(''); 
    setObservacion(''); 
    setMedicamentoId(''); 
    setBusquedaMed('');
    setUnidadPrest('TAB');
    
    await obtenerMedicamentos();
    await obtenerConsumos();
    setGuardando(false);
  };

  const iniciarEdicion = (c) => {
    setEditandoId(c.id);
    setEdicion({
      codigo: c.codigo || '',
      medicamento_id: c.medicamento_id,
      fecha: c.fecha || '',
      unidades_utilizadas: c.unidades_utilizadas,
      observacion: c.observacion || ''
    });
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setEdicion(null);
  };

  const manejarCambioMedicamentoEdicion = (id) => {
    setEdicion(prev => ({ ...prev, medicamento_id: id }));
  };

  const guardarEdicion = async () => {
    if (!edicion) return;
    const unidadesNuevas = parseInt(edicion.unidades_utilizadas);
    if (isNaN(unidadesNuevas) || unidadesNuevas <= 0) {
      alert('Ingresa una cantidad válida');
      return;
    }

    const consumoOriginal = consumos.find(c => c.id === editandoId);
    const medNuevo = medicamentos.find(m => m.id?.toString() === edicion.medicamento_id?.toString());

    if (!consumoOriginal || !medNuevo) {
      alert('No se pudo identificar el registro o el medicamento seleccionado');
      return;
    }

    setGuardandoEdicion(true);

    const mismoMedicamento = consumoOriginal.medicamento_id?.toString() === edicion.medicamento_id?.toString();

    if (mismoMedicamento) {
      const diferencia = unidadesNuevas - consumoOriginal.unidades_utilizadas;
      const existenciaResultante = medNuevo.existencia - diferencia;
      if (existenciaResultante < 0) {
        alert('Stock insuficiente para esta edición');
        setGuardandoEdicion(false);
        return;
      }
      await supabase.from('medicamentos').update({ existencia: existenciaResultante }).eq('id', medNuevo.id);
    } else {
      const medOriginal = medicamentos.find(m => m.id?.toString() === consumoOriginal.medicamento_id?.toString());
      if (medOriginal) {
        await supabase.from('medicamentos').update({ existencia: medOriginal.existencia + consumoOriginal.unidades_utilizadas }).eq('id', medOriginal.id);
      }
      if (medNuevo.existencia < unidadesNuevas) {
        alert('Stock insuficiente en el medicamento seleccionado');
        setGuardandoEdicion(false);
        return;
      }
      await supabase.from('medicamentos').update({ existencia: medNuevo.existencia - unidadesNuevas }).eq('id', medNuevo.id);
    }

    const { error } = await supabase.from('consumos').update({
      codigo: edicion.codigo,
      medicamento_id: edicion.medicamento_id,
      unidad_prestacion: medNuevo.unidad_prestacion,
      fecha: edicion.fecha,
      unidades_utilizadas: unidadesNuevas,
      observacion: edicion.observacion
    }).eq('id', editandoId);

    if (error) {
      alert('Error al actualizar: ' + error.message);
      setGuardandoEdicion(false);
      return;
    }

    setEditandoId(null);
    setEdicion(null);
    await obtenerMedicamentos();
    await obtenerConsumos();
    setGuardandoEdicion(false);
  };

  const eliminarConsumo = async (c) => {
    const confirmar = window.confirm(
      `¿Eliminar el registro de "${c.medicamentos?.nombre || 'este medicamento'}" (${c.unidades_utilizadas} u.)?`
    );
    if (!confirmar) return;

    setEliminandoId(c.id);

    const med = medicamentos.find(m => m.id?.toString() === c.medicamento_id?.toString());
    if (med) {
      await supabase.from('medicamentos').update({ existencia: med.existencia + (Number(c.unidades_utilizadas) || 0) }).eq('id', med.id);
    }

    await supabase.from('consumos').delete().eq('id', c.id);
    await obtenerMedicamentos();
    await obtenerConsumos();
    setEliminandoId(null);
  };

  // --- Filtrado del Historial ---
  const consumosFiltrados = consumos.filter(c => {
    const texto = busqueda.toLowerCase();
    const codigoTxt = (c.codigo || '').toLowerCase();
    const nombreTxt = (c.medicamentos?.nombre || '').toLowerCase();
    const cumpleTexto = codigoTxt.includes(texto) || nombreTxt.includes(texto);
    
    let cumpleFecha = true;
    if (c.fecha) {
      if (fechaInicio && c.fecha < fechaInicio) cumpleFecha = false;
      if (fechaFin && c.fecha > fechaFin) cumpleFecha = false;
    } else if (fechaInicio || fechaFin) {
      cumpleFecha = false;
    }
    return cumpleTexto && cumpleFecha;
  });

  const medicamentosFiltradosForm = medicamentos.filter(m => 
    m.nombre.toLowerCase().includes(busquedaMed.toLowerCase())
  );

  const limpiarFiltrosFecha = () => {
    setFechaInicio('');
    setFechaFin('');
  };

  const exportarExcelConsumos = () => {
    if (consumosFiltrados.length === 0) return;
    const estiloEncabezado = {
      fill: { fgColor: { rgb: "1F5D4F" } },
      font: { color: { rgb: "FFFFFF" }, bold: true, sz: 11 },
      alignment: { vertical: "center", horizontal: "center", wrapText: true },
      border: { bottom: { style: "thin", color: { rgb: "000000" } } }
    };
    const estiloCelda = {
      font: { name: "Arial", sz: 10 },
      alignment: { vertical: "center", horizontal: "left", wrapText: true },
      border: { bottom: { style: "thin", color: { rgb: "E2E8F0" } } }
    };
    const estiloCeldaCentrado = { ...estiloCelda, alignment: { ...estiloCelda.alignment, horizontal: "center" } };

    const encabezados = [
      { v: "CÓDIGO", t: "s", s: estiloEncabezado },
      { v: "U. PRESTACIÓN", t: "s", s: estiloEncabezado },
      { v: "MEDICAMENTO ADMINISTRADO", t: "s", s: estiloEncabezado },
      { v: "FECHA REGISTRO", t: "s", s: estiloEncabezado },
      { v: "CANTIDAD", t: "s", s: estiloEncabezado }
    ];

    const filasDatos = consumosFiltrados.map(c => [
      { v: c.codigo || '', t: "s", s: estiloCeldaCentrado },
      { v: c.unidad_prestacion || '', t: "s", s: estiloCeldaCentrado },
      { v: c.medicamentos?.nombre || 'N/A', t: "s", s: estiloCelda },
      { v: c.fecha || '', t: "s", s: estiloCeldaCentrado },
      { v: c.unidades_utilizadas, t: "n", s: estiloCeldaCentrado }
    ]);

    const hoja = XLSX.utils.aoa_to_sheet([encabezados, ...filasDatos]);
    hoja['!cols'] = [{ wch: 14 }, { wch: 16 }, { wch: 38 }, { wch: 16 }, { wch: 12 }];
    hoja['!rows'] = [{ hpt: 26 }, ...filasDatos.map(() => ({ hpt: 20 }))];

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'CONSUMOS');
    XLSX.writeFile(libro, `REPORTE_CONSUMOS_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportarPDFConsumos = () => {
    if (consumosFiltrados.length === 0) return;
    const doc = new jsPDF();
    autoTable(doc, {
      startY: 20,
      head: [['CÓDIGO', 'U. PRESTACIÓN', 'MEDICAMENTO', 'FECHA', 'CANTIDAD']],
      body: consumosFiltrados.map(c => [c.codigo || '', c.unidad_prestacion || '', c.medicamentos?.nombre || 'N/A', c.fecha || '', `${c.unidades_utilizadas} u.`]),
      headStyles: { fillColor: [31, 93, 79] }
    });
    doc.save('Reporte_Consumos.pdf');
  };

  // --- CORREGIDO: Valor inicial {} para evitar error al reducir arrays vacíos ---
  const consumosPorFecha = consumosFiltrados.reduce((acc, c) => {
    const fechaCortada = c.fecha ? c.fecha.substring(5, 10) : 'N/A';
    acc[fechaCortada] = (acc[fechaCortada] || 0) + (Number(c.unidades_utilizadas) || 0);
    return acc;
  }, {}); 

  const datosGraficoLinea = Object.keys(consumosPorFecha).sort().map(fecha => ({
    Fecha: fecha,
    Unidades: consumosPorFecha[fecha]
  }));

  // --- Estilos ---
  const tarjeta = {
    backgroundColor: T.bgTarjeta,
    padding: esMovil ? '18px 16px' : '22px',
    borderRadius: T.radioTarjeta,
    boxShadow: T.sombraTarjeta,
    border: `1px solid ${T.borde}`,
    boxSizing: 'border-box'
  };
  const input = {
    width: '100%', boxSizing: 'border-box', padding: '12px 14px',
    borderRadius: T.radioControl, border: `1px solid ${T.borde}`,
    fontSize: '0.9rem', fontFamily: T.fuenteCuerpo, color: T.tinta, backgroundColor: T.bgTarjeta
  };
  const inputPequeno = { ...input, padding: '8px 10px', fontSize: '0.82rem' };
  const h2 = { fontSize: '1.25rem', fontWeight: 700, margin: 0, color: T.tinta, fontFamily: T.fuenteTitulo };

  const botonAccion = (color) => ({
    padding: '6px 10px', fontSize: '0.75rem', fontWeight: 700, border: 'none',
    borderRadius: T.radioControl, cursor: 'pointer', color: '#fff', backgroundColor: color,
    fontFamily: T.fuenteCuerpo, whiteSpace: 'nowrap'
  });

  return (
    <div style={{
      padding: esMovil ? '14px' : '24px',
      maxWidth: '1200px', margin: '0 auto',
      fontFamily: T.fuenteCuerpo,
      backgroundColor: T.bgPagina,
      minHeight: '100vh', boxSizing: 'border-box', width: '100%'
    }}>

      <div style={{ display: 'grid', gridTemplateColumns: esMovil ? '1fr' : '1fr 1fr', gap: esMovil ? '14px' : '20px', marginBottom: esMovil ? '14px' : '20px' }}>

        {/* REGISTRO DE EVALUACIÓN */}
        <div style={{ ...tarjeta, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span style={{ ...estiloSello(T.primario), marginBottom: '12px', fontSize: '0.65rem', letterSpacing: '0.08em', padding: '4px 10px', borderRadius: '6px' }}>
            FICHA • EVALUACIÓN
          </span>
          
          <h2 style={{ ...h2, marginBottom: '20px', fontSize: '1.2rem' }}>
            Registro de Evaluación
          </h2>
          
          <form onSubmit={manejarGuardar} style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' }}>
              <input 
                type="text" 
                value={codigo} 
                onChange={e => setCodigo(e.target.value)} 
                placeholder="Código Manual" 
                required 
                style={input} 
              />
              <input 
                type="text" 
                value={unidadPrest} 
                disabled 
                placeholder="TAB"
                style={{ ...input, backgroundColor: '#e6f0ed', color: '#1a433a', fontWeight: 'bold', textAlign: 'center', border: 'none' }} 
              />
            </div>

            {/* BUSCADOR INTERACTIVO DE FÁRMACOS */}
            <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
              <input 
                type="text"
                placeholder="🔍 Escribe para buscar fármaco..."
                value={busquedaMed}
                onChange={(e) => {
                  setBusquedaMed(e.target.value);
                  setMostrarDropdownMed(true);
                  if(e.target.value === '') setMedicamentoId('');
                }}
                onFocus={() => setMostrarDropdownMed(true)}
                required
                style={{ ...input, paddingRight: '36px' }}
              />
              <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: T.tintaTenue, fontSize: '0.8rem' }}>
                ▼
              </div>

              {mostrarDropdownMed && (
                <ul style={{
                  position: 'absolute', top: '100%', left: 0, right: 0,
                  backgroundColor: '#fff', border: `1px solid ${T.borde}`,
                  borderRadius: T.radioControl, boxShadow: '0px 8px 16px rgba(0,0,0,0.1)',
                  maxHeight: '200px', overflowY: 'auto', margin: '4px 0 0 0',
                  padding: '4px 0', listStyle: 'none', zIndex: 10,
                  boxSizing: 'border-box'
                }}>
                  {medicamentosFiltradosForm.length === 0 ? (
                    <li style={{ padding: '10px 14px', color: T.tintaTenue, fontSize: '0.85rem' }}>
                      No se encontraron fármacos
                    </li>
                  ) : (
                    medicamentosFiltradosForm.map(m => (
                      <li 
                        key={m.id}
                        onClick={() => seleccionarMedicamento(m)}
                        style={{
                          padding: '10px 14px',
                          cursor: 'pointer',
                          fontSize: '0.88rem',
                          color: T.tinta,
                          backgroundColor: medicamentoId === m.id ? '#f0f7f4' : 'transparent',
                          transition: 'background-color 0.1s'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f4fbf8'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = medicamentoId === m.id ? '#f0f7f4' : 'transparent'}
                      >
                        <div style={{ fontWeight: 600 }}>{m.nombre}</div>
                        <div style={{ fontSize: '0.75rem', color: T.tintaTenue }}>
                          Existencia: {m.existencia} u. | Unidad: {m.unidad_prestacion || 'TAB'}
                        </div>
                      </li>
                    ))
                  )}
                </ul>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '12px' }}>
              <input 
                type="date" 
                value={fecha} 
                onChange={e => setFecha(e.target.value)} 
                required 
                style={input} 
              />
              <input 
                type="number" 
                value={unidades} 
                onChange={e => setUnidades(e.target.value)} 
                placeholder="Cantidad" 
                required 
                style={input} 
              />
            </div>

            <textarea 
              value={observacion} 
              onChange={e => setObservacion(e.target.value)} 
              placeholder="Observaciones facultativas..."
              style={{ ...input, minHeight: '65px', resize: 'vertical' }}
            />

            <button 
              type="submit" 
              disabled={guardando}
              style={{
                padding: '14px', 
                backgroundColor: guardando ? T.tintaTenue : '#1f5d4f', 
                color: '#fff',
                border: 'none', 
                borderRadius: T.radioControl, 
                fontWeight: 700, 
                fontSize: '0.95rem',
                cursor: guardando ? 'not-allowed' : 'pointer', 
                fontFamily: T.fuenteCuerpo,
                marginTop: '6px',
                transition: 'background-color 0.15s'
              }}
            >
              {guardando ? 'Guardando...' : 'Guardar Entrada'}
            </button>
          </form>
        </div>

        {/* GRÁFICO TENDENCIA */}
        <div style={tarjeta}>
          <span style={estiloSello(T.acento)}>Tendencia</span>
          <h2 style={{ ...h2, marginBottom: '16px' }}>Unidades Dispensadas</h2>

          {datosGraficoLinea.length === 0 ? (
            <div style={{
              width: '100%', height: esMovil ? 160 : 220,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '8px', backgroundColor: T.bgSutil, borderRadius: '12px', border: `1px dashed ${T.borde}`
            }}>
              <span style={{ fontSize: '1.4rem' }}>🧪</span>
              <p style={{ margin: 0, color: T.tintaTenue, fontSize: '0.82rem', textAlign: 'center', padding: '0 16px' }}>
                Aún no hay consumos registrados
              </p>
            </div>
          ) : (
            <div style={{ width: '100%', height: esMovil ? 190 : 220, fontSize: '0.7rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={datosGraficoLinea} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.bordeSuave} />
                  <XAxis dataKey="Fecha" stroke={T.tintaTenue} />
                  <YAxis stroke={T.tintaTenue} />
                  <Tooltip contentStyle={{ borderRadius: '10px', border: `1px solid ${T.borde}`, fontFamily: T.fuenteCuerpo }} />
                  <Line type="monotone" dataKey="Unidades" stroke={T.acento} strokeWidth={2.5} dot={{ r: 3, fill: T.acento }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* HISTORIAL */}
      <div style={tarjeta}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
          
          <div style={{ display: 'flex', flexDirection: esMovil ? 'column' : 'row', justifyContent: 'space-between', alignItems: esMovil ? 'stretch' : 'center', gap: '14px' }}>
            <div>
              <span style={estiloSello(T.primario)}>Historial</span>
              <h2 style={h2}>
                Salidas Clínicas {consumosFiltrados.length > 0 && <span style={{ color: T.tintaTenue, fontWeight: 500, fontSize: '0.8rem', fontFamily: T.fuenteCuerpo }}>({consumosFiltrados.length})</span>}
              </h2>
            </div>

            {/* FILTROS DE FECHA */}
            <div style={{ display: 'flex', gap: '8px', flexDirection: esMovil ? 'column' : 'row', alignItems: 'stretch' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: T.tintaTenue, whiteSpace: 'nowrap' }}>Desde:</span>
                <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} style={inputPequeno} />
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: T.tintaTenue, whiteSpace: 'nowrap' }}>Hasta:</span>
                <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} style={inputPequeno} />
              </div>
              {(fechaInicio || fechaFin) && (
                <button onClick={limpiarFiltrosFecha} style={{ ...botonAccion(T.alerta), padding: '8px 12px', fontSize: '0.8rem' }}>
                  Limpiar Fechas
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexDirection: esMovil ? 'column' : 'row' }}>
            <input type="text" placeholder="Buscar por código o fármaco en el historial..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
              style={{ ...input, minWidth: esMovil ? 'auto' : '260px', padding: '11px 14px', fontSize: '0.88rem', flex: 1 }} />
            <div style={{ display: 'flex', gap: '10px', width: esMovil ? '100%' : 'auto' }}>
              <button onClick={exportarExcelConsumos} style={{ flex: 1, padding: '11px 14px', backgroundColor: T.bgTarjeta, border: `1px solid ${T.borde}`, borderRadius: T.radioControl, fontWeight: 600, fontSize: '0.85rem', color: T.primario, cursor: 'pointer', whiteSpace: 'nowrap' }}>📊 Excel</button>
              <button onClick={exportarPDFConsumos} style={{ flex: 1, padding: '11px 14px', backgroundColor: T.bgTarjeta, border: `1px solid ${T.borde}`, borderRadius: T.radioControl, fontWeight: 600, fontSize: '0.85rem', color: T.alerta, cursor: 'pointer', whiteSpace: 'nowrap' }}>📄 PDF</button>
            </div>
          </div>
        </div>

        <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
          {consumosFiltrados.length === 0 ? (
            <div style={{ padding: '36px 10px', textAlign: 'center', color: T.tintaTenue, fontSize: '0.88rem' }}>
              {consumos.length === 0 ? 'No hay salidas registradas todavía' : 'No se encontraron resultados para tu búsqueda'}
            </div>
          ) : esMovil ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {consumosFiltrados.map(c => (
                <div key={c.id} style={{ padding: '14px', backgroundColor: T.bgSutil, borderRadius: '12px', border: `1px solid ${T.bordeSuave}`, borderLeft: `3px solid ${T.primario}` }}>
                  {editandoId === c.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <input type="text" value={edicion.codigo} onChange={e => setEdicion(prev => ({ ...prev, codigo: e.target.value }))} placeholder="Código" style={inputPequeno} />
                      <select value={edicion.medicamento_id} onChange={e => manejarCambioMedicamentoEdicion(e.target.value)} style={inputPequeno}>
                        {medicamentos.map(m => (
                          <option key={m.id} value={m.id}>{m.nombre} ({m.existencia} u. disp.) [{m.unidad_prestacion}]</option>
                        ))}
                      </select>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <input type="date" value={edicion.fecha} onChange={e => setEdicion(prev => ({ ...prev, fecha: e.target.value }))} style={inputPequeno} />
                        <input type="number" value={edicion.unidades_utilizadas} onChange={e => setEdicion(prev => ({ ...prev, unidades_utilizadas: e.target.value }))} style={inputPequeno} />
                      </div>
                      <textarea value={edicion.observacion} onChange={e => setEdicion(prev => ({ ...prev, observacion: e.target.value }))} placeholder="Observaciones" style={{ ...inputPequeno, minHeight: '45px', resize: 'vertical' }}></textarea>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={guardarEdicion} disabled={guardandoEdicion} style={{ ...botonAccion(T.primario), flex: 1 }}>
                          {guardandoEdicion ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button onClick={cancelarEdicion} style={{ ...botonAccion(T.tintaTenue), flex: 1 }}>Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '4px' }}>
                        <span style={{ fontWeight: 700, color: T.primario, fontFamily: T.fuenteDatos, fontSize: '0.82rem', wordBreak: 'break-all' }}>{c.codigo || '—'}</span>
                        <span style={{ color: T.tintaSecundaria, fontSize: '0.76rem', whiteSpace: 'nowrap' }}>{c.fecha || '—'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.9rem', gap: '8px' }}>
                        <span style={{ color: T.tinta }}>{c.medicamentos?.nombre || 'N/A'}</span>
                        <span style={{ color: T.acento, whiteSpace: 'nowrap', fontFamily: T.fuenteDatos }}>{c.unidades_utilizadas} u. ({c.unidad_prestacion})</span>
                      </div>
                      {c.observacion && <p style={{ margin: '8px 0 0 0', color: T.tintaSecundaria, fontSize: '0.78rem', fontStyle: 'italic' }}>Obs: {c.observacion}</p>}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                        <button onClick={() => iniciarEdicion(c)} style={{ ...botonAccion(T.primario), flex: 1 }}>✏️ Editar</button>
                        <button onClick={() => eliminarConsumo(c)} disabled={eliminandoId === c.id} style={{ ...botonAccion(T.alerta), flex: 1 }}>
                          {eliminandoId === c.id ? 'Eliminando...' : '🗑️ Eliminar'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: T.primario, zIndex: 1 }}>
                <tr>
                  <th style={{ padding: '13px 14px', color: '#fff', fontFamily: T.fuenteDatos, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Código</th>
                  <th style={{ padding: '13px 14px', color: '#fff', fontFamily: T.fuenteDatos, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>U. Prestación</th>
                  <th style={{ padding: '13px 14px', color: '#fff', fontFamily: T.fuenteDatos, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Medicamento</th>
                  <th style={{ padding: '13px 14px', color: '#fff', fontFamily: T.fuenteDatos, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Fecha</th>
                  <th style={{ padding: '13px 14px', color: '#fff', fontFamily: T.fuenteDatos, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>Cantidad</th>
                  <th style={{ padding: '13px 14px', color: '#fff', fontFamily: T.fuenteDatos, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {consumosFiltrados.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${T.bordeSuave}`, fontSize: '0.92rem', backgroundColor: i % 2 === 0 ? T.bgTarjeta : T.bgSutil }}>
                    {editandoId === c.id ? (
                      <>
                        <td style={{ padding: '10px' }}>
                          <input type="text" value={edicion.codigo} onChange={e => setEdicion(prev => ({ ...prev, codigo: e.target.value }))} style={inputPequeno} />
                        </td>
                        <td style={{ padding: '10px', color: T.tintaSecundaria, fontFamily: T.fuenteDatos, fontSize: '0.82rem' }}>
                          {medicamentos.find(m => m.id?.toString() === edicion.medicamento_id?.toString())?.unidad_prestacion || '—'}
                        </td>
                        <td style={{ padding: '10px' }}>
                          <select value={edicion.medicamento_id} onChange={e => manejarCambioMedicamentoEdicion(e.target.value)} style={inputPequeno}>
                            {medicamentos.map(m => (
                              <option key={m.id} value={m.id}>{m.nombre} ({m.existencia} u. disp.)</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '10px' }}>
                          <input type="date" value={edicion.fecha} onChange={e => setEdicion(prev => ({ ...prev, fecha: e.target.value }))} style={inputPequeno} />
                        </td>
                        <td style={{ padding: '10px' }}>
                          <input type="number" value={edicion.unidades_utilizadas} onChange={e => setEdicion(prev => ({ ...prev, unidades_utilizadas: e.target.value }))} style={{ ...inputPequeno, textAlign: 'right' }} />
                        </td>
                        <td style={{ padding: '10px' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button onClick={guardarEdicion} disabled={guardandoEdicion} style={botonAccion(T.primario)}>
                              {guardandoEdicion ? '...' : 'Guardar'}
                            </button>
                            <button onClick={cancelarEdicion} style={botonAccion(T.tintaTenue)}>Cancelar</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: '13px 14px', fontFamily: T.fuenteDatos, fontWeight: 600, color: T.primario }}>{c.codigo || '—'}</td>
                        <td style={{ padding: '13px 14px', color: T.tintaSecundaria }}>{c.unidad_prestacion || '—'}</td>
                        <td style={{ padding: '13px 14px', fontWeight: 600, color: T.tinta }}>{c.medicamentos?.nombre || 'N/A'}</td>
                        <td style={{ padding: '13px 14px', color: T.tintaSecundaria }}>{c.fecha || '—'}</td>
                        <td style={{ padding: '13px 14px', textAlign: 'right', fontWeight: 700, color: T.acento, fontFamily: T.fuenteDatos }}>{c.unidades_utilizadas} u.</td>
                        <td style={{ padding: '13px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button onClick={() => iniciarEdicion(c)} style={botonAccion(T.primario)}>✏️ Editar</button>
                            <button onClick={() => eliminarConsumo(c)} disabled={eliminandoId === c.id} style={botonAccion(T.alerta)}>
                              {eliminandoId === c.id ? '...' : '🗑️ Eliminar'}
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
