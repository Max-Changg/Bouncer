import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "bg-[#A259FF] text-white hover:bg-[#8e3ee6] focus:bg-[#8e3ee6]",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 focus:bg-red-700",
        outline:
          "border border-gray-500 text-gray-300 hover:bg-[#A259FF]/10",
        secondary:
          "bg-[#23272f] text-gray-300 hover:bg-[#A259FF]/20",
        ghost:
          "hover:bg-[#A259FF]/10 text-gray-300",
        link:
          "underline-offset-4 hover:underline text-[#A259FF]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
