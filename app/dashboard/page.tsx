import Link from 'next/link'

export default function DashboardPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Panel médico</h1>
      <p className="text-gray-600 mb-6">
        Gestiona tu perfil profesional, firma y sello para las recetas.
      </p>
      <Link
        href="/dashboard/perfil-profesional"
        className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Ir a perfil profesional
      </Link>
    </div>
  )
}
