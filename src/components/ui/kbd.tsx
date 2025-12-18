import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const kbdVariants = cva(
    "inline-flex items-center justify-center rounded font-mono text-[10px] font-semibold transition-colors",
    {
        variants: {
            variant: {
                default: "bg-zinc-800/80 text-zinc-400 border border-zinc-700/50 shadow-sm",
                outline: "border border-zinc-700 text-zinc-500",
            },
            size: {
                default: "h-5 min-w-5 px-1.5",
                sm: "h-4 min-w-4 px-1",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
)

export interface KbdProps
    extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof kbdVariants> { }

function Kbd({ className, variant, size, ...props }: KbdProps) {
    return (
        <kbd
            className={cn(kbdVariants({ variant, size }), className)}
            {...props}
        />
    )
}

export { Kbd, kbdVariants }
