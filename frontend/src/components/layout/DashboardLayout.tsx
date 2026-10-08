import { useState, type ReactNode } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LogOut, Menu, Settings as SettingsIcon, User as UserIcon, type LucideIcon } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import LanguageToggle from '@/components/shared/LanguageToggle'
import { useAuth } from '@/context/AuthContext'
import { useT } from '@/lib/i18n'
import { initials } from '@/lib/format'
import { cn } from '@/lib/utils'

const ROLE_LABEL: Record<string, [string, string]> = {
  farmer: ['Dashibodi ya mkulima', 'Farmer dashboard'],
  buyer: ['Dashibodi ya mnunuzi', 'Buyer dashboard'],
  admin: ['Dashibodi ya msimamizi', 'Admin dashboard'],
}

export interface NavItem {
  to: string
  label: string // Kiswahili (default)
  labelEn?: string // English (optional; shown when language = EN)
  icon: LucideIcon
  badge?: number
  end?: boolean
}

function SidebarNav({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const { user } = useAuth()
  const t = useT()
  const roleLabel = ROLE_LABEL[user?.role ?? '']
  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex size-9 items-center justify-center overflow-hidden rounded-lg bg-white">
          <img src="/images/logo.png" alt="" className="size-9 scale-[1.6] object-contain" />
        </div>
        <div>
          <p className="font-display font-medium leading-tight">
            Agri-Market <span className="text-[#8DC63F]">AI</span>
          </p>
          <p className="text-xs opacity-70">{roleLabel ? t(roleLabel[0], roleLabel[1]) : ''}</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-sidebar-accent',
                isActive && 'bg-sidebar-accent font-medium',
              )
            }
          >
            <it.icon className="size-4 opacity-80" />
            <span className="flex-1">{it.labelEn ? t(it.label, it.labelEn) : it.label}</span>
            {!!it.badge && <Badge className="h-5 min-w-5 rounded-full px-1.5">{it.badge}</Badge>}
          </NavLink>
        ))}
      </nav>
      <p className="px-5 py-4 text-xs opacity-60">{t('Bei zote ziko kwa Shilingi za Tanzania (TZS)', 'Prices in Tanzanian Shillings (TZS)')}</p>
    </div>
  )
}

export function DashboardLayout({ items, basePath }: { items: NavItem[]; basePath: string }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const t = useT()
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block">
        <SidebarNav items={items} />
      </aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 border-0 p-0">
          <SidebarNav items={items} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur md:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label={t('Fungua menyu', 'Open menu')}>
            <Menu />
          </Button>
          <div className="flex-1 text-sm text-muted-foreground">
            {t('Karibu', 'Welcome')}, <span className="font-medium text-foreground">{user?.full_name?.split(' ')[0]}</span>
          </div>
          <LanguageToggle className="mr-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary/15 text-primary">{initials(user?.full_name)}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="truncate">{user?.full_name}</p>
                <p className="truncate text-xs font-normal text-muted-foreground">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(`${basePath}/profile`)}>
                <UserIcon /> {t('Wasifu', 'Profile')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(`${basePath}/settings`)}>
                <SettingsIcon /> {t('Mipangilio', 'Settings')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
              >
                <LogOut /> {t('Toka', 'Log out')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}
