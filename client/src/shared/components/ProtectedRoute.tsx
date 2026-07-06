import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/useAuthStore';
import { PageLoader } from './Loading';

export default function ProtectedRoute() {
  const { user, accessToken, refreshSession } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(!accessToken && !!user);

  useEffect(() => {
    const initializeAuth = async () => {
      if (!accessToken && user) {
        await refreshSession();
      }
      setIsInitializing(false);
    };
    initializeAuth();
  }, [accessToken, user, refreshSession]);

  if (isInitializing) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
