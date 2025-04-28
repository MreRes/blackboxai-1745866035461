import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { ThemeProvider } from './components/layout/ThemeProvider';
import PrivateRoute from './components/routing/PrivateRoute';
import Layout from './components/layout/Layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import Transactions from './components/transactions/Transactions';
import TransactionDetail from './components/transactions/TransactionDetail';
import Budgets from './components/budgets/Budgets';
import BudgetDetail from './components/budgets/BudgetDetail';
import Goals from './components/goals/Goals';
import GoalDetail from './components/goals/GoalDetail';
import Reports from './components/reports/Reports';
import Profile from './components/profile/Profile';
import WhatsAppActivation from './components/whatsapp/WhatsAppActivation';
import NotFound from './components/common/NotFound';

function App() {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/activate-whatsapp" element={<WhatsAppActivation />} />

            {/* Protected Routes */}
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              
              <Route path="transactions">
                <Route index element={<Transactions />} />
                <Route path=":id" element={<TransactionDetail />} />
              </Route>

              <Route path="budgets">
                <Route index element={<Budgets />} />
                <Route path=":id" element={<BudgetDetail />} />
              </Route>

              <Route path="goals">
                <Route index element={<Goals />} />
                <Route path=":id" element={<GoalDetail />} />
              </Route>

              <Route path="reports" element={<Reports />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
