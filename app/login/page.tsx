'use client'

import { useState, FormEvent } from 'react'

import { API_BASE_URL } from '@/lib/api'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !email.includes('@')) {
      setError('Ingresa un correo electrónico válido')
      return
    }

    if (!password) {
      setError('Ingresa tu contraseña')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const loginUrl = `${API_BASE_URL}/auth/login`
      console.log('Intentando login contra:', loginUrl)

      const res = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => null) as { detail?: unknown } | null

        if (errorData?.detail) {
          if (Array.isArray(errorData.detail)) {
            const first = errorData.detail[0] as { msg?: string }
            setError(first?.msg ?? 'Error al iniciar sesión')
          } else if (typeof errorData.detail === 'string') {
            setError(errorData.detail)
          } else {
            setError('Error al iniciar sesión')
          }
        } else {
          setError('Credenciales incorrectas')
        }
        return
      }

      const data = await res.json()
      console.log('LOGIN RESPONSE:', data)

      if (typeof window !== 'undefined') {
        const role = (data as { role?: string }).role ?? ''
        const accessToken = (data as { access_token?: string }).access_token
        localStorage.setItem('role', role)
        if (accessToken) localStorage.setItem('token', accessToken)
      }

      if ((data as { role?: string }).role === 'doctor') {
        const needsChange = (data as { must_change_password?: boolean }).must_change_password
        window.location.href = needsChange ? '/change-password' : '/doctor'
      } else if ((data as { role?: string }).role === 'admin') {
        window.location.href = '/admin'
      } else if ((data as { role?: string }).role === 'patient') {
        window.location.href = '/patient'
      } else {
        window.location.href = '/'
      }
    } catch (err) {
      console.error('Login fetch error:', err)
      setError('Error de conexión con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card principal con efecto metálico */}
        <div className="bg-gradient-to-br from-white via-emerald-50/50 to-white border border-white/60 rounded-2xl shadow-xl shadow-emerald-200/40 backdrop-blur-sm overflow-hidden">
          {/* Header con ícono médico */}
          <div className="pt-8 pb-4 px-6 text-center">
            {/* Ícono médico */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-300/50 mb-5">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-semibold text-slate-800 mb-1">
              Bienvenido
            </h1>
            <p className="text-sm text-slate-500">
              Ingresa a tu cuenta médica
            </p>
          </div>

          {/* Formulario */}
          <div className="px-6 pb-8">
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <svg className="w-5 h-5 shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Correo electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError(null)
                  }}
                  placeholder="doctor@ejemplo.com"
                  required
                  className="w-full border-2 border-emerald-100 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-white transition-all"
                  autoComplete="email"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setError(null)
                  }}
                  placeholder="••••••••"
                  required
                  className="w-full border-2 border-emerald-100 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 bg-white transition-all"
                  autoComplete="current-password"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[52px] py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-600 active:from-emerald-700 active:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-300/40 hover:shadow-xl hover:shadow-emerald-300/50 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Ingresando...</span>
                  </>
                ) : (
                  <>
                    <span>Ingresar</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Texto inferior */}
        <p className="text-center text-xs text-slate-400 mt-6">
          Sistema de gestión médica
        </p>
      </div>
    </div>
  )
}
