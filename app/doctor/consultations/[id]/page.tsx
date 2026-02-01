'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

import { API_BASE_URL } from '@/lib/api'
import { authFetch } from '@/lib/authFetch'

interface ConsultationDetail {
  id: string
  date: string
  diagnosis_main: string | null
  diagnosis_secondary: string | null
  general_indications: string | null
  motivo_consulta?: string | null
  enfermedad_actual?: string | null
  examen_fisico?: string | null
  signos_vitales?: { ta?: string; fc?: string; peso?: string; talla?: string } | null
  plan_tratamiento?: string | null
  patient: string
  doctor: string
}

export default function ConsultationDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const [consultation, setConsultation] = useState<ConsultationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchConsultation = useCallback(async () => {
    if (!id) return
    try {
      const res = await authFetch(`${API_BASE_URL}/doctor/consultations/${id}`)
      if (res.ok) {
        const data = await res.json()
        setConsultation(data)
      } else {
        setError('Consulta no encontrada o sin acceso.')
      }
    } catch {
      setError('Error al cargar la consulta.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchConsultation()
  }, [fetchConsultation])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 px-4 py-6 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3 py-16">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-teal-700 font-medium">Cargando consulta...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !consultation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 px-4 py-6 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
              <p className="text-red-600 font-medium mb-4">{error || 'Consulta no encontrada.'}</p>
              <Link 
                href="/doctor/consultations/new" 
                className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium"
              >
                Ir a Nueva consulta
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return iso
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 px-4 py-6 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/doctor/patients"
            className="inline-flex items-center gap-2 text-teal-700 hover:text-teal-800 text-sm font-medium min-h-[44px]"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </Link>
          <Link
            href="/doctor/consultations/new"
            className="inline-flex items-center gap-2 px-4 py-2 text-teal-700 bg-teal-50 font-medium rounded-xl hover:bg-teal-100 transition-colors min-h-[44px]"
          >
            <span>➕</span>
            Nueva consulta
          </Link>
        </div>

        {/* Card principal */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          {/* Header de la card */}
          <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 px-5 py-5 sm:px-6">
            <h1 className="text-xl sm:text-2xl font-bold text-white">Detalle de la consulta</h1>
            <p className="text-white/80 text-sm mt-1">{formatDate(consultation.date)}</p>
          </div>

          {/* Contenido */}
          <div className="p-5 sm:p-6 space-y-5">
            {/* Paciente */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-teal-50/50 border border-teal-100">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md shrink-0"
                style={{ background: 'linear-gradient(135deg, #2FB7A3 0%, #6ED3C2 45%, #1CA39A 100%)' }}
              >
                <span>🧑</span>
              </div>
              <div>
                <p className="text-teal-600 text-xs font-semibold uppercase tracking-wide mb-1">Paciente</p>
                <p className="text-slate-800 font-medium">{consultation.patient}</p>
              </div>
            </div>

            {/* Motivo de consulta */}
            {consultation.motivo_consulta && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🩺</span>
                  <p className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Motivo de consulta</p>
                </div>
                <p className="text-slate-800 whitespace-pre-wrap">{consultation.motivo_consulta}</p>
              </div>
            )}

            {/* Enfermedad actual */}
            {consultation.enfermedad_actual && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📖</span>
                  <p className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Enfermedad actual</p>
                </div>
                <p className="text-slate-800 whitespace-pre-wrap">{consultation.enfermedad_actual}</p>
              </div>
            )}

            {/* Examen físico */}
            {consultation.examen_fisico && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">🧍‍♂️</span>
                  <p className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Examen físico</p>
                </div>
                <p className="text-slate-800 whitespace-pre-wrap">{consultation.examen_fisico}</p>
              </div>
            )}

            {/* Signos vitales */}
            {consultation.signos_vitales && (consultation.signos_vitales.ta || consultation.signos_vitales.fc || consultation.signos_vitales.peso || consultation.signos_vitales.talla) && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">❤️</span>
                  <p className="text-rose-600 text-xs font-semibold uppercase tracking-wide">Signos vitales</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {consultation.signos_vitales.ta && (
                    <span className="px-3 py-1 bg-white rounded-lg text-sm font-medium text-slate-700 border border-rose-200">
                      TA: {consultation.signos_vitales.ta}
                    </span>
                  )}
                  {consultation.signos_vitales.fc && (
                    <span className="px-3 py-1 bg-white rounded-lg text-sm font-medium text-slate-700 border border-rose-200">
                      FC: {consultation.signos_vitales.fc}
                    </span>
                  )}
                  {consultation.signos_vitales.peso && (
                    <span className="px-3 py-1 bg-white rounded-lg text-sm font-medium text-slate-700 border border-rose-200">
                      Peso: {consultation.signos_vitales.peso}
                    </span>
                  )}
                  {consultation.signos_vitales.talla && (
                    <span className="px-3 py-1 bg-white rounded-lg text-sm font-medium text-slate-700 border border-rose-200">
                      Talla: {consultation.signos_vitales.talla}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Diagnóstico principal */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🔍</span>
                <p className="text-amber-700 text-xs font-semibold uppercase tracking-wide">Diagnóstico principal</p>
              </div>
              <p className="text-slate-800 font-medium">{consultation.diagnosis_main ?? '—'}</p>
            </div>

            {/* Diagnósticos secundarios */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📋</span>
                <p className="text-slate-600 text-xs font-semibold uppercase tracking-wide">Diagnósticos secundarios</p>
              </div>
              <p className="text-slate-800">{consultation.diagnosis_secondary || '—'}</p>
            </div>

            {/* Plan de tratamiento */}
            {(consultation.plan_tratamiento ?? consultation.general_indications) && (
              <div className="p-4 rounded-xl bg-purple-50 border border-purple-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📝</span>
                  <p className="text-purple-700 text-xs font-semibold uppercase tracking-wide">Plan de tratamiento</p>
                </div>
                <p className="text-slate-800 whitespace-pre-wrap">{consultation.plan_tratamiento ?? consultation.general_indications ?? '—'}</p>
              </div>
            )}

            {/* Médico */}
            <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-100">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">👨‍⚕️</span>
                <p className="text-teal-600 text-xs font-semibold uppercase tracking-wide">Médico</p>
              </div>
              <p className="text-slate-800 font-medium">{consultation.doctor}</p>
            </div>
          </div>

          {/* Footer con acciones */}
          <div className="border-t border-teal-100 px-5 py-4 bg-gradient-to-r from-teal-50/50 to-white flex flex-wrap gap-3">
            <button
              type="button"
              disabled
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed text-sm font-medium min-h-[44px]"
              title="Se añadirá en la siguiente fase"
            >
              💊 Añadir Medicamentos
            </button>
            <button
              type="button"
              disabled
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border-2 border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed text-sm font-medium min-h-[44px]"
              title="Fase futura"
            >
              📄 Generar Receta
            </button>
          </div>
        </div>

        {/* Espaciado inferior */}
        <div className="h-6"></div>
      </div>
    </div>
  )
}
