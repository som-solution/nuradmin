import { Link } from 'react-router-dom'
import { useUsers } from '@/hooks/api/useUsers'
import { useTransactions } from '@/hooks/api/useTransactions'
import { useDocuments } from '@/hooks/api/useDocuments'
import { useDisputes } from '@/hooks/api/useDisputes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Receipt, FileCheck, AlertCircle } from 'lucide-react'

export function Dashboard() {
  const { data: usersData } = useUsers({ page: 0, size: 1 })
  const { data: txData } = useTransactions({ page: 0, size: 1 })
  const { data: pendingDocs } = useDocuments({ status: 'PENDING', page: 0, size: 1 })
  const { data: disputesData } = useDisputes({ page: 0, size: 1, status: 'OPEN' })

  const totalUsers = usersData?.totalElements ?? 0
  const totalTransactions = txData?.totalElements ?? 0
  const pendingKyc = pendingDocs?.totalElements ?? (Array.isArray(pendingDocs) ? (pendingDocs as unknown[]).length : 0)
  const pendingDisputes = disputesData?.totalElements ?? 0

  const cards = [
    { title: 'Total Users', value: totalUsers, icon: Users, to: '/users' },
    { title: 'Total Transactions', value: totalTransactions, icon: Receipt, to: '/transactions' },
    { title: 'Pending KYC', value: pendingKyc, icon: FileCheck, to: '/kyc' },
    { title: 'Pending Disputes', value: pendingDisputes, icon: AlertCircle, to: '/disputes' },
  ]

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <Card key={c.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{c.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{c.value}</div>
                {c.to && <Link to={c.to} className="text-xs text-primary hover:underline">View</Link>}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
