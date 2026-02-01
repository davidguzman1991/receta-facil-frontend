'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState, FormEvent } from 'react'

import { API_BASE_URL } from '@/lib/api'
import { authFetch } from '@/lib/authFetch'
import {
  SPECIALTIES,
  COUNTRIES,
  PROVINCIAS_ECUADOR,
  ciudadesEcuador,
} from '@/lib/doctorProfileConstants'

interface DoctorProfileData {
  id: string
  user_id: string
  full_name?: string | null
  specialty?: string | null
  senescyt_reg?: string | null
  medical_license?: string | null
  phone?: string | null
  address?: string | null
  pais?: string | null
  provincia?: string | null
  ciudad?: string | null
  signature_url?: string | null
  stamp_url?: string | null
  nombres?: string | null
  apellidos?: string | null
  fecha_nacimiento?: string | null
  sexo?: string | null
  email?: string | null
}

const inputClass =
  'w-full border-2 border-teal-100 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 bg-white shadow-sm transition-all duration-200 text-base'
const selectClass =
  'w-full border-2 border-teal-100 rounded-xl px-4 py-3 text-gray-900 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 bg-white shadow-sm transition-all duration-200 text-base'
const labelClass = 'block text-sm font-semibold text-slate-700 mb-2'

export default function DoctorProfilePage() {
  const [profile, setProfile] = useState<DoctorProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordSubmitting, setPasswordSubmitting] = useState(false)

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
    country: '',
    province: '',
    city: '',
    phone: '',
    address: '',
  })

  const fetchProfile = useCallback(async () => {
    try {
      const [profileRes, meRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/doctor-profile/me`),
        authFetch(`${API_BASE_URL}/auth/me`),
      ])
      if (meRes.ok) {
        const meData: { email?: string } = await meRes.json()
        if (meData?.email != null) setEmail(meData.email)
      }
      if (profileRes.ok) {
        const data: DoctorProfileData = await profileRes.json()
        setProfile(data)
        const first = data.nombres ?? ''
        const last = data.apellidos ?? ''
        setForm((f) => ({ ...f, first_name: first, last_name: last }))
        const fecha = data.fecha_nacimiento
        const dateStr = fecha == null ? '' : typeof fecha === 'string' ? fecha.slice(0, 10) : String(fecha).slice(0, 10)
        setForm((f) => ({ ...f, date_of_birth: dateStr }))
        setForm((f) => ({ ...f, gender: data.sexo ?? '' }))
        const spec = data.specialty ?? ''
        const inList = SPECIALTIES.includes(spec as (typeof SPECIALTIES)[number])
        setForm((f) => ({
          ...f,
          specialty: inList ? spec : (spec ? 'Otra' : ''),
          specialty_other: inList ? '' : spec,
        }))
        setForm((f) => ({ ...f, professional_reg_number: data.senescyt_reg ?? data.medical_license ?? '' }))
        setForm((f) => ({ ...f, country: data.pais ?? '', province: data.provincia ?? '', city: data.ciudad ?? '' }))
        setForm((f) => ({ ...f, phone: data.phone ?? '', address: data.address ?? '' }))
      } else {
        setProfile(null)
      }
    } catch {
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

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
    if (name === 'specialty') {
      setForm((prev) => ({ ...prev, specialty: value, specialty_other: value === 'Otra' ? prev.specialty_other : '' }))
      return
    }
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault()
    const resolvedSpecialty = form.specialty === 'Otra' ? form.specialty_other.trim() : form.specialty
    if (!resolvedSpecialty) {
      setMessage({ type: 'error', text: 'La especialidad es obligatoria.' })
      return
    }
    if (form.specialty === 'Otra' && !form.specialty_other.trim()) {
      setMessage({ type: 'error', text: 'Especifique la especialidad cuando selecciona "Otra".' })
      return
    }
    if (!form.country?.trim()) {
      setMessage({ type: 'error', text: 'El país es obligatorio.' })
      return
    }
    if (form.country === 'Ecuador') {
      if (!form.province?.trim()) {
        setMessage({ type: 'error', text: 'La provincia es obligatoria cuando el país es Ecuador.' })
        return
      }
      if (!form.city?.trim()) {
        setMessage({ type: 'error', text: 'La ciudad es obligatoria cuando el país es Ecuador.' })
        return
      }
    } else {
      if (!form.province?.trim()) {
        setMessage({ type: 'error', text: 'Indique provincia o estado.' })
        return
      }
      if (!form.city?.trim()) {
        setMessage({ type: 'error', text: 'La ciudad es obligatoria.' })
        return
      }
    }
    setMessage(null)
    setSaving(true)
    try {
      const fullName = [form.first_name, form.last_name].filter(Boolean).join(' ') || null
      const res = await authFetch(`${API_BASE_URL}/doctor-profile/me`, {
        method: 'PUT',
        body: JSON.stringify({
          full_name: fullName,
          nombres: form.first_name.trim() || null,
          apellidos: form.last_name.trim() || null,
          fecha_nacimiento: form.date_of_birth?.trim() || null,
          sexo: form.gender.trim() || null,
          specialty: resolvedSpecialty || null,
          senescyt_reg: form.professional_reg_number.trim() || null,
          phone: form.phone.trim() || null,
          address: form.address.trim() || null,
          pais: form.country.trim() || null,
          provincia: form.province.trim() || null,
          ciudad: form.city.trim() || null,
        }),
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Perfil profesional actualizado correctamente' })
        const data: DoctorProfileData = await res.json()
        setProfile(data)
      } else {
        const err = await res.json().catch(() => ({}))
        setMessage({ type: 'error', text: (err.detail as string) || 'Error al guardar' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión' })
    } finally {
      setSaving(false)
    }
  }

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
      setMessage({ type: 'error', text: 'Formato inválido. Use PNG o JPEG.' })
      return
    }
    setMessage(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await authFetch(`${API_BASE_URL}/doctor-profile/upload-signature`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: data.message || 'Firma subida correctamente' })
        fetchProfile()
      } else {
        setMessage({ type: 'error', text: (data.detail as string) || 'Error al subir la firma' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión al subir la firma' })
    }
    e.target.value = ''
  }

  const handleStampUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.match(/^image\/(png|jpeg|jpg)$/)) {
      setMessage({ type: 'error', text: 'Formato inválido. Use PNG o JPEG.' })
      return
    }
    setMessage(null)
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await authFetch(`${API_BASE_URL}/doctor-profile/upload-stamp`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (res.ok) {
        setMessage({ type: 'success', text: data.message || 'Sello subido correctamente' })
        fetchProfile()
      } else {
        setMessage({ type: 'error', text: (data.detail as string) || 'Error al subir el sello' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión al subir el sello' })
    }
    e.target.value = ''
  }

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    setPasswordMessage(null)
    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'La contraseña debe tener al menos 8 caracteres.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Las contraseñas no coinciden.' })
      return
    }
    setPasswordSubmitting(true)
    try {
      const res = await authFetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        body: JSON.stringify({
          current_password: currentPassword || undefined,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      })
      if (res.ok) {
        setPasswordMessage({ type: 'success', text: 'Contraseña actualizada correctamente.' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const err = await res.json().catch(() => ({}))
        setPasswordMessage({ type: 'error', text: (err.detail as string) || 'Error al actualizar contraseña.' })
      }
    } catch {
      setPasswordMessage({ type: 'error', text: 'Error de conexión al actualizar la contraseña.' })
    } finally {
      setPasswordSubmitting(false)
    }
  }

  const signatureSrc = profile?.signature_url
    ? profile.signature_url.startsWith('http')
      ? profile.signature_url
      : `${API_BASE_URL}/${profile.signature_url}`
    : null
  const stampSrc = profile?.stamp_url
    ? profile.stamp_url.startsWith('http')
      ? profile.stamp_url
      : `${API_BASE_URL}/${profile.stamp_url}`
    : null

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 px-4 py-6 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3 py-16">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-teal-700 font-medium">Cargando perfil...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 px-4 py-6 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Link de volver */}
        <Link
          href="/doctor"
          className="inline-flex items-center gap-2 text-teal-700 hover:text-teal-800 active:text-teal-900 text-sm font-medium mb-6 transition-colors min-h-[44px]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al panel
        </Link>

        {/* Header - Card integrada */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 px-5 py-5 sm:px-6 sm:py-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <span className="text-2xl">🩺</span>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-white/90 bg-white/15 px-3 py-1 rounded-full">
                Perfil médico
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Perfil profesional
            </h1>
            <p className="text-white/80 text-sm mt-1">
              Configure su información para recetas y documentos
            </p>
          </div>
        </div>

        {/* Mensaje de estado */}
        {message && (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
            <div
              className={`p-4 text-sm font-medium flex items-center gap-3 ${
                message.type === 'success'
                  ? 'bg-teal-50 text-teal-800'
                  : 'bg-red-50 text-red-800'
              }`}
            >
              <span className="text-xl">{message.type === 'success' ? '✅' : '⚠️'}</span>
              {message.text}
            </div>
          </div>
        )}

        <form onSubmit={handleSaveProfile} className="space-y-6">
          {/* SECCIÓN 1: Datos personales */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 px-5 py-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-3">
                <span className="text-xl">👤</span>
                Datos personales
              </h2>
            </div>
            <div className="p-5 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="sm:col-span-2">
                  <label htmlFor="email" className={labelClass}>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Correo electrónico
                    </span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    readOnly
                    className={`${inputClass} bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200`}
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
                    placeholder="Ingrese sus nombres"
                    className={inputClass}
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
                    placeholder="Ingrese sus apellidos"
                    className={inputClass}
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
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="gender" className={labelClass}>Sexo</label>
                  <select
                    id="gender"
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className={selectClass}
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
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 px-5 py-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-3">
                <span className="text-xl">💼</span>
                Información profesional
              </h2>
            </div>
            <div className="p-5 sm:p-6">
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="specialty" className={labelClass}>
                      Especialidad <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="specialty"
                      name="specialty"
                      value={form.specialty}
                      onChange={handleChange}
                      className={selectClass}
                    >
                      <option value="">Seleccionar especialidad</option>
                      {SPECIALTIES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="subspecialty" className={labelClass}>
                      Subespecialidad <span className="text-slate-400 font-normal">(opcional)</span>
                    </label>
                    <input
                      id="subspecialty"
                      name="subspecialty"
                      type="text"
                      value={form.subspecialty}
                      onChange={handleChange}
                      placeholder="Ej: Cardiología intervencionista"
                      className={inputClass}
                    />
                  </div>
                </div>
                {form.specialty === 'Otra' && (
                  <div>
                    <label htmlFor="specialty_other" className={labelClass}>
                      Especifique la especialidad <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="specialty_other"
                      name="specialty_other"
                      type="text"
                      value={form.specialty_other}
                      onChange={handleChange}
                      className={inputClass}
                      placeholder="Ej: Medicina regenerativa"
                    />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-5">
                <div className="sm:col-span-2">
                  <label htmlFor="professional_reg_number" className={labelClass}>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      Número de registro profesional
                    </span>
                  </label>
                  <input
                    id="professional_reg_number"
                    name="professional_reg_number"
                    type="text"
                    value={form.professional_reg_number}
                    onChange={handleChange}
                    placeholder="Ej: SENESCYT-1234567890"
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="institution" className={labelClass}>
                    Institución donde labora <span className="text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    id="institution"
                    name="institution"
                    type="text"
                    value={form.institution}
                    onChange={handleChange}
                    placeholder="Ej: Hospital General, Clínica Privada"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="country" className={labelClass}>
                    País <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="country"
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    className={selectClass}
                  >
                    <option value="">Seleccionar país</option>
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  {form.country === 'Ecuador' ? (
                    <>
                      <label htmlFor="province" className={labelClass}>
                        Provincia <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="province"
                        name="province"
                        value={form.province}
                        onChange={handleChange}
                        className={selectClass}
                      >
                        <option value="">Seleccionar provincia</option>
                        {PROVINCIAS_ECUADOR.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <>
                      <label htmlFor="province" className={labelClass}>
                        Provincia/Estado <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="province"
                        name="province"
                        type="text"
                        value={form.province}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="Ingrese provincia o estado"
                      />
                    </>
                  )}
                </div>
                <div className="sm:col-span-2 sm:w-1/2">
                  {form.country === 'Ecuador' && form.province ? (
                    <>
                      <label htmlFor="city" className={labelClass}>
                        Ciudad <span className="text-red-500">*</span>
                      </label>
                      <select
                        id="city"
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        className={selectClass}
                      >
                        <option value="">Seleccionar ciudad</option>
                        {(ciudadesEcuador[form.province] ?? []).map((ciudad) => (
                          <option key={ciudad} value={ciudad}>{ciudad}</option>
                        ))}
                      </select>
                    </>
                  ) : (
                    <>
                      <label htmlFor="city" className={labelClass}>
                        Ciudad <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="city"
                        name="city"
                        type="text"
                        value={form.city}
                        onChange={handleChange}
                        className={inputClass}
                        placeholder="Ingrese ciudad"
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: Información para recetas */}
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 px-5 py-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-3">
                <span className="text-xl">📋</span>
                Información para recetas
              </h2>
            </div>
            <div className="p-5 sm:p-6">
              <div className="space-y-5">
                <div>
                  <label htmlFor="phone" className={labelClass}>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Teléfono profesional
                    </span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="text"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Ej: +593 99 123 4567"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="address" className={labelClass}>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Dirección del consultorio
                    </span>
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    value={form.address}
                    onChange={handleChange}
                    placeholder="Ej: Av. Principal 123, Edificio Médico, Of. 501"
                    className={inputClass}
                  />
                </div>
                
                {/* Upload de firma */}
                <div className="p-4 rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/30">
                  <label htmlFor="signature" className={`${labelClass} mb-3`}>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Subir firma (imagen)
                    </span>
                  </label>
                  <input
                    id="signature"
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    className="w-full text-sm text-slate-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-teal-500 file:text-white file:font-medium file:cursor-pointer file:shadow-md hover:file:bg-teal-600 file:transition-colors"
                  />
                  {signatureSrc && (
                    <div className="mt-4 p-4 bg-white rounded-xl border border-teal-100 shadow-sm">
                      <p className="text-xs text-teal-600 font-medium mb-2 flex items-center gap-1">
                        <span>✓</span> Vista previa de firma
                      </p>
                      <img src={signatureSrc} alt="Firma" className="max-h-24 object-contain" />
                    </div>
                  )}
                </div>
                
                {/* Upload de sello */}
                <div className="p-4 rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/30">
                  <label htmlFor="stamp" className={`${labelClass} mb-3`}>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Subir sello profesional (imagen)
                    </span>
                  </label>
                  <input
                    id="stamp"
                    type="file"
                    accept="image/*"
                    onChange={handleStampUpload}
                    className="w-full text-sm text-slate-600 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:bg-teal-500 file:text-white file:font-medium file:cursor-pointer file:shadow-md hover:file:bg-teal-600 file:transition-colors"
                  />
                  {stampSrc && (
                    <div className="mt-4 p-4 bg-white rounded-xl border border-teal-100 shadow-sm">
                      <p className="text-xs text-teal-600 font-medium mb-2 flex items-center gap-1">
                        <span>✓</span> Vista previa de sello
                      </p>
                      <img src={stampSrc} alt="Sello" className="max-h-24 object-contain" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3.5 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl active:shadow-md disabled:opacity-50 disabled:shadow-none transition-all min-h-[48px]"
              style={{ 
                background: 'linear-gradient(135deg, #2FB7A3 0%, #6ED3C2 45%, #1CA39A 100%)',
                boxShadow: '0 4px 16px rgba(47, 183, 163, 0.35)'
              }}
            >
              {saving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Guardar perfil profesional
                </>
              )}
            </button>
            <Link
              href="/doctor"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white text-slate-700 font-medium rounded-xl hover:bg-slate-50 active:bg-slate-100 border-2 border-slate-200 shadow-sm transition-all min-h-[48px]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancelar
            </Link>
          </div>
        </form>

        <div className="mt-8 bg-white rounded-2xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-fuchsia-500 via-pink-500 to-teal-500 px-5 py-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-3">
              <span className="text-xl">🔒</span>
              Cambiar contraseña
            </h2>
          </div>
          <div className="p-5 sm:p-6">
            {passwordMessage && (
              <div
                className={`mb-4 rounded-xl px-4 py-3 text-sm font-medium ${
                  passwordMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'bg-rose-50 text-rose-800'
                }`}
              >
                {passwordMessage.text}
              </div>
            )}
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className={labelClass} htmlFor="currentPassword">
                  Contraseña actual
                </label>
                <div className="relative">
                  <input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={inputClass}
                    placeholder="Ingresa tu contraseña actual"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-fuchsia-500"
                    aria-label={showCurrentPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showCurrentPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div>
                <label className={labelClass} htmlFor="newPassword">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={inputClass}
                    placeholder="Mínimo 8 caracteres"
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-fuchsia-500"
                    aria-label={showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showNewPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div>
                <label className={labelClass} htmlFor="confirmPassword">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputClass}
                    placeholder="Repite tu nueva contraseña"
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-fuchsia-500"
                    aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={passwordSubmitting}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-fuchsia-500 to-teal-500 text-white font-semibold rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition-all"
              >
                {passwordSubmitting ? 'Actualizando...' : 'Actualizar contraseña'}
              </button>
            </form>
          </div>
        </div>
        
        {/* Espaciado inferior para navegación móvil */}
        <div className="h-6"></div>
      </div>
    </div>
  )
}
