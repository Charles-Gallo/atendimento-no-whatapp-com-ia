import React, { useEffect } from 'react'
import { useSubscription } from '@/hooks/use-subscription'
import { useTeamMembers } from '@/hooks/use-team-members'
import { differenceInDays, parseISO } from 'date-fns'
import { AlertCircle, Clock, Users, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

export function SubscriptionStatusBar() {
  const { subscription, loading } = useSubscription()
  const { members } = useTeamMembers()
  const { toast } = useToast()

  const plan = subscription?.expand?.plan_id
  const daysRemaining = subscription?.end_date
    ? differenceInDays(parseISO(subscription.end_date), new Date())
    : 0

  const isExpired = daysRemaining < 0
  const msgsUsed = subscription?.message_count || 0
  const msgsMax = plan?.max_messages_month || 0
  const usersUsed = members.length
  const usersMax = plan?.max_users || 0
  const msgsRatio = msgsMax > 0 ? msgsUsed / msgsMax : 0

  useEffect(() => {
    if (!subscription || loading) return

    if (isExpired) {
      document.body.classList.add('plan-expired')
      toast({
        title: 'Plano Expirado',
        description: 'Seu plano expirou. A plataforma está em modo de leitura.',
        variant: 'destructive',
      })
    } else {
      document.body.classList.remove('plan-expired')
      if (daysRemaining <= 3 && daysRemaining >= 0) {
        toast({
          title: 'Atenção',
          description: `Seu plano expira em ${daysRemaining} dias.`,
          variant: 'destructive',
        })
      }
    }

    if (msgsRatio >= 0.8 && msgsRatio < 1) {
      toast({
        title: 'Limite de Mensagens Próximo',
        description: 'Você já usou 80% ou mais das mensagens do seu plano.',
        variant: 'destructive',
      })
    }

    return () => document.body.classList.remove('plan-expired')
  }, [subscription?.id, isExpired, daysRemaining, msgsRatio, loading, toast])

  if (loading || !subscription || !plan) return null

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 rounded-lg shadow-sm border text-sm backdrop-blur-md transition-all',
        isExpired
          ? 'bg-destructive/10 border-destructive/20 text-destructive-foreground'
          : msgsRatio >= 0.8 || daysRemaining <= 3
            ? 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-950/30 dark:text-orange-300'
            : 'bg-white/80 border-border text-muted-foreground dark:bg-zinc-900/80',
      )}
    >
      <div className="flex items-center gap-2 font-medium">
        {isExpired ? (
          <AlertCircle className="w-4 h-4 text-destructive" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        )}
        <span className={cn(isExpired ? 'text-destructive font-bold' : 'text-foreground')}>
          {isExpired ? 'PLANO EXPIRADO' : `Plano: ${plan.name}`}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        <div className="flex items-center gap-1.5" title="Dias restantes">
          <Clock className="w-4 h-4 opacity-70" />
          <span className={cn(daysRemaining <= 3 && 'font-bold text-destructive')}>
            {isExpired ? 'Expirado' : `${daysRemaining} dias restantes`}
          </span>
        </div>

        <div className="flex items-center gap-1.5" title="Uso de Mensagens">
          <MessageSquare className="w-4 h-4 opacity-70" />
          <span
            className={cn(msgsRatio >= 0.8 && 'font-bold text-orange-600 dark:text-orange-400')}
          >
            {msgsUsed} / {msgsMax} msgs
          </span>
        </div>

        <div className="flex items-center gap-1.5" title="Uso de Usuários">
          <Users className="w-4 h-4 opacity-70" />
          <span
            className={cn(
              usersUsed >= usersMax && 'font-bold text-orange-600 dark:text-orange-400',
            )}
          >
            {usersUsed} / {usersMax} usuários
          </span>
        </div>
      </div>
    </div>
  )
}
