'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PortalRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/patient')
  }, [router])
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Redirigiendo al portal del paciente...</p>
    </div>
  )
}
