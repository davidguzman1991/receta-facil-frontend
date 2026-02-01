'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { API_BASE_URL } from '@/lib/api'
import { authFetch } from '@/lib/authFetch'

export default function PatientPortalLayout({
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
        if (data.role !== 'patient') {
          clearSessionAndRedirect()
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col safe-bottom">
      <nav className="sticky top-0 z-10 bg-white border-b border-gray-200 safe-top">
        <div className="flex flex-row items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/patient"
            className="touch-target-inline inline-flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 active:bg-blue-100 transition-colors"
          >
            Portal del Paciente
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="touch-target-inline inline-flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:bg-gray-200 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </nav>
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-4 sm:px-6 sm:py-6">{children}</main>
    </div>
  )
}
