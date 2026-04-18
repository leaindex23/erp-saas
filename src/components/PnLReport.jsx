import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';

// ── helpers ────────────────────────────────────────────────────────────────
const MONTHS = ['01','02','03','04','05','06','07','08','09','10','11','12'];
const MONTH_LABELS = {
  '01':'Ene','02':'Feb','03':'Mar','04':'Abr','05':'May','06':'Jun',
  '07':'Jul','08':'Ago','09':'Sep','10':'Oct','11':'Nov','12':'Dic'
};
const QUARTERS = [
  { key:'Q1', label:'Q1', months:['01','02','03'] },
  { key:'Q2', label:'Q2', months:['04','05','06'] },
  { key:'Q3', label:'Q3', months:['07','08','09'] },
  { key:'Q4', label:'Q4', months:['10','11','12'] },
];

const fmt = (n) => n === 0 ? '' : Math.abs(n).toLocaleString('es-AR', { maximumFractionDigits: 0 });
const fmtSigned = (n) => n === 0 ? '-' : (n < 0 ? '(' + fmt(n) + ')' : fmt(n));
const pct = (n, base) => (!base) ? '' : ((n / base) * 100).toFixed(1) + '%';
const delta = (cur, prev) => {
  if (!prev || prev === 0) return cur !== 0 ? 'Nuevo' : '';
  const d = ((cur - prev) / Math.abs(prev)) * 100;
  return (d >= 0 ? '+' : '') + d.toFixed(1) + '%';
};
const deltaColor = (cur, prev, invert = false) => {
  const positive = cur >= prev;
  return (positive !== invert) ? '#059669' : '#dc2626';
};

// ─── Section header ────────────────────────────────────────────────────────
function SectionHeader({ label, color, colSpan }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{
        padding: '0.5rem 1rem',
        fontWeight: 800,
        fontSize: '0.63rem',
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        color,
        background: `${color}14`,
        position: 'sticky',
        left: 0,
        borderTop: `2px solid ${color}33`,
      }}>
        {label}
      </td>
    </tr>
  );
}

// ─── Key subtotal row ──────────────────────────────────────────────────────
function SubtotalRow({ label, colValues, annualTotal, prevAnnual, baseIngresos, color, bg, showYoY, compareYear, showRatios, inverted = false }) {
  const annualDelta = delta(annualTotal, prevAnnual);
  return (
    <>
      <tr style={{ background: bg, borderTop: `2px solid ${color}44`, borderBottom: `2px solid ${color}22` }}>
        <td style={{ paddingLeft: '1rem', fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color, position: 'sticky', left: 0, background: bg, zIndex: 1 }}>
          {label}
        </td>
        {colValues.map(({ key, val }) => (
          <td key={key} className="numeric" style={{ textAlign: 'right', fontWeight: 800, color: val < 0 ? '#dc2626' : color, fontSize: '0.82rem' }}>
            {fmtSigned(val)}
          </td>
        ))}
        <td className="numeric" style={{ textAlign: 'right', fontWeight: 900, fontSize: '0.88rem', background: `${color}18`, color: annualTotal < 0 ? '#dc2626' : color }}>
          {fmtSigned(annualTotal)}
        </td>
        {showYoY && (
          <td className="numeric" style={{ textAlign: 'right', fontWeight: 700, fontSize: '0.75rem', color: deltaColor(annualTotal, prevAnnual, inverted) }}>
            {annualDelta}
          </td>
        )}
        {showRatios && (
          <td className="numeric" style={{ textAlign: 'right', fontSize: '0.73rem', fontWeight: 700, color }}>
            {pct(annualTotal, baseIngresos)}
          </td>
        )}
      </tr>
    </>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function PnLReport({ convertToUSD }) {
  const txs      = useSelector(s => s.transactions.items);
  const accounts = useSelector(s => s.accounts.items);
  const projects = useSelector(s => s.projects?.items || []);
  const clients  = useSelector(s => s.clients?.items || []);
  const { companies } = useSelector(s => s.company);

  const [year,         setYear]        = useState(String(new Date().getFullYear()));
  const [compareYear,  setCompareYear] = useState(String(new Date().getFullYear() - 1));
  const [localCo,      setLocalCo]     = useState('all');
  const [viewMode,     setViewMode]    = useState('monthly');
  const [showRatios,   setShowRatios]  = useState(false);
  const [showYoY,      setShowYoY]     = useState(false);
  const [revenueBase,  setRevenueBase] = useState('facturado'); // 'facturado' | 'ejecutado'

  const columns = viewMode === 'monthly'
    ? MONTHS.map(m => ({ key: m, label: MONTH_LABELS[m] }))
    : QUARTERS;

  // ── helper: facturado for a project in a given month ──
  const getProjectFacturado = (project, forYear, month) => {
    const client = clients.find(c => c.id === project.client_id);
    if (!client) return 0;
    const yearMonth = `${forYear}-${month}`;
    return txs
      .filter(tx =>
        tx.tipo === 'ingreso' &&
        tx.cliente_proveedor === client.nombre &&
        (tx.subcuenta_id === project.cuenta_ingreso_id || tx.cuenta_id === project.cuenta_ingreso_id) &&
        tx.fecha_factura?.startsWith(yearMonth) &&
        (localCo === 'all' || tx.company_id === parseInt(localCo)) &&
        tx.company_id === project.company_id
      )
      .reduce((sum, tx) => sum + convertToUSD(tx.monto_neto || tx.monto, tx.moneda, tx.fecha_factura, tx.tipo_cambio), 0);
  };

  // ── helper: ejecutado (POC) for a project in a given month ──
  const getProjectEjecutado = (project, forYear, month) => {
    const yearMonth = `${forYear}-${month}`;
    const monthIdx = MONTHS.indexOf(month);
    const prevYearMonth = monthIdx === 0
      ? `${parseInt(forYear) - 1}-12`
      : `${forYear}-${MONTHS[monthIdx - 1]}`;
    const avanceActual = project.avance?.[yearMonth] || 0;
    const avanceAnterior = project.avance?.[prevYearMonth] || 0;
    const delta = Math.max(0, avanceActual - avanceAnterior);
    return convertToUSD((delta / 100) * project.monto_contrato, project.moneda, yearMonth);
  };

  // ── build aggregation per year ──
  const buildTotals = (forYear, applyPOC = false) => {
    const t = {};
    accounts.forEach(a => { t[a.id] = {}; MONTHS.forEach(m => { t[a.id][m] = 0; }); });
    txs
      .filter(tx => {
        const co = localCo === 'all' || tx.company_id === parseInt(localCo);
        return co && tx.fecha_factura?.startsWith(forYear) && tx.cuenta_id !== 999;
      })
      .forEach(tx => {
        const id = tx.subcuenta_id || tx.cuenta_id;
        const mo = tx.fecha_factura.substring(5, 7);
        if (t[id]) {
          t[id][mo] = (t[id][mo] || 0) + convertToUSD(tx.monto_neto || tx.monto, tx.moneda, tx.fecha_factura, tx.tipo_cambio);
        }
      });

    // Apply POC adjustments when in ejecutado mode
    if (applyPOC) {
      const relevantProjects = projects.filter(p =>
        localCo === 'all' || p.company_id === parseInt(localCo)
      );
      relevantProjects.forEach(project => {
        const accId = project.cuenta_ingreso_id;
        if (!t[accId]) return;
        MONTHS.forEach(month => {
          const facturado = getProjectFacturado(project, forYear, month);
          const ejecutado = getProjectEjecutado(project, forYear, month);
          const ajuste = ejecutado - facturado;
          t[accId][month] += ajuste;
        });
      });
    }

    return t;
  };

  const cur  = useMemo(() => buildTotals(year, revenueBase === 'ejecutado'),        [txs, accounts, localCo, year, convertToUSD, revenueBase, projects, clients]);
  const prev = useMemo(() => showYoY ? buildTotals(compareYear, revenueBase === 'ejecutado') : {}, [txs, accounts, localCo, compareYear, showYoY, convertToUSD, revenueBase, projects, clients]);

  // ── leaf-sum helper ──
  const leafSum = (accId, month, totMap, visited = new Set()) => {
    if (visited.has(accId) || !totMap[accId]) return 0;
    visited.add(accId);
    const children = accounts.filter(a => a.parent_id === accId);
    if (children.length === 0) return totMap[accId]?.[month] || 0;
    return children.reduce((s, c) => s + leafSum(c.id, month, totMap, visited), 0);
  };

  // amount for a column (month key or quarter key)
  const colAmt = (accId, colKey, totMap) => {
    if (viewMode === 'monthly') return leafSum(accId, colKey, totMap);
    const qDef = QUARTERS.find(q => q.key === colKey);
    return qDef ? qDef.months.reduce((s, m) => s + leafSum(accId, m, totMap), 0) : 0;
  };

  // section totals (sum over all root accounts of a type)
  const roots = (tipo) => accounts.filter(a => a.tipo === tipo && !a.parent_id);

  const sectionColAmt = (tipo, colKey, totMap) =>
    roots(tipo).reduce((s, a) => s + colAmt(a.id, colKey, totMap), 0);

  const sectionAnnual = (tipo, totMap) =>
    MONTHS.reduce((s, m) => s + roots(tipo).reduce((rs, a) => rs + leafSum(a.id, m, totMap), 0), 0);

  // ── per-column subtotals ──
  const buildSubMap = (fn) => columns.map(col => ({ key: col.key, val: fn(col.key) }));

  const mBrutoC  = buildSubMap(k => sectionColAmt('ingreso',k,cur) - sectionColAmt('costo_directo',k,cur));
  const ebitdaC  = buildSubMap(k => mBrutoC.find(r=>r.key===k).val - sectionColAmt('gasto_operativo',k,cur));
  const ebtC     = buildSubMap(k => ebitdaC.find(r=>r.key===k).val - sectionColAmt('depreciacion',k,cur) - sectionColAmt('gasto_financiero',k,cur));
  const netoC    = buildSubMap(k => ebtC.find(r=>r.key===k).val - sectionColAmt('impuesto',k,cur));

  const mBrutoP  = buildSubMap(k => sectionColAmt('ingreso',k,prev) - sectionColAmt('costo_directo',k,prev));
  const ebitdaP  = buildSubMap(k => mBrutoP.find(r=>r.key===k).val - sectionColAmt('gasto_operativo',k,prev));
  const ebtP     = buildSubMap(k => ebitdaP.find(r=>r.key===k).val - sectionColAmt('depreciacion',k,prev) - sectionColAmt('gasto_financiero',k,prev));
  const netoP    = buildSubMap(k => ebtP.find(r=>r.key===k).val - sectionColAmt('impuesto',k,prev));

  const annual = (map) => map.reduce((s, r) => s + r.val, 0);

  const totalIngresos = sectionAnnual('ingreso', cur);
  const totalMBruto   = annual(mBrutoC);
  const totalEbitda   = annual(ebitdaC);
  const totalNeto     = annual(netoC);

  const totalIngPrev  = sectionAnnual('ingreso', prev);
  const totalMBrutoPrev = annual(mBrutoP);
  const totalEbitdaPrev = annual(ebitdaP);
  const totalNetoPrev   = annual(netoP);

  const colSpanTotal = 1 + columns.length + 1 + (showYoY ? 1 : 0) + (showRatios ? 1 : 0);

  // ── account tree renderer ──
  const renderTree = (tipo, parentId = null, depth = 0) => {
    const list = accounts.filter(a => a.tipo === tipo && (parentId ? a.parent_id === parentId : !a.parent_id));
    if (!list.length) return null;

    return list.map(acc => {
      const hasChildren = accounts.some(a => a.parent_id === acc.id);
      const ann  = MONTHS.reduce((s, m) => s + leafSum(acc.id, m, cur), 0);
      const annP = MONTHS.reduce((s, m) => s + leafSum(acc.id, m, prev), 0);
      if (ann === 0 && annP === 0 && !hasChildren) return null;

      const isGroup = hasChildren && depth === 0;

      return (
        <React.Fragment key={acc.id}>
          <tr style={{
            background: isGroup ? 'rgba(0,0,0,0.015)' : 'transparent',
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = isGroup ? 'rgba(0,0,0,0.015)' : 'transparent'}
          >
            <td style={{
              paddingLeft: `${1 + depth * 1.2}rem`,
              fontWeight: isGroup ? 700 : 400,
              fontSize: isGroup ? '0.8rem' : '0.78rem',
              color: isGroup ? 'var(--text-main)' : 'var(--text-sub)',
              position: 'sticky',
              left: 0,
              background: isGroup ? 'rgba(249,250,251,0.97)' : 'white',
              zIndex: 1,
              borderLeft: depth === 1 ? '2px solid var(--border-color)' : 'none',
            }}>
              {acc.nombre}
            </td>
            {columns.map(col => {
              const v = colAmt(acc.id, col.key, cur);
              return (
                <td key={col.key} className="numeric" style={{ textAlign: 'right', color: v === 0 ? 'var(--border-color)' : 'var(--text-sub)', fontWeight: isGroup ? 600 : 400 }}>
                  {v === 0 ? '' : fmt(v)}
                </td>
              );
            })}
            {/* Annual */}
            <td className="numeric" style={{ textAlign: 'right', fontWeight: isGroup ? 800 : 600, background: 'rgba(37,99,235,0.04)', color: ann === 0 ? 'var(--border-color)' : 'var(--text-main)' }}>
              {ann === 0 ? '' : fmt(ann)}
            </td>
            {/* YoY */}
            {showYoY && (
              <td className="numeric" style={{ textAlign: 'right', fontSize: '0.73rem', fontWeight: 600, color: ann === 0 && annP === 0 ? 'transparent' : deltaColor(ann, annP) }}>
                {delta(ann, annP)}
              </td>
            )}
            {/* Ratio */}
            {showRatios && (
              <td className="numeric" style={{ textAlign: 'right', fontSize: '0.71rem', color: 'var(--text-muted)' }}>
                {pct(ann, totalIngresos)}
              </td>
            )}
          </tr>
          {hasChildren && renderTree(tipo, acc.id, depth + 1)}
        </React.Fragment>
      );
    });
  };

  // ── section total row ──
  const SectionTotal = ({ label, tipo, color, bg }) => {
    const ann   = sectionAnnual(tipo, cur);
    const annP  = sectionAnnual(tipo, prev);
    if (ann === 0 && annP === 0) return null;
    return (
      <tr style={{ background: bg, fontWeight: 700 }}>
        <td style={{ paddingLeft: '1rem', fontWeight: 800, fontSize: '0.78rem', color, position: 'sticky', left: 0, background: bg, zIndex: 1 }}>
          {label}
        </td>
        {columns.map(col => (
          <td key={col.key} className="numeric" style={{ textAlign: 'right', color, fontWeight: 700 }}>
            {fmtSigned(sectionColAmt(tipo, col.key, cur))}
          </td>
        ))}
        <td className="numeric" style={{ textAlign: 'right', fontWeight: 900, background: `${color}18`, color }}>
          {fmtSigned(ann)}
        </td>
        {showYoY && (
          <td className="numeric" style={{ textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: deltaColor(ann, annP, tipo !== 'ingreso') }}>
            {delta(ann, annP)}
          </td>
        )}
        {showRatios && (
          <td className="numeric" style={{ textAlign: 'right', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {pct(ann, totalIngresos)}
          </td>
        )}
      </tr>
    );
  };

  return (
    <div className="animate-fade-in">
      {/* ── Page header ── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
          Estado de Resultados (P&L)
        </h2>
        <p style={{ color: 'var(--text-faint)', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
          {revenueBase === 'ejecutado' ? 'Revenue Recognition (POC)' : 'Base Devengada'} · USD · Plan de Cuentas Estructurado
        </p>
      </div>

      {/* ── POC warning banner ── */}
      {revenueBase === 'ejecutado' && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          borderRadius: 8,
          padding: '0.65rem 1rem',
          marginBottom: '1rem',
          fontSize: '0.8rem',
          color: '#92400e',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          ⚠️ Ingresos ajustados por <strong style={{ margin: '0 0.2rem' }}>Porcentaje de Avance (POC)</strong>.
          Los ingresos operativos reflejan el reconocimiento proporcional al avance real de cada proyecto.
        </div>
      )}

      {/* ── Controls bar ── */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: '1.5rem',
        padding: '0.75rem 1rem',
        background: 'white',
        borderRadius: 10,
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-sm)',
      }}>
        {/* Base de reconocimiento */}
        <div className="view-toggle">
          <button className={`btn ${revenueBase === 'facturado' ? 'active-primary' : ''}`} onClick={() => setRevenueBase('facturado')}>Facturado</button>
          <button className={`btn ${revenueBase === 'ejecutado' ? 'active-primary' : ''}`} onClick={() => setRevenueBase('ejecutado')}>Ejecutado (POC)</button>
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--border-color)' }} />

        {/* Frecuencia */}
        <div className="view-toggle">
          <button className={`btn ${viewMode === 'monthly' ? 'active-primary' : ''}`} onClick={() => setViewMode('monthly')}>Mensual</button>
          <button className={`btn ${viewMode === 'quarterly' ? 'active-primary' : ''}`} onClick={() => setViewMode('quarterly')}>Trimestral</button>
        </div>

        <div style={{ width: 1, height: 24, background: 'var(--border-color)' }} />

        {/* Opciones */}
        {[
          { label: '% sobre Ingresos', state: showRatios, set: setShowRatios },
          { label: 'Comparar con año', state: showYoY,    set: setShowYoY    },
        ].map(({ label, state, set }) => (
          <label key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', margin: 0, fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-sub)', userSelect: 'none', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={state} onChange={e => set(e.target.checked)} style={{ accentColor: 'var(--primary)', width: 14, height: 14 }} />
            {label}
          </label>
        ))}
        {showYoY && (
          <select className="search-input" style={{ width: 90, height: 34, fontSize: '0.8rem' }} value={compareYear} onChange={e => setCompareYear(e.target.value)}>
            {[2023,2024,2025,2026,2027].filter(y => String(y) !== year).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        )}

        <div style={{ width: 1, height: 24, background: 'var(--border-color)' }} />

        {/* Empresa */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Empresa</span>
          <select className="search-input" style={{ width: 180, height: 34, fontSize: '0.8rem' }} value={localCo} onChange={e => setLocalCo(e.target.value)}>
            <option value="all">Holding (Consolidado)</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>

        {/* Año */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Año</span>
          <select className="search-input" style={{ width: 85, height: 34 }} value={year} onChange={e => setYear(e.target.value)}>
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-primary" style={{ height: 34, fontSize: '0.8rem' }} onClick={() => window.print()}>
            ↓ Exportar
          </button>
        </div>
      </div>

      {/* ── KPI summary ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Ingresos Totales', val: totalIngresos,  prev: totalIngPrev,    color: '#059669', ratio: null },
          { label: 'Margen Bruto',     val: totalMBruto,    prev: totalMBrutoPrev, color: '#0369a1', ratio: pct(totalMBruto, totalIngresos) },
          { label: 'EBITDA',           val: totalEbitda,    prev: totalEbitdaPrev, color: '#0284c7', ratio: pct(totalEbitda, totalIngresos) },
          { label: 'Resultado Neto',   val: totalNeto,      prev: totalNetoPrev,   color: totalNeto >= 0 ? 'var(--primary)' : '#dc2626', ratio: pct(totalNeto, totalIngresos) },
        ].map(({ label, val, prev: prevVal, color, ratio }) => (
          <div key={label} className="data-card" style={{ padding: '1rem 1.25rem', borderLeft: `4px solid ${color}`, boxShadow: 'none' }}>
            <div style={{ fontSize: '0.63rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-faint)', marginBottom: '0.4rem' }}>{label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color, letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              {val < 0 && <span style={{ opacity: 0.6 }}>{'('}</span>}
              {fmt(val)}
              {val < 0 && <span style={{ opacity: 0.6 }}>{')'}</span>}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.35rem', alignItems: 'center' }}>
              {ratio && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>{ratio} de ing.</span>}
              {showYoY && prevVal !== undefined && (
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: deltaColor(val, prevVal) }}>
                  {delta(val, prevVal)} vs {compareYear}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── P&L table ── */}
      <div className="data-card" style={{ padding: 0, overflowX: 'auto', fontSize: '0.8rem' }}>
        <table className="grid-table" style={{ minWidth: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-base)' }}>
              <th style={{
                position: 'sticky', left: 0, background: 'var(--bg-base)', zIndex: 3,
                minWidth: 230, textAlign: 'left', padding: '0.75rem 1rem',
                borderBottom: '2px solid var(--border-color)',
              }}>
                Concepto
              </th>
              {columns.map(col => (
                <th key={col.key} style={{
                  textAlign: 'right',
                  minWidth: viewMode === 'quarterly' ? 120 : 78,
                  padding: '0.75rem 0.6rem',
                  fontVariantNumeric: 'tabular-nums',
                  borderBottom: '2px solid var(--border-color)',
                  color: 'var(--text-muted)',
                }}>
                  {col.label}
                  {viewMode === 'quarterly' && (
                    <div style={{ fontSize: '0.58rem', fontWeight: 500, color: 'var(--text-faint)' }}>
                      {QUARTERS.find(q=>q.key===col.key)?.months.map(m=>MONTH_LABELS[m]).join('-')}
                    </div>
                  )}
                </th>
              ))}
              <th style={{
                textAlign: 'right', minWidth: 100,
                padding: '0.75rem 0.75rem',
                color: 'var(--primary)', fontWeight: 800,
                background: 'rgba(37,99,235,0.06)',
                borderBottom: '2px solid var(--border-color)',
              }}>
                TOTAL {year}
              </th>
              {showYoY && (
                <th style={{ textAlign: 'right', minWidth: 80, padding: '0.75rem 0.5rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.02)', borderBottom: '2px solid var(--border-color)' }}>
                  Δ vs {compareYear}
                </th>
              )}
              {showRatios && (
                <th style={{ textAlign: 'right', minWidth: 72, padding: '0.75rem 0.5rem', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.02)', borderBottom: '2px solid var(--border-color)' }}>
                  % Ing.
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {/* INGRESOS */}
            <SectionHeader label="Ingresos Operativos" color="#059669" colSpan={colSpanTotal} />
            {renderTree('ingreso')}
            <SectionTotal label="Total Ingresos" tipo="ingreso" color="#059669" bg="rgba(5,150,105,0.08)" />

            {/* COSTOS */}
            <SectionHeader label="Costo de Ventas (COGS)" color="#f97316" colSpan={colSpanTotal} />
            {renderTree('costo_directo')}
            <SectionTotal label="Total COGS" tipo="costo_directo" color="#f97316" bg="rgba(249,115,22,0.07)" />

            {/* MARGEN BRUTO */}
            <SubtotalRow
              label="▶ Margen Bruto"
              colValues={mBrutoC}
              annualTotal={totalMBruto}
              prevAnnual={totalMBrutoPrev}
              baseIngresos={totalIngresos}
              color="#0369a1" bg="rgba(3,105,161,0.08)"
              showYoY={showYoY} compareYear={compareYear} showRatios={showRatios}
            />

            {/* OPEX */}
            <SectionHeader label="Gastos Operativos (SG&A)" color="#dc2626" colSpan={colSpanTotal} />
            {renderTree('gasto_operativo')}
            <SectionTotal label="Total SG&A" tipo="gasto_operativo" color="#dc2626" bg="rgba(220,38,38,0.06)" />

            {/* EBITDA */}
            <SubtotalRow
              label="▶ EBITDA"
              colValues={ebitdaC}
              annualTotal={totalEbitda}
              prevAnnual={totalEbitdaPrev}
              baseIngresos={totalIngresos}
              color="#0284c7" bg="rgba(2,132,199,0.09)"
              showYoY={showYoY} compareYear={compareYear} showRatios={showRatios}
            />

            {/* D&A */}
            <SectionHeader label="Depreciaciones & Amortizaciones" color="#7c3aed" colSpan={colSpanTotal} />
            {renderTree('depreciacion')}

            {/* FINANCIERO */}
            <SectionHeader label="Resultado Financiero" color="#3b82f6" colSpan={colSpanTotal} />
            {renderTree('gasto_financiero')}

            {/* EBT */}
            <SubtotalRow
              label="▶ EBT (antes de impuestos)"
              colValues={ebtC}
              annualTotal={annual(ebtC)}
              prevAnnual={annual(ebtP)}
              baseIngresos={totalIngresos}
              color="#374151" bg="rgba(55,65,81,0.07)"
              showYoY={showYoY} compareYear={compareYear} showRatios={showRatios}
            />

            {/* IMPUESTOS */}
            <SectionHeader label="Impuestos" color="#6b7280" colSpan={colSpanTotal} />
            {renderTree('impuesto')}

            {/* RESULTADO NETO ── la línea más importante */}
            <SubtotalRow
              label="★  RESULTADO NETO"
              colValues={netoC}
              annualTotal={totalNeto}
              prevAnnual={totalNetoPrev}
              baseIngresos={totalIngresos}
              color="var(--primary)" bg="rgba(37,99,235,0.09)"
              showYoY={showYoY} compareYear={compareYear} showRatios={showRatios}
            />
          </tbody>
        </table>
      </div>
    </div>
  );
}
