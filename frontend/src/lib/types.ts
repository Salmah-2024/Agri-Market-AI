export type Role = 'farmer' | 'buyer' | 'admin'

export interface Settings {
  market_region: string
  price_unit: 'kg' | 'bag'
  notify_sms: boolean
  notify_email: boolean
  language: string
}

export interface User {
  id: string
  role: Role
  email: string
  full_name: string
  phone: string
  region: string
  district?: string
  ward?: string
  farm_size_acres?: number
  main_crops?: string[]
  business_name?: string
  business_type?: string
  interested_crops?: string[]
  bio?: string
  settings: Settings
  created_at: string
}

export interface GovPrice {
  crop: string
  region: string
  price: number
  min_price?: number | null
  max_price?: number | null
  date: string
  unit: string
  source: string
  days_old: number
}

export type ListingStatus = 'available' | 'partially_sold' | 'sold' | 'withdrawn'

export interface Order {
  id: string
  buyer_id: string
  buyer_name: string
  buyer_phone: string
  farmer_id: string
  farmer_name: string
  listing_id: string
  crop: string
  region: string
  quantity_kg: number
  price_per_kg: number
  total: number
  payment_method: string
  delivery_note: string
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled'
  created_at: string
}

export interface Listing {
  id: string
  farmer_id: string
  farmer_name: string
  crop: string
  variety?: string
  quantity_kg: number
  quantity_available_kg: number
  price_per_kg: number
  region: string
  district?: string
  harvest_date?: string
  quality_grade?: string
  description?: string
  min_order_kg?: number
  status: ListingStatus
  created_at: string
  gov_price: GovPrice | null
  vs_gov_pct?: number
  farmer?: { full_name: string; phone: string; region: string; district?: string }
  orders?: Order[]
  in_carts?: number
}

export interface ForecastPoint {
  date: string
  price: number
  low: number
  high: number
}

export interface Forecast {
  crop: string
  region: string
  as_of: string
  current_price: number
  unit: string
  forecast: ForecastPoint[]
  change_pct: number
  trend: 'up' | 'down' | 'stable'
  best_day_to_sell: ForecastPoint
  best_day_to_buy: ForecastPoint
  recent: { date: string; price: number }[]
  model: string
  model_metrics?: Record<string, number>
  data_source?: string
  generated_at: string
  quantity_kg?: number
  expected_revenue_today?: number
  expected_revenue_best_day?: number
}

export interface PredictionRecord {
  id: string
  crop: string
  region: string
  days: number
  result: Forecast
  created_at: string
  accuracy_checked_days: number
  mean_error_pct: number | null
}

export interface CartItem {
  id: string
  listing: Listing
  quantity_kg: number
  subtotal: number
  problem: string | null
}

export interface Buyer {
  id: string
  full_name: string
  business_name?: string
  business_type?: string
  region: string
  district?: string
  phone: string
  email: string
  interested_crops?: string[]
  orders_with_you: number
  in_cart_with_you: number
}

export type TransportMode = 'road' | 'air' | 'water'
export type ShipmentStatus = 'requested' | 'dispatched' | 'delivered' | 'cancelled'

export interface TransportAgency {
  id: string
  name: string
  modes: TransportMode[]
  regions: string[]
  phone: string
  email: string
  verified: boolean
  rating?: number
}

export interface Shipment {
  id: string
  order_id: string
  crop: string
  quantity_kg: number
  pickup_region: string
  dest_region?: string
  mode: TransportMode
  agency: { id: string; name: string; phone: string; email: string; verified: boolean; rating?: number }
  status: ShipmentStatus
  note?: string
  buyer_name?: string
  farmer_name?: string
  created_at: string
  updated_at?: string
}
