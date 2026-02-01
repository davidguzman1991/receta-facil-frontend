'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

import { API_BASE_URL } from '@/lib/api'
import { authFetch } from '@/lib/authFetch'

interface ConsultationSummary {
  id: string
  date: string
  diagnosis_main: string | null
  diagnosis_secondary: string | null
}

interface PatientDetail {
  id: string
  first_name: string
  last_name: string
  dni: string | null
  date_of_birth: string | null
  sex: string | null
  phone: string | null
  email: string | null
  address: string | null
  province: string | null
  city: string | null
  personal_history: string | null
  allergic_history: string | null
  gyneco_history: string | null
  surgical_history: string | null
  consultations: ConsultationSummary[]
}

export default function PatientDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  const [patient, setPatient] = useState<PatientDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingHistory, setSavingHistory] = useState(false)
  const [historyForm, setHistoryForm] = useState({
    personal_history: '',
    allergic_history: '',
    gyneco_history: '',
    surgical_history: '',
  })

  const fetchPatient = useCallback(async () => {
    if (!id) return
    try {
      const res = await authFetch(`${API_BASE_URL}/doctor/patients/${id}`)
      if (res.ok) {
        const data = await res.json()
        setPatient(data)
        setHistoryForm({
          personal_history: data.personal_history ?? '',
          allergic_history: data.allergic_history ?? '',
          gyneco_history: data.gyneco_history ?? '',
          surgical_history: data.surgical_history ?? '',
        })
      } else {
        setError('Paciente no encontrado o sin acceso.')
      }
    } catch {
      setError('Error al cargar el paciente.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchPatient()
  }, [fetchPatient])

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return iso
    }
  }

  /** Edad en años a partir de fecha de nacimiento (ISO o YYYY-MM-DD). */
  const getAgeFromBirthDate = (birthDate: string): number | null => {
    if (!birthDate?.trim()) return null
    const birth = new Date(birthDate)
    if (Number.isNaN(birth.getTime())) return null
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
    return age < 0 ? null : age
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 px-4 py-6 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3 py-16">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-teal-700 font-medium">Cargando paciente...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 px-4 py-6 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
              <p className="text-red-600 font-medium mb-4">{error || 'Paciente no encontrado.'}</p>
              <Link 
                href="/doctor/patients" 
                className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver a Mis Pacientes
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const patientAge = patient.date_of_birth ? getAgeFromBirthDate(patient.date_of_birth) : null

  const handleSaveHistory = async () => {
    if (!patient) return
    setSavingHistory(true)
    try {
      const res = await authFetch(`${API_BASE_URL}/doctor/patients/${patient.id}/history`, {
        method: 'PATCH',
        body: JSON.stringify({
          personal_history: historyForm.personal_history.trim() || null,
          allergic_history: historyForm.allergic_history.trim() || null,
          gyneco_history: historyForm.gyneco_history.trim() || null,
          surgical_history: historyForm.surgical_history.trim() || null,
        }),
      })
      if (!res.ok) {
        setError('No se pudo guardar los antecedentes.')
        return
      }
      const updated = await res.json()
      setPatient((prev) => (prev ? { ...prev, ...updated } : prev))
      router.push(`/doctor/consultations/new?patient_id=${patient.id}`)
    } catch {
      setError('Error de conexión al guardar antecedentes.')
    } finally {
      setSavingHistory(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 px-4 py-6 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Link volver */}
        <Link
          href="/doctor/patients"
          className="inline-flex items-center gap-2 text-teal-700 hover:text-teal-800 active:text-teal-900 text-sm font-medium mb-6 transition-colors min-h-[44px]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Mis Pacientes
        </Link>

        {/* Header con info del paciente - Card integrada */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 px-5 py-5 sm:px-6 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-2xl shrink-0">
                  {patient.first_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white">
                    {patient.first_name} {patient.last_name}
                  </h1>
                  {patientAge != null && (
                    <p className="text-white/80 text-sm mt-0.5">{patientAge} años</p>
                  )}
                </div>
              </div>
              <Link
                href={`/doctor/consultations/new?patient_id=${patient.id}`}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-teal-700 font-semibold rounded-xl hover:bg-teal-50 active:bg-teal-100 transition-colors min-h-[48px]"
              >
                <span className="text-lg">➕</span>
                <span>Nueva consulta</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Card: Datos personales */}
        <section className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 px-5 py-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-3">
              <span className="text-xl">👤</span>
              Datos personales
            </h2>
          </div>
          <div className="p-5 sm:p-6">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-teal-50/50">
                <dt className="text-teal-600 text-xs font-semibold uppercase tracking-wide mb-1">Nombres</dt>
                <dd className="text-slate-800 font-medium">{patient.first_name}</dd>
              </div>
              <div className="p-3 rounded-xl bg-teal-50/50">
                <dt className="text-teal-600 text-xs font-semibold uppercase tracking-wide mb-1">Apellidos</dt>
                <dd className="text-slate-800 font-medium">{patient.last_name}</dd>
              </div>
              <div className="p-3 rounded-xl bg-teal-50/50">
                <dt className="text-teal-600 text-xs font-semibold uppercase tracking-wide mb-1">DNI</dt>
                <dd className="text-slate-800 font-medium">{patient.dni ?? '—'}</dd>
              </div>
              <div className="p-3 rounded-xl bg-teal-50/50">
                <dt className="text-teal-600 text-xs font-semibold uppercase tracking-wide mb-1">Fecha de nacimiento</dt>
                <dd className="text-slate-800 font-medium">
                  {patient.date_of_birth ? formatDate(patient.date_of_birth) : '—'}
                </dd>
              </div>
              <div className="p-3 rounded-xl bg-teal-50/50">
                <dt className="text-teal-600 text-xs font-semibold uppercase tracking-wide mb-1">Sexo</dt>
                <dd className="text-slate-800 font-medium">
                  {patient.sex === 'M' ? 'Masculino' : patient.sex === 'F' ? 'Femenino' : patient.sex ?? '—'}
                </dd>
              </div>
              <div className="p-3 rounded-xl bg-teal-50/50">
                <dt className="text-teal-600 text-xs font-semibold uppercase tracking-wide mb-1">Teléfono</dt>
                <dd className="text-slate-800 font-medium">{patient.phone ?? '—'}</dd>
              </div>
              <div className="p-3 rounded-xl bg-teal-50/50">
                <dt className="text-teal-600 text-xs font-semibold uppercase tracking-wide mb-1">Email</dt>
                <dd className="text-slate-800 font-medium truncate">{patient.email ?? '—'}</dd>
              </div>
              <div className="p-3 rounded-xl bg-teal-50/50">
                <dt className="text-teal-600 text-xs font-semibold uppercase tracking-wide mb-1">Dirección</dt>
                <dd className="text-slate-800 font-medium">{patient.address ?? '—'}</dd>
              </div>
              <div className="p-3 rounded-xl bg-teal-50/50">
                <dt className="text-teal-600 text-xs font-semibold uppercase tracking-wide mb-1">Provincia</dt>
                <dd className="text-slate-800 font-medium">{patient.province ?? '—'}</dd>
              </div>
              <div className="p-3 rounded-xl bg-teal-50/50">
                <dt className="text-teal-600 text-xs font-semibold uppercase tracking-wide mb-1">Ciudad</dt>
                <dd className="text-slate-800 font-medium">{patient.city ?? '—'}</dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Card: Antecedentes clínicos */}
        <section className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 px-5 py-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-3">
              <span className="text-xl">🩺</span>
              Antecedentes clínicos
            </h2>
          </div>
          <div className="p-5 sm:p-6 space-y-4">
            <div>
              <label htmlFor="history-personal" className="block text-sm font-semibold text-slate-700 mb-2">
                Antecedentes personales
              </label>
              <textarea
                id="history-personal"
                rows={3}
                value={historyForm.personal_history}
                onChange={(e) => setHistoryForm((s) => ({ ...s, personal_history: e.target.value }))}
                placeholder="Enfermedades previas, crónicas..."
                className="w-full border-2 border-teal-100 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-sm transition-all duration-200 resize-y"
              />
            </div>
            <div>
              <label htmlFor="history-allergic" className="block text-sm font-semibold text-slate-700 mb-2">
                Antecedentes alérgicos
              </label>
              <textarea
                id="history-allergic"
                rows={2}
                value={historyForm.allergic_history}
                onChange={(e) => setHistoryForm((s) => ({ ...s, allergic_history: e.target.value }))}
                placeholder="Medicamentos, alimentos, otros..."
                className="w-full border-2 border-teal-100 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-sm transition-all duration-200 resize-y"
              />
            </div>
            <div>
              <label htmlFor="history-gyneco" className="block text-sm font-semibold text-slate-700 mb-2">
                Antecedentes ginecoobstétricos
              </label>
              <textarea
                id="history-gyneco"
                rows={2}
                value={historyForm.gyneco_history}
                onChange={(e) => setHistoryForm((s) => ({ ...s, gyneco_history: e.target.value }))}
                placeholder="Gestas, partos, cesáreas, FUM..."
                className="w-full border-2 border-teal-100 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-sm transition-all duration-200 resize-y"
              />
            </div>
            <div>
              <label htmlFor="history-surgical" className="block text-sm font-semibold text-slate-700 mb-2">
                Antecedentes quirúrgicos
              </label>
              <textarea
                id="history-surgical"
                rows={2}
                value={historyForm.surgical_history}
                onChange={(e) => setHistoryForm((s) => ({ ...s, surgical_history: e.target.value }))}
                placeholder="Cirugías previas, fechas, observaciones..."
                className="w-full border-2 border-teal-100 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-sm transition-all duration-200 resize-y"
              />
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSaveHistory}
                disabled={savingHistory}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-white font-semibold rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-md hover:shadow-lg disabled:opacity-50 transition-all min-h-[48px]"
              >
                {savingHistory ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Guardando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Guardar antecedentes
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Card: Historial de consultas */}
        <section className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 px-5 py-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-3">
              <span className="text-xl">📅</span>
              Historial de consultas
            </h2>
          </div>
          <div className="p-5 sm:p-6">
            {patient.consultations.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-50 flex items-center justify-center">
                  <span className="text-3xl">📋</span>
                </div>
                <p className="text-slate-500 font-medium">Aún no hay consultas registradas.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {patient.consultations.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-teal-100 bg-teal-50/30 p-4 hover:bg-teal-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800">{formatDate(c.date)}</p>
                      <p className="text-sm text-slate-600 mt-0.5 truncate">
                        {c.diagnosis_main ?? '—'}
                        {c.diagnosis_secondary ? ` · ${c.diagnosis_secondary}` : ''}
                      </p>
                    </div>
                    <Link
                      href={`/doctor/consultations/${c.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:text-teal-700 shrink-0 min-h-[44px]"
                    >
                      Ver consulta
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Espaciado inferior */}
        <div className="h-6"></div>
      </div>
    </div>
  )
}
