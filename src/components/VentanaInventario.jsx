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
  const [registrando, setRegistrando] = useState(false);

  useEffect(() => {
    cargarDatos();
    const verificarResolucion = () => setEsMovil(window.innerWidth < 768);
    verificarResolucion();
    window.addEventListener('resize', verificarResolucion);
    return () => window.removeEventListener('resize', verificarResolucion);
  }, []);

  const cargarDatos = async () => {
    const { data: dataMed } = await supabase.from('medicamentos').select('*').order('nombre', { ascending: true });
    if (dataMed) setMedicamentos(dataMed);
    const { data: dataCons } = await supabase.from('consumos').select('*');
    if (dataCons) setConsumos(dataCons);
  };

  const registrarMedicamento = async (e) => {
    e.preventDefault();
    setRegistrando(true);
    const { error } = await supabase.from('medicamentos').insert([
      { nombre: nombreMed, existencia: parseInt(existenciaInicial) }
    ]);
    if (!error) {
      setNombreMed(''); setExistenciaInicial('');
      await cargarDatos();
    } else {
      alert('Error al registrar: ' + error.message);
    }
    setRegistrando(false);
  };

  // --- Filtro seguro contra nombres null/undefined ---
  const medicamentosFiltrados = medicamentos.filter(m =>
    (m.nombre || '').toLowerCase().includes(busqueda.toLowerCase())
  );

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
      { v: m.nombre || '', t: "s", s: estiloCelda },
      { v: m.existencia > 15 ? 'Existencias Óptimas' : 'Existencias Críticas', t: "s", s: { ...estiloCelda, alignment: { horizontal: "center" } } },
      { v: `${m.existencia} u.`, t: "s", s: { ...estiloCelda, alignment: { horizontal: "right" }, font: { bold: true } } }
    ]);

    const hoja = XLSX.utils.aoa_to_sheet([encabezados, ...filasDatos]);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'INVENTARIO');
    hoja['!cols'] = [{ wch: 32 }, { wch: 22 }, { wch: 25 }];
    XLSX.writeFile(libro, `REPORTE_INVENTARIO_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportarPDF = () => {
    if (medicamentosFiltrados.length === 0) return;
    const doc = new jsPDF();
    autoTable(doc, {
      startY: 20,
      head: [['MEDICAMENTO', 'ESTADO DE ALERTA', 'EXISTENCIA DISPONIBLE']],
      body: medicamentosFiltrados.map(m => [m.nombre || '', m.existencia > 15 ? 'Existencias Óptimas' : 'Existencias Críticas', `${m.existencia} u.`]),
      headStyles: { fillColor: [0, 128, 100], halign: 'center' },
      alternateRowStyles: { fillColor: [245, 247, 250] }
    });
    doc.save('Reporte_Inventario.pdf');
  };

  const totalExistencia = medicamentos.reduce((acc, m) => acc + (Number(m.existencia) || 0), 0);
  const totalConsumo = consumos.reduce((acc, c) => acc + (Number(c.unidades_utilizadas) || 0), 0);
  const medConsultado = medicamentos.find(m => m.id?.toString() === medicamentoConsultaId?.toString());

  const datosGrafico = medicamentosFiltrados.map(m => ({
    name: (m.nombre || '').length > 15 ? m.nombre.substring(0, 15) + '...' : (m.nombre || ''),
    Existencias: m.existencia
  }));

  return (
    <div style={{
      padding: esMovil ? '14px' : '24px',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      boxSizing: 'border-box',
      width: '100%'
    }}>

      <div style={{ display: 'grid', gridTemplateColumns: esMovil ? '1fr' : '1fr 1fr', gap: esMovil ? '14px' : '20px', marginBottom: esMovil ? '14px' : '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: esMovil ? '14px' : '20px' }}>

          {/* CONSULTA RÁPIDA */}
          <div style={{ backgroundColor: '#fff', padding: esMovil ? '18px 16px' : '20px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 14px 0', color: '#0f172a' }}>Consulta Rápida</h2>
            <select value={medicamentoConsultaId} onChange={e => setMedicamentoConsultaId(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '0.9rem' }}>
              <option value="">-- Seleccionar fármaco --</option>
              {medicamentos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
            {medConsultado && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px', marginTop: '14px', border: '1px dashed #e2e8f0', gap: '10px' }}>
                <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#334155' }}>{medConsultado.nombre}</span>
                <span style={{ color: medConsultado.existencia > 15 ? '#008064' : '#ef4444', fontWeight: 700, fontSize: '1.05rem', whiteSpace: 'nowrap' }}>{medConsultado.existencia} u.</span>
              </div>
            )}
          </div>

          {/* ALTA EN CATÁLOGO */}
          <div style={{ backgroundColor: '#fff', padding: esMovil ? '18px 16px' : '20px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 14px 0', color: '#0f172a' }}>Alta en Catálogo</h2>
            <form onSubmit={registrarMedicamento} style={{ display: 'flex', flexDirection: esMovil ? 'column' : 'row', gap: '12px' }}>
              <input type="text" value={nombreMed} onChange={e => setNombreMed(e.target.value)} placeholder="Medicamento" required
                style={{ flex: esMovil ? 'none' : 2, width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
              <input type="number" value={existenciaInicial} onChange={e => setExistenciaInicial(e.target.value)} placeholder="Existencias" required
                style={{ flex: esMovil ? 'none' : 1, width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.9rem' }} />
              <button type="submit" disabled={registrando}
                style={{ width: esMovil ? '100%' : 'auto', padding: '12px 20px', backgroundColor: registrando ? '#94a3b8' : '#0f172a', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: 600, cursor: registrando ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                {registrando ? 'Guardando...' : 'Registrar'}
              </button>
            </form>
          </div>
        </div>

        {/* GRÁFICO */}
        <div style={{ backgroundColor: '#fff', padding: esMovil ? '18px 16px' : '20px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 14px 0', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '4px', height: '16px', backgroundColor: '#008064', display: 'inline-block', borderRadius: '2px' }}></span>
            Balance Visual de Almacén
          </h2>
          {datosGrafico.length === 0 ? (
            <div style={{
              width: '100%', height: esMovil ? 180 : 180,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '8px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1'
            }}>
              <span style={{ fontSize: '1.4rem' }}>💊</span>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.82rem', textAlign: 'center', padding: '0 16px' }}>
                Aún no hay medicamentos en el catálogo
              </p>
            </div>
          ) : (
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
          )}
        </div>
      </div>

      {/* SECCIÓN INFERIOR: EXISTENCIAS */}
      <div style={{ backgroundColor: '#fff', padding: esMovil ? '18px 16px' : '20px', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexDirection: esMovil ? 'column' : 'row', justifyContent: 'space-between', alignItems: esMovil ? 'stretch' : 'center', gap: '12px', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>
            Existencias en Inventario {medicamentosFiltrados.length > 0 && <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: '0.8rem' }}>({medicamentosFiltrados.length})</span>}
          </h2>
          <div style={{ display: 'flex', gap: '10px', flexDirection: esMovil ? 'column' : 'row' }}>
            <input type="text" placeholder="Filtrar por nombre..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '0.88rem', minWidth: esMovil ? 'auto' : '240px' }} />
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button onClick={exportarExcel} style={{ flex: 1, padding: '11px 14px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 600, fontSize: '0.85rem', color: '#334155', cursor: 'pointer' }}>📊 Excel</button>
              <button onClick={exportarPDF} style={{ flex: 1, padding: '11px 14px', backgroundColor: '#fff', border: '1px solid #cbd5e1', borderRadius: '10px', fontWeight: 600, fontSize: '0.85rem', color: '#334155', cursor: 'pointer' }}>📄 PDF</button>
            </div>
          </div>
        </div>

        <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
          {medicamentosFiltrados.length === 0 ? (
            <div style={{ padding: '36px 10px', textAlign: 'center', color: '#94a3b8', fontSize: '0.88rem' }}>
              {medicamentos.length === 0 ? 'No hay medicamentos registrados todavía' : 'No se encontraron resultados para tu búsqueda'}
            </div>
          ) : esMovil ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {medicamentosFiltrados.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', gap: '10px' }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.92rem', color: '#1e293b', wordBreak: 'break-word' }}>{m.nombre}</p>
                    <span style={{ fontSize: '0.74rem', fontWeight: 600, color: m.existencia > 15 ? '#008064' : '#ef4444' }}>
                      {m.existencia > 15 ? '● Existencias Óptimas' : '● Existencias Críticas'}
                    </span>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a', whiteSpace: 'nowrap' }}>{m.existencia} u.</span>
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

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: esMovil ? 'column' : 'row', gap: esMovil ? '8px' : '0', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
          <span>Consumo Acumulado: {totalConsumo} u.</span>
          <span>Existencias Globales de Almacén: {totalExistencia} u.</span>
        </div>
      </div>
    </div>
  );
}
