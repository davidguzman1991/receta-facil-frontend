'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { API_BASE_URL } from '@/lib/api'
import { authFetch } from '@/lib/authFetch'

export type ICD10Suggestion = {
  code: string
  description: string
}

export type ICD10AutocompleteOnChange = (value: string, selected?: ICD10Suggestion | null) => void

type Props = {
  id?: string
  value: string
  onChange: ICD10AutocompleteOnChange
  placeholder?: string
  required?: boolean
}

const SEARCH_DEBOUNCE_MS = 300
const MIN_CHARS = 2
const MAX_RESULTS = 10

export default function ICD10Autocomplete({
  id,
  value,
  onChange,
  placeholder,
  required,
}: Props) {
  const [results, setResults] = useState<ICD10Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const [selected, setSelected] = useState<ICD10Suggestion | null>(null)

  const rootRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const trimmed = useMemo(() => value.trim(), [value])

  const closeDropdown = useCallback(() => {
    setOpen(false)
    setActiveIndex(-1)
  }, [])

  const selectSuggestion = useCallback(
    (suggestion: ICD10Suggestion) => {
      const nextValue = `${suggestion.code} — ${suggestion.description}`
      setSelected(suggestion)
      setResults([])
      closeDropdown()
      onChange(nextValue, suggestion)
    },
    [closeDropdown, onChange]
  )

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!rootRef.current) return
      if (!rootRef.current.contains(e.target as Node)) closeDropdown()
    }

    document.addEventListener('mousedown', onDocMouseDown)
    return () => document.removeEventListener('mousedown', onDocMouseDown)
  }, [closeDropdown])

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    const isSameAsSelected =
      selected && trimmed === `${selected.code} — ${selected.description}`

    if (!trimmed || trimmed.length < MIN_CHARS || isSameAsSelected) {
      setLoading(false)
      setError(null)
      setResults([])
      closeDropdown()
      return
    }

    setLoading(true)
    setError(null)
    setOpen(true)

    timeoutRef.current = setTimeout(() => {
      authFetch(`${API_BASE_URL}/clinical/icd10/search?q=${encodeURIComponent(trimmed)}`)
        .then(async (res) => {
          if (res.ok) return res.json()
          throw new Error('Error al buscar diagnósticos')
        })
        .then((data) => {
          const list = Array.isArray(data) ? (data as ICD10Suggestion[]) : []
          setResults(list.slice(0, MAX_RESULTS))
          setActiveIndex(list.length > 0 ? 0 : -1)
        })
        .catch(() => {
          setResults([])
          setActiveIndex(-1)
          setError('No se pudo buscar diagnósticos. Intenta nuevamente.')
        })
        .finally(() => {
          setLoading(false)
        })
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [trimmed, selected, closeDropdown])

  const handleInputChange = (next: string) => {
    setSelected(null)
    onChange(next, null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) {
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && results.length > 0) {
        setOpen(true)
      } else {
        return
      }
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((prev) => {
        const next = prev + 1
        return next >= results.length ? 0 : next
      })
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((prev) => {
        const next = prev - 1
        return next < 0 ? results.length - 1 : next
      })
      return
    }

    if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < results.length) {
        e.preventDefault()
        selectSuggestion(results[activeIndex])
      }
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      closeDropdown()
    }
  }

  return (
    <div ref={rootRef} className="relative overflow-visible">
      <input
        id={id}
        type="text"
        required={required}
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => {
          if (results.length > 0) setOpen(true)
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full border-2 border-teal-100 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-400 focus:border-teal-400 shadow-sm transition-all"
        autoComplete="off"
        inputMode="search"
      />

      {loading && (
        <span className="absolute right-3 top-4 text-xs text-teal-600">Buscando...</span>
      )}

      {open && (error || results.length > 0 || trimmed.length >= MIN_CHARS) && (
        <div className="absolute top-[calc(100%+0.5rem)] left-0 right-0 z-[9999] bg-white rounded-xl shadow-xl border border-emerald-100 max-h-60 overflow-y-auto">
          {error ? (
            <div className="px-4 py-3 text-sm text-rose-600">{error}</div>
          ) : results.length > 0 ? (
            <ul className="py-1">
              {results.map((item, idx) => {
                const isActive = idx === activeIndex
                const isSelected = selected?.code === item.code

                return (
                  <li key={`${item.code}-${item.description}`}>
                    <button
                      type="button"
                      className={`w-full text-left px-4 py-3 text-sm cursor-pointer focus:outline-none ${
                        isActive ? 'bg-teal-50' : ''
                      } ${isSelected ? 'text-teal-700 font-semibold' : 'text-slate-800'} hover:bg-teal-50`}
                      title={`${item.code} — ${item.description}`}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => selectSuggestion(item)}
                    >
                      <span className="block truncate">
                        {item.code} — {item.description}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : trimmed.length >= MIN_CHARS ? (
            <div className="px-4 py-3 text-sm text-slate-500">No se encontraron diagnósticos</div>
          ) : (
            <div className="px-4 py-3 text-sm text-slate-500">
              Escribe al menos {MIN_CHARS} caracteres
            </div>
          )}
        </div>
      )}

      {selected && (
        <p className="text-xs text-teal-600 mt-2 flex items-center gap-2 font-medium">
          <span>✅</span>
          Seleccionado: {selected.code} — {selected.description}
        </p>
      )}
    </div>
  )
}
