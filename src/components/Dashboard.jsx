import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  TrendingUp, TrendingDown, Wallet, Activity, AlertTriangle, Info,
  BarChart3, ArrowUpRight, ArrowDownRight, Target, DollarSign,
  Calendar, Building2, Zap, Shield
} from 'lucide-react';

// ── tiny helpers ─────────────────────────────────────────────────────────────
const fmt  = (n, d = 0) => Math.abs(n).toLocaleString('es-AR', { maximumFractionDigits: d });
const fmtK = (n) => Math.abs(n) >= 1000 ? (Math.abs(n)/1000).toFixed(1)+'k' : fmt(n);
const pct  = (n, b) => b ? ((n/b)*100).toFixed(1)+'%' : '—';
const MONTHS = ['01','02','03','04','05','06','07','08','09','10','11','12'];
const MONTH_LABELS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// ── SVG mini bar chart ────────────────────────────────────────────────────────
function BarMini({ data, color = '#2563EB', height = 48 }) {
  const max = Math.max(...data.map(Math.abs), 1);
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${data.length * 12} ${height}`} preserveAspectRatio="none">
      {data.map((v, i) => {
        const h = Math.max(2, (Math.abs(v) / max) * (height - 4));
        const c = v < 0 ? '#dc2626' : color;
        return (
          <rect
            key={i}
            x={i * 12 + 1}
            y={height - h - 2}
            width={10}
            height={h}
            rx={2}
            fill={c}
            opacity={i === data.length - 1 ? 1 : 0.45}
          />
        );
      })}
    </svg>
  );
}

// ── SVG stacked bar chart (Budget vs Real por mes) ────────────────────────────
function BudgetVsRealChart({ months, realData, budgetData, label, color }) {
  const max = Math.max(...months.map((_, i) => Math.max(realData[i] || 0, budgetData[i] || 0)), 1);
  const H = 120, BAR_W = 14, GAP = 6, TOTAL_W = months.length * (BAR_W * 2 + GAP + 4);

  return (
    <svg width="100%" height={H + 20} viewBox={`0 0 ${TOTAL_W} ${H + 20}`} style={{ overflow: 'visible' }}>
      {months.map((m, i) => {
        const x = i * (BAR_W * 2 + GAP + 4);
        const rh = Math.max(2, ((realData[i] || 0) / max) * H);
        const bh = Math.max(2, ((budgetData[i] || 0) / max) * H);
        return (
          <g key={m}>
            {/* Budget bar (ghost) */}
            <rect x={x} y={H - bh} width={BAR_W} height={bh} rx={2} fill={color} opacity={0.15} />
            {/* Real bar */}
            <rect x={x + BAR_W + 2} y={H - rh} width={BAR_W} height={rh} rx={2} fill={color} opacity={0.85} />
            {/* Month label */}
            <text x={x + BAR_W} y={H + 14} textAnchor="middle" fontSize={8} fill="#9CA3AF">{m}</text>
          </g>
        );
      })}
    </svg>
  );
}

// ── SVG donut chart ───────────────────────────────────────────────────────────
function DonutChart({ segments, size = 100 }) {
  const total = segments.reduce((s, g) => s + g.value, 0);
  if (!total) return <div style={{ height: size, display:'flex', alignItems:'center', justifyContent:'center', color:'#9CA3AF', fontSize:12 }}>Sin datos</div>;
  let cumulative = 0;
  const r = 38, cx = size / 2, cy = size / 2;
  const slices = segments.map(seg => {
    const ratio = seg.value / total;
    const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    cumulative += ratio;
    const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const large = ratio > 0.5 ? 1 : 0;
    return { path: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`, ...seg };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} stroke="white" strokeWidth={1.5} />)}
      <circle cx={cx} cy={cy} r={24} fill="white" />
    </svg>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, delta, deltaPositive, color, icon: Icon, sparkData }) {
  return (
    <div className="data-card" style={{
      padding: '1.25rem', borderLeft: `4px solid ${color}`,
      boxShadow: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF' }}>{label}</div>
        {Icon && <Icon size={16} color={color} opacity={0.7} />}
      </div>
      <div style={{ fontSize: '1.6rem', fontWeight: 900, color, letterSpacing: '-0.03em', lineHeight: 1 }}>
        {typeof value === 'string' ? value : `$${fmtK(value)}`}
      </div>
      {sub && <div style={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: 500 }}>{sub}</div>}
      {delta !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 700, color: deltaPositive ? '#059669' : '#dc2626' }}>
          {deltaPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {delta}
        </div>
      )}
      {sparkData && sparkData.length > 0 && (
        <div style={{ marginTop: '0.25rem' }}>
          <BarMini data={sparkData} color={color} />
        </div>
      )}
    </div>
  );
}

// ── Gauge / progress bar ──────────────────────────────────────────────────────
function ProgressGauge({ label, real, budget, color, invert = false }) {
  const ratio = budget > 0 ? Math.min(1, real / budget) : 0;
  const isGood = invert ? ratio <= 1 : ratio >= 0.6;
  const barColor = ratio > 1.05 ? (invert ? '#dc2626' : '#059669') : ratio > 0.7 ? color : '#f97316';

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.4rem' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151' }}>{label}</span>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: barColor }}>${fmtK(real)}</span>
          <span style={{ fontSize: '0.7rem', color: '#9CA3AF', marginLeft: '0.3rem' }}>/ ${fmtK(budget)} presup.</span>
        </div>
      </div>
      <div style={{ position: 'relative', background: '#F3F4F6', height: 10, borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(100, ratio * 100)}%`, background: barColor, borderRadius: 6, transition: 'width 0.6s ease' }} />
        {/* Budget marker */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: 2, height: '100%', background: '#E5E7EB', zIndex: 1 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
        <span style={{ fontSize: '0.65rem', color: barColor, fontWeight: 700 }}>{(ratio * 100).toFixed(0)}% ejecutado</span>
        <span style={{ fontSize: '0.65rem', color: '#9CA3AF' }}>restante: ${fmtK(Math.max(0, budget - real))}</span>
      </div>
    </div>
  );
}

// ── Monthly P&L detail table ──────────────────────────────────────────────────
function PnLMonthly({ realData, budgetData, months }) {
  const rows = months.map((m, i) => {
    const real = realData[i] || 0;
    const budg = budgetData[i] || 0;
    const diff = real - budg;
    const diffPct = budg ? ((diff / budg) * 100) : 0;
    return { m, real, budg, diff, diffPct };
  });

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
        <thead>
          <tr style={{ background: '#F9FAFB' }}>
            <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: 700, color: '#6B7280', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Mes</th>
            <th style={{ textAlign: 'right', padding: '0.5rem 0.75rem', fontWeight: 700, color: '#2563EB', fontSize: '0.65rem', textTransform: 'uppercase' }}>Presupuesto</th>
            <th style={{ textAlign: 'right', padding: '0.5rem 0.75rem', fontWeight: 700, color: '#059669', fontSize: '0.65rem', textTransform: 'uppercase' }}>Real</th>
            <th style={{ textAlign: 'right', padding: '0.5rem 0.75rem', fontWeight: 700, color: '#374151', fontSize: '0.65rem', textTransform: 'uppercase' }}>Desvío</th>
            <th style={{ textAlign: 'right', padding: '0.5rem 0.75rem', fontWeight: 700, color: '#374151', fontSize: '0.65rem', textTransform: 'uppercase' }}>%</th>
            <th style={{ padding: '0.5rem 0.75rem', fontSize: '0.65rem', textTransform: 'uppercase', color: '#6B7280' }}>Ejecución</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ m, real, budg, diff, diffPct }, i) => {
            const hasTx = real > 0 || budg > 0;
            const ratio = budg ? Math.min(1, real / budg) : 0;
            return (
              <tr key={m} style={{ background: i % 2 === 0 ? 'white' : '#FAFAFA', opacity: hasTx ? 1 : 0.45 }}>
                <td style={{ padding: '0.45rem 0.75rem', fontWeight: 600, color: '#111827' }}>{m}</td>
                <td style={{ textAlign: 'right', padding: '0.45rem 0.75rem', fontVariantNumeric: 'tabular-nums', color: '#2563EB', fontWeight: budg > 0 ? 600 : 400 }}>
                  {budg > 0 ? `$${fmtK(budg)}` : '—'}
                </td>
                <td style={{ textAlign: 'right', padding: '0.45rem 0.75rem', fontVariantNumeric: 'tabular-nums', color: '#111827', fontWeight: real > 0 ? 700 : 400 }}>
                  {real > 0 ? `$${fmtK(real)}` : '—'}
                </td>
                <td style={{ textAlign: 'right', padding: '0.45rem 0.75rem', fontWeight: 700, color: diff >= 0 ? '#059669' : '#dc2626' }}>
                  {hasTx ? (diff >= 0 ? '+' : '') + `$${fmtK(diff)}` : '—'}
                </td>
                <td style={{ textAlign: 'right', padding: '0.45rem 0.75rem', fontSize: '0.72rem', fontWeight: 700, color: diffPct >= 0 ? '#059669' : '#dc2626' }}>
                  {hasTx ? (diffPct >= 0 ? '+' : '') + diffPct.toFixed(1) + '%' : '—'}
                </td>
                <td style={{ padding: '0.45rem 0.75rem' }}>
                  <div style={{ background: '#F3F4F6', height: 6, borderRadius: 3, overflow: 'hidden', width: 80 }}>
                    <div style={{ height: '100%', width: `${ratio * 100}%`, background: ratio > 1 ? '#059669' : ratio > 0.7 ? '#2563EB' : '#f97316', borderRadius: 3 }} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Dashboard component ──────────────────────────────────────────────────
export default function Dashboard({ convertToUSD }) {
  const txs          = useSelector(s => s.transactions.items);
  const bankAccounts = useSelector(s => s.bankAccounts.items);
  const budget       = useSelector(s => s.budget.items);
  const accounts     = useSelector(s => s.accounts.items);
  const { currentCompanyId, isHoldingView, companies } = useSelector(s => s.company);

  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [pnlSection, setPnlSection] = useState('ingresos'); // 'ingresos' | 'egresos' | 'neto'

  const today = new Date();
  const currentMonth = String(today.getMonth() + 1).padStart(2, '0');

  // Filter active bank accounts & transactions
  const activeBanks = useMemo(() =>
    isHoldingView ? bankAccounts : bankAccounts.filter(b => b.company_id === currentCompanyId),
    [bankAccounts, currentCompanyId, isHoldingView]
  );
  const activeTxs = useMemo(() =>
    isHoldingView ? txs : txs.filter(t => t.company_id === currentCompanyId),
    [txs, currentCompanyId, isHoldingView]
  );
  const yearTxs = useMemo(() =>
    activeTxs.filter(t => t.fecha_factura?.startsWith(year)),
    [activeTxs, year]
  );

  // ── Cash position ──
  const cashUSD = useMemo(() => {
    const base = activeBanks.reduce((s, b) => s + convertToUSD(b.saldo_inicial || 0, b.moneda, `${year}-03`), 0);
    const flow = yearTxs.reduce((s, t) => {
      const a = convertToUSD(t.monto, t.moneda, t.fecha_factura, t.tipo_cambio);
      return t.tipo === 'ingreso' ? s + a : s - a;
    }, 0);
    return base + flow;
  }, [activeBanks, yearTxs, convertToUSD, year]);

  // ── Monthly aggregates ──
  const monthlyData = useMemo(() => {
    const ing = MONTHS.map(m => yearTxs.filter(t => t.tipo === 'ingreso' && t.fecha_factura?.substring(5, 7) === m).reduce((s, t) => s + convertToUSD(t.monto, t.moneda, t.fecha_factura, t.tipo_cambio), 0));
    const egr = MONTHS.map(m => yearTxs.filter(t => (t.tipo === 'egreso' || t.tipo === 'gasto') && t.fecha_factura?.substring(5, 7) === m).reduce((s, t) => s + convertToUSD(t.monto, t.moneda, t.fecha_factura, t.tipo_cambio), 0));
    const neto = MONTHS.map((_, i) => ing[i] - egr[i]);
    return { ing, egr, neto };
  }, [yearTxs, convertToUSD]);

  // ── Annual totals ──
  const totalIng  = monthlyData.ing.reduce((s, v) => s + v, 0);
  const totalEgr  = monthlyData.egr.reduce((s, v) => s + v, 0);
  const totalNeto = totalIng - totalEgr;
  const margenBruto = totalIng > 0 ? ((totalNeto / totalIng) * 100).toFixed(1) : '0.0';

  // ── Budget aggregation ──
  const getBudgetBySection = (tipos) => {
    const byMonth = MONTHS.map(() => 0);
    const coId = isHoldingView ? Object.keys(budget) : [String(currentCompanyId)];
    coId.forEach(cId => {
      if (!budget[cId]) return;
      Object.values(budget[cId]).forEach(units => {
        accounts.filter(a => tipos.includes(a.tipo)).forEach(acc => {
          if (units[acc.id]) {
            MONTHS.forEach((m, i) => {
              byMonth[i] += units[acc.id][`${year}-${m}`] || 0;
            });
          }
        });
      });
    });
    return byMonth;
  };

  const budgetIng  = getBudgetBySection(['ingreso']);
  const budgetEgr  = getBudgetBySection(['costo_directo','gasto_operativo','depreciacion','gasto_financiero','impuesto']);
  const budgetNeto = MONTHS.map((_, i) => budgetIng[i] - budgetEgr[i]);

  const totalBudgetIng  = budgetIng.reduce((s, v) => s + v, 0);
  const totalBudgetEgr  = budgetEgr.reduce((s, v) => s + v, 0);
  const totalBudgetNeto = totalBudgetIng - totalBudgetEgr;

  // ── Fallback demo budgets if none configured ──
  const hasBudget = totalBudgetIng > 0 || totalBudgetEgr > 0;
  const adjBudgetIng  = hasBudget ? budgetIng  : MONTHS.map(() => totalIng  > 0 ? totalIng  / 12 * 1.15 : 10000);
  const adjBudgetEgr  = hasBudget ? budgetEgr  : MONTHS.map(() => totalEgr  > 0 ? totalEgr  / 12 * 1.10 : 7000);
  const adjBudgetNeto = MONTHS.map((_, i) => adjBudgetIng[i] - adjBudgetEgr[i]);

  const totalAdjBudgetIng  = adjBudgetIng.reduce((s, v) => s + v, 0);
  const totalAdjBudgetEgr  = adjBudgetEgr.reduce((s, v) => s + v, 0);
  const totalAdjBudgetNeto = totalAdjBudgetIng - totalAdjBudgetEgr;

  // ── YTD month index (months with data so far) ──
  const ytdMonths = MONTHS.filter((m, i) => monthlyData.ing[i] > 0 || monthlyData.egr[i] > 0).length || 1;

  // ── Top cost accounts ──
  const costByAccount = useMemo(() => {
    const map = {};
    yearTxs.filter(t => t.tipo !== 'ingreso').forEach(t => {
      const acc = accounts.find(a => a.id === (t.subcuenta_id || t.cuenta_id));
      if (!acc) return;
      const root = accounts.find(a => a.id === acc.parent_id) || acc;
      map[root.nombre] = (map[root.nombre] || 0) + convertToUSD(t.monto, t.moneda, t.fecha_factura, t.tipo_cambio);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [yearTxs, accounts, convertToUSD]);

  const DONUT_COLORS = ['#2563EB','#7c3aed','#dc2626','#f97316','#0891b2'];

  // ── Alerts ──
  const runway = totalEgr > 0 ? (cashUSD / (totalEgr / ytdMonths)).toFixed(1) : '∞';
  const ingDesvio = totalAdjBudgetIng > 0 ? ((totalIng / totalAdjBudgetIng - 1) * 100) : 0;
  const egrDesvio = totalAdjBudgetEgr > 0 ? ((totalEgr / totalAdjBudgetEgr - 1) * 100) : 0;

  const alerts = [
    parseFloat(runway) < 6 && { level: 'danger', icon: AlertTriangle, msg: `Runway estimado: ${runway} meses con burn rate actual.` },
    ingDesvio < -10    && { level: 'warn', icon: TrendingDown, msg: `Ingresos ${Math.abs(ingDesvio).toFixed(1)}% por debajo del presupuesto YTD.` },
    egrDesvio > 10     && { level: 'danger', icon: AlertTriangle, msg: `Egresos ${egrDesvio.toFixed(1)}% por encima del presupuesto YTD.` },
    ingDesvio >= 0     && { level: 'success', icon: TrendingUp, msg: `Ingresos YTD ${ingDesvio >= 0 ? '+' : ''}${ingDesvio.toFixed(1)}% vs presupuesto. ✓` },
    totalNeto > 0      && { level: 'success', icon: TrendingUp, msg: `Margen neto positivo: ${margenBruto}% sobre ingresos.` },
  ].filter(Boolean);

  const alertColors = { danger: { bg:'#FEF2F2', border:'#FECACA', text:'#DC2626' }, warn: { bg:'#FFFBEB', border:'#FDE68A', text:'#D97706' }, success: { bg:'#F0FDF4', border:'#BBF7D0', text:'#059669' } };

  // ── Sections for P&L chart ──
  const chartSectionData = {
    ingresos: { real: monthlyData.ing, budget: adjBudgetIng, color: '#059669', label: 'Ingresos' },
    egresos:  { real: monthlyData.egr, budget: adjBudgetEgr, color: '#dc2626', label: 'Egresos'  },
    neto:     { real: monthlyData.neto, budget: adjBudgetNeto, color: '#2563EB', label: 'Resultado Neto'  },
  };
  const cs = chartSectionData[pnlSection];

  return (
    <div className="animate-fade-in">

      {/* ── Page header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontWeight: 900, fontSize: '1.625rem', letterSpacing: '-0.03em', color: 'var(--text-main)' }}>
            Dashboard CFO
          </h1>
          <p style={{ color: 'var(--text-faint)', fontSize: '0.8125rem', marginTop: '0.2rem' }}>
            {isHoldingView ? 'Vista Consolidada · Holding' : companies.find(c => c.id === currentCompanyId)?.nombre} · {year}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Año</span>
          <select className="search-input" style={{ width: 90, height: 34 }} value={year} onChange={e => setYear(e.target.value)}>
            {[2024,2025,2026,2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* ── KPI ROW ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <KpiCard label="Caja Consolidada (USD)" value={cashUSD} color="#2563EB" icon={Wallet}
          sub={`${activeBanks.length} cuentas activas`}
          delta={totalNeto >= 0 ? `+$${fmtK(totalNeto)} flujo neto` : `-$${fmtK(totalNeto)}`}
          deltaPositive={totalNeto >= 0}
        />
        <KpiCard label={`Ingresos YTD ${year}`} value={totalIng} color="#059669" icon={TrendingUp}
          sub={`Presup: $${fmtK(totalAdjBudgetIng)}`}
          delta={ingDesvio >= 0 ? `+${ingDesvio.toFixed(1)}% vs presup.` : `${ingDesvio.toFixed(1)}% vs presup.`}
          deltaPositive={ingDesvio >= 0}
          sparkData={monthlyData.ing}
        />
        <KpiCard label={`Egresos YTD ${year}`} value={totalEgr} color="#dc2626" icon={TrendingDown}
          sub={`Presup: $${fmtK(totalAdjBudgetEgr)}`}
          delta={egrDesvio <= 0 ? `${egrDesvio.toFixed(1)}% vs presup.` : `+${egrDesvio.toFixed(1)}% vs presup.`}
          deltaPositive={egrDesvio <= 0}
          sparkData={monthlyData.egr}
        />
        <KpiCard label="Resultado Neto YTD" value={Math.abs(totalNeto)} color={totalNeto >= 0 ? '#0284c7' : '#dc2626'} icon={Activity}
          sub={`Margen: ${margenBruto}% sobre ingresos`}
          delta={`Runway: ${runway} meses`}
          deltaPositive={parseFloat(runway) >= 6}
          sparkData={monthlyData.neto}
        />
        <KpiCard label="Margen vs Presup. Neto" value={`${totalAdjBudgetNeto > 0 ? ((totalNeto / totalAdjBudgetNeto) * 100).toFixed(1) : '—'}%`} color="#7c3aed" icon={Target}
          sub={`Meta: $${fmtK(totalAdjBudgetNeto)}`}
          delta={totalNeto >= totalAdjBudgetNeto ? 'Meta superada ✓' : `Faltan $${fmtK(totalAdjBudgetNeto - totalNeto)}`}
          deltaPositive={totalNeto >= totalAdjBudgetNeto}
        />
      </div>

      {/* ── ROW 2: P&L Chart + Alertas ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.25rem', marginBottom: '1.25rem' }}>

        {/* P&L Real vs Presupuesto — barchart */}
        <div className="data-card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>P&L Real vs Presupuesto · {year}</div>
              <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: 2 }}>Barras transparentes = presupuesto · barras sólidas = real</div>
            </div>
            <div className="view-toggle">
              {Object.entries(chartSectionData).map(([k, v]) => (
                <button key={k} className={`btn ${pnlSection === k ? 'active-primary' : ''}`} onClick={() => setPnlSection(k)}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>
          <BudgetVsRealChart
            months={MONTH_LABELS}
            realData={cs.real}
            budgetData={cs.budget}
            color={cs.color}
          />
          {/* Legend + totals */}
          <div style={{ display: 'flex', gap: '2rem', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #F3F4F6' }}>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Real</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: cs.color }}>${fmtK(cs.real.reduce((s,v)=>s+v,0))}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Presupuesto</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#D1D5DB' }}>${fmtK(cs.budget.reduce((s,v)=>s+v,0))}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Desvío</div>
              {(() => {
                const r = cs.real.reduce((s,v)=>s+v,0);
                const b = cs.budget.reduce((s,v)=>s+v,0);
                const d = r - b;
                const good = pnlSection === 'egresos' ? d <= 0 : d >= 0;
                return <div style={{ fontSize: '1.1rem', fontWeight: 900, color: good ? '#059669' : '#dc2626' }}>{d >= 0 ? '+' : ''}${fmtK(d)}</div>;
              })()}
            </div>
          </div>
        </div>

        {/* Alertas CFO */}
        <div className="data-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={16} color="#2563EB" /> Alertas & Señales CFO
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {alerts.slice(0, 5).map((alert, i) => {
              const c = alertColors[alert.level];
              const Icon = alert.icon;
              return (
                <div key={i} style={{ display: 'flex', gap: '0.6rem', padding: '0.6rem 0.75rem', background: c.bg, border: `1px solid ${c.border}`, borderRadius: 8, fontSize: '0.75rem' }}>
                  <Icon size={14} color={c.text} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ color: '#374151', lineHeight: 1.4 }}>{alert.msg}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── ROW 3: Ejecución Presupuestaria detallada ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

        <div className="data-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Target size={16} color="#059669" /> Ejecución vs Presupuesto
          </div>
          <ProgressGauge label="Ingresos" real={totalIng}  budget={totalAdjBudgetIng}  color="#059669" />
          <ProgressGauge label="Costo de Ventas (COGS)" real={monthlyData.egr.slice(0,6).reduce((s,v)=>s+v,0)} budget={adjBudgetEgr.slice(0,6).reduce((s,v)=>s+v,0)} color="#f97316" invert />
          <ProgressGauge label="Gastos Operativos (SG&A)" real={totalEgr} budget={totalAdjBudgetEgr} color="#dc2626" invert />
          <ProgressGauge label="Resultado Neto" real={Math.max(0, totalNeto)} budget={Math.max(1, totalAdjBudgetNeto)} color="#2563EB" />
        </div>

        {/* Distribución de costos */}
        <div className="data-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={16} color="#dc2626" /> Top Costos por Categoría
          </div>
          {costByAccount.length > 0 ? (
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <DonutChart size={110} segments={costByAccount.map(([name, val], i) => ({ value: val, color: DONUT_COLORS[i % DONUT_COLORS.length] }))} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {costByAccount.map(([name, val], i) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: DONUT_COLORS[i % DONUT_COLORS.length], flexShrink: 0 }} />
                    <span style={{ flex: 1, color: '#374151', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                    <span style={{ fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>${fmtK(val)}</span>
                    <span style={{ color: '#9CA3AF', fontSize: '0.68rem', minWidth: 36, textAlign: 'right' }}>
                      {pct(val, totalEgr)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '2rem', fontSize: '0.8rem' }}>
              Sin datos de egresos para {year}
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 4: P&L mensual detallado + Liquidez por caja ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.25rem', marginBottom: '1.25rem' }}>

        {/* Detalle mensual ingresos */}
        <div className="data-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={16} color="#2563EB" /> Ingresos Mensuales: Real vs Presupuesto
          </div>
          <PnLMonthly
            months={MONTH_LABELS}
            realData={monthlyData.ing}
            budgetData={adjBudgetIng}
          />
        </div>

        {/* Liquidez por caja */}
        <div className="data-card" style={{ padding: '1.25rem' }}>
          <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wallet size={16} color="#0891b2" /> Liquidez por Cuenta
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {activeBanks.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '2rem', fontSize: '0.8rem' }}>Sin cuentas configuradas</div>
            ) : activeBanks.map(b => {
              const usd = convertToUSD(b.saldo_inicial || 0, b.moneda, `${year}-03`);
              const totalCash = activeBanks.reduce((s, bx) => s + convertToUSD(bx.saldo_inicial || 0, bx.moneda, `${year}-03`), 0);
              const share = totalCash > 0 ? usd / totalCash : 0;
              const typeColor = b.tipo === 'Banco' ? '#2563EB' : b.tipo === 'Virtual' ? '#7c3aed' : '#059669';
              return (
                <div key={b.id} style={{ padding: '0.75rem', background: '#F9FAFB', borderRadius: 8, border: '1px solid #F3F4F6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#111827' }}>{b.nombre}</div>
                      <div style={{ fontSize: '0.65rem', color: '#9CA3AF', marginTop: 1 }}>
                        <span style={{ background: typeColor + '18', color: typeColor, padding: '1px 5px', borderRadius: 3, fontWeight: 700, marginRight: 4 }}>{b.tipo}</span>
                        {b.moneda}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color: typeColor }}>≈ ${fmtK(usd)}</div>
                      <div style={{ fontSize: '0.65rem', color: '#9CA3AF' }}>{b.saldo_inicial?.toLocaleString()} {b.moneda}</div>
                    </div>
                  </div>
                  <div style={{ background: '#E5E7EB', height: 4, borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${share * 100}%`, background: typeColor, borderRadius: 2 }} />
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.6rem', color: '#9CA3AF', marginTop: 2 }}>
                    {(share * 100).toFixed(1)}% del total de caja
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── ROW 5: Egresos mensuales table ── */}
      <div className="data-card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <TrendingDown size={16} color="#dc2626" /> Egresos Mensuales: Real vs Presupuesto
        </div>
        <PnLMonthly
          months={MONTH_LABELS}
          realData={monthlyData.egr}
          budgetData={adjBudgetEgr}
        />
      </div>

      {/* ── ROW 6: Ratios Financieros ── */}
      <div className="data-card" style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
        <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Activity size={16} color="#7c3aed" /> Ratios Financieros Clave · {year}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          {[
            {
              label: 'Margen Neto',
              value: totalIng > 0 ? ((totalNeto / totalIng) * 100).toFixed(1) + '%' : '—',
              desc: 'Resultado Neto / Ingresos',
              color: totalNeto > 0 ? '#059669' : '#dc2626',
              good: totalNeto > 0,
              benchmark: '> 10% saludable'
            },
            {
              label: 'Margen Bruto',
              value: totalIng > 0 ? (((totalIng - monthlyData.egr.reduce((s,v)=>s+v,0)) / totalIng) * 100).toFixed(1) + '%' : '—',
              desc: '(Ingresos - COGS) / Ingresos',
              color: '#0284c7',
              good: true,
              benchmark: '> 40% objetivo'
            },
            {
              label: 'Eficiencia Opex',
              value: totalIng > 0 ? ((totalEgr / totalIng) * 100).toFixed(1) + '%' : '—',
              desc: 'Total Egresos / Ingresos',
              color: totalEgr / Math.max(totalIng, 1) < 0.8 ? '#059669' : '#dc2626',
              good: totalEgr / Math.max(totalIng, 1) < 0.8,
              benchmark: '< 80% eficiente'
            },
            {
              label: 'Ejecución Ingresos',
              value: totalAdjBudgetIng > 0 ? ((totalIng / totalAdjBudgetIng) * 100).toFixed(1) + '%' : '—',
              desc: 'Real vs Presupuesto YTD',
              color: totalIng >= totalAdjBudgetIng ? '#059669' : '#f97316',
              good: totalIng >= totalAdjBudgetIng,
              benchmark: '≥ 100% ideal'
            },
            {
              label: 'Control de Costos',
              value: totalAdjBudgetEgr > 0 ? ((totalEgr / totalAdjBudgetEgr) * 100).toFixed(1) + '%' : '—',
              desc: 'Egresos Reales vs Presup.',
              color: totalEgr <= totalAdjBudgetEgr ? '#059669' : '#dc2626',
              good: totalEgr <= totalAdjBudgetEgr,
              benchmark: '< 100% controlado'
            },
            {
              label: 'Runway',
              value: runway + ' m',
              desc: 'Caja / Burn rate mensual',
              color: parseFloat(runway) >= 12 ? '#059669' : parseFloat(runway) >= 6 ? '#f97316' : '#dc2626',
              good: parseFloat(runway) >= 6,
              benchmark: '> 12 m óptimo'
            },
          ].map(({ label, value, desc, color, good, benchmark }) => (
            <div key={label} style={{ padding: '1rem', background: '#FAFAFA', borderRadius: 10, border: '1px solid #F3F4F6', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: color, borderRadius: '10px 0 0 10px' }} />
              <div style={{ paddingLeft: '0.5rem' }}>
                <div style={{ fontSize: '0.63rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', marginBottom: '0.4rem' }}>{label}</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: '0.3rem' }}>{value}</div>
                <div style={{ fontSize: '0.68rem', color: '#6B7280', marginBottom: '0.3rem' }}>{desc}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.65rem', fontWeight: 700, color: good ? '#059669' : '#f97316' }}>
                  {good ? '✓' : '⚠'} {benchmark}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── ROW 7: Últimas transacciones ── */}
      <div className="data-card" style={{ padding: '1.25rem' }}>
        <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={16} color="#374151" /> Últimas Transacciones Registradas
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: 700, color: '#6B7280', fontSize: '0.63rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fecha</th>
                <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: 700, color: '#6B7280', fontSize: '0.63rem', textTransform: 'uppercase' }}>Descripción</th>
                <th style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontWeight: 700, color: '#6B7280', fontSize: '0.63rem', textTransform: 'uppercase' }}>Cuenta</th>
                <th style={{ textAlign: 'right', padding: '0.5rem 0.75rem', fontWeight: 700, color: '#6B7280', fontSize: '0.63rem', textTransform: 'uppercase' }}>Monto</th>
                <th style={{ textAlign: 'center', padding: '0.5rem 0.75rem', fontWeight: 700, color: '#6B7280', fontSize: '0.63rem', textTransform: 'uppercase' }}>Tipo</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const sorted = [...yearTxs]
                  .sort((a, b) => (b.fecha_factura || '').localeCompare(a.fecha_factura || ''))
                  .slice(0, 10);

                if (sorted.length === 0) {
                  return (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#9CA3AF', fontStyle: 'italic' }}>
                        Sin transacciones registradas para {year}
                      </td>
                    </tr>
                  );
                }

                return sorted.map((t, i) => {
                  const acc = accounts.find(a => a.id === (t.subcuenta_id || t.cuenta_id));
                  const amtUSD = convertToUSD(t.monto, t.moneda, t.fecha_factura, t.tipo_cambio);
                  const isIng = t.tipo === 'ingreso';
                  const typeColors = { ingreso: '#059669', egreso: '#dc2626', gasto: '#dc2626', transferencia: '#2563EB' };
                  const typeColor = typeColors[t.tipo] || '#6B7280';
                  const typeBg   = { ingreso: '#F0FDF4', egreso: '#FEF2F2', gasto: '#FEF2F2', transferencia: '#EFF6FF' };
                  return (
                    <tr key={t.id} style={{ background: i % 2 === 0 ? 'white' : '#FAFAFA' }}>
                      <td style={{ padding: '0.5rem 0.75rem', color: '#6B7280', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                        {t.fecha_factura ? new Date(t.fecha_factura + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : '—'}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', color: '#111827', fontWeight: 500, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {t.descripcion || t.notas || acc?.nombre || '—'}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', color: '#6B7280', fontSize: '0.72rem' }}>
                        {acc?.nombre || '—'}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: isIng ? '#059669' : '#dc2626' }}>
                        {isIng ? '+' : '-'}${fmtK(amtUSD)}
                        {t.moneda !== 'USD' && (
                          <div style={{ fontSize: '0.62rem', color: '#9CA3AF', fontWeight: 400 }}>
                            {t.monto.toLocaleString()} {t.moneda}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                        <span style={{ fontSize: '0.62rem', fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: typeBg[t.tipo] || '#F3F4F6', color: typeColor }}>
                          {t.tipo?.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
