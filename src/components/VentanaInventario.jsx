import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import XLSX from 'xlsx-js-style';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function VentanaInventario() {
  const [nombreMed, setNombreMed] = useState('');
  const [existenciaInicial, setExistenciaInicial] = useState('');
  const [medicamentos, setMedicamentos] = useState([]);
  const [consumos, setConsumos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [medicamentoConsultaId, setMedicamentoConsultaId] = useState('');
  const [esMovil, setEsMovil] = useState(false);

  useEffect(() => {
    cargarDatos();
    const verificarResolucion = () => setEsMovil(window.innerWidth < 768);
    verificarResolucion();
    window.addEventListener('resize', verificarResolucion);
    return () => window.removeEventListener('resize', verificarResolucion);
  }, []);

  const cargarDatos = async () => {
    const { data: dataMed } = await supabase.from('medicamentos').select('*');
    if (dataMed) setMedicamentos(dataMed);
    const { data: dataCons } = await supabase.from('consumos').select('*');
    if (dataCons) setConsumos(dataCons);
  };

  const registrarMedicamento = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('medicamentos').insert([
      { nombre: nombreMed, existencia: parseInt(existenciaInicial) }
    ]);
    if (!error) {
      alert('Medicamento añadido al catálogo.');
      setNombreMed(''); setExistenciaInicial('');
      cargarDatos();
    }
  };

  const exportarExcel = () => {
    if (medicamentosFiltrados.length === 0) return;
    const estiloEncabezado = {
      fill: { fgColor: { rgb: "008064" } },
      font: { color: { rgb: "FFFFFF" }, bold: true, name: "Arial", sz: 11 },
      alignment: { horizontal: "center", vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "CCCCCC" } }, bottom: { style: "medium", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "CCCCCC" } }, right: { style: "thin", color: { rgb: "CCCCCC" } }
      }
    };
    const estiloCelda = {
      font: { name: "Arial", sz: 10 }, alignment: { vertical: "center" },
      border: {
        top: { style: "thin", color: { rgb: "E2E8F0" } }, bottom: { style: "thin", color: { rgb: "E2E8F0" } },
        left: { style: "thin", color: { rgb: "E2E8F0" } }, right: { style: "thin", color: { rgb: "E2E8F0" } }
      }
    };

    const encabezados = [
      { v: "MEDICAMENTO", t: "s", s: estiloEncabezado },
      { v: "ESTADO DE ALERTA", t: "s", s: estiloEncabezado },
      { v: "EXISTENCIA DISPONIBLE", t: "s", s: estiloEncabezado }
    ];

    const filasDatos = medicamentosFiltrados.map(m => [
      { v: m.nombre, t: "s", s: estiloCelda },
      { v: m.existencia > 15 ? 'Existencias Óptimas' : 'Existencias Críticas', t: "s", s: { ...estiloCelda, alignment: { horizontal: "center" } } },
      { v: `${m.existencia} u.`, t: "s", s: { ...estiloCelda, alignment: { horizontal: "right" }, font: { bold: true } } }
    ]);

    const hoja = XLSX.utils.aoa_to_sheet([encabezados, ...filasDatos]);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'INVENTARIO');
    hoja['!cols'] = [ { wch: 32 }, { wch: 22 }, { wch: 25 } ];
    XLSX.writeFile(libro, `REPORTE_INVENTARIO_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportarPDF = () => {
    if (medicamentosFiltrados.length === 0) return;
    const doc = new jsPDF();
    autoTable(doc, {
      startY: 20,
      head: [['MEDICAMENTO', 'ESTADO DE ALERTA', 'EXISTENCIA DISPONIBLE']],
      body: medicamentosFiltrados.map(m => [m.nombre, m.existencia > 15 ? 'Existencias Óptimas' : 'Existencias Críticas', `${m.existencia} u.`]),
      headStyles: { fillColor: [0, 128, 100], halign: 'center' },
      alternateRowStyles: { fillColor: [245, 247, 250] }
    });
    doc.save('Reporte_Inventario.pdf');
  };

  const totalExistencia = medicamentos.reduce((acc, m) => acc + (Number(m.existencia) || 0), 0);
  const totalConsumo = consumos.reduce((acc, c) => acc + (Number(c.unidades_utilizadas) || 0), 0);
  const medicamentosFiltrados = medicamentos.filter(m => m.nombre.toLowerCase().includes(busqueda.toLowerCase()));
  const medConsultado = medicamentos.find(m => m.id?.toString() === medicamentoConsultaId?.toString());

  const datosGrafico = medicamentosFiltrados.map(m => ({
    name: m.nombre.length > 15 ? m.nombre.substring(0, 15) + '...' : m.nombre,
    Existencias: m.existencia
  }));

  return (
    <div style={{ padding: esMovil ? '12px' : '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: esMovil ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* CONSULTA RÁPIDA */}
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 14px 0', color: '#0f172a' }}>Consulta Rápida</h2>
            <select value={medicamentoConsultaId} onChange={e => setMedicamentoConsultaId(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '0.95rem' }}>
              <option value="">-- Seleccionar fármaco --</option>
              {medicamentos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
            {medConsultado && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', marginTop: '14px', border: '1px dashed #e2e8f0' }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#334155' }}>{medConsultado.nombre}</span>
                <span style={{ color: medConsultado.existencia > 15 ? '#008064' : '#ef4444', fontWeight: 700, fontSize: '1.1rem' }}>{medConsultado.existencia} u.</span>
              </div>
            )}
          </div>

          {/* ALTA EN CATÁLOGO */}
          <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 14px 0', color: '#0f172a' }}>Alta en Catálogo</h2>
            <form onSubmit={registrarMedicamento} style={{ display: 'flex', flexDirection: esMovil ? 'column' : 'row', gap: '12px' }}>
              <input type="text" value={nombreMed} onChange={e => setNombreMed(e.target.value)} placeholder="Medicamento" required style={{ flex: 2, padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
              <input type="number" value={existenciaInicial} onChange={e => setExistenciaInicial(e.target.value)} placeholder="Existencias" required style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
              <button type="submit" style={{ padding: '12px 20px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: 'pointer' }}>Registrar</button>
            </form>
          </div>
        </div>

        {/* GRÁFICO */}
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 14px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '4px', height: '16px', backgroundColor: '#008064', display: 'inline-block', borderRadius: '2px' }}></span>
            Balance Visual de Almacén
          </h2>
          <div style={{ width: '100%', height: esMovil ? 220 : 180, fontSize: '0.75rem' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={datosGrafico} layout={esMovil ? "vertical" : "horizontal"} margin={{ top: 5, right: 15, left: esMovil ? 5 : -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                {esMovil ? <XAxis type="number" stroke="#94a3b8" /> : <XAxis dataKey="name" stroke="#94a3b8" />}
                {esMovil ? <YAxis dataKey="name" type="category" stroke="#94a3b8" width={85} /> : <YAxis type="number" stroke="#94a3b8" />}
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="Existencias" fill="#008064" radius={esMovil ? [0, 4, 4, 0] : [4, 4, 0, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* SECCIÓN INFERIOR: TABLA CON SCROLL REUTILIZABLE */}
      <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', flexDirection: esMovil ? 'column' : 'row', justifyContent: 'space-between', alignItems: esMovil ? 'stretch' : 'center', gap: '14px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Existencias en Inventario</h2>
          <div style={{ display: 'flex', gap: '10px', flexDirection: esMovil ? 'column' : 'row' }}>
            <input type="text" placeholder="Filtrar por nombre..." value={busqueda} onChange={e => setBusqueda(e.target.value)} style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem', minWidth: esMovil ? 'auto' : '240px' }} />
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button onClick={exportarExcel} style={{ flex: 1, padding: '10px 16px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem', color: '#334155', cursor: 'pointer' }}>📊 Excel</button>
              <button onClick={exportarPDF} style={{ flex: 1, padding: '10px 16px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem', color: '#334155', cursor: 'pointer' }}>📄 PDF</button>
            </div>
          </div>
        </div>

        {/* CONTENEDOR CON MAX-HEIGHT Y OVERFLOW AUTOMÁTICO PARA SCROLL */}
        <div style={{ maxHeight: '380px', overflowY: 'auto', paddingRight: '4px' }}>
          {esMovil ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {medicamentosFiltrados.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem', color: '#1e293b' }}>{m.nombre}</p>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: m.existencia > 15 ? '#008064' : '#ef4444' }}>
                      {m.existencia > 15 ? '● Existencias Óptimas' : '● Existencias Críticas'}
                    </span>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '1.05rem', color: '#0f172a' }}>{m.existencia} u.</span>
                </div>
              ))}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: '#fff', zIndex: 1 }}>
                <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '14px', color: '#475569', fontWeight: 700 }}>Medicamento</th>
                  <th style={{ padding: '14px', color: '#475569', fontWeight: 700 }}>Estado de Alerta</th>
                  <th style={{ padding: '14px', color: '#475569', fontWeight: 700, textAlign: 'right' }}>Existencia Disponible</th>
                </tr>
              </thead>
              <tbody>
                {medicamentosFiltrados.map(m => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '14px', fontWeight: 600, color: '#1e293b' }}>{m.nombre}</td>
                    <td style={{ padding: '14px' }}>
                      <span style={{ color: m.existencia > 15 ? '#008064' : '#ef4444', backgroundColor: m.existencia > 15 ? '#f0fdf4' : '#fef2f2', padding: '4px 8px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                        {m.existencia > 15 ? 'Existencias Óptimas' : 'Existencias Críticas'}
                      </span>
                    </td>
                    <td style={{ padding: '14px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>{m.existencia} u.</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
          <span>Consumo Acumulado: {totalConsumo} u.</span>
          <span>Existencias Globales de Almacén: {totalExistencia} u.</span>
        </div>
      </div>
    </div>
  );
}