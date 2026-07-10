import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import XLSX from 'xlsx-js-style';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { THEME as T, estiloSello } from '../theme';

export default function VentanaEvaluacion() {
  const [codigo, setCodigo] = useState('');
  const [unidadPrest, setUnidadPrest] = useState('TAB');
  const [medicamentoId, setMedicamentoId] = useState('');
  const [fecha, setFecha] = useState('');
  const [unidades, setUnidades] = useState('');
  const [observacion, setObservacion] = useState('');
  const [medicamentos, setMedicamentos] = useState([]);
  const [consumos, setConsumos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [esMovil, setEsMovil] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    obtenerMedicamentos();
    obtenerConsumos();
    const verificarResolucion = () => setEsMovil(window.innerWidth < 768);
    verificarResolucion();
    window.addEventListener('resize', verificarResolucion);
    return () => window.removeEventListener('resize', verificarResolucion);
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

  const manejarCambioMedicamento = (id) => {
    setMedicamentoId(id);
    const medSeleccionado = medicamentos.find(m => m.id?.toString() === id.toString());
    setUnidadPrest(medSeleccionado ? (medSeleccionado.unidad_prestacion || 'TAB') : 'TAB');
  };

  const manejarGuardar = async (e) => {
    e.preventDefault();
    const unidadesUtilizadas = parseInt(unidades);
    const med = medicamentos.find(m => m.id?.toString() === medicamentoId?.toString());

    if (!med || med.existencia < unidadesUtilizadas) {
      alert('Stock insuficiente');
      return;
    }

    setGuardando(true);
    const { error } = await supabase.from('consumos').insert([{
      codigo, unidad_prestacion: unidadPrest, medicamento_id: medicamentoId,
      fecha, unidades_utilizadas: unidadesUtilizadas, observacion
    }]);

    if (error) { alert('Error al guardar: ' + error.message); setGuardando(false); return; }

    await supabase.from('medicamentos').update({ existencia: med.existencia - unidadesUtilizadas }).eq('id', medicamentoId);

    setCodigo(''); setUnidades(''); setObservacion(''); setMedicamentoId(''); setUnidadPrest('TAB');
    await obtenerMedicamentos();
    await obtenerConsumos();
    setGuardando(false);
  };

  const consumosFiltrados = consumos.filter(c => {
    const texto = busqueda.toLowerCase();
    const codigoTxt = (c.codigo || '').toLowerCase();
    const nombreTxt = (c.medicamentos?.nombre || '').toLowerCase();
    return codigoTxt.includes(texto) || nombreTxt.includes(texto);
  });

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

  const consumosPorFecha = consumosFiltrados.reduce((acc, c) => {
    const fechaCortada = c.fecha ? c.fecha.substring(5, 10) : 'N/A';
    acc[fechaCortada] = (acc[fechaCortada] || 0) + (Number(c.unidades_utilizadas) || 0);
    return acc;
  }, {});

  const datosGraficoLinea = Object.keys(consumosPorFecha).sort().map(fecha => ({
    Fecha: fecha,
    Unidades: consumosPorFecha[fecha]
  }));

  // --- Estilos reutilizables derivados del tema ---
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
  const h2 = { fontSize: '1.05rem', fontWeight: 700, margin: 0, color: T.tinta, fontFamily: T.fuenteTitulo };

  return (
    <div style={{
      padding: esMovil ? '14px' : '24px',
      maxWidth: '1200px', margin: '0 auto',
      fontFamily: T.fuenteCuerpo,
      backgroundColor: T.bgPagina,
      minHeight: '100vh', boxSizing: 'border-box', width: '100%'
    }}>

      <div style={{ display: 'grid', gridTemplateColumns: esMovil ? '1fr' : '1fr 1fr', gap: esMovil ? '14px' : '20px', marginBottom: esMovil ? '14px' : '20px' }}>

        {/* FORMULARIO */}
        <div style={tarjeta}>
          <span style={estiloSello(T.primario)}>Ficha · Evaluación</span>
          <h2 style={{ ...h2, marginBottom: '16px' }}>Registro de Evaluación</h2>
          <form onSubmit={manejarGuardar} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: esMovil ? '1fr' : '1fr 1fr', gap: '12px' }}>
              <input type="text" value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="Código Manual" required style={input} />
              <input type="text" value={unidadPrest} disabled placeholder="U. Prestación"
                style={{ ...input, backgroundColor: T.primarioSuave, color: T.primario, fontWeight: 700, fontFamily: T.fuenteDatos, border: `1px solid ${T.primarioSuave}` }} />
            </div>

            <select value={medicamentoId} onChange={e => manejarCambioMedicamento(e.target.value)} required style={input}>
              <option value="">Seleccione fármaco...</option>
              {medicamentos.map(m => (
                <option key={m.id} value={m.id}>
                  {m.nombre} ({m.existencia} u. disp.) [{m.unidad_prestacion}]
                </option>
              ))}
            </select>

            <div style={{ display: 'grid', gridTemplateColumns: esMovil ? '1fr' : '1fr 1fr', gap: '12px' }}>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} required style={input} />
              <input type="number" value={unidades} onChange={e => setUnidades(e.target.value)} placeholder="Cantidad" required style={input} />
            </div>

            <textarea value={observacion} onChange={e => setObservacion(e.target.value)} placeholder="Observaciones facultativas..."
              style={{ ...input, minHeight: '55px', fontFamily: T.fuenteCuerpo, resize: 'vertical' }}></textarea>

            <button type="submit" disabled={guardando}
              style={{
                padding: '14px', backgroundColor: guardando ? T.tintaTenue : T.primario, color: '#fff',
                border: 'none', borderRadius: T.radioControl, fontWeight: 700, fontSize: '0.95rem',
                cursor: guardando ? 'not-allowed' : 'pointer', fontFamily: T.fuenteCuerpo,
                letterSpacing: '0.01em', transition: 'background-color 0.15s'
              }}>
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
        <div style={{ display: 'flex', flexDirection: esMovil ? 'column' : 'row', justifyContent: 'space-between', alignItems: esMovil ? 'stretch' : 'flex-start', gap: '14px', marginBottom: '16px' }}>
          <div>
            <span style={estiloSello(T.primario)}>Historial</span>
            <h2 style={h2}>
              Salidas Clínicas {consumosFiltrados.length > 0 && <span style={{ color: T.tintaTenue, fontWeight: 500, fontSize: '0.8rem', fontFamily: T.fuenteCuerpo }}>({consumosFiltrados.length})</span>}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexDirection: esMovil ? 'column' : 'row' }}>
            <input type="text" placeholder="Buscar por código o fármaco..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
              style={{ ...input, minWidth: esMovil ? 'auto' : '260px', padding: '11px 14px', fontSize: '0.88rem' }} />
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button onClick={exportarExcelConsumos} style={{ flex: 1, padding: '11px 14px', backgroundColor: T.bgTarjeta, border: `1px solid ${T.borde}`, borderRadius: T.radioControl, fontWeight: 600, fontSize: '0.85rem', color: T.primario, cursor: 'pointer' }}>📊 Excel</button>
              <button onClick={exportarPDFConsumos} style={{ flex: 1, padding: '11px 14px', backgroundColor: T.bgTarjeta, border: `1px solid ${T.borde}`, borderRadius: T.radioControl, fontWeight: 600, fontSize: '0.85rem', color: T.alerta, cursor: 'pointer' }}>📄 PDF</button>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '4px' }}>
                    <span style={{ fontWeight: 700, color: T.primario, fontFamily: T.fuenteDatos, fontSize: '0.82rem', wordBreak: 'break-all' }}>{c.codigo || '—'}</span>
                    <span style={{ color: T.tintaSecundaria, fontSize: '0.76rem', whiteSpace: 'nowrap' }}>{c.fecha || '—'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.9rem', gap: '8px' }}>
                    <span style={{ color: T.tinta }}>{c.medicamentos?.nombre || 'N/A'}</span>
                    <span style={{ color: T.acento, whiteSpace: 'nowrap', fontFamily: T.fuenteDatos }}>{c.unidades_utilizadas} u. ({c.unidad_prestacion})</span>
                  </div>
                  {c.observacion && <p style={{ margin: '8px 0 0 0', color: T.tintaSecundaria, fontSize: '0.78rem', fontStyle: 'italic' }}>Obs: {c.observacion}</p>}
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
                </tr>
              </thead>
              <tbody>
                {consumosFiltrados.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: `1px solid ${T.bordeSuave}`, fontSize: '0.92rem', backgroundColor: i % 2 === 0 ? T.bgTarjeta : T.bgSutil }}>
                    <td style={{ padding: '13px 14px', fontFamily: T.fuenteDatos, fontWeight: 600, color: T.primario }}>{c.codigo || '—'}</td>
                    <td style={{ padding: '13px 14px', color: T.tintaSecundaria }}>{c.unidad_prestacion || '—'}</td>
                    <td style={{ padding: '13px 14px', fontWeight: 600, color: T.tinta }}>{c.medicamentos?.nombre || 'N/A'}</td>
                    <td style={{ padding: '13px 14px', color: T.tintaSecundaria }}>{c.fecha || '—'}</td>
                    <td style={{ padding: '13px 14px', textAlign: 'right', fontWeight: 700, color: T.acento, fontFamily: T.fuenteDatos }}>{c.unidades_utilizadas} u.</td>
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
