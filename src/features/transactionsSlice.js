import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [
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
  ],
  status: 'idle',
};

export const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    addTransaction: (state, action) => {
      state.items.push(action.payload);
    },
    updateTransactionWeek: (state, action) => {
      const { id, newWeek } = action.payload;
      const tx = state.items.find(t => t.id === id);
      if (tx) {
        tx.semana = newWeek;
        // Logic to compute new fecha_pago based on newWeek goes here
      }
    },
    updateTransaction: (state, action) => {
      const index = state.items.findIndex(t => t.id === action.payload.id);
      if(index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload };
      }
    },
    deleteTransaction: (state, action) => {
      state.items = state.items.filter(t => t.id !== action.payload);
    }
  },
});

export const { addTransaction, updateTransactionWeek, updateTransaction, deleteTransaction } = transactionsSlice.actions;
export default transactionsSlice.reducer;
