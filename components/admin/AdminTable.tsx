type AdminTableProps = {
  headers: string[]
  children: React.ReactNode
  emptyMessage?: string
  emptyColSpan?: number
}

export function AdminTable({
  headers,
  children,
  emptyMessage = 'No hay datos.',
  emptyColSpan,
}: AdminTableProps) {
  const span = emptyColSpan ?? headers.length
  return (
    <div className="bg-gradient-to-br from-white/80 via-slate-50/90 to-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-xl shadow-slate-300/40 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50/80">
            <tr>
              {headers.map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white/70 divide-y divide-slate-200">{children}</tbody>
        </table>
      </div>
    </div>
  )
}

export function AdminTableEmpty({ colSpan, message }: { colSpan: number; message?: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center text-slate-500">
        {message ?? 'No hay datos.'}
      </td>
    </tr>
  )
}
