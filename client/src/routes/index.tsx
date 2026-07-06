/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '@/shared/components/AppLayout';
import ProtectedRoute from '@/shared/components/ProtectedRoute';
import GuestRoute from '@/shared/components/GuestRoute';
import { PageLoader } from '@/shared/components/Loading';

const HomePage = lazy(() => import('@/features/meeting/pages/HomePage'));
const LobbyPage = lazy(() => import('@/features/meeting/pages/LobbyPage'));
const RoomPage = lazy(() => import('@/features/meeting/pages/RoomPage'));
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      // Protected Routes
      {
        path: '',
        element: <ProtectedRoute />,
        children: [
          {
            path: '',
            element: (
              <Suspense fallback={<PageLoader />}>
                <HomePage />
              </Suspense>
            ),
          },
          {
            path: 'lobby/:code',
            element: (
              <Suspense fallback={<PageLoader />}>
                <LobbyPage />
              </Suspense>
            ),
          },
          {
            path: 'room/:code',
            element: (
              <Suspense fallback={<PageLoader />}>
                <RoomPage />
              </Suspense>
            ),
          },
        ],
      },
      // Guest Routes
      {
        path: '',
        element: <GuestRoute />,
        children: [
          {
            path: 'login',
            element: (
              <Suspense fallback={<PageLoader />}>
                <LoginPage />
              </Suspense>
            ),
          },
          {
            path: 'register',
            element: (
              <Suspense fallback={<PageLoader />}>
                <RegisterPage />
              </Suspense>
            ),
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
