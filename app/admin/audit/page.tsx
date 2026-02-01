'use client'

import { useEffect, useState } from 'react'
import { AdminTable, AdminTableEmpty } from '@/components/admin/AdminTable'
import {
  AdminCard,
  AdminCardHeader,
  adminInputClass,
  adminSelectClass,
  adminLabelClass,
  adminPrimaryButtonClass,
} from '@/components/admin/AdminUI'

import { API_BASE_URL } from '@/lib/api'
import { authFetch } from '@/lib/authFetch'

type AuditRow = {
  id: string
  doctor_id: string | null
  doctor_email: string | null
  action: string
  entity_type: string
  entity_id: string
  timestamp: string | null
  ip_address: string | null
  details: string | null
}

type DoctorOption = { id: string; email: string }

function formatDate(iso: string | null) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  } catch {
    return iso
  }
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditRow[]>([])
  const [doctors, setDoctors] = useState<DoctorOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [doctorIdFilter, setDoctorIdFilter] = useState('')

  const fetchAudit = () => {
    const params = new URLSearchParams()
    if (dateFrom) params.set('date_from', new Date(dateFrom).toISOString())
    if (dateTo) params.set('date_to', new Date(dateTo).toISOString())
    if (actionFilter) params.set('action', actionFilter)
    if (doctorIdFilter) params.set('doctor_id', doctorIdFilter)
    const qs = params.toString()
    const url = `${API_BASE_URL}/admin/audit${qs ? `?${qs}` : ''}`
    setLoading(true)
    authFetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar auditoría')
        return res.json()
      })
      .then((data: AuditRow[]) => {
        setLogs(data)
        setError(null)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    authFetch(`${API_BASE_URL}/admin/doctors`)
      .then((r) => (r.ok ? r.json() : []))
      .then((list: { id: string; email: string }[]) => setDoctors(list))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchAudit()
  }, [])

  const handleApplyFilters = (e: React.FormEvent) => {
    e.preventDefault()
    fetchAudit()
  }

  return (
    <div className="space-y-6">
      <AdminCard>
        <AdminCardHeader
          title="Auditoría"
          subtitle="Trazabilidad de acciones administrativas"
          icon={
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <form
          onSubmit={handleApplyFilters}
          className="p-6 flex flex-wrap items-end gap-4"
        >
          <div>
            <label className={adminLabelClass}>Fecha desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className={adminInputClass}
            />
          </div>
          <div>
            <label className={adminLabelClass}>Fecha hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className={adminInputClass}
            />
          </div>
          <div>
            <label className={adminLabelClass}>Acción</label>
            <input
              type="text"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              placeholder="Ej: CREATE_PRESCRIPTION"
              className={adminInputClass}
            />
          </div>
          <div>
            <label className={adminLabelClass}>Médico</label>
            <select
              value={doctorIdFilter}
              onChange={(e) => setDoctorIdFilter(e.target.value)}
              className={adminSelectClass}
            >
              <option value="">Todos</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.email}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className={adminPrimaryButtonClass}>
            Filtrar
          </button>
        </form>
      </AdminCard>

      {error && <p className="text-red-600">{error}</p>}

      {loading ? (
        <p className="text-slate-500">Cargando...</p>
      ) : (
        <AdminTable headers={['Fecha', 'Médico', 'Acción', 'Entidad', 'ID', 'IP']} emptyColSpan={6}>
          {logs.length === 0 ? (
            <AdminTableEmpty colSpan={6} message="No hay registros de auditoría." />
          ) : (
            logs.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                  {formatDate(row.timestamp)}
                </td>
                <td className="px-4 py-3 text-sm text-slate-900">
                  {row.doctor_email ?? '—'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-900">{row.action}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{row.entity_type}</td>
                <td className="px-4 py-3 text-sm text-slate-600 font-mono truncate max-w-[120px]">
                  {row.entity_id}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">{row.ip_address ?? '—'}</td>
              </tr>
            ))
          )}
        </AdminTable>
      )}
    </div>
  )
}
