type StatCardProps = {
  title: string
  value: number | string
  color?: 'green' | 'red' | 'default'
}

export function StatCard({ title, value, color = 'default' }: StatCardProps) {
  const valueClass =
    color === 'green'
      ? 'text-emerald-600'
      : color === 'red'
        ? 'text-red-600'
        : 'text-slate-900'
  return (
    <div className="bg-gradient-to-br from-white/80 via-slate-50/90 to-white/80 backdrop-blur-xl border border-white/60 rounded-2xl p-4 shadow-xl shadow-slate-300/40">
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      <p className={`text-2xl font-bold mt-1 ${valueClass}`}>{value}</p>
    </div>
  )
}
