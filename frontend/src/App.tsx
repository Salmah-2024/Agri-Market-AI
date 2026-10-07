import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import {
  BrainCircuit,
  History,
  Landmark,
  LayoutDashboard,
  Receipt,
  Settings,
  ShoppingBasket,
  ShoppingCart,
  Sprout,
  Truck,
  User,
  Users,
} from 'lucide-react'
import { Toaster } from 'sonner'

import { DashboardLayout, type NavItem } from '@/components/layout/DashboardLayout'
import GovPricesPage from '@/components/shared/GovPricesPage'
import HistoryPage from '@/components/shared/HistoryPage'
import PredictionsPage from '@/components/shared/PredictionsPage'
import ProfilePage from '@/components/shared/ProfilePage'
import SettingsPage from '@/components/shared/SettingsPage'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { CartProvider, useCart } from '@/context/CartContext'
import { LoginPage, RegisterPage } from '@/pages/AuthPages'
import Landing from '@/pages/Landing'
import SiteLayout from '@/components/site/SiteLayout'
import HowItWorksPage from '@/pages/site/HowItWorksPage'
import OfferPage from '@/pages/site/OfferPage'
import ServePage from '@/pages/site/ServePage'
import TechnologyPage from '@/pages/site/TechnologyPage'
import BeiPage from '@/pages/site/BeiPage'
import SokoPage from '@/pages/site/SokoPage'
import { BuyerOrders, CartPage, Marketplace } from '@/pages/buyer/BuyerPages'
import { BuyersPage, FarmerOrders, FarmerOverview, MyCrops } from '@/pages/farmer/FarmerPages'
import { AdminGovPrices, AdminOverview, AdminUsers } from '@/pages/admin/AdminPages'
import { BuyerTransport, FarmerShipments } from '@/pages/transport/TransportPages'
import type { Role } from '@/lib/types'

const FARMER_NAV: NavItem[] = [
  { to: '/farmer', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/farmer/crops', label: 'My crops', icon: Sprout },
  { to: '/farmer/orders', label: 'Orders', icon: Receipt },
  { to: '/farmer/buyers', label: 'Buyers', icon: Users },
  { to: '/farmer/shipments', label: 'Shipments', icon: Truck },
  { to: '/farmer/predictions', label: 'Sales predictions', icon: BrainCircuit },
  { to: '/farmer/history', label: 'Prediction history', icon: History },
  { to: '/farmer/gov-prices', label: 'Government prices', icon: Landmark },
  { to: '/farmer/profile', label: 'Profile', icon: User },
  { to: '/farmer/settings', label: 'Settings', icon: Settings },
]

const ADMIN_NAV: NavItem[] = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/gov-prices', label: 'Government prices', icon: Landmark },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/profile', label: 'Profile', icon: User },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

function Protected({ role, children }: { role: Role; children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        <Sprout className="mr-2 size-5 animate-pulse text-primary" /> Loading…
      </div>
    )
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== role) return <Navigate to={`/${user.role}`} replace />
  return <>{children}</>
}

function BuyerLayout() {
  const { count } = useCart()
  const nav: NavItem[] = [
    { to: '/buyer', label: 'Available crops', icon: ShoppingBasket, end: true },
    { to: '/buyer/cart', label: 'Cart', icon: ShoppingCart, badge: count },
    { to: '/buyer/orders', label: 'My orders', icon: Receipt },
    { to: '/buyer/transport', label: 'Transport', icon: Truck },
    { to: '/buyer/predictions', label: 'AI predictions', icon: BrainCircuit },
    { to: '/buyer/history', label: 'Prediction history', icon: History },
    { to: '/buyer/gov-prices', label: 'Government prices', icon: Landmark },
    { to: '/buyer/profile', label: 'Profile', icon: User },
    { to: '/buyer/settings', label: 'Settings', icon: Settings },
  ]
  return <DashboardLayout items={nav} basePath="/buyer" />
}

const shared = [
  { path: 'predictions', el: <PredictionsPage /> },
  { path: 'history', el: <HistoryPage /> },
  { path: 'gov-prices', el: <GovPricesPage /> },
  { path: 'profile', el: <ProfilePage /> },
  { path: 'settings', el: <SettingsPage /> },
]

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/soko" element={<SokoPage />} />
            <Route path="/bei" element={<BeiPage />} />
            <Route path="/offer" element={<OfferPage />} />
            <Route path="/who-we-serve" element={<ServePage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/technology" element={<TechnologyPage />} />
          </Route>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/farmer"
            element={
              <Protected role="farmer">
                <DashboardLayout items={FARMER_NAV} basePath="/farmer" />
              </Protected>
            }
          >
            <Route index element={<FarmerOverview />} />
            <Route path="crops" element={<MyCrops />} />
            <Route path="orders" element={<FarmerOrders />} />
            <Route path="buyers" element={<BuyersPage />} />
            <Route path="shipments" element={<FarmerShipments />} />
            {shared.map((r) => (
              <Route key={r.path} path={r.path} element={r.el} />
            ))}
          </Route>
          <Route
            path="/buyer"
            element={
              <Protected role="buyer">
                <CartProvider>
                  <BuyerLayout />
                </CartProvider>
              </Protected>
            }
          >
            <Route index element={<Marketplace />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="orders" element={<BuyerOrders />} />
            <Route path="transport" element={<BuyerTransport />} />
            {shared.map((r) => (
              <Route key={r.path} path={r.path} element={r.el} />
            ))}
          </Route>
          <Route
            path="/admin"
            element={
              <Protected role="admin">
                <DashboardLayout items={ADMIN_NAV} basePath="/admin" />
              </Protected>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="gov-prices" element={<AdminGovPrices />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors position="top-right" />
    </AuthProvider>
  )
}
