import { type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom';
import { BedDouble, LayoutDashboard, CalendarCheck, Users, Receipt, LogOut, Sun, Moon } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import BookingsPage from './pages/BookingsPage';
import GuestsPage from './pages/GuestsPage';
import BillingPage from './pages/BillingPage';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/bookings', label: 'Bookings', icon: CalendarCheck, end: false },
  { to: '/guests', label: 'Guests', icon: Users, end: false },
  { to: '/billing', label: 'Billing', icon: Receipt, end: false },
];

function ProtectedLayout({ children }: { children: ReactNode }) {
  const { token, user, logout } = useAuth();
  const { dark, toggleTheme } = useTheme();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-sidebar p-4 flex flex-col justify-between gap-4">
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5">
              <BedDouble className="w-5 h-5 text-primary" />
              <span className="font-semibold tracking-tight">Hostel MS</span>
            </div>
            <button
              onClick={toggleTheme}
              title="Toggle theme"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition cursor-pointer"
            >
              {dark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>

          <nav className="space-y-1">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/60 border border-transparent'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="border-t border-border pt-4 px-2 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.username || 'User'}</p>
            <p className="text-xs text-muted-foreground">{user?.role || 'STAFF'}</p>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 max-w-6xl w-full mx-auto">{children}</main>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedLayout>
                <DashboardPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/bookings"
            element={
              <ProtectedLayout>
                <BookingsPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/guests"
            element={
              <ProtectedLayout>
                <GuestsPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/billing"
            element={
              <ProtectedLayout>
                <BillingPage />
              </ProtectedLayout>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
