'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

import { API_BASE_URL } from '@/lib/api'
import { authFetch } from '@/lib/authFetch'

interface PatientItem {
  id: string
  first_name: string
  last_name: string
  dni: string | null
  phone: string | null
  email: string | null
}

const SEARCH_DEBOUNCE_MS = 300

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<PatientItem[]>([])
  const [search, setSearch] = useState('')
  const [displayList, setDisplayList] = useState<PatientItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    try {
      const res = await authFetch(`${API_BASE_URL}/doctor/patients`)
      if (res.ok) {
        const data = await res.json()
        setPatients(data)
        setDisplayList(data)
      } else {
        setPatients([])
        setDisplayList([])
      }
    } catch {
      setPatients([])
      setDisplayList([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const searchApi = useCallback(async (q: string) => {
    if (!q.trim()) {
      setDisplayList(patients)
      return
    }
    try {
      const res = await authFetch(
        `${API_BASE_URL}/doctor/patients/search?q=${encodeURIComponent(q.trim())}&limit=50`
      )
      if (res.ok) {
        const data = await res.json()
        setDisplayList(data)
      } else {
        setDisplayList([])
      }
    } catch {
      setDisplayList([])
    }
  }, [patients])

  useEffect(() => {
    const t = setTimeout(() => {
      if (search.trim()) searchApi(search)
      else setDisplayList(patients)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [search, patients, searchApi])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 px-4 py-6 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-center gap-3 py-16">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-teal-700 font-medium">Cargando pacientes...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 px-4 py-6 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header - Card integrada */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 px-5 py-5 sm:px-6 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Mis Pacientes
                </h1>
                <p className="text-white/80 text-sm mt-1">
                  {patients.length} {patients.length === 1 ? 'paciente registrado' : 'pacientes registrados'}
                </p>
              </div>
              <Link
                href="/doctor/patients/new"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-teal-700 font-semibold rounded-xl hover:bg-teal-50 active:bg-teal-100 transition-colors min-h-[48px]"
              >
                <span className="text-lg">➕</span>
                <span>Nuevo paciente</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Buscador */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
          <div className="p-4">
            <label htmlFor="patient-search" className="sr-only">
              Buscar paciente
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                id="patient-search"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o apellido..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 focus:bg-white transition-all text-base"
              />
            </div>
          </div>
        </div>

        {/* Lista de pacientes */}
        <div className="space-y-4">
          {displayList.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md overflow-hidden">
              <div className="p-8 sm:p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center">
                  <span className="text-3xl">👥</span>
                </div>
                <p className="text-gray-600 font-medium">
                  {search.trim()
                    ? 'No hay resultados para la búsqueda.'
                    : 'Aún no tiene pacientes.'}
                </p>
                {!search.trim() && (
                  <p className="text-gray-400 text-sm mt-2">
                    Use "Nuevo paciente" para agregar uno.
                  </p>
                )}
              </div>
            </div>
          ) : (
            displayList.map((p) => (
              <div 
                key={p.id} 
                className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
              >
                <div className="p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    {/* Avatar con inicial */}
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                      {p.first_name.charAt(0).toUpperCase()}
                    </div>
                    
                    {/* Info del paciente */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-gray-900 font-semibold text-base sm:text-lg truncate">
                        {p.first_name} {p.last_name}
                      </h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                        {p.dni && (
                          <span className="text-gray-500 text-sm flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                            </svg>
                            {p.dni}
                          </span>
                        )}
                        {p.phone && (
                          <span className="text-gray-500 text-sm flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {p.phone}
                          </span>
                        )}
                        {!p.dni && !p.phone && (
                          <span className="text-gray-400 text-sm italic">Sin datos de contacto</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Acciones - Separadas visualmente */}
                <div className="flex gap-2 px-4 sm:px-5 pb-4 sm:pb-5 pt-2">
                  <Link
                    href={`/doctor/patients/${p.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-teal-700 bg-teal-50 font-medium rounded-xl hover:bg-teal-100 active:bg-teal-200 transition-colors min-h-[44px]"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Ver historial
                  </Link>
                  <Link
                    href={`/doctor/consultations/new?patient_id=${p.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-white font-medium rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 transition-colors min-h-[44px]"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nueva consulta
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Espaciado inferior */}
        <div className="h-8"></div>
      </div>
    </div>
  )
}
