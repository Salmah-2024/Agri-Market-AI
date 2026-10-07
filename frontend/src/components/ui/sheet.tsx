import * as React from 'react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { DialogOverlay } from '@/components/ui/dialog'

import { cn } from '@/lib/utils'

export const Sheet = (p: React.ComponentProps<typeof DialogPrimitive.Root>) => <DialogPrimitive.Root data-slot="sheet" {...p} />
export function SheetContent({ className, children, side = 'left', ...props }: React.ComponentProps<typeof DialogPrimitive.Content> & { side?: 'left' | 'right' }) {
  return (
    <DialogPrimitive.Portal>
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex h-full flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 inset-y-0 w-72',
          side === 'left'
            ? 'data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left left-0 border-r'
            : 'data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right right-0 border-l',
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}
