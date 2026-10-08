import { useState } from 'react'
import { Loader2, Mail, MapPin, Phone, Save } from 'lucide-react'
import { toast } from 'sonner'

import { PageHeader } from '@/components/layout/DashboardLayout'
import { Field, SimpleSelect } from '@/components/shared/common'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/context/AuthContext'
import { api, ApiError } from '@/lib/api'
import { initials, longDate } from '@/lib/format'
import { useT } from '@/lib/i18n'
import { sw } from '@/lib/crops'
import type { User } from '@/lib/types'

export function CropChips({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((c) => {
        const on = value.includes(c)
        return (
          <button
            type="button"
            key={c}
            onClick={() => onChange(on ? value.filter((x) => x !== c) : [...value, c])}
            className={`rounded-full border px-3 py-1 text-sm transition-colors ${
              on ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent'
            }`}
          >
            {sw(c)}
          </button>
        )
      })}
    </div>
  )
}

export default function ProfilePage() {
  const t = useT()
  const { user, setUser, meta } = useAuth()
  const [form, setForm] = useState<Partial<User>>({ ...user })
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  if (!user) return null
  const isFarmer = user.role === 'farmer'
  const isAdmin = user.role === 'admin'
  const set = (k: keyof User, v: unknown) => setForm((f) => ({ ...f, [k]: v }))

  const save = async () => {
    setBusy(true)
    setErrors({})
    try {
      const fields = isAdmin
        ? ['full_name', 'phone']
        : isFarmer
          ? ['full_name', 'phone', 'region', 'district', 'ward', 'farm_size_acres', 'main_crops', 'bio']
          : ['full_name', 'phone', 'region', 'district', 'business_name', 'business_type', 'interested_crops', 'bio']
      const body = Object.fromEntries(fields.map((f) => [f, form[f as keyof User]]))
      const r = await api<{ user: User }>('/profile', { method: 'PUT', body })
      setUser(r.user)
      toast.success(t('Wasifu umehifadhiwa', 'Profile saved'))
    } catch (e) {
      if (e instanceof ApiError && e.fields) setErrors(e.fields)
      toast.error((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title={t('Wasifu wangu', 'My profile')} description={t('Hivi ndivyo watumiaji wengine wanavyokuona wanaposhughulika nawe.', 'This is what other users see when they deal with you.')} />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardContent className="flex flex-col items-center text-center">
            <Avatar className="size-20">
              <AvatarFallback className="bg-primary/15 text-2xl text-primary">{initials(user.full_name)}</AvatarFallback>
            </Avatar>
            <p className="mt-3 text-lg font-semibold">{user.full_name}</p>
            {user.business_name && <p className="text-sm text-muted-foreground">{user.business_name}</p>}
            <Badge className="mt-2 capitalize">
              {user.role === 'farmer'
                ? t('Mkulima', 'Farmer')
                : user.role === 'buyer'
                  ? t('Mnunuzi', 'Buyer')
                  : t('Msimamizi', 'Admin')}
            </Badge>
            <div className="mt-5 w-full space-y-2 text-left text-sm">
              <p className="flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground" /> {user.email}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="size-4 text-muted-foreground" /> {user.phone}
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="size-4 text-muted-foreground" /> {[user.district, user.region].filter(Boolean).join(', ')}
              </p>
            </div>
            <p className="mt-5 text-xs text-muted-foreground">{t('Mwanachama tangu', 'Member since')} {longDate(user.created_at)}</p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('Hariri taarifa', 'Edit details')}</CardTitle>
            <CardDescription>{t(`Weka namba yako ya simu sahihi ili ${isFarmer ? 'wanunuzi' : 'wakulima'} waweze kukufikia.`, `Keep your phone number correct so ${isFarmer ? 'buyers' : 'farmers'} can reach you.`)}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label={t('Jina kamili', 'Full name')} error={errors.full_name}>
              <Input value={form.full_name ?? ''} onChange={(e) => set('full_name', e.target.value)} />
            </Field>
            <Field label={t('Simu', 'Phone')} error={errors.phone}>
              <Input value={form.phone ?? ''} onChange={(e) => set('phone', e.target.value)} />
            </Field>
            <Field label={t('Mkoa', 'Region')}>
              <SimpleSelect value={form.region} onChange={(v) => set('region', v)} options={meta.regions} />
            </Field>
            <Field label={t('Wilaya', 'District')}>
              <Input value={form.district ?? ''} onChange={(e) => set('district', e.target.value)} />
            </Field>
            {isAdmin ? null : isFarmer ? (
              <>
                <Field label={t('Kata / kijiji', 'Ward / village')}>
                  <Input value={form.ward ?? ''} onChange={(e) => set('ward', e.target.value)} />
                </Field>
                <Field label={t('Ukubwa wa shamba (ekari)', 'Farm size (acres)')}>
                  <Input
                    type="number"
                    min={0}
                    value={form.farm_size_acres ?? ''}
                    onChange={(e) => set('farm_size_acres', e.target.value ? Number(e.target.value) : null)}
                  />
                </Field>
                <Field label={t('Mazao unayolima', 'Crops you grow')} className="sm:col-span-2">
                  <CropChips options={meta.crops} value={form.main_crops ?? []} onChange={(v) => set('main_crops', v)} />
                </Field>
              </>
            ) : (
              <>
                <Field label={t('Jina la biashara', 'Business name')}>
                  <Input value={form.business_name ?? ''} onChange={(e) => set('business_name', e.target.value)} />
                </Field>
                <Field label={t('Aina ya biashara', 'Business type')}>
                  <SimpleSelect
                    value={form.business_type}
                    onChange={(v) => set('business_type', v)}
                    options={[
                      { value: 'Wholesaler', label: t('Muuzaji wa jumla', 'Wholesaler') },
                      { value: 'Retailer', label: t('Muuzaji wa rejareja', 'Retailer') },
                      { value: 'Processor', label: t('Msindikaji', 'Processor') },
                      { value: 'Exporter', label: t('Msafirishaji nje', 'Exporter') },
                      { value: 'Institution (school, hospital)', label: t('Taasisi (shule, hospitali)', 'Institution (school, hospital)') },
                      { value: 'Individual', label: t('Mtu binafsi', 'Individual') },
                    ]}
                  />
                </Field>
                <Field label={t('Mazao unayonunua', 'Crops you buy')} className="sm:col-span-2">
                  <CropChips options={meta.crops} value={form.interested_crops ?? []} onChange={(v) => set('interested_crops', v)} />
                </Field>
              </>
            )}
            <Field label={t('Kuhusu', 'About')} className="sm:col-span-2">
              <Textarea value={form.bio ?? ''} onChange={(e) => set('bio', e.target.value)} placeholder={t('Maelezo mafupi', 'A short description')} />
            </Field>
            <div className="sm:col-span-2">
              <Button onClick={save} disabled={busy}>
                {busy ? <Loader2 className="animate-spin" /> : <Save />} {t('Hifadhi wasifu', 'Save profile')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
