// ============================================================
// TEMA VISUAL — "Ficha Clínica"
// Inspirado en fichas de farmacia y formularios magistrales:
// verde fórmula (frascos de vidrio ámbar/verde), tono yodo como
// acento cálido, y tipografía tipo receta/etiqueta de dosis.
// ============================================================

export const THEME = {
  // --- Superficies ---
  bgPagina: '#EEF3F0',      // gris-menta pálido, pared de consultorio (frío, no el clásico crema)
  bgTarjeta: '#FBF8F2',     // marfil/papel cálido — como el papel de una ficha o etiqueta
  bgSutil: '#F5F1E9',       // relleno de filas/inputs, un tono más del mismo marfil
  borde: '#DCE4DF',
  bordeSuave: '#E8EEEB',

  // --- Texto ---
  tinta: '#132420',         // casi negro con tinte verde-pino
  tintaSecundaria: '#132420',
  tintaTenue: '#93A29C',

  // --- Marca / acciones ---
  primario: '#1F5D4F',      // verde fórmula (botica)
  primarioHover: '#163F36',
  primarioSuave: '#E6EFEC',

  // --- Acento cálido (yodo) ---
  acento: '#B5652A',
  acentoSuave: '#F7EBE0',

  // --- Estados ---
  exito: '#2F7D5C',
  exitoBg: '#EAF5EF',
  alerta: '#A23B2E',
  alertaBg: '#FBEEEC',

  // --- Tipografía ---
  fuenteTitulo: "'Zilla Slab', Georgia, 'Times New Roman', serif",
  fuenteCuerpo: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fuenteDatos: "'IBM Plex Mono', 'Courier New', monospace",

  // --- Radios y sombra ---
  radioTarjeta: '18px',
  radioControl: '10px',
  sombraTarjeta: '0 1px 2px rgba(19, 36, 32, 0.04), 0 8px 24px -12px rgba(19, 36, 32, 0.10)',
};

// Etiqueta tipo "sello de ficha" — el elemento distintivo del sistema.
// Se usa arriba de cada tarjeta a modo de rótulo de expediente/frasco.
export function estiloSello(color = THEME.primario) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: color,
    color: '#fff',
    fontFamily: THEME.fuenteDatos,
    fontSize: '0.64rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    padding: '4px 10px',
    borderRadius: '5px',
    marginBottom: '10px',
  };
}
