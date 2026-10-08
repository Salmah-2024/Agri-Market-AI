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
import { useT } from '@/lib/i18n'
import type { Settings, User } from '@/lib/types'
import { useTheme } from '@/lib/theme'

export default function SettingsPage() {
  const t = useT()
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
      toast.success(t('Mipangilio imehifadhiwa', 'Settings saved'))
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  const changePassword = async () => {
    setPwBusy(true)
    try {
      await api('/settings/password', { method: 'PUT', body: pw })
      setPw({ current_password: '', new_password: '' })
      toast.success(t('Nenosiri limebadilishwa', 'Password changed'))
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
    toast.success(t('Akaunti imefutwa', 'Account deleted'))
  }

  const s = user.settings
  return (
    <>
      <PageHeader title={t('Mipangilio', 'Settings')} description={t('Mipangilio ya soko, maonyesho, taarifa na akaunti.', 'Market, display, notification and account settings.')} />
      <div className="grid max-w-3xl gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('Soko na bei', 'Market & prices')}</CardTitle>
            <CardDescription>{t('Hutumika kama chaguo-msingi kwa utabiri na bei za serikali.', 'Used by default for predictions and government prices.')}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label={t('Mkoa chaguo-msingi wa soko', 'Default market region')}>
              <SimpleSelect value={s.market_region} onChange={(v) => update({ market_region: v })} options={meta.market_regions} />
            </Field>
            <Field label={t('Onyesha bei kwa', 'Show prices per')}>
              <SimpleSelect
                value={s.price_unit}
                onChange={(v) => update({ price_unit: v as Settings['price_unit'] })}
                options={[
                  { value: 'kg', label: t('Kilogramu (kg)', 'Kilogram (kg)') },
                  { value: 'bag', label: t('Gunia (kg 100)', 'Bag (100 kg)') },
                ]}
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('Arifa na maonyesho', 'Notifications & display')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Row label={t('Arifa za SMS', 'SMS alerts')} hint={t('Oda mpya na mabadiliko makubwa ya bei', 'New orders and big price changes')}>
              <Switch checked={s.notify_sms} onCheckedChange={(v) => update({ notify_sms: v })} />
            </Row>
            <Separator />
            <Row label={t('Arifa za barua pepe', 'Email alerts')} hint={t('Muhtasari wa bei wa kila wiki', 'Weekly price summary')}>
              <Switch checked={s.notify_email} onCheckedChange={(v) => update({ notify_email: v })} />
            </Row>
            <Separator />
            <Row label={t('Hali ya giza', 'Dark mode')} hint={t('Imehifadhiwa kwenye kifaa hiki', 'Saved on this device')} icon={<Moon className="size-4" />}>
              <Switch checked={dark} onCheckedChange={setDark} />
            </Row>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="size-5" /> {t('Badili nenosiri', 'Change password')}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label={t('Nenosiri la sasa', 'Current password')}>
              <Input
                type="password"
                value={pw.current_password}
                onChange={(e) => setPw({ ...pw, current_password: e.target.value })}
              />
            </Field>
            <Field label={t('Nenosiri jipya', 'New password')} hint={t('Angalau herufi 6', 'At least 6 characters')}>
              <Input type="password" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} />
            </Field>
            <div>
              <Button onClick={changePassword} disabled={pwBusy || !pw.current_password || !pw.new_password}>
                {pwBusy && <Loader2 className="animate-spin" />} {t('Sasisha nenosiri', 'Update password')}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-destructive">{t('Futa akaunti', 'Delete account')}</CardTitle>
            <CardDescription>
              {t('Inaondoa akaunti yako.', 'Removes your account.')} {user.role === 'farmer' ? t('Mazao yako ambayo hayajauzwa yanaondolewa sokoni.', 'Your unsold crops are withdrawn from the market.') : t('Kikapu chako kinamwagwa.', 'Your cart is emptied.')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
              <Trash2 /> {t('Futa akaunti yangu', 'Delete my account')}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Kufuta akaunti yako?', 'Delete your account?')}</DialogTitle>
            <DialogDescription>{t('Hili haliwezi kutenduliwa.', 'This cannot be undone.')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              {t('Ghairi', 'Cancel')}
            </Button>
            <Button variant="destructive" onClick={deleteAccount}>
              {t('Futa', 'Delete')}
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
