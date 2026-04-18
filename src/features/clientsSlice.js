import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  items: [
    { id: 1, nombre: 'Distribuidora Central', tipo: 'proveedor', cuit: '30-12345678-9', email: 'contacto@distribuidora.com', telefono: '+54 11 4444-5555', company_id: 1 },
    { id: 2, nombre: 'Cliente SaaS Base', tipo: 'cliente', cuit: '20-87654321-0', email: 'admin@clientesaas.com', telefono: '+54 11 3333-4444', company_id: 1 },
    { id: 3, nombre: 'Personal Interno', tipo: 'proveedor', cuit: '-', email: '', telefono: '', company_id: 1 },
  ]
};

export const clientsSlice = createSlice({
  name: 'clients',
  initialState,
  reducers: {
    addClient: (state, action) => {
      state.items.push({
        ...action.payload,
        id: Math.max(...state.items.map(c => c.id), 0) + 1,
      });
    },
    updateClient: (state, action) => {
      const index = state.items.findIndex(c => c.id === action.payload.id);
      if (index !== -1) state.items[index] = { ...state.items[index], ...action.payload };
    },
    deleteClient: (state, action) => {
      state.items = state.items.filter(c => c.id !== action.payload);
    },
  },
});

export const { addClient, updateClient, deleteClient } = clientsSlice.actions;
export default clientsSlice.reducer;
