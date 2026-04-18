import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Login from './components/auth/Login';
import PnLReport from './components/PnLReport';
import Dashboard from './components/Dashboard';
import RevenueRecognition from './components/RevenueRecognition';
import { supabase } from './lib/supabaseClient';
import { setUser, logout } from './features/authSlice';
import { setCurrentCompany, toggleHoldingView, addCompany, updateCompany, deleteCompany, addBusinessUnit, updateBusinessUnit, deleteBusinessUnit } from './features/companySlice';
import { setBudgetValue } from './features/budgetSlice';
import { addClient, updateClient, deleteClient } from './features/clientsSlice';
import { 
  BarChart3, LayoutDashboard, ArrowRightLeft, Wallet, ListTree, TrendingUp,
  DollarSign, TrendingDown, Activity, Target, ArrowDownRight, AlertTriangle,
  Info, Tag, X, Search, Plus, Building2, Landmark, Briefcase, Wallet2,
  ExternalLink, ChevronDown, ChevronRight, Calendar, Filter, FileText,
  PieChart, Users, Check, Edit2, Trash2, ArrowLeftRight, ArrowUp, ArrowDown, UserCog
} from 'lucide-react';
import { updateTransactionWeek, addTransaction, updateTransaction, deleteTransaction } from './features/transactionsSlice';
import { addUser, updateUser, deleteUser } from './features/usersSlice';
import { TIPO_COLOR, TIPO_LABEL, updateAccount } from './features/accountsSlice';
import { addBankAccount, updateBankAccount, deleteBankAccount } from './features/bankAccountsSlice';
import { setProjection } from './features/projectionsSlice';
import { setRate } from './features/exchangeRatesSlice';

// ========================
// REUSABLE COMPONENTS
// ========================

function ColumnHeader({ title, sortKey, sortConfig, onSort, filterKey, filters, onFilter, activePopover, setActivePopover, isDate = false, isNumeric = false }) {
  const [localFrom, setLocalFrom] = useState(filters[filterKey]?.from || '');
  const [localTo, setLocalTo] = useState(filters[filterKey]?.to || '');
  const [localSearch, setLocalSearch] = useState(filters[filterKey] || '');

  const isSorted = sortConfig.key === sortKey;
  const isFiltered = !!filters[filterKey];

  return (
    <th style={{ position: 'relative', whiteSpace: 'nowrap', padding: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: isNumeric ? 'flex-end' : 'flex-start', padding: '0.625rem 0.875rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', flex: 1, justifyContent: isNumeric ? 'flex-end' : 'flex-start' }} onClick={() => onSort(sortKey)}>
          <span>{title}</span>
          {isSorted && (sortConfig.direction === 'asc' ? <ArrowUp size={12} color="var(--primary)" /> : <ArrowDown size={12} color="var(--primary)" />)}
        </div>
        
        <button 
          onClick={(e) => { e.stopPropagation(); setActivePopover(activePopover === filterKey ? null : filterKey); }} 
          style={{ background: 'none', border: 'none', color: isFiltered ? 'var(--primary)' : '#9ca3af', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center', borderRadius: '4px', transition: 'all 0.2s' }}
          className="hover-glow"
        >
          <Filter size={12} fill={isFiltered ? 'var(--primary)' : 'none'} style={{ opacity: isFiltered ? 1 : 0.4 }} />
        </button>
      </div>

      {activePopover === filterKey && (
        <div className="data-card animate-fade-in" style={{ position: 'absolute', top: '100%', left: isNumeric ? 'auto' : 0, right: isNumeric ? 0 : 'auto', zIndex: 1000, minWidth: '220px', padding: '1rem', boxShadow: 'var(--shadow-lg)', marginTop: '0.25rem', border: '1px solid var(--border-color)', background: '#fff', borderRadius: '8px' }}>
           <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '0.85rem', color: 'var(--text-muted)', fontWeight: 800 }}>Filtro: {title}</h4>
           
           {isDate ? (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.65rem', marginBottom: '0.25rem' }}>DESDE</label>
                  <input type="date" className="search-input" value={localFrom} onChange={e => setLocalFrom(e.target.value)} style={{ fontSize: '0.8rem', width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.65rem', marginBottom: '0.25rem' }}>HASTA</label>
                  <input type="date" className="search-input" value={localTo} onChange={e => setLocalTo(e.target.value)} style={{ fontSize: '0.8rem', width: '100%' }} />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                   <button className="btn btn-primary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem' }} onClick={() => { onFilter(filterKey, {from: localFrom, to: localTo}); setActivePopover(null); }}>APLICAR</button>
                   <button className="btn btn-ghost" style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem' }} onClick={() => { setLocalFrom(''); setLocalTo(''); onFilter(filterKey, null); setActivePopover(null); }}>LIMPIAR</button>
                </div>
             </div>
           ) : (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input type="text" className="search-input" value={localSearch} onChange={e => setLocalSearch(e.target.value)} style={{ fontSize: '0.85rem', width: '100%', background: 'var(--bg-base)' }} placeholder="Buscar coincidencia..." autoFocus onKeyDown={e => e.key === 'Enter' && onFilter(filterKey, localSearch)} />
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                   <button className="btn btn-primary" style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem' }} onClick={() => { onFilter(filterKey, localSearch); setActivePopover(null); }}>APLICAR</button>
                   <button className="btn btn-ghost" style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem' }} onClick={() => { setLocalSearch(''); onFilter(filterKey, null); setActivePopover(null); }}>LIMPIAR</button>
                </div>
             </div>
           )}
        </div>
      )}
    </th>
  )
}


function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="card-title">{title}</h3>
          <button className="modal-close" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

function AccountSelector({ accounts, onSelect, currentAccountId }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredAccounts = useMemo(() => {
    if (!searchTerm) return accounts;
    return accounts.filter(a => 
      a.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.codigo.includes(searchTerm)
    );
  }, [accounts, searchTerm]);

  const tree = useMemo(() => {
    const map = {};
    const roots = [];
    accounts.forEach(a => map[a.id] = { ...a, children: [] });
    accounts.forEach(a => {
      if (a.parent_id) map[a.parent_id]?.children.push(map[a.id]);
      else roots.push(map[a.id]);
    });
    return roots;
  }, [accounts]);

  const renderNode = (node, depth = 0) => {
    const isLeaf = node.children.length === 0;
    const isSelected = node.id === currentAccountId;

    return (
      <div key={node.id}>
        <div 
          className={`account-node ${isSelected ? 'active' : ''} ${!isLeaf ? 'parent' : 'leaf'}`}
          style={{ paddingLeft: `${depth * 1}rem`, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.75rem', cursor: isLeaf ? 'pointer' : 'default', borderRadius: '4px', fontSize: '0.8rem' }}
          onClick={() => isLeaf && onSelect(node)}
        >
          <span style={{ color: 'var(--text-faint)', fontSize: '0.7rem', width: '3rem' }}>{node.codigo}</span>
          <span style={{ fontWeight: isLeaf ? 400 : 700 }}>{node.nombre}</span>
          {!isLeaf && <ChevronDown size={12} style={{ marginLeft: 'auto', opacity: 0.3 }} />}
        </div>
        {!searchTerm && node.children.map(child => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="account-selector-dropdown animate-fade-in" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: 'var(--shadow-lg)', zIndex: 100, marginTop: '4px' }}>
      <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <Search size={14} color="var(--text-faint)" />
        <input 
          type="text" 
          placeholder="Buscar cuenta P&L..." 
          autoFocus 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.85rem', width: '100%' }}
        />
      </div>
      <div style={{ maxHeight: '250px', overflowY: 'auto', padding: '0.5rem' }}>
        {searchTerm 
          ? filteredAccounts.map(a => renderNode(a, 0))
          : tree.map(root => renderNode(root, 0))
        }
      </div>
    </div>
  );
}

function DrillDownModal({ isOpen, onClose, transactions, week, accountName, type, onEdit }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Desglose: ${accountName} (SM ${week})`}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '1.25rem' }}>Listado de transacciones que componen este saldo. Puedes editar una transacción haciendo clic en el botón.</p>
      <div className="data-card overflow-x-auto" style={{ padding: 0 }}>
        <table className="grid-table" style={{ fontSize: '0.8125rem' }}>
          <thead>
            <tr>
              <th>Fecha Pago</th>
              <th>Descripción</th>
              <th style={{ textAlign: 'right' }}>Monto</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(tx => (
              <tr key={tx.id}>
                <td className="numeric">{tx.fecha_pago}</td>
                <td>{tx.descripcion}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }} className="numeric">${(tx.monto || 0).toLocaleString()}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => onEdit(tx)}>Editar</button>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-faint)' }}>Sin registros para esta semana.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

// ========================
// CORE COMPONENTS
// ========================

function CompanyManagement() {
  const companies = useSelector(state => state.company.companies);
  const businessUnits = useSelector(state => state.company.businessUnits);
  const dispatch = useDispatch();

  // Company management states
  const [isAddingCompany, setIsAddingCompany] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [companyForm, setCompanyForm] = useState({ nombre: '', base_currency: 'ARS' });

  // Unit management states
  const [isAddingUnit, setIsAddingUnit] = useState(false);
  const [editingUnit, setEditingUnit] = useState(null);
  const [unitForm, setUnitForm] = useState({ nombre: '', company_id: companies[0]?.id || '' });

  const hSubmitCompany = (e) => {
    e.preventDefault();
    if (editingCompany) dispatch(updateCompany({ ...companyForm, id: editingCompany.id }));
    else dispatch(addCompany(companyForm));
    setIsAddingCompany(false);
    setEditingCompany(null);
    setCompanyForm({ nombre: '', base_currency: 'ARS' });
  };

  const hSubmitUnit = (e) => {
    e.preventDefault();
    const payload = { ...unitForm, company_id: parseInt(unitForm.company_id) };
    if (editingUnit) dispatch(updateBusinessUnit({ ...payload, id: editingUnit.id }));
    else dispatch(addBusinessUnit(payload));
    setIsAddingUnit(false);
    setEditingUnit(null);
    setUnitForm({ nombre: '', company_id: companies[0]?.id || '' });
  };

  return (
    <div className="animate-fade-in">
       {/* HEADER GENERAL */}
       <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontWeight: 800 }}>Estructura de Empresas & Unidades</h2>
          <p style={{ color: 'var(--text-faint)', fontSize: '0.85rem' }}>Defina las entidades legales y los centros de costo / unidades operativas del grupo.</p>
       </div>

       <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '2.5rem' }}>
          
          {/* COLUMNA EMPRESAS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>Entidades Legales</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>Personas jurídicas consolidadas</p>
              </div>
              <button className="btn btn-primary" onClick={() => { setEditingCompany(null); setCompanyForm({ nombre: '', base_currency: 'ARS' }); setIsAddingCompany(true); }}>+ Empresa</button>
            </div>
            
            <div className="data-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="grid-table">
                <thead><tr style={{ background: 'var(--bg-base)' }}><th>Nombre</th><th>Moneda</th><th style={{ textAlign: 'right' }}>Acciones</th></tr></thead>
                <tbody>
                  {companies.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 700 }}>{c.nombre}</td>
                      <td><span className="pnl-pill" style={{ opacity: 0.8, fontSize: '0.7rem' }}>{c.base_currency}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn" style={{ marginRight: '0.4rem', padding: '4px 8px', background: 'rgba(99,132,168,0.1)', color: 'var(--text-sub)' }} onClick={() => { setEditingCompany(c); setCompanyForm(c); setIsAddingCompany(true); }}><Edit2 size={13}/></button>
                        <button className="btn btn-danger" style={{ padding: '4px 8px', background: 'rgba(220,38,38,0.1)', color: 'var(--accent-red)' }} onClick={() => { if(window.confirm('¿Eliminar empresa?')) dispatch(deleteCompany(c.id)) }}><Trash2 size={13}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* COLUMNA UNIDADES DE NEGOCIO */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>Unidades de Negocio</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>Centros de costo y proyectos</p>
              </div>
              <button className="btn btn-primary" onClick={() => { setEditingUnit(null); setUnitForm({ nombre: '', company_id: companies[0]?.id || '' }); setIsAddingUnit(true); }}>+ Unidad</button>
            </div>

            <div className="data-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table className="grid-table">
                <thead><tr style={{ background: 'var(--bg-base)' }}><th>Nombre</th><th>Empresa</th><th style={{ textAlign: 'right' }}>Acciones</th></tr></thead>
                <tbody>
                  {businessUnits.map(u => (
                    <tr key={u.id}>
                      <td style={{ fontWeight: 700 }}>{u.nombre}</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>{companies.find(c => c.id === u.company_id)?.nombre || 'S/E'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn" style={{ marginRight: '0.4rem', padding: '4px 8px', background: 'rgba(99,132,168,0.1)', color: 'var(--text-sub)' }} onClick={() => { setEditingUnit(u); setUnitForm(u); setIsAddingUnit(true); }}><Edit2 size={13}/></button>
                        <button className="btn btn-danger" style={{ padding: '4px 8px', background: 'rgba(220,38,38,0.1)', color: 'var(--accent-red)' }} onClick={() => { if(window.confirm('¿Eliminar unidad?')) dispatch(deleteBusinessUnit(u.id)) }}><Trash2 size={13}/></button>
                      </td>
                    </tr>
                  ))}
                  {businessUnits.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-faint)' }}>Sin unidades creadas.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
       </div>

       {/* MODAL EMPRESA */}
       {isAddingCompany && (
         <Modal isOpen={isAddingCompany} onClose={() => setIsAddingCompany(false)} title={editingCompany ? 'Editar Empresa' : 'Nueva Empresa'}>
           <form onSubmit={hSubmitCompany} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
             <div>
                <label className="form-section-label">Nombre de la Entidad</label>
                <input className="search-input" value={companyForm.nombre} onChange={e=>setCompanyForm({...companyForm, nombre: e.target.value})} required autoFocus />
             </div>
             <div>
                <label className="form-section-label">Moneda Operativa Base</label>
                <select className="search-input" value={companyForm.base_currency} onChange={e=>setCompanyForm({...companyForm, base_currency: e.target.value})}>
                  <option value="ARS">ARS - Peso Argentino</option>
                  <option value="USD">USD - Dólar Estadounidense</option>
                </select>
             </div>
             <button type="submit" className="btn btn-primary" style={{ height: '50px', fontWeight: 700 }}>{editingCompany ? 'ACTUALIZAR' : 'CREAR'} EMPRESA</button>
           </form>
         </Modal>
       )}

       {/* MODAL UNIDAD */}
       {isAddingUnit && (
         <Modal isOpen={isAddingUnit} onClose={() => setIsAddingUnit(false)} title={editingUnit ? 'Editar Unidad' : 'Nueva Unidad de Negocio'}>
           <form onSubmit={hSubmitUnit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
             <div>
               <label className="form-section-label">Nombre de la Unidad / Proyecto</label>
               <input className="search-input" value={unitForm.nombre} onChange={e=>setUnitForm({...unitForm, nombre: e.target.value})} required autoFocus />
             </div>
             <div>
               <label className="form-section-label">Empresa Responsable</label>
               <select className="search-input" value={unitForm.company_id} onChange={e=>setUnitForm({...unitForm, company_id: e.target.value})} required>
                  <option value="">— Seleccionar Empresa —</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
               </select>
             </div>
             <button type="submit" className="btn btn-primary" style={{ height: '50px', fontWeight: 700 }}>{editingUnit ? 'ACTUALIZAR' : 'CREAR'} UNIDAD</button>
           </form>
         </Modal>
       )}
    </div>
  );
}

function Sidebar({ activeTab, setActiveTab, isCollapsed, setIsCollapsed, user }) {
  const dispatch = useDispatch();
  const { currentCompanyId, isHoldingView, companies } = useSelector(state => state.company);
  
  // Access control
  const userPerms = user?.permissions || { isRoot: false, allowedCompanies: [], allowedAccounts: [] };
  const allowedCompanies = userPerms.isRoot ? companies : companies.filter(c => userPerms.allowedCompanies.includes(c.id));
  const currentCompany = companies.find(c => c.id === currentCompanyId) || companies[0];

  const menuItems = [
    { id: 'dashboard',    icon: LayoutDashboard, label: 'Dashboard CFO',   section: null },
    { id: 'companies',    icon: Building2,        label: 'Empresas',        section: 'Administración', requireRoot: true },
    { id: 'users',        icon: UserCog,          label: 'Usuarios y Accesos', section: null, requireRoot: true },
    { id: 'clients',      icon: Users,            label: 'Clientes/Proveed', section: null },
    { id: 'transactions', icon: ArrowRightLeft,  label: 'Transacciones',   section: 'Operaciones' },
    { id: 'presupuesto',  icon: Target,          label: 'Presupuesto',     section: null },
    { id: 'revenue',      icon: PieChart,        label: 'Revenue Recog.',  section: null },
    { id: 'pnl',         icon: BarChart3,        label: 'Resultados',      section: 'Reportes' },
    { id: 'cashflow',    icon: Activity,         label: 'Cash Flow',       section: null },
    { id: 'ar_ap',       icon: ArrowRightLeft,   label: 'Ctas a Cobrar/Pagar', section: null },
    { id: 'cajas',       icon: Wallet,           label: 'Cuentas / Cajas', section: 'Configuración', requireRoot: true },
    { id: 'rates',       icon: TrendingUp,       label: 'TC Mensual',     section: null, requireRoot: true },
    { id: 'accounts',   icon: ListTree,          label: 'Plan de Cuentas', section: null, requireRoot: true },
  ];

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header" style={{ justifyContent: isCollapsed ? 'center' : 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <TrendingUp color="var(--primary)" size={24} strokeWidth={3} />
          {!isCollapsed && <span style={{ fontSize: '1rem', fontWeight: 900, letterSpacing: '-0.03em' }}>FinanceSAAS</span>}
        </div>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={{ 
            background: isCollapsed ? 'var(--bg-dark)' : 'none', 
            border: 'none', 
            color: 'var(--text-faint)', 
            cursor: 'pointer', 
            padding: '0.35rem', 
            borderRadius: '50%',
            position: isCollapsed ? 'absolute' : 'relative',
            right: isCollapsed ? '-10px' : '0',
            top: isCollapsed ? '50%' : 'auto',
            transform: isCollapsed ? 'translateY(-50%)' : 'none',
            zIndex: 100,
            boxShadow: isCollapsed ? 'var(--shadow-md)' : 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} />}
        </button>
      </div>

      {!isCollapsed && (
        <div className="company-selector-container" style={{ padding: '1rem 0.75rem', borderBottom: '1px solid var(--border-color)', margin: '0 0.5rem' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>Estructura</div>
          
          <div 
            onClick={() => dispatch(toggleHoldingView(!isHoldingView))}
            className={`nav-item ${isHoldingView ? 'active' : ''}`}
            style={{ marginBottom: '0.5rem', margin: 0, padding: '0.5rem 0.75rem' }}
          >
            <Building2 size={16} color={isHoldingView ? 'var(--primary)' : 'var(--text-muted)'} />
            <span style={{ color: isHoldingView ? 'var(--text-main)' : 'var(--text-muted)' }}>Vista Holding</span>
          </div>

          {!isHoldingView && (
            <select 
              className="search-input" 
              style={{ fontSize: '0.8rem', height: '36px', background: 'var(--bg-dark)', border: 'none' }}
              value={currentCompanyId || ''}
              onChange={(e) => dispatch(setCurrentCompany(parseInt(e.target.value)))}
            >
              {allowedCompanies.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          )}
        </div>
      )}

      <div className="nav-links">
        {menuItems.map((item, i) => {
          if (item.requireRoot && !userPerms.isRoot) return null;
          const prevItem = menuItems.slice(0, i).reverse().find(m => !m.requireRoot || userPerms.isRoot);
          const showSection = item.section && (!prevItem || prevItem.section !== item.section);
          return (
            <React.Fragment key={item.id}>
              {showSection && !isCollapsed && (
                <div style={{ padding: '1rem 0.5rem 0.4rem', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-faint)' }}>
                  {item.section}
                </div>
              )}
              <div
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
                title={isCollapsed ? item.label : ''}
                style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
              >
                <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} style={{ minWidth: '20px' }} />
                {!isCollapsed && <span>{item.label}</span>}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function _DashboardLegacy_REMOVED({ convertToUSD }) {
  const txs = useSelector(state => state.transactions.items);
  const bankAccounts = useSelector(state => state.bankAccounts.items);
  const budget = useSelector(state => state.budget.items);
  const accounts = useSelector(state => state.accounts.items);
  const { currentCompanyId, isHoldingView } = useSelector(state => state.company);

  const activeBankAccounts = useMemo(() => {
    if (isHoldingView) return bankAccounts;
    return bankAccounts.filter(b => b.company_id === currentCompanyId);
  }, [bankAccounts, currentCompanyId, isHoldingView]);

  const activeTxs = useMemo(() => {
    if (isHoldingView) return txs;
    return txs.filter(t => t.company_id === currentCompanyId);
  }, [txs, currentCompanyId, isHoldingView]);

  const totalCajaUSD = activeBankAccounts.reduce((sum, b) => sum + convertToUSD(b.saldo_inicial || 0, b.moneda, '2026-03'), 0) + 
                       activeTxs.reduce((acc, t) => {
                         const amountUSD = convertToUSD(t.monto, t.moneda, t.fecha_factura, t.tipo_cambio);
                         return t.tipo === 'ingreso' ? acc + amountUSD : acc - amountUSD;
                       }, 0);

  const totalIngresos = activeTxs.filter(t => t.tipo === 'ingreso').reduce((a, t) => a + convertToUSD(t.monto, t.moneda, t.fecha_factura, t.tipo_cambio), 0);
  const totalEgresos = activeTxs.filter(t => t.tipo === 'egreso' || t.tipo === 'gasto').reduce((a, t) => a + convertToUSD(t.monto, t.moneda, t.fecha_factura, t.tipo_cambio), 0);
  const netChange = totalIngresos - totalEgresos;

  const budgetIngresos = useMemo(() => {
     if (isHoldingView) return 800000; // Mock holding budget
     let sum = 0;
     const accountIds = accounts.filter(a => a.tipo === 'ingreso').map(a => a.id);
     if (budget[currentCompanyId]) {
         Object.values(budget[currentCompanyId]).forEach(units => {
            accountIds.forEach(accId => {
               if (units[accId]) Object.values(units[accId]).forEach(val => sum += val);
            });
         });
     }
     return sum || 120000; // Default visualization budget
  }, [budget, accounts, currentCompanyId, isHoldingView]);

  const budgetEgresos = useMemo(() => {
     if (isHoldingView) return 400000;
     let sum = 0;
     const accountIds = accounts.filter(a => ['costo_directo', 'gasto_operativo', 'depreciacion', 'gasto_financiero', 'impuesto'].includes(a.tipo)).map(a => a.id);
     if (budget[currentCompanyId]) {
         Object.values(budget[currentCompanyId]).forEach(units => {
            accountIds.forEach(accId => {
               if (units[accId]) Object.values(units[accId]).forEach(val => sum += val);
            });
         });
     }
     return sum || 85000; // Default visualization budget
  }, [budget, accounts, currentCompanyId, isHoldingView]);

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>Resumen del Negocio</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Análisis financiero consolidado y métricas clave</p>
        </div>
      </div>
      
      <div className="dashboard-grid">
        <div className="metric-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <div className="metric-title">Caja Consol. (USD) <Wallet size={14} style={{ float: 'right', opacity: 0.5 }}/></div>
          <div className="metric-value">USD { (totalCajaUSD / 1000).toFixed(1) }k</div>
          <div className="metric-change positive">Consolidado Real</div>
        </div>
        <div className="metric-card" style={{ borderLeft: '4px solid var(--accent-green)' }}>
          <div className="metric-title">Ingresos (USD) <TrendingUp size={14} style={{ float: 'right', opacity: 0.5 }}/></div>
          <div className="metric-value">USD { (totalIngresos / 1000).toFixed(1) }k</div>
          <div className="metric-change positive">Monto Devengado</div>
        </div>
        <div className="metric-card" style={{ borderLeft: '4px solid var(--accent-red)' }}>
          <div className="metric-title">Egresos (USD) <ArrowDownRight size={14} style={{ float: 'right', opacity: 0.5 }}/></div>
          <div className="metric-value">USD { (totalEgresos / 1000).toFixed(1) }k</div>
          <div className="metric-change negative">Incluye Impuestos</div>
        </div>
        <div className="metric-card" style={{ borderLeft: '4px solid var(--accent-amber)' }}>
          <div className="metric-title">Burn Rate <Activity size={14} style={{ float: 'right', opacity: 0.5 }}/></div>
          <div className="metric-value" style={{ color: netChange < 0 ? 'var(--accent-red)' : 'var(--accent-green)' }}>
            {netChange < 0 ? '-' : ''}${ (Math.abs(netChange) / 1000).toFixed(1) }k
          </div>
          <div className={`metric-change ${netChange >= 0 ? 'positive' : 'negative'}`}>
            Neto Mensual
          </div>
        </div>
      </div>

      {/* NEW: COMPARE BUDGET VS REAL */}
      <div className="data-card" style={{ marginBottom: '2rem' }}>
        <h3 className="card-title">Ejecución Presupuestaria (YTD)</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-faint)', marginBottom: '1rem' }}>Comparación del acumulado de Ingresos y Egresos reales contra el Presupuesto anual.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '1rem' }}>
           <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                 <span style={{ color: 'var(--accent-green)' }}>Ingresos Reales</span>
                 <span style={{ color: 'var(--text-main)' }}>Presupuesto</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                 <span style={{ color: 'var(--accent-green)' }}>${(totalIngresos/1000).toFixed(1)}k</span>
                 <span>${(budgetIngresos/1000).toFixed(1)}k</span>
              </div>
              <div style={{ width: '100%', background: 'rgba(5, 150, 105, 0.1)', height: 8, borderRadius: 4, position: 'relative' }}>
                 <div style={{ position: 'absolute', top: 0, left: 0, height: 8, borderRadius: 4, background: 'var(--accent-green)', width: `${Math.min(100, (totalIngresos/budgetIngresos)*100)}%` }}></div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.75rem', marginTop: '0.3rem', color: 'var(--text-muted)' }}>{((totalIngresos/budgetIngresos)*100).toFixed(1)}% de meta alcanzada</div>
           </div>

           <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: 600 }}>
                 <span style={{ color: 'var(--accent-red)' }}>Egresos Reales</span>
                 <span style={{ color: 'var(--text-main)' }}>Presupuesto Total Egresos</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                 <span style={{ color: 'var(--accent-red)' }}>${(totalEgresos/1000).toFixed(1)}k</span>
                 <span>${(budgetEgresos/1000).toFixed(1)}k</span>
              </div>
              <div style={{ width: '100%', background: 'rgba(220, 38, 38, 0.1)', height: 8, borderRadius: 4, position: 'relative' }}>
                 <div style={{ position: 'absolute', top: 0, left: 0, height: 8, borderRadius: 4, background: 'var(--accent-red)', width: `${Math.min(100, (totalEgresos/budgetEgresos)*100)}%` }}></div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.75rem', marginTop: '0.3rem', color: 'var(--text-muted)' }}>Consumido el {((totalEgresos/budgetEgresos)*100).toFixed(1)}% del presupuesto</div>
           </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="data-card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title">Forecast Semanal (USD)</h3>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>Próximas 8 semanas</div>
          </div>
          <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '4%', padding: '1rem 0', borderBottom: '1px solid var(--border-color)' }}>
            {[13, 14, 15, 16, 17, 18, 19, 20].map((w, i) => {
              const h = Math.random() * 60 + 20; 
              return (
                <div key={w} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '100%', height: `${h}%`, background: w === 13 ? 'var(--primary)' : 'rgba(99,102,241,0.2)', borderRadius: '4px 4px 0 0', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '-1.25rem', width: '100%', textAlign: 'center', fontSize: '0.6rem' }}>${(h*10).toFixed(0)}</div>
                  </div>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-faint)' }}>SM {w}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="data-card">
          <div className="card-header"><h3 className="card-title">Distribución de Gastos</h3></div>
          <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
             <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'conic-gradient(var(--primary) 0% 40%, var(--accent-amber) 40% 70%, var(--accent-red) 70% 100%)', boxShadow: '0 0 20px rgba(0,0,0,0.1)' }}></div>
             <div style={{ position: 'absolute', right: '0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem' }}><div style={{ width: 8, height: 8, background: 'var(--primary)' }}></div> Operativo</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem' }}><div style={{ width: 8, height: 8, background: 'var(--accent-amber)' }}></div> Marketing</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem' }}><div style={{ width: 8, height: 8, background: 'var(--accent-red)' }}></div> RRHH</div>
             </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
        <div className="data-card">
          <div className="card-header"><h3 className="card-title">Distribución de Liquidez por Caja</h3></div>
          <table className="grid-table">
            <thead><tr><th>Caja / Cuenta</th><th>Empresa</th><th style={{ textAlign: 'right' }}>Saldo Operativo (USD)</th></tr></thead>
            <tbody>
              {bankAccounts.map(b => (
                <tr key={b.id}>
                  <td>{b.nombre}</td>
                  <td style={{ fontSize: '0.7rem' }}>{b.empresa}</td>
                  <td className="numeric" style={{ textAlign: 'right', fontWeight: 700 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: '0.85rem' }}>≈ USD {convertToUSD(b.saldo_inicial, b.moneda, '2026-03').toLocaleString()}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-faint)' }}>{b.saldo_inicial.toLocaleString()} {b.moneda}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="data-card">
          <div className="card-header"><h3 className="card-title">Alertas CFO & Riesgos</h3></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="alert-box danger" style={{ display: 'flex', gap: '0.75rem' }}><AlertTriangle size={16}/> <div><strong>Runway Crítico:</strong> 4.2 meses estimados.</div></div>
            <div className="alert-box warn" style={{ display: 'flex', gap: '0.75rem' }}><Info size={16}/> <div><strong>Pagos SM 15:</strong> Revisar saldo Banco Galicia.</div></div>
            <div className="alert-box success" style={{ display: 'flex', gap: '0.75rem' }}><TrendingUp size={16}/> <div><strong>Ingresos:</strong> Crecimiento +12% vs mes anterior.</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function _PnLReportLegacy_REMOVED({ convertToUSD }) {
  const txs = useSelector(state => state.transactions.items);
  const accounts = useSelector(state => state.accounts.items);
  const { currentCompanyId, isHoldingView, companies } = useSelector(state => state.company);
  
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [localCompany, setLocalCompany] = useState('all');
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly' | 'quarterly'
  const [showRatios, setShowRatios] = useState(false);
  const [compareYoY, setCompareYoY] = useState(false);

  const monthsInRange = useMemo(() => Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`), [year]);
  const prevYearMonths = useMemo(() => Array.from({ length: 12 }, (_, i) => `${parseInt(year)-1}-${String(i + 1).padStart(2, '0')}`), [year]);
  const quarters = ['1', '2', '3', '4'];

  // Aggregate values by account
  const accountTotals = useMemo(() => {
    const totals = {};
    accounts.forEach(a => {
      totals[a.id] = { monthly: {} };
      monthsInRange.forEach(m => totals[a.id].monthly[m] = 0);
    });

    const filteredTxs = txs.filter(t => {
      const matchCompany = localCompany === 'all' ? true : t.company_id === parseInt(localCompany);
      const txMonth = t.fecha_factura?.substring(0, 7);
      const matchYear = txMonth?.startsWith(year) || (compareYoY && txMonth?.startsWith(parseInt(year)-1));
      return matchCompany && matchYear && t.cuenta_id !== 999;
    });

    filteredTxs.forEach(t => {
      const accId = t.subcuenta_id || t.cuenta_id;
      const txMonth = t.fecha_factura.substring(0, 7);
      if (totals[accId]) {
         if (!totals[accId].monthly[txMonth]) totals[accId].monthly[txMonth] = 0;
         const netAmount = t.monto_neto || t.monto;
         totals[accId].monthly[txMonth] += convertToUSD(netAmount, t.moneda, t.fecha_factura, t.tipo_cambio);
      }
    });

    // Quarter aggregation
    Object.keys(totals).forEach(id => {
       const m = totals[id].monthly;
       totals[id].quarterly = {
          '1': (m[`${year}-01`]||0) + (m[`${year}-02`]||0) + (m[`${year}-03`]||0),
          '2': (m[`${year}-04`]||0) + (m[`${year}-05`]||0) + (m[`${year}-06`]||0),
          '3': (m[`${year}-07`]||0) + (m[`${year}-08`]||0) + (m[`${year}-09`]||0),
          '4': (m[`${year}-10`]||0) + (m[`${year}-11`]||0) + (m[`${year}-12`]||0)
       };
       if (compareYoY) {
          const py = parseInt(year) - 1;
          totals[id].prevYear = {
            '1': (m[`${py}-01`]||0) + (m[`${py}-02`]||0) + (m[`${py}-03`]||0),
            '2': (m[`${py}-04`]||0) + (m[`${py}-05`]||0) + (m[`${py}-06`]||0),
            '3': (m[`${py}-07`]||0) + (m[`${py}-08`]||0) + (m[`${py}-09`]||0),
            '4': (m[`${py}-10`]||0) + (m[`${py}-11`]||0) + (m[`${py}-12`]||0)
          };
       }
    });

    return totals;
  }, [accounts, txs, localCompany, convertToUSD, monthsInRange, year, compareYoY]);

  const getIterables = () => viewMode === 'monthly' ? monthsInRange : quarters;

  // Helper to build tree for a specific "tipo"
  const getTreeForType = (tipo) => {
    const map = {};
    const roots = [];
    accounts.filter(a => a.tipo === tipo).forEach(a => {
      map[a.id] = { ...a, monthlyAmounts: { ...accountTotals[a.id].monthly }, quarterly: { ...accountTotals[a.id].quarterly }, prevYear: { ...accountTotals[a.id].prevYear }, children: [] };
    });

    const rollup = (node) => {
      const iterables = getIterables();
      iterables.forEach(m => {
        const childrenSum = node.children.reduce((s, c) => s + (viewMode === 'monthly' ? rollup(c).monthly[m] : rollup(c).quarter[m]), 0);
        if (viewMode === 'monthly') node.monthlyAmounts[m] += childrenSum;
        else node.quarterly[m] += childrenSum;
      });
      if (compareYoY) {
         quarters.forEach(q => {
            const childrenPrevSum = node.children.reduce((s, c) => s + rollup(c).prev[q], 0);
            node.prevYear[q] = (node.prevYear[q] || 0) + childrenPrevSum;
         });
      }
      return { monthly: node.monthlyAmounts, quarter: node.quarterly, prev: node.prevYear };
    };

    accounts.filter(a => a.tipo === tipo).forEach(a => {
      if (a.parent_id && map[a.parent_id]) {
        map[a.parent_id].children.push(map[a.id]);
      } else if (!a.parent_id && map[a.id]) {
        roots.push(map[a.id]);
      }
    });

    roots.forEach(r => rollup(r));
    return roots;
  };

  const renderAccountRow = (accData, depth = 0) => {
    const iterables = getIterables();
    let iterTotal = 0;
    iterables.forEach(m => {
       iterTotal += (viewMode === 'monthly' ? (accData.monthlyAmounts[m] || 0) : (accData.quarterly[m] || 0));
    });

    if (iterTotal === 0 && (!accData.children || accData.children.length === 0)) return null;

    return (
      <React.Fragment key={accData.id}>
        <tr>
          <td style={{ paddingLeft: `${1 + depth * 1.5}rem`, fontWeight: accData.children?.length > 0 ? 700 : 400, position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 1 }}>
            {accData.nombre}
          </td>
          {iterables.map(m => {
             const amt = viewMode === 'monthly' ? (accData.monthlyAmounts[m] || 0) : (accData.quarterly[m] || 0);
             return <td key={m} className="numeric" style={{ textAlign: 'right', color: amt === 0 ? 'transparent' : 'inherit' }}>{amt.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
          })}
          <td className="numeric" style={{ textAlign: 'right', fontWeight: 700 }}>{iterTotal === 0 ? '-' : iterTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
        </tr>
        {compareYoY && viewMode === 'quarterly' && (
          <tr style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>
             <td style={{ paddingLeft: `${1 + depth * 1.5}rem`, position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 1 }}>
               ↳ Δ vs {parseInt(year)-1} 
             </td>
             {iterables.map(m => {
                const cur = accData.quarterly[m] || 0;
                const prev = accData.prevYear?.[m] || 0;
                const diff = cur - prev;
                let pct = '-';
                if (prev !== 0) pct = ((diff / prev)*100).toFixed(0) + '%';
                return <td key={m} className="numeric" style={{ textAlign: 'right', color: cur === 0 && prev === 0 ? 'transparent' : (diff >= 0 ? 'var(--accent-green)' : 'var(--accent-red)') }}>{pct}</td>
             })}
             <td></td>
          </tr>
        )}
        {accData.children?.map(ch => renderAccountRow(ch, depth + 1))}
      </React.Fragment>
    );
  };

  const getSectionTotal = (nodes) => {
    const sectionTotals = {};
    const iterables = getIterables();
    iterables.forEach(m => sectionTotals[m] = 0);
    
    const acc = (accList) => {
      accList.forEach(n => {
        iterables.forEach(m => {
           if (viewMode === 'monthly') sectionTotals[m] += (n.monthlyAmounts[m] || 0);
           else sectionTotals[m] += (n.quarterly[m] || 0);
        });
        if (n.children && n.children.length > 0) acc(n.children);
      });
    };
    acc(nodes);
    return sectionTotals;
  };

  const calculateSubtotal = (name, positiveMap, negativeMap, color = '#111827', bg = 'rgba(0,0,0,0.05)', ratioBaseMap = null) => {
    const iterables = getIterables();
    const amounts = {};
    iterables.forEach(m => {
      amounts[m] = (positiveMap[m] || 0) - (negativeMap[m] || 0);
    });
    const totalRow = iterables.reduce((s, m) => s + amounts[m], 0);

    return (
      <React.Fragment>
        <tr style={{ background: bg, color: color, fontWeight: 800 }}>
          <td style={{ paddingLeft: '1rem', position: 'sticky', left: 0, background: bg, zIndex: 1, textTransform: 'uppercase', color: color }}>
            {name}
          </td>
          {iterables.map(m => (
            <td key={m} className="numeric" style={{ textAlign: 'right', color: color }}>{amounts[m] === 0 ? '-' : amounts[m].toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
          ))}
          <td className="numeric" style={{ textAlign: 'right', background: 'var(--bg-dark)', color: '#ffffff' }}>{totalRow === 0 ? '-' : totalRow.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
        </tr>
        {showRatios && ratioBaseMap && (
           <tr style={{ background: 'var(--bg-dark)', color: 'var(--text-faint)', fontSize: '0.75rem' }}>
              <td style={{ paddingLeft: '2rem', position: 'sticky', left: 0, background: 'var(--bg-dark)', zIndex: 1 }}>% de Ingresos</td>
              {iterables.map(m => {
                 const denom = ratioBaseMap[m];
                 return <td key={m} className="numeric" style={{ textAlign: 'right' }}>{denom ? ((amounts[m] / denom) * 100).toFixed(1) + '%' : '-'}</td>
              })}
              <td className="numeric" style={{ textAlign: 'right', fontWeight: 700 }}>
                 {Object.values(ratioBaseMap).reduce((a,b)=>a+b,0) ? ((totalRow / Object.values(ratioBaseMap).reduce((a,b)=>a+b,0)) * 100).toFixed(1) + '%' : '-'}
              </td>
           </tr>
        )}
      </React.Fragment>
    );
  };

  // Structured Trees
  const treeIngresos = getTreeForType('ingreso');
  const treeCostos = getTreeForType('costo_directo');
  const treeOpex = getTreeForType('gasto_operativo');
  const treeDepr = getTreeForType('depreciacion');
  const treeFin = getTreeForType('gasto_financiero');
  const treeTax = getTreeForType('impuesto');

  // Totals
  const tIngresos = getSectionTotal(treeIngresos);
  const tCostos = getSectionTotal(treeCostos);
  const tOpex = getSectionTotal(treeOpex);
  const tDepr = getSectionTotal(treeDepr);
  const tFin = getSectionTotal(treeFin);
  const tTax = getSectionTotal(treeTax);

  // Subtotals references
  const mBruto = {};
  const ebitda = {};
  const ebt = {};
  getIterables().forEach(m => {
     mBruto[m] = (tIngresos[m]||0) - (tCostos[m]||0);
     ebitda[m] = (mBruto[m]||0) - (tOpex[m]||0);
     ebt[m] = (ebitda[m]||0) - (tDepr[m]||0) - (tFin[m]||0);
  });

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontWeight: 800 }}>Estado de Resultados Mensual (USD)</h2>
          <p style={{ color: 'var(--text-faint)', fontSize: '0.8125rem' }}>Consolidado • Base Devengado • Plan de Cuentas Estructurado</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <div className="view-toggle">
            <button className={`btn ${viewMode === 'monthly' ? 'active-primary' : ''}`} onClick={() => setViewMode('monthly')}>Mensual</button>
            <button className={`btn ${viewMode === 'quarterly' ? 'active-primary' : ''}`} onClick={() => setViewMode('quarterly')}>Trimestral (Q)</button>
          </div>
          <div style={{ display: 'flex', gap: '1rem', borderRight: '1px solid var(--border-color)', paddingRight: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer', margin: 0 }}>
               <input type="checkbox" checked={showRatios} onChange={(e) => setShowRatios(e.target.checked)} /> Mostrar Ratios
            </label>
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-faint)' }}>EMPRESA</span>
            <select className="search-input" style={{ width: '180px', height: '36px', fontSize: '0.8rem' }} value={localCompany} onChange={e => setLocalCompany(e.target.value)}>
              <option value="all">Consolidado (Holding)</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-faint)' }}>AÑO</span>
            <select className="search-input" style={{ width: '100px', height: '36px' }} value={year} onChange={e => setYear(e.target.value)}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => window.print()}>Exportar</button>
        </div>
      </div>

      <div className="data-card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="grid-table" style={{ minWidth: '100%', fontSize: '0.8rem' }}>
          <thead>
            <tr>
              <th style={{ position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 2, minWidth: '220px' }}>Estructura P&amp;L</th>
              {getIterables().map(m => (
                 <th key={m} style={{ textAlign: 'right', minWidth: '85px' }}>
                    {viewMode === 'monthly' ? new Date(m + '-15').toLocaleDateString('es', { month: 'short' }).toUpperCase() : `Q${m}`}
                 </th>
              ))}
              <th style={{ textAlign: 'right', background: 'var(--bg-dark)', minWidth: '100px' }}>TOTAL AÑO</th>
            </tr>
          </thead>
          <tbody>
            {/* INGRESOS */}
            <tr><td colSpan={14} style={{ background: 'var(--bg-dark)', fontWeight: 800, color: 'var(--accent-green)', paddingLeft: '1rem', position: 'sticky', left: 0 }}>INGRESOS OPERATIVOS</td></tr>
            {treeIngresos.map(r => renderAccountRow(r))}
            
            {/* COSTOS DIRECTOS */}
            <tr><td colSpan={14} style={{ background: 'var(--bg-dark)', fontWeight: 800, color: '#f97316', paddingLeft: '1rem', position: 'sticky', left: 0 }}>COSTOS DIRECTOS (COGS)</td></tr>
            {treeCostos.map(r => renderAccountRow(r))}
            
            {/* MARGEN BRUTO */}
            {calculateSubtotal('=== MARGEN BRUTO ===', tIngresos, tCostos, '#1e293b', '#fff', tIngresos)}

            {/* OPEX */}
            <tr><td colSpan={14} style={{ background: 'var(--bg-dark)', fontWeight: 800, color: 'var(--accent-red)', paddingLeft: '1rem', position: 'sticky', left: 0 }}>GASTOS OPERATIVOS (SGA)</td></tr>
            {treeOpex.map(r => renderAccountRow(r))}

            {/* EBITDA */}
            {calculateSubtotal('=== EBITDA ===', mBruto, tOpex, '#0284c7', '#fff', tIngresos)}

            {/* RESULTADO FINANCIERO Y DEPRECIACIONES */}
            <tr><td colSpan={14} style={{ background: 'var(--bg-dark)', fontWeight: 800, color: '#3b82f6', paddingLeft: '1rem', position: 'sticky', left: 0 }}>RESULTADO FINANCIERO Y DEPRECIACIONES</td></tr>
            {treeDepr.map(r => renderAccountRow(r))}
            {treeFin.map(r => renderAccountRow(r))}

            {/* IMPUESTOS */}
            <tr><td colSpan={14} style={{ background: 'var(--bg-dark)', fontWeight: 800, color: '#8b5cf6', paddingLeft: '1rem', position: 'sticky', left: 0 }}>IMPUESTOS</td></tr>
            {treeTax.map(r => renderAccountRow(r))}

            {/* NET INCOME */}
            {calculateSubtotal('=== RESULTADO NETO ===', ebt, tTax, 'var(--primary)', '#fff', tIngresos)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CashFlow({ onSelectTransaction, getRate }) {
  const txs = useSelector(state => state.transactions.items);
  const accounts = useSelector(state => state.accounts.items);
  const projections = useSelector(state => state.projections.items);
  const bankAccounts = useSelector(state => state.bankAccounts.items);
  const { currentCompanyId, isHoldingView } = useSelector(state => state.company);
  const dispatch = useDispatch();

  const [viewMoneda, setViewMoneda] = useState('ARS');
  const [drillingTx, setDrillingTx] = useState({ isOpen: false, transactions: [], week: 0, accountName: '', type: '' });
  
  const currentWeek = 13; 
  const weeks = [10, 11, 12, 13, 14, 15, 16, 17];

  // Filtering Logic
  const activeBankAccounts = useMemo(() => {
    if (isHoldingView) return bankAccounts;
    return bankAccounts.filter(b => b.company_id === currentCompanyId || !b.company_id); // Fallback for legacy
  }, [bankAccounts, currentCompanyId, isHoldingView]);

  const activeTxs = useMemo(() => {
    if (isHoldingView) return txs;
    return txs.filter(t => t.company_id === currentCompanyId);
  }, [txs, currentCompanyId, isHoldingView]);

  const convert = (tx, toCurrency) => {
    if (tx.moneda === toCurrency) return tx.monto;
    const rate = tx.tipo_cambio || getRate(tx.fecha_pago);
    return tx.moneda === 'ARS' ? tx.monto / rate : tx.monto * rate;
  };

  const leafAccounts = accounts.filter(a => !accounts.some(child => child.parent_id === a.id));
  const incomeAccounts = [
    ...leafAccounts.filter(a => a.tipo === 'ingreso'),
    { id: 999, nombre: 'Transferencias IN (Traspasos)', tipo: 'ingreso' }
  ];
  const expenseAccounts = [
    ...leafAccounts.filter(a => a.tipo === 'egreso' || a.tipo === 'gasto'),
    { id: 999, nombre: 'Transferencias OUT (Traspasos)', tipo: 'egreso' }
  ];

  const getWeekStartDate = (w) => {
    const d = new Date(2026, 0, 1 + (w - 1) * 7);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  const calculateWeekData = (bankIds) => {
    const banks = activeBankAccounts.filter(b => bankIds.includes(b.id));
    let currentBalanceARS = 0;
    let currentBalanceUSD = 0;

    banks.forEach(b => {
      if (b.moneda === 'ARS') currentBalanceARS += (b.saldo_inicial || 0);
      else currentBalanceUSD += (b.saldo_inicial || 0);
    });

    // Use cash basis: filters by activeTxs (which already respects company/holding)
    activeTxs.filter(t => t.semana < weeks[0] && bankIds.includes(t.cuenta_bancaria_id)).forEach(t => {
      if (t.moneda === 'ARS') currentBalanceARS += (t.tipo === 'ingreso' ? t.monto : -t.monto);
      else currentBalanceUSD += (t.tipo === 'ingreso' ? t.monto : -t.monto);
    });

    const wData = {};
    weeks.forEach(w => {
      const weekTxs = activeTxs.filter(t => t.semana === w && bankIds.includes(t.cuenta_bancaria_id));
      
      const inARS = weekTxs.filter(t => t.tipo === 'ingreso' && t.moneda === 'ARS').reduce((s, t) => s + t.monto, 0);
      const outARS = weekTxs.filter(t => (t.tipo === 'egreso' || t.tipo === 'gasto') && t.moneda === 'ARS').reduce((s, t) => s + t.monto, 0);
      const inUSD = weekTxs.filter(t => t.tipo === 'ingreso' && t.moneda === 'USD').reduce((s, t) => s + t.monto, 0);
      const outUSD = weekTxs.filter(t => (t.tipo === 'egreso' || t.tipo === 'gasto') && t.moneda === 'USD').reduce((s, t) => s + t.monto, 0);

      const proj = projections[w] || { inflows: 0, outflows: 0 };
      const projIn = w <= currentWeek ? 0 : proj.inflows;
      const projOut = w <= currentWeek ? 0 : proj.outflows;

      const mockDate = `2026-03-15`; // TODO: use real date per week
      const rate = getRate(mockDate);
      
      const saldoIni = viewMoneda === 'ARS' ? (currentBalanceARS + currentBalanceUSD * rate) : (currentBalanceUSD + currentBalanceARS / rate);
      const inTot = viewMoneda === 'ARS' ? (inARS + inUSD * rate) : (inUSD + inARS / rate);
      const outTot = viewMoneda === 'ARS' ? (outARS + outUSD * rate) : (outUSD + outARS / rate);
      
      const pIn = projIn;
      const pOut = projOut;

      wData[w] = {
        saldoInicial: saldoIni,
        ingresos: inTot,
        egresos: outTot,
        projIn: pIn, projOut: pOut,
        saldoFinal: saldoIni + inTot - outTot + pIn - pOut
      };

      currentBalanceARS += (inARS - outARS);
      currentBalanceUSD += (inUSD - outUSD);
    });
    return wData;
  };

  const handleDrillDown = (week, accountId, type) => {
    const account = accounts.find(a => a.id === accountId);
    const filteredTxs = activeTxs.filter(t => t.semana === week && (t.subcuenta_id === accountId || t.cuenta_id === accountId) && (type === 'Ingreso' ? t.tipo === 'ingreso' : (t.tipo === 'egreso' || t.tipo === 'gasto')));
    setDrillingTx({ isOpen: true, transactions: filteredTxs, week, accountName: account?.nombre || 'Cuenta', type });
  };

  const globalWeekData = calculateWeekData(activeBankAccounts.map(b => b.id));

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontWeight: 800 }}>Tesorería & Cash Flow</h2>
          <p style={{ color: 'var(--text-faint)', fontSize: '0.8125rem' }}>Base Percibido (Cash basis) · Control de Liquidez · Payment Date Exchange</p>
        </div>
        <div className="view-toggle">
          <button className={`btn ${viewMoneda === 'ARS' ? 'active-primary' : ''}`} onClick={() => setViewMoneda('ARS')}>Ver en ARS</button>
          <button className={`btn ${viewMoneda === 'USD' ? 'active-primary' : ''}`} onClick={() => setViewMoneda('USD')}>Ver en USD</button>
        </div>
      </div>

      <div className="data-card overflow-x-auto" style={{ padding: 0 }}>
        <table className="grid-table" style={{ minWidth: '1100px' }}>
          <thead>
            <tr>
              <th style={{ position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 10 }}>Concepto / Semana</th>
              {weeks.map(w => (
                <th key={w} style={{ textAlign: 'center', background: w === currentWeek ? 'var(--bg-dark)' : 'transparent' }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-faint)', fontWeight: 600 }}>{getWeekStartDate(w)}</div>
                  SM {w}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}><td colSpan={weeks.length+1} className="projection-label">Disponibilidad Inicial por Caja</td></tr>
            {bankAccounts.map(b => {
              const bData = calculateWeekData([b.id]);
              return (
                <tr key={b.id}>
                  <td style={{ paddingLeft: '2rem', position: 'sticky', left: 0, background: 'var(--bg-card)' }}>{b.nombre}</td>
                  {weeks.map(w => <td key={w} className="numeric" style={{ textAlign: 'right', color: 'var(--text-faint)' }}>${Math.round(bData[w].saldoInicial).toLocaleString('es-AR')}</td>)}
                </tr>
              );
            })}

            <tr style={{ background: 'rgba(255,255,255,0.02)' }}><td colSpan={weeks.length+1} style={{ padding: '0.4rem 1rem' }}><strong>(+) Ingresos (Cobros Reales)</strong></td></tr>
            {incomeAccounts.map(acc => (
              <tr key={acc.id}>
                <td style={{ paddingLeft: '2rem', position: 'sticky', left: 0, background: 'var(--bg-card)' }}>{acc.nombre}</td>
                {weeks.map(w => {
                  const txList = txs.filter(t => t.semana === w && (t.subcuenta_id === acc.id || t.cuenta_id === acc.id) && t.tipo === 'ingreso');
                  const sumConvert = txList.reduce((s, t) => s + convert(t, viewMoneda), 0);
                  return (
                    <td key={w} onDoubleClick={() => handleDrillDown(w, acc.id, 'Ingreso')} className="cf-cell cf-clickable-cell">
                      {sumConvert > 0 ? <div className="tx-pill ingreso">{viewMoneda === 'USD' ? 'u$d ' : '$'}{Math.round(sumConvert).toLocaleString('es-AR')}</div> : '-'}
                    </td>
                  );
                })}
              </tr>
            ))}

            <tr style={{ background: 'rgba(255,255,255,0.02)' }}><td colSpan={weeks.length+1} style={{ padding: '0.4rem 1rem' }}><strong>(-) Egresos (Pagos Reales)</strong></td></tr>
            {expenseAccounts.map(acc => (
              <tr key={acc.id}>
                <td style={{ paddingLeft: '2rem', position: 'sticky', left: 0, background: 'var(--bg-card)' }}>{acc.nombre}</td>
                {weeks.map(w => {
                  const txList = txs.filter(t => t.semana === w && (t.subcuenta_id === acc.id || t.cuenta_id === acc.id) && (t.tipo === 'egreso' || t.tipo === 'gasto'));
                  const sumConvert = txList.reduce((s, t) => s + convert(t, viewMoneda), 0);
                  return (
                    <td key={w} onDoubleClick={() => handleDrillDown(w, acc.id, 'Egreso')} className="cf-cell cf-clickable-cell">
                      {sumConvert > 0 ? <div className="tx-pill egreso">{viewMoneda === 'USD' ? 'u$d ' : '$'}{Math.round(sumConvert).toLocaleString('es-AR')}</div> : '-'}
                    </td>
                  );
                })}
              </tr>
            ))}

            <tr style={{ background: 'rgba(255,255,255,0.02)' }}><td colSpan={weeks.length+1} className="projection-label">Proyecciones de Tesorería</td></tr>
            <tr>
              <td style={{ paddingLeft: '2rem', position: 'sticky', left: 0, background: 'var(--bg-card)' }}>(+) Future Inflows</td>
              {weeks.map(w => (
                <td key={w}><input type="number" className={`projection-input ${w <= currentWeek ? 'zeroed' : ''}`} value={w <= currentWeek ? 0 : (projections[w]?.inflows || 0)} onChange={(e) => dispatch(setProjection({ week: w, type: 'inflows', amount: parseFloat(e.target.value) || 0 }))} /></td>
              ))}
            </tr>
            <tr>
              <td style={{ paddingLeft: '2rem', position: 'sticky', left: 0, background: 'var(--bg-card)' }}>(-) Future Outflows</td>
              {weeks.map(w => (
                <td key={w}><input type="number" className={`projection-input ${w <= currentWeek ? 'zeroed' : ''}`} value={w <= currentWeek ? 0 : (projections[w]?.outflows || 0)} onChange={(e) => dispatch(setProjection({ week: w, type: 'outflows', amount: parseFloat(e.target.value) || 0 }))} /></td>
              ))}
            </tr>

            <tr style={{ background: 'rgba(255,255,255,0.02)' }}><td colSpan={weeks.length+1} className="projection-label">Liquidación Estimada por Caja</td></tr>
            {bankAccounts.map(b => {
              const bData = calculateWeekData([b.id]);
              return (
                <tr key={b.id}>
                  <td style={{ paddingLeft: '2rem', position: 'sticky', left: 0, background: 'var(--bg-card)', fontWeight: 700 }}>{b.nombre}</td>
                  {weeks.map(w => <td key={w} className="numeric" style={{ textAlign: 'right', fontWeight: 700, color: bData[w].saldoFinal >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>${Math.round(bData[w].saldoFinal).toLocaleString('es-AR')}</td>)}
                </tr>
              );
            })}
            
            <tr style={{ borderTop: '2px solid var(--primary)', background: 'var(--bg-dark)' }}>
              <td style={{ position: 'sticky', left: 0, background: 'var(--bg-dark)', fontWeight: 900 }}>TOTAL DISPONIBLE</td>
              {weeks.map(w => (
                <td key={w} className="numeric" style={{ textAlign: 'right', fontSize: '1.1rem', fontWeight: 900, color: globalWeekData[w].saldoFinal >= 0 ? 'var(--primary)' : 'var(--accent-red)' }}>
                  ${Math.round(globalWeekData[w].saldoFinal).toLocaleString('es-AR')}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <DrillDownModal 
        isOpen={drillingTx.isOpen} onClose={() => setDrillingTx({ ...drillingTx, isOpen: false })}
        transactions={drillingTx.transactions} week={drillingTx.week} accountName={drillingTx.accountName} type={drillingTx.type}
        onEdit={(tx) => { setDrillingTx({ ...drillingTx, isOpen: false }); onSelectTransaction(tx); }}
      />
    </div>
  );
}

// ========================
// CLIENT SELECTOR COMPONENT
// ========================
function ClientSelector({ value, onChange, placeholder = 'Cliente / Proveedor...' }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState(value || '');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTipo, setNewTipo] = useState('proveedor');
  const allClients = useSelector(s => s.clients.items);
  const dispatch = useDispatch();
  const ref = useRef(null);

  useEffect(() => { setQ(value || ''); }, [value]);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setCreating(false); } };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = q.trim()
    ? allClients.filter(c => c.nombre.toLowerCase().includes(q.toLowerCase()))
    : allClients.slice(0, 8);

  const pick = (c) => { onChange(c.nombre); setQ(c.nombre); setOpen(false); setCreating(false); };

  const create = () => {
    if (!newName.trim()) return;
    dispatch(addClient({ nombre: newName.trim(), tipo: newTipo, cuit: '', email: '', telefono: '' }));
    onChange(newName.trim()); setQ(newName.trim()); setOpen(false); setCreating(false); setNewName('');
  };

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <input type="text" className="search-input" value={q} placeholder={placeholder}
          onChange={e => { setQ(e.target.value); onChange(e.target.value); }}
          onFocus={() => setOpen(true)}
          style={{ paddingRight: '2rem', width: '100%' }}
        />
        <Users size={13} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none' }} />
      </div>
      {open && (
        <div className="animate-fade-in" style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, boxShadow: 'var(--shadow-lg)', zIndex: 500, maxHeight: 240, overflowY: 'auto' }}>
          {filtered.length > 0 ? filtered.map(c => (
            <div key={c.id} onClick={() => pick(c)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-dark)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontWeight: 500 }}>{c.nombre}</span>
              <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: 999, background: c.tipo === 'cliente' ? 'var(--accent-green-soft)' : 'rgba(2,132,199,0.1)', color: c.tipo === 'cliente' ? 'var(--accent-green)' : '#0284C7' }}>{c.tipo}</span>
            </div>
          )) : (
            <div style={{ padding: '0.6rem 0.75rem', color: 'var(--text-faint)', fontSize: '0.75rem' }}>Sin resultados para "{q}"</div>
          )}
          {!creating ? (
            <div onClick={() => { setCreating(true); setNewName(q); }}
              style={{ padding: '0.5rem 0.75rem', cursor: 'pointer', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.4rem', alignItems: 'center', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 700 }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-soft)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Plus size={13} /> Crear nuevo contacto
            </div>
          ) : (
            <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input autoFocus type="text" className="search-input" placeholder="Nombre..." value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && create()} style={{ fontSize: '0.8rem' }} />
              <select className="search-input" value={newTipo} onChange={e => setNewTipo(e.target.value)} style={{ fontSize: '0.8rem' }}>
                <option value="cliente">Cliente</option>
                <option value="proveedor">Proveedor</option>
              </select>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn btn-primary" style={{ flex: 1, fontSize: '0.75rem', padding: '0.3rem 0.5rem' }} onClick={create}>✓ Crear</button>
                <button type="button" className="btn" style={{ flex: 1, fontSize: '0.75rem', padding: '0.3rem 0.5rem', background: '#f3f4f6', color: '#6b7280' }} onClick={() => setCreating(false)}>Cancelar</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ========================
// QUICK ENTRY ROW
// ========================
function QuickEntryRow({ companies, bankAccounts, accounts, unidades, currentCompanyId, visibleColumns, onSave, userPerms }) {
  const today = new Date().toISOString().split('T')[0];
  const [tipo, setTipo] = useState('egreso');
  const [fecha, setFecha] = useState(today);
  const [clienteProveedor, setClienteProveedor] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [companyId, setCompanyId] = useState(currentCompanyId || companies[0]?.id || 1);
  const [unidadId, setUnidadId] = useState(unidades[0]?.id || 1);
  const [moneda, setMoneda] = useState('ARS');
  const [cajaId, setCajaId] = useState('');
  const [cuentaId, setCuentaId] = useState('');
  const [montoNeto, setMontoNeto] = useState('');
  const [iva, setIva] = useState('');
  const [tipoCambio, setTipoCambio] = useState('');

  const allowRoot = userPerms.isRoot;
  const availableBanks = bankAccounts.filter(b => 
    b.moneda === moneda && (allowRoot || userPerms.allowedAccounts.includes(b.id))
  );
  const leafAccounts = accounts.filter(a => {
    const isLeaf = !accounts.some(ch => ch.parent_id === a.id);
    if (!isLeaf) return false;
    if (tipo === 'ingreso') return a.tipo === 'ingreso';
    return a.tipo !== 'ingreso';
  });

  useEffect(() => { if (availableBanks[0]) setCajaId(availableBanks[0].id); }, [moneda]);
  useEffect(() => { setCompanyId(currentCompanyId || companies[0]?.id || 1); }, [currentCompanyId]);

  const handleSave = () => {
    if (!montoNeto || !descripcion.trim()) return;
    const monto = parseFloat(montoNeto) || 0;
    const montoIva = parseFloat(iva) || 0;
    const bank = bankAccounts.find(b => b.id === parseInt(cajaId));
    const account = accounts.find(a => a.id === parseInt(cuentaId));
    onSave({
      id: Date.now(), fecha_factura: fecha, fecha_pago: fecha,
      descripcion, cliente_proveedor: clienteProveedor, tipo, monto: monto + montoIva, monto_neto: monto, iva: montoIva, tax: 0,
      moneda, tipo_cambio: tipoCambio ? parseFloat(tipoCambio) : null, semana: 13,
      cuenta_bancaria_id: parseInt(cajaId), banco_nombre: bank?.nombre || '',
      subcuenta_id: parseInt(cuentaId) || null, cuenta_id: parseInt(cuentaId) || null,
      cuenta_contable_nombre: account?.nombre || '',
      company_id: parseInt(companyId),
      unidad_negocio_id: parseInt(unidadId),
      unidad_negocio: unidades.find(u => u.id === parseInt(unidadId))?.nombre || '',
    });
    setDescripcion(''); setClienteProveedor(''); setMontoNeto(''); setIva(''); setCuentaId(''); setTipoCambio('');
  };

  const col = (style) => ({ height: '30px', fontSize: '0.75rem', padding: '0.15rem 0.4rem', border: '1px solid #e5e7eb', borderRadius: 5, background: '#fff', width: '100%', ...style });
  const colCount = Object.values(visibleColumns).filter(Boolean).length + 1;

  const handleKey = (e) => { if (e.key === 'Enter') { e.preventDefault(); handleSave(); } if (e.key === 'Escape') { setDescripcion(''); setMontoNeto(''); setIva(''); setClienteProveedor(''); setTipoCambio(''); } };

  return (
    <tr style={{ background: 'linear-gradient(90deg,rgba(37,99,235,.05),rgba(37,99,235,.02))', borderBottom: '2px solid rgba(37,99,235,.15)' }}>
      {visibleColumns.invoiceDate && (
        <td style={{ padding: '0.4rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', borderRadius: 5, overflow: 'hidden', border: '1px solid #e5e7eb', flexShrink: 0 }}>
              <button type="button" onClick={() => setTipo('ingreso')} style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem', fontWeight: 700, border: 'none', cursor: 'pointer', background: tipo === 'ingreso' ? '#059669' : 'transparent', color: tipo === 'ingreso' ? '#fff' : '#6b7280' }}>IN</button>
              <button type="button" onClick={() => setTipo('egreso')} style={{ padding: '0.2rem 0.4rem', fontSize: '0.65rem', fontWeight: 700, border: 'none', cursor: 'pointer', background: tipo === 'egreso' ? '#dc2626' : 'transparent', color: tipo === 'egreso' ? '#fff' : '#6b7280' }}>EG</button>
            </div>
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} onKeyDown={handleKey} style={col({ width: 110 })} />
          </div>
        </td>
      )}
      {visibleColumns.paymentDate && (
        <td style={{ padding: '0.4rem' }}>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} onKeyDown={handleKey} style={col({ width: 110 })} />
        </td>
      )}
      {visibleColumns.clientProvider && (
        <td style={{ padding: '0.4rem' }}>
          <div style={{ minWidth: 150 }}>
            <ClientSelector value={clienteProveedor} onChange={setClienteProveedor} placeholder="Cliente/Proveedor..." />
          </div>
        </td>
      )}
      {visibleColumns.businessUnit && (
        <td style={{ padding: '0.4rem' }}>
          <select value={unidadId} onChange={e => setUnidadId(e.target.value)} onKeyDown={handleKey} style={col({ width: '100%', minWidth: 120 })}>
            {unidades.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
          </select>
        </td>
      )}
      {visibleColumns.description && (
        <td style={{ padding: '0.4rem' }}>
          <input type="text" placeholder="Concepto..." value={descripcion} onChange={e => setDescripcion(e.target.value)} onKeyDown={handleKey} style={col({ width: '100%', minWidth: 140 })} />
        </td>
      )}
      {visibleColumns.account && (
        <td style={{ padding: '0.4rem' }}>
          <select value={cuentaId} onChange={e => setCuentaId(e.target.value)} onKeyDown={handleKey} style={col({ width: '100%', minWidth: 120 })}>
            <option value="">— Cuenta —</option>
            {leafAccounts.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
          </select>
        </td>
      )}
      {visibleColumns.box && (
        <td style={{ padding: '0.4rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', borderRadius: 5, overflow: 'hidden', border: '1px solid #e5e7eb', flexShrink: 0 }}>
              <button type="button" onClick={() => setMoneda('ARS')} style={{ padding: '0.2rem 0.35rem', fontSize: '0.65rem', fontWeight: 700, border: 'none', cursor: 'pointer', background: moneda === 'ARS' ? '#2563eb' : 'transparent', color: moneda === 'ARS' ? '#fff' : '#6b7280' }}>$</button>
              <button type="button" onClick={() => setMoneda('USD')} style={{ padding: '0.2rem 0.35rem', fontSize: '0.65rem', fontWeight: 700, border: 'none', cursor: 'pointer', background: moneda === 'USD' ? '#2563eb' : 'transparent', color: moneda === 'USD' ? '#fff' : '#6b7280' }}>U$</button>
            </div>
            <select value={cajaId} onChange={e => setCajaId(e.target.value)} onKeyDown={handleKey} style={col({ minWidth: 110 })}>
              <option value="">— Caja —</option>
              {availableBanks.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
            </select>
          </div>
        </td>
      )}
      {visibleColumns.exchangeRate && (
        <td style={{ padding: '0.4rem', textAlign: 'right' }}>
          <input type="number" step="0.01" placeholder="TC" value={tipoCambio} onChange={e => setTipoCambio(e.target.value)} onKeyDown={handleKey} style={col({ width: 60, textAlign: 'right', fontFamily: 'var(--font-mono)' })} />
        </td>
      )}
      {visibleColumns.netAmount && (
        <td style={{ padding: '0.4rem', textAlign: 'right' }}>
          <input type="number" placeholder="Neto" value={montoNeto} onChange={e => setMontoNeto(e.target.value)} onKeyDown={handleKey} style={col({ width: 80, textAlign: 'right', fontFamily: 'var(--font-mono)' })} />
        </td>
      )}
      {visibleColumns.tax && (
        <td style={{ padding: '0.4rem', textAlign: 'right' }}>
          <input type="number" placeholder="IVA" value={iva} onChange={e => setIva(e.target.value)} onKeyDown={handleKey} style={col({ width: 70, textAlign: 'right', fontFamily: 'var(--font-mono)' })} />
        </td>
      )}
      {visibleColumns.total && (
        <td style={{ padding: '0.4rem', textAlign: 'right' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>{montoNeto ? `$${(parseFloat(montoNeto) + (parseFloat(iva)||0)).toLocaleString()}` : '-'}</span>
        </td>
      )}
      <td style={{ padding: '0.4rem', textAlign: 'right' }}>
        <button type="button" onClick={handleSave} title="Guardar (Enter)"
            style={{ height: 30, width: 30, padding: 0, background: (!montoNeto || !descripcion) ? '#e5e7eb' : '#2563eb', color: (!montoNeto || !descripcion) ? '#9ca3af' : '#fff', border: 'none', borderRadius: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: 'auto' }}>
            <Check size={14} />
        </button>
      </td>
    </tr>
  );
}

// ========================
// CLIENTS MANAGEMENT
// ========================
function ClientsManagement() {
  const clients = useSelector(s => s.clients.items);
  const companies = useSelector(s => s.company.companies);
  const dispatch = useDispatch();
  const [isAdding, setIsAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ nombre: '', tipo: 'cliente', cuit: '', email: '', telefono: '', company_id: '' });
  const [search, setSearch] = useState('');
  const [filterTipo, setFilterTipo] = useState('all');

  const filtered = useMemo(() => clients.filter(c => {
    const ms = c.nombre.toLowerCase().includes(search.toLowerCase()) || (c.cuit || '').includes(search);
    const mt = filterTipo === 'all' || c.tipo === filterTipo;
    return ms && mt;
  }), [clients, search, filterTipo]);

  const openAdd = () => { setEditing(null); setForm({ nombre: '', tipo: 'cliente', cuit: '', email: '', telefono: '', company_id: companies[0]?.id || '' }); setIsAdding(true); };
  const openEdit = (c) => { setEditing(c); setForm({ ...c }); setIsAdding(true); };
  const submit = (e) => {
    e.preventDefault();
    if (editing) dispatch(updateClient({ ...form, id: editing.id }));
    else dispatch(addClient(form));
    setIsAdding(false);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontWeight: 800 }}>Clientes &amp; Proveedores</h2>
          <p style={{ color: 'var(--text-faint)', fontSize: '0.8125rem' }}>Libro de contactos comerciales del grupo</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Nuevo Contacto</button>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: '0.35rem 0.75rem', width: 280 }}>
          <Search size={15} color="#9CA3AF" />
          <input type="text" placeholder="Buscar nombre o CUIT..." value={search} onChange={e => setSearch(e.target.value)} style={{ border: 'none', fontSize: '0.875rem', width: '100%' }} />
        </div>
        <div className="view-toggle">
          <button className={`btn ${filterTipo === 'all' ? 'active-primary' : ''}`} onClick={() => setFilterTipo('all')}>Todos</button>
          <button className={`btn ${filterTipo === 'cliente' ? 'active-primary' : ''}`} onClick={() => setFilterTipo('cliente')}>Clientes</button>
          <button className={`btn ${filterTipo === 'proveedor' ? 'active-primary' : ''}`} onClick={() => setFilterTipo('proveedor')}>Proveedores</button>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-faint)' }}>{filtered.length} registros</div>
      </div>

      <div className="data-card" style={{ padding: 0 }}>
        <table className="grid-table">
          <thead>
            <tr>
              <th>Nombre</th><th>Tipo</th><th>CUIT</th><th>Email</th><th>Tel\u00e9fono</th><th>Empresa</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.nombre}</td>
                <td><span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 999, background: c.tipo === 'cliente' ? 'var(--accent-green-soft)' : 'rgba(2,132,199,0.1)', color: c.tipo === 'cliente' ? 'var(--accent-green)' : '#0284C7', fontWeight: 700 }}>{c.tipo}</span></td>
                <td className="numeric" style={{ color: 'var(--text-faint)' }}>{c.cuit || '-'}</td>
                <td style={{ color: 'var(--text-sub)' }}>{c.email || '-'}</td>
                <td style={{ color: 'var(--text-sub)' }}>{c.telefono || '-'}</td>
                <td style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>{companies.find(co => co.id === (c.company_id))?.nombre || '-'}</td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn" style={{ marginRight: 6, padding: '0.2rem 0.5rem', background: '#f3f4f6', color: '#374151' }} onClick={() => openEdit(c)}><Edit2 size={12} /></button>
                  <button className="btn" style={{ padding: '0.2rem 0.5rem', background: '#fee2e2', color: '#dc2626' }} onClick={() => { if (window.confirm('¿Eliminar?')) dispatch(deleteClient(c.id)); }}><Trash2 size={12} /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-faint)' }}>Sin contactos. Crea el primero con el botón.</td></tr>}
          </tbody>
        </table>
      </div>

      {isAdding && (
        <Modal isOpen={isAdding} onClose={() => setIsAdding(false)} title={editing ? 'Editar Contacto' : 'Nuevo Contacto'}>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
              <div><label className="form-section-label">Nombre / Raz\u00f3n Social</label><input className="search-input" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required /></div>
              <div><label className="form-section-label">Tipo</label><select className="search-input" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}><option value="cliente">Cliente</option><option value="proveedor">Proveedor</option></select></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div><label className="form-section-label">CUIT</label><input className="search-input" placeholder="XX-XXXXXXXX-X" value={form.cuit || ''} onChange={e => setForm({ ...form, cuit: e.target.value })} /></div>
              <div><label className="form-section-label">Email</label><input type="email" className="search-input" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div><label className="form-section-label">Tel\u00e9fono</label><input className="search-input" value={form.telefono || ''} onChange={e => setForm({ ...form, telefono: e.target.value })} /></div>
            </div>
            <div>
              <label className="form-section-label">Empresa Asignada</label>
              <select className="search-input" value={form.company_id || ''} onChange={e => setForm({ ...form, company_id: parseInt(e.target.value) })}>
                <option value="">— Sin empresa espec\u00edfica —</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ height: 48, marginTop: '0.5rem' }}>{editing ? 'Actualizar Contacto' : 'Crear Contacto'}</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function TransactionsCore({ unidades, selectedTx, setSelectedTx, getRateForDate, userPerms }) {
  const dispatch = useDispatch();
  const txs = useSelector(state => state.transactions.items);
  const planCuentas = useSelector(state => state.accounts.items);
  const bankAccounts = useSelector(state => state.bankAccounts.items);
  const { currentCompanyId, isHoldingView, companies } = useSelector(state => state.company);

  const allowedBanks = bankAccounts.filter(b => userPerms.isRoot || userPerms.allowedAccounts.includes(b.id));

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'fecha_factura', direction: 'desc' });
  const [colFilters, setColFilters] = useState({}); 
  const [activePopover, setActivePopover] = useState(null);

  // Column Visibility State
  const [visibleColumns, setVisibleColumns] = useState({
    invoiceDate: true,
    paymentDate: true,
    clientProvider: true,
    businessUnit: true,
    description: true,
    account: true,
    box: true,
    exchangeRate: true,
    netAmount: true,
    tax: true,
    total: true
  });

  const emptyForm = {
    descripcion: '', 
    factura: '',
    cliente_proveedor: '',
    monto_neto: '', iva: 0, tax: 0, monto: 0, 
    tipo: 'egreso', cuenta_bancaria_id: allowedBanks.filter(b=>b.moneda==='ARS')[0]?.id || '', unidad_negocio_id: unidades[0]?.id || 1,
    fecha_factura: new Date().toISOString().split('T')[0],
    fecha_pago: new Date().toISOString().split('T')[0],
    cuenta_contable_id: '', cuenta_contable_nombre: '',
    moneda: 'ARS',
    tipo_cambio: '',
    company_id: currentCompanyId
  };

  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (selectedTx) {
      setEditingId(selectedTx.id);
      setFormData({
        ...selectedTx,
        cuenta_contable_id: selectedTx.subcuenta_id || selectedTx.cuenta_id || '',
        cuenta_contable_nombre: planCuentas.find(a => a.id === (selectedTx.subcuenta_id || selectedTx.cuenta_id))?.nombre || '',
        tipo_cambio: selectedTx.tipo_cambio || ''
      });
      setIsSidebarOpen(true);
      setSelectedTx(null);
    }
  }, [selectedTx, planCuentas, setSelectedTx]);

  useEffect(() => {
    const net = parseFloat(formData.monto_neto) || 0;
    const iva = parseFloat(formData.iva) || 0;
    const tax = parseFloat(formData.tax) || 0;
    setFormData(prev => ({ ...prev, monto: net + iva + tax }));
  }, [formData.monto_neto, formData.iva, formData.tax]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const payload = {
      ...formData,
      id: editingId || Date.now(),
      monto: parseFloat(formData.monto) || 0,
      monto_neto: parseFloat(formData.monto_neto) || 0,
      iva: parseFloat(formData.iva) || 0,
      tax: parseFloat(formData.tax) || 0,
      tipo_cambio: formData.tipo_cambio ? parseFloat(formData.tipo_cambio) : null,
      semana: 13,
      unidad_negocio: unidades.find(u => u.id === parseInt(formData.unidad_negocio_id))?.nombre,
      banco_nombre: bankAccounts.find(b => b.id === parseInt(formData.cuenta_bancaria_id))?.nombre,
      subcuenta_id: formData.cuenta_contable_id,
      company_id: currentCompanyId
    };
    if (editingId) dispatch(updateTransaction(payload));
    else dispatch(addTransaction(payload));
    
    setEditingId(null);
    setFormData(emptyForm);
    setIsSidebarOpen(false);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const handleFilter = (key, value) => {
    setColFilters(prev => ({ ...prev, [key]: value }));
  };

  const filteredTxs = useMemo(() => {
    let result = txs.filter(t => {
      const isAccessible = isHoldingView || t.company_id === currentCompanyId;
      if (!isAccessible) return false;

      const search = searchTerm.toLowerCase();
      if (search && !t.descripcion.toLowerCase().includes(search) && !(t.cliente_proveedor || '').toLowerCase().includes(search)) return false;

      for (const [key, val] of Object.entries(colFilters)) {
        if (!val) continue;
        
        if (key === 'invoiceDate' || key === 'paymentDate') {
          const dbKey = key === 'invoiceDate' ? 'fecha_factura' : 'fecha_pago';
          const recDate = t[dbKey];
          if (val.from && recDate < val.from) return false;
          if (val.to && recDate > val.to) return false;
        } else {
          let dbKey = key;
          if (key === 'clientProvider') dbKey = 'cliente_proveedor';
          if (key === 'businessUnit') dbKey = 'unidad_negocio';
          if (key === 'account') dbKey = 'cuenta_contable_nombre';
          if (key === 'box') dbKey = 'banco_nombre';
          if (key === 'exchangeRate') dbKey = 'tipo_cambio';
          if (key === 'netAmount') dbKey = 'monto_neto';
          if (key === 'tax') dbKey = 'iva'; // Simplificado
          if (key === 'total') dbKey = 'monto';

          const recordVal = String(t[dbKey] || '').toLowerCase();
          if (!recordVal.includes(String(val).toLowerCase())) return false;
        }
      }
      return true;
    });

    if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        // Mapeo de llaves de ordenación si no coinciden
        const map = { invoiceDate: 'fecha_factura', paymentDate: 'fecha_pago', clientProvider: 'cliente_proveedor', businessUnit: 'unidad_negocio', account: 'cuenta_contable_nombre', box: 'banco_nombre', netAmount: 'monto_neto', total: 'monto' };
        if (map[sortConfig.key]) { aVal = a[map[sortConfig.key]]; bVal = b[map[sortConfig.key]]; }
        
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    } else {
       result.reverse(); // Default desc by order of entry
    }

    return result;
  }, [txs, searchTerm, colFilters, sortConfig, isHoldingView, currentCompanyId]);

  const toggleColumn = (col) => {
    setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  return (
    <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
       {/* Actions Bar - Foto 2 Style */}
       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div className="header-search" style={{ width: '340px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '0.45rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={16} color="#9CA3AF" />
            <input 
              type="text" 
              placeholder="Búsqueda rápida (Concepto, Cliente)..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ border: 'none', fontSize: '0.875rem', width: '100%', outline: 'none' }} 
            />
          </div>
          <button className="btn btn-ghost" style={{ background: '#fff' }}><FileText size={16} /> Exportar</button>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
          <button 
            className="btn btn-ghost" 
            style={{ background: isColumnDropdownOpen ? '#F3F4F6' : '#fff' }}
            onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
          >
            <ListTree size={16} /> Columnas
          </button>
          
          {isColumnDropdownOpen && (
            <div className="data-card animate-fade-in" style={{ position: 'absolute', top: '100%', right: 0, zIndex: 100, width: '220px', marginTop: '0.5rem', padding: '1rem', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-faint)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>COLUMNAS VISIBLES</div>
              {Object.keys(visibleColumns).map(col => (
                <label key={col} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.35rem 0', textTransform: 'none' }}>
                  <input type="checkbox" checked={visibleColumns[col]} onChange={() => toggleColumn(col)} style={{ width: 'auto' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 500 }}>{col.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                </label>
              ))}
            </div>
          )}

          <button className="btn" style={{ background: '#fff', border: '1px solid var(--border-color)', color: 'var(--text-sub)' }} onClick={() => setIsTransferOpen(true)}>
            <ArrowLeftRight size={16} /> Transferencia
          </button>
          <button className="btn btn-primary" onClick={() => { setEditingId(null); setFormData(emptyForm); setIsSidebarOpen(true); }}>
            <Plus size={16} /> Nueva Transacción
          </button>
        </div>
      </div>

      <div className="data-card" style={{ flex: 1, padding: 0, overflow: 'hidden', background: '#fff' }}>
        <div style={{ height: '100%', overflow: 'auto' }} onClick={() => setActivePopover(null)}>
          <table className="grid-table" style={{ minWidth: (Object.values(visibleColumns).filter(Boolean).length * 125 + 100) + 'px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 100 }}>
              <tr style={{ background: 'var(--bg-dark)' }}>
                {visibleColumns.invoiceDate && <ColumnHeader title="F. Factura" sortKey="invoiceDate" sortConfig={sortConfig} onSort={handleSort} filterKey="invoiceDate" filters={colFilters} onFilter={handleFilter} activePopover={activePopover} setActivePopover={setActivePopover} isDate />}
                {visibleColumns.paymentDate && <ColumnHeader title="F. Pago" sortKey="paymentDate" sortConfig={sortConfig} onSort={handleSort} filterKey="paymentDate" filters={colFilters} onFilter={handleFilter} activePopover={activePopover} setActivePopover={setActivePopover} isDate />}
                {visibleColumns.clientProvider && <ColumnHeader title="Cliente/Proveedor" sortKey="clientProvider" sortConfig={sortConfig} onSort={handleSort} filterKey="clientProvider" filters={colFilters} onFilter={handleFilter} activePopover={activePopover} setActivePopover={setActivePopover} />}
                {visibleColumns.businessUnit && <ColumnHeader title="Unidad" sortKey="businessUnit" sortConfig={sortConfig} onSort={handleSort} filterKey="businessUnit" filters={colFilters} onFilter={handleFilter} activePopover={activePopover} setActivePopover={setActivePopover} />}
                {visibleColumns.description && <ColumnHeader title="Descripción" sortKey="description" sortConfig={sortConfig} onSort={handleSort} filterKey="description" filters={colFilters} onFilter={handleFilter} activePopover={activePopover} setActivePopover={setActivePopover} />}
                {visibleColumns.account && <ColumnHeader title="Cuenta" sortKey="account" sortConfig={sortConfig} onSort={handleSort} filterKey="account" filters={colFilters} onFilter={handleFilter} activePopover={activePopover} setActivePopover={setActivePopover} />}
                {visibleColumns.box && <ColumnHeader title="Caja" sortKey="box" sortConfig={sortConfig} onSort={handleSort} filterKey="box" filters={colFilters} onFilter={handleFilter} activePopover={activePopover} setActivePopover={setActivePopover} />}
                {visibleColumns.exchangeRate && <ColumnHeader title="TC" sortKey="exchangeRate" sortConfig={sortConfig} onSort={handleSort} filterKey="exchangeRate" filters={colFilters} onFilter={handleFilter} activePopover={activePopover} setActivePopover={setActivePopover} isNumeric />}
                {visibleColumns.netAmount && <ColumnHeader title="Monto Neto" sortKey="netAmount" sortConfig={sortConfig} onSort={handleSort} filterKey="netAmount" filters={colFilters} onFilter={handleFilter} activePopover={activePopover} setActivePopover={setActivePopover} isNumeric />}
                {visibleColumns.tax && <ColumnHeader title="IVA/Tax" sortKey="tax" sortConfig={sortConfig} onSort={handleSort} filterKey="tax" filters={colFilters} onFilter={handleFilter} activePopover={activePopover} setActivePopover={setActivePopover} isNumeric />}
                {visibleColumns.total && <ColumnHeader title="Total" sortKey="total" sortConfig={sortConfig} onSort={handleSort} filterKey="total" filters={colFilters} onFilter={handleFilter} activePopover={activePopover} setActivePopover={setActivePopover} isNumeric />}
                <th style={{ width: '60px' }}></th>
              </tr>
            </thead>
            <tbody>
              <QuickEntryRow
                companies={companies}
                bankAccounts={bankAccounts}
                accounts={planCuentas}
                unidades={unidades}
                currentCompanyId={currentCompanyId}
                visibleColumns={visibleColumns}
                userPerms={userPerms}
                onSave={(payload) => dispatch(addTransaction(payload))}
              />
              {filteredTxs.map(tx => (
                <tr key={tx.id} onDoubleClick={() => { setEditingId(tx.id); setFormData(tx); setIsSidebarOpen(true); }} className={editingId === tx.id ? 'editing-row' : ''}>
                  {visibleColumns.invoiceDate && <td className="numeric" style={{ color: 'var(--text-faint)' }}>{tx.fecha_factura}</td>}
                  {visibleColumns.paymentDate && (
                    <td className="numeric" style={{ color: tx.fecha_pago ? 'var(--text-sub)' : 'var(--accent-red)', fontWeight: tx.fecha_pago ? 400 : 700 }}>
                      {tx.fecha_pago || 'PENDIENTE'}
                    </td>
                  )}
                  {visibleColumns.clientProvider && <td style={{ fontWeight: 600 }}>{tx.cliente_proveedor || '-'}</td>}
                  {visibleColumns.businessUnit && <td><span style={{ fontSize: '0.7rem', background: 'rgba(37,99,235,0.1)', color: '#2563eb', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>{tx.unidad_negocio || unidades.find(u => u.id === tx.unidad_negocio_id)?.nombre || '-'}</span></td>}
                  {visibleColumns.description && <td>{tx.descripcion}</td>}
                  {visibleColumns.account && <td><span className="pnl-pill" style={{ background: '#F3F4F6', color: '#374151' }}>{tx.cuenta_contable_nombre || planCuentas.find(p=>p.id===(tx.subcuenta_id||tx.cuenta_id))?.nombre || 'S/C'}</span></td>}
                  {visibleColumns.box && <td>{tx.banco_nombre}</td>}
                  {visibleColumns.exchangeRate && <td className="numeric" style={{ textAlign: 'right', color: 'var(--text-faint)' }}>{tx.tipo_cambio || '-'}</td>}
                  {visibleColumns.netAmount && <td className="numeric" style={{ textAlign: 'right' }}>${(tx.monto_neto || tx.monto).toLocaleString()}</td>}
                  {visibleColumns.tax && <td className="numeric" style={{ textAlign: 'right', opacity: 0.6 }}>${((tx.iva || 0) + (tx.tax || 0)).toLocaleString()}</td>}
                  {visibleColumns.total && <td className="numeric" style={{ textAlign: 'right', fontWeight: 700, color: tx.tipo === 'ingreso' ? 'var(--accent-green)' : 'var(--text-main)' }}>${(tx.monto).toLocaleString()}</td>}
                  <td style={{ textAlign: 'right' }}><button className="btn" style={{ background: 'transparent', color: 'var(--text-faint)' }} onClick={(e) => { e.stopPropagation(); setEditingId(tx.id); setFormData(tx); setIsSidebarOpen(true); }}><ArrowDownRight size={14}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isSidebarOpen && (
        <div className="modal-overlay" onClick={() => setIsSidebarOpen(false)}>
          <div className="sidebar-form-container animate-slide-left" style={{ height: '95vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>{editingId ? 'Editar Transacción' : 'Nueva Transacción'}</h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: 'var(--text-faint)' }}>{editingId ? 'Actualiza los detalles operativos' : 'Registra un nuevo movimiento'}</p>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="btn btn-ghost" style={{ padding: '0.4rem', border: 'none', background: '#f3f4f6' }}><X size={18}/></button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1, paddingRight: '0.5rem', overflowY: 'auto' }}>
              
              {/* === TIPO Y DESCRIPCION === */}
              <div style={{ padding: '1.2rem', background: '#f8fafc', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                  <button type="button" 
                    style={{ flex: 1, padding: '0.6rem', border: 'none', fontWeight: 700, cursor: 'pointer', transition: '0.2s', background: formData.tipo === 'ingreso' ? '#059669' : '#fff', color: formData.tipo === 'ingreso' ? '#fff' : '#64748b' }} 
                    onClick={() => setFormData({...formData, tipo: 'ingreso'})}>
                    Ingreso
                  </button>
                  <button type="button" 
                    style={{ flex: 1, padding: '0.6rem', border: 'none', borderLeft: '1px solid #cbd5e1', fontWeight: 700, cursor: 'pointer', transition: '0.2s', background: formData.tipo === 'egreso' ? '#dc2626' : '#fff', color: formData.tipo === 'egreso' ? '#fff' : '#64748b' }} 
                    onClick={() => setFormData({...formData, tipo: 'egreso'})}>
                    Egreso
                  </button>
                </div>
                
                <div>
                  <label className="form-section-label">Descripción</label>
                  <input type="text" className="search-input" style={{ width: '100%', border: '1px solid #cbd5e1', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }} placeholder="Ej: Compra de insumos..." value={formData.descripcion} onChange={e => setFormData({...formData, descripcion: e.target.value})} required/>
                </div>

                <div>
                  <label className="form-section-label">N° Factura (Opcional)</label>
                  <input type="text" className="search-input" style={{ width: '100%', border: '1px solid #cbd5e1', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }} placeholder="Ej: A-0001-00000001" value={formData.factura || ''} onChange={e => setFormData({...formData, factura: e.target.value})}/>
                </div>
                
                <div>
                  <label className="form-section-label">Cliente / Proveedor</label>
                  <div style={{ background: '#fff', borderRadius: '6px', border: '1px solid #cbd5e1', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}>
                    <ClientSelector value={formData.cliente_proveedor || ''} onChange={(val) => setFormData({ ...formData, cliente_proveedor: val })} />
                  </div>
                </div>
              </div>

              {/* === FECHAS === */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-section-label">Fecha Devengado (P&L)</label>
                  <input type="date" className="search-input" style={{ width: '100%' }} value={formData.fecha_factura} onChange={e => setFormData({...formData, fecha_factura: e.target.value})} required/>
                </div>
                <div>
                  <label className="form-section-label">Fecha Real de Pago</label>
                  <input type="date" className="search-input" style={{ width: '100%' }} value={formData.fecha_pago} onChange={e => setFormData({...formData, fecha_pago: e.target.value})} required/>
                </div>
              </div>

              {/* === FINANCIALS === */}
              <div style={{ padding: '1.2rem', background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label className="form-section-label">Moneda Operativa</label>
                    <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid #cbd5e1' }}>
                      <button type="button" style={{ flex: 1, padding: '0.4rem', border: 'none', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', background: formData.moneda === 'ARS' ? '#2563eb' : '#f8fafc', color: formData.moneda === 'ARS' ? '#fff' : '#64748b' }} onClick={() => setFormData({...formData, moneda: 'ARS', cuenta_bancaria_id: bankAccounts.find(b => b.moneda === 'ARS')?.id || 1})}>ARS</button>
                      <button type="button" style={{ flex: 1, padding: '0.4rem', border: 'none', borderLeft: '1px solid #cbd5e1', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', background: formData.moneda === 'USD' ? '#2563eb' : '#f8fafc', color: formData.moneda === 'USD' ? '#fff' : '#64748b' }} onClick={() => setFormData({...formData, moneda: 'USD', cuenta_bancaria_id: bankAccounts.find(b => b.moneda === 'USD')?.id || bankAccounts[0].id})}>USD</button>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="form-section-label">TC Libre</label>
                    <input type="number" step="0.01" className="search-input" style={{ width: '100%', fontSize: '0.8rem' }} placeholder={formData.moneda === 'ARS' ? `~${getRateForDate(formData.fecha_factura)}` : '1.00'} value={formData.tipo_cambio || ''} onChange={e => setFormData({...formData, tipo_cambio: e.target.value})} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label className="form-section-label">Monto Neto</label>
                    <input type="number" step="0.01" className="search-input" style={{ width: '100%', fontWeight: 700 }} value={formData.monto_neto} onChange={e => setFormData({...formData, monto_neto: e.target.value})} required />
                  </div>
                  <div>
                    <label className="form-section-label">IVA (21%)</label>
                    <input type="number" step="0.01" className="search-input" style={{ width: '100%' }} value={formData.iva} onChange={e => setFormData({...formData, iva: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-section-label">Perc./Tax</label>
                    <input type="number" step="0.01" className="search-input" style={{ width: '100%' }} value={formData.tax} onChange={e => setFormData({...formData, tax: e.target.value})} />
                  </div>
                </div>

                <div style={{ background: 'linear-gradient(to right, #f8fafc, #eff6ff)', padding: '1rem', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>TOTAL CASH OUTFLOW</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: formData.tipo === 'ingreso' ? '#059669' : '#dc2626' }}>${(parseFloat(formData.monto_neto||0) + parseFloat(formData.iva||0) + parseFloat(formData.tax||0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* === CLASIFFICACION === */}
              <div>
                <label className="form-section-label" style={{ marginBottom: '0.75rem' }}>Clasificación de Costos / Contabilidad</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  
                  {/* Account Selector */}
                  <div style={{ position: 'relative' }}>
                    <div className="search-input hover-glow" onClick={() => setIsSelectorOpen(!isSelectorOpen)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: '#fff', border: '1px solid #cbd5e1' }}>
                      <span style={{ fontWeight: formData.cuenta_contable_nombre ? 600 : 400, color: formData.cuenta_contable_nombre ? '#0f172a' : '#94a3b8' }}>
                        {formData.cuenta_contable_nombre || 'Elegir Cuenta Contable...'}
                      </span>
                      <ChevronDown size={14} color="#64748b" />
                    </div>
                    {isSelectorOpen && (
                      <AccountSelector 
                        accounts={planCuentas} // Show all so they can find structurally
                        currentAccountId={formData.cuenta_contable_id}
                        onSelect={(acc) => {
                          setFormData({...formData, cuenta_contable_id: acc.id, cuenta_contable_nombre: acc.nombre});
                          setIsSelectorOpen(false);
                        }}
                      />
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <select className="search-input" style={{ background: '#fff', border: '1px solid #cbd5e1' }} value={formData.unidad_negocio_id} onChange={e => setFormData({...formData, unidad_negocio_id: parseInt(e.target.value)})}>
                      <option value="">— Unidad de Negocio —</option>
                      {unidades.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                    </select>

                    <select className="search-input" style={{ background: '#fff', border: '1px solid #cbd5e1' }} value={formData.cuenta_bancaria_id} onChange={e => setFormData({...formData, cuenta_bancaria_id: parseInt(e.target.value)})}>
                      <option value="">— Caja Fuerte / Banco —</option>
                      {allowedBanks.filter(b => b.moneda === formData.moneda).map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '1rem' }}>
                <button type="submit" className="btn btn-primary shadow-lg" style={{ flex: 2, height: '44px', fontSize: '0.9rem' }}>
                  {editingId ? 'Guardar Cambios' : 'Registrar Transacción'}
                </button>
                {editingId && (
                  <button type="button" className="btn btn-danger" style={{ flex: 1, height: '44px' }} onClick={() => { if (window.confirm('¿Borrar?')) { dispatch(deleteTransaction(formData.id)); setIsSidebarOpen(false); } }}>
                    Borrar
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {isTransferOpen && (
        <Modal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} title="Transferencia entre Cajas">
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} onSubmit={(e) => {
            e.preventDefault();
            const sourceId = parseInt(e.target.source.value);
            const destId = parseInt(e.target.dest.value);
            const source = bankAccounts.find(b => b.id === sourceId);
            const dest = bankAccounts.find(b => b.id === destId);
            const amount = parseFloat(e.target.amount.value);
            const destAmount = parseFloat(e.target.destAmount.value || amount);
            
            // Calculate implicit TC if they are different currencies
            let fixedTC = null;
            if (source.moneda === 'USD' && dest.moneda === 'ARS') {
              fixedTC = destAmount / amount;
            } else if (source.moneda === 'ARS' && dest.moneda === 'USD') {
              fixedTC = amount / destAmount;
            }

            const txId = Date.now();
            const common = {
              descripcion: `Traspaso: ${source.nombre} ➔ ${dest.nombre}`,
              fecha_factura: new Date().toISOString().split('T')[0],
              fecha_pago: new Date().toISOString().split('T')[0],
              cuenta_contable_nombre: 'Movimiento de Fondos',
              cuenta_id: 999,
              semana: 13,
              company_id: currentCompanyId
            };

            dispatch(addTransaction({ ...common, id: txId, tipo: 'egreso', monto: amount, moneda: source.moneda, cuenta_bancaria_id: source.id, banco_nombre: source.nombre, tipo_cambio: fixedTC }));
            dispatch(addTransaction({ ...common, id: txId + 1, tipo: 'ingreso', monto: destAmount, moneda: dest.moneda, cuenta_bancaria_id: dest.id, banco_nombre: dest.nombre, tipo_cambio: fixedTC }));
            
            setIsTransferOpen(false);
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-section-label">Origen</label>
                <select name="source" className="search-input" required>
                  {allowedBanks.map(b => <option key={b.id} value={b.id}>{b.nombre} ({b.moneda})</option>)}
                </select>
              </div>
              <div>
                <label className="form-section-label">Destino</label>
                <select name="dest" className="search-input" required>
                  {allowedBanks.map(b => <option key={b.id} value={b.id}>{b.nombre} ({b.moneda})</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-section-label">Cantidad a Enviar</label>
                <input name="amount" type="number" step="0.01" className="search-input" placeholder="0.00" required />
              </div>
              <div>
                <label className="form-section-label">Monto Destino (A recibir)</label>
                <input name="destAmount" type="number" step="0.01" className="search-input" placeholder="Opcional..." />
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)', margin: 0 }}>* Si envías fondos entre cajas de la misma moneda, deja el destino en blanco. Si es multi-moneda (ej: salen PESOS, entran DÓLARES), indica ambos montos y calcularemos el Ratio de Cambio automáticamente.</p>
            <button type="submit" className="btn btn-primary" style={{ height: '48px', fontWeight: 800 }}>EJECUTAR TRASPASO</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Presupuesto({ unidades = [] }) {
  const dispatch = useDispatch();
  const accounts = useSelector(state => state.accounts.items);
  const budget = useSelector(state => state.budget.items);
  const { currentCompanyId, companies } = useSelector(state => state.company);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [selectedUnidad, setSelectedUnidad] = useState('all');

  const months = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`)
  , [year]);

  const MONTH_LABELS = { '01':'Ene','02':'Feb','03':'Mar','04':'Abr','05':'May','06':'Jun','07':'Jul','08':'Ago','09':'Sep','10':'Oct','11':'Nov','12':'Dic' };

  const plAccounts = accounts.filter(a => a.visible_en_pnl);

  const getBudgetValue = (accountId, m) => {
    if (selectedUnidad === 'all') {
      const uKeys = Object.keys(budget[currentCompanyId] || {});
      return uKeys.reduce((acc, uId) => acc + (budget[currentCompanyId]?.[uId]?.[accountId]?.[m] || 0), 0);
    }
    return budget[currentCompanyId]?.[selectedUnidad]?.[accountId]?.[m] || 0;
  };

  const SECTIONS = [
    { label: 'Ingresos Operativos', tipo: 'ingreso', color: '#059669', bg: 'rgba(5,150,105,0.08)' },
    { label: 'Costos Directos',     tipo: 'costo_directo', color: '#dc2626', bg: 'rgba(220,38,38,0.06)' },
    { label: 'Gastos Operativos',   tipo: 'gasto_operativo', color: '#d97706', bg: 'rgba(217,119,6,0.06)' },
    { label: 'Depreciaciones',      tipo: 'depreciacion', color: '#7c3aed', bg: 'rgba(124,58,237,0.06)' },
    { label: 'Resultados Financieros', tipo: 'gasto_financiero', color: '#0284c7', bg: 'rgba(2,132,199,0.06)' },
    { label: 'Impuestos',           tipo: 'impuesto', color: '#6b7280', bg: 'rgba(107,114,128,0.06)' },
  ];

  const getSectionTotals = (tipo) => {
    const sAccounts = plAccounts.filter(a => a.tipo === tipo && !plAccounts.some(child => child.parent_id === a.id));
    const totals = {};
    months.forEach(m => totals[m] = sAccounts.reduce((s, a) => s + getBudgetValue(a.id, m), 0));
    return totals;
  };

  const renderSectionRows = (tipo) => {
    const roots = plAccounts.filter(a => a.tipo === tipo && !a.parent_id);
    const children = (parentId) => plAccounts.filter(a => a.tipo === tipo && a.parent_id === parentId);

    return roots.map(root => (
      <React.Fragment key={root.id}>
        <tr style={{ background: 'rgba(0,0,0,0.015)', fontWeight: 600 }}>
          <td style={{ paddingLeft: '1.5rem', position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 1 }}>{root.nombre}</td>
          {months.map(m => {
            const val = children(root.id).reduce((s, c) => s + getBudgetValue(c.id, m), 0) || getBudgetValue(root.id, m);
            return <td key={m} className="numeric" style={{ textAlign: 'right', fontWeight: children(root.id).length > 0 ? 700 : 400 }}>{val === 0 ? '-' : val.toLocaleString()}</td>;
          })}
          <td className="numeric" style={{ textAlign: 'right', fontWeight: 800, background: 'var(--bg-dark)', color: '#fff' }}>
            {(() => { const t = months.reduce((s,m) => { const v = children(root.id).reduce((ss,c)=>ss+getBudgetValue(c.id,m),0)||getBudgetValue(root.id,m); return s+v;},0); return t===0?'-':t.toLocaleString(); })()}
          </td>
        </tr>
        {children(root.id).map(child => (
          <tr key={child.id}>
            <td style={{ paddingLeft: '3rem', position: 'sticky', left: 0, background: '#fff', zIndex: 1, color: 'var(--text-sub)' }}>{child.nombre}</td>
            {months.map(m => {
              const val = getBudgetValue(child.id, m);
              const isEditable = selectedUnidad !== 'all';
              return (
                <td key={m} className="numeric" style={{ padding: '0.2rem' }}>
                  <input
                    type="number"
                    className="projection-input"
                    style={{ textAlign: 'right', width: '100%', fontSize: '0.78rem' }}
                    value={isEditable ? (budget[currentCompanyId]?.[selectedUnidad]?.[child.id]?.[m] || '') : (val === 0 ? '' : val)}
                    placeholder="0"
                    disabled={!isEditable}
                    title={!isEditable ? 'Selecciona una Unidad de Negocios para editar' : ''}
                    onChange={e => isEditable && dispatch(setBudgetValue({ companyId: currentCompanyId, unidadId: selectedUnidad, accountId: child.id, month: m, value: e.target.value }))}
                  />
                </td>
              );
            })}
            <td className="numeric" style={{ textAlign: 'right', background: 'var(--bg-dark)', color: '#fff', fontWeight: 700 }}>
              {(() => { const t = months.reduce((s,m)=>s+getBudgetValue(child.id,m),0); return t===0?'-':t.toLocaleString(); })()}
            </td>
          </tr>
        ))}
      </React.Fragment>
    ));
  };

  const renderSubtotal = (label, positiveSection, negativeSection, bg, color) => {
    const pos = getSectionTotals(positiveSection);
    const neg = negativeSection ? getSectionTotals(negativeSection) : {};
    const total = months.reduce((s,m)=>(pos[m]||0)-(neg[m]||0)+s, 0);
    return (
      <tr style={{ background: bg, fontWeight: 900 }}>
        <td style={{ paddingLeft: '1rem', position: 'sticky', left: 0, background: bg, zIndex: 1, textTransform: 'uppercase', color, letterSpacing: '0.05em', fontSize: '0.75rem' }}>{label}</td>
        {months.map(m => { const v=(pos[m]||0)-(neg[m]||0); return <td key={m} className="numeric" style={{ textAlign:'right', color }}>{v===0?'-':v.toLocaleString()}</td>; })}
        <td className="numeric" style={{ textAlign:'right', fontWeight:900, background:'var(--bg-dark)', color:'#fff' }}>{total===0?'-':total.toLocaleString()}</td>
      </tr>
    );
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontWeight: 800 }}>Presupuesto Operativo</h2>
          <p style={{ color: 'var(--text-faint)', fontSize: '0.8125rem' }}>Planificación anual por Cuenta G.L. y Mes · Edición por Unidad de Negocios</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-faint)' }}>UNIDAD</span>
            <select className="search-input" style={{ width: '180px', height: '36px', fontSize: '0.8rem' }} value={selectedUnidad} onChange={e => setSelectedUnidad(e.target.value)}>
              <option value="all">Consolidado (Todas)</option>
              {unidades.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-faint)' }}>AÑO</span>
            <select className="search-input" style={{ width: '100px', height: '36px' }} value={year} onChange={e => setYear(e.target.value)}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={() => window.print()}>Exportar</button>
        </div>
      </div>

      <div className="data-card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="grid-table" style={{ minWidth: '1400px', fontSize: '0.8rem' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              <th style={{ position: 'sticky', left: 0, background: 'var(--bg-card)', zIndex: 11, width: '240px' }}>Cuenta G.L.</th>
              {months.map(m => <th key={m} style={{ textAlign: 'right', minWidth: 80 }}>{MONTH_LABELS[m.split('-')[1]]}</th>)}
              <th style={{ textAlign: 'right', background: 'var(--bg-dark)', color: '#fff', minWidth: 90 }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {/* INGRESOS */}
            <tr style={{ background: 'rgba(5,150,105,0.12)' }}>
              <td colSpan={months.length + 2} style={{ padding: '0.4rem 1rem', fontWeight: 900, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#059669', position: 'sticky', left: 0 }}>▸ Ingresos Operativos</td>
            </tr>
            {renderSectionRows('ingreso')}
            {renderSubtotal('Margen Bruto', 'ingreso', 'costo_directo', 'rgba(37,99,235,0.07)', '#1e40af')}

            {/* COSTOS */}
            <tr style={{ background: 'rgba(220,38,38,0.10)' }}>
              <td colSpan={months.length + 2} style={{ padding: '0.4rem 1rem', fontWeight: 900, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#dc2626', position: 'sticky', left: 0 }}>▸ Costos Directos</td>
            </tr>
            {renderSectionRows('costo_directo')}

            {/* OPEX */}
            <tr style={{ background: 'rgba(217,119,6,0.10)' }}>
              <td colSpan={months.length + 2} style={{ padding: '0.4rem 1rem', fontWeight: 900, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#d97706', position: 'sticky', left: 0 }}>▸ Gastos Operativos</td>
            </tr>
            {renderSectionRows('gasto_operativo')}
            {renderSubtotal('EBITDA', 'ingreso', 'gasto_operativo', 'rgba(37,99,235,0.12)', '#1d4ed8')}

            {/* DEPRECIACIONES */}
            <tr style={{ background: 'rgba(124,58,237,0.08)' }}>
              <td colSpan={months.length + 2} style={{ padding: '0.4rem 1rem', fontWeight: 900, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7c3aed', position: 'sticky', left: 0 }}>▸ Depreciaciones</td>
            </tr>
            {renderSectionRows('depreciacion')}

            {/* RESULTADOS FINANCIEROS */}
            <tr style={{ background: 'rgba(2,132,199,0.08)' }}>
              <td colSpan={months.length + 2} style={{ padding: '0.4rem 1rem', fontWeight: 900, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0284c7', position: 'sticky', left: 0 }}>▸ Resultados Financieros</td>
            </tr>
            {renderSectionRows('gasto_financiero')}

            {/* IMPUESTOS */}
            <tr style={{ background: 'rgba(107,114,128,0.08)' }}>
              <td colSpan={months.length + 2} style={{ padding: '0.4rem 1rem', fontWeight: 900, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280', position: 'sticky', left: 0 }}>▸ Impuestos</td>
            </tr>
            {renderSectionRows('impuesto')}

            {/* NET INCOME */}
            {(() => {
              const pos = getSectionTotals('ingreso');
              const c   = getSectionTotals('costo_directo');
              const op  = getSectionTotals('gasto_operativo');
              const dep = getSectionTotals('depreciacion');
              const fin = getSectionTotals('gasto_financiero');
              const tax = getSectionTotals('impuesto');
              const total = months.reduce((s,m)=>(pos[m]||0)-(c[m]||0)-(op[m]||0)-(dep[m]||0)-(fin[m]||0)-(tax[m]||0)+s, 0);
              return (
                <tr style={{ background: total >= 0 ? 'rgba(5,150,105,0.15)' : 'rgba(220,38,38,0.12)', fontWeight: 900 }}>
                  <td style={{ paddingLeft: '1rem', position: 'sticky', left: 0, background: total>=0?'rgba(5,150,105,0.15)':'rgba(220,38,38,0.12)', zIndex:1, textTransform:'uppercase', color: total>=0?'#059669':'#dc2626', letterSpacing:'0.06em' }}>NET INCOME</td>
                  {months.map(m => { const v=(pos[m]||0)-(c[m]||0)-(op[m]||0)-(dep[m]||0)-(fin[m]||0)-(tax[m]||0); return <td key={m} className="numeric" style={{ textAlign:'right', color:v>=0?'#059669':'#dc2626', fontWeight:900 }}>{v===0?'-':v.toLocaleString()}</td>; })}
                  <td className="numeric" style={{ textAlign:'right', fontWeight:900, background:total>=0?'#059669':'#dc2626', color:'#fff' }}>{total===0?'-':total.toLocaleString()}</td>
                </tr>
              );
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AccountManagement() {
  const dispatch = useDispatch();
  const accounts = useSelector(state => state.accounts.items);
  
  const [isAdding, setIsAdding] = useState(false);
  const [newAccount, setNewAccount] = useState({ nombre: '', tipo: 'gasto_operativo', codigo: '', parent_id: '', visible_en_pnl: true, visible_en_cf: true });

  const sectionsList = [
    { title: 'Ingresos Operativos', tipo: 'ingreso', icon: TrendingUp },
    { title: 'Costos Directos', tipo: 'costo_directo', icon: ArrowDownRight },
    { title: 'Gastos Operativos', tipo: 'gasto_operativo', icon: Activity },
    { title: 'Resultados Fin.', tipo: 'gasto_financiero', icon: Target },
    { title: 'Impuestos', tipo: 'impuesto', icon: Landmark },
    { title: 'Depreciación', tipo: 'depreciacion', icon: Tag },
    { title: 'Activos', tipo: 'activo', icon: Wallet },
    { title: 'Pasivos', tipo: 'pasivo', icon: Briefcase },
    { title: 'Patrimonio', tipo: 'patrimonial', icon: Building2 }
  ];

  const handleMove = (accountId, newType) => {
    dispatch(updateAccount({ id: accountId, tipo: newType }));
  };

  const handleCreate = (e) => {
    e.preventDefault();
    dispatch(addAccount({
      ...newAccount,
      parent_id: newAccount.parent_id ? parseInt(newAccount.parent_id) : null,
      nivel: newAccount.parent_id ? 2 : 1 // simplified level logic
    }));
    setIsAdding(false);
    setNewAccount({ nombre: '', tipo: 'gasto_operativo', codigo: '', parent_id: '', visible_en_pnl: true, visible_en_cf: true });
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontWeight: 800 }}>Estructura del Plan de Cuentas</h2>
          <p style={{ color: 'var(--text-faint)', fontSize: '0.8125rem' }}>Organiza tus categorías financieras por naturaleza contable</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAdding(true)}>+ Nueva Cuenta</button>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', 
        gap: '1.25rem',
        alignItems: 'start'
      }}>
        {sectionsList.map(section => (
          <div key={section.title} className="coa-column" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.5rem',
              borderBottom: '2px solid var(--border-color)',
              marginBottom: '0.5rem'
            }}>
              <section.icon size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{section.title}</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {accounts.filter(a => a.tipo === section.tipo && !a.parent_id).map(parent => (
                <div key={parent.id} className="data-card" style={{ padding: '0.75rem', boxShadow: 'none', border: '1px solid var(--border-color)', background: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-faint)' }}>{parent.codigo}</span>
                    <select 
                      style={{ width: 'auto', border: 'none', fontSize: '0.6rem', padding: '2px', background: 'transparent', cursor: 'pointer', opacity: 0.7 }}
                      value={parent.tipo}
                      onChange={(e) => handleMove(parent.id, e.target.value)}
                    >
                      {sectionsList.map(s => <option key={s.tipo} value={s.tipo}>{s.title}</option>)}
                    </select>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>{parent.nombre}</div>
                  
                  {accounts.filter(child => child.parent_id === parent.id).length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderTop: '1px solid #f1f1f1', paddingTop: '0.5rem' }}>
                      {accounts.filter(child => child.parent_id === parent.id).map(child => (
                        <div key={child.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>{child.nombre}</span>
                          <select 
                             style={{ width: 'auto', border: 'none', fontSize: '0.55rem', padding: '0', background: 'transparent', opacity: 0.5 }}
                             value={child.tipo}
                             onChange={(e) => handleMove(child.id, e.target.value)}
                          >
                            {sectionsList.map(s => <option key={s.tipo} value={s.tipo}>{s.title}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {isAdding && (
        <Modal isOpen={isAdding} onClose={() => setIsAdding(false)} title="Nueva Cuenta G.L.">
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="form-section-label">Nombre de Cuenta</label>
              <input type="text" className="search-input" value={newAccount.nombre} onChange={e => setNewAccount({...newAccount, nombre: e.target.value})} required />
            </div>
            <div>
              <label className="form-section-label">Código</label>
              <input type="text" className="search-input" value={newAccount.codigo} onChange={e => setNewAccount({...newAccount, codigo: e.target.value})} />
            </div>
            <div>
              <label className="form-section-label">Naturaleza (Clasificación P&L / Balance)</label>
              <select className="search-input" value={newAccount.tipo} onChange={e => setNewAccount({...newAccount, tipo: e.target.value})}>
                {sectionsList.map(s => <option key={s.tipo} value={s.tipo}>{s.title}</option>)}
              </select>
            </div>
            <div>
              <label className="form-section-label">Cuenta Agrupadora (Opcional)</label>
              <select className="search-input" value={newAccount.parent_id} onChange={e => setNewAccount({...newAccount, parent_id: e.target.value})}>
                <option value="">— Ninguna (Nivel 1) —</option>
                {accounts.filter(a => !a.parent_id && a.tipo === newAccount.tipo).map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
              </select>
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', height: 48 }}>Crear Cuenta</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Cajas() {
  const bankAccounts = useSelector(state => state.bankAccounts.items);
  const txs = useSelector(state => state.transactions.items);
  const companies = useSelector(state => state.company.companies);
  const dispatch = useDispatch();
  const [isAdding, setIsAdding] = useState(false);
  const [nuevaCaja, setNuevaCaja] = useState({ nombre: '', tipo: 'Banco', company_id: '', saldo_inicial: 0, moneda: 'ARS' });

  useEffect(() => {
    if (companies.length > 0 && !nuevaCaja.company_id) {
      setNuevaCaja(prev => ({ ...prev, company_id: companies[0].id }));
    }
  }, [companies, nuevaCaja.company_id]);

  return (
    <div className="animate-fade-in">
       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h2>Configuración de Cajas y Bóvedas</h2>
          <p style={{ color: 'var(--text-faint)', fontSize: '0.8125rem' }}>Gestione las cuentas bancarias y cajas chicas de cada empresa</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAdding(true)}>+ Crear Nueva Caja</button>
      </div>

      {companies.map(comp => {
        const compAccounts = bankAccounts.filter(b => b.company_id === comp.id);
        if (compAccounts.length === 0) return null;

        return (
          <div key={comp.id} style={{ marginBottom: '2.5rem' }}>
            <h3 style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
              {comp.nombre}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
              {compAccounts.map(b => {
                const txsForAccount = txs.filter(t => t.cuenta_bancaria_id === b.id);
                const saldo = txsForAccount.reduce((s, t) => t.tipo === 'ingreso' ? s + (t.monto || 0) : s - (t.monto || 0), b.saldo_inicial || 0);
                return (
                  <div key={b.id} className="data-card hover-glow">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-faint)', fontWeight: 600 }}>{b.tipo.toUpperCase()}</span>
                      <button onClick={() => { if(window.confirm('¿Eliminar esta caja?')) dispatch(deleteBankAccount(b.id)) }} style={{ color: 'var(--text-faint)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={14}/></button>
                    </div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-main)' }}>{b.nombre}</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-green)', letterSpacing: '-0.02em' }}>
                      {b.moneda === 'USD' ? 'u$d' : '$'} {saldo.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {isAdding && (
         <Modal isOpen={isAdding} onClose={() => setIsAdding(false)} title="Nueva Entidad de Fondos">
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }} onSubmit={e=>{
            e.preventDefault();
            dispatch(addBankAccount({...nuevaCaja, id: Date.now(), company_id: parseInt(nuevaCaja.company_id)}));
            setIsAdding(false);
          }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Nombre de la Cuenta</label>
              <input type="text" placeholder="Ej: Banco Galicia Operativa" className="search-input" value={nuevaCaja.nombre} onChange={e=>setNuevaCaja({...nuevaCaja, nombre: e.target.value})} required style={{ width: '100%', height: '42px' }}/>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Tipo</label>
                <select className="search-input" style={{ width: '100%', height: '42px' }} value={nuevaCaja.tipo} onChange={e=>setNuevaCaja({...nuevaCaja, tipo: e.target.value})}>
                  <option value="Banco">Banco</option>
                  <option value="Virtual">Billetera Virtual</option>
                  <option value="Caja Chica">Caja Chica</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Moneda</label>
                <select className="search-input" style={{ width: '100%', height: '42px' }} value={nuevaCaja.moneda} onChange={e=>setNuevaCaja({...nuevaCaja, moneda: e.target.value})}>
                  <option value="ARS">ARS (Pesos)</option>
                  <option value="USD">USD (Dólares)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Empresa Asignada</label>
              <select className="search-input" style={{ width: '100%', height: '42px' }} value={nuevaCaja.company_id} onChange={e=>setNuevaCaja({...nuevaCaja, company_id: e.target.value})} required>
                {companies.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>Saldo Inicial</label>
              <input type="number" placeholder="0.00" className="search-input" style={{ width: '100%', height: '42px' }} value={nuevaCaja.saldo_inicial} onChange={e=>setNuevaCaja({...nuevaCaja, saldo_inicial: parseFloat(e.target.value)||0})} />
            </div>

            <button className="btn btn-primary" type="submit" style={{ height: '48px', marginTop: '0.5rem', fontSize: '0.95rem' }}>Habilitar Fondos</button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function CuentasAP() {
  const txs = useSelector(state => state.transactions.items);
  const today = new Date().toISOString().split('T')[0];

  // AR = ingresos con fecha_factura < hoy y sin fecha_pago o fecha_pago > hoy
  const cuentasCobrar = useMemo(() => txs.filter(t =>
    t.tipo === 'ingreso' &&
    t.fecha_factura && t.fecha_factura < today &&
    (!t.fecha_pago || t.fecha_pago > today) &&
    t.cuenta_id !== 999
  ), [txs, today]);

  // AP = egresos con fecha_factura < hoy y sin fecha_pago o fecha_pago > hoy
  const cuentasPagar = useMemo(() => txs.filter(t =>
    (t.tipo === 'egreso' || t.tipo === 'gasto') &&
    t.fecha_factura && t.fecha_factura < today &&
    (!t.fecha_pago || t.fecha_pago > today) &&
    t.cuenta_id !== 999
  ), [txs, today]);

  const comprometidas = (list) => list.filter(t => t.fecha_pago && t.fecha_pago > today);
  const sinFecha     = (list) => list.filter(t => !t.fecha_pago);

  const totalAR = cuentasCobrar.reduce((s, t) => s + (t.monto || 0), 0);
  const totalAP = cuentasPagar.reduce((s, t) => s + (t.monto || 0), 0);

  // Pie chart data - top clients (AR) and providers (AP)
  const buildPieData = (list) => {
    const byContact = {};
    list.forEach(t => {
      const k = t.cliente_proveedor || 'Sin nombre';
      byContact[k] = (byContact[k] || 0) + (t.monto || 0);
    });
    const sorted = Object.entries(byContact).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const total = sorted.reduce((s, [, v]) => s + v, 0);
    return { sorted, total };
  };

  const COLORS = ['#2563eb','#059669','#d97706','#dc2626','#7c3aed','#0284c7'];

  const PieChart = ({ data, label, color }) => {
    const { sorted, total } = data;
    if (sorted.length === 0) return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, color:'var(--text-faint)', fontSize:'0.85rem' }}>
        Sin datos
      </div>
    );
    let cumulative = 0;
    const slices = sorted.map(([name, val], i) => {
      const pct = val / total;
      const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
      cumulative += pct;
      const endAngle = cumulative * 2 * Math.PI - Math.PI / 2;
      const r = 80;
      const cx = 100; const cy = 100;
      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);
      const large = pct > 0.5 ? 1 : 0;
      return { path: `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`, color: COLORS[i % COLORS.length], name, val, pct };
    });
    return (
      <div style={{ display:'flex', gap:'1.5rem', alignItems:'center' }}>
        <svg width="200" height="200" viewBox="0 0 200 200">
          {slices.map((s, i) => <path key={i} d={s.path} fill={s.color} stroke="#fff" strokeWidth="2" />)}
          <circle cx="100" cy="100" r="45" fill="white" />
          <text x="100" y="96" textAnchor="middle" fontSize="10" fontWeight="700" fill="#334155">{label}</text>
          <text x="100" y="110" textAnchor="middle" fontSize="9" fill="#64748b">${Math.round(total/1000)}k total</text>
        </svg>
        <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
          {slices.map((s, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.75rem' }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:s.color, flexShrink:0 }} />
              <span style={{ color:'var(--text-main)', fontWeight:600 }}>{s.name}</span>
              <span style={{ color:'var(--text-faint)', marginLeft:'auto' }}>${s.val.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const ListSection = ({ title, rows, amountKey, totalLabel }) => {
    const comp = comprometidas(rows);
    const sin  = sinFecha(rows);
    const totalComp = comp.reduce((s,t) => s+(t.monto||0), 0);
    const totalSin  = sin.reduce((s,t)  => s+(t.monto||0), 0);

    const RowGroup = ({ items, groupLabel, groupTotal }) => (
      <>
        <tr style={{ background:'rgba(0,0,0,0.025)' }}>
          <td colSpan={4} style={{ padding:'0.5rem 1rem', fontWeight:800, fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-sub)' }}>
            {groupLabel}
          </td>
          <td style={{ textAlign:'right', padding:'0.5rem 1rem', fontWeight:800, color:'var(--primary)', fontSize:'0.85rem' }}>
            ${groupTotal.toLocaleString()}
          </td>
        </tr>
        {items.length === 0 && (
          <tr><td colSpan={5} style={{ textAlign:'center', color:'var(--text-faint)', padding:'0.75rem', fontSize:'0.8rem' }}>Sin registros</td></tr>
        )}
        {items.map(t => (
          <tr key={t.id}>
            <td style={{ paddingLeft:'1.5rem', fontWeight:600, fontSize:'0.8rem' }}>{t.cliente_proveedor || '-'}</td>
            <td style={{ fontSize:'0.78rem', color:'var(--text-faint)' }}>{t.descripcion}</td>
            <td className="numeric" style={{ color:'var(--text-faint)', fontSize:'0.78rem' }}>{t.fecha_factura}</td>
            <td className="numeric" style={{ color: t.fecha_pago ? 'var(--accent-amber)' : 'var(--accent-red)', fontSize:'0.78rem', fontWeight:600 }}>
              {t.fecha_pago || '⚠ Sin fecha'}
            </td>
            <td className="numeric" style={{ fontWeight:700, textAlign:'right' }}>${(t.monto||0).toLocaleString()}</td>
          </tr>
        ))}
      </>
    );

    return (
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ marginBottom:'1rem', display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
          <h3 style={{ fontWeight:800, margin:0 }}>{title}</h3>
          <span style={{ fontSize:'1.1rem', fontWeight:900, color:'var(--primary)' }}>${rows.reduce((s,t)=>s+(t.monto||0),0).toLocaleString()}</span>
        </div>
        <div className="data-card" style={{ padding:0 }}>
          <table className="grid-table" style={{ fontSize:'0.8rem' }}>
            <thead>
              <tr>
                <th>{amountKey === 'cobrar' ? 'Cliente' : 'Proveedor'}</th>
                <th>Descripción</th>
                <th style={{ textAlign:'right' }}>F. Factura</th>
                <th style={{ textAlign:'right' }}>F. Pago</th>
                <th style={{ textAlign:'right' }}>Monto</th>
              </tr>
            </thead>
            <tbody>
              <RowGroup items={comp} groupLabel={`Comprometidas (con fecha futura)`} groupTotal={totalComp} />
              <RowGroup items={sin}  groupLabel={`Sin fecha de cobro/pago`} groupTotal={totalSin} />
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom:'2rem' }}>
        <h2 style={{ fontWeight:800 }}>Cuentas a Cobrar &amp; Pagar</h2>
        <p style={{ color:'var(--text-faint)', fontSize:'0.8125rem' }}>Deuda comercial pendiente · Fecha factura anterior a hoy · Pago no registrado o futuro</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem', marginBottom:'2rem' }}>
        <div className="data-card" style={{ borderLeft:'4px solid #059669', padding:'1.2rem' }}>
          <div style={{ fontSize:'0.7rem', fontWeight:800, color:'var(--text-faint)', textTransform:'uppercase', marginBottom:'0.5rem' }}>Total a Cobrar (AR)</div>
          <div style={{ fontSize:'2rem', fontWeight:900, color:'#059669' }}>${totalAR.toLocaleString()}</div>
          <div style={{ fontSize:'0.75rem', color:'var(--text-faint)', marginTop:'0.3rem' }}>{cuentasCobrar.length} facturas pendientes</div>
        </div>
        <div className="data-card" style={{ borderLeft:'4px solid #dc2626', padding:'1.2rem' }}>
          <div style={{ fontSize:'0.7rem', fontWeight:800, color:'var(--text-faint)', textTransform:'uppercase', marginBottom:'0.5rem' }}>Total a Pagar (AP)</div>
          <div style={{ fontSize:'2rem', fontWeight:900, color:'#dc2626' }}>${totalAP.toLocaleString()}</div>
          <div style={{ fontSize:'0.75rem', color:'var(--text-faint)', marginTop:'0.3rem' }}>{cuentasPagar.length} obligaciones pendientes</div>
        </div>
        <div className="data-card" style={{ borderLeft:'4px solid var(--primary)', padding:'1.2rem' }}>
          <div style={{ fontSize:'0.7rem', fontWeight:800, color:'var(--text-faint)', textTransform:'uppercase', marginBottom:'0.5rem' }}>Posición Neta</div>
          <div style={{ fontSize:'2rem', fontWeight:900, color: (totalAR - totalAP) >= 0 ? '#059669' : '#dc2626' }}>${(totalAR - totalAP).toLocaleString()}</div>
          <div style={{ fontSize:'0.75rem', color:'var(--text-faint)', marginTop:'0.3rem' }}>{(totalAR - totalAP) >= 0 ? 'Capital comercial neto positivo' : 'Alerta: más deudas que cobros'}</div>
        </div>
      </div>

      {/* Pie Charts */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', marginBottom:'2rem' }}>
        <div className="data-card">
          <div className="card-header" style={{ marginBottom:'1rem' }}><h3 className="card-title">Exposición por Cliente (AR)</h3></div>
          <PieChart data={buildPieData(cuentasCobrar)} label="Cobrar" color="#059669" />
        </div>
        <div className="data-card">
          <div className="card-header" style={{ marginBottom:'1rem' }}><h3 className="card-title">Exposición por Proveedor (AP)</h3></div>
          <PieChart data={buildPieData(cuentasPagar)} label="Pagar" color="#dc2626" />
        </div>
      </div>

      {/* Detail Tables side by side */}
      <div style={{ display:'flex', gap:'1.5rem', alignItems:'flex-start' }}>
        <ListSection title="Cuentas a Cobrar" rows={cuentasCobrar} amountKey="cobrar" totalLabel="Total AR" />
        <ListSection title="Cuentas a Pagar"  rows={cuentasPagar}  amountKey="pagar"  totalLabel="Total AP" />
      </div>
    </div>
  );
}

function ExchangeRateManager() {
  const rates = useSelector(state => state.exchangeRates.items);
  const dispatch = useDispatch();
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  
  const [formEntry, setFormEntry] = useState({
    year: new Date().getFullYear().toString(),
    month: String(new Date().getMonth() + 1).padStart(2, '0'),
    rate: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  const yearsRange = ['2024', '2025', '2026', '2027', '2028', '2029', '2030'];
  const monthNames = [
    { v: '01', n: 'ENERO' }, { v: '02', n: 'FEBRERO' }, { v: '03', n: 'MARZO' },
    { v: '04', n: 'ABRIL' }, { v: '05', n: 'MAYO' }, { v: '06', n: 'JUNIO' },
    { v: '07', n: 'JULIO' }, { v: '08', n: 'AGOSTO' }, { v: '09', n: 'SEPTIEMBRE' },
    { v: '10', n: 'OCTUBRE' }, { v: '11', n: 'NOVIEMBRE' }, { v: '12', n: 'DICIEMBRE' }
  ];

  const sortedMonths = Object.keys(rates)
    .filter(m => m.startsWith(filterYear))
    .sort()
    .reverse();

  const handleEdit = (m, val) => {
    const [y, mm] = m.split('-');
    setFormEntry({ year: y, month: mm, rate: val });
    setIsEditing(true);
  };

  const handleSave = () => {
    const monthKey = `${formEntry.year}-${formEntry.month}`;
    if (formEntry.rate) {
      dispatch(setRate({ month: monthKey, rate: parseFloat(formEntry.rate) }));
      setFormEntry({ ...formEntry, rate: '' });
      setIsEditing(false);
    }
  };

  const handleDiscard = () => {
    setFormEntry({ ...formEntry, rate: '' });
    setIsEditing(false);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontWeight: 800 }}>Tipo de Cambio ARS/USD</h2>
          <p style={{ color: 'var(--text-faint)', fontSize: '0.8125rem' }}>Gestione el tipo de cambio mensual para la conversión de reportes P&L y Cash Flow</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
           <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-faint)' }}>FILTRAR AÑO</span>
           <select className="search-input" value={filterYear} onChange={e => setFilterYear(e.target.value)} style={{ width: '120px', height: '36px' }}>
              {yearsRange.map(y => <option key={y} value={y}>{y}</option>)}
           </select>
        </div>
      </div>
      
      <div className="data-card" style={{ maxWidth: '800px', marginBottom: '2rem', background: '#fff', borderLeft: isEditing ? '4px solid var(--primary)' : '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 className="card-title" style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>
            {isEditing ? `Editando TC: ${formEntry.year}-${formEntry.month}` : 'Cargar / Actualizar Tipo de Cambio'}
          </h3>
          {isEditing && (
            <button style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600 }} onClick={handleDiscard}>DESCARTAR CAMBIOS</button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ width: '120px' }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem', color: 'var(--text-faint)' }}>AÑO</label>
            <select 
              className="search-input" 
              value={formEntry.year} 
              onChange={e => setFormEntry({...formEntry, year: e.target.value})} 
              style={{ background: 'var(--bg-base)', width: '100%', height: '42px' }}
              disabled={isEditing}
            >
              {yearsRange.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem', color: 'var(--text-faint)' }}>MES</label>
            <select 
              className="search-input" 
              value={formEntry.month} 
              onChange={e => setFormEntry({...formEntry, month: e.target.value})} 
              style={{ background: 'var(--bg-base)', width: '100%', height: '42px' }}
              disabled={isEditing}
            >
              {monthNames.map(m => <option key={m.v} value={m.v}>{m.n}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: '0.7rem', fontWeight: 700, display: 'block', marginBottom: '0.5rem', color: 'var(--text-faint)' }}>VALOR ARS X 1 USD</label>
            <input 
              type="number" 
              placeholder="Ej: 1050" 
              className="search-input" 
              value={formEntry.rate} 
              onChange={e => setFormEntry({...formEntry, rate: e.target.value})} 
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              style={{ background: 'var(--bg-base)', width: '100%', height: '42px', fontWeight: 700, fontSize: '1.1rem' }} 
            />
          </div>
          <button className="btn btn-primary" style={{ height: '42px', minWidth: '150px', fontWeight: 700 }} onClick={handleSave}>
            {isEditing ? 'ACTUALIZAR TC' : 'GUARDAR / SOBREESCRIBIR'}
          </button>
        </div>
        {!isEditing && (
           <p style={{ fontSize: '0.65rem', color: 'var(--text-faint)', marginTop: '0.75rem' }}>* Si selecciona un mes que ya tiene datos, el valor se sobreescribirá.</p>
        )}
      </div>

      <div className="data-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="grid-table">
          <thead>
            <tr style={{ background: 'var(--bg-base)' }}>
              <th style={{ padding: '1rem' }}>Período</th>
              <th style={{ textAlign: 'right', padding: '1rem' }}>Tipo de Cambio (ARS)</th>
              <th style={{ textAlign: 'center', width: '140px', padding: '1rem' }}>Operaciones</th>
            </tr>
          </thead>
          <tbody>
            {sortedMonths.length === 0 ? (
               <tr><td colSpan="3" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-faint)' }}>No hay tipos de cambio registrados para el año {filterYear}</td></tr>
            ) : sortedMonths.map(m => {
              const val = rates[m];
              if (val === null || val === undefined) return null;
              return (
                <tr key={m} style={{ background: (isEditing && formEntry.year + '-' + formEntry.month === m) ? 'rgba(37, 99, 235, 0.05)' : 'transparent' }}>
                  <td style={{ fontWeight: 600, padding: '1rem' }}>
                    {monthNames.find(mn => mn.v === m.split('-')[1])?.n} {m.split('-')[0]}
                  </td>
                  <td className="numeric" style={{ textAlign: 'right', fontWeight: 800, color: 'var(--text-main)', fontSize: '1.1rem', padding: '1rem' }}>
                    $ {val.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ textAlign: 'center', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                      <button className="btn hover-glow" style={{ padding: '0.4rem', color: 'var(--primary)', background: 'rgba(37,99,235,0.1)', border: 'none', borderRadius: '4px' }} title="Editar" onClick={() => handleEdit(m, val)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="btn hover-glow" style={{ padding: '0.4rem', color: 'var(--accent-red)', background: 'rgba(220,38,38,0.1)', border: 'none', borderRadius: '4px' }} title="Eliminar" onClick={() => { if(window.confirm(`¿Seguro que desea eliminar el TC de ${m}?`)) dispatch(setRate({ month: m, rate: null })) }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UsersManagement() {
  const dispatch = useDispatch();
  const users = useSelector(state => state.users.users);
  const companies = useSelector(state => state.company.companies);
  const bankAccounts = useSelector(state => state.bankAccounts.items);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    email: '',
    name: '',
    isRoot: false,
    allowedCompanies: [],
    allowedAccounts: []
  });

  const handleCreate = (e) => {
    e.preventDefault();
    const payload = {
      id: editingId || Date.now(),
      email: form.email,
      name: form.name,
      permissions: {
        isRoot: form.isRoot,
        allowedCompanies: form.allowedCompanies,
        allowedAccounts: form.allowedAccounts
      }
    };
    if (editingId) dispatch(updateUser(payload));
    else dispatch(addUser(payload));
    setIsAdding(false);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ email: '', name: '', isRoot: false, allowedCompanies: [], allowedAccounts: [] });
    setIsAdding(true);
  };

  const toggleCompany = (cId) => {
    setForm(prev => {
      const arr = prev.allowedCompanies.includes(cId) ? prev.allowedCompanies.filter(x => x !== cId) : [...prev.allowedCompanies, cId];
      return { ...prev, allowedCompanies: arr };
    });
  };

  const toggleAccount = (aId) => {
    setForm(prev => {
      const arr = prev.allowedAccounts.includes(aId) ? prev.allowedAccounts.filter(x => x !== aId) : [...prev.allowedAccounts, aId];
      return { ...prev, allowedAccounts: arr };
    });
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontWeight: 800 }}>Gestión de Usuarios y Accesos</h2>
          <p style={{ color: 'var(--text-faint)', fontSize: '0.8125rem' }}>Controla los permisos de imputación de caja y visibilidad de empresas</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Nuevo Usuario</button>
      </div>

      <div className="data-card" style={{ padding: 0 }}>
        <table className="grid-table">
          <thead>
            <tr style={{ background: 'var(--bg-base)' }}>
              <th>Nombre & Email</th>
              <th>Rol (Acceso Base)</th>
              <th>Alcance de Imputación</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ fontWeight: 700 }}>{u.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)' }}>{u.email}</div>
                </td>
                <td>
                  {u.permissions?.isRoot ? (
                     <span style={{ fontSize: '0.7rem', background: 'rgba(5,150,105,0.1)', color: '#059669', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>Admin Global (Root)</span>
                  ) : (
                     <span style={{ fontSize: '0.7rem', background: 'rgba(37,99,235,0.1)', color: '#2563eb', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>Restringido (Caja/Empresa)</span>
                  )}
                </td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>
                  {u.permissions?.isRoot ? 'Todas las empresas y cajas' : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span><strong>Empresas:</strong> {u.permissions?.allowedCompanies.length > 0 ? companies.filter(c => u.permissions.allowedCompanies.includes(c.id)).map(c => c.nombre).join(', ') : 'Ninguna'}</span>
                      <span><strong>Cajas:</strong> {u.permissions?.allowedAccounts.length > 0 ? bankAccounts.filter(b => u.permissions.allowedAccounts.includes(b.id)).map(b => b.nombre).join(', ') : 'Ninguna'}</span>
                    </div>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button className="btn" style={{ marginRight: 6, padding: '0.2rem 0.5rem', background: '#f3f4f6', color: '#374151' }} onClick={() => {
                    setEditingId(u.id);
                    setForm({ email: u.email, name: u.name, isRoot: u.permissions?.isRoot||false, allowedCompanies: u.permissions?.allowedCompanies||[], allowedAccounts: u.permissions?.allowedAccounts||[] });
                    setIsAdding(true);
                  }}>
                    <Edit2 size={12} />
                  </button>
                  <button className="btn" style={{ padding: '0.2rem 0.5rem', background: '#fee2e2', color: '#dc2626' }} onClick={() => { if (window.confirm('¿Eliminar usuario?')) dispatch(deleteUser(u.id)); }}>
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAdding && (
        <Modal isOpen={isAdding} onClose={() => setIsAdding(false)} title={editingId ? "Editar Usuario" : "Nuevo Usuario"}>
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label className="form-section-label">Nombre Completo</label>
                <input className="search-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required style={{ width: '100%' }} />
              </div>
              <div>
                <label className="form-section-label">Correo (Login Email)</label>
                <input type="email" className="search-input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required style={{ width: '100%' }} />
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: 700, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                <input type="checkbox" checked={form.isRoot} onChange={e => setForm({...form, isRoot: e.target.checked})} style={{ width: 'auto' }} />
                Es Administrador Global (Acceso a TODO)
              </label>
              <p style={{ margin: '0.25rem 0 0 1.5rem', fontSize: '0.75rem', color: 'var(--text-faint)' }}>Otorga acceso sin restricciones a todas las empresas, cajas y configuración.</p>
            </div>

            {!form.isRoot && (
              <>
                <div>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    1. Permisos: Empresas Operativas (Visualización & P&L)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {companies.map(c => (
                      <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                        <input type="checkbox" style={{ width: 'auto' }} checked={form.allowedCompanies.includes(c.id)} onChange={() => toggleCompany(c.id)} />
                        {c.nombre}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                    2. Permisos: Cajas y Cuentas Bancarias (Imputación CashFlow)
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {bankAccounts.map(b => (
                      <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}>
                        <input type="checkbox" style={{ width: 'auto' }} checked={form.allowedAccounts.includes(b.id)} onChange={() => toggleAccount(b.id)} />
                        {b.nombre} ({b.moneda})
                      </label>
                    ))}
                  </div>
                </div>
              </>
            )}

            <button type="submit" className="btn btn-primary" style={{ height: 48, marginTop: '1rem', fontSize: '0.9rem' }}>
              {editingId ? "Guardar Cambios" : "Crear Usuario"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}


function App() {
  const dispatch = useDispatch();
  const { user, loading } = useSelector(state => state.auth);
  
  const { currentCompanyId, companies } = useSelector(state => state.company);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  
  const rates = useSelector(state => state.exchangeRates.items);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) dispatch(setUser(session.user));
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) dispatch(setUser(session.user));
      else dispatch(setUser(null));
    });

    if (!currentCompanyId && companies.length > 0) {
      dispatch(setCurrentCompany(companies[0].id));
    }

    return () => subscription.unsubscribe();
  }, [dispatch, currentCompanyId, companies]);

  const getRateForDate = (dateStr) => {
    if (!dateStr) return rates['2026-03'] || 860;
    const month = dateStr.substring(0, 7);
    return rates[month] || rates['2026-03'] || 860;
  };

  const convertToUSD = (amount, currency, date, customTC) => {
    if (currency === 'USD') return amount;
    const rate = customTC || getRateForDate(date);
    return amount / rate;
  };

  const unidades = useSelector(state => state.company.businessUnits);

  if (loading) return <div className="login-screen"><div className="login-card">Cargando...</div></div>;
  if (!user) return <Login />;

  return (
    <div className="app-container">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed} 
        user={user}
      />
      <div className="main-content">
        <header className="header-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <div className="header-search" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', background: 'var(--bg-card)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', width: '400px' }}>
            <Search size={16} color="var(--text-faint)" />
            <input type="text" placeholder="Buscar..." style={{ background: 'transparent', border: 'none', width: '100%' }} />
          </div>
          <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }} onClick={() => { if(window.confirm('¿Cerrar sesión?')) supabase.auth.signOut().then(() => dispatch(logout())); }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{user.user_metadata?.full_name || user.email}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>CFO @ {companies.find(c => c.id === currentCompanyId)?.nombre || 'Holding'}</div>
            </div>
            <div style={{ width: 36, height: 36, background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
               {(user.user_metadata?.full_name || 'U').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div style={{ maxWidth: ['transactions', 'cashflow', 'presupuesto', 'ar_ap', 'revenue'].includes(activeTab) ? '100%' : '1440px', margin: '0 auto', transition: 'max-width 0.3s ease' }}>
          {activeTab === 'companies' && <CompanyManagement />}
          {activeTab === 'users' && <UsersManagement />}
          {activeTab === 'clients' && <ClientsManagement />}
          {activeTab === 'dashboard' && <Dashboard convertToUSD={convertToUSD} />}
          {activeTab === 'transactions' && <TransactionsCore unidades={unidades} selectedTx={selectedTx} setSelectedTx={setSelectedTx} getRateForDate={getRateForDate} userPerms={user.permissions} />}
          {activeTab === 'pnl' && <PnLReport convertToUSD={convertToUSD} />}
          {activeTab === 'revenue' && <RevenueRecognition convertToUSD={convertToUSD} />}
          {activeTab === 'cashflow' && <CashFlow onSelectTransaction={(tx) => { setSelectedTx(tx); setActiveTab('transactions'); }} getRate={getRateForDate} />}
          {activeTab === 'presupuesto' && <Presupuesto unidades={unidades} />}
          {activeTab === 'ar_ap' && <CuentasAP />}
          {activeTab === 'accounts' && <AccountManagement />}
          {activeTab === 'rates' && <ExchangeRateManager />}
          {activeTab === 'cajas' && <Cajas unidades={unidades} />}
          
          {!['dashboard', 'transactions', 'pnl', 'revenue', 'cashflow', 'presupuesto', 'ar_ap', 'accounts', 'rates', 'cajas', 'companies', 'clients', 'users'].includes(activeTab) && (
            <div className="data-card" style={{ textAlign: 'center', padding: '5rem' }}>
              <Activity size={48} color="var(--primary)" style={{ marginBottom: '1.5rem', opacity: 0.5 }} />
              <h3>Módulo en Construcción</h3>
              <p style={{ color: 'var(--text-faint)' }}>Estamos trabajando para traerte esta vista muy pronto.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
