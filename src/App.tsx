import { Navigate, useLocation } from 'react-router-dom';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext';
import AdminLayout from './components/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAdmins from './pages/admin/AdminAdmins';
import Users from './pages/admin/Users';
import AdminTransactions from './pages/admin/AdminTransactions';
import Audit from './pages/admin/Audit';
import Reconciliation from './pages/admin/Reconciliation';
import Provider from './pages/admin/Provider';
import Outbox from './pages/admin/Outbox';
import Disputes from './pages/admin/Disputes';
import Documents from './pages/admin/Documents';

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAdminAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-zinc-400">Loading…</p>
      </div>
    );
  }
  if (!admin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />
      <Route
        path="/"
        element={
          <ProtectedAdminRoute>
            <AdminLayout />
          </ProtectedAdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="admins" element={<AdminAdmins />} />
        <Route path="users" element={<Users />} />
        <Route path="transactions" element={<AdminTransactions />} />
        <Route path="audit" element={<Audit />} />
        <Route path="reconciliation" element={<Reconciliation />} />
        <Route path="provider" element={<Provider />} />
        <Route path="outbox" element={<Outbox />} />
        <Route path="disputes" element={<Disputes />} />
        <Route path="documents" element={<Documents />} />
      </Route>

      <Route path="/admin" element={<Navigate to="/" replace />} />
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />
      <Route path="/admin/*" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <AppRoutes />
      </AdminAuthProvider>
    </BrowserRouter>
  );
}
