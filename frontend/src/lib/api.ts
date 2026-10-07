// Tiny fetch wrapper for the Flask API. In dev, Vite proxies /api to localhost:5000.
const BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''
const TOKEN_KEY = 'agri_token'

export class ApiError extends Error {
  status: number
  fields?: Record<string, string>
  constructor(message: string, status: number, fields?: Record<string, string>) {
    super(message)
    this.status = status
    this.fields = fields
  }
}

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY)
    } catch {
      return null
    }
  },
  set: (t: string | null) => {
    try {
      if (t) localStorage.setItem(TOKEN_KEY, t)
      else localStorage.removeItem(TOKEN_KEY)
    } catch {
      /* storage unavailable */
    }
  },
}

export async function api<T = unknown>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`
  let res: Response
  try {
    res = await fetch(`${BASE}/api${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    })
  } catch {
    throw new ApiError('Cannot reach the server. Is the backend running?', 0)
  }
  const data = await res.json().catch(() => null)
  if (data === null) {
    // got HTML / nothing instead of JSON: the Flask API is not the thing answering on /api
    throw new ApiError(
      'Backend not reachable. Start it with "python run.py" in the backend folder (port 5000) and make sure no other app is using that port.',
      res.status,
    )
  }
  if (!res.ok) {
    if (res.status === 401 && token) {
      tokenStore.set(null)
      window.dispatchEvent(new Event('agri:logout'))
    }
    throw new ApiError(data.error ?? 'Something went wrong', res.status, data.fields)
  }
  return data as T
}
