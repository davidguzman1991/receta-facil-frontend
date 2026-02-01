'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { StatCard } from '@/components/admin/StatCard'
import {
  AdminCard,
  AdminCardHeader,
  adminPrimaryButtonClass,
  adminSecondaryButtonClass,
} from '@/components/admin/AdminUI'

import { API_BASE_URL } from '@/lib/api'
import { authFetch } from '@/lib/authFetch'

type Stats = {
  total_doctors: number
  active_doctors: number
  suspended_doctors: number
  total_recipes_this_month: number
  total_patients: number
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    authFetch(`${API_BASE_URL}/admin/stats`)
      .then((res) => {
        if (!res.ok) throw new Error('Error al cargar estadísticas')
        return res.json()
      })
      .then((data: Stats) => {
        setStats(data)
        setError(null)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Error'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <AdminCard>
        <AdminCardHeader
          title="Dashboard"
          subtitle="Resumen general del sistema"
          icon={
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h18v18H3V3zm4 13h3v3H7v-3zm0-6h3v5H7v-5zm5 2h3v9h-3v-9zm5-6h3v15h-3V6z" />
            </svg>
          }
        />
        <div className="p-6">
          {loading && <p className="text-slate-500">Cargando...</p>}
          {error && !loading && <p className="text-red-600">{error ?? 'Error al cargar'}</p>}
          {!loading && stats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard title="Total médicos" value={stats.total_doctors} />
              <StatCard title="Médicos activos" value={stats.active_doctors} color="green" />
              <StatCard title="Suspendidos" value={stats.suspended_doctors} color="red" />
              <StatCard title="Recetas este mes" value={stats.total_recipes_this_month} />
              <StatCard title="Pacientes totales" value={stats.total_patients} />
            </div>
          )}
        </div>
      </AdminCard>

      <AdminCard>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Acciones rápidas</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/doctors" className={adminPrimaryButtonClass}>
              Ver médicos
            </Link>
            <Link href="/admin/doctors/new" className={adminSecondaryButtonClass}>
              Crear médico
            </Link>
            <Link href="/admin/audit" className={adminSecondaryButtonClass}>
              Auditoría
            </Link>
          </div>
        </div>
      </AdminCard>
    </div>
  )
}
