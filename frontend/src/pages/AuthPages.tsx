import { useState, type ComponentProps, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  ShoppingBasket,
  Sprout,
  Tractor,
  TrendingUp,
  Truck,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'

import { BRAND, LeafMark, TractorArt } from '@/components/brand/Brand'
import { SimpleSelect } from '@/components/shared/common'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/lib/api'
import type { Role } from '@/lib/types'
import { cn } from '@/lib/utils'

/* ------------------------------------------------------------------
   Pictures in frontend/public/images (paths WITHOUT "/public")
------------------------------------------------------------------- */
const IMAGES = {
  farmerBg: '/images/Farm.jpeg',
  buyerBg: '/images/image4.png',
  loginBg: '/images/login%20page.png', // file: "login page.png"
  tractor: '/images/farmer.png',
  moneyPlant: '/images/buyer.png',
  logo: '/images/logo.png',
}

const FALLBACK_BG = 'linear-gradient(160deg, #3f6b22 0%, #1E5631 55%, #4a3322 100%)'

/* ------------------------------------------------------------------
   Small building blocks
------------------------------------------------------------------- */
function Img({ src, className, fallback = null }: { src: string; className?: string; fallback?: ReactNode }) {
  const [failed, setFailed] = useState(false)
  if (failed) return <>{fallback}</>
  return <img src={src} alt="" aria-hidden="true" className={cn('object-contain', className)} onError={() => setFailed(true)} />
}

function BrandMark({ light = false, className }: { light?: boolean; className?: string }) {
  return (
    <Link to="/" className={cn('inline-flex items-center gap-2.5', className)} aria-label="Agri-Market AI home">
      <span className={cn('grid size-10 place-items-center rounded-xl', light ? 'bg-white/95 shadow-lg' : 'bg-[#EEF5EA]')}>
        <Img src={IMAGES.logo} className="size-9 scale-[1.6]" fallback={<LeafMark className="size-6" />} />
      </span>
      <span className={cn('text-lg font-semibold tracking-tight', light ? 'text-white' : 'text-[#111827]')}>
        Agri-Market <span style={{ color: BRAND.lime }}>AI</span>
      </span>
    </Link>
  )
}

/** Full-height photo panel with a dark green gradient so white text is always readable. */
function PhotoPanel({ image, children, className }: { image: string; children: ReactNode; className?: string }) {
  return (
    <aside
      className={cn('relative hidden overflow-hidden bg-cover bg-center lg:block', className)}
      style={{ backgroundImage: `url('${image}'), ${FALLBACK_BG}` }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-[#0B2414] via-[#0B2414]/55 to-[#0B2414]/45" />
      <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">{children}</div>
    </aside>
  )
}

function Tagline({ className }: { className?: string }) {
  return (
    <h2 className={cn('text-4xl leading-tight font-bold tracking-tight text-white xl:text-5xl', className)}>
      <span style={{ color: BRAND.lime }}>Sell</span> at the right time,
      <br />
      <span style={{ color: BRAND.lime }}>Buy</span> at the right price.
    </h2>
  )
}

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('grid gap-1.5', className)}>
      <Label htmlFor={htmlFor} className="text-[13px] font-medium text-gray-700">
        {label}
      </Label>
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : hint ? <p className="text-xs text-gray-400">{hint}</p> : null}
    </div>
  )
}

const inputCls =
  'h-11 rounded-lg border-gray-200 bg-gray-50/60 shadow-none transition-colors placeholder:text-gray-400 focus-visible:border-[#1E5631] focus-visible:bg-white focus-visible:ring-[3px] focus-visible:ring-[#1E5631]/15'

/** Input with an icon on the left. */
function IconInput({ icon: Icon, className, ...props }: ComponentProps<typeof Input> & { icon: typeof Mail }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-gray-400" />
      <Input {...props} className={cn(inputCls, 'pl-10', className)} />
    </div>
  )
}

function PasswordInput({ className, ...props }: ComponentProps<typeof Input>) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <LockKeyhole className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-gray-400" />
      <Input {...props} type={show ? 'text' : 'password'} className={cn(inputCls, 'pr-11 pl-10', className)} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}

function PasswordStrength({ value }: { value: string }) {
  const score = [value.length >= 8, /\d/.test(value), /[A-Z]/.test(value) || /[^A-Za-z0-9]/.test(value)].filter(Boolean).length
  const labels = ['Too short', 'Weak', 'Good', 'Strong']
  const colors = ['#E5E7EB', '#EF4444', '#F59E0B', BRAND.green]
  if (!value) return null
  return (
    <div className="flex items-center gap-2 pt-1">
      <div className="flex flex-1 gap-1">
        {[1, 2, 3].map((i) => (
          <span key={i} className="h-1 flex-1 rounded-full transition-colors" style={{ background: score >= i ? colors[score] : '#E5E7EB' }} />
        ))}
      </div>
      <span className="w-16 text-right text-[11px] font-medium" style={{ color: colors[score] === '#E5E7EB' ? '#9CA3AF' : colors[score] }}>
        {labels[score]}
      </span>
    </div>
  )
}

function PrimaryButton({ busy, children }: { busy: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="group flex h-12 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-white shadow-lg shadow-[#1E5631]/20 transition-all hover:brightness-110 active:scale-[.99] disabled:opacity-60"
      style={{ background: BRAND.green }}
    >
      {busy ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
      {!busy && <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />}
    </button>
  )
}

/* ================================================================== */
/*                               LOGIN                                */
/* ================================================================== */
export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const u = await login(email, password)
      navigate(`/${u.role}`)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-white font-display lg:grid-cols-[1.1fr_1fr]">
      {/* ----- photo side ----- */}
      <PhotoPanel image={IMAGES.loginBg}>
        <BrandMark light />
        <div className="max-w-lg">
          <Tagline />
          <p className="mt-4 text-base leading-relaxed text-white/80">
            Weekly AI price forecasts and government indicative prices, so every harvest is sold at its true value.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { v: '7', l: 'Crops forecast' },
              { v: '26', l: 'Regions' },
              { v: '4 weeks', l: 'AI outlook' },
            ].map((s) => (
              <div key={s.l} className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
                <p className="text-xl font-bold text-white">{s.v}</p>
                <p className="text-xs text-white/70">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </PhotoPanel>

      {/* ----- form side ----- */}
      <main className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <BrandMark className="lg:invisible" />
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1E5631]">
            <ArrowLeft className="size-4" /> Home
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          <span className="grid size-12 place-items-center rounded-2xl bg-[#EEF5EA]">
            <Sprout className="size-6" style={{ color: BRAND.green }} />
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight text-[#111827]">Welcome back</h1>
          <p className="mt-1.5 text-sm text-gray-500">Sign in to your Agri-Market AI account.</p>

          <form onSubmit={submit} className="mt-8 grid gap-5">
            {error && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
                {error}
              </p>
            )}
            <Field label="Email address" htmlFor="login-email">
              <IconInput
                id="login-email"
                icon={Mail}
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Password" htmlFor="login-password">
              <PasswordInput
                id="login-password"
                required
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600">
                <input type="checkbox" className="size-4 rounded" style={{ accentColor: BRAND.green }} /> Remember me
              </label>
              <span className="font-medium text-gray-400">Forgot password?</span>
            </div>

            <PrimaryButton busy={busy}>Sign in</PrimaryButton>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            New to Agri-Market AI?{' '}
            <Link to="/register" className="font-semibold hover:underline" style={{ color: BRAND.green }}>
              Create an account
            </Link>
          </p>
        </div>

        <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <ShieldCheck className="size-3.5" /> Passwords are stored hashed, never in plain text.
        </p>
      </main>
    </div>
  )
}

/* ================================================================== */
/*                              REGISTER                              */
/* ================================================================== */
const ROLE_COPY = {
  farmer: {
    image: IMAGES.farmerBg,
    art: IMAGES.tractor,
    title: 'Grow your income, not your middlemen.',
    sub: 'List your harvest, see AI price forecasts for your region and sell straight to verified buyers.',
    perks: [
      { icon: TrendingUp, text: 'Weekly AI price forecasts for your crops' },
      { icon: BadgeCheck, text: 'See buyers by region and crop' },
      { icon: ShieldCheck, text: 'Compare with government prices' },
    ],
    heading: 'Create your farmer account',
    swahili: 'Jisajili kama mkulima',
    cropsLabel: 'Crops you grow',
  },
  buyer: {
    image: IMAGES.buyerBg,
    art: IMAGES.moneyPlant,
    title: 'Source quality produce at the right price.',
    sub: 'Browse crops listed by farmers across Tanzania, compare them with government prices and buy direct.',
    perks: [
      { icon: BadgeCheck, text: 'Every listing vs. the government price' },
      { icon: TrendingUp, text: 'Weekly AI outlook on each crop' },
      { icon: Truck, text: 'Cash, mobile money or bank payment' },
    ],
    heading: 'Create your buyer account',
    swahili: 'Jisajili kama mnunuzi',
    cropsLabel: 'Crops you buy',
  },
} as const

export function RegisterPage() {
  const { register, meta } = useAuth()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const role: Role = params.get('role') === 'buyer' ? 'buyer' : 'farmer'
  const [form, setForm] = useState<Record<string, string>>({})
  const [crops, setCrops] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const set = (k: string) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const isFarmer = role === 'farmer'
  const copy = ROLE_COPY[role]

  const switchRole = (r: Role) => {
    setErrors({})
    setParams({ role: r }, { replace: true })
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setErrors({ confirm: 'Passwords do not match.' })
      return
    }
    setBusy(true)
    setErrors({})
    try {
      const body: Record<string, unknown> = { ...form, role }
      delete body.confirm
      if (isFarmer) body.main_crops = crops
      else body.interested_crops = crops
      const u = await register(body)
      toast.success(`Karibu ${u.full_name.split(' ')[0]}! Your account is ready.`)
      navigate(`/${u.role}`)
    } catch (err) {
      if (err instanceof ApiError && err.fields) setErrors(err.fields)
      toast.error((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen bg-white font-display lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* ----- photo side (stays in place while the form scrolls) ----- */}
      <PhotoPanel key={role} image={copy.image} className="lg:sticky lg:top-0 lg:h-screen">
        <BrandMark light />

        <div className="max-w-md">
          <div className="mb-6 inline-flex items-center gap-3 rounded-2xl border border-white/20 bg-white/15 p-2 pr-4 backdrop-blur-md">
            <span className="grid size-14 place-items-center rounded-xl bg-white">
              {role === 'buyer' ? (
                <ShoppingBasket className="size-9" style={{ color: BRAND.green }} />
              ) : (
                <Img src={copy.art} className="size-12" fallback={<TractorArt className="size-12" />} />
              )}
            </span>
            <span className="text-sm font-semibold text-white capitalize">{role} account</span>
          </div>
          <Tagline className="text-3xl xl:text-4xl" />
          <p className="mt-4 text-[15px] leading-relaxed text-white/80">{copy.sub}</p>
          <ul className="mt-6 grid gap-3">
            {copy.perks.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white/90">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white/15 backdrop-blur">
                  <Icon className="size-4" style={{ color: BRAND.lime }} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </PhotoPanel>

      {/* ----- form side ----- */}
      <main className="px-6 py-8 sm:px-10 xl:px-16">
        <div className="flex items-center justify-between">
          <BrandMark className="lg:invisible" />
          <p className="text-sm text-gray-500">
            Have an account?{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: BRAND.green }}>
              Sign in
            </Link>
          </p>
        </div>

        <div className="mx-auto w-full max-w-2xl py-10">
          <h1 className="text-3xl font-bold tracking-tight text-[#111827]">{copy.heading}</h1>
          <p className="mt-1.5 text-sm text-gray-500">{copy.swahili} · takes less than 2 minutes</p>

          {/* role cards */}
          <div role="tablist" aria-label="Account type" className="mt-7 grid grid-cols-2 gap-3">
            {(
              [
                { r: 'farmer', icon: Tractor, title: "I'm a farmer", desc: 'I grow and sell crops' },
                { r: 'buyer', icon: ShoppingBasket, title: "I'm a buyer", desc: 'I purchase produce' },
              ] as const
            ).map(({ r, icon: Icon, title, desc }) => {
              const on = role === r
              return (
                <button
                  key={r}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => switchRole(r)}
                  className={cn(
                    'relative flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all',
                    on ? 'border-[#1E5631] bg-[#F4F9F1] shadow-sm' : 'border-gray-200 hover:border-gray-300',
                  )}
                >
                  <span
                    className={cn('grid size-10 shrink-0 place-items-center rounded-lg', on ? 'text-white' : 'bg-gray-100 text-gray-500')}
                    style={on ? { background: BRAND.green } : undefined}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-gray-900">{title}</span>
                    <span className="block text-xs text-gray-500">{desc}</span>
                  </span>
                  {on && (
                    <span className="absolute top-2.5 right-2.5 grid size-5 place-items-center rounded-full text-white" style={{ background: BRAND.green }}>
                      <Check className="size-3" strokeWidth={3} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <form onSubmit={submit} className="mt-8 grid gap-8">
            {/* --- personal --- */}
            <section className="grid gap-5 sm:grid-cols-2">
              <h2 className="text-xs font-semibold tracking-wider text-gray-400 uppercase sm:col-span-2">Personal details</h2>
              <Field label="Full name" htmlFor="full_name" error={errors.full_name} className="sm:col-span-2">
                <IconInput id="full_name" icon={UserRound} placeholder="e.g. Asha Mwakyusa" value={form.full_name ?? ''} onChange={set('full_name')} required aria-invalid={!!errors.full_name} />
              </Field>
              <Field label="Email" htmlFor="email" error={errors.email}>
                <IconInput id="email" icon={Mail} type="email" placeholder="you@example.com" value={form.email ?? ''} onChange={set('email')} required aria-invalid={!!errors.email} />
              </Field>
              <Field label="Phone number" htmlFor="phone" error={errors.phone}>
                <IconInput id="phone" icon={Phone} placeholder="0712 345 678" value={form.phone ?? ''} onChange={set('phone')} required aria-invalid={!!errors.phone} />
              </Field>
            </section>

            {/* --- location --- */}
            <section className="grid gap-5 sm:grid-cols-2">
              <h2 className="text-xs font-semibold tracking-wider text-gray-400 uppercase sm:col-span-2">Location</h2>
              <Field label="Region" htmlFor="region" error={errors.region}>
                <SimpleSelect
                  value={form.region}
                  onChange={(v) => setForm((f) => ({ ...f, region: v }))}
                  options={meta.regions}
                  placeholder="Select region"
                  invalid={!!errors.region}
                  className={cn(inputCls, 'w-full')}
                />
              </Field>
              <Field label="District" htmlFor="district" error={errors.district}>
                <IconInput id="district" icon={MapPin} placeholder="e.g. Dodoma Urban" value={form.district ?? ''} onChange={set('district')} required />
              </Field>
            </section>

            {/* --- crops --- */}
            <section className="grid gap-3">
              <div className="flex items-baseline justify-between">
                <h2 className="text-xs font-semibold tracking-wider text-gray-400 uppercase">{copy.cropsLabel}</h2>
                <span className="text-xs text-gray-400">{crops.length ? `${crops.length} selected` : 'Select all that apply'}</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {meta.crops.map((c) => {
                  const on = crops.includes(c)
                  return (
                    <button
                      type="button"
                      key={c}
                      aria-pressed={on}
                      onClick={() => setCrops(on ? crops.filter((x) => x !== c) : [...crops, c])}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm transition-all',
                        on
                          ? 'border-[#1E5631] bg-[#1E5631] text-white shadow-sm'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-[#1E5631]/40 hover:bg-[#F6FAF4]',
                      )}
                    >
                      {on && <Check className="size-3.5" strokeWidth={3} />}
                      {c}
                    </button>
                  )
                })}
              </div>
            </section>

            {/* --- security --- */}
            <section className="grid gap-5 sm:grid-cols-2">
              <h2 className="text-xs font-semibold tracking-wider text-gray-400 uppercase sm:col-span-2">Security</h2>
              <Field label="Password" htmlFor="password" error={errors.password}>
                <PasswordInput id="password" placeholder="At least 6 characters" autoComplete="new-password" value={form.password ?? ''} onChange={set('password')} required aria-invalid={!!errors.password} />
                <PasswordStrength value={form.password ?? ''} />
              </Field>
              <Field label="Confirm password" htmlFor="confirm" error={errors.confirm}>
                <PasswordInput id="confirm" placeholder="Repeat password" autoComplete="new-password" value={form.confirm ?? ''} onChange={set('confirm')} required aria-invalid={!!errors.confirm} />
              </Field>
            </section>

            <div className="grid gap-4">
              <label className="flex items-start gap-2.5 text-sm text-gray-600">
                <input type="checkbox" required className="mt-0.5 size-4 rounded" style={{ accentColor: BRAND.green }} />
                <span>
                  I agree to the <span className="font-medium text-gray-900">Terms of Service</span> and{' '}
                  <span className="font-medium text-gray-900">Privacy Policy</span>.
                </span>
              </label>
              <PrimaryButton busy={busy}>Create {role} account</PrimaryButton>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
