import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  role: null, // ADMIN, MANAGER, etc.
  loading: false,
  error: null,
  permissions: {
    isRoot: false,
    allowedCompanies: [],
    allowedAccounts: []
  }
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      if (action.payload?.permissions) {
        state.permissions = action.payload.permissions;
      }
      state.loading = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    logout: (state) => {
      state.user = null;
      state.role = null;
      state.permissions = initialState.permissions;
    }
  },
});

export const { setUser, setLoading, setError, logout } = authSlice.actions;
export default authSlice.reducer;
