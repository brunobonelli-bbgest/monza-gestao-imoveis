import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoute } from '../auth/PrivateRoute';
import { PublicRoute } from '../auth/PublicRoute';
import { AppLayout } from '../layouts/AppLayout';
import { useAuth } from '../hooks/useAuth';

import { ROUTES } from '../config/routes';

// Lazy loaded components
const Dashboard = lazy(() => import('../pages/Dashboard').then(m => ({ default: m.Dashboard })));
const PropertiesList = lazy(() => import('../pages/Properties').then(m => ({ default: m.PropertiesList })));
const LeasesList = lazy(() => import('../pages/Leases').then(m => ({ default: m.LeasesList })));
const Reports = lazy(() => import('../pages/Reports').then(m => ({ default: m.Reports })));
const IncidentsList = lazy(() => import('../pages/Incidents').then(m => ({ default: m.IncidentsList })));
const InspectionsList = lazy(() => import('../pages/Inspections').then(m => ({ default: m.InspectionsList })));
const Finance = lazy(() => import('../pages/Finance'));
const Registrations = lazy(() => import('../pages/Registrations').then(m => ({ default: m.Registrations })));
const Login = lazy(() => import('../pages/Login').then(m => ({ default: m.Login })));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
  </div>
);

export const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public Routes */}
        <Route path={ROUTES.LOGIN} element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />

        {/* Private Routes with Layout */}
        <Route element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }>
          <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
          <Route path={ROUTES.REGISTRATIONS} element={<Registrations />} />
          <Route path={ROUTES.PROPERTIES} element={<PropertiesList />} />
          <Route path={ROUTES.LEASES} element={<LeasesList />} />
          <Route path={ROUTES.INCIDENTS} element={<IncidentsList />} />
          <Route path={ROUTES.INSPECTIONS} element={<InspectionsList />} />
          <Route path={ROUTES.FINANCE} element={<Finance />} />
          <Route path={ROUTES.REPORTS} element={<Reports />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to={isAuthenticated ? ROUTES.DASHBOARD : ROUTES.LOGIN} replace />} />
      </Routes>
    </Suspense>
  );
};
