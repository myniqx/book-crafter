import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@renderer/lib/utils'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
      onChange?.(e)
      onCheckedChange?.(e.target.checked)
    }

    return (
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          ref={ref}
          checked={checked}
          onChange={handleChange}
          className={cn(
            'peer h-4 w-4 shrink-0 appearance-none rounded-sm border border-outline-variant bg-surface-container',
            'focus-visible:outline-none focus-visible:border-primary',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'checked:bg-primary checked:border-primary',
            className
          )}
          {...props}
        />
        {checked && (
          <Check className="absolute h-3 w-3 text-white pointer-events-none left-0.5" />
        )}
      </div>
    )
  }
)
Checkbox.displayName = 'Checkbox'

export { Checkbox }
