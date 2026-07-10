import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import XLSX from 'xlsx-js-style';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { THEME as T, estiloSello } from '../theme';

export default function VentanaInventario() {
  const [nombreMed, setNombreMed] = useState('');
  const [medicamentos, setMedicamentos] = useState([]);
  const [consumos, setConsumos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [medicamentoConsultaId, setMedicamentoConsultaId] = useState('');
  const [esMovil, setEsMovil] = useState(false);
  const [registrando, setRegistrando] = useState(false);

  const [medicamentoRestockId, setMedicamentoRestockId] = useState('');
  const [cantidadAgregar, setCantidadAgregar] = useState('');
  const [restockeando, setRestockeando] = useState(false);

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
    const { error } = await supabase.from('medicamentos').insert([{ nombre: nombreMed, existencia: 0 }]);
    if (!error) { setNombreMed(''); await cargarDatos(); }
    else { alert('Error al registrar: ' + error.message); }
    setRegistrando(false);
  };

  const agregarExistencias = async (e) => {
    e.preventDefault();
    const cantidad = parseInt(cantidadAgregar);
    const med = medicamentos.find(m => m.id?.toString() === medicamentoRestockId?.toString());

    if (!med || !cantidad || cantidad <= 0) {
      alert('Selecciona un medicamento y una cantidad válida');
      return;
    }

    setRestockeando(true);
    const { error } = await supabase
      .from('medicamentos')
      .update({ existencia: med.existencia + cantidad })
      .eq('id', medicamentoRestockId);

    if (error) { alert('Error al actualizar existencias: ' + error.message); }
    else { setMedicamentoRestockId(''); setCantidadAgregar(''); await cargarDatos(); }
    setRestockeando(false);
  };

  const medicamentosFiltrados = medicamentos.filter(m =>
    (m.nombre || '').toLowerCase().includes(busqueda.toLowerCase())
  );

  const exportarExcel = () => {
    if (medicamentosFiltrados.length === 0) return;
    const estiloEncabezado = {
      fill: { fgColor: { rgb: "1F5D4F" } },
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
      headStyles: { fillColor: [31, 93, 79], halign: 'center' },
      alternateRowStyles: { fillColor: [245, 248, 246] }
    });
    doc.save('Reporte_Inventario.pdf');
  };

  const medConsultado = medicamentos.find(m => m.id?.toString() === medicamentoConsultaId?.toString());
  const consumoDelSeleccionado = consumos
    .filter(c => c.medicamento_id?.toString() === medicamentoConsultaId?.toString())
    .reduce((acc, c) => acc + (Number(c.unidades_utilizadas) || 0), 0);

  const datosGrafico = medicamentosFiltrados.map(m => ({
    name: (m.nombre || '').length > 15 ? m.nombre.substring(0, 15) + '...' : (m.nombre || ''),
    Existencias: m.existencia
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: esMovil ? '14px' : '20px' }}>

          {/* CONSULTA RÁPIDA */}
          <div style={tarjeta}>
            <span style={estiloSello(T.primario)}>Consulta</span>
            <h2 style={{ ...h2, marginBottom: '14px' }}>Consulta Rápida</h2>
            <select value={medicamentoConsultaId} onChange={e => setMedicamentoConsultaId(e.target.value)} style={input}>
              <option value="">-- Seleccionar fármaco --</option>
              {medicamentos.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
            </select>
            {medConsultado && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: T.bgSutil, padding: '14px', borderRadius: '12px', marginTop: '14px', border: `1px dashed ${T.borde}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.88rem', color: T.tinta }}>{medConsultado.nombre}</span>
                  <span style={{ color: medConsultado.existencia > 15 ? T.exito : T.alerta, fontWeight: 700, fontSize: '1.05rem', whiteSpace: 'nowrap', fontFamily: T.fuenteDatos }}>{medConsultado.existencia} u. disp.</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', paddingTop: '8px', borderTop: `1px solid ${T.bordeSuave}` }}>
                  <span style={{ fontSize: '0.8rem', color: T.tintaSecundaria }}>Consumo acumulado</span>
                  <span style={{ color: T.acento, fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', fontFamily: T.fuenteDatos }}>{consumoDelSeleccionado} u.</span>
                </div>
              </div>
            )}
          </div>

          {/* NUEVO MEDICAMENTO */}
          <div style={tarjeta}>
            <span style={estiloSello(T.acento)}>Catálogo</span>
            <h2 style={{ ...h2, marginBottom: '6px' }}>Registrar Nuevo Medicamento</h2>
            <p style={{ margin: '0 0 14px 0', fontSize: '0.78rem', color: T.tintaTenue }}>
              Se agrega con 0 existencias. Usa "Agregar Existencias" para cargarle stock.
            </p>
            <form onSubmit={registrarMedicamento} style={{ display: 'flex', flexDirection: esMovil ? 'column' : 'row', gap: '12px' }}>
              <input type="text" value={nombreMed} onChange={e => setNombreMed(e.target.value)} placeholder="Nombre del medicamento" required
                style={{ ...input, flex: esMovil ? 'none' : 2 }} />
              <button type="submit" disabled={registrando}
                style={{ width: esMovil ? '100%' : 'auto', padding: '12px 20px', backgroundColor: registrando ? T.tintaTenue : T.tinta, color: '#fff', border: 'none', borderRadius: T.radioControl, fontWeight: 600, cursor: registrando ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', fontFamily: T.fuenteCuerpo }}>
                {registrando ? 'Guardando...' : 'Registrar'}
              </button>
            </form>
          </div>

          {/* AGREGAR EXISTENCIAS */}
          <div style={tarjeta}>
            <span style={estiloSello(T.primario)}>Reabastecer</span>
            <h2 style={{ ...h2, marginBottom: '14px' }}>Agregar Existencias</h2>
            <form onSubmit={agregarExistencias} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <select value={medicamentoRestockId} onChange={e => setMedicamentoRestockId(e.target.value)} required style={input}>
                <option value="">-- Seleccionar medicamento --</option>
                {medicamentos.map(m => (
                  <option key={m.id} value={m.id}>{m.nombre} ({m.existencia} u. actuales)</option>
                ))}
              </select>
              <div style={{ display: 'flex', flexDirection: esMovil ? 'column' : 'row', gap: '12px' }}>
                <input type="number" min="1" value={cantidadAgregar} onChange={e => setCantidadAgregar(e.target.value)} placeholder="Cantidad a agregar" required
                  style={{ ...input, flex: 1 }} />
                <button type="submit" disabled={restockeando}
                  style={{ width: esMovil ? '100%' : 'auto', padding: '12px 20px', backgroundColor: restockeando ? T.tintaTenue : T.primario, color: '#fff', border: 'none', borderRadius: T.radioControl, fontWeight: 600, cursor: restockeando ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', fontFamily: T.fuenteCuerpo }}>
                  {restockeando ? 'Sumando...' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* GRÁFICO */}
        <div style={tarjeta}>
          <span style={estiloSello(T.acento)}>Balance</span>
          <h2 style={{ ...h2, marginBottom: '14px' }}>Balance Visual de Almacén</h2>
          {datosGrafico.length === 0 ? (
            <div style={{
              width: '100%', height: 180,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: '8px', backgroundColor: T.bgSutil, borderRadius: '12px', border: `1px dashed ${T.borde}`
            }}>
              <span style={{ fontSize: '1.4rem' }}>💊</span>
              <p style={{ margin: 0, color: T.tintaTenue, fontSize: '0.82rem', textAlign: 'center', padding: '0 16px' }}>
                Aún no hay medicamentos en el catálogo
              </p>
            </div>
          ) : (
            <div style={{ width: '100%', height: esMovil ? 220 : 180, fontSize: '0.75rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={datosGrafico} layout={esMovil ? "vertical" : "horizontal"} margin={{ top: 5, right: 15, left: esMovil ? 5 : -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.bordeSuave} />
                  {esMovil ? <XAxis type="number" stroke={T.tintaTenue} /> : <XAxis dataKey="name" stroke={T.tintaTenue} />}
                  {esMovil ? <YAxis dataKey="name" type="category" stroke={T.tintaTenue} width={85} /> : <YAxis type="number" stroke={T.tintaTenue} />}
                  <Tooltip cursor={{ fill: T.bgSutil }} contentStyle={{ borderRadius: '10px', border: `1px solid ${T.borde}`, fontFamily: T.fuenteCuerpo }} />
                  <Bar dataKey="Existencias" fill={T.primario} radius={esMovil ? [0, 4, 4, 0] : [4, 4, 0, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN INFERIOR: EXISTENCIAS */}
      <div style={tarjeta}>
        <div style={{ display: 'flex', flexDirection: esMovil ? 'column' : 'row', justifyContent: 'space-between', alignItems: esMovil ? 'stretch' : 'flex-start', gap: '14px', marginBottom: '16px' }}>
          <div>
            <span style={estiloSello(T.primario)}>Almacén</span>
            <h2 style={h2}>
              Existencias en Inventario {medicamentosFiltrados.length > 0 && <span style={{ color: T.tintaTenue, fontWeight: 500, fontSize: '0.8rem', fontFamily: T.fuenteCuerpo }}>({medicamentosFiltrados.length})</span>}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexDirection: esMovil ? 'column' : 'row' }}>
            <input type="text" placeholder="Filtrar por nombre..." value={busqueda} onChange={e => setBusqueda(e.target.value)}
              style={{ ...input, minWidth: esMovil ? 'auto' : '240px', padding: '11px 14px', fontSize: '0.88rem' }} />
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button onClick={exportarExcel} style={{ flex: 1, padding: '11px 14px', backgroundColor: T.bgTarjeta, border: `1px solid ${T.borde}`, borderRadius: T.radioControl, fontWeight: 600, fontSize: '0.85rem', color: T.primario, cursor: 'pointer' }}>📊 Excel</button>
              <button onClick={exportarPDF} style={{ flex: 1, padding: '11px 14px', backgroundColor: T.bgTarjeta, border: `1px solid ${T.borde}`, borderRadius: T.radioControl, fontWeight: 600, fontSize: '0.85rem', color: T.alerta, cursor: 'pointer' }}>📄 PDF</button>
            </div>
          </div>
        </div>

        <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
          {medicamentosFiltrados.length === 0 ? (
            <div style={{ padding: '36px 10px', textAlign: 'center', color: T.tintaTenue, fontSize: '0.88rem' }}>
              {medicamentos.length === 0 ? 'No hay medicamentos registrados todavía' : 'No se encontraron resultados para tu búsqueda'}
            </div>
          ) : esMovil ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {medicamentosFiltrados.map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', backgroundColor: T.bgSutil, borderRadius: '12px', border: `1px solid ${T.bordeSuave}`, borderLeft: `3px solid ${m.existencia > 15 ? T.exito : T.alerta}`, gap: '10px' }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.92rem', color: T.tinta, wordBreak: 'break-word' }}>{m.nombre}</p>
                    <span style={{ fontSize: '0.74rem', fontWeight: 600, color: m.existencia > 15 ? T.exito : T.alerta }}>
                      {m.existencia > 15 ? '● Existencias Óptimas' : '● Existencias Críticas'}
                    </span>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '1rem', color: T.tinta, whiteSpace: 'nowrap', fontFamily: T.fuenteDatos }}>{m.existencia} u.</span>
                </div>
              ))}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, backgroundColor: T.primario, zIndex: 1 }}>
                <tr>
                  <th style={{ padding: '13px 14px', color: '#fff', fontFamily: T.fuenteDatos, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Medicamento</th>
                  <th style={{ padding: '13px 14px', color: '#fff', fontFamily: T.fuenteDatos, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Estado de Alerta</th>
                  <th style={{ padding: '13px 14px', color: '#fff', fontFamily: T.fuenteDatos, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em', textAlign: 'right' }}>Existencia Disponible</th>
                </tr>
              </thead>
              <tbody>
                {medicamentosFiltrados.map((m, i) => (
                  <tr key={m.id} style={{ borderBottom: `1px solid ${T.bordeSuave}`, backgroundColor: i % 2 === 0 ? T.bgTarjeta : T.bgSutil }}>
                    <td style={{ padding: '13px 14px', fontWeight: 600, color: T.tinta }}>{m.nombre}</td>
                    <td style={{ padding: '13px 14px' }}>
                      <span style={{
                        color: m.existencia > 15 ? T.exito : T.alerta,
                        backgroundColor: m.existencia > 15 ? T.exitoBg : T.alertaBg,
                        padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600,
                        display: 'inline-flex', alignItems: 'center', gap: '6px'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: m.existencia > 15 ? T.exito : T.alerta, display: 'inline-block' }}></span>
                        {m.existencia > 15 ? 'Existencias Óptimas' : 'Existencias Críticas'}
                      </span>
                    </td>
                    <td style={{ padding: '13px 14px', textAlign: 'right', fontWeight: 700, color: T.tinta, fontFamily: T.fuenteDatos }}>{m.existencia} u.</td>
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
