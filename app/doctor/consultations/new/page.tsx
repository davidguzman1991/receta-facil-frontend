'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter, useSearchParams } from 'next/navigation'

import { API_BASE_URL } from '@/lib/api'
import { authFetch } from '@/lib/authFetch'

interface Patient {
  id: string
  first_name: string
  last_name: string
  date_of_birth?: string | null
  phone?: string | null
}

interface PatientHistory {
  id: string
  personal_history: string | null
  allergic_history: string | null
  gyneco_history: string | null
  surgical_history: string | null
}

interface Drug {
  id: number
  name: string
  presentation: string | null
  strength: string | null
}

interface AddedMedication {
  drug_id: number
  drug_name: string
  drug_strength: string | null
  dose: string
  route: string
  frequency: string
  duration: string
  quantity: string
  notes: string
}

const ROUTES = [
  { value: 'VO', label: 'VO (Oral)' },
  { value: 'IM', label: 'IM (Intramuscular)' },
  { value: 'IV', label: 'IV (Intravenosa)' },
  { value: 'SC', label: 'SC (Subcutánea)' },
  { value: 'Tópica', label: 'Tópica' },
  { value: 'Sublingual', label: 'Sublingual' },
  { value: 'Rectal', label: 'Rectal' },
  { value: 'Otro', label: 'Otro' },
]

const SEARCH_DEBOUNCE_MS = 300

type BloodPressureStatus = 'normal' | 'normal_high' | 'high'
type TriStatus = 'low' | 'normal' | 'high'
type BmiStatus = 'underweight' | 'normal' | 'overweight' | 'obese'

function parseNumber(value: string): number | null {
  if (!value.trim()) return null
  const normalized = value.replace(',', '.').replace(/[^0-9.]/g, '')
  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}

function parseHeightMeters(value: string): number | null {
  const n = parseNumber(value)
  if (n == null) return null
  return n > 3 ? n / 100 : n
}

function getBloodPressureStatus(systolic: number | null, diastolic: number | null): BloodPressureStatus | null {
  if (systolic == null || diastolic == null) return null
  if (systolic >= 140 || diastolic >= 90) return 'high'
  if (systolic >= 130 || diastolic >= 80) return 'normal_high'
  return 'normal'
}

function getBloodPressureLabel(status: BloodPressureStatus): string {
  switch (status) {
    case 'normal':
      return 'Normal'
    case 'normal_high':
      return 'Normal alta'
    default:
      return 'Alta'
  }
}

function getBloodPressureClass(status: BloodPressureStatus): string {
  switch (status) {
    case 'normal':
      return 'bg-green-100 text-green-800'
    case 'normal_high':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-red-100 text-red-800'
  }
}

function getHeartRateStatus(value: number | null): TriStatus | null {
  if (value == null) return null
  if (value < 60) return 'low'
  if (value > 100) return 'high'
  return 'normal'
}

function getBmiStatus(value: number | null): BmiStatus | null {
  if (value == null) return null
  if (value < 18.5) return 'underweight'
  if (value < 25) return 'normal'
  if (value < 30) return 'overweight'
  return 'obese'
}

function getGlucoseStatus(value: number | null): TriStatus | null {
  if (value == null) return null
  if (value < 70) return 'low'
  if (value > 100) return 'high'
  return 'normal'
}

function getTemperatureAlert(value: number | null): 'normal' | 'high' | null {
  if (value == null) return null
  return value > 37.5 ? 'high' : 'normal'
}

function getTriStatusLabel(status: TriStatus): string {
  switch (status) {
    case 'low':
      return 'Bajo'
    case 'high':
      return 'Alto'
    default:
      return 'Normal'
  }
}

function getTriStatusClass(status: TriStatus): string {
  switch (status) {
    case 'low':
      return 'bg-blue-100 text-blue-800'
    case 'high':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-green-100 text-green-800'
  }
}

function getBmiLabel(status: BmiStatus): string {
  switch (status) {
    case 'underweight':
      return 'Bajo peso'
    case 'overweight':
      return 'Sobrepeso'
    case 'obese':
      return 'Obesidad'
    default:
      return 'Normal'
  }
}

function getBmiClass(status: BmiStatus): string {
  switch (status) {
    case 'underweight':
      return 'bg-blue-100 text-blue-800'
    case 'overweight':
      return 'bg-yellow-100 text-yellow-800'
    case 'obese':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-green-100 text-green-800'
  }
}

export default function NewConsultationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [patients, setPatients] = useState<Patient[]>([])
  const [patientSearchResults, setPatientSearchResults] = useState<Patient[] | null>(null)
  const [patientSearch, setPatientSearch] = useState('')
  const [patientSearching, setPatientSearching] = useState(false)
  const [patientDropdownOpen, setPatientDropdownOpen] = useState(false)
  const [patientId, setPatientId] = useState('')
  const [patientHistory, setPatientHistory] = useState<PatientHistory | null>(null)
  const [patientHistoryLoading, setPatientHistoryLoading] = useState(false)
  const [motivoConsulta, setMotivoConsulta] = useState('')
  const [enfermedadActual, setEnfermedadActual] = useState('')
  const [examenFisico, setExamenFisico] = useState('')
  const [signosVitales, setSignosVitales] = useState({
    ta_sis: '',
    ta_dia: '',
    fc: '',
    peso: '',
    talla: '',
    sat_o2: '',
    glucosa: '',
    temperatura: '',
  })
  const [diagnosisMain, setDiagnosisMain] = useState('')
  const [diagnosisSecondary, setDiagnosisSecondary] = useState('')
  const [diagnosisCode, setDiagnosisCode] = useState<string | null>(null)
  const [diagnosisDescription, setDiagnosisDescription] = useState<string | null>(null)
  const [icd10Results, setIcd10Results] = useState<{ code: string; description: string }[]>([])
  const [icd10Searching, setIcd10Searching] = useState(false)
  const [icd10Open, setIcd10Open] = useState(false)
  const [diagnosisSecondaryCode, setDiagnosisSecondaryCode] = useState<string | null>(null)
  const [diagnosisSecondaryDescription, setDiagnosisSecondaryDescription] = useState<string | null>(null)
  const [icd10SecondaryResults, setIcd10SecondaryResults] = useState<{ code: string; description: string }[]>([])
  const [icd10SecondarySearching, setIcd10SecondarySearching] = useState(false)
  const [icd10SecondaryOpen, setIcd10SecondaryOpen] = useState(false)
  const [planTratamiento, setPlanTratamiento] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const patientSearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const icd10SearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const icd10SecondarySearchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Medicamentos
  const [drugSearch, setDrugSearch] = useState('')
  const [drugResults, setDrugResults] = useState<Drug[]>([])
  const [drugSearching, setDrugSearching] = useState(false)
  const [drugError, setDrugError] = useState<string | null>(null)
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newDrugName, setNewDrugName] = useState('')
  const [newDrugPresentation, setNewDrugPresentation] = useState('')
  const [newDrugStrength, setNewDrugStrength] = useState('')
  const [creatingDrug, setCreatingDrug] = useState(false)
  const [dose, setDose] = useState('')
  const [route, setRoute] = useState('')
  const [frequency, setFrequency] = useState('')
  const [duration, setDuration] = useState('')
  const [quantity, setQuantity] = useState('')
  const [notes, setNotes] = useState('')
  const [addedMedications, setAddedMedications] = useState<AddedMedication[]>([])
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const dropdownPortalRef = useRef<HTMLDivElement>(null)
  const drugInputRef = useRef<HTMLInputElement>(null)
  const [drugDropdownPos, setDrugDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null)
  const patientDropdownRef = useRef<HTMLDivElement>(null)

  const systolic = parseNumber(signosVitales.ta_sis)
  const diastolic = parseNumber(signosVitales.ta_dia)
  const weightKg = parseNumber(signosVitales.peso)
  const heightM = parseHeightMeters(signosVitales.talla)
  const bmi = weightKg != null && heightM != null && heightM > 0 ? weightKg / (heightM * heightM) : null
  const map = systolic != null && diastolic != null ? (systolic + 2 * diastolic) / 3 : null
  const bpStatus = getBloodPressureStatus(systolic, diastolic)
  const glucose = parseNumber(signosVitales.glucosa)
  const temperature = parseNumber(signosVitales.temperatura)
  const satO2 = parseNumber(signosVitales.sat_o2)
  const glucoseStatus = getGlucoseStatus(glucose)
  const temperatureAlert = getTemperatureAlert(temperature)
  const heartRateStatus = getHeartRateStatus(parseNumber(signosVitales.fc))
  const bmiStatus = getBmiStatus(bmi)

  const fetchPatients = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/doctor/patients`)
      if (res.ok) {
        const data = await res.json()
        setPatients(data)
      } else {
        setPatients([])
      }
    } catch {
      setPatients([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPatients()
  }, [fetchPatients])

  const patientIdFromUrl = searchParams.get('patient_id')
  useEffect(() => {
    if (patientIdFromUrl && patients.length > 0 && !patientId) {
      const exists = patients.some((p) => p.id === patientIdFromUrl)
      if (exists) setPatientId(patientIdFromUrl)
    }
  }, [patientIdFromUrl, patients, patientId])

  useEffect(() => {
    if (!patientId) {
      setPatientHistory(null)
      return
    }
    setPatientHistoryLoading(true)
    authFetch(`${API_BASE_URL}/doctor/patients/${patientId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) {
          setPatientHistory(null)
          return
        }
        setPatientHistory({
          id: data.id,
          personal_history: data.personal_history ?? null,
          allergic_history: data.allergic_history ?? null,
          gyneco_history: data.gyneco_history ?? null,
          surgical_history: data.surgical_history ?? null,
        })
      })
      .catch(() => {
        setPatientHistory(null)
      })
      .finally(() => {
        setPatientHistoryLoading(false)
      })
  }, [patientId])

  const searchPatientsApi = useCallback(async (q: string) => {
    if (!q.trim()) {
      setPatientSearchResults(null)
      return
    }
    setPatientSearching(true)
    try {
      const res = await authFetch(
        `${API_BASE_URL}/doctor/patients/search?q=${encodeURIComponent(q.trim())}&limit=50`
      )
      if (res.ok) {
        const data = await res.json()
        setPatientSearchResults(data)
      } else {
        setPatientSearchResults([])
      }
    } catch {
      setPatientSearchResults([])
    } finally {
      setPatientSearching(false)
    }
  }, [])

  useEffect(() => {
    if (patientSearchTimeoutRef.current) clearTimeout(patientSearchTimeoutRef.current)
    if (!patientSearch.trim()) {
      setPatientSearchResults(null)
      setPatientSearching(false)
      return
    }
    setPatientSearching(true)
    patientSearchTimeoutRef.current = setTimeout(() => {
      searchPatientsApi(patientSearch)
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      if (patientSearchTimeoutRef.current) clearTimeout(patientSearchTimeoutRef.current)
    }
  }, [patientSearch, searchPatientsApi])

  const searchDrugs = useCallback(async (q: string) => {
    if (!q.trim()) {
      setDrugResults([])
      setDrugError(null)
      return
    }
    setDrugSearching(true)
    setDrugError(null)
    try {
      const res = await authFetch(`${API_BASE_URL}/drugs/search?q=${encodeURIComponent(q.trim())}&limit=10`)
      if (res.ok) {
        const data = await res.json()
        setDrugResults(Array.isArray(data) ? data : [])
      } else if (res.status === 401) {
        setDrugResults([])
        setDrugError('Sesión expirada o no autorizada. Vuelve a iniciar sesión.')
      } else {
        setDrugResults([])
        setDrugError('No se pudo buscar medicamentos. Intenta nuevamente.')
      }
    } catch {
      setDrugResults([])
      setDrugError('Error de conexión al buscar medicamentos.')
    } finally {
      setDrugSearching(false)
    }
  }, [])

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    if (!drugSearch.trim()) {
      setDrugResults([])
      setDrugError(null)
      return
    }
    searchTimeoutRef.current = setTimeout(() => {
      searchDrugs(drugSearch)
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [drugSearch, searchDrugs])

  const shouldShowDrugDropdown = drugSearch.trim().length > 0

  useEffect(() => {
    if (!shouldShowDrugDropdown) return
    const updatePos = () => {
      if (!drugInputRef.current) return
      const rect = drugInputRef.current.getBoundingClientRect()
      setDrugDropdownPos({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
      })
    }
    updatePos()
    window.addEventListener('scroll', updatePos, true)
    window.addEventListener('resize', updatePos)
    return () => {
      window.removeEventListener('scroll', updatePos, true)
      window.removeEventListener('resize', updatePos)
    }
  }, [shouldShowDrugDropdown])

  useEffect(() => {
    if (icd10SearchTimeoutRef.current) clearTimeout(icd10SearchTimeoutRef.current)
    if (
      diagnosisCode &&
      diagnosisDescription &&
      diagnosisMain.trim() === `${diagnosisCode} — ${diagnosisDescription}`
    ) {
      setIcd10Open(false)
      return
    }
    if (!diagnosisMain.trim()) {
      setIcd10Results([])
      setIcd10Open(false)
      return
    }
    setIcd10Searching(true)
    setIcd10Open(true)
    icd10SearchTimeoutRef.current = setTimeout(() => {
      authFetch(`${API_BASE_URL}/icd10/search?q=${encodeURIComponent(diagnosisMain.trim())}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          setIcd10Results(Array.isArray(data) ? data : [])
        })
        .catch(() => {
          setIcd10Results([])
        })
        .finally(() => {
          setIcd10Searching(false)
        })
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      if (icd10SearchTimeoutRef.current) clearTimeout(icd10SearchTimeoutRef.current)
    }
  }, [diagnosisMain])

  useEffect(() => {
    if (icd10SecondarySearchTimeoutRef.current) clearTimeout(icd10SecondarySearchTimeoutRef.current)
    if (
      diagnosisSecondaryCode &&
      diagnosisSecondaryDescription &&
      diagnosisSecondary.trim() === `${diagnosisSecondaryCode} — ${diagnosisSecondaryDescription}`
    ) {
      setIcd10SecondaryOpen(false)
      return
    }
    if (!diagnosisSecondary.trim()) {
      setIcd10SecondaryResults([])
      setIcd10SecondaryOpen(false)
      return
    }
    setIcd10SecondarySearching(true)
    setIcd10SecondaryOpen(true)
    icd10SecondarySearchTimeoutRef.current = setTimeout(() => {
      authFetch(`${API_BASE_URL}/icd10/search?q=${encodeURIComponent(diagnosisSecondary.trim())}`)
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => {
          setIcd10SecondaryResults(Array.isArray(data) ? data : [])
        })
        .catch(() => {
          setIcd10SecondaryResults([])
        })
        .finally(() => {
          setIcd10SecondarySearching(false)
        })
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      if (icd10SecondarySearchTimeoutRef.current) clearTimeout(icd10SecondarySearchTimeoutRef.current)
    }
  }, [diagnosisSecondary])

  useEffect(() => {
    function handleClickOutsidePatient(e: MouseEvent) {
      if (patientDropdownRef.current && !patientDropdownRef.current.contains(e.target as Node)) {
        setPatientDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutsidePatient)
    return () => document.removeEventListener('mousedown', handleClickOutsidePatient)
  }, [])

  // Filtrar pacientes localmente basado en el texto de búsqueda
  const filteredPatients = patientSearch.trim()
    ? patients.filter((p) =>
        `${p.first_name} ${p.last_name}`.toLowerCase().includes(patientSearch.toLowerCase().trim())
      )
    : patients

  const handleSelectDrug = (drug: Drug) => {
    setSelectedDrug(drug)
    setDrugSearch(drug.name)
    setDrugResults([])
  }

  const handleKeyDownDrugSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (drugResults.length > 0) {
        handleSelectDrug(drugResults[0])
      } else if (drugSearch.trim()) {
        setNewDrugName(drugSearch.trim())
        setShowCreateModal(true)
      }
    }
  }

  const handleCreateDrug = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDrugName.trim()) return
    setCreatingDrug(true)
    try {
      const res = await authFetch(`${API_BASE_URL}/drugs`, {
        method: 'POST',
        body: JSON.stringify({
          name: newDrugName.trim(),
          presentation: newDrugPresentation.trim() || null,
          strength: newDrugStrength.trim() || null,
        }),
      })
      if (res.ok) {
        const drug: Drug = await res.json()
        setSelectedDrug(drug)
        setDrugSearch(drug.name)
        setShowCreateModal(false)
        setNewDrugName('')
        setNewDrugPresentation('')
        setNewDrugStrength('')
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.detail || 'Error al crear el medicamento')
      }
    } catch {
      setError('Error de conexión al crear el medicamento')
    } finally {
      setCreatingDrug(false)
    }
  }

  const handleAddToRecipe = () => {
    if (!selectedDrug) return
    setAddedMedications((prev) => [
      ...prev,
      {
        drug_id: selectedDrug.id,
        drug_name: selectedDrug.name,
        drug_strength: selectedDrug.strength,
        dose: dose.trim() || '',
        route: route || '',
        frequency: frequency.trim() || '',
        duration: duration.trim() || '',
        quantity: quantity.trim() || '',
        notes: notes.trim() || '',
      },
    ])
    setSelectedDrug(null)
    setDrugSearch('')
    setDose('')
    setRoute('')
    setFrequency('')
    setDuration('')
    setQuantity('')
    setNotes('')
  }

  const handleRemoveMedication = (index: number) => {
    setAddedMedications((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!patientId) {
      setError('Seleccione un paciente.')
      return
    }
    if (!diagnosisMain.trim()) {
      setError('El diagnóstico principal es obligatorio.')
      return
    }
    setSubmitting(true)
    try {
      const signosPayload =
        signosVitales.ta_sis ||
        signosVitales.ta_dia ||
        signosVitales.fc ||
        signosVitales.peso ||
        signosVitales.talla ||
        signosVitales.sat_o2 ||
        signosVitales.glucosa ||
        signosVitales.temperatura
          ? {
              ta_sis: signosVitales.ta_sis.trim() || undefined,
              ta_dia: signosVitales.ta_dia.trim() || undefined,
              pam: map != null ? Math.round(map) : undefined,
              fc: signosVitales.fc.trim() || undefined,
              peso: signosVitales.peso.trim() || undefined,
              talla: signosVitales.talla.trim() || undefined,
              imc: bmi != null ? Number(bmi.toFixed(1)) : undefined,
              sat_o2: signosVitales.sat_o2.trim() || undefined,
              glucosa: signosVitales.glucosa.trim() || undefined,
              temperatura: signosVitales.temperatura.trim() || undefined,
            }
          : null
      const res = await authFetch(`${API_BASE_URL}/doctor/consultations`, {
        method: 'POST',
        body: JSON.stringify({
          patient_id: patientId,
          motivo_consulta: motivoConsulta.trim() || null,
          enfermedad_actual: enfermedadActual.trim() || null,
          examen_fisico: examenFisico.trim() || null,
          signos_vitales: signosPayload,
          diagnosis_main: (diagnosisDescription || diagnosisMain).trim(),
          diagnosis_secondary: diagnosisSecondary.trim() || null,
          diagnosis_code: diagnosisCode || null,
          diagnosis_description: diagnosisDescription || null,
          plan_tratamiento: planTratamiento.trim() || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.detail?.message || data.detail || 'Error al guardar la consulta.')
        return
      }
      const consultation = await res.json()
      const consultationId = consultation.id

      for (const med of addedMedications) {
        await authFetch(`${API_BASE_URL}/doctor/consultations/${consultationId}/medications`, {
          method: 'POST',
          body: JSON.stringify({
            drug_id: med.drug_id,
            dose: med.dose || null,
            route: med.route || null,
            frequency: med.frequency || null,
            duration: med.duration || null,
            quantity: med.quantity || null,
            notes: med.notes || null,
          }),
        })
      }

      router.push(`/doctor/consultations/${consultationId}`)
    } catch {
      setError('Error de conexión al guardar la consulta.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <p className="text-gray-500">Cargando pacientes...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 pb-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {/* Header - Card integrada */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 px-5 py-5 sm:px-6 sm:py-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Nueva Consulta Médica
            </h1>
            <p className="text-white/80 text-sm mt-1">
              Sistema integral de registro clínico
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
            <div className="p-4 bg-red-50 text-red-800 text-sm font-medium flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              {error}
            </div>
          </div>
        )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Paso 1: Seleccionar Paciente - Contenedor con z-index alto para que dropdown flote sobre cards posteriores */}
        <div className="relative" style={{ zIndex: 50 }} ref={patientDropdownRef}>
          <section className="bg-white rounded-2xl shadow-md overflow-visible">
            <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 px-5 py-4 rounded-t-2xl">
              <h2 className="text-lg font-semibold text-white flex items-center gap-3">
                <span className="text-xl">👤</span>
                <span>1. Seleccionar Paciente</span>
              </h2>
            </div>
            <div className="p-5 sm:p-6 overflow-visible">
              {/* Contenedor del input + dropdown con posición relativa */}
              <div className="relative">
                <label htmlFor="patient-search" className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <span className="text-teal-600">👤</span>
                  Seleccionar o buscar paciente <span className="text-red-500">*</span>
                </label>
                <input
                  id="patient-search"
                  type="text"
                  value={patientSearch}
                  onChange={(e) => {
                    setPatientSearch(e.target.value)
                    setPatientDropdownOpen(true)
                    if (!e.target.value.trim()) {
                      setPatientId('')
                    }
                  }}
                  onFocus={() => setPatientDropdownOpen(true)}
                  placeholder="Escribe el nombre del paciente..."
                  className="w-full border-2 border-teal-100 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 bg-white shadow-sm transition-all"
                />
                {/* Campo hidden para validación */}
                <input
                  type="hidden"
                  required
                  value={patientId}
                  onChange={() => {}}
                />
                {patientSearching && (
                  <div className="absolute right-3 top-10 text-xs text-teal-600 flex items-center gap-1">
                    <span className="animate-spin">⏳</span>
                    <span>Buscando...</span>
                  </div>
                )}
                
                {/* Dropdown de resultados - posicionado absolutamente respecto al input */}
                {patientDropdownOpen && patientSearch.length >= 1 && (
                  <div
                    className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-teal-200 bg-white shadow-2xl max-h-64 overflow-y-auto"
                  >
                    {filteredPatients.length > 0 ? (
                      <ul className="py-1">
                        {filteredPatients.map((p) => (
                          <li key={p.id}>
                            <button
                              type="button"
                              className={`w-full text-left px-4 py-3 hover:bg-teal-50 active:bg-teal-100 transition-colors flex items-center gap-3 border-b border-teal-50 last:border-b-0 ${
                                patientId === p.id ? 'bg-teal-50 font-semibold' : ''
                              }`}
                              onClick={() => {
                                setPatientId(p.id)
                                setPatientSearch(`${p.first_name} ${p.last_name}`)
                                setPatientDropdownOpen(false)
                              }}
                            >
                              <span className="text-2xl shrink-0">👤</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-slate-800 font-semibold text-sm">
                                  {p.first_name} {p.last_name}
                                </p>
                                {p.date_of_birth && (
                                  <p className="text-xs text-slate-500 mt-0.5">
                                    Nacimiento: {p.date_of_birth}
                                  </p>
                                )}
                              </div>
                              {patientId === p.id && (
                                <span className="text-teal-600 text-xl">✓</span>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="py-6 px-4 text-center">
                        <p className="text-slate-600 text-sm font-medium mb-1">
                          {patientSearch.trim() 
                            ? `No se encontraron pacientes con "${patientSearch.trim()}"` 
                            : 'No hay pacientes registrados'}
                        </p>
                        <p className="text-slate-500 text-xs">
                          Puedes crear un nuevo paciente usando el botón de abajo
                        </p>
                      </div>
                    )}
                    
                    {/* Opción para crear nuevo paciente */}
                    {filteredPatients.length === 0 && patientSearch.length >= 2 && (
                      <div className="border-t border-teal-200 bg-teal-50">
                        <Link
                          href="/doctor/patients/new"
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 hover:bg-teal-100 active:bg-teal-200 transition-colors font-semibold text-teal-700 text-sm"
                        >
                          <span className="text-xl">➕</span>
                          <span>Crear nuevo paciente</span>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Indicador de paciente seleccionado */}
              {patientId && (
                <div className="mt-3 p-3 bg-teal-50 border-2 border-teal-200 rounded-xl flex items-center gap-2">
                  <span className="text-teal-600 text-xl">✓</span>
                  <span className="text-teal-800 font-medium">Paciente seleccionado</span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Card: Historia clínica base */}
        <section className="relative bg-white rounded-2xl shadow-md overflow-hidden" style={{ zIndex: 10 }}>
          <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 px-5 py-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-3">
              <span className="text-xl">📋</span>
              Historia clínica base
            </h2>
          </div>
          <div className="p-5 sm:p-6">
            {patientHistoryLoading ? (
              <div className="flex items-center gap-3 text-teal-600">
                <span className="animate-spin text-2xl">⏳</span>
                <p className="font-medium">Cargando antecedentes...</p>
              </div>
            ) : patientHistory ? (
              <div className="grid grid-cols-1 gap-4">
                <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-4">
                  <p className="text-xs font-bold text-teal-700 mb-2 flex items-center gap-2">
                    <span>🏥</span> Antecedentes personales
                  </p>
                  <p className="text-slate-800 whitespace-pre-wrap">{patientHistory.personal_history || '—'}</p>
                </div>
                <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">
                  <p className="text-xs font-bold text-red-700 mb-2 flex items-center gap-2">
                    <span>⚠️</span> Antecedentes alérgicos
                  </p>
                  <p className="text-slate-800 whitespace-pre-wrap">{patientHistory.allergic_history || '—'}</p>
                </div>
                <div className="rounded-xl border border-pink-100 bg-pink-50/50 p-4">
                  <p className="text-xs font-bold text-pink-700 mb-2 flex items-center gap-2">
                    <span>🤰</span> Antecedentes ginecoobstétricos
                  </p>
                  <p className="text-slate-800 whitespace-pre-wrap">{patientHistory.gyneco_history || '—'}</p>
                </div>
                <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-4">
                  <p className="text-xs font-bold text-purple-700 mb-2 flex items-center gap-2">
                    <span>🔪</span> Antecedentes quirúrgicos
                  </p>
                  <p className="text-slate-800 whitespace-pre-wrap">{patientHistory.surgical_history || '—'}</p>
                </div>
                <Link
                  href={`/doctor/patients/${patientHistory.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-white font-semibold rounded-xl shadow-md w-fit min-h-[44px]"
                  style={{ background: 'linear-gradient(135deg, #2FB7A3 0%, #6ED3C2 45%, #1CA39A 100%)' }}
                >
                  <span>✏️</span>
                  Editar antecedentes
                </Link>
              </div>
            ) : (
              <p className="text-slate-500 font-medium flex items-center gap-2">
                <span className="text-2xl">👤</span>
                Seleccione un paciente para ver los antecedentes.
              </p>
            )}
          </div>
        </section>

        {/* Card 2: Motivo de consulta */}
        <section className="bg-white rounded-2xl shadow-md overflow-visible relative z-20">
          <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 px-5 py-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-3">
              <span className="text-xl">🩺</span>
              2. Motivo de consulta
            </h2>
          </div>
          <div className="p-5 sm:p-6">
            <label htmlFor="motivo-consulta" className="block text-sm font-semibold text-slate-700 mb-2">
              Motivo de consulta (opcional)
            </label>
            <textarea
              id="motivo-consulta"
              rows={3}
              value={motivoConsulta}
              onChange={(e) => setMotivoConsulta(e.target.value)}
              placeholder="Ej.: Dolor de cabeza de 3 días de evolución"
              className="w-full border-2 border-teal-100 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 bg-white shadow-sm transition-all resize-y"
            />
          </div>
        </section>

        {/* Card 3: Enfermedad actual */}
        <section className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 px-5 py-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-3">
              <span className="text-xl">📖</span>
              3. Enfermedad actual
            </h2>
          </div>
          <div className="p-5 sm:p-6">
            <label htmlFor="enfermedad-actual" className="block text-sm font-semibold text-slate-700 mb-2">
              Enfermedad actual (opcional)
            </label>
            <textarea
              id="enfermedad-actual"
              rows={5}
              value={enfermedadActual}
              onChange={(e) => setEnfermedadActual(e.target.value)}
              placeholder="Relato del paciente, antecedentes relevantes..."
              className="w-full border-2 border-teal-100 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 bg-white shadow-sm transition-all resize-y"
            />
          </div>
        </section>

        {/* Card 4: Examen físico */}
        <section className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 px-5 py-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-3">
              <span className="text-xl">🧍‍♂️</span>
              4. Examen físico
            </h2>
          </div>
          <div className="p-5 sm:p-6">
            <label htmlFor="examen-fisico" className="block text-sm font-semibold text-slate-700 mb-2">
              Examen físico (opcional)
            </label>
            <textarea
              id="examen-fisico"
              rows={4}
              value={examenFisico}
              onChange={(e) => setExamenFisico(e.target.value)}
              placeholder="Hallazgos del examen físico..."
              className="w-full border-2 border-teal-100 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 bg-white shadow-sm transition-all resize-y"
            />
          </div>
        </section>

        {/* Card 5: Signos vitales */}
        <section className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 px-5 py-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-3">
              <span className="text-xl">❤️</span>
              5. Signos vitales
            </h2>
          </div>
          <div className="p-5 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="signos-ta" className="block text-xs font-medium text-gray-600 mb-1">
                Presión arterial (sistólica/diastólica)
              </label>
              <div className="flex gap-2">
                <input
                  id="signos-ta"
                  type="text"
                  value={signosVitales.ta_sis}
                  onChange={(e) => setSignosVitales((s) => ({ ...s, ta_sis: e.target.value }))}
                  placeholder="Sistólica"
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  value={signosVitales.ta_dia}
                  onChange={(e) => setSignosVitales((s) => ({ ...s, ta_dia: e.target.value }))}
                  placeholder="Diastólica"
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              {bpStatus && (
                <span
                  className={`inline-flex mt-1 rounded-full px-2 py-0.5 text-xs font-medium ${getBloodPressureClass(bpStatus)}`}
                >
                  {getBloodPressureLabel(bpStatus)}
                </span>
              )}
            </div>
            <div>
              <label htmlFor="signos-pam" className="block text-xs font-medium text-gray-600 mb-1">
                PAM (mmHg)
              </label>
              <input
                id="signos-pam"
                type="text"
                value={map != null ? Math.round(map) : ''}
                readOnly
                placeholder="Calculado"
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700 bg-gray-50"
              />
            </div>
            <div>
              <label htmlFor="signos-fc" className="block text-xs font-medium text-gray-600 mb-1">
                FC
              </label>
              <input
                id="signos-fc"
                type="text"
                value={signosVitales.fc}
                onChange={(e) => setSignosVitales((s) => ({ ...s, fc: e.target.value }))}
                placeholder="72"
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {heartRateStatus && (
                <span
                  className={`inline-flex mt-1 rounded-full px-2 py-0.5 text-xs font-medium ${getTriStatusClass(heartRateStatus)}`}
                >
                  {getTriStatusLabel(heartRateStatus)}
                </span>
              )}
            </div>
            <div>
              <label htmlFor="signos-peso" className="block text-xs font-medium text-gray-600 mb-1">
                Peso
              </label>
              <input
                id="signos-peso"
                type="text"
                value={signosVitales.peso}
                onChange={(e) => setSignosVitales((s) => ({ ...s, peso: e.target.value }))}
                placeholder="70 kg"
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="signos-talla" className="block text-xs font-medium text-gray-600 mb-1">
                Talla
              </label>
              <input
                id="signos-talla"
                type="text"
                value={signosVitales.talla}
                onChange={(e) => setSignosVitales((s) => ({ ...s, talla: e.target.value }))}
                placeholder="1.70 m"
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="signos-imc" className="block text-xs font-medium text-gray-600 mb-1">
                IMC
              </label>
              <input
                id="signos-imc"
                type="text"
                value={bmi != null ? bmi.toFixed(1) : ''}
                readOnly
                placeholder="Calculado"
                className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700 bg-gray-50"
              />
              {bmiStatus && (
                <span
                  className={`inline-flex mt-1 rounded-full px-2 py-0.5 text-xs font-medium ${getBmiClass(bmiStatus)}`}
                >
                  {getBmiLabel(bmiStatus)}
                </span>
              )}
            </div>
            <div>
              <label htmlFor="signos-sat" className="block text-xs font-medium text-gray-600 mb-1">
                SAT O2
              </label>
              <input
                id="signos-sat"
                type="text"
                value={signosVitales.sat_o2}
                onChange={(e) => setSignosVitales((s) => ({ ...s, sat_o2: e.target.value }))}
                placeholder="98"
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="signos-glucosa" className="block text-xs font-medium text-gray-600 mb-1">
                Glucosa
              </label>
              <input
                id="signos-glucosa"
                type="text"
                value={signosVitales.glucosa}
                onChange={(e) => setSignosVitales((s) => ({ ...s, glucosa: e.target.value }))}
                placeholder="90"
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {glucoseStatus && (
                <span
                  className={`inline-flex mt-1 rounded-full px-2 py-0.5 text-xs font-medium ${getTriStatusClass(glucoseStatus)}`}
                >
                  {getTriStatusLabel(glucoseStatus)}
                </span>
              )}
            </div>
            <div>
              <label htmlFor="signos-temp" className="block text-xs font-medium text-gray-600 mb-1">
                Temperatura
              </label>
              <input
                id="signos-temp"
                type="text"
                value={signosVitales.temperatura}
                onChange={(e) => setSignosVitales((s) => ({ ...s, temperatura: e.target.value }))}
                placeholder="36.8"
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {temperatureAlert && (
                <span
                  className={`inline-flex mt-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                    temperatureAlert === 'high' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}
                >
                  {temperatureAlert === 'high' ? 'Alta' : 'Normal'}
                </span>
              )}
            </div>
          </div>
          </div>
        </section>

        {/* Card 6: Diagnóstico Principal */}
        <section className="bg-white rounded-2xl shadow-md overflow-visible">
          <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 px-5 py-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-3">
              <span className="text-xl">🔍</span>
              6. Diagnóstico Principal
            </h2>
          </div>
          <div className="p-5 sm:p-6">
          <label htmlFor="diagnosis-main" className="block text-sm font-semibold text-slate-700 mb-2">
            Diagnóstico principal <span className="text-red-500">*</span>
          </label>
          <div className="relative overflow-visible">
            <input
              id="diagnosis-main"
              type="text"
              required
              value={diagnosisMain}
              onChange={(e) => {
                setDiagnosisMain(e.target.value)
                setDiagnosisCode(null)
                setDiagnosisDescription(null)
              }}
              onFocus={() => diagnosisMain.trim() && setIcd10Open(true)}
              placeholder="Ej.: Hipertensión arterial esencial"
              className="w-full border-2 border-teal-100 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-sm transition-all"
            />
            {icd10Searching && (
              <span className="absolute right-3 top-4 text-xs text-teal-600">Buscando...</span>
            )}
            {icd10Open && (
              <div className="absolute top-[calc(100%+0.5rem)] left-0 right-0 z-[9999] bg-white rounded-xl shadow-xl border border-emerald-100 max-h-60 overflow-y-auto">
                {icd10Results.length > 0 ? (
                  <ul className="py-1">
                    {icd10Results.map((item) => (
                      <li key={`${item.code}-${item.description}`}>
                        <button
                          type="button"
                          className="w-full text-left px-4 py-3 text-sm text-slate-800 hover:bg-teal-50 focus:bg-teal-50 cursor-pointer"
                          title={`${item.code} — ${item.description}`}
                          onClick={() => {
                            setDiagnosisMain(`${item.code} — ${item.description}`)
                            setDiagnosisCode(item.code)
                            setDiagnosisDescription(item.description)
                            setIcd10Open(false)
                          }}
                        >
                          <span className="block truncate">{item.code} — {item.description}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-3 text-sm text-slate-500">
                    No se encontraron diagnósticos
                  </div>
                )}
              </div>
            )}
          </div>
          {diagnosisCode && diagnosisDescription && (
            <p className="text-xs text-teal-600 mt-2 flex items-center gap-2 font-medium">
              <span>✅</span>
              Seleccionado: {diagnosisCode} — {diagnosisDescription}
            </p>
          )}
          </div>
        </section>

        {/* Card 7: Diagnósticos Secundarios */}
        <section className="bg-white rounded-2xl shadow-md overflow-visible">
          <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 px-5 py-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-3">
              <span className="text-xl">📑</span>
              7. Diagnósticos Secundarios
            </h2>
          </div>
          <div className="p-5 sm:p-6">
          <label htmlFor="diagnosis-secondary" className="block text-sm font-semibold text-slate-700 mb-2">
            Diagnósticos secundarios (opcional)
          </label>
          <div className="relative overflow-visible">
            <input
              id="diagnosis-secondary"
              type="text"
              value={diagnosisSecondary}
              onChange={(e) => {
                setDiagnosisSecondary(e.target.value)
                setDiagnosisSecondaryCode(null)
                setDiagnosisSecondaryDescription(null)
              }}
              onFocus={() => diagnosisSecondary.trim() && setIcd10SecondaryOpen(true)}
              placeholder="Ej.: Dislipidemia, Obesidad"
              className="w-full border-2 border-teal-100 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-sm transition-all"
            />
            {icd10SecondarySearching && (
              <span className="absolute right-3 top-4 text-xs text-teal-600">Buscando...</span>
            )}
            {icd10SecondaryOpen && (
              <div className="absolute top-[calc(100%+0.5rem)] left-0 right-0 z-[9999] bg-white rounded-xl shadow-xl border border-emerald-100 max-h-60 overflow-y-auto">
                {icd10SecondaryResults.length > 0 ? (
                  <ul className="py-1">
                    {icd10SecondaryResults.map((item) => (
                      <li key={`${item.code}-${item.description}`}>
                        <button
                          type="button"
                          className="w-full text-left px-4 py-3 text-sm text-slate-800 hover:bg-teal-50 focus:bg-teal-50 cursor-pointer"
                          title={`${item.code} — ${item.description}`}
                          onClick={() => {
                            setDiagnosisSecondary(`${item.code} — ${item.description}`)
                            setDiagnosisSecondaryCode(item.code)
                            setDiagnosisSecondaryDescription(item.description)
                            setIcd10SecondaryOpen(false)
                          }}
                        >
                          <span className="block truncate">{item.code} — {item.description}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="px-4 py-3 text-sm text-slate-500">
                    No se encontraron diagnósticos
                  </div>
                )}
              </div>
            )}
          </div>
          {diagnosisSecondaryCode && diagnosisSecondaryDescription && (
            <p className="text-xs text-teal-600 mt-2 flex items-center gap-2 font-medium">
              <span>✅</span>
              Seleccionado: {diagnosisSecondaryCode} — {diagnosisSecondaryDescription}
            </p>
          )}
          </div>
        </section>

        {/* Card 8: Plan de tratamiento */}
        <section className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 px-5 py-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-3">
              <span className="text-xl">📋</span>
              8. Plan de tratamiento
            </h2>
          </div>
          <div className="p-5 sm:p-6">
          <label htmlFor="plan-tratamiento" className="block text-sm font-semibold text-slate-700 mb-2">
            Plan de tratamiento / Indicaciones generales (opcional)
          </label>
          <textarea
            id="plan-tratamiento"
            rows={4}
            value={planTratamiento}
            onChange={(e) => setPlanTratamiento(e.target.value)}
            placeholder="Reposo, dieta, controles..."
            className="w-full border-2 border-teal-100 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 bg-white shadow-sm transition-all resize-y"
          />
          </div>
        </section>

        {/* Card 9: Medicamentos */}
        <section className="bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 px-5 py-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-3">
              <span className="text-xl">💊</span>
              9. Medicamentos
            </h2>
          </div>
          <div className="p-5 sm:p-6 space-y-4">
            <div className="relative z-30" ref={dropdownRef}>
              <label htmlFor="drug-search" className="block text-sm font-semibold text-slate-700 mb-2">
                Buscar medicamento
              </label>
              <input
                id="drug-search"
                type="text"
                value={drugSearch}
                onChange={(e) => setDrugSearch(e.target.value)}
                onKeyDown={handleKeyDownDrugSearch}
                placeholder="Ej.: Paracetamol, Ibuprofeno..."
                className="w-full border-2 border-teal-100 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-sm transition-all"
                ref={drugInputRef}
              />
              {drugSearching && (
                <p className="absolute right-3 top-12 text-xs text-teal-600">Buscando...</p>
              )}
              {shouldShowDrugDropdown && drugDropdownPos && createPortal(
                <div
                  className="fixed z-[9999] rounded-xl border border-teal-200 bg-white shadow-2xl max-h-56 overflow-auto"
                  style={{
                    top: drugDropdownPos.top,
                    left: drugDropdownPos.left,
                    width: drugDropdownPos.width,
                  }}
                  ref={dropdownPortalRef}
                >
                  {drugError && (
                    <div className="px-4 py-3 text-sm text-red-600 border-b border-teal-100">
                      {drugError}
                    </div>
                  )}
                  {drugSearching ? (
                    <div className="px-4 py-4 text-sm text-slate-600 flex items-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                      Buscando medicamentos...
                    </div>
                  ) : drugResults.length > 0 ? (
                    <ul className="py-1">
                      {drugResults.map((d) => (
                        <li key={d.id}>
                          <button
                            type="button"
                            className="w-full text-left px-4 py-3 text-sm text-slate-800 hover:bg-teal-50 focus:bg-teal-50"
                            onClick={() => handleSelectDrug(d)}
                          >
                            {d.name}
                            {d.strength && ` ${d.strength}`}
                            {d.presentation && ` · ${d.presentation}`}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="px-4 py-3">
                      <button
                        type="button"
                        className="text-sm font-medium text-teal-600 hover:text-teal-700"
                        onClick={() => {
                          setNewDrugName(drugSearch.trim())
                          setShowCreateModal(true)
                        }}
                      >
                        ➕ Agregar nuevo medicamento
                      </button>
                    </div>
                  )}
                </div>,
                document.body
              )}
            </div>

            {selectedDrug && (
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  Medicamento seleccionado: {selectedDrug.name}
                  {selectedDrug.strength && ` ${selectedDrug.strength}`}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Dosis</label>
                    <input
                      type="text"
                      value={dose}
                      onChange={(e) => setDose(e.target.value)}
                      placeholder="1 tableta, 5 ml"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Vía</label>
                    <select
                      value={route}
                      onChange={(e) => setRoute(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                      <option value="">Seleccionar</option>
                      {ROUTES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Frecuencia</label>
                    <input
                      type="text"
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      placeholder="Cada 8h, Cada 12h"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Duración</label>
                    <input
                      type="text"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="5 días, 1 mes"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Cantidad</label>
                    <input
                      type="text"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="20 tabletas, 1 frasco"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notas (opcional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Después de comidas"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddToRecipe}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  Añadir a receta
                </button>
              </div>
            )}

            {addedMedications.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Medicamentos añadidos</p>
                <ul className="space-y-2">
                  {addedMedications.map((med, index) => (
                    <li
                      key={index}
                      className="flex items-start justify-between gap-2 rounded-lg border border-gray-200 bg-white p-3 text-sm"
                    >
                      <div>
                        <span className="font-medium text-gray-900">
                          {med.drug_name}
                          {med.drug_strength && ` ${med.drug_strength}`}
                        </span>
                        <p className="text-gray-600 mt-0.5">
                          {[med.dose, med.route, med.frequency, med.duration, med.quantity && `Cantidad: ${med.quantity}`].filter(Boolean).join(' · ')}
                          {med.notes && ` · ${med.notes}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMedication(index)}
                        className="text-red-600 hover:text-red-800 text-xs font-medium shrink-0"
                      >
                        Eliminar
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Botón de guardar */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 text-white font-semibold text-lg rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all min-h-[56px]"
          >
            {submitting ? (
              <>
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Guardar Consulta</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Modal Crear nuevo medicamento */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Crear nuevo medicamento</h3>
            <form onSubmit={handleCreateDrug} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={newDrugName}
                  onChange={(e) => setNewDrugName(e.target.value)}
                  placeholder="Ej.: Paracetamol"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Presentación</label>
                <input
                  type="text"
                  value={newDrugPresentation}
                  onChange={(e) => setNewDrugPresentation(e.target.value)}
                  placeholder="Tableta, Jarabe, Cápsula"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Concentración</label>
                <input
                  type="text"
                  value={newDrugStrength}
                  onChange={(e) => setNewDrugStrength(e.target.value)}
                  placeholder="500 mg, 250 mg/5 ml"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={creatingDrug}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {creatingDrug ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewDrugName('')
                    setNewDrugPresentation('')
                    setNewDrugStrength('')
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

