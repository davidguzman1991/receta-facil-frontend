'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

import { API_BASE_URL } from '@/lib/api'
import { authFetch } from '@/lib/authFetch'

export default function ChangePassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const router = useRouter()

  const passwordsMatch = password.length > 0 && password === confirmPassword

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    setSubmitting(true)
    try {
      const res = await authFetch(`${API_BASE_URL}/auth/change-password`, {
        method: 'POST',
        body: JSON.stringify({ new_password: password, confirm_password: confirmPassword }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.detail || 'No se pudo actualizar la contraseña')
        return
      }
      router.push('/doctor')
    } catch {
      setError('No se pudo actualizar la contraseña')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#ffe2f5_0%,_#e9fffd_45%,_#f2f6ff_100%)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="relative rounded-3xl border border-white/70 bg-white/80 backdrop-blur-xl shadow-[0_20px_60px_rgba(244,114,182,0.25)] overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-fuchsia-400/30 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-teal-300/30 blur-3xl" />

          <div className="relative p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-fuchsia-400/30">
                🔐
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Cambia tu contraseña</h1>
                <p className="text-sm text-slate-600">
                  Por seguridad, debes establecer tu contraseña personal para continuar.
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border-2 border-fuchsia-100 rounded-2xl px-4 py-3 pr-12 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-fuchsia-400 focus:border-fuchsia-400 bg-white/90 transition-all"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-fuchsia-500"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-2">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repite la contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full border-2 rounded-2xl px-4 py-3 pr-12 text-slate-900 placeholder-slate-400 focus:ring-2 transition-all ${
                      confirmPassword.length === 0
                        ? 'border-teal-100 focus:ring-teal-400 focus:border-teal-400'
                        : passwordsMatch
                        ? 'border-emerald-300 focus:ring-emerald-400 focus:border-emerald-400'
                        : 'border-rose-300 focus:ring-rose-400 focus:border-rose-400'
                    }`}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-teal-500"
                    aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <p className={`mt-2 text-xs ${passwordsMatch ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {passwordsMatch ? 'Contraseñas coinciden' : 'Contraseñas no coinciden'}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-fuchsia-500 via-pink-500 to-teal-400 text-white font-semibold rounded-2xl hover:from-fuchsia-600 hover:via-pink-600 hover:to-teal-500 disabled:opacity-50 shadow-lg shadow-fuchsia-300/40 transition-all"
              >
                {submitting ? 'Guardando...' : 'Guardar nueva contraseña'}
              </button>
            </form>

            <p className="mt-5 text-xs text-slate-500">
              Esta contraseña es personal. No la compartas y guárdala en un lugar seguro.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
