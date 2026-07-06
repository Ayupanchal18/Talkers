import { Outlet, useLocation } from 'react-router-dom';
import Navigation from './Navigation';

const FULL_SCREEN_PATHS = ['/login', '/register'];

export default function AppLayout() {
  const location = useLocation();

  const isFullScreen =
    FULL_SCREEN_PATHS.includes(location.pathname) || location.pathname.startsWith('/room/');

  if (isFullScreen) {
    return <Outlet />;
  }

  return (
    <div className="app-shell">
      <Navigation />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
