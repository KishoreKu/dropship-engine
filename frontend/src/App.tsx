import type { JSX } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ProductsPage from './pages/ProductsPage';
import OrdersPage from './pages/OrdersPage';
import ResearchPage from './pages/ResearchPage';
import ImportPage from './pages/ImportPage';
import LoginPage from './pages/LoginPage';
import { useAuth } from './hooks/useAuth';

function RequireAuth({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function Shell() {
  const { logout } = useAuth();
  return (
    <div style={{ display: 'flex', minHeight: '100vh', margin: 0, fontFamily: 'system-ui, sans-serif' }}>
      <nav style={{ width: 220, background: '#0f172a', color: '#fff', padding: '1.5rem 0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '0 1.25rem', marginBottom: 2, fontWeight: 700, fontSize: 18 }}>
          Dropship Engine
        </div>
        <div style={{ padding: '0 1.25rem', marginBottom: 24, opacity: 0.5, fontSize: 13 }}>
          Multi-channel dashboard
        </div>
        {[
          { to: '/', label: 'Dashboard' },
          { to: '/products', label: 'Products' },
          { to: '/import', label: 'Import' },
          { to: '/orders', label: 'Orders' },
          { to: '/research', label: 'Research' },
        ].map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              display: 'block',
              padding: '0.6rem 1.25rem',
              color: isActive ? '#38bdf8' : '#94a3b8',
              background: isActive ? 'rgba(56,189,248,0.1)' : 'transparent',
              textDecoration: 'none',
              fontSize: 14,
              borderRight: isActive ? '3px solid #38bdf8' : '3px solid transparent',
            })}
          >
            {label}
          </NavLink>
        ))}
        <button
          onClick={logout}
          style={{
            marginTop: 'auto',
            marginLeft: '1.25rem',
            marginRight: '1.25rem',
            padding: '0.5rem 0',
            background: 'transparent',
            border: '1px solid #334155',
            borderRadius: 6,
            color: '#94a3b8',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </nav>
      <main style={{ flex: 1, padding: '2rem', background: '#f8fafc' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/research" element={<ResearchPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <RequireAuth>
            <Shell />
          </RequireAuth>
        }
      />
    </Routes>
  );
}
