import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [
    { id: 1, nombre: 'Banco Galicia', moneda: 'ARS', saldo_inicial: 1000000, tipo: 'Banco', empresa: 'Grupo Alpha', company_id: 1, unidad_negocio_id: null },
    { id: 2, nombre: 'Mercado Pago', moneda: 'ARS', saldo_inicial: 500000, tipo: 'Virtual', empresa: 'Grupo Alpha', company_id: 1, unidad_negocio_id: null },
    { id: 3, nombre: 'Caja Fuerte (USD)', moneda: 'USD', saldo_inicial: 2000, tipo: 'Caja', empresa: 'Grupo Fuerte', company_id: 2, unidad_negocio_id: null },
    { id: 4, nombre: 'Caja Chica Marketing', moneda: 'ARS', saldo_inicial: 150000, tipo: 'Caja Chica', empresa: 'Grupo Alpha', company_id: 1, unidad_negocio_id: 2 },
    { id: 5, nombre: 'Caja Chica IT', moneda: 'ARS', saldo_inicial: 80000, tipo: 'Caja Chica', empresa: 'Grupo Alpha', company_id: 1, unidad_negocio_id: 4 }
  ],
  status: 'idle',
};

export const bankAccountsSlice = createSlice({
  name: 'bankAccounts',
  initialState,
  reducers: {
    addBankAccount: (state, action) => {
      state.items.push(action.payload);
    },
    updateBankAccount: (state, action) => {
      const index = state.items.findIndex(b => b.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...action.payload };
      }
    },
    deleteBankAccount: (state, action) => {
      state.items = state.items.filter(b => b.id !== action.payload);
    }
  },
});

export const { addBankAccount, updateBankAccount, deleteBankAccount } = bankAccountsSlice.actions;
export default bankAccountsSlice.reducer;
