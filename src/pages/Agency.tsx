import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { format, parseISO, addDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Edit2, Shield, Trash2, Loader2, XCircle, PauseCircle, PlayCircle } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useRealtime } from '@/hooks/use-realtime'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0)
}

export default function Agency() {
  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-orange-100 p-3 rounded-xl border border-orange-200">
          <Shield className="h-8 w-8 text-orange-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-blue-950">Agência LeadScale</h1>
          <p className="text-muted-foreground text-lg">
            Gerenciamento de planos, clientes e assinaturas.
          </p>
        </div>
      </div>

      <Tabs defaultValue="clientes" className="w-full">
        <TabsList className="w-full justify-start mb-6 bg-slate-100/50 p-1 rounded-xl">
          <TabsTrigger
            value="clientes"
            className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-950 data-[state=active]:shadow-sm"
          >
            Clientes
          </TabsTrigger>
          <TabsTrigger
            value="planos"
            className="flex-1 rounded-lg data-[state=active]:bg-white data-[state=active]:text-blue-950 data-[state=active]:shadow-sm"
          >
            Planos & Preços
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clientes" className="mt-0">
          <ClientsManager />
        </TabsContent>

        <TabsContent value="planos" className="mt-0">
          <PlansManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ClientsManager() {
  const [subs, setSubs] = useState<any[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const { toast } = useToast()

  const loadData = async () => {
    try {
      const [subsList, plansList] = await Promise.all([
        pb.collection('subscriptions').getFullList({ expand: 'account_id.owner_id,plan_id' }),
        pb.collection('plans').getFullList(),
      ])
      setSubs(subsList)
      setPlans(plansList)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('subscriptions', () => {
    loadData()
  })

  return (
    <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="bg-white border-b border-slate-100">
        <CardTitle className="text-xl text-blue-950">Clientes e Assinaturas</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="pl-6">Cliente</TableHead>
              <TableHead>Administrador</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Valor Mensal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expira em</TableHead>
              <TableHead>Mensagens</TableHead>
              <TableHead className="text-right pr-6">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subs.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            )}
            {subs.map((s) => {
              const account = s.expand?.account_id
              const plan = s.expand?.plan_id
              const owner = account?.expand?.owner_id

              const accountName =
                account?.name?.replace(/^(Conta( de)?:\s*|Conta de\s+)/i, '') || 'Desconhecido'
              const adminName = owner?.name || 'Admin'
              const adminEmail = owner?.email || 'Email não disponível'

              return (
                <TableRow key={s.id} className="hover:bg-slate-50/50">
                  <TableCell className="font-semibold text-blue-950 pl-6">{accountName}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm text-muted-foreground">{adminEmail}</span>
                      <span className="text-sm font-medium">{adminName}</span>
                    </div>
                  </TableCell>
                  <TableCell>{plan?.name}</TableCell>
                  <TableCell className="font-medium text-slate-700">
                    {formatCurrency(plan?.price_monthly)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        'font-medium',
                        s.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : s.status === 'trial'
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : s.status === 'paused'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-red-50 text-red-700 border-red-200',
                      )}
                    >
                      {s.status === 'active'
                        ? 'Ativo'
                        : s.status === 'trial'
                          ? 'Trial'
                          : s.status === 'paused'
                            ? 'Pausado'
                            : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {s.end_date ? format(parseISO(s.end_date), 'dd/MM/yyyy') : '-'}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {s.message_count} / {plan?.max_messages_month || 0}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <ClientManagerDialog subscription={s} plans={plans} onSaved={loadData} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function ClientManagerDialog({
  subscription,
  plans,
  onSaved,
}: {
  subscription: any
  plans: any[]
  onSaved: () => void
}) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const account = subscription.expand?.account_id
  const owner = account?.expand?.owner_id

  const accountName =
    account?.name?.replace(/^(Conta( de)?:\s*|Conta de\s+)/i, '') || 'Desconhecido'
  const adminName = owner?.name || 'Admin'
  const adminEmail = owner?.email || 'Email não disponível'

  const [selectedPlan, setSelectedPlan] = useState(subscription.plan_id)
  const handleUpdateEndDate = async (newDateStr: string) => {
    try {
      if (!newDateStr) return
      const newEnd = new Date(newDateStr)
      newEnd.setUTCHours(23, 59, 59, 999)
      await pb.collection('subscriptions').update(subscription.id, {
        end_date: newEnd.toISOString(),
      })
      toast({ title: 'Data de expiração atualizada!' })
      onSaved()
    } catch (e) {
      toast({ title: 'Erro ao atualizar data', variant: 'destructive' })
    }
  }

  const handleApplyPlan = async () => {
    try {
      const plan = plans.find((p) => p.id === selectedPlan)
      if (!plan) return

      const startDate = new Date()
      const endDate = addDays(startDate, plan.expiration_days)

      await pb.collection('subscriptions').update(subscription.id, {
        plan_id: selectedPlan,
        status: 'active',
        message_count: 0,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      })

      toast({ title: 'Plano atualizado com sucesso!' })
      onSaved()
    } catch (e) {
      toast({ title: 'Erro ao atualizar plano', variant: 'destructive' })
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    try {
      await pb.collection('subscriptions').update(subscription.id, {
        status: newStatus,
      })
      toast({ title: `Status alterado para ${newStatus}` })
      onSaved()
    } catch (e) {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    try {
      await pb.send(`/backend/v1/accounts-cascade/${account.id}`, { method: 'DELETE' })
      toast({ title: 'Cliente excluído com sucesso!' })
      setOpen(false)
      onSaved()
    } catch (e) {
      toast({ title: 'Erro ao excluir cliente', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full hover:bg-blue-50 hover:text-blue-700"
        >
          <Edit2 className="w-3.5 h-3.5 mr-2" /> Gerenciar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl bg-[#fcfaf5] border-none shadow-2xl p-8 rounded-3xl">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-bold text-blue-950">Ficha do Cliente</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-slate-200/40 p-5 rounded-2xl border border-slate-200/60">
            <h3 className="text-2xl font-bold text-blue-950 mb-2">Conta de {accountName}</h3>
            <p className="text-sm text-slate-700">
              <strong>Admin:</strong> {adminName}
            </p>
            <p className="text-sm text-slate-700">
              <strong>Email:</strong> {adminEmail}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="border border-slate-200 rounded-2xl p-6 space-y-5 bg-white shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-lg text-blue-950 mb-4">Mudar Plano</h4>
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger className="w-full h-11 border-slate-300 rounded-xl mb-4">
                    <SelectValue placeholder="Selecione o plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} - {formatCurrency(p.price_monthly)} ({p.expiration_days} dias)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleApplyPlan}
                  className="w-full h-11 rounded-xl bg-blue-950 hover:bg-blue-900 text-white font-medium shadow-md"
                >
                  Aplicar Plano & Resetar Uso
                </Button>
              </div>
              <p className="text-xs text-center text-slate-500 px-2 leading-relaxed mt-2">
                Isso resetará o contador de mensagens e adicionará os dias do plano a partir de
                hoje.
              </p>
            </div>

            <div className="border border-slate-200 rounded-2xl p-6 space-y-5 bg-white shadow-sm flex flex-col">
              <h4 className="font-bold text-lg text-blue-950 mb-2">Data de Expiração</h4>
              <div className="flex gap-3 items-center">
                <Input
                  type="date"
                  value={
                    subscription.end_date
                      ? format(parseISO(subscription.end_date), 'yyyy-MM-dd')
                      : ''
                  }
                  onChange={(e) => handleUpdateEndDate(e.target.value)}
                  className="h-11 border-slate-300 rounded-xl flex-1"
                />
              </div>

              <div className="pt-5 mt-auto border-t border-slate-100">
                <h4 className="font-semibold text-sm text-blue-950 mb-3">Controles da Conta</h4>
                <div className="flex gap-3">
                  {subscription.status === 'paused' || subscription.status === 'inactive' ? (
                    <Button
                      variant="outline"
                      onClick={() => handleStatusChange('active')}
                      className="flex-1 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      <PlayCircle className="w-4 h-4 mr-2" /> Ativar
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => handleStatusChange('paused')}
                      className="flex-1 rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50"
                    >
                      <PauseCircle className="w-4 h-4 mr-2" /> Pausar
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => handleStatusChange('inactive')}
                    className="flex-1 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={subscription.status === 'inactive'}
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Desativar
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-red-100 mt-4">
            <h4 className="text-red-600 font-bold mb-3">Zona de Perigo</h4>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="bg-red-600 hover:bg-red-700 h-11 rounded-xl shadow-md"
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Excluir cliente definitivamente
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl p-6">
                <AlertDialogHeader className="mb-4">
                  <AlertDialogTitle className="text-2xl text-red-600">
                    Você tem certeza absoluta?
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-base text-slate-600">
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente a conta, todas as
                    instâncias do WhatsApp, mensagens, contatos, pipeline, equipe e configurações.
                    Todos os dados serão perdidos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="h-11 rounded-xl">Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700 h-11 rounded-xl"
                  >
                    Sim, excluir tudo
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PlansManager() {
  const [plans, setPlans] = useState<any[]>([])
  const { toast } = useToast()

  const loadPlans = async () => {
    const list = await pb.collection('plans').getFullList()
    setPlans(list)
  }

  useEffect(() => {
    loadPlans()
  }, [])

  const toggleStatus = async (plan: any) => {
    try {
      await pb.collection('plans').update(plan.id, { is_active: !plan.is_active })
      loadPlans()
    } catch (e) {
      toast({ title: 'Erro ao atualizar plano', variant: 'destructive' })
    }
  }

  return (
    <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="bg-white border-b border-slate-100 flex flex-row justify-between items-center py-4">
        <CardTitle className="text-xl text-blue-950">Planos Cadastrados</CardTitle>
        <PlanDialog onSaved={loadPlans} />
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="pl-6">Nome</TableHead>
              <TableHead>Duração (Dias)</TableHead>
              <TableHead>Usuários</TableHead>
              <TableHead>Mensagens</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right pr-6">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((p) => (
              <TableRow key={p.id} className="hover:bg-slate-50/50">
                <TableCell className="font-semibold text-blue-950 pl-6">{p.name}</TableCell>
                <TableCell>{p.expiration_days}</TableCell>
                <TableCell>{p.max_users}</TableCell>
                <TableCell>{p.max_messages_month}</TableCell>
                <TableCell className="font-medium text-slate-700">
                  {formatCurrency(p.price_monthly)}
                </TableCell>
                <TableCell>
                  <Switch checked={p.is_active} onCheckedChange={() => toggleStatus(p)} />
                </TableCell>
                <TableCell className="text-right pr-6">
                  <PlanDialog plan={p} onSaved={loadPlans} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function PlanDialog({ plan, onSaved }: { plan?: any; onSaved: () => void }) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: plan?.name || '',
    expiration_days: plan?.expiration_days || 30,
    max_users: plan?.max_users || 1,
    max_messages_month: plan?.max_messages_month || 1000,
    price_monthly: plan?.price_monthly || 0,
    is_active: plan?.is_active ?? true,
  })

  const handleSave = async () => {
    try {
      if (plan?.id) {
        await pb.collection('plans').update(plan.id, formData)
      } else {
        await pb.collection('plans').create(formData)
      }
      toast({ title: 'Plano salvo com sucesso!' })
      setOpen(false)
      onSaved()
    } catch (e) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {plan ? (
          <Button
            variant="outline"
            size="sm"
            className="rounded-full hover:bg-blue-50 hover:text-blue-700"
          >
            <Edit2 className="w-3.5 h-3.5 mr-2" /> Editar
          </Button>
        ) : (
          <Button className="bg-orange-500 hover:bg-orange-600 rounded-xl text-white shadow-sm h-10">
            Novo Plano
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="rounded-3xl p-6">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-bold text-blue-950">
            {plan ? 'Editar Plano' : 'Novo Plano'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="grid gap-2">
            <Label className="text-slate-700 font-semibold">Nome do Plano</Label>
            <Input
              className="h-11 rounded-xl"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Basic"
            />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="grid gap-2">
              <Label className="text-slate-700 font-semibold">Duração (dias)</Label>
              <Input
                className="h-11 rounded-xl"
                type="number"
                value={formData.expiration_days}
                onChange={(e) =>
                  setFormData({ ...formData, expiration_days: Number(e.target.value) })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-slate-700 font-semibold">Max Usuários</Label>
              <Input
                className="h-11 rounded-xl"
                type="number"
                value={formData.max_users}
                onChange={(e) => setFormData({ ...formData, max_users: Number(e.target.value) })}
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-slate-700 font-semibold">Mensagens/mês</Label>
              <Input
                className="h-11 rounded-xl"
                type="number"
                value={formData.max_messages_month}
                onChange={(e) =>
                  setFormData({ ...formData, max_messages_month: Number(e.target.value) })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label className="text-slate-700 font-semibold">Preço Mensal (R$)</Label>
              <Input
                className="h-11 rounded-xl"
                type="number"
                value={formData.price_monthly}
                onChange={(e) =>
                  setFormData({ ...formData, price_monthly: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <Button
            onClick={handleSave}
            className="w-full h-11 bg-blue-950 hover:bg-blue-900 text-white rounded-xl shadow-md mt-4"
          >
            {plan ? 'Atualizar Plano' : 'Criar Plano'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
