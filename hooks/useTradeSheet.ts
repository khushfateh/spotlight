'use client'

import { useState } from 'react'
import type { Creator, TradeOrder } from '@/types'
import { supabase } from '@/lib/supabase/client'
import { logSpot, removeSpot } from '@/lib/services/spotService'
import { logCreatorView } from '@/lib/services/interactionService'

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

  async function confirmOrder() {
    setIsSubmitting(true)

    // Persist to Supabase (fire and forget — never blocks the UX)
    if (supabase && creator) {
      supabase.auth.getSession().then(({ data }) => {
        const uid = data.session?.user?.id
        if (!uid) return
        if (tradeType === 'buy') {
          logSpot(uid, creator.ticker).catch(() => {})
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
    submitOrder,
    confirmOrder,
    reset,
  }
}
