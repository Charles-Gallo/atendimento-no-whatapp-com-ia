import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from './use-realtime'

export interface Plan {
  id: string
  name: string
  description?: string
  expiration_days: number
  max_users: number
  max_messages_month: number
  price_monthly?: number
  is_active: boolean
}

export interface Subscription {
  id: string
  account_id: string
  plan_id: string
  start_date: string
  end_date: string
  message_count: number
  status: 'active' | 'expired' | 'trial'
  expand?: {
    plan_id?: Plan
  }
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)

  const loadSub = async () => {
    if (!pb.authStore.record?.id) {
      setLoading(false)
      return
    }

    try {
      const member = await pb
        .collection('account_members')
        .getFirstListItem(`user_id="${pb.authStore.record.id}"`)
      const res = await pb
        .collection('subscriptions')
        .getFirstListItem<Subscription>(`account_id="${member.account_id}"`, { expand: 'plan_id' })
      setSubscription(res)
    } catch (e) {
      setSubscription(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSub()
  }, [])

  useRealtime('subscriptions', () => {
    loadSub()
  })

  return { subscription, loading }
}
