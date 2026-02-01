type ProgressBarProps = {
  label: string
  used: number
  max: number
}

export function ProgressBar({ label, used, max }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, (used / max) * 100) : 0
  const isOver = used > max
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-700 font-medium">{label}</span>
        <span className="text-slate-600">
          {used} / {max}
          {isOver && <span className="text-red-600 ml-1">(excedido)</span>}
        </span>
      </div>
      <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${
            isOver ? 'bg-red-500' : 'bg-gradient-to-r from-fuchsia-500 via-purple-500 to-teal-500'
          }`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  )
}
