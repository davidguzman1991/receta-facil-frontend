'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { API_BASE_URL } from '@/lib/api'
import { authFetch } from '@/lib/authFetch'

type Subscription = {
  plan: string
  status: string
  current_period_end: string | null
  max_patients: number | null
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

const FEATURES = {
  emprendedor: [
    'Recetas digitales (JPG/PNG)',
    'Firma en imagen',
    'Historial básico por paciente',
    'Acceso multi-dispositivo',
    'Límite de 250 pacientes activos',
  ],
  profesional: [
    'Recetas en PDF profesional',
    'Firma electrónica (certificado)',
    'Portal del paciente',
    'Envío por email',
    'Botón compartir por WhatsApp',
    'Búsqueda avanzada',
    'Duplicar recetas',
    'Plantillas',
    'Pacientes ilimitados',
  ],
}

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [patientCount, setPatientCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      authFetch(`${API_BASE_URL}/me/subscription`).then((res) => (res.ok ? res.json() : null)),
      authFetch(`${API_BASE_URL}/me/patients`).then((res) => (res.ok ? res.json() : [])),
    ])
      .then(([sub, patients]) => {
        if (cancelled) return
        if (sub) setSubscription(sub as Subscription)
        if (Array.isArray(patients)) setPatientCount(patients.length)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const plan = (subscription?.plan || '').trim().toLowerCase()
  const isProfesional = plan === 'profesional'
  const isEmprendedor = plan === 'emprendedor'
  const patientLimit = isEmprendedor ? 250 : (subscription?.max_patients ?? null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 px-4 py-6 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/doctor"
          className="inline-flex items-center gap-2 text-teal-700 hover:text-teal-800 active:text-teal-900 text-sm font-medium mb-6 transition-colors min-h-[44px]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al panel
        </Link>

        <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 px-5 py-6 sm:px-6 sm:py-7">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <span className="text-2xl">💎</span>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-white/90 bg-white/15 px-3 py-1 rounded-full">
                Suscripción
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
              Gestionar mi suscripción
            </h1>
            <p className="text-white/80 text-sm sm:text-base">
              Detalle del plan y límites disponibles
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
          <div className="p-5 sm:p-6">
            {loading ? (
              <p className="text-slate-500">Cargando...</p>
            ) : subscription ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-semibold text-slate-700">Plan activo:</span>
                  {isEmprendedor && (
                    <span className="inline-flex items-center rounded-full bg-teal-100 text-teal-700 px-3 py-1 text-xs font-semibold">
                      MediFast Emprendedor
                    </span>
                  )}
                  {isProfesional && (
                    <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-3 py-1 text-xs font-semibold">
                      MediFast Profesional
                    </span>
                  )}
                  {!isEmprendedor && !isProfesional && (
                    <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-700 px-3 py-1 text-xs font-semibold">
                      {subscription.plan || 'Plan no definido'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Estado</p>
                    <p className="font-semibold text-slate-800">{subscription.status}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Fin de ciclo</p>
                    <p className="font-semibold text-slate-800">{formatDate(subscription.current_period_end)}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Pacientes</p>
                    {isProfesional ? (
                      <p className="font-semibold text-emerald-700">Ilimitados</p>
                    ) : (
                      <p className="font-semibold text-slate-800">
                        {patientCount ?? 0} / {patientLimit ?? 250}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-500">No hay información de suscripción.</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 px-5 py-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-3">
              <span className="text-xl">📌</span>
              Detalle del plan
            </h2>
          </div>
          <div className="p-5 sm:p-6">
            {isProfesional && (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700">
                {FEATURES.profesional.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-emerald-600 mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            )}
            {isEmprendedor && (
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700">
                {FEATURES.emprendedor.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="text-teal-600 mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            )}
            {!isEmprendedor && !isProfesional && (
              <p className="text-slate-500 text-sm">
                No hay detalle de beneficios para este plan.
              </p>
            )}
          </div>
        </div>

        <div className="h-6"></div>
      </div>
    </div>
  )
}
