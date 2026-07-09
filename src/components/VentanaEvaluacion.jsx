import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import XLSX from 'xlsx-js-style';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function VentanaEvaluacion() {
  const [codigo, setCodigo] = useState('');
  const [unidadPrest, setUnidadPrest] = useState('TAB'); // Se auto-completará sola
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
    // Traemos de la base de datos la nueva columna unidad_prestacion
    const { data } = await supabase.from('medicamentos').select('id, nombre, existencia, unidad_prestacion').order('nombre', { ascending: true });
    if (data) setMedicamentos(data);
  };

  const obtenerConsumos = async () => {
    const { data } = await supabase.from('consumos').select('*, medicamentos(nombre)');
    if (data) setConsumos(data);
  };

  // Manejador cuando cambia el select del medicamento
  const manejarCambioMedicamento = (id) => {
    setMedicamentoId(id);
    const medSeleccionado = medicamentos.find(m => m.id?.toString() === id.toString());
    if (medSeleccionado) {
      setUnidadPrest(medSeleccionado.unidad_prestacion || 'TAB');
    } else {
      setUnidadPrest('TAB');
    }
  };

  const manejarGuardar = async (e) => {
    e.preventDefault();
    const unidadesUtilizadas = parseInt(unidades);
    const med = medicamentos.find(m => m.id?.toString() === medicamentoId?.toString());
    
    if (!med || med.existencia < unidadesUtilizadas) {
      alert('Stock insuficiente');
      return;
    }

    // Insertamos usando la unidad de prestación amarrada al fármaco automáticamente
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

  // --- ANCHO DE COLUMNAS (en caracteres aprox.) ---
  hoja['!cols'] = [
    { wch: 14 }, // CÓDIGO
    { wch: 16 }, // U. PRESTACIÓN
    { wch: 38 }, // MEDICAMENTO ADMINISTRADO
    { wch: 16 }, // FECHA REGISTRO
    { wch: 12 }  // CANTIDAD
  ];

  // --- ALTO DE FILAS ---
  hoja['!rows'] = [
    { hpt: 26 }, // fila de encabezado un poco más alta
    ...filasDatos.map(() => ({ hpt: 20 })) // filas de datos
  ];

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
    <div style={{ padding: esMovil ? '12px' : '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: esMovil ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        
        {/* FORMULARIO */}
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 16px 0', color: '#0f172a' }}>Registro de Evaluación</h2>
          <form onSubmit={manejarGuardar} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: esMovil ? '1fr' : '1fr 1fr', gap: '12px' }}>
              <input type="text" value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="Código Manual" required style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
              
              {/* CAMPO DE UNIDAD DE PRESTACIÓN AUTO-BLOQUEADO */}
              <input type="text" value={unidadPrest} disabled placeholder="U. Prestación" style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#e2e8f0', color: '#475569', fontWeight: 'bold', fontSize: '0.9rem' }} />
            </div>

            {/* SELECT DE MEDICAMENTOS ACTUALIZADO */}
            <select value={medicamentoId} onChange={e => manejarCambioMedicamento(e.target.value)} required style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '0.9rem' }}>
              <option value="">Seleccione fármaco...</option>
              {medicamentos.map(m => (
                <option key={m.id} value={m.id}>
                  {m.nombre} ({m.existencia} u. disp.) [{m.unidad_prestacion}]
                </option>
              ))}
            </select>

            <div style={{ display: 'grid', gridTemplateColumns: esMovil ? '1fr' : '1fr 1fr', gap: '12px' }}>
              <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} required style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
              <input type="number" value={unidades} onChange={e => setUnidades(e.target.value)} placeholder="Cantidad" required style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
            </div>
            <textarea value={observacion} onChange={e => setObservacion(e.target.value)} placeholder="Observaciones facultativas..." style={{ padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', minHeight: '50px', fontFamily: 'inherit' }}></textarea>
            <button type="submit" style={{ padding: '14px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>Guardar Entrada</button>
          </form>
        </div>

        {/* GRÁFICO TENDENCIA */}
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 14px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '4px', height: '16px', backgroundColor: '#0284c7', display: 'inline-block', borderRadius: '2px' }}></span>
            Tendencia de Unidades Dispensadas
          </h2>
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
        </div>
      </div>

      {/* HISTORIAL INFERIOR CON SCROLL CONTROLADO */}
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', flexDirection: esMovil ? 'column' : 'row', justifyContent: 'space-between', alignItems: esMovil ? 'stretch' : 'center', gap: '14px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Historial de Salidas Clínicas</h2>
          <div style={{ display: 'flex', gap: '10px', flexDirection: esMovil ? 'column' : 'row' }}>
            <input type="text" placeholder="Buscar por código o fármaco..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', minWidth: esMovil ? 'auto' : '260px' }} />
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button onClick={exportarExcelConsumos} style={{ flex: 1, padding: '10px 16px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem', color: '#334155', cursor: 'pointer' }}>📊 Excel</button>
              <button onClick={exportarPDFConsumos} style={{ flex: 1, padding: '10px 16px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem', color: '#334155', cursor: 'pointer' }}>📄 PDF</button>
            </div>
          </div>
        </div>

        {/* CONTENEDOR CON SCROLL ACTIVO (MÁXIMO 380px DE ALTO) */}
        <div style={{ maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
          {esMovil ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {consumosFiltrados.map(c => (
                <div key={c.id} style={{ padding: '14px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, color: '#0284c7', fontFamily: 'monospace' }}>{c.codigo}</span>
                    <span style={{ color: '#64748b', fontSize: '0.8rem' }}>{c.fecha}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '0.9rem' }}>
                    <span>{c.medicamentos?.nombre || 'N/A'}</span>
                    <span style={{ color: '#0f172a' }}>{c.unidades_utilizadas} u. ({c.unidad_prestacion})</span>
                  </div>
                  {c.observacion && <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '0.8rem', fontStyle: 'italic' }}>Obs: {c.observacion}</p>}
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