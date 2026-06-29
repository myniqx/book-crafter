import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps): React.JSX.Element => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-surface-container-high group-[.toaster]:text-on-surface group-[.toaster]:border-outline-variant group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-on-surface-variant',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-on-primary',
          cancelButton:
            'group-[.toast]:bg-surface-container-highest group-[.toast]:text-on-surface-variant',
          error: 'group-[.toast]:bg-error-container group-[.toast]:border-error',
          success: 'group-[.toast]:bg-tertiary-container/30 group-[.toast]:border-tertiary',
          warning: 'group-[.toast]:bg-tertiary-container/20 group-[.toast]:border-tertiary',
          info: 'group-[.toast]:bg-primary/10 group-[.toast]:border-primary'
        }
      }}
      {...props}
    />
  )
}

export { Toaster }
