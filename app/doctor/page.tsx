'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import { API_BASE_URL } from '@/lib/api'
import { authFetch } from '@/lib/authFetch'

type Subscription = {
  plan: string
  max_patients: number | null
}

export default function DoctorPortalPage() {
  const [patientCount, setPatientCount] = useState<number | null>(null)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loadingMeta, setLoadingMeta] = useState(true)

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
      .catch(() => {
        if (!cancelled) {
          setSubscription(null)
          setPatientCount(null)
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingMeta(false)
      })
    return () => { cancelled = true }
  }, [])

  const plan = (subscription?.plan || '').toLowerCase()
  const limit = subscription?.max_patients ?? (plan === 'emprendedor' ? 250 : null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 px-4 py-6 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header principal - Card integrada */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 px-5 py-6 sm:px-6 sm:py-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <span className="text-2xl">🩺</span>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-white/90 bg-white/15 px-3 py-1 rounded-full">
                Panel médico
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">
              Bienvenido, Doctor
            </h1>
            <p className="text-white/80 text-sm sm:text-base">
              Gestiona tu perfil profesional, pacientes y consultas médicas
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
          <div className="p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Pacientes</h2>
            {loadingMeta ? (
              <p className="text-slate-500 text-sm">Cargando...</p>
            ) : plan === 'profesional' ? (
              <p className="text-emerald-700 font-medium">Pacientes ilimitados</p>
            ) : patientCount != null ? (
              <p className="text-slate-700 font-medium">
                {patientCount} / {limit ?? 250}
              </p>
            ) : (
              <p className="text-slate-500 text-sm">Sin datos de uso.</p>
            )}
          </div>
        </div>

        {/* Cards de acceso rápido */}
        <div className="space-y-4">
          {/* Card: Mis Pacientes */}
          <Link
            href="/doctor/patients"
            className="block bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex items-center gap-4 p-5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white shrink-0">
                <span className="text-xl">👥</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-slate-800 font-semibold text-lg">Mis Pacientes</h2>
                <p className="text-slate-500 text-sm">Ver y gestionar pacientes registrados</p>
              </div>
              <svg className="w-5 h-5 text-teal-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Card: Nueva Consulta */}
          <Link
            href="/doctor/consultations/new"
            className="block bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex items-center gap-4 p-5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white shrink-0">
                <span className="text-xl">📋</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-slate-800 font-semibold text-lg">Nueva Consulta</h2>
                <p className="text-slate-500 text-sm">Registrar una nueva consulta médica</p>
              </div>
              <svg className="w-5 h-5 text-teal-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>

          {/* Card: Perfil Profesional */}
          <Link
            href="/doctor/profile"
            className="block bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
          >
            <div className="flex items-center gap-4 p-5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white shrink-0">
                <span className="text-xl">👤</span>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-slate-800 font-semibold text-lg">Perfil Profesional</h2>
                <p className="text-slate-500 text-sm">Configurar firma, sello y datos profesionales</p>
              </div>
              <svg className="w-5 h-5 text-teal-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        </div>

        {/* Espaciado inferior */}
        <div className="h-8"></div>
      </div>
    </div>
  )
}
