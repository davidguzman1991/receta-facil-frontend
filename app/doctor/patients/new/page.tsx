'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { API_BASE_URL } from '@/lib/api'
import { authFetch } from '@/lib/authFetch'
import { PROVINCIAS_ECUADOR, ciudadesEcuador } from '@/lib/doctorProfileConstants'

const MESES: { value: number; label: string }[] = [
  { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
]

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: CURRENT_YEAR - 1919 }, (_, i) => CURRENT_YEAR - i) // 1920 hasta año actual
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

/** Convierte día, mes, año a YYYY-MM-DD. */
function toBirthDate(day: string, month: string, year: string): string {
  if (!day || !month || !year) return ''
  const d = parseInt(day, 10)
  const m = parseInt(month, 10)
  const y = parseInt(year, 10)
  if (Number.isNaN(d) || Number.isNaN(m) || Number.isNaN(y)) return ''
  const paddedMonth = m < 10 ? `0${m}` : String(m)
  const paddedDay = d < 10 ? `0${d}` : String(d)
  return `${y}-${paddedMonth}-${paddedDay}`
}

function isValidBirthDateParts(day: string, month: string, year: string): boolean {
  const d = Number(day)
  const m = Number(month)
  const y = Number(year)
  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y)) return false
  if (d < 1 || d > 31) return false
  if (m < 1 || m > 12) return false
  if (y < 1920 || y > CURRENT_YEAR) return false
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

function normalizeNumericInput(value: string, maxLength: number): string {
  return value.replace(/\D/g, '').slice(0, maxLength)
}

function isValidDay(value: string): boolean {
  const d = Number(value)
  return Number.isInteger(d) && d >= 1 && d <= 31
}

function isValidMonth(value: string): boolean {
  const m = Number(value)
  return Number.isInteger(m) && m >= 1 && m <= 12
}

function isValidYear(value: string): boolean {
  const y = Number(value)
  return Number.isInteger(y) && y >= 1920 && y <= CURRENT_YEAR
}

function isNonEmpty(value: string): boolean {
  return value.trim().length > 0
}

function isValidDniOrPassport(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  const onlyDigits = /^\d+$/.test(trimmed)
  if (onlyDigits) return trimmed.length === 10
  return /^[a-zA-Z0-9]{6,15}$/.test(trimmed)
}

function isValidEmail(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
}

function normalizePhone(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10)
}

function isValidPhone(value: string): boolean {
  return value.trim().length > 0 && /^\d{10}$/.test(value)
}

function ValidationIcon({
  status,
  label,
}: {
  status: 'valid' | 'invalid'
  label: string
}) {
  const baseClass =
    'pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded-full text-white text-xs shadow-sm'
  if (status === 'valid') {
    return (
      <span
        className={`${baseClass} bg-teal-500`}
        aria-label={`${label} válido`}
        title={`${label} válido`}
      >
        ✓
      </span>
    )
  }
  return (
    <span
      className={`${baseClass} bg-red-500`}
      aria-label={`${label} inválido`}
      title={`${label} inválido`}
    >
      ✕
    </span>
  )
}

/** Parsea YYYY-MM-DD a { day, month, year } para los selects. */
function parseBirthDate(birthDate: string): { day: string; month: string; year: string } {
  if (!birthDate || birthDate.length < 10) return { day: '', month: '', year: '' }
  const [y, m, d] = birthDate.slice(0, 10).split('-').map(Number)
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return { day: '', month: '', year: '' }
  return { day: String(d), month: String(m), year: String(y) }
}

/** Calcula la edad en años a partir de una fecha de nacimiento (YYYY-MM-DD). */
function getAgeFromBirthDate(birthDate: string): number | null {
  if (!birthDate.trim()) return null
  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
  return age < 0 ? null : age
}

export default function NewPatientPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    dni: '',
    birth_date: '',
    sex: '',
    phone: '',
    email: '',
    address: '',
    province: '',
    city: '',
    personal_history: '',
    allergic_history: '',
    gyneco_history: '',
    surgical_history: '',
  })
  const [birthParts, setBirthParts] = useState({ day: '', month: '', year: '' })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setError(null)
    const { name, value } = e.target
    if (name === 'province') {
      setForm((prev) => ({ ...prev, province: value, city: '' }))
      return
    }
    if (name === 'birth_day' || name === 'birth_month' || name === 'birth_year') {
      const maxLength = name === 'birth_year' ? 4 : 2
      const cleanedValue = normalizeNumericInput(value, maxLength)
      const nextParts = {
        day: name === 'birth_day' ? cleanedValue : birthParts.day,
        month: name === 'birth_month' ? cleanedValue : birthParts.month,
        year: name === 'birth_year' ? cleanedValue : birthParts.year,
      }
      setBirthParts(nextParts)
      const dateStr = isValidBirthDateParts(nextParts.day, nextParts.month, nextParts.year)
        ? toBirthDate(nextParts.day, nextParts.month, nextParts.year)
        : ''
      setForm((prev) => ({ ...prev, birth_date: dateStr }))
      return
    }
    if (name === 'birth_date') {
      setForm((prev) => ({ ...prev, birth_date: value }))
      setBirthParts(parseBirthDate(value))
      return
    }
    if (name === 'phone') {
      const nextPhone = normalizePhone(value)
      setForm((prev) => ({ ...prev, phone: nextPhone }))
      return
    }
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('Nombres y apellidos son obligatorios.')
      return
    }
    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        dni: form.dni.trim() || null,
        birth_date: form.birth_date || null,
        sex: form.sex || null,
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        province: form.province.trim() || null,
        city: form.city.trim() || null,
        personal_history: form.personal_history.trim() || null,
        allergic_history: form.allergic_history.trim() || null,
        gyneco_history: form.gyneco_history.trim() || null,
        surgical_history: form.surgical_history.trim() || null,
      }
      const res = await authFetch(`${API_BASE_URL}/doctor/patients`, {
        method: 'POST',
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        const detail = data.detail?.message || data.detail
        if (res.status === 403 && typeof detail === 'string' && detail.includes('límite de pacientes')) {
          setError('Llegaste al límite de pacientes de tu plan. Mejora a MediFast Profesional para seguir creciendo.')
        } else {
          setError(detail || 'Error al guardar el paciente.')
        }
        return
      }
      router.push('/doctor/patients')
    } catch {
      setError('Error de conexión al guardar.')
    } finally {
      setSubmitting(false)
    }
  }

  const calculatedAge = form.birth_date ? getAgeFromBirthDate(form.birth_date) : null

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

        {/* Header - Card integrada */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 px-5 py-5 sm:px-6 sm:py-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Nuevo paciente
            </h1>
            <p className="text-white/80 text-sm mt-1">
              Complete los datos del paciente
            </p>
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
            <div className="p-4 bg-red-50 text-red-800 text-sm font-medium flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              {error}
            </div>
          </div>
        )}

        {/* Formulario */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Card: Datos personales */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 px-5 py-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-3">
                <span className="text-xl">👤</span>
                Datos personales
              </h2>
            </div>
            <div className="p-5 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="relative">
                  <label htmlFor="first_name" className="block text-sm font-semibold text-slate-700 mb-2">
                    Nombres <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="first_name"
                    name="first_name"
                    type="text"
                    required
                    value={form.first_name}
                    onChange={handleChange}
                    placeholder="Ingrese nombres"
                    className="w-full border-2 border-teal-100 rounded-xl px-4 py-3 pr-12 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-sm transition-all"
                  />
                  {form.first_name.trim().length > 0 && (
                    <ValidationIcon status="valid" label="Nombres" />
                  )}
                </div>
                <div className="relative">
                  <label htmlFor="last_name" className="block text-sm font-semibold text-slate-700 mb-2">
                    Apellidos <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    required
                    value={form.last_name}
                    onChange={handleChange}
                    placeholder="Ingrese apellidos"
                    className="w-full border-2 border-teal-100 rounded-xl px-4 py-3 pr-12 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-sm transition-all"
                  />
                  {form.last_name.trim().length > 0 && (
                    <ValidationIcon status="valid" label="Apellidos" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="dni" className="block text-sm font-semibold text-slate-700 mb-2">
                    Cédula de Identidad o Pasaporte
                  </label>
                  <div className="relative">
                    <input
                      id="dni"
                      name="dni"
                      type="text"
                      value={form.dni}
                      onChange={handleChange}
                      placeholder="Ej.: 0912345678"
                      className="w-full border-2 border-teal-100 rounded-xl px-4 py-3 pr-12 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-sm transition-all"
                    />
                    {form.dni.trim().length > 0 && (
                      <ValidationIcon
                        status={isValidDniOrPassport(form.dni) ? 'valid' : 'invalid'}
                        label="Documento"
                      />
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Fecha de nacimiento
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="relative">
                      <label htmlFor="birth_day" className="sr-only">Día</label>
                      <input
                        id="birth_day"
                        name="birth_day"
                        type="text"
                        inputMode="numeric"
                        list="birth_days"
                        value={birthParts.day}
                        onChange={handleChange}
                        placeholder="Día"
                        className="w-full border-2 border-teal-100 rounded-xl px-3 py-3 pr-10 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-sm transition-all text-center"
                      />
                      {birthParts.day && (
                        <ValidationIcon
                          status={isValidDay(birthParts.day) ? 'valid' : 'invalid'}
                          label="Día"
                        />
                      )}
                    </div>
                    <div className="relative">
                      <label htmlFor="birth_month" className="sr-only">Mes</label>
                      <input
                        id="birth_month"
                        name="birth_month"
                        type="text"
                        inputMode="numeric"
                        list="birth_months"
                        value={birthParts.month}
                        onChange={handleChange}
                        placeholder="Mes"
                        className="w-full border-2 border-teal-100 rounded-xl px-3 py-3 pr-10 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-sm transition-all text-center"
                      />
                      {birthParts.month && (
                        <ValidationIcon
                          status={isValidMonth(birthParts.month) ? 'valid' : 'invalid'}
                          label="Mes"
                        />
                      )}
                    </div>
                    <div className="relative">
                      <label htmlFor="birth_year" className="sr-only">Año</label>
                      <input
                        id="birth_year"
                        name="birth_year"
                        type="text"
                        inputMode="numeric"
                        list="birth_years"
                        value={birthParts.year}
                        onChange={handleChange}
                        placeholder="Año"
                        className="w-full border-2 border-teal-100 rounded-xl px-3 py-3 pr-10 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-sm transition-all text-center"
                      />
                      {birthParts.year && (
                        <ValidationIcon
                          status={isValidYear(birthParts.year) ? 'valid' : 'invalid'}
                          label="Año"
                        />
                      )}
                    </div>
                  </div>
                  <datalist id="birth_days">
                    {DAYS.map((d) => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                  <datalist id="birth_months">
                    {MESES.map((m) => (
                      <option key={m.value} value={m.value} label={m.label} />
                    ))}
                  </datalist>
                  <datalist id="birth_years">
                    {YEARS.map((y) => (
                      <option key={y} value={y} />
                    ))}
                  </datalist>
                  <div className="mt-3">
                    <label htmlFor="birth_date" className="block text-xs font-medium text-slate-500 mb-1">
                      O seleccionar desde calendario
                    </label>
                    <div className="relative">
                      <input
                        id="birth_date"
                        name="birth_date"
                        type="date"
                        value={form.birth_date}
                        onChange={handleChange}
                        className="w-full border-2 border-teal-100 rounded-xl px-4 py-3 pr-12 text-slate-900 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-sm transition-all"
                      />
                      {form.birth_date && (
                        <ValidationIcon
                          status={isValidBirthDateParts(birthParts.day, birthParts.month, birthParts.year) ? 'valid' : 'invalid'}
                          label="Fecha"
                        />
                      )}
                    </div>
                  </div>
                  {calculatedAge != null && (
                    <p className="mt-2 text-sm text-teal-700 font-medium bg-teal-50 px-3 py-1.5 rounded-lg inline-block">
                      Edad: <strong>{calculatedAge} años</strong>
                    </p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="sex" className="block text-sm font-semibold text-slate-700 mb-2">
                  Sexo
                </label>
                <select
                  id="sex"
                  name="sex"
                  value={form.sex}
                  onChange={handleChange}
                  className="w-full border-2 border-teal-100 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-sm transition-all"
                >
                  <option value="">— Seleccionar —</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="O">Otro</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-2">
                    Teléfono
                  </label>
                  <div className="relative">
                    <input
                      id="phone"
                      name="phone"
                      type="text"
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="Ej.: 0999999999"
                      className="w-full border-2 border-teal-100 rounded-xl px-4 py-3 pr-12 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-sm transition-all"
                    />
                    {form.phone.trim().length > 0 && (
                      <ValidationIcon
                        status={isValidPhone(form.phone) ? 'valid' : 'invalid'}
                        label="Teléfono"
                      />
                    )}
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="correo@ejemplo.com"
                      className="w-full border-2 border-teal-100 rounded-xl px-4 py-3 pr-12 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-sm transition-all"
                    />
                    {form.email.trim().length > 0 && (
                      <ValidationIcon
                        status={isValidEmail(form.email) ? 'valid' : 'invalid'}
                        label="Email"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-semibold text-slate-700 mb-2">
                  Dirección
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Ej.: Calle principal, número"
                  className="w-full border-2 border-teal-100 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-sm transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="province" className="block text-sm font-semibold text-slate-700 mb-2">
                    Provincia
                  </label>
                  <select
                    id="province"
                    name="province"
                    value={form.province}
                    onChange={handleChange}
                    className="w-full border-2 border-teal-100 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-sm transition-all"
                  >
                    <option value="">— Seleccionar —</option>
                    {PROVINCIAS_ECUADOR.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-semibold text-slate-700 mb-2">
                    Ciudad / Cantón
                  </label>
                  <select
                    id="city"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    disabled={!form.province}
                    className="w-full border-2 border-teal-100 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-sm transition-all disabled:bg-slate-50 disabled:text-slate-400"
                  >
                    <option value="">— Seleccionar —</option>
                    {(ciudadesEcuador[form.province] ?? []).map((ciudad) => (
                      <option key={ciudad} value={ciudad}>{ciudad}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Antecedentes clínicos */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 px-5 py-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-3">
                <span className="text-xl">🩺</span>
                Antecedentes clínicos
              </h2>
            </div>
            <div className="p-5 sm:p-6 space-y-4">
              <div>
                <label htmlFor="personal_history" className="block text-sm font-semibold text-slate-700 mb-2">
                  Antecedentes personales
                </label>
                <textarea
                  id="personal_history"
                  name="personal_history"
                  rows={3}
                  value={form.personal_history}
                  onChange={handleChange}
                  placeholder="Enfermedades previas, crónicas..."
                  className="w-full border-2 border-teal-100 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-sm transition-all resize-y"
                />
              </div>
              <div>
                <label htmlFor="allergic_history" className="block text-sm font-semibold text-slate-700 mb-2">
                  Antecedentes alérgicos
                </label>
                <textarea
                  id="allergic_history"
                  name="allergic_history"
                  rows={2}
                  value={form.allergic_history}
                  onChange={handleChange}
                  placeholder="Medicamentos, alimentos, otros..."
                  className="w-full border-2 border-teal-100 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-sm transition-all resize-y"
                />
              </div>
              <div>
                <label htmlFor="gyneco_history" className="block text-sm font-semibold text-slate-700 mb-2">
                  Antecedentes ginecoobstétricos
                </label>
                <textarea
                  id="gyneco_history"
                  name="gyneco_history"
                  rows={2}
                  value={form.gyneco_history}
                  onChange={handleChange}
                  placeholder="Gestas, partos, cesáreas, FUM..."
                  className="w-full border-2 border-teal-100 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-sm transition-all resize-y"
                />
              </div>
              <div>
                <label htmlFor="surgical_history" className="block text-sm font-semibold text-slate-700 mb-2">
                  Antecedentes quirúrgicos
                </label>
                <textarea
                  id="surgical_history"
                  name="surgical_history"
                  rows={2}
                  value={form.surgical_history}
                  onChange={handleChange}
                  placeholder="Cirugías previas, fechas, observaciones..."
                  className="w-full border-2 border-teal-100 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-sm transition-all resize-y"
                />
              </div>
            </div>
          </div>

          {/* Botón de guardar */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-white font-semibold rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 shadow-md hover:shadow-lg disabled:opacity-50 transition-all min-h-[52px]"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Guardar paciente
                </>
              )}
            </button>
          </div>
        </form>

        {/* Espaciado inferior */}
        <div className="h-6"></div>
      </div>
    </div>
  )
}
