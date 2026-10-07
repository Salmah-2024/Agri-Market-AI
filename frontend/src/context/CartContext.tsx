import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

import { api } from '@/lib/api'
import type { CartItem } from '@/lib/types'

interface CartResp {
  items: CartItem[]
  total: number
  count: number
}

interface CartState extends CartResp {
  loading: boolean
  reload: () => Promise<void>
  add: (listingId: string, qty: number) => Promise<void>
  update: (itemId: string, qty: number) => Promise<void>
  remove: (itemId: string) => Promise<void>
}

const CartContext = createContext<CartState | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CartResp>({ items: [], total: 0, count: 0 })
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    try {
      setState(await api<CartResp>('/cart'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload().catch(() => {})
  }, [reload])

  const add = async (listing_id: string, quantity_kg: number) =>
    setState(await api<CartResp>('/cart', { method: 'POST', body: { listing_id, quantity_kg } }))
  const update = async (id: string, quantity_kg: number) =>
    setState(await api<CartResp>(`/cart/${id}`, { method: 'PATCH', body: { quantity_kg } }))
  const remove = async (id: string) => setState(await api<CartResp>(`/cart/${id}`, { method: 'DELETE' }))

  return <CartContext.Provider value={{ ...state, loading, reload, add, update, remove }}>{children}</CartContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
