'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

type Step = 'validating' | 'invalid' | 'form' | 'success'

export default function ActivateAccountPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [step, setStep] = useState<Step>('validating')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const validateToken = useCallback(async () => {
    if (!token.trim()) {
      setStep('invalid')
      return
    }
    try {
      const res = await fetch(
        `${API_URL}/auth/activate-account?token=${encodeURIComponent(token)}`,
        { credentials: 'include' }
      )
      if (res.ok) {
        const data = await res.json()
        if (data.valid === true) {
          setStep('form')
          return
        }
      }
      setStep('invalid')
    } catch {
      setStep('invalid')
    }
  }, [token])

  useEffect(() => {
    validateToken()
  }, [validateToken])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`${API_URL}/auth/activate-account`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError((data.detail as string) || 'No se pudo activar la cuenta.')
        return
      }
      setStep('success')
    } catch {
      setError('Error de conexión. Intente de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 'validating') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6 text-center">
          <p className="text-gray-600">Validando enlace...</p>
        </div>
      </div>
    )
  }

  if (step === 'invalid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Enlace inválido o expirado</h1>
          <p className="text-gray-600 mb-4">
            El enlace de activación no es válido o ha caducado. Solicite una nueva invitación a su médico.
          </p>
          <Link
            href="/login"
            className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Ir a inicio de sesión
          </Link>
        </div>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Cuenta activada</h1>
          <p className="text-gray-600 mb-6">
            Su contraseña ha sido establecida correctamente. Ya puede iniciar sesión.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
          >
            Ir a login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Activar cuenta</h1>
        <p className="text-gray-600 mb-6">
          Elija una contraseña para acceder al portal del paciente (mínimo 6 caracteres).
        </p>

        {error && (
          <div className="mb-4 p-3 rounded bg-red-100 text-red-800 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Nueva contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar contraseña
            </label>
            <input
              id="confirm"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Activando...' : 'Activar cuenta'}
          </button>
        </form>
      </div>
    </div>
  )
}
