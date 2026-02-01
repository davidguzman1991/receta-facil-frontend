import React from 'react'

type AdminPageProps = {
  children: React.ReactNode
  maxWidth?: 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl'
}

const maxWidthMap = {
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
}

export function AdminPage({ children, maxWidth = '6xl' }: AdminPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-gray-50 to-slate-200 px-4 py-8 sm:py-10">
      <div className={`w-full ${maxWidthMap[maxWidth]} mx-auto`}>{children}</div>
    </div>
  )
}

type AdminCardProps = {
  children: React.ReactNode
  className?: string
}

export function AdminCard({ children, className = '' }: AdminCardProps) {
  return (
    <div
      className={`relative bg-gradient-to-br from-white/80 via-slate-50/90 to-white/80 backdrop-blur-xl border border-white/60 rounded-2xl shadow-xl shadow-slate-300/50 overflow-hidden ${className}`}
    >
      {children}
    </div>
  )
}

type AdminCardHeaderProps = {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  className?: string
}

export function AdminCardHeader({ title, subtitle, icon, className = '' }: AdminCardHeaderProps) {
  return (
    <div className={`bg-gradient-to-r from-fuchsia-500 via-purple-500 to-teal-500 px-6 py-5 sm:py-6 ${className}`}>
      <div className="flex items-center gap-4">
        {icon && (
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-white/80 text-sm sm:text-base mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  )
}

type AdminSectionProps = {
  title: string
  description?: string
  children: React.ReactNode
  icon?: React.ReactNode
}

export function AdminSection({ title, description, children, icon }: AdminSectionProps) {
  return (
    <AdminCard className="mb-6">
      <div className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-teal-500 px-6 py-4">
        <div className="flex items-center gap-3 text-white">
          {icon && <span className="text-xl">{icon}</span>}
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && <p className="text-sm text-white/80">{description}</p>}
          </div>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </AdminCard>
  )
}

export const adminInputClass =
  'w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all bg-white'

export const adminSelectClass =
  'w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 transition-all bg-white'

export const adminLabelClass = 'block text-sm font-semibold text-slate-700 mb-2'

export const adminPrimaryButtonClass =
  'inline-flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-fuchsia-500 via-purple-500 to-teal-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-fuchsia-500/30 hover:shadow-xl hover:shadow-fuchsia-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed'

export const adminSecondaryButtonClass =
  'inline-flex items-center justify-center px-5 py-2.5 text-slate-600 font-medium rounded-xl border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-all'

export const adminMutedCardClass =
  'bg-slate-50/80 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-600'

export const adminBadgeClass =
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium'
