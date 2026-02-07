'use client'

import { useCallback, useEffect, useState, FormEvent } from 'react'

import { API_BASE_URL } from '@/lib/api'
import { authFetch } from '@/lib/authFetch'
import {
  SPECIALTIES,
  COUNTRIES,
  PROVINCIAS_ECUADOR,
  ciudadesEcuador,
} from '@/lib/doctorProfileConstants'

interface DoctorProfile {
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
}

export default function PerfilProfesionalPage() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [email, setEmail] = useState('')
  const [first_name, setFirst_name] = useState('')
  const [last_name, setLast_name] = useState('')
  const [date_of_birth, setDate_of_birth] = useState('')
  const [gender, setGender] = useState('')
  const [fullName, setFullName] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [specialtyOther, setSpecialtyOther] = useState('')
  const [licenseNumber, setLicenseNumber] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [country, setCountry] = useState('')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')

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
        const data: DoctorProfile = await profileRes.json()
        setProfile(data)
        setFirst_name(data.nombres ?? '')
        setLast_name(data.apellidos ?? '')
        const fecha = data.fecha_nacimiento
        const dateStr = fecha == null ? '' : typeof fecha === 'string' ? fecha.slice(0, 10) : String(fecha).slice(0, 10)
        setDate_of_birth(dateStr)
        setGender(data.sexo ?? '')
        setFullName(data.full_name ?? [data.nombres, data.apellidos].filter(Boolean).join(' ') ?? '')
        const spec = data.specialty ?? ''
        const inList = SPECIALTIES.includes(spec as (typeof SPECIALTIES)[number])
        setSpecialty(inList ? spec : (spec ? 'Otra' : ''))
        setSpecialtyOther(inList ? '' : spec)
        setLicenseNumber(data.senescyt_reg ?? data.medical_license ?? '')
        setPhone(data.phone ?? '')
        setAddress(data.address ?? '')
        setCountry(data.pais ?? '')
        setProvince(data.provincia ?? '')
        setCity(data.ciudad ?? '')
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
        setMessage({ type: 'error', text: data.detail || 'Error al subir la firma' })
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
        setMessage({ type: 'error', text: data.detail || 'Error al subir el sello' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Error de conexión al subir el sello' })
    }
    e.target.value = ''
  }

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault()
    const resolvedSpecialty = specialty === 'Otra' ? specialtyOther.trim() : specialty
    if (!resolvedSpecialty) {
      setMessage({ type: 'error', text: 'La especialidad es obligatoria.' })
      return
    }
    if (specialty === 'Otra' && !specialtyOther.trim()) {
      setMessage({ type: 'error', text: 'Especifique la especialidad cuando selecciona "Otra".' })
      return
    }
    setMessage(null)
    setSaving(true)
    const fullNameResolved = [first_name, last_name].filter(Boolean).join(' ') || null
    try {
      const res = await authFetch(`${API_BASE_URL}/doctor-profile/me`, {
        method: 'PUT',
        body: JSON.stringify({
          full_name: fullNameResolved,
          nombres: first_name.trim() || null,
          apellidos: last_name.trim() || null,
          fecha_nacimiento: date_of_birth.trim() || null,
          sexo: gender.trim() || null,
          specialty: resolvedSpecialty || null,
          senescyt_reg: licenseNumber.trim() || null,
          phone: phone.trim() || null,
          address: address.trim() || null,
          pais: country.trim() || null,
          provincia: province.trim() || null,
          ciudad: city.trim() || null,
        }),
      })
      if (res.ok) {
        setMessage({ type: 'success', text: 'Perfil guardado correctamente' })
        const data: DoctorProfile = await res.json()
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
      <div className="max-w-2xl mx-auto">
        <p className="text-gray-500">Cargando perfil...</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Perfil profesional</h1>

      {message && (
        <div
          className={`mb-6 p-4 rounded-xl text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-8">
        {/* Datos personales */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Datos personales</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                readOnly
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-700 bg-gray-100 cursor-not-allowed"
              />
            </div>
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1.5">
                Nombres
              </label>
              <input
                id="first_name"
                type="text"
                value={first_name}
                onChange={(e) => setFirst_name(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1.5">
                Apellidos
              </label>
              <input
                id="last_name"
                type="text"
                value={last_name}
                onChange={(e) => setLast_name(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700 mb-1.5">
                Fecha de nacimiento
              </label>
              <input
                id="date_of_birth"
                type="date"
                value={date_of_birth}
                onChange={(e) => setDate_of_birth(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1.5">
                Sexo
              </label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Seleccionar</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Información profesional</h2>
          <p className="text-sm text-gray-600 mb-4">
            Información que aparece en recetas y en el portal. Puedes editarla aquí.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-1.5">
                Especialidad <span className="text-red-500">*</span>
              </label>
              <select
                id="specialty"
                value={specialty}
                onChange={(e) => {
                  setSpecialty(e.target.value)
                  if (e.target.value !== 'Otra') setSpecialtyOther('')
                }}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Seleccionar</option>
                {SPECIALTIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            {specialty === 'Otra' && (
              <div>
                <label htmlFor="specialty_other" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Especifique la especialidad <span className="text-red-500">*</span>
                </label>
                <input
                  id="specialty_other"
                  type="text"
                  value={specialtyOther}
                  onChange={(e) => setSpecialtyOther(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ej: Otra especialidad"
                />
              </div>
            )}
            <div>
              <label htmlFor="license_number" className="block text-sm font-medium text-gray-700 mb-1.5">
                Nº registro
              </label>
              <input
                id="license_number"
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ej. SENESCYT"
              />
            </div>
            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1.5">
                País
              </label>
              <select
                id="country"
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value)
                  setProvince('')
                  setCity('')
                }}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="">Seleccionar</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              {country === 'Ecuador' ? (
                <>
                  <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Provincia
                  </label>
                  <select
                    id="province"
                    value={province}
                    onChange={(e) => {
                      setProvince(e.target.value)
                      setCity('')
                    }}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Seleccionar</option>
                    {PROVINCIAS_ECUADOR.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Provincia / Estado
                  </label>
                  <input
                    id="province"
                    type="text"
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Provincia o estado"
                  />
                </>
              )}
            </div>
            <div>
              {country === 'Ecuador' && province ? (
                <>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Cantón / Ciudad
                  </label>
                  <select
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="">Seleccionar</option>
                    {(ciudadesEcuador[province] ?? []).map((ciudad) => (
                      <option key={ciudad} value={ciudad}>{ciudad}</option>
                    ))}
                  </select>
                </>
              ) : (
                <>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Ciudad
                  </label>
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Quito"
                  />
                </>
              )}
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                Teléfono
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0991234567"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1.5">
                Dirección del establecimiento
              </label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Dirección del consultorio"
              />
            </div>
          </div>
          <div className="mt-6">
            <button
              type="submit"
              disabled={saving}
              className="min-h-[48px] px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Guardando...' : 'Guardar perfil'}
            </button>
          </div>
        </section>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-8">
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Firma digital</h2>
          <input
            type="file"
            accept="image/png, image/jpeg"
            onChange={handleSignatureUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-gray-200 file:bg-gray-50 file:text-gray-700"
          />
          {signatureSrc && (
            <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Vista previa</p>
              <img src={signatureSrc} alt="Firma" className="max-h-24 object-contain" />
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Sello profesional</h2>
          <input
            type="file"
            accept="image/png, image/jpeg"
            onChange={handleStampUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-gray-200 file:bg-gray-50 file:text-gray-700"
          />
          {stampSrc && (
            <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Vista previa</p>
              <img src={stampSrc} alt="Sello" className="max-h-24 object-contain" />
            </div>
          )}
        </section>
        </div>
      </form>
    </div>
  )
}
