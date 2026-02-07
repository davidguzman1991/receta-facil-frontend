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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-teal-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="rounded-3xl bg-white/75 backdrop-blur-xl border border-sky-100 shadow-[0_18px_60px_rgba(14,116,144,0.18)] overflow-hidden">
          <div className="px-6 pt-8 pb-5 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center shadow-lg shadow-teal-200/70 mb-5">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>

            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
              Receta Facil
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Inicia sesión para acceder a tu portal médico.
            </p>
          </div>

          {/* Formulario */}
          <div className="px-6 pb-8">
            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
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
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 placeholder-slate-400 bg-white/90 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 hover:border-slate-300"
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
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-900 placeholder-slate-400 bg-white/90 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 hover:border-slate-300"
                  autoComplete="current-password"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[52px] py-3.5 px-4 bg-gradient-to-r from-teal-500 to-blue-600 text-white font-semibold rounded-2xl hover:from-teal-600 hover:to-blue-700 active:from-teal-700 active:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-teal-200/60 hover:shadow-xl hover:shadow-teal-200/70 transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2"
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
        <p className="text-center text-xs text-slate-500 mt-6">
          Acceso seguro para personal médico
        </p>
      </div>
    </div>
  )
}
