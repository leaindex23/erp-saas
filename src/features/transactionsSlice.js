import { createSlice, createEntityAdapter } from '@reduxjs/toolkit';

const transactionsAdapter = createEntityAdapter();

// Populate initial state with existing mock records
const initialState = transactionsAdapter.getInitialState({
  status: 'idle',
});

const initialTransactions = [
  {
    id: 1,
    fecha_factura: '2026-03-20',
    fecha_pago: '2026-03-25',
    cuenta_id: 20, // Gastos
    subcuenta_id: 23, // Alquiler Oficina
    descripcion: 'Pago Alquiler Oficina (SM 12)',
    monto: 500000,
    monto_neto: 413223,
    iva: 86777,
    moneda: 'ARS',
    tipo: 'egreso',
    cuenta_bancaria_id: 1, // Banco Galicia
    semana: 12,
    año: 2026,
    unidad_negocio: 'Empresa Principal',
    company_id: 1,
    cliente_proveedor: 'Distribuidora Central'
  },
  {
    id: 2,
    fecha_factura: '2026-03-22',
    fecha_pago: '2026-03-27',
    cuenta_id: 10, // Ingresos
    subcuenta_id: 12, // Suscripciones
    descripcion: 'Cobro Suscripciones SaaS (SM 12)',
    monto: 850000,
    monto_neto: 850000,
    iva: 0,
    moneda: 'ARS',
    tipo: 'ingreso',
    cuenta_bancaria_id: 1, // Banco Galicia
    semana: 12,
    año: 2026,
    unidad_negocio: 'Unidad SaaS',
    company_id: 1,
    cliente_proveedor: 'Cliente SaaS Base'
  },
  {
    id: 3,
    fecha_factura: '2026-03-23',
    fecha_pago: '2026-03-28',
    cuenta_id: 20, // Gastos
    subcuenta_id: 22, // Sueldos
    descripcion: 'Adelanto Sueldos (SM 13)',
    monto: 120000,
    monto_neto: 120000,
    iva: 0,
    moneda: 'ARS',
    tipo: 'egreso',
    cuenta_bancaria_id: 2, // Mercado Pago
    semana: 13,
    año: 2026,
    unidad_negocio: 'Empresa Principal',
    company_id: 1,
    cliente_proveedor: 'Personal Interno'
  }
];

export const transactionsSlice = createSlice({
  name: 'transactions',
  initialState: transactionsAdapter.upsertMany(initialState, initialTransactions),
  reducers: {
    addTransaction: transactionsAdapter.addOne,
    updateTransactionWeek: (state, action) => {
      const { id, newWeek } = action.payload;
      const tx = state.entities[id];
      if (tx) {
        tx.semana = newWeek;
      }
    },
    updateTransaction: (state, action) => {
      transactionsAdapter.updateOne(state, { 
        id: action.payload.id, 
        changes: action.payload 
      });
    },
    deleteTransaction: transactionsAdapter.removeOne
  },
});

export const { 
  addTransaction, 
  updateTransactionWeek, 
  updateTransaction, 
  deleteTransaction 
} = transactionsSlice.actions;

// Export specialized selectors
export const {
  selectAll: selectAllTransactions,
  selectById: selectTransactionById,
  selectIds: selectTransactionIds,
  selectEntities: selectTransactionEntities
} = transactionsAdapter.getSelectors(state => state.transactions);

export default transactionsSlice.reducer;
