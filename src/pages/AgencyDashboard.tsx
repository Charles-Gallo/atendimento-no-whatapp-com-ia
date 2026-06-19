import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import pb from '@/lib/pocketbase/client'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { Shield, TrendingUp, Users, UserMinus, DollarSign, Activity } from 'lucide-react'
import { format, subMonths, endOfMonth } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

export default function AgencyDashboard() {
  const [metrics, setMetrics] = useState({
    mrr: 0,
    activeClients: 0,
    trialClients: 0,
    churnRate: 0,
    ltv: 0,
  })
  const [mrrHistory, setMrrHistory] = useState<any[]>([])
  const [clientsHistory, setClientsHistory] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        const subs = await pb
          .collection('subscriptions')
          .getFullList({ expand: 'plan_id,account_id' })

        let mrr = 0
        let active = 0
        let trial = 0
        let expiredLast30 = 0
        let totalActive30DaysAgo = 0

        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

        subs.forEach((s) => {
          const plan = s.expand?.plan_id
          const price = plan?.price_monthly || 0

          if (s.status === 'active') {
            mrr += price
            active++
            totalActive30DaysAgo++
          } else if (s.status === 'trial') {
            trial++
          } else if (s.status === 'expired' || s.status === 'inactive' || s.status === 'paused') {
            const endDate = new Date(s.end_date || s.updated)
            if (endDate >= thirtyDaysAgo && endDate <= now) {
              expiredLast30++
              totalActive30DaysAgo++
            }
          }
        })

        const churnRate =
          totalActive30DaysAgo > 0 ? (expiredLast30 / totalActive30DaysAgo) * 100 : 0
        const arpu = active > 0 ? mrr / active : 0
        const avgLifespanMonths = churnRate > 0 ? 1 / (churnRate / 100) : 12
        const ltv = arpu * avgLifespanMonths

        setMetrics({ mrr, activeClients: active, trialClients: trial, churnRate, ltv })

        const mHistory = []
        const cHistory = []
        for (let i = 5; i >= 0; i--) {
          const month = subMonths(now, i)
          const monthStr = format(month, 'MMM/yy', { locale: ptBR })
          const endOfM = endOfMonth(month)

          const activeAtMonth = subs.filter(
            (s) => new Date(s.created) <= endOfM && (s.status === 'active' || s.status === 'trial'),
          ).length

          const mrrAtMonth = subs
            .filter((s) => new Date(s.created) <= endOfM && s.status === 'active')
            .reduce((acc, s) => acc + (s.expand?.plan_id?.price_monthly || 0), 0)

          mHistory.push({ name: monthStr, mrr: mrrAtMonth })
          cHistory.push({ name: monthStr, clients: activeAtMonth })
        }
        setMrrHistory(mHistory)
        setClientsHistory(cHistory)
      } catch (e) {
        console.error(e)
      }
    }
    loadData()
  }, [])

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 p-3 rounded-xl border border-blue-200">
          <Shield className="h-8 w-8 text-blue-700" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-blue-950">Dashboard Financeiro</h1>
          <p className="text-muted-foreground text-lg">
            Visão estratégica e métricas de crescimento (SaaS).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-600">MRR</CardTitle>
            <DollarSign className="w-5 h-5 text-emerald-500" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-950">{formatCurrency(metrics.mrr)}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-600">Clientes Ativos</CardTitle>
            <Users className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-950">{metrics.activeClients}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-600">
              Clientes em Trial
            </CardTitle>
            <Activity className="w-5 h-5 text-orange-500" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-950">{metrics.trialClients}</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-600">Taxa de Churn</CardTitle>
            <UserMinus className="w-5 h-5 text-red-500" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-950">{metrics.churnRate.toFixed(1)}%</div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 shadow-sm bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-600">
              Lifetime Value (LTV)
            </CardTitle>
            <TrendingUp className="w-5 h-5 text-indigo-500" />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-950">{formatCurrency(metrics.ltv)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-blue-950">Faturamento Mensal (MRR)</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ChartContainer config={{}} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mrrHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b' }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b' }}
                    tickFormatter={(val) => `R$ ${val}`}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent formatter={(val) => formatCurrency(val as number)} />
                    }
                  />
                  <Bar dataKey="mrr" fill="#1e3a8a" radius={[6, 6, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-blue-950">Crescimento de Clientes</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ChartContainer config={{}} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={clientsHistory}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b' }}
                    dy={10}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="clients"
                    name="Clientes"
                    stroke="#f97316"
                    strokeWidth={4}
                    dot={{ r: 5, strokeWidth: 2, fill: '#fff' }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
