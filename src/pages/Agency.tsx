import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
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
import { Plan } from '@/hooks/use-subscription'
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
import { Edit2, Play, Pause, Save, Shield } from 'lucide-react'

function PlansManager() {
  const [plans, setPlans] = useState<Plan[]>([])
  const { toast } = useToast()

  const loadPlans = async () => {
    const list = await pb.collection('plans').getFullList<Plan>()
    setPlans(list)
  }

  useEffect(() => {
    loadPlans()
  }, [])

  const toggleStatus = async (plan: Plan) => {
    try {
      await pb.collection('plans').update(plan.id, { is_active: !plan.is_active })
      loadPlans()
    } catch (e) {
      toast({ title: 'Erro', description: 'Erro ao atualizar plano.', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Planos Cadastrados</h2>
        <PlanDialog onSaved={loadPlans} />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Duração (Dias)</TableHead>
            <TableHead>Usuários</TableHead>
            <TableHead>Mensagens</TableHead>
            <TableHead>Preço</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((p) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell>{p.expiration_days}</TableCell>
              <TableCell>{p.max_users}</TableCell>
              <TableCell>{p.max_messages_month}</TableCell>
              <TableCell>R$ {p.price_monthly || 0}</TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${p.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                  {p.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </TableCell>
              <TableCell className="space-x-2">
                <Button variant="ghost" size="sm" onClick={() => toggleStatus(p)}>
                  {p.is_active ? (
                    <Pause className="w-4 h-4 text-orange-500" />
                  ) : (
                    <Play className="w-4 h-4 text-green-500" />
                  )}
                </Button>
                <PlanDialog planToEdit={p} onSaved={loadPlans} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function PlanDialog({ planToEdit, onSaved }: { planToEdit?: Plan; onSaved: () => void }) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<Partial<Plan>>(
    planToEdit || {
      name: '',
      expiration_days: 14,
      max_users: 1,
      max_messages_month: 1000,
      price_monthly: 0,
      is_active: true,
    },
  )

  const handleSave = async () => {
    try {
      if (planToEdit) {
        await pb.collection('plans').update(planToEdit.id, formData)
      } else {
        await pb.collection('plans').create(formData)
      }
      setOpen(false)
      onSaved()
    } catch {
      /* intentionally ignored */
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={planToEdit ? 'ghost' : 'default'} size={planToEdit ? 'sm' : 'default'}>
          {planToEdit ? <Edit2 className="w-4 h-4" /> : 'Novo Plano'}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{planToEdit ? 'Editar Plano' : 'Criar Plano'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div>
            <Label>Nome</Label>
            <Input
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Duração (Dias)</Label>
              <Input
                type="number"
                value={formData.expiration_days || ''}
                onChange={(e) =>
                  setFormData({ ...formData, expiration_days: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Preço (R$)</Label>
              <Input
                type="number"
                value={formData.price_monthly || ''}
                onChange={(e) =>
                  setFormData({ ...formData, price_monthly: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <Label>Máx Usuários</Label>
              <Input
                type="number"
                value={formData.max_users || ''}
                onChange={(e) => setFormData({ ...formData, max_users: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Máx Mensagens/mês</Label>
              <Input
                type="number"
                value={formData.max_messages_month || ''}
                onChange={(e) =>
                  setFormData({ ...formData, max_messages_month: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <Switch
              checked={formData.is_active}
              onCheckedChange={(c) => setFormData({ ...formData, is_active: c })}
            />
            <Label>Ativo para novas assinaturas</Label>
          </div>
        </div>
        <Button onClick={handleSave} className="w-full">
          <Save className="w-4 h-4 mr-2" /> Salvar
        </Button>
      </DialogContent>
    </Dialog>
  )
}

function CustomersManager() {
  const [subs, setSubs] = useState<any[]>([])
  const [plans, setPlans] = useState<Plan[]>([])

  const loadData = async () => {
    const list = await pb
      .collection('subscriptions')
      .getFullList({ expand: 'account_id,account_id.owner_id,plan_id' })
    setSubs(list)
    const pList = await pb.collection('plans').getFullList<Plan>()
    setPlans(pList)
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Clientes e Assinaturas</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Plano</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Expira em</TableHead>
            <TableHead>Mensagens</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subs.map((s) => {
            const acc = s.expand?.account_id
            const owner = acc?.expand?.owner_id
            const plan = s.expand?.plan_id
            const isExpired = new Date(s.end_date) < new Date()

            return (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="font-medium">
                    {owner?.name || owner?.email || 'Cliente sem nome'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {owner?.email || 'Email não disponível'}
                  </div>
                </TableCell>
                <TableCell>{plan?.name}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${isExpired ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}
                  >
                    {isExpired ? 'Expirado' : 'Ativo'}
                  </span>
                </TableCell>
                <TableCell>
                  {s.end_date ? format(parseISO(s.end_date), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                </TableCell>
                <TableCell>
                  {s.message_count} / {plan?.max_messages_month}
                </TableCell>
                <TableCell className="space-x-2 flex">
                  <CustomerDialog sub={s} plans={plans} onSaved={loadData} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function CustomerDialog({ sub, plans, onSaved }: { sub: any; plans: Plan[]; onSaved: () => void }) {
  const [open, setOpen] = useState(false)
  const [planId, setPlanId] = useState(sub.plan_id)
  const [addDaysVal, setAddDaysVal] = useState('30')

  const handleSavePlan = async () => {
    try {
      const p = plans.find((x) => x.id === planId)
      if (!p) return

      const newEnd = addDays(new Date(), p.expiration_days).toISOString()
      await pb.collection('subscriptions').update(sub.id, {
        plan_id: planId,
        end_date: newEnd,
        message_count: 0,
        status: 'active',
      })
      setOpen(false)
      onSaved()
    } catch {
      /* intentionally ignored */
    }
  }

  const handleExtend = async () => {
    try {
      const days = parseInt(addDaysVal)
      if (isNaN(days)) return
      const baseDate = new Date(sub.end_date) > new Date() ? new Date(sub.end_date) : new Date()
      const newEnd = addDays(baseDate, days).toISOString()
      await pb.collection('subscriptions').update(sub.id, {
        end_date: newEnd,
      })
      setOpen(false)
      onSaved()
    } catch {
      /* intentionally ignored */
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit2 className="w-4 h-4 mr-2" /> Gerenciar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar Assinatura</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-4 border p-4 rounded-lg bg-muted/30">
            <h3 className="font-semibold text-sm">Mudar Plano</h3>
            <Select value={planId} onValueChange={setPlanId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.expiration_days} dias, {p.max_messages_month} msgs)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSavePlan} className="w-full">
              Aplicar Plano & Resetar Uso
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Isso resetará o contador de mensagens e adicionará os dias do plano a partir de hoje.
            </p>
          </div>

          <div className="space-y-4 border p-4 rounded-lg bg-muted/30">
            <h3 className="font-semibold text-sm">Extender Data (Manter Plano Atual)</h3>
            <div className="flex gap-2">
              <Input
                type="number"
                value={addDaysVal}
                onChange={(e) => setAddDaysVal(e.target.value)}
              />
              <Button onClick={handleExtend} variant="secondary">
                Adicionar Dias
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function AgencyPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
          <Shield className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Agência LeadScale</h1>
          <p className="text-muted-foreground">Gerenciamento de planos, clientes e assinaturas.</p>
        </div>
      </div>

      <Tabs defaultValue="customers" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8 h-12">
          <TabsTrigger value="customers" className="text-base">
            Clientes
          </TabsTrigger>
          <TabsTrigger value="plans" className="text-base">
            Planos & Preços
          </TabsTrigger>
        </TabsList>
        <Card className="border-none shadow-md">
          <CardContent className="pt-6">
            <TabsContent value="customers" className="mt-0">
              <CustomersManager />
            </TabsContent>
            <TabsContent value="plans" className="mt-0">
              <PlansManager />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
}
