import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import XLSX from 'xlsx-js-style';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

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
    const { data } = await supabase.from('consumos').select('*, medicamentos(nombre)');
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

    await supabase.from('consumos').insert([{
      codigo,
      unidad_prestacion: unidadPrest,
      medicamento_id: medicamentoId,
      fecha,
      unidades_utilizadas: unidadesUtilizadas,
      observacion
    }]);

    await supabase.from('medicamentos').update({ existencia: med.existencia - unidadesUtilizadas }).eq('id', medicamentoId);

    setCodigo(''); setUnidades(''); setObservacion(''); setMedicamentoId(''); setUnidadPrest('TAB');
    obtenerMedicamentos(); obtenerConsumos();
  };

  const exportarExcelConsumos = () => {
    if (consumosFiltrados.length === 0) return;
    const estiloEncabezado = {
      fill: { fgColor: { rgb: "008064" } },
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
      { v: c.codigo, t: "s", s: estiloCeldaCentrado },
      { v: c.unidad_prestacion, t: "s", s: estiloCeldaCentrado },
      { v: c.medicamentos?.nombre || 'N/A', t: "s", s: estiloCelda },
      { v: c.fecha, t: "s", s: estiloCeldaCentrado },
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
      body: consumosFiltrados.map(c => [c.codigo, c.unidad_prestacion, c.medicamentos?.nombre || 'N/A', c.fecha, `${c.unidades_utilizadas} u.`]),
      headStyles: { fillColor: [0, 128, 100] }
    });
    doc.save('Reporte_Consumos.pdf');
  };

  const consumosFiltrados = consumos.filter(c =>
    c.codigo.toLowerCase().includes(busqueda.toLowerCase()) || c.medicamentos?.nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const consumosPorFecha = consumosFiltrados.reduce((acc, c) => {
    const fechaCortada = c.fecha ? c.fecha.substring(5, 10) : 'N/A';
    acc[fechaCortada] = (acc[fechaCortada] || 0) + (Number(c.unidades_utilizadas) || 0);
    return acc;
  }, {});

  const datosGraficoLinea = Object.keys(consumosPorFecha).sort().map(fecha => ({
    Fecha: fecha,
    Unidades: consumosPorFecha[fecha]
  }));

  return (
    <div style={{
      padding: esMovil ? '16px' : '24px',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      boxSizing: 'border-box'
    }}>

      <div style={{ display: 'grid', gridTemplateColumns: esMovil ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: '20px' }}>

        {/* FORMULARIO */}
        <div style={{ backgroundColor: '#fff', padding: esMovil ? '20px 18px' : '20px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 18px 0', color: '#0f172a' }}>Registro de Evaluación</h2>
          <form onSubmit={manejarGuardar} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: esMovil ? '1fr' : '1fr 1fr', gap: '14px' }}>
              <input type="text" value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="Código Manual" required
                style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />

              <div>
                {esMovil && <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '5px' }}>U. Prestación (auto)</label>}
                <input type="text" value={unidadPrest} disabled placeholder="U. Prestación"
                  style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#eef2f0', color: '#475569', fontWeight: 700, fontSize: '0.95rem' }} />
              </div>
            </div>

            <select value={medicamentoId} onChange={e => manejarCambioMedicamento(e.target.value)} required
              style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '0.95rem' }}>
              <option value="">Seleccione fármaco...</option>
              {medicamentos.map(m => (
                <option key={m.id} value={m.id}>
                  {m.nombre} ({m.existencia} u. disp.) [{m.unidad_prestacion}]
                </option>
              ))}
            </select>

            <div style={{ display: 'grid', gridTemplateColumns: esMovil ? '1fr' : '1fr 1fr', gap: '14px' }}>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} required
                style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
              <input type="number" value={unidades} onChange={e => setUnidades(e.target.value)} placeholder="Cantidad" required
                style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
            </div>

            <textarea value={observacion} onChange={e => setObservacion(e.target.value)} placeholder="Observaciones facultativas..."
              style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem', minHeight: '60px', fontFamily: 'inherit' }}></textarea>

            <button type="submit"
              style={{ padding: '15px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}>
              Guardar Entrada
            </button>
          </form>
        </div>

        {/* GRÁFICO TENDENCIA */}
        <div style={{ backgroundColor: '#fff', padding: esMovil ? '20px 18px' : '20px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 16px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '4px', height: '16px', backgroundColor: '#0284c7', display: 'inline-block', borderRadius: '2px' }}></span>
            Tendencia de Unidades Dispensadas
          </h2>

          {datosGraficoLinea.length === 0 ? (
            <div style={{
              width: '100%', height: esMovil ? 180 : 230,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '8px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1'
            }}>
              <span style={{ fontSize: '1.5rem' }}>📊</span>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem', textAlign: 'center', padding: '0 20px' }}>
                Aún no hay consumos registrados para mostrar la tendencia
              </p>
            </div>
          ) : (
            <div style={{ width: '100%', height: esMovil ? 210 : 230, fontSize: '0.7rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={datosGraficoLinea} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="Fecha" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Line type="monotone" dataKey="Unidades" stroke="#0284c7" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* HISTORIAL INFERIOR */}
      <div style={{ backgroundColor: '#fff', padding: esMovil ? '20px 18px' : '20px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', flexDirection: esMovil ? 'column' : 'row', justifyContent: 'space-between', alignItems: esMovil ? 'stretch' : 'center', gap: '14px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Historial de Salidas Clínicas</h2>
          <div style={{ display: 'flex', gap: '10px', flexDirection: esMovil ? 'column' : 'row' }}>
            <input type="text" placeholder="Buscar por código o fármaco..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', minWidth: esMovil ? 'auto' : '260px' }} />
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button onClick={exportarExcelConsumos} style={{ flex: 1, padding: '12px 16px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem', color: '#334155', cursor: 'pointer' }}>📊 Excel</button>
              <button onClick={exportarPDFConsumos} style={{ flex: 1, padding: '12px 16px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem', color: '#334155', cursor: 'pointer' }}>📄 PDF</button>
            </div>
          </div>
        </div>

        <div style={{ maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
          {consumosFiltrados.length === 0 ? (
            <div style={{ padding: '30px 10px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
              No hay salidas registradas todavía
            </div>
          ) : esMovil ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {consumosFiltrados.map(c => (
                <div key={c.id} style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 700, color: '#0284c7', fontFamily: 'monospace', fontSize: '0.85rem' }}>{c.codigo}</span>
                    <span style={{ color: '#64748b', fontSize: '0.78rem' }}>{c.fecha}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.92rem', gap: '8px' }}>
                    <span>{c.medicamentos?.nombre || 'N/A'}</span>
                    <span style={{ color: '#0f172a', whiteSpace: 'nowrap' }}>{c.unidades_utilizadas} u. ({c.unidad_prestacion})</span>
                  </div>
                  {c.observacion && <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic' }}>Obs: {c.observacion}</p>}
                </div>
              ))}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1 }}>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '14px', color: '#475569' }}>Código</th>
                  <th style={{ padding: '14px', color: '#475569' }}>U. Prestación</th>
                  <th style={{ padding: '14px', color: '#475569' }}>Medicamento</th>
                  <th style={{ padding: '14px', color: '#475569' }}>Fecha</th>
                  <th style={{ padding: '14px', color: '#475569', textAlign: 'right' }}>Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {consumosFiltrados.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '0.95rem' }}>
                    <td style={{ padding: '14px', fontFamily: 'monospace', fontWeight: 600, color: '#0284c7' }}>{c.codigo}</td>
                    <td style={{ padding: '14px', color: '#64748b' }}>{c.unidad_prestacion}</td>
                    <td style={{ padding: '14px', fontWeight: 600 }}>{c.medicamentos?.nombre || 'N/A'}</td>
                    <td style={{ padding: '14px', color: '#64748b' }}>{c.fecha}</td>
                    <td style={{ padding: '14px', textAlign: 'right', fontWeight: 700 }}>{c.unidades_utilizadas} u.</td>
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
