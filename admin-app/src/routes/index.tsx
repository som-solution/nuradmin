import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { ProtectedRoute } from './ProtectedRoute'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { Users } from '@/pages/Users'
import { UserDetail } from '@/pages/UserDetail'
import { Transactions } from '@/pages/Transactions'
import { TransactionDetail } from '@/pages/TransactionDetail'
import { Kyc } from '@/pages/Kyc'
import { KycDocument } from '@/pages/KycDocument'
import { Admins } from '@/pages/Admins'
import { AdminDetail } from '@/pages/AdminDetail'
import { Rates } from '@/pages/Rates'
import { FeeConfig } from '@/pages/FeeConfig'
import { Countries } from '@/pages/Countries'
import { Provider } from '@/pages/Provider'
import { Outbox } from '@/pages/Outbox'
import { Disputes } from '@/pages/Disputes'
import { Audit } from '@/pages/Audit'
import { AuditEntity } from '@/pages/AuditEntity'
import { Reconciliation } from '@/pages/Reconciliation'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="users/:id" element={<UserDetail />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="transactions/:id" element={<TransactionDetail />} />
        <Route path="kyc" element={<Kyc />} />
        <Route path="kyc/:documentId" element={<KycDocument />} />
        <Route
          path="admins"
          element={
            <ProtectedRoute requireAdmin>
              <Admins />
            </ProtectedRoute>
          }
        />
        <Route
          path="admins/:id"
          element={
            <ProtectedRoute requireAdmin>
              <AdminDetail />
            </ProtectedRoute>
          }
        />
        <Route path="rates" element={<Rates />} />
        <Route path="fee-config" element={<FeeConfig />} />
        <Route path="countries" element={<Countries />} />
        <Route path="provider" element={<Provider />} />
        <Route path="outbox" element={<Outbox />} />
        <Route path="disputes" element={<Disputes />} />
        <Route path="audit" element={<Audit />} />
        <Route path="audit/entity/:entityType/:entityId" element={<AuditEntity />} />
        <Route path="reconciliation" element={<Reconciliation />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
