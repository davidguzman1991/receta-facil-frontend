'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import { API_BASE_URL } from '@/lib/api'
import { authFetch } from '@/lib/authFetch'
import {
  AdminCard,
  AdminCardHeader,
  adminInputClass,
  adminSelectClass,
  adminLabelClass,
  adminPrimaryButtonClass,
} from '@/components/admin/AdminUI'

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all')

  useEffect(() => {
    fetchDoctors()
  }, [])

  const fetchDoctors = async () => {
    const res = await authFetch(`${API_BASE_URL}/admin/doctors`)
    if (res.ok) {
      const data = await res.json()
      setDoctors(data)
    }
  }

  const filteredDoctors = doctors.filter((doctor: any) => {
    const fullName = `${doctor.nombres ?? ''} ${doctor.apellidos ?? ''}`.toLowerCase()
    const specialty = (doctor.especialidad ?? '').toLowerCase()
    const email = (doctor.email ?? '').toLowerCase()
    const searchLower = search.toLowerCase()
    const matchesSearch =
      fullName.includes(searchLower) ||
      specialty.includes(searchLower) ||
      email.includes(searchLower)
    const matchesStatus =
      statusFilter === 'all' || doctor.subscription_status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <AdminCard>
        <AdminCardHeader
          title="Médicos"
          subtitle="Gestión completa del equipo médico"
          icon={
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
            </svg>
          }
        />
        <div className="p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-slate-600">Lista completa de médicos con estado y acceso.</p>
          </div>
          <Link href="/admin/doctors/new" className={adminPrimaryButtonClass}>
            Crear médico
          </Link>
        </div>
      </AdminCard>

      <AdminCard>
        <div className="p-6 flex flex-col md:flex-row gap-4 md:items-end">
          <div className="flex-1">
            <label className={adminLabelClass}>Buscar médico</label>
            <input
              type="text"
              placeholder="Nombre, especialidad o email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={adminInputClass}
            />
          </div>

          <div className="w-full md:w-56">
            <label className={adminLabelClass}>Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'suspended')}
              className={adminSelectClass}
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="suspended">Suspendidos</option>
            </select>
          </div>
        </div>
      </AdminCard>

      <AdminCard>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50/80 text-left">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Médico</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Plan</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Acceso</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white/70 divide-y divide-slate-200">
              {filteredDoctors.map((doctor: any) => (
                <tr key={doctor.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">
                      {doctor.nombres || 'Sin nombre'} {doctor.apellidos || ''}
                    </div>
                    <div className="text-xs text-slate-500">
                      {doctor.especialidad || 'Sin especialidad'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{doctor.email}</td>
                  <td className="px-4 py-3 text-slate-700">{doctor.subscription_plan || '—'}</td>
                  <td className="px-4 py-3 text-slate-700">{doctor.subscription_status || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                        doctor.must_change_password ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {doctor.must_change_password ? '🟡 Pendiente' : '🟢 Activo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/doctors/${doctor.id}`}
                        className="text-slate-700 hover:text-fuchsia-600 font-medium"
                      >
                        Ver detalle
                      </Link>
                      <Link
                        href={`/admin/doctors/${doctor.id}/profile?from=list`}
                        className="text-teal-600 hover:text-teal-700 font-medium"
                      >
                        Ver perfil
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminCard>

      {filteredDoctors.length === 0 && (
        <div className="text-sm text-slate-500">
          No se encontraron médicos con los filtros aplicados.
        </div>
      )}
    </div>
  )
}
