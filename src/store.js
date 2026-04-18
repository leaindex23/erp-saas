import { configureStore } from '@reduxjs/toolkit';
import transactionsReducer from './features/transactionsSlice';
import accountsReducer from './features/accountsSlice';
import bankAccountsReducer from './features/bankAccountsSlice';
import projectionsReducer from './features/projectionsSlice';
import exchangeRatesReducer from './features/exchangeRatesSlice';
import budgetReducer from './features/budgetSlice';
import clientsReducer from './features/clientsSlice';
import projectsReducer from './features/projectsSlice';

import authReducer from './features/authSlice';
import companyReducer from './features/companySlice';
import usersReducer from './features/usersSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    company: companyReducer,
    users: usersReducer,
    transactions: transactionsReducer,
    accounts: accountsReducer,
    bankAccounts: bankAccountsReducer,
    projections: projectionsReducer,
    exchangeRates: exchangeRatesReducer,
    budget: budgetReducer,
    clients: clientsReducer,
    projects: projectsReducer,
  },
});
