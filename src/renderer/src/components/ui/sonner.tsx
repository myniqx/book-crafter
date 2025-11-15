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
            'group toast group-[.toaster]:bg-slate-900 group-[.toaster]:text-slate-50 group-[.toaster]:border-slate-700 group-[.toaster]:shadow-lg',
          description: 'group-[.toast]:text-slate-400',
          actionButton:
            'group-[.toast]:bg-blue-600 group-[.toast]:text-white',
          cancelButton:
            'group-[.toast]:bg-slate-700 group-[.toast]:text-slate-300',
          error: 'group-[.toast]:bg-red-950 group-[.toast]:border-red-800',
          success: 'group-[.toast]:bg-green-950 group-[.toast]:border-green-800',
          warning: 'group-[.toast]:bg-yellow-950 group-[.toast]:border-yellow-800',
          info: 'group-[.toast]:bg-blue-950 group-[.toast]:border-blue-800'
        }
      }}
      {...props}
    />
  )
}

export { Toaster }
