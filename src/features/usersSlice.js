import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  users: [
    { 
      id: 1, 
      email: 'admin@financesaas.com',
      password: 'admin', 
      name: 'Super Admin',
      permissions: { isRoot: true, allowedCompanies: [1, 2], allowedAccounts: [1, 2, 3, 4, 5] }
    },
    { 
      id: 2, 
      email: 'caja_fuerte@holding.com', 
      password: 'user123',
      name: 'Operador Caja Fuerte',
      permissions: { isRoot: false, allowedCompanies: [2], allowedAccounts: [3] }
    },
    { 
      id: 3, 
      email: 'manager_saas@holding.com', 
      password: 'user123',
      name: 'SaaS Manager',
      permissions: { isRoot: false, allowedCompanies: [2], allowedAccounts: [3, 4, 5] }
    }
  ],
  loading: false,
};

export const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    addUser: (state, action) => {
      state.users.push({ 
        ...action.payload, 
        id: Math.max(...state.users.map(u => u.id), 0) + 1 
      });
    },
    updateUser: (state, action) => {
      const index = state.users.findIndex(u => u.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = { ...state.users[index], ...action.payload };
      }
    },
    deleteUser: (state, action) => {
      state.users = state.users.filter(u => u.id !== action.payload);
    }
  },
});

export const { addUser, updateUser, deleteUser } = usersSlice.actions;
export default usersSlice.reducer;
