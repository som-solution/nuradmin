import { Navigate, useLocation } from 'react-router-dom';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AdminAuthProvider, useAdminAuth } from './contexts/AdminAuthContext';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import Recipients from './pages/Recipients';
import Transactions from './pages/Transactions';
import Send from './pages/Send';
import Compliance from './pages/Compliance';
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading…</p>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const { admin, loading } = useAdminAuth();
  const location = useLocation();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <p className="text-slate-400">Loading…</p>
      </div>
    );
  }
  if (!admin) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* User app */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="send" element={<Send />} />
        <Route path="recipients" element={<Recipients />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="compliance" element={<Compliance />} />
      </Route>

      {/* Admin app */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin"
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AdminAuthProvider>
          <AppRoutes />
        </AdminAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
