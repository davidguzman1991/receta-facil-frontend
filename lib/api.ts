export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = {
  get: async (url: string) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error('API error')
    return res.json()
  },
}
