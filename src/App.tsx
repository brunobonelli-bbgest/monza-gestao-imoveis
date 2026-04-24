import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { GlobalErrorBoundary } from './components/ErrorBoundary';
import { DataProvider } from './context/DataContext';
import { AuthProvider } from './auth/AuthProvider';
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  return (
    <GlobalErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <Router>
            <AppRoutes />
          </Router>
        </DataProvider>
      </AuthProvider>
    </GlobalErrorBoundary>
  );
}
