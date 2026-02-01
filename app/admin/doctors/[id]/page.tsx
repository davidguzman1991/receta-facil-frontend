'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ProgressBar } from '@/components/admin/ProgressBar'
import {
  AdminCard,
  AdminCardHeader,
  adminPrimaryButtonClass,
  adminSecondaryButtonClass,
} from '@/components/admin/AdminUI'

import { API_BASE_URL } from '@/lib/api'
import { authFetch } from '@/lib/authFetch'

type DoctorDetail = {
  id: string
  email: string
  role: string
  subscription_plan: string | null
  subscription_status: string | null
  current_period_end: string | null
  must_change_password?: boolean
}

type Usage = {
  recetas_en_periodo_actual: number
  limite_recetas: number
  pacientes_registrados: number
  limite_pacientes: number
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return iso
  }
}

export default function DoctorDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const [doctor, setDoctor] = useState<DoctorDetail | null>(null)
  const [usage, setUsage] = useState<Usage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toggling, setToggling] = useState(false)
  const [planModal, setPlanModal] = useState(false)
  const [newPlan, setNewPlan] = useState('')
  const [savingPlan, setSavingPlan] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [analytics, setAnalytics] = useState<{
    total_consultations: number
    total_prescriptions: number
    unique_patients: number
    top_diagnoses: { diagnosis: string; count: number }[]
    top_medications: { name: string; count: number }[]
    avg_medications_per_prescription: number
  } | null>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      authFetch(`${API_BASE_URL}/admin/doctors`).then((r) => r.json()),
      authFetch(`${API_BASE_URL}/admin/doctors/${id}/usage`).then((r) => {
        if (!r.ok) return null
        return r.json()
      }),
    ])
      .then(([list, usageData]) => {
        const d = (list as DoctorDetail[]).find((x) => x.id === id)
        if (!d) {
          setError('Médico no encontrado')
          return
        }
        setDoctor(d)
        setUsage(usageData)
        if (usageData) setNewPlan(d.subscription_plan || 'basic')
      })
      .catch(() => setError('Error al cargar'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!id) return
    authFetch(`${API_BASE_URL}/admin/doctors/${id}/analytics`)
      .then((res) => res.json())
      .then((data) => setAnalytics(data))
      .catch(() => setAnalytics(null))
      .finally(() => setLoadingAnalytics(false))
  }, [id])

  const toggleStatus = () => {
    if (!doctor) return
    const next = doctor.subscription_status === 'active' ? 'suspended' : 'active'
    setToggling(true)
    authFetch(`${API_BASE_URL}/admin/doctors/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: next }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Error')
        setDoctor((prev) => (prev ? { ...prev, subscription_status: next } : null))
      })
      .catch(() => setError('Error al actualizar estado'))
      .finally(() => setToggling(false))
  }

  const savePlan = () => {
    setSavingPlan(true)
    authFetch(`${API_BASE_URL}/admin/subscriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ plan: newPlan }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Error')
        setDoctor((prev) => (prev ? { ...prev, subscription_plan: newPlan } : null))
        setPlanModal(false)
      })
      .catch(() => setError('Error al cambiar plan'))
      .finally(() => setSavingPlan(false))
  }

  if (loading) {
    return <p className="text-slate-500">Cargando...</p>
  }

  if (error || !doctor) {
    return (
      <AdminCard>
        <div className="p-6">
          <p className="text-red-600 mb-4">{error || 'Médico no encontrado'}</p>
          <Link href="/admin/doctors" className="text-fuchsia-600 hover:underline font-medium">
            Volver a médicos
          </Link>
        </div>
      </AdminCard>
    )
  }

  const isActive = doctor.subscription_status === 'active'
  const planRaw = (doctor.subscription_plan || '').trim()
  const plan = planRaw.toLowerCase()
  const isEmprendedor = plan === 'emprendedor'
  const isProfesional = plan === 'profesional'
  const patientLimit = isEmprendedor ? 250 : null
  const patientMax = isProfesional ? null : (patientLimit ?? usage?.limite_pacientes ?? null)

  return (
    <div className="space-y-6">
      <Link href="/admin/doctors" className="text-fuchsia-600 hover:underline text-sm font-medium">
        ← Volver a médicos
      </Link>

      <AdminCard>
        <AdminCardHeader
          title="Detalle del médico"
          subtitle="Información general y control de cuenta"
          icon={<span className="text-2xl">🩺</span>}
        />
        <div className="p-6">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-500 font-medium">Email</dt>
              <dd className="text-slate-900 font-semibold">{doctor.email}</dd>
            </div>
            <div>
              <dt className="text-slate-500 font-medium">Plan</dt>
              <dd className="text-slate-900 flex flex-wrap items-center gap-2">
                <span>{doctor.subscription_plan ?? '—'}</span>
                {isEmprendedor && (
                  <span className="inline-flex items-center rounded-full bg-fuchsia-100 text-fuchsia-700 px-2.5 py-0.5 text-xs font-semibold">
                    Plan Emprendedor
                  </span>
                )}
                {isProfesional && (
                  <span className="inline-flex items-center rounded-full bg-teal-100 text-teal-700 px-2.5 py-0.5 text-xs font-semibold">
                    Plan Profesional
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 font-medium">Estado</dt>
              <dd>
                <span
                  className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                    isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {doctor.subscription_status ?? '—'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 font-medium">Acceso</dt>
              <dd>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    doctor.must_change_password ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {doctor.must_change_password ? '🟡 Pendiente' : '🟢 Activo'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 font-medium">Fin de ciclo</dt>
              <dd className="text-slate-900">{formatDate(doctor.current_period_end)}</dd>
            </div>
          </dl>
        </div>
      </AdminCard>

      <AdminCard>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Acciones de cuenta</h2>
          <div className="flex flex-wrap gap-3">
            <Link href={`/admin/doctors/${id}/profile?from=detail`} className={adminPrimaryButtonClass}>
              Ver perfil profesional
            </Link>
            <button type="button" onClick={() => setPlanModal(true)} className={adminSecondaryButtonClass}>
              Cambiar plan
            </button>
            <button
              type="button"
              disabled={toggling}
              onClick={toggleStatus}
              className={`px-4 py-2.5 text-sm font-semibold rounded-xl border-2 transition-all disabled:opacity-50 ${
                isActive
                  ? 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200'
              }`}
            >
              {toggling ? '...' : isActive ? 'Suspender' : 'Activar'}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Nota: el perfil profesional abre en modo solo lectura y se desbloquea con “Editar perfil”.
          </p>
        </div>
      </AdminCard>

      <AdminCard>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Uso</h2>
          {usage ? (
            <>
              <ProgressBar label="Recetas" used={usage.recetas_en_periodo_actual} max={usage.limite_recetas} />
              {isProfesional ? (
                <div className="text-sm text-emerald-700 font-semibold">
                  Pacientes ilimitados
                </div>
              ) : (
                <ProgressBar
                  label="Pacientes"
                  used={usage.pacientes_registrados}
                  max={patientMax ?? usage.limite_pacientes}
                />
              )}
            </>
          ) : (
            <p className="text-slate-500 text-sm">No hay datos de uso disponibles.</p>
          )}
        </div>
      </AdminCard>

      <AdminCard>
        <div className="p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">📊 Analítica clínica</h2>
            <button
              type="button"
              onClick={() => setShowAnalytics((v) => !v)}
              className="text-sm font-medium text-fuchsia-600 hover:underline"
            >
              {showAnalytics ? 'Ocultar' : 'Ver'}
            </button>
          </div>
          {showAnalytics && (
            <div className="mt-4">
              {loadingAnalytics ? (
                <p className="text-slate-500 text-sm">Cargando analítica...</p>
              ) : analytics ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4">
                      <p className="text-sm text-slate-500">Consultas</p>
                      <p className="text-2xl font-bold text-slate-900">{analytics.total_consultations}</p>
                    </div>
                    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4">
                      <p className="text-sm text-slate-500">Recetas</p>
                      <p className="text-2xl font-bold text-slate-900">{analytics.total_prescriptions}</p>
                    </div>
                    <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4">
                      <p className="text-sm text-slate-500">Pacientes únicos</p>
                      <p className="text-2xl font-bold text-slate-900">{analytics.unique_patients}</p>
                    </div>
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">Diagnósticos más frecuentes</h3>
                  <ul className="border border-slate-200 rounded-xl p-4 mb-6 bg-white/70">
                    {analytics.top_diagnoses?.length ? (
                      analytics.top_diagnoses.map((d, i) => (
                        <li key={i} className="flex justify-between py-1 text-sm">
                          <span className="text-slate-900">{d.diagnosis}</span>
                          <span className="font-medium text-slate-700">{d.count}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-500 text-sm py-1">Sin datos</li>
                    )}
                  </ul>
                  <h3 className="font-semibold text-slate-900 mb-2">Medicamentos más recetados</h3>
                  <ul className="border border-slate-200 rounded-xl p-4 bg-white/70">
                    {analytics.top_medications?.length ? (
                      analytics.top_medications.map((m, i) => (
                        <li key={i} className="flex justify-between py-1 text-sm">
                          <span className="text-slate-900">{m.name}</span>
                          <span className="font-medium text-slate-700">{m.count}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-500 text-sm py-1">Sin datos</li>
                    )}
                  </ul>
                  <p className="mt-4 text-sm text-slate-600">
                    Promedio de medicamentos por receta:{' '}
                    <strong>{(analytics.avg_medications_per_prescription ?? 0).toFixed(2)}</strong>
                  </p>
                </>
              ) : (
                <p className="text-slate-500 text-sm">No se pudo cargar la analítica.</p>
              )}
            </div>
          )}
        </div>
      </AdminCard>

      {planModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-10">
          <div className="bg-gradient-to-br from-white/90 via-slate-50/90 to-white/90 backdrop-blur-xl border border-white/60 rounded-2xl p-6 shadow-xl shadow-slate-300/50 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Cambiar plan</h3>
            <input
              type="text"
              value={newPlan}
              onChange={(e) => setNewPlan(e.target.value)}
              className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 mb-4 text-slate-900 focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
              placeholder="basic, pro, enterprise..."
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={savePlan}
                disabled={savingPlan}
                className={adminPrimaryButtonClass}
              >
                {savingPlan ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => setPlanModal(false)}
                className={adminSecondaryButtonClass}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
