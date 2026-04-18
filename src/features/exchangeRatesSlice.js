import { createSlice } from '@reduxjs/toolkit';

// Monthly ARS per 1 USD
const initialState = {
  items: {
    '2026-01': 980,
    '2026-02': 1010,
    '2026-03': 1030,
    '2026-04': 1050,
  },
  status: 'idle',
};

export const exchangeRatesSlice = createSlice({
  name: 'exchangeRates',
  initialState,
  reducers: {
    setRate: (state, action) => {
      const { month, rate } = action.payload; // month: 'YYYY-MM'
      state.items[month] = rate;
    },
  },
});

export const { setRate } = exchangeRatesSlice.actions;
export default exchangeRatesSlice.reducer;
