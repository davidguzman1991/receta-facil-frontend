'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { API_BASE_URL } from '@/lib/api'
import { authFetch } from '@/lib/authFetch'

interface PrescriptionItem {
  medication_name: string
  dose?: string | null
  frequency?: string | null
  duration?: string | null
  route?: string | null
  quantity?: string | null
  notes?: string | null
}

interface Prescription {
  id: string
  consultation_id: string
  patient_id: string
  doctor_id: string
  general_instructions?: string | null
  created_at: string
  items: PrescriptionItem[]
}

interface Patient {
  id: string
  first_name: string
  last_name: string
  date_of_birth?: string | null
}

interface Consultation {
  diagnosis?: string | null
}

interface DoctorProfile {
  full_name?: string | null
  specialty?: string | null
  senescyt_reg?: string | null
  medical_license?: string | null
  phone?: string | null
  email?: string | null
  signature_url?: string | null
  stamp_url?: string | null
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
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return '—'
  }
}

export default function RecetaPrintPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : params.id?.[0]
  const [prescription, setPrescription] = useState<Prescription | null>(null)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [consultation, setConsultation] = useState<Consultation | null>(null)
  const [doctorProfile, setDoctorProfile] = useState<DoctorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const resPres = await authFetch(`${API_BASE_URL}/prescriptions/${id}`)
      if (!resPres.ok) {
        setError(resPres.status === 404 ? 'Receta no encontrada' : 'No tiene acceso a esta receta')
        setLoading(false)
        return
      }
      const pres: Prescription = await resPres.json()
      setPrescription(pres)

      const [resPatient, resConsult, resProfile] = await Promise.all([
        authFetch(`${API_BASE_URL}/patients/${pres.patient_id}`),
        authFetch(`${API_BASE_URL}/consultations/${pres.consultation_id}`),
        authFetch(`${API_BASE_URL}/doctor-profile/me`),
      ])
      if (resPatient.ok) setPatient(await resPatient.json())
      if (resConsult.ok) setConsultation(await resConsult.json())
      if (resProfile.ok) setDoctorProfile(await resProfile.json())
    } catch {
      setError('Error al cargar la receta')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDownloadPdf = useCallback(() => {
    if (!id) return
    authFetch(`${API_BASE_URL}/prescriptions/${id}/pdf`)
      .then((r) => {
        if (!r.ok) throw new Error('No se pudo descargar el PDF')
        return r.blob()
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'receta.pdf'
        a.click()
        URL.revokeObjectURL(url)
      })
      .catch(() => setError('Error al descargar el PDF'))
  }, [id])

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-gray-500">Cargando receta...</p>
      </div>
    )
  }

  if (error || !prescription) {
    return (
      <div className="p-4">
        <p className="text-red-600 mb-4">{error ?? 'Receta no disponible'}</p>
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          Volver al panel
        </Link>
      </div>
    )
  }

  const patientName = patient
    ? `${patient.first_name} ${patient.last_name}`
    : '—'
  const age = getAge(patient?.date_of_birth)
  const dateStr = formatDate(prescription.created_at)
  const diagnosis = consultation?.diagnosis ?? '—'
  const signatureUrl = doctorProfile?.signature_url
    ? doctorProfile.signature_url.startsWith('http')
      ? doctorProfile.signature_url
      : `${API_BASE_URL}/${doctorProfile.signature_url}`
    : null
  const stampUrl = doctorProfile?.stamp_url
    ? doctorProfile.stamp_url.startsWith('http')
      ? doctorProfile.stamp_url
      : `${API_BASE_URL}/${doctorProfile.stamp_url}`
    : null

  return (
    <div className="max-w-[210mm] mx-auto py-4">
      <div className="no-print flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
        >
          🖨️ Imprimir
        </button>
        <button
          type="button"
          onClick={handleDownloadPdf}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          ⬇️ Descargar PDF
        </button>
        <Link
          href="/dashboard"
          className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
        >
          Volver
        </Link>
      </div>

      <article className="print-page shadow print:shadow-none">
        {/* Encabezado médico */}
        <header className="border-b border-gray-800 pb-3 mb-4">
          <h1 className="text-xl font-bold text-gray-900">
            {doctorProfile?.full_name ?? 'Médico'}
          </h1>
          {doctorProfile?.specialty && (
            <p className="text-sm text-gray-700">{doctorProfile.specialty}</p>
          )}
          {doctorProfile?.senescyt_reg && (
            <p className="text-sm text-gray-600">Reg. SENESCYT: {doctorProfile.senescyt_reg}</p>
          )}
          <div className="flex gap-4 text-sm text-gray-600 mt-1">
            {doctorProfile?.phone && <span>Tel: {doctorProfile.phone}</span>}
            {doctorProfile?.email && <span>{doctorProfile.email}</span>}
          </div>
        </header>

        {/* Datos del paciente */}
        <section className="mb-4 text-sm">
          <h2 className="font-semibold text-gray-900 mb-2">Datos del paciente</h2>
          <p><strong>Paciente:</strong> {patientName}</p>
          <p><strong>Edad:</strong> {age} años — <strong>Fecha:</strong> {dateStr}</p>
          <p><strong>Diagnóstico:</strong> {diagnosis}</p>
        </section>

        {/* Tratamiento */}
        <section className="mb-4">
          <h2 className="font-semibold text-gray-900 mb-2">Tratamiento</h2>
          <table className="w-full border border-gray-400 text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-400 p-1 text-left">Medicamento</th>
                <th className="border border-gray-400 p-1 text-left">Dosis</th>
                <th className="border border-gray-400 p-1 text-left">Frecuencia</th>
                <th className="border border-gray-400 p-1 text-left">Duración</th>
              </tr>
            </thead>
            <tbody>
              {prescription.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="border border-gray-400 p-1">{item.medication_name}</td>
                  <td className="border border-gray-400 p-1">{item.dose ?? '—'}</td>
                  <td className="border border-gray-400 p-1">{item.frequency ?? '—'}</td>
                  <td className="border border-gray-400 p-1">{item.duration ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Indicaciones generales */}
        {prescription.general_instructions && (
          <section className="mb-6 p-3 border border-gray-300 rounded bg-gray-50">
            <h2 className="font-semibold text-gray-900 mb-1">Indicaciones generales</h2>
            <p className="text-sm whitespace-pre-wrap">{prescription.general_instructions}</p>
          </section>
        )}

        {/* Zona firma y sello */}
        <section className="mt-8 flex flex-col items-end text-sm text-gray-700">
          {signatureUrl && (
            <img
              src={signatureUrl}
              alt="Firma"
              className="max-h-16 object-contain mb-1"
            />
          )}
          {stampUrl && (
            <img
              src={stampUrl}
              alt="Sello"
              className="max-h-14 object-contain mb-1"
            />
          )}
          <p className="font-semibold">{doctorProfile?.full_name ?? 'Médico'}</p>
          {doctorProfile?.senescyt_reg && (
            <p className="text-gray-600">Reg. Prof. {doctorProfile.senescyt_reg}</p>
          )}
        </section>
      </article>
    </div>
  )
}
