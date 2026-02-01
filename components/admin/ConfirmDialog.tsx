'use client'

type ConfirmDialogProps = {
  open: boolean
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
  children?: React.ReactNode
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'primary',
  onConfirm,
  onCancel,
  loading = false,
  children,
}: ConfirmDialogProps) {
  if (!open) return null
  const confirmClass =
    variant === 'danger'
      ? 'bg-red-600 text-white hover:bg-red-700'
      : 'bg-gradient-to-r from-fuchsia-500 via-purple-500 to-teal-500 text-white hover:from-fuchsia-600 hover:via-purple-600 hover:to-teal-600'
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-10">
      <div className="bg-gradient-to-br from-white/90 via-slate-50/90 to-white/90 backdrop-blur-xl border border-white/60 rounded-2xl p-6 shadow-xl shadow-slate-300/50 max-w-sm w-full">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
        {message && <p className="text-slate-600 text-sm mb-4">{message}</p>}
        {children}
        <div className="flex gap-3 mt-4">
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-sm font-semibold rounded-xl shadow-md disabled:opacity-50 ${confirmClass}`}
          >
            {loading ? '...' : confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-slate-600 text-sm font-medium rounded-xl border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
