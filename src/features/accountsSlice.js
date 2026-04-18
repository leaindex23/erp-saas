import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [
    // === 1. INGRESOS OPERATIVOS ===
    { id: 10, codigo: '1.0', nombre: 'Ingresos Operativos',         tipo: 'ingreso',          parent_id: null, nivel: 1, visible_en_pnl: true, visible_en_cf: true },
    { id: 11, codigo: '1.1', nombre: 'Ventas de Productos',         tipo: 'ingreso',          parent_id: 10,   nivel: 2, visible_en_pnl: true, visible_en_cf: true },
    { id: 12, codigo: '1.2', nombre: 'Ventas de Servicios / SaaS',  tipo: 'ingreso',          parent_id: 10,   nivel: 2, visible_en_pnl: true, visible_en_cf: true },
    { id: 13, codigo: '1.3', nombre: 'Consultoría / Setup',         tipo: 'ingreso',          parent_id: 10,   nivel: 2, visible_en_pnl: true, visible_en_cf: true },

    // === 2. COSTOS DIRECTOS (COGS) ===
    { id: 20, codigo: '2.0', nombre: 'Costos Directos (COGS)',      tipo: 'costo_directo',    parent_id: null, nivel: 1, visible_en_pnl: true, visible_en_cf: true },
    { id: 21, codigo: '2.1', nombre: 'Costo de Mercadería',         tipo: 'costo_directo',    parent_id: 20,   nivel: 2, visible_en_pnl: true, visible_en_cf: true },
    { id: 22, codigo: '2.2', nombre: 'Costos de Hosting / Nube',    tipo: 'costo_directo',    parent_id: 20,   nivel: 2, visible_en_pnl: true, visible_en_cf: true },
    { id: 23, codigo: '2.3', nombre: 'Comisiones a Terceros',       tipo: 'costo_directo',    parent_id: 20,   nivel: 2, visible_en_pnl: true, visible_en_cf: true },

    // === 3. GASTOS OPERATIVOS (SGA) ===
    { id: 30, codigo: '3.0', nombre: 'Gastos Operativos (SGA)',     tipo: 'gasto_operativo',  parent_id: null, nivel: 1, visible_en_pnl: true, visible_en_cf: true },
    { id: 31, codigo: '3.1', nombre: 'Recursos Humanos / Nómina',   tipo: 'gasto_operativo',  parent_id: 30,   nivel: 2, visible_en_pnl: true, visible_en_cf: true },
    { id: 311, codigo: '3.1.1', nombre: 'Sueldos y Cargas Soc.',    tipo: 'gasto_operativo',  parent_id: 31,   nivel: 3, visible_en_pnl: true, visible_en_cf: true },
    { id: 312, codigo: '3.1.2', nombre: 'Beneficios',               tipo: 'gasto_operativo',  parent_id: 31,   nivel: 3, visible_en_pnl: true, visible_en_cf: true },
    { id: 32, codigo: '3.2', nombre: 'Ventas y Marketing',          tipo: 'gasto_operativo',  parent_id: 30,   nivel: 2, visible_en_pnl: true, visible_en_cf: true },
    { id: 321, codigo: '3.2.1', nombre: 'Publicidad / Ads',         tipo: 'gasto_operativo',  parent_id: 32,   nivel: 3, visible_en_pnl: true, visible_en_cf: true },
    { id: 33, codigo: '3.3', nombre: 'Gastos Generales (G&A)',      tipo: 'gasto_operativo',  parent_id: 30,   nivel: 2, visible_en_pnl: true, visible_en_cf: true },
    { id: 331, codigo: '3.3.1', nombre: 'Alquiler y Expensas',      tipo: 'gasto_operativo',  parent_id: 33,   nivel: 3, visible_en_pnl: true, visible_en_cf: true },
    { id: 332, codigo: '3.3.2', nombre: 'Honorarios Profesionales', tipo: 'gasto_operativo',  parent_id: 33,   nivel: 3, visible_en_pnl: true, visible_en_cf: true },
    { id: 333, codigo: '3.3.3', nombre: 'Suscripciones y Software', tipo: 'gasto_operativo',  parent_id: 33,   nivel: 3, visible_en_pnl: true, visible_en_cf: true },

    // === 4. DEPRECIACIÓN Y AMORTIZACIÓN ===
    { id: 40, codigo: '4.0', nombre: 'Depreciación y Amort.',       tipo: 'depreciacion',     parent_id: null, nivel: 1, visible_en_pnl: true, visible_en_cf: false },

    // === 5. GASTOS FINANCIEROS Y OTROS ===
    { id: 50, codigo: '5.0', nombre: 'Resultados Financieros',      tipo: 'gasto_financiero', parent_id: null, nivel: 1, visible_en_pnl: true, visible_en_cf: true },
    { id: 51, codigo: '5.1', nombre: 'Intereses Pagados',           tipo: 'gasto_financiero', parent_id: 50,   nivel: 2, visible_en_pnl: true, visible_en_cf: true },
    { id: 52, codigo: '5.2', nombre: 'Comisiones Bancarias',        tipo: 'gasto_financiero', parent_id: 50,   nivel: 2, visible_en_pnl: true, visible_en_cf: true },
    { id: 53, codigo: '5.3', nombre: 'Diferencia de Cambio',        tipo: 'gasto_financiero', parent_id: 50,   nivel: 2, visible_en_pnl: true, visible_en_cf: false },

    // === 6. IMPUESTOS ===
    { id: 60, codigo: '6.0', nombre: 'Impuestos Opertivos y Renta', tipo: 'impuesto',         parent_id: null, nivel: 1, visible_en_pnl: true, visible_en_cf: true },
    { id: 61, codigo: '6.1', nombre: 'Impuesto a las Ganancias',    tipo: 'impuesto',         parent_id: 60,   nivel: 2, visible_en_pnl: true, visible_en_cf: true },
    { id: 62, codigo: '6.2', nombre: 'Ingresos Brutos',             tipo: 'impuesto',         parent_id: 60,   nivel: 2, visible_en_pnl: true, visible_en_cf: true },

    // === ACTIVOS (Balance Sheet) ===
    { id: 100, codigo: 'A.1', nombre: 'Activos',                    tipo: 'activo',           parent_id: null, nivel: 1, visible_en_pnl: false, visible_en_cf: false },
    { id: 101, codigo: 'A.1.1', nombre: 'Caja y Bancos',            tipo: 'activo',           parent_id: 100,  nivel: 2, visible_en_pnl: false, visible_en_cf: true },

    // === PASIVOS (Balance Sheet) ===
    { id: 200, codigo: 'P.1', nombre: 'Pasivos',                    tipo: 'pasivo',           parent_id: null, nivel: 1, visible_en_pnl: false, visible_en_cf: false },

    // === PATRIMONIAL (Balance Sheet) ===
    { id: 300, codigo: 'PN.1', nombre: 'Patrimonio Neto',           tipo: 'patrimonial',      parent_id: null, nivel: 1, visible_en_pnl: false, visible_en_cf: false },
  ],
  status: 'idle',
};

export const accountsSlice = createSlice({
  name: 'accounts',
  initialState,
  reducers: {
    addAccount: (state, action) => {
      // Determinate next ID safely
      const maxId = Math.max(0, ...state.items.map(a => a.id));
      state.items.push({ ...action.payload, id: maxId + 1 });
    },
    updateAccount: (state, action) => {
      const index = state.items.findIndex(a => a.id === action.payload.id);
      if (index !== -1) state.items[index] = { ...state.items[index], ...action.payload };
    },
    removeAccount: (state, action) => {
      state.items = state.items.filter(a => a.id !== action.payload);
    }
  },
});

export const TIPO_COLOR = {
  ingreso:          'var(--accent-green)',
  costo_directo:    '#f97316',   // orange
  gasto_operativo:  'var(--accent-red)',
  depreciacion:     '#9ca3af',   // gray
  gasto_financiero: '#3b82f6',   // blue
  impuesto:         '#8b5cf6',   // purple
  activo:           '#10b981',   // teal
  pasivo:           '#ef4444',   // red
  patrimonial:      '#8b5cf6',
};

export const TIPO_LABEL = {
  ingreso:          'Ingresos Operativos',
  costo_directo:    'Costos Directos (COGS)',
  gasto_operativo:  'Gastos Operativos (Opex)',
  depreciacion:     'Depreciación y Amort.',
  gasto_financiero: 'Gastos Financieros',
  impuesto:         'Impuestos',
  activo:           'Activo (Balance)',
  pasivo:           'Pasivo (Balance)',
  patrimonial:      'Patrimonial (PN)',
};

export const { addAccount, updateAccount, removeAccount } = accountsSlice.actions;
export default accountsSlice.reducer;
