import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // budget: { [accountId]: { [month]: numberValue } }
  items: {},
  status: 'idle',
};

export const budgetSlice = createSlice({
  name: 'budget',
  initialState,
  reducers: {
    setBudgetValue: (state, action) => {
      const { companyId, unidadId, accountId, month, value } = action.payload;
      if (!state.items[companyId]) {
        state.items[companyId] = {};
      }
      if (!state.items[companyId][unidadId]) {
        state.items[companyId][unidadId] = {};
      }
      if (!state.items[companyId][unidadId][accountId]) {
        state.items[companyId][unidadId][accountId] = {};
      }
      state.items[companyId][unidadId][accountId][month] = parseFloat(value) || 0;
    },
    clearBudget: (state) => {
      state.items = {};
    }
  },
});

export const { setBudgetValue, clearBudget } = budgetSlice.actions;
export default budgetSlice.reducer;
