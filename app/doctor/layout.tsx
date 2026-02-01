'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { API_BASE_URL } from '@/lib/api'
import { authFetch } from '@/lib/authFetch'

export default function DoctorPortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  const clearSessionAndRedirect = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('role')
    }
    router.replace('/login')
  }

  useEffect(() => {
    let cancelled = false
    authFetch(`${API_BASE_URL}/auth/me`)
      .then((res) => {
        if (cancelled) return
        if (res.status === 401) {
          clearSessionAndRedirect()
          return
        }
        if (!res.ok) {
          router.replace('/login')
          return
        }
        return res.json()
      })
      .then((data) => {
        if (cancelled || !data) return
        if (typeof window !== 'undefined') localStorage.setItem('role', data.role ?? '')
        if (data.role !== 'doctor') {
          clearSessionAndRedirect()
          return
        }
        if (data.must_change_password) {
          router.replace('/change-password')
          return
        }
        setReady(true)
      })
      .catch(() => {
        if (!cancelled) clearSessionAndRedirect()
      })
    return () => { cancelled = true }
  }, [router])

  const handleLogout = async () => {
    try {
      await authFetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' })
    } catch {
      /* ignore */
    }
    clearSessionAndRedirect()
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-teal-700 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex flex-col safe-bottom">
      <nav className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm safe-top">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 max-w-5xl mx-auto">
          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
            <Link
              href="/doctor"
              className="touch-target-inline inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 active:bg-teal-200 transition-colors"
            >
              <span>🏠</span>
              Panel
            </Link>
            <Link
              href="/doctor/profile"
              className="touch-target-inline inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-teal-50 hover:text-teal-700 active:bg-teal-100 transition-colors"
            >
              <span>👤</span>
              Perfil
            </Link>
            <Link
              href="/doctor/patients"
              className="touch-target-inline inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-teal-50 hover:text-teal-700 active:bg-teal-100 transition-colors"
            >
              <span>👥</span>
              Pacientes
            </Link>
            <Link
              href="/doctor/consultations/new"
              className="touch-target-inline inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-teal-50 hover:text-teal-700 active:bg-teal-100 transition-colors"
            >
              <span>📋</span>
              Consulta
            </Link>
            <Link
              href="/doctor/subscription"
              className="touch-target-inline inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-teal-50 hover:text-teal-700 active:bg-teal-100 transition-colors"
            >
              <span>💎</span>
              Suscripción
            </Link>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="touch-target-inline self-start sm:ml-auto inline-flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 active:bg-red-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Salir
          </button>
        </div>
      </nav>
      <main className="flex-1 w-full">{children}</main>
    </div>
  )
}
