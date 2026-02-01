'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { API_BASE_URL } from '@/lib/api'
import { authFetch } from '@/lib/authFetch'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)

  const clearSessionAndRedirect = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('role')
    }
    router.replace('/login')
  }

  const handleLogout = async () => {
    try {
      await authFetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' })
    } catch {
      /* ignore */
    }
    clearSessionAndRedirect()
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
          clearSessionAndRedirect()
          return
        }
        return res.json()
      })
      .then((data) => {
        if (cancelled || !data) return
        if (typeof window !== 'undefined') localStorage.setItem('role', data.role ?? '')
        if (data.role !== 'admin') {
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

  if (!ready) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-50 to-slate-200 flex items-center justify-center">
        <div className="bg-gradient-to-br from-white/80 via-slate-50/90 to-white/80 backdrop-blur-xl border border-white/60 rounded-2xl px-6 py-4 shadow-xl shadow-slate-300/40">
          <p className="text-slate-600 font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-50 to-slate-200 flex flex-col safe-bottom">
      <nav className="sticky top-0 z-10 safe-top">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3">
          <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-xl shadow-slate-300/40 px-4 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1 sm:gap-4">
                <Link
                  href="/admin"
                  className={`touch-target-inline inline-flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    pathname === '/admin' ? 'bg-fuchsia-50 text-fuchsia-700' : 'text-slate-700 hover:bg-slate-100 active:bg-slate-200'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/admin/doctors"
                  className={`touch-target-inline inline-flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    pathname.startsWith('/admin/doctors') ? 'bg-fuchsia-50 text-fuchsia-700' : 'text-slate-700 hover:bg-slate-100 active:bg-slate-200'
                  }`}
                >
                  Médicos
                </Link>
                <Link
                  href="/admin/audit"
                  className={`touch-target-inline inline-flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    pathname === '/admin/audit' ? 'bg-fuchsia-50 text-fuchsia-700' : 'text-slate-700 hover:bg-slate-100 active:bg-slate-200'
                  }`}
                >
                  Auditoría
                </Link>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="touch-target-inline self-start sm:ml-auto inline-flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  )
}
