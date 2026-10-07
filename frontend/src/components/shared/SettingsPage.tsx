import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, Loader2, Moon, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/DashboardLayout'
import { Field, SimpleSelect } from '@/components/shared/common'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import type { Settings, User } from '@/lib/types'
import { useTheme } from '@/lib/theme'

export default function SettingsPage() {
  const { user, setUser, meta, logout } = useAuth()
  const navigate = useNavigate()
  const { dark, setDark } = useTheme()
  const [pw, setPw] = useState({ current_password: '', new_password: '' })
  const [pwBusy, setPwBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  if (!user) return null

  const update = async (patch: Partial<Settings>) => {
    try {
      const r = await api<{ user: User }>('/settings', { method: 'PUT', body: patch })
      setUser(r.user)
      toast.success('Settings saved')
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const changePassword = async () => {
    setPwBusy(true)
    try {
      await api('/settings/password', { method: 'PUT', body: pw })
      setPw({ current_password: '', new_password: '' })
      toast.success('Password changed')
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setPwBusy(false)
    }
  }

  const deleteAccount = async () => {
    await api('/settings/account', { method: 'DELETE' })
    logout()
    navigate('/')
    toast.success('Account deleted')
  }

  const s = user.settings
  return (
    <>
      <PageHeader title="Settings" description="Market, display, notification and account settings." />
      <div className="grid max-w-3xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Market & prices</CardTitle>
            <CardDescription>Used by default for predictions and government prices.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Default market region">
              <SimpleSelect value={s.market_region} onChange={(v) => update({ market_region: v })} options={meta.market_regions} />
            </Field>
            <Field label="Show prices per">
              <SimpleSelect
                value={s.price_unit}
                onChange={(v) => update({ price_unit: v as Settings['price_unit'] })}
                options={[
                  { value: 'kg', label: 'Kilogram (kg)' },
                  { value: 'bag', label: 'Bag (100 kg)' },
                ]}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications & display</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Row label="SMS alerts" hint="New orders and big price changes">
              <Switch checked={s.notify_sms} onCheckedChange={(v) => update({ notify_sms: v })} />
            </Row>
            <Separator />
            <Row label="Email alerts" hint="Weekly price summary">
              <Switch checked={s.notify_email} onCheckedChange={(v) => update({ notify_email: v })} />
            </Row>
            <Separator />
            <Row label="Dark mode" hint="Saved on this device" icon={<Moon className="size-4" />}>
              <Switch checked={dark} onCheckedChange={setDark} />
            </Row>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="size-5" /> Change password
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Current password">
              <Input
                type="password"
                value={pw.current_password}
                onChange={(e) => setPw({ ...pw, current_password: e.target.value })}
              />
            </Field>
            <Field label="New password" hint="At least 6 characters">
              <Input type="password" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} />
            </Field>
            <div>
              <Button onClick={changePassword} disabled={pwBusy || !pw.current_password || !pw.new_password}>
                {pwBusy && <Loader2 className="animate-spin" />} Update password
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-destructive">Delete account</CardTitle>
            <CardDescription>
              Removes your account. {user.role === 'farmer' ? 'Your unsold crops are withdrawn from the market.' : 'Your cart is emptied.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 /> Delete my account
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteAccount}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Row({ label, hint, children, icon }: { label: string; hint?: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <Label className="flex items-center gap-2">
          {icon}
          {label}
        </Label>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  )
}
