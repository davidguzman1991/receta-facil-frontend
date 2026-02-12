'use client'

import Link from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, FormEvent } from 'react'

import { API_BASE_URL } from '@/lib/api'
import { authFetch } from '@/lib/authFetch'
import { generateSecurePassword } from '@/lib/passwordGenerator'
import {
  SPECIALTIES,
  COUNTRIES,
  PROVINCIAS_ECUADOR,
  ciudadesEcuador,
} from '@/lib/doctorProfileConstants'

const inputClass =
  'w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 bg-white transition-shadow'
const selectClass =
  'w-full border-2 border-slate-200 rounded-xl p-3 text-slate-900 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 bg-white transition-shadow'
const labelClass = 'block text-sm font-semibold text-slate-700 mb-2'

export default function DoctorProfilePage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = params?.id as string
  const [profileComplete, setProfileComplete] = useState<boolean | null>(null)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const [doctorStatus, setDoctorStatus] = useState<'active' | 'suspended'>('active')
  const [isEditing, setIsEditing] = useState(false)
  const [email, setEmail] = useState('')
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    specialty: '',
    specialty_other: '',
    subspecialty: '',
    professional_reg_number: '',
    institution: '',
    province: '',
    city: '',
    country: '',
    phone: '',
    address: '',
  })
  const [signatureFile, setSignatureFile] = useState<File | null>(null)
  const [stampFile, setStampFile] = useState<File | null>(null)

  const fieldClass = (base: string) =>
    isEditing ? base : `${base} bg-gray-100 text-gray-700 cursor-not-allowed`

  useEffect(() => {
    if (!id) return
    authFetch(`${API_BASE_URL}/admin/doctors/${id}/profile`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.email != null) setEmail(data.email)
        if (data && (data.full_name || data.specialty)) {
          setProfileComplete(true)
          if (data.full_name) {
            const parts = data.full_name.trim().split(/\s+/)
            const last = parts.pop() || ''
            setForm((f) => ({
              ...f,
              first_name: parts.join(' ') || '',
              last_name: last,
            }))
          }
          if (data.specialty != null) {
            const s = String(data.specialty)
            const inList = SPECIALTIES.includes(s as (typeof SPECIALTIES)[number])
            setForm((f) => ({
              ...f,
              specialty: inList ? s : 'Otra',
              specialty_other: inList ? '' : s,
            }))
          }
          if (data.phone != null) setForm((f) => ({ ...f, phone: data.phone }))
          if (data.address != null) setForm((f) => ({ ...f, address: data.address }))
          if (data.professional_reg_number != null) setForm((f) => ({ ...f, professional_reg_number: data.professional_reg_number }))
          if (data.country != null) setForm((f) => ({ ...f, country: data.country }))
          if (data.province != null) setForm((f) => ({ ...f, province: data.province }))
          if (data.city != null) setForm((f) => ({ ...f, city: data.city }))
          if (data.gender != null) setForm((f) => ({ ...f, gender: data.gender }))
          if (data.date_of_birth != null) setForm((f) => ({ ...f, date_of_birth: data.date_of_birth }))
        } else {
          setProfileComplete(false)
        }
      })
      .catch(() => setProfileComplete(false))
  }, [id])

  useEffect(() => {
    if (!id) return
    authFetch(`${API_BASE_URL}/admin/doctors`)
      .then((res) => (res.ok ? res.json() : []))
      .then((list: { id: string; subscription_status: string | null }[]) => {
        const doctor = list.find((d) => d.id === id)
        if (doctor?.subscription_status === 'suspended' || doctor?.subscription_status === 'active') {
          setDoctorStatus(doctor.subscription_status)
        }
      })
      .catch(() => {})
  }, [id])

  const handleResetPassword = async () => {
    const generatedPassword = newPassword
    const res = await fetch(`${API_BASE_URL}/admin/doctors/${id}/reset-password`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ new_password: generatedPassword }),
    })
    if (res.ok) {
      setNewPassword('')
      setCopied(false)
      alert('Contraseña actualizada')
    } else {
      const data = await res.json().catch(() => ({}))
      alert(data.detail || 'Error al actualizar contraseña')
    }
  }

  const handleGeneratePassword = () => {
    const next = generateSecurePassword(12)
    setNewPassword(next)
    setCopied(false)
  }

  const handleCopyPassword = async () => {
    if (!newPassword) return
    try {
      await navigator.clipboard.writeText(newPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  const handleToggleAccountStatus = async () => {
    const newStatus = doctorStatus === 'active' ? 'suspended' : 'active'
    const res = await authFetch(`${API_BASE_URL}/admin/doctors/${id}/account-status`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      setDoctorStatus(newStatus)
    } else {
      const data = await res.json().catch(() => ({}))
      alert(data.detail || 'Error al actualizar estado')
    }
  }

  const handleForcePasswordChange = async () => {
    const res = await authFetch(`${API_BASE_URL}/admin/doctors/${id}/force-password-change`, {
      method: 'PUT',
    })
    if (res.ok) {
      alert('Se forzó el cambio de contraseña')
    } else {
      const data = await res.json().catch(() => ({}))
      alert(data.detail || 'Error al forzar cambio de contraseña')
    }
  }

  const handleDeleteProfile = async () => {
    if (!confirm('¿Seguro que deseas eliminar el perfil profesional?')) return
    const res = await authFetch(`${API_BASE_URL}/admin/doctors/${id}/profile`, {
      method: 'DELETE',
    })
    if (res.ok) {
      alert('Perfil eliminado')
      router.refresh()
    } else {
      const data = await res.json().catch(() => ({}))
      alert(data.detail || 'Error al eliminar perfil')
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name === 'country') {
      setForm((prev) => ({ ...prev, country: value, province: '', city: '' }))
      return
    }
    if (name === 'province') {
      setForm((prev) => ({ ...prev, province: value, city: '' }))
      return
    }
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    if (!isEditing) return

    if (!form.specialty?.trim()) {
      setError('La especialidad es obligatoria.')
      return
    }
    if (form.specialty === 'Otra' && !form.specialty_other?.trim()) {
      setError('Especifique la especialidad cuando selecciona "Otra".')
      return
    }
    if (!form.country?.trim()) {
      setError('El país es obligatorio.')
      return
    }
    if (form.country === 'Ecuador') {
      if (!form.province?.trim()) {
        setError('La provincia es obligatoria cuando el país es Ecuador.')
        return
      }
      if (!form.city?.trim()) {
        setError('La ciudad es obligatoria cuando el país es Ecuador.')
        return
      }
    } else {
      if (!form.province?.trim()) {
        setError('Indique provincia o estado.')
        return
      }
      if (!form.city?.trim()) {
        setError('La ciudad es obligatoria.')
        return
      }
    }

    setSubmitting(true)
    const resolvedSpecialty = form.specialty === 'Otra' ? form.specialty_other?.trim() : form.specialty
    const payload = {
      full_name: [form.first_name, form.last_name].filter(Boolean).join(' ') || undefined,
      first_name: form.first_name || undefined,
      last_name: form.last_name || undefined,
      date_of_birth: form.date_of_birth || undefined,
      gender: form.gender || undefined,
      specialty: resolvedSpecialty || undefined,
      subspecialty: form.subspecialty || undefined,
      professional_reg_number: form.professional_reg_number || undefined,
      institution: form.institution || undefined,
      province: form.province || undefined,
      city: form.city || undefined,
      country: form.country || undefined,
      phone: form.phone || undefined,
      address: form.address || undefined,
    }
    authFetch(`${API_BASE_URL}/admin/doctors/${id}/profile`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error('No se pudo guardar el perfil')
        setSuccess(true)
        setProfileComplete(true)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al guardar'))
      .finally(() => setSubmitting(false))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-50 to-slate-200 p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <Link
          href={searchParams?.get('from') === 'detail' ? `/admin/doctors/${id}` : '/admin/doctors'}
          className="inline-flex items-center gap-1.5 text-fuchsia-600 hover:text-fuchsia-700 text-sm font-medium mb-6 transition-colors"
        >
          <span aria-hidden>←</span> Volver a médicos
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-fuchsia-100 text-fuchsia-700" aria-hidden>
                🩺
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-fuchsia-600 bg-fuchsia-100/80 px-2.5 py-1 rounded-full">
                Perfil médico
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
              Perfil profesional del médico
            </h1>
            {!isEditing && (
              <p className="text-sm text-gray-600 mt-2">
                Vista protegida: los datos están bloqueados. Presiona <span className="font-semibold text-fuchsia-700">Editar perfil</span> para modificar.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              setIsEditing((v) => !v)
              setSuccess(false)
              setError(null)
              setSignatureFile(null)
              setStampFile(null)
            }}
            className={
              isEditing
                ? 'px-5 py-2.5 bg-white text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 border-2 border-gray-200 shadow-sm transition-all'
                : 'px-5 py-2.5 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-teal-500 text-white text-sm font-semibold rounded-xl hover:from-fuchsia-600 hover:via-purple-600 hover:to-teal-600 shadow-md shadow-fuchsia-500/25 transition-all'
            }
          >
            {isEditing ? 'Cancelar edición' : 'Editar perfil'}
          </button>
        </div>

        {profileComplete === false && (
          <div className="mb-8 p-4 bg-amber-50/90 border-l-4 border-amber-400 rounded-xl text-amber-800 text-sm shadow-sm">
            <span className="font-semibold">⚠️ Perfil incompleto.</span>
            <p className="mt-1 text-amber-700">
              Este médico aún no ha completado su perfil. Se usará para recetas, firma digital e información legal.
            </p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-sm font-medium shadow-sm">
            ✓ Perfil profesional actualizado correctamente
          </div>
        )}
        {error && (
          <p className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</p>
        )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* SECCIÓN 1: Datos personales */}
        <div className="bg-gradient-to-br from-white/80 via-slate-50/90 to-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-xl shadow-slate-300/50 overflow-hidden">
          <div className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-teal-500 px-6 py-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 text-white text-sm" aria-hidden>👤</span>
              Datos personales
            </h2>
          </div>
          <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="email" className={labelClass}>Correo electrónico</label>
              <input
                id="email"
                type="email"
                value={email}
                readOnly
                className={`${inputClass} bg-gray-100 text-gray-700 cursor-not-allowed`}
              />
            </div>
            <div>
              <label htmlFor="first_name" className={labelClass}>Nombres</label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                value={form.first_name}
                onChange={handleChange}
                disabled={!isEditing}
                className={fieldClass(inputClass)}
              />
            </div>
            <div>
              <label htmlFor="last_name" className={labelClass}>Apellidos</label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                value={form.last_name}
                onChange={handleChange}
                disabled={!isEditing}
                className={fieldClass(inputClass)}
              />
            </div>
            <div>
              <label htmlFor="date_of_birth" className={labelClass}>Fecha de nacimiento</label>
              <input
                id="date_of_birth"
                name="date_of_birth"
                type="date"
                value={form.date_of_birth}
                onChange={handleChange}
                disabled={!isEditing}
                className={fieldClass(inputClass)}
              />
            </div>
            <div>
              <label htmlFor="gender" className={labelClass}>Sexo</label>
              <select
                id="gender"
                name="gender"
                value={form.gender}
                onChange={handleChange}
                disabled={!isEditing}
                className={fieldClass(inputClass)}
              >
                <option value="">Seleccionar</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>
          </div>
        </div>

        {/* SECCIÓN 2: Información profesional */}
        <div className="bg-gradient-to-br from-white/80 via-slate-50/90 to-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-xl shadow-slate-300/50 overflow-hidden">
          <div className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-teal-500 px-6 py-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 text-white text-sm" aria-hidden>💼</span>
              Información profesional
            </h2>
          </div>
          <div className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="specialty" className={labelClass}>Especialidad <span className="text-red-500">*</span></label>
                <select
                  id="specialty"
                  name="specialty"
                  value={form.specialty}
                  onChange={handleChange}
                  required
                  disabled={!isEditing}
                  className={fieldClass(selectClass)}
                >
                  <option value="">Seleccionar</option>
                  {SPECIALTIES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="subspecialty" className={labelClass}>Subespecialidad <span className="text-gray-400">(opcional)</span></label>
                <input
                  id="subspecialty"
                  name="subspecialty"
                  type="text"
                  value={form.subspecialty}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={fieldClass(inputClass)}
                />
              </div>
            </div>
            {form.specialty === 'Otra' && (
              <div>
                <label htmlFor="specialty_other" className={labelClass}>Especifique la especialidad <span className="text-red-500">*</span></label>
                <input
                  id="specialty_other"
                  name="specialty_other"
                  type="text"
                  value={form.specialty_other}
                  onChange={handleChange}
                  required={form.specialty === 'Otra'}
                  disabled={!isEditing}
                  className={fieldClass(inputClass)}
                  placeholder="Ej: Otra especialidad"
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="sm:col-span-2">
              <label htmlFor="professional_reg_number" className={labelClass}>Número de registro profesional</label>
              <input
                id="professional_reg_number"
                name="professional_reg_number"
                type="text"
                value={form.professional_reg_number}
                onChange={handleChange}
                disabled={!isEditing}
                className={fieldClass(inputClass)}
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="institution" className={labelClass}>Institución donde labora <span className="text-gray-400">(opcional)</span></label>
              <input
                id="institution"
                name="institution"
                type="text"
                value={form.institution}
                onChange={handleChange}
                disabled={!isEditing}
                className={fieldClass(inputClass)}
              />
            </div>
            <div>
              <label htmlFor="country" className={labelClass}>País <span className="text-red-500">*</span></label>
              <select
                id="country"
                name="country"
                value={form.country}
                onChange={handleChange}
                required
                disabled={!isEditing}
                className={fieldClass(selectClass)}
              >
                <option value="">Seleccionar</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              {form.country === 'Ecuador' ? (
                <>
                  <label htmlFor="province" className={labelClass}>Provincia <span className="text-red-500">*</span></label>
                  <select
                    id="province"
                    name="province"
                    value={form.province}
                    onChange={handleChange}
                    required={form.country === 'Ecuador'}
                    disabled={!isEditing}
                    className={fieldClass(selectClass)}
                  >
                    <option value="">Seleccionar</option>
                    {PROVINCIAS_ECUADOR.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <label htmlFor="province" className={labelClass}>Provincia/Estado <span className="text-red-500">*</span></label>
                  <input
                    id="province"
                    name="province"
                    type="text"
                    value={form.province}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={fieldClass(inputClass)}
                    placeholder="Provincia o estado"
                  />
                </>
              )}
            </div>
            <div>
              {form.country === 'Ecuador' && form.province ? (
                <>
                  <label htmlFor="city" className={labelClass}>Ciudad <span className="text-red-500">*</span></label>
                  <select
                    id="city"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    required={form.country === 'Ecuador'}
                    disabled={!isEditing}
                    className={fieldClass(selectClass)}
                  >
                    <option value="">Seleccionar</option>
                    {(ciudadesEcuador[form.province] ?? []).map((ciudad) => (
                      <option key={ciudad} value={ciudad}>{ciudad}</option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <label htmlFor="city" className={labelClass}>Ciudad <span className="text-red-500">*</span></label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    value={form.city}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={fieldClass(inputClass)}
                    placeholder="Ciudad"
                  />
                </>
              )}
            </div>
          </div>
          </div>
        </div>

        {/* SECCIÓN 3: Información para recetas */}
        <div className="bg-gradient-to-br from-white/80 via-slate-50/90 to-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-xl shadow-slate-300/50 overflow-hidden">
          <div className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-teal-500 px-6 py-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 text-white text-sm" aria-hidden>📋</span>
              Información para recetas
            </h2>
          </div>
          <div className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="phone" className={labelClass}>Teléfono profesional</label>
              <input
                id="phone"
                name="phone"
                type="text"
                value={form.phone}
                onChange={handleChange}
                disabled={!isEditing}
                className={fieldClass(inputClass)}
              />
            </div>
            <div>
              <label htmlFor="address" className={labelClass}>Dirección del consultorio</label>
              <input
                id="address"
                name="address"
                type="text"
                value={form.address}
                onChange={handleChange}
                disabled={!isEditing}
                className={fieldClass(inputClass)}
              />
            </div>
            <div>
              <label htmlFor="signature" className={labelClass}>Subir firma (imagen)</label>
              <input
                id="signature"
                type="file"
                accept="image/*"
                disabled={!isEditing}
                onChange={(e) => setSignatureFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border file:border-slate-200 file:bg-fuchsia-50 file:text-fuchsia-700 file:font-medium disabled:opacity-50"
              />
            </div>
            <div>
              <label htmlFor="stamp" className={labelClass}>Subir sello profesional (imagen)</label>
              <input
                id="stamp"
                type="file"
                accept="image/*"
                disabled={!isEditing}
                onChange={(e) => setStampFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border file:border-slate-200 file:bg-fuchsia-50 file:text-fuchsia-700 file:font-medium disabled:opacity-50"
              />
            </div>
          </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={submitting || !isEditing}
            className="px-5 py-2.5 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-teal-500 text-white text-sm font-semibold rounded-xl hover:from-fuchsia-600 hover:via-purple-600 hover:to-teal-600 shadow-md shadow-fuchsia-500/25 disabled:opacity-50 disabled:shadow-none transition-all"
          >
            {submitting ? 'Guardando...' : 'Guardar perfil profesional'}
          </button>
          <Link
            href={`/admin/doctors/${id}`}
            className="px-5 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 border-2 border-gray-200 shadow-sm transition-all"
          >
            Volver
          </Link>
        </div>
      </form>

      <div className="mt-10 bg-gradient-to-br from-white/80 via-slate-50/90 to-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-xl shadow-slate-300/50 overflow-hidden">
        <div className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-teal-500 px-6 py-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 text-white text-sm" aria-hidden>⚙️</span>
            Gestión de cuenta
          </h2>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Seguridad</h3>
            <div className="relative mb-3">
              <input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Nueva contraseña temporal (mínimo 12 caracteres)"
              className="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 pr-12 focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={12}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-fuchsia-500 transition-colors"
                aria-label={showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showNewPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="px-4 py-2.5 bg-gradient-to-r from-fuchsia-500 to-teal-500 text-white text-sm font-semibold rounded-xl shadow hover:shadow-md transition-all"
              >
                Generar contraseña segura
              </button>
              <button
                type="button"
                onClick={handleCopyPassword}
                disabled={!newPassword}
                className="px-4 py-2.5 bg-white text-slate-600 text-sm font-medium rounded-xl border-2 border-slate-200 hover:border-slate-300 disabled:opacity-50"
              >
                {copied ? 'Copiada ✅' : 'Copiar al portapapeles'}
              </button>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={newPassword.length < 12}
                className="px-4 py-2.5 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-teal-500 text-white text-sm font-semibold rounded-xl hover:from-fuchsia-600 hover:via-purple-600 hover:to-teal-600 transition-colors disabled:opacity-50"
              >
                Resetear contraseña
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Esta contraseña es temporal. El médico deberá cambiarla al ingresar.
            </p>
            <button
              type="button"
              onClick={handleForcePasswordChange}
              className="mt-3 px-4 py-2.5 bg-amber-100 text-amber-800 text-sm font-medium rounded-xl hover:bg-amber-200 border border-amber-200 transition-colors"
            >
              Forzar cambio de contraseña
            </button>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Estado de la cuenta</h3>
            <button
              type="button"
              onClick={handleToggleAccountStatus}
              className={`px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-colors ${
                doctorStatus === 'active' ? 'bg-red-500 hover:bg-red-600' : 'bg-teal-500 hover:bg-teal-600'
              }`}
            >
              {doctorStatus === 'active' ? 'Suspender cuenta' : 'Reactivar cuenta'}
            </button>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-semibold text-red-600 mb-2">Zona delicada</h3>
            <button
              type="button"
              onClick={handleDeleteProfile}
              className="px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-colors"
            >
              Eliminar perfil profesional
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
