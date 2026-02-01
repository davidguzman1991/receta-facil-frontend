'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { API_BASE_URL } from '@/lib/api'
import { authFetch } from '@/lib/authFetch'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await authFetch(`${API_BASE_URL}/auth/logout`, { method: 'POST' })
    } catch {
      /* ignore */
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('role')
    }
    router.replace('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-4">
            <Link href="/dashboard" className="text-blue-600 hover:underline">
              Panel
            </Link>
            <Link href="/dashboard/perfil-profesional" className="text-blue-600 hover:underline">
              Perfil profesional
            </Link>
            <Link href="/doctor/consultations/new" className="text-blue-600 hover:underline">
              Nueva consulta
            </Link>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 hover:underline"
          >
            Cerrar sesión
          </button>
        </div>
      </nav>
      <main className="p-4 md:p-6">{children}</main>
    </div>
  )
}
