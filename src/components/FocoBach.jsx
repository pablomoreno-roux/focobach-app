import { useState, useEffect, useCallback, useRef, Component } from 'react'
import { usePersistedStore } from '../lib/store'

/* ---------- Design tokens ---------- */
const INK = '#EAF0F5';
const INK_SOFT = '#8FA5C4';
const PAPER = '#0A1830';
const CARD = '#132A4E';
const BORDER = '#25406B';
const ACCENT = '#2FBFAC';
const SUCCESS = '#4CC98A';
const DANGER = '#F0645C';
const NEUTRAL = '#6B7F9E';
const NAVY_DEEP = '#081326';
const CAS_COLOR = '#3FD6C4';
const MONOGRAFIA_COLOR = '#D9A15C';
const TDC_COLOR = '#D881B5';
const CARD_SHADOW = '0 2px 10px rgba(0,0,0,0.35)';
const MONO = "'IBM Plex Mono', monospace";
const SERIF = "'Fraunces', serif";
const CAL_MAX = new Date('2029-12-31T00:00:00');

const SUBJECTS = [
  { id: 'gestion', name: 'Gestión empresarial', level: 'NS', color: '#3FC7B5' },
  { id: 'biologia', name: 'Biología', level: 'NM', color: '#7FC65C' },
  { id: 'mates', name: 'Matemáticas aplicadas', level: '', color: '#5B8FE0' },
  { id: 'tdi', name: 'TDI', level: '', color: '#B78AD1' },
  { id: 'castellano', name: 'Castellano', level: '', color: '#E8768A' },
  { id: 'ingles', name: 'Inglés', level: '', color: '#F0A25F' },
];

const CAS_TYPES = [
  { id: 'creatividad', label: 'Creatividad', color: '#B78AD1' },
  { id: 'actividad', label: 'Actividad', color: '#3FC7B5' },
  { id: 'servicio', label: 'Servicio', color: '#F0A25F' },
];
const CAS_CAP = 50;

const TEMARIO_STATUS = { pendiente: { label: 'Pendiente', color: NEUTRAL }, progreso: { label: 'En progreso', color: ACCENT }, dominado: { label: 'Dominado', color: SUCCESS } };
const TEMARIO_ORDER = ['pendiente', 'progreso', 'dominado'];
const TASK_STATUS = { pendiente: { label: 'Pendiente', color: NEUTRAL }, progreso: { label: 'En progreso', color: ACCENT }, terminado: { label: 'Terminado', color: SUCCESS } };
const TASK_ORDER = ['pendiente', 'progreso', 'terminado'];
const PLAZO_STATUS = { pendiente: { label: 'Pendiente', color: NEUTRAL }, completado: { label: 'Completado', color: SUCCESS }, a_medias: { label: 'A medias', color: ACCENT }, no_hecho: { label: 'No hecho', color: DANGER } };

const TAGS = ['Vocabulario', 'Fórmula', 'Concepto', 'Otro'];
const TDC_TAGS = ['Idea', 'Concepto', 'Ejemplo', 'Otro'];
const MONO_TAGS = ['Fuente', 'Idea', 'Cita', 'Otro'];

/* ---------- Helpers ---------- */
const uid = () => Math.random().toString(36).slice(2, 10);
function hexToRgba(hex, a) {
  const h = hex.replace('#', '');
  return `rgba(${parseInt(h.substring(0, 2), 16)}, ${parseInt(h.substring(2, 4), 16)}, ${parseInt(h.substring(4, 6), 16)}, ${a})`;
}
function todayISO() { return new Date().toISOString().slice(0, 10); }
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.round((target - today) / 86400000);
}
function formatDeadline(dateStr) {
  const d = daysUntil(dateStr);
  if (d === null) return '';
  if (d === 0) return 'hoy';
  if (d === 1) return 'mañana';
  if (d > 0) return `en ${d} días`;
  return `hace ${-d} días`;
}
function formatDateLong(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}
function mondayOf(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/* ---------- Empty state factories + hydration ---------- */
const emptySubject = () => ({ temario: [], notas: [], diario: [], plazos: [] });
const emptyEi = () => ({ titulo: '', descripcion: '', notas: '', tareas: [], plazos: [] });
const emptyMonografia = () => ({ asignatura: '', pregunta: '', supervisor: '', notas: '', apuntes: [], plazos: [], diario: [] });
const emptyCas = () => ({ actividades: [] });
const emptyTdc = () => ({ exposicion: [], apuntes: [], diario: [] });
const hydrate = (empty, parsed) => ({ ...empty, ...(parsed || {}) });
function safeParse(raw) {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (e) { console.error('Dato guardado dañado, se ignora y se usa un valor vacío', e); return null; }
}

/* ---------- Icons ---------- */
const IconX = ({ size = 14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>;
const IconPlus = ({ size = 14 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>;
const IconChevronRight = ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>;
const IconChevronLeft = ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>;
const IconArrowLeft = ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>;
const IconCheck = ({ size = 13 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>;

/* ---------- Small UI atoms ---------- */
function Btn({ children, onClick, variant = 'primary', style, disabled }) {
  const base = { fontSize: 13, fontWeight: 500, padding: '8px 14px', borderRadius: 10, cursor: disabled ? 'default' : 'pointer', transition: 'transform 0.1s ease, opacity 0.15s ease', opacity: disabled ? 0.5 : 1, border: 'none' };
  const variants = {
    primary: { background: ACCENT, color: NAVY_DEEP },
    accent: { background: '#1B3A63', color: INK },
    ghost: { background: 'transparent', color: INK, border: `1px solid ${BORDER}` },
  };
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...style }}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = 'scale(0.97)'; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}>
      {children}
    </button>
  );
}
function Field({ label, children }) {
  return <label style={{ display: 'block', marginBottom: 12 }}><span style={{ display: 'block', fontSize: 12, fontWeight: 500, color: INK_SOFT, marginBottom: 4 }}>{label}</span>{children}</label>;
}
const inputStyle = { width: '100%', fontSize: 14, color: INK, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '9px 12px' };
function TextInput(props) { return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />; }
function TextArea(props) { return <textarea {...props} style={{ ...inputStyle, resize: 'vertical', minHeight: 80, ...(props.style || {}) }} />; }
function Select(props) { return <select {...props} style={{ ...inputStyle, ...(props.style || {}) }}>{props.children}</select>; }
function SectionLabel({ children, color = ACCENT }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 12px' }}><span style={{ width: 3, height: 14, borderRadius: 2, background: color, flexShrink: 0 }} /><p style={{ fontSize: 13, fontWeight: 500, color: INK, margin: 0 }}>{children}</p></div>;
}
function TabBar({ tabs, active, onChange, accent }) {
  return (
    <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${BORDER}`, marginBottom: 20, overflowX: 'auto' }}>
      {tabs.map((t) => <button key={t.id} onClick={() => onChange(t.id)} style={{ fontSize: 13, fontWeight: 500, padding: '10px 14px', background: 'transparent', border: 'none', borderBottom: active === t.id ? `2px solid ${accent}` : '2px solid transparent', color: active === t.id ? INK : INK_SOFT, cursor: 'pointer', whiteSpace: 'nowrap' }}>{t.label}</button>)}
    </div>
  );
}
function ProgressBar({ value, color }) {
  return <div style={{ width: '100%', height: 6, borderRadius: 999, background: hexToRgba(color, 0.15) }}><div style={{ width: `${Math.round(value * 100)}%`, height: '100%', borderRadius: 999, background: color, transition: 'width 0.3s ease' }} /></div>;
}
function EmptyState({ text }) {
  return <div style={{ padding: '28px 16px', textAlign: 'center', color: INK_SOFT, fontSize: 13, border: `1px dashed ${BORDER}`, borderRadius: 12 }}>{text}</div>;
}
function DelBtn({ onClick, label }) {
  return <button onClick={onClick} aria-label={label || 'Eliminar'} style={{ border: 'none', background: 'transparent', color: INK_SOFT, cursor: 'pointer', padding: 4, display: 'flex' }}><IconX size={13} /></button>;
}
function BackLink({ onClick, children }) {
  return <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: 'none', color: INK_SOFT, fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 18 }}><IconArrowLeft size={15} />{children}</button>;
}
function LogoMark({ size = 30 }) {
  return (
    <div style={{ width: size, height: size, borderRadius: size * 0.3, background: NAVY_DEEP, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontFamily: SERIF, fontWeight: 600, fontSize: size * 0.42, color: ACCENT, letterSpacing: '-0.03em', lineHeight: 1 }}>FB</span>
    </div>
  );
}

/* ---------- Lista con estado (Temario / Tareas) ---------- */
function StatusListSection({ items, onChange, addPlaceholder, emptyText, statusMap, statusOrder, progressLabel }) {
  const [name, setName] = useState('');
  const doneKey = statusOrder[statusOrder.length - 1];
  const done = items.filter((i) => i.status === doneKey).length;
  const add = () => { if (!name.trim()) return; onChange([...items, { id: uid(), name: name.trim(), status: statusOrder[0] }]); setName(''); };
  const cycle = (id) => onChange(items.map((i) => i.id !== id ? i : { ...i, status: statusOrder[(statusOrder.indexOf(i.status) + 1) % statusOrder.length] }));
  const remove = (id) => onChange(items.filter((i) => i.id !== id));
  return (
    <div>
      {items.length > 0 && <div style={{ marginBottom: 20 }}><div style={{ fontSize: 12, color: INK_SOFT, marginBottom: 6 }}>{done} de {items.length} {progressLabel}</div><ProgressBar value={items.length ? done / items.length : 0} color={SUCCESS} /></div>}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <TextInput placeholder={addPlaceholder} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <Btn onClick={add}><span style={{ display: 'flex' }}><IconPlus size={14} /></span></Btn>
      </div>
      {items.length === 0 ? <EmptyState text={emptyText} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((i) => {
            const s = statusMap[i.status] || statusMap[statusOrder[0]];
            return (
              <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '10px 12px', boxShadow: CARD_SHADOW }}>
                <span style={{ flex: 1, fontSize: 14, color: INK }}>{i.name}</span>
                <button onClick={() => cycle(i.id)} style={{ fontSize: 12, fontWeight: 500, padding: '4px 10px', borderRadius: 999, border: 'none', cursor: 'pointer', background: hexToRgba(s.color, 0.15), color: s.color }}>{s.label}</button>
                <DelBtn onClick={() => remove(i.id)} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Apuntes ---------- */
function NotesSection({ items, onChange, accent, tags, placeholder }) {
  const tagList = tags || TAGS;
  const [title, setTitle] = useState('');
  const [tag, setTag] = useState(tagList[0]);
  const [content, setContent] = useState('');
  const [filter, setFilter] = useState('Todos');
  const add = () => { if (!title.trim() && !content.trim()) return; onChange([{ id: uid(), title: title.trim() || 'Sin título', tag, content: content.trim(), date: todayISO() }, ...items]); setTitle(''); setContent(''); };
  const remove = (id) => onChange(items.filter((i) => i.id !== id));
  const visible = filter === 'Todos' ? items : items.filter((i) => i.tag === filter);
  return (
    <div>
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16, marginBottom: 20, boxShadow: CARD_SHADOW }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <TextInput placeholder={placeholder || 'Título'} value={title} onChange={(e) => setTitle(e.target.value)} style={{ flex: 1, minWidth: 160 }} />
          <Select value={tag} onChange={(e) => setTag(e.target.value)} style={{ width: 150 }}>{tagList.map((t) => <option key={t} value={t}>{t}</option>)}</Select>
        </div>
        <TextArea placeholder="Escribe aquí..." value={content} onChange={(e) => setContent(e.target.value)} style={{ marginBottom: 10 }} />
        <Btn onClick={add} variant="accent">Guardar apunte</Btn>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {['Todos', ...tagList].map((t) => <button key={t} onClick={() => setFilter(t)} style={{ fontSize: 12, fontWeight: 500, padding: '5px 12px', borderRadius: 999, cursor: 'pointer', border: `1px solid ${filter === t ? accent : BORDER}`, background: filter === t ? hexToRgba(accent, 0.12) : 'transparent', color: filter === t ? accent : INK_SOFT }}>{t}</button>)}
      </div>
      {visible.length === 0 ? <EmptyState text="No hay apuntes todavía." /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
          {visible.map((n) => (
            <div key={n.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14, boxShadow: CARD_SHADOW }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 999, background: hexToRgba(accent, 0.12), color: accent }}>{n.tag}</span>
                <DelBtn onClick={() => remove(n.id)} />
              </div>
              <p style={{ fontSize: 14, fontWeight: 500, margin: '0 0 4px', color: INK }}>{n.title}</p>
              <p style={{ fontSize: 13, color: INK_SOFT, margin: '0 0 8px', whiteSpace: 'pre-wrap' }}>{n.content}</p>
              <span style={{ fontFamily: MONO, fontSize: 11, color: INK_SOFT }}>{formatDateLong(n.date)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Diario ---------- */
function DiarySection({ items, onChange, prompt, accent }) {
  const [content, setContent] = useState('');
  const [mood, setMood] = useState(3);
  const add = () => { if (!content.trim()) return; onChange([{ id: uid(), date: todayISO(), content: content.trim(), mood }, ...items]); setContent(''); setMood(3); };
  const remove = (id) => onChange(items.filter((i) => i.id !== id));
  return (
    <div>
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16, marginBottom: 20, boxShadow: CARD_SHADOW }}>
        <p style={{ fontSize: 13, color: INK_SOFT, margin: '0 0 10px' }}>{prompt}</p>
        <TextArea placeholder="Escribe cómo va..." value={content} onChange={(e) => setContent(e.target.value)} style={{ marginBottom: 10 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: INK_SOFT }}>Confianza</span>
            {[1, 2, 3, 4, 5].map((m) => <button key={m} onClick={() => setMood(m)} aria-label={`Nivel ${m}`} style={{ width: 22, height: 22, borderRadius: '50%', border: `1px solid ${mood >= m ? accent : BORDER}`, background: mood >= m ? accent : 'transparent', cursor: 'pointer' }} />)}
          </div>
          <Btn onClick={add} variant="accent">Guardar</Btn>
        </div>
      </div>
      {items.length === 0 ? <EmptyState text="Todavía no hay entradas." /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map((e) => (
            <div key={e.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14, boxShadow: CARD_SHADOW }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: INK_SOFT }}>{formatDateLong(e.date)}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 3 }}>{[1, 2, 3, 4, 5].map((m) => <span key={m} style={{ width: 6, height: 6, borderRadius: '50%', background: (e.mood || 0) >= m ? accent : BORDER }} />)}</div>
                  <DelBtn onClick={() => remove(e.id)} />
                </div>
              </div>
              <p style={{ fontSize: 14, color: INK, margin: 0, whiteSpace: 'pre-wrap' }}>{e.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Plazos (con descripción y estado) ---------- */
function DeadlinesSection({ items, onChange, accent }) {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [openId, setOpenId] = useState(null);
  const add = () => { if (!label.trim() || !date) return; onChange([...items, { id: uid(), label: label.trim(), description: description.trim(), date, status: 'pendiente' }].sort((a, b) => a.date.localeCompare(b.date))); setLabel(''); setDescription(''); setDate(''); };
  const setStatus = (id, status) => { onChange(items.map((i) => (i.id === id ? { ...i, status } : i))); setOpenId(null); };
  const remove = (id) => onChange(items.filter((i) => i.id !== id));
  return (
    <div>
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 14, marginBottom: 16, boxShadow: CARD_SHADOW }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <TextInput placeholder="¿Qué tienes que hacer o estudiar?" value={label} onChange={(e) => setLabel(e.target.value)} style={{ flex: 1, minWidth: 180 }} />
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 160 }} />
        </div>
        <TextArea placeholder="Descripción (opcional) — qué es exactamente y cómo lo vas a hacer" value={description} onChange={(e) => setDescription(e.target.value)} style={{ marginBottom: 8, minHeight: 50 }} />
        <Btn onClick={add}>Añadir</Btn>
      </div>
      {items.length === 0 ? <EmptyState text="Sin plazos todavía. Añade las fechas clave para no descubrirlas tarde." /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((p) => {
            const st = PLAZO_STATUS[p.status] || PLAZO_STATUS.pendiente;
            const overdue = p.status !== 'completado' && daysUntil(p.date) < 0;
            return (
              <div key={p.id} style={{ background: CARD, border: `1px solid ${overdue ? hexToRgba(DANGER, 0.45) : BORDER}`, borderRadius: 12, padding: '10px 12px', boxShadow: CARD_SHADOW }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <button onClick={() => setOpenId(openId === p.id ? null : p.id)} aria-label="Cambiar estado" title={st.label} style={{ width: 12, height: 12, borderRadius: '50%', background: st.color, border: 'none', cursor: 'pointer', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 14, color: INK, minWidth: 120, textDecoration: p.status === 'completado' ? 'line-through' : 'none' }}>{p.label}</span>
                  <span style={{ fontFamily: MONO, fontSize: 12, color: overdue ? DANGER : INK_SOFT, whiteSpace: 'nowrap' }}>{formatDateLong(p.date)} · {formatDeadline(p.date)}</span>
                  <DelBtn onClick={() => remove(p.id)} label="Eliminar plazo" />
                </div>
                {openId === p.id && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${BORDER}` }}>
                    {p.description && <p style={{ fontSize: 12, color: INK_SOFT, margin: '0 0 10px', whiteSpace: 'pre-wrap' }}>{p.description}</p>}
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {Object.entries(PLAZO_STATUS).filter(([k]) => k !== 'pendiente').map(([k, v]) => <button key={k} onClick={() => setStatus(p.id, k)} style={{ fontSize: 12, fontWeight: 500, padding: '5px 12px', borderRadius: 999, cursor: 'pointer', border: `1px solid ${p.status === k ? v.color : BORDER}`, background: p.status === k ? hexToRgba(v.color, 0.12) : 'transparent', color: p.status === k ? v.color : INK_SOFT }}>{v.label}</button>)}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- Página de asignatura ---------- */
const SUBJECT_TABS = [{ id: 'temario', label: 'Asignatura' }, { id: 'apuntes', label: 'Apuntes' }, { id: 'diario', label: 'Diario' }, { id: 'plazos', label: 'Plazos' }];
function SubjectPage({ subject, data, onUpdate, tab, onTabChange, onGoToEi }) {
  const d = data || emptySubject();
  const set = (field, value) => onUpdate({ ...d, [field]: value });
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: subject.color, flexShrink: 0 }} />
          <h1 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 500, color: INK, margin: 0 }}>{subject.name}</h1>
          {subject.level && <span style={{ fontFamily: MONO, fontSize: 12, color: INK_SOFT, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '2px 8px' }}>{subject.level}</span>}
        </div>
        <button onClick={onGoToEi} style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'transparent', border: 'none', color: ACCENT, fontSize: 12, fontWeight: 500, cursor: 'pointer', padding: 0 }}>Evaluación interna<IconChevronRight size={13} /></button>
      </div>
      <p style={{ fontSize: 13, color: INK_SOFT, margin: '0 0 20px' }}>{d.notas.length} apuntes · {d.diario.length} entradas de diario · {d.temario.filter((t) => t.status === 'dominado').length}/{d.temario.length} temas dominados</p>
      <TabBar tabs={SUBJECT_TABS} active={tab} onChange={onTabChange} accent={subject.color} />
      {tab === 'temario' && <StatusListSection items={d.temario} onChange={(v) => set('temario', v)} addPlaceholder="Añade un tema del temario" emptyText="Todavía no hay temas. Añade el primero del temario de esta asignatura." statusMap={TEMARIO_STATUS} statusOrder={TEMARIO_ORDER} progressLabel="dominados" />}
      {tab === 'apuntes' && <NotesSection items={d.notas} onChange={(v) => set('notas', v)} accent={subject.color} placeholder="Título (p. ej. Verbos irregulares)" />}
      {tab === 'diario' && <DiarySection items={d.diario} onChange={(v) => set('diario', v)} prompt={`¿Qué tal vas esta semana en ${subject.name}?`} accent={subject.color} />}
      {tab === 'plazos' && <DeadlinesSection items={d.plazos} onChange={(v) => set('plazos', v)} accent={subject.color} />}
    </div>
  );
}

/* ---------- Evaluación interna ---------- */
function EiDetail({ subject, ei, onUpdate, onBack }) {
  const d = ei || emptyEi();
  const set = (field) => (e) => onUpdate({ ...d, [field]: e.target.value });
  return (
    <div>
      <BackLink onClick={onBack}>Inicio</BackLink>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: subject.color }} />
        <h1 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 500, color: INK, margin: 0 }}>{subject.name} · Evaluación interna</h1>
      </div>
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16, marginBottom: 24, boxShadow: CARD_SHADOW }}>
        <Field label="Tema o título"><TextInput value={d.titulo} onChange={set('titulo')} placeholder="Sobre qué trata tu evaluación interna" /></Field>
        <Field label="Pregunta o enfoque"><TextArea value={d.descripcion} onChange={set('descripcion')} placeholder="Qué vas a investigar o resolver" style={{ minHeight: 60 }} /></Field>
        <Field label="Notas de seguimiento"><TextArea value={d.notas} onChange={set('notas')} placeholder="Feedback del profesor, próximos pasos..." style={{ minHeight: 60 }} /></Field>
      </div>
      <SectionLabel color={subject.color}>Tareas</SectionLabel>
      <div style={{ marginBottom: 28 }}><StatusListSection items={d.tareas} onChange={(v) => onUpdate({ ...d, tareas: v })} addPlaceholder="Añade una tarea (p. ej. primer borrador)" emptyText="Todavía no hay tareas. Divide tu evaluación interna en pasos pequeños: pendientes, en progreso y terminadas." statusMap={TASK_STATUS} statusOrder={TASK_ORDER} progressLabel="terminadas" /></div>
      <SectionLabel color={subject.color}>Plazos</SectionLabel>
      <DeadlinesSection items={d.plazos} onChange={(v) => onUpdate({ ...d, plazos: v })} accent={subject.color} />
    </div>
  );
}
function EiOverviewCard({ subject, ei, onClick }) {
  const d = ei || emptyEi();
  const terminadas = d.tareas.filter((t) => t.status === 'terminado').length;
  const next = [...d.plazos].filter((p) => p.status !== 'completado').sort((a, b) => a.date.localeCompare(b.date))[0];
  return (
    <button onClick={onClick} className="ib-hover" style={{ textAlign: 'left', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 14, boxShadow: CARD_SHADOW }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: subject.color, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 500, color: INK, flex: 1 }}>{subject.name}</span>
        <IconChevronRight size={14} />
      </div>
      <p style={{ fontSize: 12, color: INK_SOFT, margin: '0 0 8px', minHeight: 16 }}>{d.titulo || 'Sin tema todavía'}</p>
      <ProgressBar value={d.tareas.length ? terminadas / d.tareas.length : 0} color={subject.color} />
      <p style={{ fontSize: 11, color: INK_SOFT, margin: '8px 0 0' }}>{d.tareas.length ? `${terminadas}/${d.tareas.length} tareas` : 'sin tareas todavía'}{next ? ` · próximo plazo ${formatDeadline(next.date)}` : ''}</p>
    </button>
  );
}

/* ---------- Núcleo IB: secciones ---------- */
function CasSection({ data, onUpdate }) {
  const d = data || emptyCas();
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState(CAS_TYPES[0].id);
  const [horas, setHoras] = useState('');
  const [fecha, setFecha] = useState(todayISO());
  const [reflexion, setReflexion] = useState('');
  const [warning, setWarning] = useState('');
  const totals = CAS_TYPES.reduce((acc, t) => { acc[t.id] = d.actividades.filter((a) => a.tipo === t.id).reduce((s, a) => s + (Number(a.horas) || 0), 0); return acc; }, {});
  const total = Object.values(totals).reduce((s, v) => s + v, 0);
  const remaining = Math.max(0, CAS_CAP - (totals[tipo] || 0));
  const add = () => {
    if (!nombre.trim()) return;
    let h = Number(horas) || 0;
    if (h <= 0) return;
    if (h > remaining) { h = remaining; setWarning(h > 0 ? `Solo quedaban ${remaining}h en ${CAS_TYPES.find((t) => t.id === tipo).label.toLowerCase()}; se ha ajustado a eso.` : `Ya tienes las ${CAS_CAP}h completas en esta categoría.`); if (h <= 0) return; }
    else setWarning('');
    onUpdate({ ...d, actividades: [{ id: uid(), nombre: nombre.trim(), tipo, horas: h, fecha, reflexion: reflexion.trim() }, ...d.actividades] });
    setNombre(''); setHoras(''); setReflexion('');
  };
  const remove = (id) => onUpdate({ ...d, actividades: d.actividades.filter((a) => a.id !== id) });
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: 20 }}>
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14, boxShadow: CARD_SHADOW }}><p style={{ fontSize: 11, color: INK_SOFT, margin: '0 0 4px' }}>Total horas</p><p style={{ fontFamily: MONO, fontSize: 22, fontWeight: 500, color: INK, margin: 0 }}>{total}</p></div>
        {CAS_TYPES.map((t) => {
          const full = totals[t.id] >= CAS_CAP;
          return (
            <div key={t.id} style={{ background: full ? hexToRgba(SUCCESS, 0.10) : CARD, border: `1px solid ${full ? SUCCESS : BORDER}`, borderRadius: 12, padding: 14, boxShadow: CARD_SHADOW }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}><p style={{ fontSize: 11, color: t.color, margin: 0, fontWeight: 500 }}>{t.label}</p>{full && <IconCheck size={11} />}</div>
              <p style={{ fontFamily: MONO, fontSize: 22, fontWeight: 500, color: full ? SUCCESS : INK, margin: 0 }}>{totals[t.id]}<span style={{ fontSize: 13, color: INK_SOFT }}>/{CAS_CAP}</span></p>
            </div>
          );
        })}
      </div>
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16, marginBottom: 20, boxShadow: CARD_SHADOW }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          <TextInput placeholder="Actividad" value={nombre} onChange={(e) => setNombre(e.target.value)} style={{ flex: 2, minWidth: 140 }} />
          <Select value={tipo} onChange={(e) => { setTipo(e.target.value); setWarning(''); }} style={{ flex: 1, minWidth: 130 }}>{CAS_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</Select>
          <TextInput type="number" min="0" step="0.5" max={remaining} placeholder="Horas" value={horas} onChange={(e) => setHoras(e.target.value)} style={{ width: 90 }} />
          <TextInput type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={{ width: 150 }} />
        </div>
        <TextArea placeholder="Reflexión breve" value={reflexion} onChange={(e) => setReflexion(e.target.value)} style={{ marginBottom: 10, minHeight: 60 }} />
        {warning && <p style={{ fontSize: 12, color: ACCENT, margin: '0 0 10px' }}>{warning}</p>}
        <Btn onClick={add} variant="accent">Guardar actividad</Btn>
      </div>
      {d.actividades.length === 0 ? <EmptyState text="Todavía no has registrado actividades de CAS." /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {d.actividades.map((a) => {
            const t = CAS_TYPES.find((x) => x.id === a.tipo);
            return (
              <div key={a.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 14, boxShadow: CARD_SHADOW }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><span style={{ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 999, background: hexToRgba(t.color, 0.12), color: t.color }}>{t.label}</span><span style={{ fontSize: 14, fontWeight: 500, color: INK }}>{a.nombre}</span></div>
                  <DelBtn onClick={() => remove(a.id)} label="Eliminar actividad" />
                </div>
                {a.reflexion && <p style={{ fontSize: 13, color: INK_SOFT, margin: '0 0 8px', whiteSpace: 'pre-wrap' }}>{a.reflexion}</p>}
                <span style={{ fontFamily: MONO, fontSize: 11, color: INK_SOFT }}>{formatDateLong(a.fecha)} · {a.horas}h</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
function MonografiaSection({ data, onUpdate }) {
  const d = data || emptyMonografia();
  const set = (field) => (e) => onUpdate({ ...d, [field]: e.target.value });
  return (
    <div>
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16, marginBottom: 24, boxShadow: CARD_SHADOW }}>
        <Field label="Asignatura de la Monografía"><TextInput value={d.asignatura} onChange={set('asignatura')} placeholder="p. ej. Biología, Historia..." /></Field>
        <Field label="Pregunta de investigación"><TextArea value={d.pregunta} onChange={set('pregunta')} style={{ minHeight: 60 }} /></Field>
        <Field label="Supervisor/a"><TextInput value={d.supervisor} onChange={set('supervisor')} placeholder="Nombre del profesor/a" /></Field>
        <Field label="Notas"><TextArea value={d.notas} onChange={set('notas')} placeholder="Ideas, feedback de tutorías..." style={{ minHeight: 60 }} /></Field>
      </div>
      <SectionLabel color={MONOGRAFIA_COLOR}>Ideas para más adelante</SectionLabel>
      <div style={{ marginBottom: 28 }}><NotesSection items={d.apuntes} onChange={(v) => onUpdate({ ...d, apuntes: v })} accent={MONOGRAFIA_COLOR} tags={MONO_TAGS} placeholder="p. ej. Posible fuente o cita" /></div>
      <SectionLabel color={MONOGRAFIA_COLOR}>Plazos</SectionLabel>
      <div style={{ marginBottom: 28 }}><DeadlinesSection items={d.plazos} onChange={(v) => onUpdate({ ...d, plazos: v })} accent={MONOGRAFIA_COLOR} /></div>
      <SectionLabel color={MONOGRAFIA_COLOR}>Diario de investigación</SectionLabel>
      <DiarySection items={d.diario} onChange={(v) => onUpdate({ ...d, diario: v })} prompt="¿Cómo avanza tu investigación esta semana?" accent={MONOGRAFIA_COLOR} />
    </div>
  );
}
function TdcSection({ data, onUpdate }) {
  const d = data || emptyTdc();
  const addObjeto = () => onUpdate({ ...d, exposicion: [...d.exposicion, { id: uid(), objeto: '', indagacion: '', explicacion: '' }] });
  const setObjeto = (id, field, value) => onUpdate({ ...d, exposicion: d.exposicion.map((o) => (o.id === id ? { ...o, [field]: value } : o)) });
  const removeObjeto = (id) => onUpdate({ ...d, exposicion: d.exposicion.filter((o) => o.id !== id) });
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
        <SectionLabel color={TDC_COLOR}>Exposición (normalmente 3 objetos)</SectionLabel>
        <Btn onClick={addObjeto} variant="ghost"><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><IconPlus size={12} />Objeto</span></Btn>
      </div>
      {d.exposicion.length === 0 ? <EmptyState text="Añade tus objetos de la Exposición de TdC cuando empieces a prepararla." /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
          {d.exposicion.map((o, idx) => (
            <div key={o.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16, boxShadow: CARD_SHADOW }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}><span style={{ fontFamily: MONO, fontSize: 12, color: INK_SOFT }}>Objeto {idx + 1}</span><DelBtn onClick={() => removeObjeto(o.id)} label="Eliminar objeto" /></div>
              <Field label="Objeto"><TextInput value={o.objeto} onChange={(e) => setObjeto(o.id, 'objeto', e.target.value)} placeholder="Qué es el objeto" /></Field>
              <Field label="Pregunta de indagación"><TextInput value={o.indagacion} onChange={(e) => setObjeto(o.id, 'indagacion', e.target.value)} placeholder="A qué pregunta responde" /></Field>
              <Field label="Vínculo con el mundo real"><TextArea value={o.explicacion} onChange={(e) => setObjeto(o.id, 'explicacion', e.target.value)} style={{ minHeight: 60 }} /></Field>
            </div>
          ))}
        </div>
      )}
      <SectionLabel color={TDC_COLOR}>Apuntes e ideas</SectionLabel>
      <div style={{ marginBottom: 28 }}><NotesSection items={d.apuntes} onChange={(v) => onUpdate({ ...d, apuntes: v })} accent={TDC_COLOR} tags={TDC_TAGS} placeholder="p. ej. Idea sobre las formas de conocimiento" /></div>
      <SectionLabel color={TDC_COLOR}>Diario de conceptos</SectionLabel>
      <DiarySection items={d.diario} onChange={(v) => onUpdate({ ...d, diario: v })} prompt="Una idea o conexión de TdC de esta semana" accent={TDC_COLOR} />
    </div>
  );
}
function NucleoDetailPage({ title, color, onBack, children }) {
  return (
    <div>
      <BackLink onClick={onBack}>Inicio</BackLink>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: color }} /><h1 style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 500, color: INK, margin: 0 }}>{title}</h1></div>
      {children}
    </div>
  );
}
function NucleoCard({ label, color, stat, sub, onClick }) {
  return (
    <button onClick={onClick} className="ib-hover" style={{ textAlign: 'left', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 14, boxShadow: CARD_SHADOW }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} /><span style={{ fontSize: 13, fontWeight: 500, color: INK }}>{label}</span></div>
      <p style={{ fontFamily: MONO, fontSize: 18, fontWeight: 500, color: INK, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stat}</p>
      <p style={{ fontSize: 11, color: INK_SOFT, margin: 0 }}>{sub}</p>
    </button>
  );
}

/* ---------- Calendario ---------- */
function collectAllPlazos(data) {
  const items = [];
  SUBJECTS.forEach((s) => {
    const subj = data[s.id];
    if (subj) (subj.plazos || []).forEach((p) => items.push({ ...p, source: s.name, color: s.color, kind: 'subject', ownerId: s.id }));
    const ei = data.ei && data.ei[s.id];
    if (ei) (ei.plazos || []).forEach((p) => items.push({ ...p, source: `${s.name} · Ev. interna`, color: s.color, kind: 'ei', ownerId: s.id }));
  });
  if (data.monografia) (data.monografia.plazos || []).forEach((p) => items.push({ ...p, source: 'Monografía', color: MONOGRAFIA_COLOR, kind: 'monografia', ownerId: null }));
  return items;
}
function Calendar({ items, onSelectDay }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const start = new Date(mondayOf(new Date())); start.setDate(start.getDate() + weekOffset * 14);
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });
  const byDate = {};
  items.forEach((p) => { if (!p.date) return; (byDate[p.date] = byDate[p.date] || []).push(p); });
  const nextStart = new Date(start); nextStart.setDate(nextStart.getDate() + 14);
  const canGoNext = nextStart <= CAL_MAX;
  const todayStr = todayISO();
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => setWeekOffset((o) => o - 1)} aria-label="Semanas anteriores" style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 9, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: INK, boxShadow: CARD_SHADOW }}><IconChevronLeft size={15} /></button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: INK_SOFT, fontFamily: MONO }}>{start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} – {days[13].toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} style={{ fontSize: 11, fontWeight: 500, color: ACCENT, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>Hoy</button>}
        </div>
        <button onClick={() => canGoNext && setWeekOffset((o) => o + 1)} disabled={!canGoNext} aria-label="Semanas siguientes" style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 9, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: canGoNext ? 'pointer' : 'default', color: INK, opacity: canGoNext ? 1 : 0.35, boxShadow: CARD_SHADOW }}><IconChevronRight size={15} /></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0,1fr))', gap: 8 }}>
        {days.map((d) => {
          const iso = d.toISOString().slice(0, 10);
          const dayItems = byDate[iso] || [];
          const isToday = iso === todayStr;
          return (
            <button key={iso} onClick={() => onSelectDay(iso)} className="ib-hover" style={{ textAlign: 'left', background: isToday ? hexToRgba(ACCENT, 0.07) : CARD, border: `1px solid ${isToday ? ACCENT : BORDER}`, borderRadius: 12, padding: 8, minHeight: 108, display: 'flex', flexDirection: 'column', boxShadow: CARD_SHADOW }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                <span style={{ fontSize: 9, color: INK_SOFT, textTransform: 'capitalize' }}>{d.toLocaleDateString('es-ES', { weekday: 'short' })}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: isToday ? ACCENT : INK }}>{d.getDate()}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, overflow: 'hidden' }}>
                {dayItems.slice(0, 3).map((it, idx) => <span key={idx} style={{ fontSize: 9, fontWeight: 500, padding: '2px 5px', borderRadius: 5, background: hexToRgba(it.color, it.status === 'completado' ? 0.06 : 0.16), color: it.status === 'completado' ? INK_SOFT : it.color, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: it.status === 'completado' ? 'line-through' : 'none' }}>{it.label}</span>)}
                {dayItems.length > 3 && <span style={{ fontSize: 9, color: INK_SOFT }}>+{dayItems.length - 3} más</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
function PlazoRow({ p, onClick }) {
  return (
    <button onClick={onClick} className="ib-hover" style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, background: CARD, border: `1px solid ${hexToRgba(DANGER, 0.4)}`, borderRadius: 12, padding: '10px 12px', width: '100%', boxShadow: CARD_SHADOW }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: 13, color: INK }}>{p.label} <span style={{ color: INK_SOFT }}>· {p.source}</span></span>
      <span style={{ fontFamily: MONO, fontSize: 12, color: DANGER, whiteSpace: 'nowrap' }}>{formatDeadline(p.date)}</span>
    </button>
  );
}
function DiaPlazoCard({ p, onSetStatus }) {
  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 16, boxShadow: CARD_SHADOW }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} /><span style={{ fontSize: 12, color: INK_SOFT }}>{p.source}</span></div>
      <p style={{ fontSize: 16, fontWeight: 500, color: INK, margin: '0 0 6px' }}>{p.label}</p>
      {p.description && <p style={{ fontSize: 13, color: INK_SOFT, margin: '0 0 14px', whiteSpace: 'pre-wrap' }}>{p.description}</p>}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {Object.entries(PLAZO_STATUS).filter(([k]) => k !== 'pendiente').map(([k, v]) => <button key={k} onClick={() => onSetStatus(k)} style={{ fontSize: 12, fontWeight: 500, padding: '6px 14px', borderRadius: 999, cursor: 'pointer', border: `1px solid ${p.status === k ? v.color : BORDER}`, background: p.status === k ? hexToRgba(v.color, 0.14) : 'transparent', color: p.status === k ? v.color : INK_SOFT }}>{v.label}</button>)}
      </div>
    </div>
  );
}
function DiaPage({ date, allPlazos, onBack, onSetStatus }) {
  const d = new Date(date + 'T00:00:00');
  const dayItems = allPlazos.filter((p) => p.date === date);
  return (
    <div>
      <BackLink onClick={onBack}>Inicio</BackLink>
      <h1 style={{ fontFamily: SERIF, fontSize: 24, fontWeight: 500, color: INK, margin: '0 0 4px', textTransform: 'capitalize' }}>{d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</h1>
      <p style={{ fontSize: 13, color: INK_SOFT, margin: '0 0 24px' }}>{dayItems.length} plazo{dayItems.length === 1 ? '' : 's'} este día</p>
      {dayItems.length === 0 ? <EmptyState text="No hay plazos este día." /> : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{dayItems.map((p) => <DiaPlazoCard key={p.id} p={p} onSetStatus={(status) => onSetStatus(p, status)} />)}</div>}
    </div>
  );
}

/* ---------- Inicio ---------- */
function Dashboard({ data, onNavigate }) {
  const allPlazos = collectAllPlazos(data);
  const overdue = allPlazos.filter((p) => p.status !== 'completado' && daysUntil(p.date) < 0).sort((a, b) => a.date.localeCompare(b.date));
  const casTotal = (data.cas?.actividades || []).reduce((s, a) => s + (Number(a.horas) || 0), 0);
  const monoNext = [...(data.monografia?.plazos || [])].filter((p) => p.status !== 'completado').sort((a, b) => a.date.localeCompare(b.date))[0];

  return (
    <div>
      <div style={{ background: `linear-gradient(135deg, #123659, ${NAVY_DEEP})`, borderRadius: 22, padding: '30px 26px', marginBottom: 32, color: '#FFFFFF', boxShadow: '0 10px 28px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}><LogoMark size={26} /><span style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 500, color: 'rgba(255,255,255,0.85)' }}>FocoBach</span></div>
        <h1 style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 500, margin: '0 0 6px', color: '#FFFFFF' }}>Inicio</h1>
        <p style={{ fontFamily: MONO, fontSize: 12, color: 'rgba(255,255,255,0.75)', margin: 0, textTransform: 'capitalize' }}>{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      <SectionLabel>Asignaturas</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12, marginBottom: 32 }}>
        {SUBJECTS.map((s) => {
          const subj = data[s.id] || emptySubject();
          const dominados = subj.temario.filter((t) => t.status === 'dominado').length;
          const pct = subj.temario.length ? dominados / subj.temario.length : 0;
          return (
            <button key={s.id} onClick={() => onNavigate(s.id)} className="ib-hover" style={{ textAlign: 'left', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: 14, boxShadow: CARD_SHADOW }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} /><span style={{ fontSize: 13, fontWeight: 500, color: INK }}>{s.name}</span></div>
              <ProgressBar value={pct} color={s.color} />
              <p style={{ fontSize: 11, color: INK_SOFT, margin: '8px 0 0' }}>{subj.notas.length} apuntes · {subj.diario.length} diario</p>
            </button>
          );
        })}
      </div>

      <SectionLabel color={INK_SOFT}>Evaluación interna</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12, marginBottom: 32 }}>
        {SUBJECTS.map((s) => <EiOverviewCard key={s.id} subject={s} ei={data.ei[s.id]} onClick={() => onNavigate('ei', { subject: s.id })} />)}
      </div>

      <SectionLabel color={INK_SOFT}>Núcleo IB</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 12, marginBottom: 32 }}>
        <NucleoCard label="CAS" color={CAS_COLOR} stat={`${casTotal}h`} sub="Creatividad · Actividad · Servicio" onClick={() => onNavigate('nucleo-cas')} />
        <NucleoCard label="Monografía" color={MONOGRAFIA_COLOR} stat={data.monografia?.asignatura || 'Sin tema'} sub={monoNext ? `Próximo plazo ${formatDeadline(monoNext.date)}` : 'Sin plazos'} onClick={() => onNavigate('nucleo-monografia')} />
        <NucleoCard label="Teoría del Conocimiento" color={TDC_COLOR} stat={`${data.tdc?.exposicion.length || 0}/3 objetos`} sub={`${data.tdc?.apuntes.length || 0} apuntes`} onClick={() => onNavigate('nucleo-tdc')} />
      </div>

      <SectionLabel>Calendario</SectionLabel>
      <div style={{ marginBottom: 32 }}><Calendar items={allPlazos} onSelectDay={(date) => onNavigate('dia', { date })} /></div>

      <SectionLabel color={DANGER}>Plazos pendientes</SectionLabel>
      {overdue.length === 0 ? <EmptyState text="Nada pendiente por ahora — lo que se quede sin marcar al pasar su día aparecerá aquí." /> : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{overdue.map((p) => <PlazoRow key={p.id} p={p} onClick={() => onNavigate('dia', { date: p.date })} />)}</div>}
    </div>
  );
}

/* ---------- Navegación ---------- */
function NavItem({ label, sub, color, active, onClick }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', padding: '9px 14px', borderRadius: 9, cursor: 'pointer', border: 'none', background: active ? hexToRgba(color, 0.12) : 'transparent', borderLeft: active ? `3px solid ${color}` : '3px solid transparent', marginBottom: 2 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 13, fontWeight: active ? 500 : 400, color: active ? INK : INK_SOFT, flex: 1 }}>{label}</span>
      {sub && <span style={{ fontFamily: MONO, fontSize: 10, color: INK_SOFT }}>{sub}</span>}
    </button>
  );
}
function NavContent({ view, onNavigate }) {
  return (
    <div>
      <NavItem label="Inicio" color={ACCENT} active={view === 'inicio'} onClick={() => onNavigate('inicio')} />
      <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', color: INK_SOFT, textTransform: 'uppercase', margin: '18px 14px 6px' }}>Asignaturas</p>
      {SUBJECTS.map((s) => <NavItem key={s.id} label={s.name} sub={s.level} color={s.color} active={view === s.id} onClick={() => onNavigate(s.id)} />)}
    </div>
  );
}

/* ---------- App ---------- */
function AppInner({ userLabel, onLogout }) {
  const [view, setView] = useState('inicio');
  const [subjectTab, setSubjectTab] = useState('temario');
  const [eiSelected, setEiSelected] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [resetArmed, setResetArmed] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const fileInputRef = useRef(null);
  const store = usePersistedStore();

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap";
    document.head.appendChild(link);
  }, []);

  const data = (() => {
    const next = { ei: {} };
    SUBJECTS.forEach((s) => {
      next[s.id] = hydrate(emptySubject(), safeParse(store.get(`subject:${s.id}`)));
      next.ei[s.id] = hydrate(emptyEi(), safeParse(store.get(`ei:${s.id}`)));
    });
    next.monografia = hydrate(emptyMonografia(), safeParse(store.get('nucleo:monografia')));
    next.cas = hydrate(emptyCas(), safeParse(store.get('nucleo:cas')));
    next.tdc = hydrate(emptyTdc(), safeParse(store.get('nucleo:tdc')));
    return next;
  })();

  const persist = useCallback((key, value) => {
    store.set(key, JSON.stringify(value)).then(() => { setSaved(true); setTimeout(() => setSaved(false), 1000); })
      .catch(() => { setSaveError(true); setTimeout(() => setSaveError(false), 3000); });
  }, [store]);
  const updateSubject = useCallback((id, value) => persist(`subject:${id}`, value), [persist]);
  const updateEi = useCallback((id, value) => persist(`ei:${id}`, value), [persist]);
  const updateNucleo = useCallback((key, value) => persist(`nucleo:${key}`, value), [persist]);
  const updatePlazoStatus = useCallback((item, status) => {
    if (item.kind === 'subject') { const subj = data[item.ownerId]; persist(`subject:${item.ownerId}`, { ...subj, plazos: subj.plazos.map((p) => (p.id === item.id ? { ...p, status } : p)) }); }
    else if (item.kind === 'ei') { const ei = data.ei[item.ownerId]; persist(`ei:${item.ownerId}`, { ...ei, plazos: ei.plazos.map((p) => (p.id === item.id ? { ...p, status } : p)) }); }
    else if (item.kind === 'monografia') { const mono = data.monografia; persist('nucleo:monografia', { ...mono, plazos: mono.plazos.map((p) => (p.id === item.id ? { ...p, status } : p)) }); }
  }, [persist, data]);

  const navigate = (v, opts = {}) => {
    setView(v);
    if (opts.tab) setSubjectTab(opts.tab);
    else if (SUBJECTS.some((s) => s.id === v)) setSubjectTab('temario');
    if (v === 'ei') setEiSelected(opts.subject ?? null);
    if (v === 'dia') setSelectedDate(opts.date ?? todayISO());
  };

  const doReset = async () => {
    const entries = [];
    for (const s of SUBJECTS) { entries.push({ key: `subject:${s.id}`, value: JSON.stringify(emptySubject()) }); entries.push({ key: `ei:${s.id}`, value: JSON.stringify(emptyEi()) }); }
    entries.push({ key: 'nucleo:monografia', value: JSON.stringify(emptyMonografia()) });
    entries.push({ key: 'nucleo:cas', value: JSON.stringify(emptyCas()) });
    entries.push({ key: 'nucleo:tdc', value: JSON.stringify(emptyTdc()) });
    await store.setMany(entries);
    setResetArmed(false);
  };

  const exportData = () => {
    try {
      const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), data }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `focobach-${todayISO()}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) { console.error('No se pudo exportar', e); setImportMsg('No se pudo generar el archivo.'); setTimeout(() => setImportMsg(''), 3000); }
  };

  const importData = (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const parsed = safeParse(e.target.result);
      const incoming = (parsed && (parsed.data || parsed)) || null;
      if (!incoming) { setImportMsg('No se pudo leer el archivo. ¿Es un backup exportado desde aquí?'); setTimeout(() => setImportMsg(''), 3500); return; }
      try {
        const entries = [];
        for (const s of SUBJECTS) {
          entries.push({ key: `subject:${s.id}`, value: JSON.stringify(hydrate(emptySubject(), incoming[s.id])) });
          entries.push({ key: `ei:${s.id}`, value: JSON.stringify(hydrate(emptyEi(), incoming.ei && incoming.ei[s.id])) });
        }
        entries.push({ key: 'nucleo:monografia', value: JSON.stringify(hydrate(emptyMonografia(), incoming.monografia)) });
        entries.push({ key: 'nucleo:cas', value: JSON.stringify(hydrate(emptyCas(), incoming.cas)) });
        entries.push({ key: 'nucleo:tdc', value: JSON.stringify(hydrate(emptyTdc(), incoming.tdc)) });
        await store.setMany(entries);
        setImportMsg('Datos importados correctamente.');
      } catch (err) { console.error('Error al importar', err); setImportMsg('Algo falló al guardar los datos importados.'); }
      setTimeout(() => setImportMsg(''), 3500);
    };
    reader.onerror = () => { setImportMsg('No se pudo leer el archivo.'); setTimeout(() => setImportMsg(''), 3000); };
    reader.readAsText(file);
  };

  if (store.loadError) {
    return (
      <div style={{ minHeight: '100vh', background: PAPER, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'IBM Plex Sans', sans-serif" }}>
        <div style={{ maxWidth: 380, textAlign: 'center' }}>
          <p style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 500, color: INK, margin: '0 0 10px' }}>No se pudo cargar tu cuaderno</p>
          <p style={{ fontSize: 13, color: INK_SOFT, margin: '0 0 18px' }}>No hay conexión con la base de datos en este momento. Tus datos guardados no se han perdido — prueba a recargar en un momento.</p>
          <Btn onClick={() => window.location.reload()}>Reintentar</Btn>
        </div>
      </div>
    );
  }

  if (!store.ready) return <div style={{ minHeight: '100vh', background: PAPER, display: 'flex', alignItems: 'center', justifyContent: 'center', color: INK_SOFT, fontSize: 13 }}>Cargando FocoBach…</div>;

  const currentSubject = SUBJECTS.find((s) => s.id === view);
  const eiSubject = view === 'ei' ? SUBJECTS.find((s) => s.id === eiSelected) : null;
  const allPlazos = (view === 'dia') ? collectAllPlazos(data) : null;

  return (
    <div style={{ minHeight: '100vh', background: PAPER, fontFamily: "'IBM Plex Sans', sans-serif" }}>
      <div style={{ height: 4, background: `linear-gradient(90deg, ${NAVY_DEEP}, ${ACCENT})` }} />
      <style>{`
        * { box-sizing: border-box; }
        button:focus-visible, input:focus-visible, textarea:focus-visible, select:focus-visible { outline: 2px solid ${ACCENT}; outline-offset: 2px; }
        ::placeholder { color: #5C7290; }
        .ib-hover { cursor: pointer; transition: box-shadow .15s ease, transform .15s ease, border-color .15s ease; }
        .ib-hover:hover { box-shadow: 0 0 0 1px ${ACCENT}, 0 8px 20px rgba(0,0,0,0.4) !important; transform: translateY(-2px); }
        @media (min-width: 768px) { .ib-sidebar { display: block !important; } .ib-mobile-bar { display: none !important; } }
      `}</style>

      <div className="ib-mobile-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: `1px solid ${BORDER}`, background: CARD }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><LogoMark size={26} /><span style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 500, color: INK }}>FocoBach</span></div>
        <button onClick={() => navigate('inicio')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: `1px solid ${BORDER}`, borderRadius: 9, padding: '6px 12px', fontSize: 12, color: INK, cursor: 'pointer' }}>Inicio</button>
      </div>

      <div style={{ display: 'flex' }}>
        <div className="ib-sidebar" style={{ display: 'none', width: 240, flexShrink: 0, minHeight: '100vh', borderRight: `1px solid ${BORDER}`, padding: '20px 12px', position: 'sticky', top: 0, alignSelf: 'flex-start' }}>
          <div style={{ padding: '4px 14px 20px', display: 'flex', alignItems: 'center', gap: 8 }}><LogoMark size={28} /><span style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 500, color: INK }}>FocoBach</span></div>
          <NavContent view={view} onNavigate={navigate} />
          <div style={{ marginTop: 28, padding: '0 14px' }}>
            {userLabel && <p style={{ fontSize: 11, color: INK_SOFT, margin: '0 0 10px', wordBreak: 'break-all' }}>Sesión: {userLabel}</p>}
            {saved && <p style={{ fontSize: 11, color: SUCCESS, margin: '0 0 10px' }}>Guardado ✓</p>}
            {saveError && <p style={{ fontSize: 11, color: DANGER, margin: '0 0 10px' }}>No se pudo guardar el último cambio</p>}
            {importMsg && <p style={{ fontSize: 11, color: importMsg.includes('correctamente') ? SUCCESS : DANGER, margin: '0 0 10px' }}>{importMsg}</p>}
            <p style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', color: INK_SOFT, textTransform: 'uppercase', margin: '0 0 8px' }}>Copia de seguridad</p>
            <input ref={fileInputRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files[0]; if (f) importData(f); e.target.value = ''; }} />
            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <button onClick={exportData} style={{ background: 'transparent', border: 'none', color: INK, fontSize: 11, fontWeight: 500, cursor: 'pointer', padding: 0 }}>Exportar</button>
              <button onClick={() => fileInputRef.current && fileInputRef.current.click()} style={{ background: 'transparent', border: 'none', color: INK, fontSize: 11, fontWeight: 500, cursor: 'pointer', padding: 0 }}>Importar</button>
            </div>
            {onLogout && <button onClick={onLogout} style={{ display: 'block', background: 'transparent', border: 'none', color: INK_SOFT, fontSize: 11, cursor: 'pointer', padding: 0, marginBottom: 10 }}>Cerrar sesión</button>}
            {!resetArmed ? <button onClick={() => setResetArmed(true)} style={{ background: 'transparent', border: 'none', color: INK_SOFT, fontSize: 11, cursor: 'pointer' }}>Restablecer datos</button> : (
              <div style={{ fontSize: 11, color: INK_SOFT }}>
                <p style={{ margin: '0 0 6px' }}>¿Borrar todo lo guardado?</p>
                <button onClick={doReset} style={{ background: 'transparent', border: 'none', color: DANGER, fontWeight: 500, cursor: 'pointer', padding: 0, marginRight: 12 }}>Sí, borrar</button>
                <button onClick={() => setResetArmed(false)} style={{ background: 'transparent', border: 'none', color: INK_SOFT, cursor: 'pointer', padding: 0 }}>Cancelar</button>
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, padding: '28px 20px', maxWidth: 880, margin: '0 auto', width: '100%' }}>
          {view === 'inicio' && <Dashboard data={data} onNavigate={navigate} />}
          {currentSubject && <SubjectPage subject={currentSubject} data={data[currentSubject.id]} onUpdate={(v) => updateSubject(currentSubject.id, v)} tab={subjectTab} onTabChange={setSubjectTab} onGoToEi={() => navigate('ei', { subject: currentSubject.id })} />}
          {eiSubject && <EiDetail subject={eiSubject} ei={data.ei[eiSubject.id]} onUpdate={(v) => updateEi(eiSubject.id, v)} onBack={() => navigate('inicio')} />}
          {view === 'nucleo-cas' && <NucleoDetailPage title="CAS" color={CAS_COLOR} onBack={() => navigate('inicio')}><CasSection data={data.cas} onUpdate={(v) => updateNucleo('cas', v)} /></NucleoDetailPage>}
          {view === 'nucleo-monografia' && <NucleoDetailPage title="Monografía" color={MONOGRAFIA_COLOR} onBack={() => navigate('inicio')}><MonografiaSection data={data.monografia} onUpdate={(v) => updateNucleo('monografia', v)} /></NucleoDetailPage>}
          {view === 'nucleo-tdc' && <NucleoDetailPage title="Teoría del Conocimiento" color={TDC_COLOR} onBack={() => navigate('inicio')}><TdcSection data={data.tdc} onUpdate={(v) => updateNucleo('tdc', v)} /></NucleoDetailPage>}
          {view === 'dia' && <DiaPage date={selectedDate} allPlazos={allPlazos} onBack={() => navigate('inicio')} onSetStatus={updatePlazoStatus} />}
        </div>
      </div>
    </div>
  );
}

/* ---------- Error boundary ---------- */
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error, info) { console.error('Error en FocoBach:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', background: PAPER, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'IBM Plex Sans', sans-serif" }}>
          <div style={{ maxWidth: 380, textAlign: 'center' }}>
            <p style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 500, color: INK, margin: '0 0 10px' }}>Algo ha ido mal</p>
            <p style={{ fontSize: 13, color: INK_SOFT, margin: '0 0 18px' }}>Tus datos están guardados aparte, así que no se han perdido. Prueba a reintentar; si sigue fallando, exporta una copia desde el menú antes de restablecer.</p>
            <Btn onClick={() => this.setState({ hasError: false })}>Reintentar</Btn>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export { LogoMark, PAPER, CARD, BORDER, ACCENT, INK, INK_SOFT, DANGER, SUCCESS, SERIF, MONO, Btn, Field, TextInput };

export default function FocoBach({ userLabel, onLogout }) {
  return <ErrorBoundary><AppInner userLabel={userLabel} onLogout={onLogout} /></ErrorBoundary>;
}
