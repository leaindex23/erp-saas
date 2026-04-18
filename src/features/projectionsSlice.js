import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Projections: { [week]: { inflows: number, outflows: number } }
  items: {
    15: { inflows: 200000, outflows: 50000 },
    16: { inflows: 350000, outflows: 120000 },
    17: { inflows: 400000, outflows: 80000 },
    18: { inflows: 250000, outflows: 60000 }
  },
  status: 'idle',
};

export const projectionsSlice = createSlice({
  name: 'projections',
  initialState,
  reducers: {
    setProjection: (state, action) => {
      const { week, type, amount } = action.payload; // type: 'inflows' | 'outflows'
      if (!state.items[week]) {
        state.items[week] = { inflows: 0, outflows: 0 };
      }
      state.items[week][type] = parseFloat(amount) || 0;
    },
    clearProjection: (state, action) => {
      const { week } = action.payload;
      delete state.items[week];
    }
  },
});

export const { setProjection, clearProjection } = projectionsSlice.actions;
export default projectionsSlice.reducer;
