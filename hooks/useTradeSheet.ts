'use client'

import { useState } from 'react'
import type { Creator, TradeOrder } from '@/types'

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
