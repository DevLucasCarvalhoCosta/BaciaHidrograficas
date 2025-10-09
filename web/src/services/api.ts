export const API_BASE_URL = (import.meta as any).env?.DEV
  ? ''
  : ((import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000')

export const api = {
  async get(url: string, options?: { params?: Record<string, any> }) {
    const qs = options?.params
      ? '?' + new URLSearchParams(Object.entries(options.params).filter(([, v]) => v !== undefined && v !== null) as [string, string][]) 
      : ''
    const base = API_BASE_URL || ''
    const href = `${base}${url}${qs}`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    try {
      const resp = await fetch(href, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      })
      if (!resp.ok) {
        const text = await resp.text().catch(() => '')
        throw new Error(`HTTP ${resp.status} at ${href}: ${text}`)
      }
      return resp.json()
    } catch (e: any) {
      const reason = e?.name === 'AbortError' ? 'timeout (15s)' : (e?.message || 'network error')
      throw new Error(`Fetch failed for ${href}: ${reason}`)
    } finally {
      clearTimeout(timeout)
    }
  },
  async getAll(
    url: string,
    options?: { params?: Record<string, any> },
    paging: { pageParam?: string; sizeParam?: string; startPage?: number; pageSize?: number } = {}
  ) {
    const pageParam = paging.pageParam ?? 'pagina'
    const sizeParam = paging.sizeParam ?? 'tamanho'
    const startPage = paging.startPage ?? 1
    const pageSize = paging.pageSize ?? 200

    const all: any[] = []
    let page = startPage
    const maxPages = 200 // safety cap
    for (let i = 0; i < maxPages; i++) {
      const params = { ...(options?.params || {}), [pageParam]: String(page), [sizeParam]: String(pageSize) }
      const res = await this.get(url, { params })
      const data = Array.isArray(res) ? res : (res?.data ?? [])
      const pagination = res?.pagination
      if (!Array.isArray(data) || data.length === 0) break
      all.push(...data)
      const totalPages = typeof pagination?.paginas === 'number' ? pagination.paginas : undefined
      if (totalPages && page >= totalPages) break
      page += 1
      // small delay to avoid hammering server
      await new Promise((r) => setTimeout(r, 50))
    }
    return all
  },
}
