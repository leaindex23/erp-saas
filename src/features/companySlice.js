import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentCompanyId: null, // selected company
  isHoldingView: false, // consolidation toggle
  companies: [
    { id: 1, nombre: 'Empresa Principal', base_currency: 'ARS' },
    { id: 2, nombre: 'SaaS Business Unit', base_currency: 'USD' }
  ],
  businessUnits: [
    { id: 1, nombre: 'Alpha Corporativo', company_id: 1 },
    { id: 2, nombre: 'Producto SaaS', company_id: 2 },
    { id: 3, nombre: 'I+D', company_id: 1 }
  ],
  loading: false,
};

export const companySlice = createSlice({
  name: 'company',
  initialState,
  reducers: {
    setCurrentCompany: (state, action) => {
      state.currentCompanyId = action.payload;
      state.isHoldingView = false;
    },
    toggleHoldingView: (state, action) => {
      state.isHoldingView = action.payload;
    },
    setCompanies: (state, action) => {
      state.companies = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    addCompany: (state, action) => {
      state.companies.push({ 
        ...action.payload, 
        id: Math.max(...state.companies.map(c => c.id), 0) + 1 
      });
    },
    updateCompany: (state, action) => {
      const index = state.companies.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.companies[index] = { ...state.companies[index], ...action.payload };
      }
    },
    deleteCompany: (state, action) => {
      state.companies = state.companies.filter(c => c.id !== action.payload);
      if (state.currentCompanyId === action.payload) {
        state.currentCompanyId = state.companies[0]?.id || null;
      }
    },
    addBusinessUnit: (state, action) => {
      state.businessUnits.push({ 
        ...action.payload, 
        id: Math.max(...state.businessUnits.map(u => u.id), 0) + 1 
      });
    },
    updateBusinessUnit: (state, action) => {
      const index = state.businessUnits.findIndex(u => u.id === action.payload.id);
      if (index !== -1) {
        state.businessUnits[index] = { ...state.businessUnits[index], ...action.payload };
      }
    },
    deleteBusinessUnit: (state, action) => {
      state.businessUnits = state.businessUnits.filter(u => u.id !== action.payload);
    }
  },
});

export const { 
  setCurrentCompany, toggleHoldingView, setCompanies, setLoading, 
  addCompany, updateCompany, deleteCompany,
  addBusinessUnit, updateBusinessUnit, deleteBusinessUnit
} = companySlice.actions;
export default companySlice.reducer;
