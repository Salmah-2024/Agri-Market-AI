import { Globe } from 'lucide-react'

import { useLang, type Lang } from '@/lib/i18n'
import { cn } from '@/lib/utils'

/** Bendera ndogo ya Tanzania / small Tanzania flag (kwa Kiswahili). */
function TzFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 12" className={className} aria-hidden="true">
      <defs>
        <clipPath id="tzflag-rounded">
          <rect width="18" height="12" rx="2" />
        </clipPath>
      </defs>
      <g clipPath="url(#tzflag-rounded)">
        <rect width="18" height="12" fill="#1EB53A" />
        <polygon points="18,0 18,12 0,12" fill="#00A3DD" />
        <line x1="0" y1="12" x2="18" y2="0" stroke="#FCD116" strokeWidth="4.4" />
        <line x1="0" y1="12" x2="18" y2="0" stroke="#000000" strokeWidth="2.6" />
      </g>
    </svg>
  )
}

/**
 * Kitufe cha kubadili lugha / Language switch.
 * Kiswahili = bendera ya Tanzania · Kiingereza = alama ya dunia (globe). Chaguo linakumbukwa.
 */
export default function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useLang()
  const opts: { key: Lang; label: string; icon: 'flag' | 'globe' }[] = [
    { key: 'sw', label: 'SW', icon: 'flag' },
    { key: 'en', label: 'EN', icon: 'globe' },
  ]
  return (
    <div
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full border bg-background p-0.5 text-xs font-medium',
        className,
      )}
      role="group"
      aria-label="Chagua lugha / Choose language"
    >
      {opts.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => setLang(o.key)}
          aria-pressed={lang === o.key}
          title={o.key === 'sw' ? 'Kiswahili' : 'English'}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-colors',
            lang === o.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {o.icon === 'flag' ? (
            <TzFlag className="h-3 w-[18px] shrink-0 rounded-[2px]" />
          ) : (
            <Globe className="size-3.5 shrink-0" />
          )}
          {o.label}
        </button>
      ))}
    </div>
  )
}
