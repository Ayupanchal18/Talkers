import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Video, Home, LogOut, PhoneCall } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

const NAV_ITEMS = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/meetings', icon: PhoneCall, label: 'Meetings' },
];

export default function Navigation() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleConfirmLogout = async () => {
    setShowConfirmModal(false);
    await logout();
    navigate('/login');
  };

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside className="nav-sidebar">
        {/* Logo */}
        <div className="nav-logo-wrap">
          <Link to="/" className="nav-logo-link">
            <div className="nav-logo-icon">
              <Video size={16} className="text-white" />
            </div>
            <span className="nav-logo-text">Vidss</span>
          </Link>
        </div>

        {/* Nav Items */}
        <nav className="nav-items">
          {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={active ? 'nav-item nav-item-active' : 'nav-item'}
              >
                <Icon size={16} className="nav-item-icon" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        {user && (
          <div className="nav-footer">
            <div className="nav-user">
              <div className="nav-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="nav-user-info">
                <p className="nav-user-name">{user.name}</p>
                <p className="nav-user-email">{user.email}</p>
              </div>
            </div>
            <button onClick={() => setShowConfirmModal(true)} className="nav-logout-btn">
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        )}
      </aside>

      {/* ── Mobile Top Bar ── */}
      <header className="nav-mobile-topbar">
        <div className="nav-logo-icon" style={{ width: 28, height: 28, borderRadius: 7 }}>
          <Video size={14} className="text-white" />
        </div>
        <span className="nav-logo-text" style={{ fontSize: '0.9rem' }}>Vidss</span>

        {user && (
          <div className="nav-avatar nav-mobile-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
        )}
      </header>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="nav-bottom-bar">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={active ? 'nav-bottom-item nav-bottom-item-active' : 'nav-bottom-item'}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          );
        })}
        <button className="nav-bottom-item nav-bottom-logout" onClick={() => setShowConfirmModal(true)}>
          <LogOut size={20} />
          <span>Sign out</span>
        </button>
      </nav>

      {/* ── Sign Out Confirmation Modal ── */}
      {showConfirmModal && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in"
          onClick={() => setShowConfirmModal(false)}
        >
          <div 
            className="w-full max-w-sm rounded-2xl bg-[#0c1220] border border-[#1e293b] p-6 flex flex-col items-center text-center shadow-2xl animate-zoom-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Center-aligned icon container */}
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 text-red-500 shrink-0">
              <LogOut className="w-5 h-5" />
            </div>
            
            <h3 className="text-base font-bold text-white mb-1.5">Sign Out</h3>
            
            <p className="text-xs text-slate-400 mb-6 leading-relaxed max-w-[280px]">
              Are you sure you want to sign out of your Vidss account? You will need to log back in to host or join calls.
            </p>
            
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-4 text-xs font-semibold rounded-xl border border-[#334155] bg-transparent text-slate-300 hover:bg-[#1e293b] hover:text-white transition-all duration-150 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmLogout}
                className="flex-1 py-2.5 px-4 text-xs font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/30 active:scale-95 transition-all duration-150 cursor-pointer"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
