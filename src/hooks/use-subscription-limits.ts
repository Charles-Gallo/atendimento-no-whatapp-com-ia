import { useSubscription } from './use-subscription'
import { useTeamMembers } from './use-team-members'
import { differenceInDays, parseISO } from 'date-fns'

export function useSubscriptionLimits() {
  const { subscription, loading: subLoading } = useSubscription()
  const { members, loading: membersLoading } = useTeamMembers()

  const loading = subLoading || membersLoading

  if (!subscription || !subscription.expand?.plan_id) {
    return {
      canSendMessage: false,
      canInviteUser: false,
      isExpired: false,
      loading,
    }
  }

  const plan = subscription.expand.plan_id
  const daysRemaining = subscription.end_date
    ? differenceInDays(parseISO(subscription.end_date), new Date())
    : 0

  const isExpired = daysRemaining < 0
  const msgsUsed = subscription.message_count || 0
  const msgsMax = plan.max_messages_month || 0
  const usersUsed = members.length
  const usersMax = plan.max_users || 0

  const canSendMessage = !isExpired && msgsUsed < msgsMax
  const canInviteUser = !isExpired && usersUsed < usersMax

  return {
    canSendMessage,
    canInviteUser,
    isExpired,
    loading,
  }
}
