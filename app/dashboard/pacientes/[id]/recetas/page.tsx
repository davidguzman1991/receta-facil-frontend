'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { API_BASE_URL } from '@/lib/api'
import { authFetch } from '@/lib/authFetch'

interface PrescriptionItem {
  medication_name: string
  dose?: string | null
  frequency?: string | null
  duration?: string | null
}

interface PrescriptionListItem {
  id: string
  created_at: string
  consultation_id: string
  general_instructions?: string | null
  items: PrescriptionItem[]
  consultation?: { diagnosis?: string | null } | null
  diagnosis?: string | null
}

interface Patient {
  id: string
  first_name: string
  last_name: string
  user_id?: string | null
  date_of_birth?: string | null
}

function getAge(dateOfBirth: string | null | undefined): string {
  if (!dateOfBirth) return '—'
  const birth = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age >= 0 ? `${age}` : '—'
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

function formatDateForInput(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toISOString().slice(0, 10)
  } catch {
    return ''
  }
}

export default function PacienteRecetasPage() {
  const params = useParams()
  const patientId = typeof params.id === 'string' ? params.id : params.id?.[0]

  const [patient, setPatient] = useState<Patient | null>(null)
  const [prescriptions, setPrescriptions] = useState<PrescriptionListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filterDesde, setFilterDesde] = useState('')
  const [filterHasta, setFilterHasta] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteMessage, setInviteMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchData = useCallback(async () => {
    if (!patientId) return
    setLoading(true)
    setError(null)
    try {
      const [resPatient, resPrescriptions] = await Promise.all([
        authFetch(`${API_BASE_URL}/patients/${patientId}`),
        authFetch(`${API_BASE_URL}/patients/${patientId}/prescriptions`),
      ])

      if (!resPatient.ok) {
        setError(resPatient.status === 404 ? 'Paciente no encontrado' : 'No tiene acceso a este paciente')
        setLoading(false)
        return
      }
      setPatient(await resPatient.json())

      if (!resPrescriptions.ok) {
        if (resPrescriptions.status === 404) {
          setPrescriptions([])
        } else {
          setError(resPrescriptions.status === 403 ? 'Sin acceso a recetas' : 'Error al cargar recetas')
          setPrescriptions([])
        }
        setLoading(false)
        return
      }
      const data = await resPrescriptions.json()
      setPrescriptions(Array.isArray(data) ? data : data.prescriptions ?? [])
    } catch {
      setError('Error de conexión')
      setPrescriptions([])
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredPrescriptions = useMemo(() => {
    let list = [...prescriptions]
    if (filterDesde) {
      const desde = new Date(filterDesde)
      list = list.filter((p) => new Date(p.created_at) >= desde)
    }
    if (filterHasta) {
      const hasta = new Date(filterHasta)
      hasta.setHours(23, 59, 59, 999)
      list = list.filter((p) => new Date(p.created_at) <= hasta)
    }
    return list.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [prescriptions, filterDesde, filterHasta])

  const handleDownloadPdf = useCallback(
    (prescriptionId: string) => {
      authFetch(`${API_BASE_URL}/prescriptions/${prescriptionId}/pdf`)
        .then((r) => {
          if (!r.ok) throw new Error('No se pudo descargar')
          return r.blob()
        })
        .then((blob) => {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `receta-${prescriptionId.slice(0, 8)}.pdf`
          a.click()
          URL.revokeObjectURL(url)
        })
        .catch(() => {})
    },
    []
  )

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientId || !inviteEmail.trim()) return
    setInviteMessage(null)
    setInviteLoading(true)
    try {
      const res = await authFetch(`${API_BASE_URL}/patients/${patientId}/invite`, {
        method: 'POST',
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setInviteMessage({ type: 'success', text: `Invitación enviada a ${inviteEmail.trim()}` })
        setInviteEmail('')
        fetchData()
      } else {
        setInviteMessage({ type: 'error', text: (data.detail as string) || 'Error al enviar invitación' })
      }
    } catch {
      setInviteMessage({ type: 'error', text: 'Error de conexión' })
    } finally {
      setInviteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-gray-500">Cargando...</p>
      </div>
    )
  }

  if (error && !patient) {
    return (
      <div className="p-4">
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          Volver al panel
        </Link>
      </div>
    )
  }

  const patientName = patient
    ? `${patient.first_name} ${patient.last_name}`
    : 'Paciente'
  const age = getAge(patient?.date_of_birth)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="text-blue-600 hover:underline text-sm mb-2 inline-block"
        >
          ← Volver al panel
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Historial de Recetas</h1>
        <p className="text-gray-700 mt-1">
          <strong>Paciente:</strong> {patientName}
        </p>
        <p className="text-gray-600 text-sm">
          <strong>Edad:</strong> {age} años
        </p>

        {patient && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h2 className="text-sm font-semibold text-gray-800 mb-2">Portal del paciente</h2>
            {patient.user_id ? (
              <p className="text-sm text-gray-600">Este paciente ya tiene cuenta y puede acceder al portal.</p>
            ) : (
              <>
                {inviteMessage && (
                  <p
                    className={`text-sm mb-2 ${inviteMessage.type === 'success' ? 'text-green-700' : 'text-red-700'}`}
                  >
                    {inviteMessage.text}
                  </p>
                )}
                <form onSubmit={handleInvite} className="flex flex-wrap items-end gap-2">
                  <div className="flex-1 min-w-[200px]">
                    <label htmlFor="invite-email" className="block text-xs font-medium text-gray-600 mb-1">
                      Email para invitación
                    </label>
                    <input
                      id="invite-email"
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="paciente@ejemplo.com"
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {inviteLoading ? 'Enviando...' : 'Invitar al portal'}
                  </button>
                </form>
                <p className="text-xs text-gray-500 mt-2">
                  Se enviará un enlace al correo para que el paciente active su cuenta y cree su contraseña (válido 48 h).
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Filtro por fecha */}
      <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white rounded-lg border border-gray-200">
        <label className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Desde</span>
          <input
            type="date"
            value={filterDesde}
            onChange={(e) => setFilterDesde(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Hasta</span>
          <input
            type="date"
            value={filterHasta}
            onChange={(e) => setFilterHasta(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-sm"
          />
        </label>
      </div>

      {error && prescriptions.length === 0 ? (
        <p className="text-amber-600">{error}</p>
      ) : filteredPrescriptions.length === 0 ? (
        <p className="text-gray-500">No hay recetas registradas para este paciente.</p>
      ) : (
        <ul className="space-y-4">
          {filteredPrescriptions.map((receta) => {
            const diagnosis =
              receta.diagnosis ??
              receta.consultation?.diagnosis ??
              '—'
            const meds = receta.items ?? []
            const firstTwo = meds.slice(0, 2)
            const restCount = meds.length - 2
            const instructions = receta.general_instructions ?? ''
            const instructionsPreview =
              instructions.length > 100 ? `${instructions.slice(0, 100)}…` : instructions

            return (
              <li
                key={receta.id}
                className="card"
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: 16,
                  background: 'white',
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-600">
                      🗓 <strong>Fecha:</strong> {formatDate(receta.created_at)}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      🩺 <strong>Diagnóstico:</strong> {diagnosis}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      💊 <strong>Medicamentos:</strong>{' '}
                      {firstTwo.length === 0
                        ? '—'
                        : firstTwo.map((m) => m.medication_name).join(', ') +
                          (restCount > 0 ? ` +${restCount} más` : '')}
                    </p>
                    {instructionsPreview && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        📄 <strong>Indicaciones:</strong> {instructionsPreview}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Link
                      href={`/dashboard/recetas/${receta.id}/print`}
                      className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      🖨 Imprimir
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDownloadPdf(receta.id)}
                      className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    >
                      ⬇️ PDF
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
