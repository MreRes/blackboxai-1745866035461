import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/loginSuccess'],
        ignoredActionPaths: ['payload.user.expiryDate'],
        ignoredPaths: ['auth.user.expiryDate'],
      },
    }),
});

export default store;
