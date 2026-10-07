import { useState, type ReactNode } from 'react'

import { cn } from '@/lib/utils'

/** Brand colours taken from the Figma design. */
export const BRAND = {
  green: '#1E5631', // logo, primary buttons, "Sell"/"Buy"
  lime: '#8DC63F', // "AI" in the wordmark, links on the login card
  sand: '#E8CBA8', // register button, selected chips, toggle
  sandLight: '#F3E3CC',
  ink: '#111827',
}

/** Leaf mark used in the logo. */
export function LeafMark({ className, color = BRAND.green }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path
        d="M26.5 4.5C15 4.2 6.3 9.8 5.6 19.4c-.3 3.7 1.3 6.6 4 8.1 1-4.9 3.9-9.3 8.6-12.1-3.6 3.4-5.7 7.4-6.4 12.4 8.7.9 14.6-5.5 14.9-13.8.1-3.5-.1-6.4-.2-9.5Z"
        fill={color}
      />
      <path d="M11.2 27.8c.8-5 3.2-9.2 7-12.4" stroke="#FFFFFF" strokeOpacity=".55" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export function Logo({
  className,
  light = false,
  size = 'md',
}: {
  className?: string
  light?: boolean
  size?: 'sm' | 'md' | 'lg'
}) {
  const mark = { sm: 'size-6', md: 'size-7', lg: 'size-12' }[size]
  const text = { sm: 'text-base', md: 'text-lg', lg: 'text-xl' }[size]
  return (
    <span className={cn('inline-flex items-center gap-2 font-display', className)}>
      <img src="/images/logo.png" alt="" className={cn(mark, 'object-contain scale-[1.8]')} />
      <span className={cn(text, 'whitespace-nowrap font-medium tracking-tight', light ? 'text-white' : 'text-[#111827]')}>
        Agri-Market <span style={{ color: BRAND.lime }}>AI</span>
      </span>
    </span>
  )
}

/**
 * Photo from /public/images. If the file is not there yet, a soft green
 * placeholder is shown instead, so the page never looks broken.
 */
export function Photo({ src, alt, className, fallback }: { src: string; alt: string; className?: string; fallback?: ReactNode }) {
  const [failed, setFailed] = useState(false)
  if (failed)
    return (
      <div
        role="img"
        aria-label={alt}
        className={cn('flex items-center justify-center bg-gradient-to-br from-[#2F6B3A] via-[#3E7F45] to-[#6B4A2B]', className)}
      >
        {fallback ?? <SeedlingArt className="w-1/2 max-w-72" />}
      </div>
    )
  return <img src={src} alt={alt} className={cn('object-cover', className)} onError={() => setFailed(true)} />
}

/** Seedling in soil – used when the hero photo is missing. */
export function SeedlingArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <circle cx="100" cy="95" r="80" fill="none" stroke="#CFE8C4" strokeOpacity=".45" strokeWidth="1.5" />
      <ellipse cx="100" cy="95" rx="80" ry="30" fill="none" stroke="#CFE8C4" strokeOpacity=".35" />
      <ellipse cx="100" cy="95" rx="30" ry="80" fill="none" stroke="#CFE8C4" strokeOpacity=".35" />
      <ellipse cx="100" cy="150" rx="62" ry="22" fill="#5A3A22" />
      <path d="M100 150V92" stroke="#6DB33F" strokeWidth="5" strokeLinecap="round" />
      <path d="M100 112c-4-18-20-28-40-26 3 18 20 29 40 26Z" fill="#7BC043" />
      <path d="M100 98c3-22 20-35 44-34-2 22-21 36-44 34Z" fill="#8DD14F" />
    </svg>
  )
}

/** Green tractor carrying a leaf – the illustration on the register pages. */
export function TractorArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 180" className={className} aria-hidden="true">
      <path d="M92 66c-6-28-30-44-62-42 5 29 30 45 62 42Z" fill="#9BD14B" stroke="#FFFFFF" strokeWidth="3" />
      <path d="M96 64c4-30 26-50 54-52 1 30-22 50-54 52Z" fill="#6DB33F" stroke="#FFFFFF" strokeWidth="3" />
      <path d="M92 66 60 40M96 64l28-32" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
      <g fill="#4CAF50">
        <rect x="112" y="62" width="10" height="34" rx="3" />
        <path d="M104 62h52v8h-6v30h-46z" />
        <rect x="120" y="70" width="24" height="22" rx="3" fill="#FFFFFF" fillOpacity=".25" />
        <path d="M40 100h140c8 0 14 6 14 14v12H40z" />
        <circle cx="76" cy="134" r="34" />
        <circle cx="172" cy="144" r="22" />
      </g>
      <circle cx="76" cy="134" r="14" fill="#FFFFFF" fillOpacity=".85" />
      <circle cx="172" cy="144" r="9" fill="#FFFFFF" fillOpacity=".85" />
      <circle cx="76" cy="134" r="5" fill="#4CAF50" />
      <circle cx="172" cy="144" r="3.5" fill="#4CAF50" />
    </svg>
  )
}
