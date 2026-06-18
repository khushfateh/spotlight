'use client'

import { useState } from 'react'
import type { Creator, TradeOrder } from '@/types'
import { supabase } from '@/lib/supabase/client'
import { logSpot, removeSpot } from '@/lib/services/spotService'
import { spotCreator } from '@/lib/services/spotterService'
import { logCreatorView } from '@/lib/services/interactionService'
import { logDiscoveryCard } from '@/lib/services/vaultService'
import { getMomentum, getMomentumTier } from '@/lib/mock-data/momentum'

type TradeStep = 'form' | 'confirm' | 'success' | 'error'

export function useTradeSheet() {
  const [isOpen, setIsOpen] = useState(false)
  const [creator, setCreator] = useState<Creator | null>(null)
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy')
  const [step, setStep] = useState<TradeStep>('form')
  const [pendingOrder, setPendingOrder] = useState<TradeOrder | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function openBuy(c: Creator) {
    setCreator(c)
    setTradeType('buy')
    setStep('form')
    setPendingOrder(null)
    setIsOpen(true)
  }

  function openSell(c: Creator) {
    setCreator(c)
    setTradeType('sell')
    setStep('form')
    setPendingOrder(null)
    setIsOpen(true)
  }

  function close() {
    setIsOpen(false)
    setTimeout(() => {
      setStep('form')
      setPendingOrder(null)
      setCreator(null)
    }, 300)
  }

  function submitOrder(order: TradeOrder) {
    setPendingOrder(order)
    setStep('confirm')
  }

  // Spot immediately — no confirm screen, no delay, cinematic starts instantly
  function spotNow() {
    setPendingOrder({ type: 'buy', orderType: 'market', shares: 1, estimatedTotal: 0 })
    if (supabase && creator) {
      const ticker = creator.ticker
      const { score } = getMomentum(ticker)
      const tier = getMomentumTier(score)
      supabase.auth.getSession().then(async ({ data }) => {
        const uid = data.session?.user?.id
        if (!uid) return
        const result = await spotCreator(uid, ticker).catch(() => null)
        if (!result) await logSpot(uid, ticker).catch(() => {})
        const spotterNum = result?.spotterNumber ?? 0
        logCreatorView(uid, ticker).catch(() => {})
        logDiscoveryCard(uid, ticker, spotterNum, score, tier).catch(() => {})
      })
    }
    setStep('success')
  }

  async function confirmOrder() {
    setIsSubmitting(true)

    // Persist to Supabase (fire and forget — never blocks the UX)
    if (supabase && creator) {
      supabase.auth.getSession().then(async ({ data }) => {
        const uid = data.session?.user?.id
        if (!uid) return
        if (tradeType === 'buy') {
          const r = await spotCreator(uid, creator.ticker).catch(() => null)
          if (!r) logSpot(uid, creator.ticker).catch(() => {})
          logCreatorView(uid, creator.ticker).catch(() => {})
        } else {
          removeSpot(uid, creator.ticker).catch(() => {})
        }
      })
    }

    await new Promise(r => setTimeout(r, 1500))
    setIsSubmitting(false)
    setStep('success')
  }

  function reset() {
    setStep('form')
    setPendingOrder(null)
  }

  return {
    isOpen,
    creator,
    tradeType,
    step,
    pendingOrder,
    isSubmitting,
    openBuy,
    openSell,
    close,
    spotNow,
    submitOrder,
    confirmOrder,
    reset,
  }
}
