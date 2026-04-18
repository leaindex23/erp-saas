import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectAllTransactions } from '../features/transactionsSlice';
import { addProject, updateProject, deleteProject, setProjectAvance } from '../features/projectsSlice';
import {
  Plus, Edit2, Trash2, X, ChevronDown, Target, TrendingUp,
  Calendar, Users, Check, Briefcase, PieChart, ChevronRight
} from 'lucide-react';

// ── helpers ────────────────────────────────────────────────────────────────
const MONTHS = ['01','02','03','04','05','06','07','08','09','10','11','12'];
const MONTH_LABELS = {
  '01':'Ene','02':'Feb','03':'Mar','04':'Abr','05':'May','06':'Jun',
  '07':'Jul','08':'Ago','09':'Sep','10':'Oct','11':'Nov','12':'Dic'
};
const fmt = (n) => n === 0 ? '-' : Math.abs(n).toLocaleString('es-AR', { maximumFractionDigits: 0 });
const fmtCurrency = (n, moneda) => {
  if (n === 0) return '-';
  const prefix = moneda === 'USD' ? 'u$d ' : '$';
  return `${n < 0 ? '-' : ''}${prefix}${fmt(n)}`;
};

// ── Modal (local) ──────────────────────────────────────────────────────────
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()} style={{ maxWidth: 620 }}>
        <div className="modal-header">
          <h3 className="card-title">{title}</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

// ── ProgressBar ────────────────────────────────────────────────────────────
function ProgressBar({ value, color = 'var(--primary)' }) {
  const pct = Math.min(100, Math.max(0, value || 0));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <div style={{ flex: 1, height: 8, background: 'var(--bg-dark)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 4,
          background: pct >= 100 ? '#059669' : color,
          transition: 'width 0.4s ease'
        }} />
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: pct >= 100 ? '#059669' : 'var(--text-sub)', minWidth: 36, textAlign: 'right' }}>
        {pct}%
      </span>
    </div>
  );
}

// ── Status badge ───────────────────────────────────────────────────────────
function StatusBadge({ estado }) {
  const map = {
    activo:     { bg: 'rgba(5,150,105,0.1)',  color: '#059669', label: 'Activo' },
    completado: { bg: 'rgba(37,99,235,0.1)',  color: '#2563eb', label: 'Completado' },
    pausado:    { bg: 'rgba(245,158,11,0.1)', color: '#d97706', label: 'Pausado' },
  };
  const s = map[estado] || map.activo;
  return (
    <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 999, background: s.bg, color: s.color, fontWeight: 700 }}>
      {s.label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function RevenueRecognition({ convertToUSD }) {
  const dispatch = useDispatch();
  const projects    = useSelector(s => s.projects.items);
  const clients     = useSelector(s => s.clients.items);
  const txs         = useSelector(selectAllTransactions);
  const accounts    = useSelector(s => s.accounts.items);
  const { companies, currentCompanyId, isHoldingView } = useSelector(s => s.company);

  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [localCo, setLocalCo] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showCompleted, setShowCompleted] = useState({});
  const [formData, setFormData] = useState({
    nombre: '', client_id: '', company_id: '', cuenta_ingreso_id: '',
    monto_contrato: '', moneda: 'ARS', fecha_inicio: '', fecha_fin_estimada: '', estado: 'activo'
  });

  const months = useMemo(() => MONTHS.map(m => `${year}-${m}`), [year]);

  // ── filtered projects ──
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      if (localCo !== 'all' && p.company_id !== parseInt(localCo)) return false;
      return true;
    });
  }, [projects, localCo]);

  // ── group projects by client ──
  const projectsByClient = useMemo(() => {
    const map = {};
    filteredProjects.forEach(p => {
      const client = clients.find(c => c.id === p.client_id);
      const key = client?.id || 0;
      if (!map[key]) map[key] = { client: client || { id: 0, nombre: 'Sin Cliente' }, projects: [] };
      map[key].projects.push(p);
    });
    return Object.values(map);
  }, [filteredProjects, clients]);

  // ── compute facturado for a project in a given month ──
  const getFacturadoMes = (project, yearMonth) => {
    const client = clients.find(c => c.id === project.client_id);
    if (!client) return 0;
    return txs
      .filter(tx =>
        tx.tipo === 'ingreso' &&
        tx.cliente_proveedor === client.nombre &&
        (tx.subcuenta_id === project.cuenta_ingreso_id || tx.cuenta_id === project.cuenta_ingreso_id) &&
        tx.fecha_factura?.startsWith(yearMonth) &&
        tx.company_id === project.company_id
      )
      .reduce((sum, tx) => sum + (tx.monto_neto || tx.monto || 0), 0);
  };

  // ── compute ejecutado for a project in a given month ──
  const getEjecutadoMes = (project, yearMonth) => {
    const monthIdx = MONTHS.indexOf(yearMonth.split('-')[1]);
    const prevYearMonth = monthIdx === 0
      ? `${parseInt(year) - 1}-12`
      : `${year}-${MONTHS[monthIdx - 1]}`;

    const avanceActual = project.avance?.[yearMonth] || 0;
    const avanceAnterior = project.avance?.[prevYearMonth] || 0;
    const delta = Math.max(0, avanceActual - avanceAnterior);
    return (delta / 100) * project.monto_contrato;
  };

  // ── get latest avance ──
  const getLatestAvance = (project) => {
    const keys = Object.keys(project.avance || {}).sort();
    return keys.length > 0 ? project.avance[keys[keys.length - 1]] : 0;
  };

  // ── KPI totals ──
  const kpis = useMemo(() => {
    let totalContrato = 0, totalEjecutado = 0, totalFacturado = 0;
    filteredProjects.forEach(p => {
      totalContrato += convertToUSD(p.monto_contrato, p.moneda, `${year}-06`);
      months.forEach(m => {
        totalEjecutado += convertToUSD(getEjecutadoMes(p, m), p.moneda, m);
        totalFacturado += convertToUSD(getFacturadoMes(p, m), p.moneda, m);
      });
    });
    return {
      totalContrato,
      totalEjecutado,
      totalFacturado,
      gap: totalEjecutado - totalFacturado,
      backlog: totalContrato - totalEjecutado,
      projectCount: filteredProjects.length,
      activeCount: filteredProjects.filter(p => p.estado === 'activo').length,
    };
  }, [filteredProjects, months, year, convertToUSD]);

  // ── income accounts (leaves only) ──
  const incomeLeaves = useMemo(() => {
    return accounts.filter(a => a.tipo === 'ingreso' && !accounts.some(ch => ch.parent_id === a.id));
  }, [accounts]);

  // ── form handlers ──
  const openAdd = () => {
    setEditingProject(null);
    setFormData({
      nombre: '', client_id: clients.filter(c => c.tipo === 'cliente')[0]?.id || '',
      company_id: currentCompanyId || companies[0]?.id || '',
      cuenta_ingreso_id: incomeLeaves[0]?.id || '',
      monto_contrato: '', moneda: 'ARS',
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_fin_estimada: '', estado: 'activo'
    });
    setIsFormOpen(true);
  };

  const openEdit = (p) => {
    setEditingProject(p);
    setFormData({ ...p, monto_contrato: p.monto_contrato });
    setIsFormOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      client_id: parseInt(formData.client_id),
      company_id: parseInt(formData.company_id),
      cuenta_ingreso_id: parseInt(formData.cuenta_ingreso_id),
      monto_contrato: parseFloat(formData.monto_contrato) || 0,
    };
    if (editingProject) {
      dispatch(updateProject({ ...payload, id: editingProject.id, avance: editingProject.avance }));
    } else {
      dispatch(addProject(payload));
    }
    setIsFormOpen(false);
  };

  const handleAvanceChange = (projectId, month, value) => {
    dispatch(setProjectAvance({ projectId, month, percentage: value }));
  };

  const toggleCompleted = (clientId) => {
    setShowCompleted(prev => ({ ...prev, [clientId]: !prev[clientId] }));
  };

  // ── render helper for a single project ──
  const renderProject = (project) => {
    const latestAvance = getLatestAvance(project);
    const account = accounts.find(a => a.id === project.cuenta_ingreso_id);

    // Compute row data for all months
    const rowData = months.map(m => {
      const ejecutado = getEjecutadoMes(project, m);
      const facturado = getFacturadoMes(project, m);
      return { month: m, avance: project.avance?.[m] ?? '', ejecutado, facturado, diff: ejecutado - facturado };
    });

    const totalEjec = rowData.reduce((s, r) => s + r.ejecutado, 0);
    const totalFact = rowData.reduce((s, r) => s + r.facturado, 0);
    const totalDiff = totalEjec - totalFact;

    return (
      <div key={project.id} className="animate-fade-in" style={{ borderBottom: '1px solid var(--border-color)' }}>
        {/* Project info bar */}
        <div style={{
          padding: '1rem 1.25rem',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '0.75rem',
          background: 'rgba(255,255,255,0.6)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 300 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{project.nombre}</span>
                <StatusBadge estado={project.estado} />
              </div>
              <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.72rem', color: 'var(--text-faint)', flexWrap: 'wrap' }}>
                <span>📋 {account?.nombre || 'S/C'}</span>
                <span>💰 {fmtCurrency(project.monto_contrato, project.moneda)}</span>
                <span>📅 {project.fecha_inicio} → {project.fecha_fin_estimada || '?'}</span>
              </div>
              <div style={{ marginTop: '0.5rem', maxWidth: 300 }}>
                <ProgressBar value={latestAvance} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button className="btn" style={{ padding: '0.3rem 0.5rem', background: '#f3f4f6', color: '#374151' }} onClick={() => openEdit(project)}>
              <Edit2 size={13} />
            </button>
            <button className="btn" style={{ padding: '0.3rem 0.5rem', background: '#fee2e2', color: '#dc2626' }}
              onClick={() => { if (window.confirm('¿Eliminar proyecto?')) dispatch(deleteProject(project.id)); }}>
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Monthly avance grid */}
        <div style={{ overflowX: 'auto' }}>
          <table className="grid-table" style={{ minWidth: 1000, fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-base)' }}>
                <th style={{ position: 'sticky', left: 0, background: 'var(--bg-base)', zIndex: 2, minWidth: 130, textAlign: 'left', padding: '0.5rem 0.75rem' }}>
                  Concepto
                </th>
                {months.map(m => (
                  <th key={m} style={{ textAlign: 'center', minWidth: 68, padding: '0.5rem 0.4rem', color: 'var(--text-muted)' }}>
                    {MONTH_LABELS[m.split('-')[1]]}
                  </th>
                ))}
                <th style={{ textAlign: 'right', minWidth: 90, padding: '0.5rem 0.75rem', fontWeight: 800, background: 'rgba(37,99,235,0.06)', color: 'var(--primary)' }}>
                  TOTAL
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Row 1: % Avance (editable) */}
              <tr>
                <td style={{ position: 'sticky', left: 0, background: '#fff', zIndex: 1, fontWeight: 700, padding: '0.4rem 0.75rem', color: 'var(--text-main)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Target size={13} color="var(--primary)" /> % Avance
                  </div>
                </td>
                {rowData.map(r => (
                  <td key={r.month} style={{ padding: '0.3rem', textAlign: 'center' }}>
                    <input
                      type="number"
                      min="0" max="100" step="1"
                      className="projection-input"
                      value={r.avance}
                      placeholder="—"
                      onChange={e => handleAvanceChange(project.id, r.month, e.target.value)}
                      style={{
                        width: '100%', textAlign: 'center', fontSize: '0.8rem',
                        fontWeight: 700, color: 'var(--primary)',
                      }}
                    />
                  </td>
                ))}
                <td style={{ textAlign: 'right', padding: '0.4rem 0.75rem', fontWeight: 900, color: 'var(--primary)', background: 'rgba(37,99,235,0.04)' }}>
                  {latestAvance}%
                </td>
              </tr>

              {/* Row 2: Ejecutado */}
              <tr style={{ background: 'rgba(5,150,105,0.03)' }}>
                <td style={{ position: 'sticky', left: 0, background: 'rgba(5,150,105,0.03)', zIndex: 1, fontWeight: 600, padding: '0.5rem 0.75rem', color: '#059669' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <TrendingUp size={13} color="#059669" /> Ejecutado
                  </div>
                </td>
                {rowData.map(r => (
                  <td key={r.month} className="numeric" style={{ textAlign: 'right', padding: '0.5rem 0.4rem', color: r.ejecutado ? '#059669' : 'var(--border-color)' }}>
                    {r.ejecutado ? fmt(r.ejecutado) : '-'}
                  </td>
                ))}
                <td className="numeric" style={{ textAlign: 'right', padding: '0.5rem 0.75rem', fontWeight: 800, color: '#059669', background: 'rgba(5,150,105,0.06)' }}>
                  {fmt(totalEjec)}
                </td>
              </tr>

              {/* Row 3: Facturado */}
              <tr>
                <td style={{ position: 'sticky', left: 0, background: '#fff', zIndex: 1, fontWeight: 600, padding: '0.5rem 0.75rem', color: '#0284c7' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <PieChart size={13} color="#0284c7" /> Facturado
                  </div>
                </td>
                {rowData.map(r => (
                  <td key={r.month} className="numeric" style={{ textAlign: 'right', padding: '0.5rem 0.4rem', color: r.facturado ? '#0284c7' : 'var(--border-color)' }}>
                    {r.facturado ? fmt(r.facturado) : '-'}
                  </td>
                ))}
                <td className="numeric" style={{ textAlign: 'right', padding: '0.5rem 0.75rem', fontWeight: 800, color: '#0284c7', background: 'rgba(2,132,199,0.06)' }}>
                  {fmt(totalFact)}
                </td>
              </tr>

              {/* Row 4: Diferencia */}
              <tr style={{ background: 'rgba(0,0,0,0.02)', borderTop: '2px solid var(--border-color)' }}>
                <td style={{ position: 'sticky', left: 0, background: 'rgba(0,0,0,0.02)', zIndex: 1, fontWeight: 800, padding: '0.5rem 0.75rem', color: 'var(--text-main)', fontSize: '0.73rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Δ Diferencia
                </td>
                {rowData.map(r => {
                  const color = r.diff === 0 ? 'var(--border-color)' : (r.diff > 0 ? '#059669' : '#dc2626');
                  return (
                    <td key={r.month} className="numeric" style={{ textAlign: 'right', padding: '0.5rem 0.4rem', fontWeight: 700, color }}>
                      {r.diff === 0 ? '-' : `${r.diff > 0 ? '+' : ''}${fmt(r.diff)}`}
                    </td>
                  );
                })}
                <td className="numeric" style={{
                  textAlign: 'right', padding: '0.5rem 0.75rem', fontWeight: 900,
                  color: totalDiff === 0 ? 'var(--text-faint)' : (totalDiff > 0 ? '#059669' : '#dc2626'),
                  background: totalDiff > 0 ? 'rgba(5,150,105,0.08)' : (totalDiff < 0 ? 'rgba(220,38,38,0.06)' : 'rgba(0,0,0,0.03)'),
                }}>
                  {totalDiff === 0 ? '-' : `${totalDiff > 0 ? '+' : ''}${fmt(totalDiff)}`}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      {/* ── Page Header ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
          Revenue Recognition & Avance de Proyectos
        </h2>
        <p style={{ color: 'var(--text-faint)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
          Reconocimiento de ingresos por porcentaje de avance (POC) · Comparación Facturado vs Ejecutado
        </p>
      </div>

      {/* ── Controls Bar ── */}
      <div style={{
        display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap',
        marginBottom: '1.5rem', padding: '0.75rem 1rem', background: 'white',
        borderRadius: 10, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Empresa</span>
          <select className="search-input" style={{ width: 180, height: 34, fontSize: '0.8rem' }} value={localCo} onChange={e => setLocalCo(e.target.value)}>
            <option value="all">Holding (Consolidado)</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Año</span>
          <select className="search-input" style={{ width: 85, height: 34 }} value={year} onChange={e => setYear(e.target.value)}>
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-primary" style={{ height: 34, fontSize: '0.8rem' }} onClick={openAdd}>
            <Plus size={15} /> Nuevo Proyecto
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Contratos Totales', val: kpis.totalContrato, color: 'var(--primary)', sub: `${kpis.projectCount} proyectos (${kpis.activeCount} activos)` },
          { label: 'Ejecutado (POC)', val: kpis.totalEjecutado, color: '#059669', sub: 'Por avance real' },
          { label: 'Facturado', val: kpis.totalFacturado, color: '#0284c7', sub: 'Facturas emitidas' },
          { label: 'Revenue Gap', val: kpis.gap, color: kpis.gap >= 0 ? '#059669' : '#dc2626', sub: kpis.gap >= 0 ? 'Ejecutado > Facturado' : 'Facturado > Ejecutado' },
          { label: 'Backlog', val: kpis.backlog, color: '#d97706', sub: 'Pendiente de ejecutar' },
        ].map(({ label, val, color, sub }) => (
          <div key={label} className="data-card" style={{ padding: '1rem 1.25rem', borderLeft: `4px solid ${color}`, boxShadow: 'none' }}>
            <div style={{ fontSize: '0.63rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-faint)', marginBottom: '0.4rem' }}>{label}</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 900, color, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              {val < 0 && '('}{fmt(Math.abs(val))}{val < 0 && ')'}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 500 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* ── Projects grouped by client ── */}
      {projectsByClient.length === 0 ? (
        <div className="data-card" style={{ textAlign: 'center', padding: '4rem' }}>
          <Briefcase size={40} color="var(--text-faint)" style={{ marginBottom: '1rem', opacity: 0.4 }} />
          <h3 style={{ color: 'var(--text-muted)', fontWeight: 700 }}>Sin proyectos registrados</h3>
          <p style={{ color: 'var(--text-faint)', fontSize: '0.85rem' }}>Crea el primer proyecto con el botón "Nuevo Proyecto"</p>
        </div>
      ) : (
        projectsByClient.map(({ client, projects: clientProjects }) => (
          <div key={client.id} className="data-card" style={{ marginBottom: '1.5rem', padding: 0, overflow: 'hidden' }}>
            {/* Client header */}
            <div style={{
              padding: '1rem 1.25rem', background: 'var(--bg-base)',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'linear-gradient(135deg, var(--primary), #6366f1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Users size={16} color="#fff" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{client.nombre}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>
                    {clientProjects.length} proyecto{clientProjects.length !== 1 ? 's' : ''}
                    {' · '}
                    {companies.find(c => c.id === clientProjects[0]?.company_id)?.nombre || ''}
                  </div>
                </div>
              </div>
            </div>

            {/* Active Projects */}
            {clientProjects.filter(p => getLatestAvance(p) < 100).map(project => renderProject(project))}

            {/* Togglable Completed Projects section */}
            {(() => {
              const completedProjects = clientProjects.filter(p => getLatestAvance(p) >= 100);
              if (completedProjects.length === 0) return null;
              
              const isExpanded = showCompleted[client.id];
              return (
                <div>
                  <div 
                    onClick={() => toggleCompleted(client.id)}
                    style={{ 
                      padding: '0.75rem 1.25rem', background: '#f8fafc', 
                      borderBottom: isExpanded ? '1px solid var(--border-color)' : 'none', 
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', 
                      color: 'var(--text-main)', fontSize: '0.8rem', fontWeight: 700, userSelect: 'none',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                    onMouseLeave={e => e.currentTarget.style.background = '#f8fafc'}
                  >
                    {isExpanded ? <ChevronDown size={16} /> : <Plus size={16} />} 
                    <span style={{ color: 'var(--primary)' }}>{completedProjects.length}</span> proyecto{completedProjects.length !== 1 ? 's' : ''} completado{completedProjects.length !== 1 ? 's' : ''} (100%)
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginLeft: '0.5rem', fontWeight: 500 }}>
                      {isExpanded ? 'Ocultar proyectos' : 'Clic para mostrar y editar'}
                    </span>
                  </div>
                  {isExpanded && completedProjects.map(project => renderProject(project))}
                </div>
              );
            })()}
          </div>
        ))
      )}

      {/* ── Project Form Modal ── */}
      {isFormOpen && (
        <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title={editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label className="form-section-label">Nombre del Proyecto</label>
              <input className="search-input" value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} required placeholder="Ej: Implementación Fase 2..." style={{ width: '100%' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-section-label">Cliente</label>
                <select className="search-input" value={formData.client_id} onChange={e => setFormData({ ...formData, client_id: e.target.value })} required style={{ width: '100%' }}>
                  <option value="">— Seleccionar Cliente —</option>
                  {clients.filter(c => c.tipo === 'cliente').map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="form-section-label">Empresa</label>
                <select className="search-input" value={formData.company_id} onChange={e => setFormData({ ...formData, company_id: e.target.value })} required style={{ width: '100%' }}>
                  <option value="">— Empresa —</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="form-section-label">Cuenta de Ingreso Asociada</label>
              <select className="search-input" value={formData.cuenta_ingreso_id} onChange={e => setFormData({ ...formData, cuenta_ingreso_id: e.target.value })} required style={{ width: '100%' }}>
                <option value="">— Seleccionar Cuenta —</option>
                {incomeLeaves.map(a => <option key={a.id} value={a.id}>{a.codigo} · {a.nombre}</option>)}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-section-label">Monto del Contrato</label>
                <input type="number" step="0.01" className="search-input" value={formData.monto_contrato} onChange={e => setFormData({ ...formData, monto_contrato: e.target.value })} required placeholder="0.00" style={{ width: '100%', fontWeight: 700 }} />
              </div>
              <div>
                <label className="form-section-label">Moneda</label>
                <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1', height: 40 }}>
                  <button type="button" style={{ flex: 1, border: 'none', fontWeight: 700, cursor: 'pointer', background: formData.moneda === 'ARS' ? '#2563eb' : '#f8fafc', color: formData.moneda === 'ARS' ? '#fff' : '#64748b' }} onClick={() => setFormData({ ...formData, moneda: 'ARS' })}>ARS</button>
                  <button type="button" style={{ flex: 1, border: 'none', borderLeft: '1px solid #cbd5e1', fontWeight: 700, cursor: 'pointer', background: formData.moneda === 'USD' ? '#2563eb' : '#f8fafc', color: formData.moneda === 'USD' ? '#fff' : '#64748b' }} onClick={() => setFormData({ ...formData, moneda: 'USD' })}>USD</button>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-section-label">Fecha Inicio</label>
                <input type="date" className="search-input" value={formData.fecha_inicio} onChange={e => setFormData({ ...formData, fecha_inicio: e.target.value })} style={{ width: '100%' }} />
              </div>
              <div>
                <label className="form-section-label">Fecha Fin Estimada</label>
                <input type="date" className="search-input" value={formData.fecha_fin_estimada} onChange={e => setFormData({ ...formData, fecha_fin_estimada: e.target.value })} style={{ width: '100%' }} />
              </div>
              <div>
                <label className="form-section-label">Estado</label>
                <select className="search-input" value={formData.estado} onChange={e => setFormData({ ...formData, estado: e.target.value })} style={{ width: '100%' }}>
                  <option value="activo">Activo</option>
                  <option value="completado">Completado</option>
                  <option value="pausado">Pausado</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ height: 48, marginTop: '0.5rem', fontWeight: 700 }}>
              {editingProject ? 'Guardar Cambios' : 'Crear Proyecto'}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
