import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Film, User, LogOut, ShieldAlert, Sun, Moon, Bell } from 'lucide-react';

export const Navbar = () => {
  const { user, logout, api } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [theme, setTheme] = React.useState(localStorage.getItem('theme') || 'dark');
  const [pendingCount, setPendingCount] = React.useState(0);

  React.useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('theme-light');
    } else {
      document.documentElement.classList.remove('theme-light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fetch pending bookings count
  React.useEffect(() => {
    if (!user || !api) {
      setPendingCount(0);
      return;
    }

    const fetchPendingCount = async () => {
      try {
        const response = await api.get('/api/bookings/history');
        const now = new Date();
        const pending = response.data.filter(b => 
          b.status === 'Pending' && b.expiresAt && new Date(b.expiresAt) > now
        );
        setPendingCount(pending.length);
      } catch (err) {
        console.error('Error fetching pending bookings count:', err);
      }
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 15000); // Check every 15s for live updates
    return () => clearInterval(interval);
  }, [user, location.pathname, api]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) =>
    location.pathname === path;

  return (
    <nav style={{
      backgroundColor: 'var(--bg)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 font-bold text-sm tracking-tight"
              style={{ color: 'var(--text)', textDecoration: 'none' }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
               style={{ backgroundColor: 'var(--text)', color: 'var(--bg)' }}>
            M
          </div>
          <span>Movies Mania</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">

          <Link
            to="/"
            className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={{
              color: isActive('/') ? 'var(--text)' : 'var(--text-muted)',
              backgroundColor: isActive('/') ? 'var(--bg-subtle)' : 'transparent',
              textDecoration: 'none',
            }}
          >
            Movies
          </Link>

          {user && (
            <Link
              to="/history"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors relative"
              style={{
                color: isActive('/history') ? 'var(--text)' : 'var(--text-muted)',
                backgroundColor: isActive('/history') ? 'var(--bg-subtle)' : 'transparent',
                textDecoration: 'none',
              }}
            >
              <Bell size={13} className={pendingCount > 0 ? "animate-bounce" : ""} style={{ color: pendingCount > 0 ? '#fbbf24' : 'inherit' }} />
              <span>My Bookings</span>
              {pendingCount > 0 && (
                <span 
                  className="flex h-2 w-2 relative" 
                  style={{ marginLeft: '1px', marginTop: '-6px' }}
                >
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
              )}
            </Link>
          )}

          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              style={{
                color: isActive('/admin') ? 'var(--text)' : 'var(--text-muted)',
                backgroundColor: isActive('/admin') ? 'var(--bg-subtle)' : 'transparent',
                textDecoration: 'none',
              }}
            >
              <ShieldAlert size={13} />
              Admin
            </Link>
          )}

          {/* Divider */}
          <div className="w-px h-4 mx-2" style={{ backgroundColor: 'var(--border-mid)' }} />

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center rounded-md transition-colors cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
          </button>

          {/* User section */}
          {user ? (
            <div className="flex items-center gap-2 ml-1">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm"
                   style={{ color: 'var(--text-muted)' }}>
                <User size={13} />
                <span className="font-medium max-w-[100px] truncate" style={{ color: 'var(--text)' }}>
                  {user.name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium cursor-pointer transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="btn btn-primary ml-1"
              style={{ padding: '0.4rem 1rem', fontSize: '0.8125rem', textDecoration: 'none' }}
            >
              Sign in
            </Link>
          )}
        </div>

      </div>
    </nav>
  );
};
export default Navbar;
