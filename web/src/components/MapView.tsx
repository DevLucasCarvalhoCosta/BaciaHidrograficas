import React, { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { api } from '../services/api'
import { FilterPanel, FilterRule, FieldType } from './FilterPanel'
import { fixLeafletIcons } from '../services/leafletIcons'
import { createStationMarkerIcon } from '../services/customMarkerIcon'

// Ensure Leaflet default icons load correctly under Vite
fixLeafletIcons()

// Types based on backend ANA field names
export interface HidroStation {
  codigoestacao: string
  Estacao_Nome?: string | null
  Latitude?: string | number | null
  Longitude?: string | number | null
  UF_Estacao?: string | null
  Rio_Nome?: string | null
  Tipo_Estacao?: string | null
  Operando?: string | null
  Data_Periodo_Pluviometro_Fim?: string | null
  Data_Periodo_Pluviometro_Inicio?: string | null
  Data_Periodo_Registrador_Chuva_Fim?: string | null
  Data_Periodo_Registrador_Chuva_Inicio?: string | null
  Data_Periodo_Registrador_Nivel_Fim?: string | null
  Data_Periodo_Registrador_Nivel_Inicio?: string | null
  Data_Periodo_Telemetrica_Inicio?: string | null
  Data_Periodo_Telemetrica_Fim?: string | null
  Data_Ultima_Atualizacao?: string | null
  Tipo_Estacao_Pluviometro?: string | null
  Tipo_Estacao_Registrador_Chuva?: string | null
  Tipo_Estacao_Registrador_Nivel?: string | null
  Tipo_Estacao_Telemetrica?: string | null
}

function toNumber(val: string | number | null | undefined): number | null {
  if (val === null || val === undefined) return null
  if (typeof val === 'number') return isFinite(val) ? val : null
  const n = Number(String(val).replace(',', '.'))
  return isNaN(n) ? null : n
}

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center)
  }, [center, map])
  return null
}

export function MapView() {
  const [stations, setStations] = useState<HidroStation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Default to Goiás (GO) instead of RS
  const [uf, setUf] = useState('GO')
  const [qInput, setQInput] = useState('')
  const [q, setQ] = useState('')
  const [tipo, setTipo] = useState('')
  const [operando, setOperando] = useState<'Todos' | 'Sim' | 'Não'>('Todos')
  const [rio, setRio] = useState('')
  const [rules, setRules] = useState<FilterRule[]>([])
  // Date range filters (from/to)
  const [pluvIniFrom, setPluvIniFrom] = useState('')
  const [pluvIniTo, setPluvIniTo] = useState('')
  const [pluvFimFrom, setPluvFimFrom] = useState('')
  const [pluvFimTo, setPluvFimTo] = useState('')
  const [regChuvaIniFrom, setRegChuvaIniFrom] = useState('')
  const [regChuvaIniTo, setRegChuvaIniTo] = useState('')
  const [regChuvaFimFrom, setRegChuvaFimFrom] = useState('')
  const [regChuvaFimTo, setRegChuvaFimTo] = useState('')
  const [regNivelIniFrom, setRegNivelIniFrom] = useState('')
  const [regNivelIniTo, setRegNivelIniTo] = useState('')
  const [regNivelFimFrom, setRegNivelFimFrom] = useState('')
  const [regNivelFimTo, setRegNivelFimTo] = useState('')
  const [teleIniFrom, setTeleIniFrom] = useState('')
  const [teleIniTo, setTeleIniTo] = useState('')
  const [teleFimFrom, setTeleFimFrom] = useState('')
  const [teleFimTo, setTeleFimTo] = useState('')
  const [ultAtualFrom, setUltAtualFrom] = useState('')
  const [ultAtualTo, setUltAtualTo] = useState('')
  // Tipo_Estacao_* selectors
  const [tipoPluviometro, setTipoPluviometro] = useState('')
  const [tipoRegChuva, setTipoRegChuva] = useState('')
  const [tipoRegNivel, setTipoRegNivel] = useState('')
  const [tipoTelemetrica, setTipoTelemetrica] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await api.getAll(`/api/ana/estacoes/hidro`, {
          params: { unidadefederativa: uf, q: q || undefined },
        })
        if (!cancelled) setStations(res)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Erro ao carregar estações')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [uf, q])

  const center = useMemo<[number, number]>(() => {
    // Centro aproximado de Goiás
    return [-15.827, -49.836]
  }, [])
  const zoom = 7

  // Create custom marker icons for active/inactive stations
  const activeIcon = useMemo(() => createStationMarkerIcon(true), [])
  const inactiveIcon = useMemo(() => createStationMarkerIcon(false), [])

  function dateSerial(val: any): number | null {
    if (val === null || val === undefined) return null
    const s = String(val).trim()
    if (!s) return null
    // If input is from <input type="date"> (yyyy-mm-dd), normalize
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      const d = s.slice(0, 10).replace(/-/g, '')
      return d.length === 8 ? Number(d) : null
    }
    // dd/MM/yyyy or similar
    if (s.includes('/')) {
      const [dd, mm, yyyy] = s.split('/')
      if (yyyy && mm && dd) {
        const d = `${yyyy.padStart(4, '0')}${mm.padStart(2, '0')}${dd.padStart(2, '0')}`
        return d.length === 8 && /^\d{8}$/.test(d) ? Number(d) : null
      }
    }
    // ISO-like
    if (s.includes('T') || s.includes('-')) {
      const d = s.slice(0, 10).replace(/-/g, '')
      return /^\d{8}$/.test(d) ? Number(d) : null
    }
    // Fallback: only digits
    const digits = s.replace(/\D/g, '')
    return digits.length >= 8 ? Number(digits.slice(0, 8)) : null
  }

  const filteredStations = useMemo(() => {
    const inRange = (value: any, from: string, to: string) => {
      const n = dateSerial(value)
      const f = from ? dateSerial(from) : null
      const t = to ? dateSerial(to) : null
      if (n === null) return false
      if (f !== null && n < f) return false
      if (t !== null && n > t) return false
      return true
    }

    const base = stations.filter((s) => {
      if (tipo && (s.Tipo_Estacao || '').trim() !== tipo) return false
      if (operando !== 'Todos') {
        const val = (s.Operando || '').toString().normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase()
        const target = operando === 'Sim' ? 'SIM' : 'NAO'
        if (val !== target) return false
      }
      if (rio && !(s.Rio_Nome || '').toLowerCase().includes(rio.toLowerCase())) return false
      // Date filters (optional)
      if (pluvIniFrom || pluvIniTo) {
        if (!inRange(s.Data_Periodo_Pluviometro_Inicio, pluvIniFrom, pluvIniTo)) return false
      }
      if (pluvFimFrom || pluvFimTo) {
        if (!inRange(s.Data_Periodo_Pluviometro_Fim, pluvFimFrom, pluvFimTo)) return false
      }
      if (regChuvaIniFrom || regChuvaIniTo) {
        if (!inRange(s.Data_Periodo_Registrador_Chuva_Inicio, regChuvaIniFrom, regChuvaIniTo)) return false
      }
      if (regChuvaFimFrom || regChuvaFimTo) {
        if (!inRange(s.Data_Periodo_Registrador_Chuva_Fim, regChuvaFimFrom, regChuvaFimTo)) return false
      }
      if (regNivelIniFrom || regNivelIniTo) {
        if (!inRange(s.Data_Periodo_Registrador_Nivel_Inicio, regNivelIniFrom, regNivelIniTo)) return false
      }
      if (regNivelFimFrom || regNivelFimTo) {
        if (!inRange(s.Data_Periodo_Registrador_Nivel_Fim, regNivelFimFrom, regNivelFimTo)) return false
      }
      if (teleIniFrom || teleIniTo) {
        if (!inRange(s.Data_Periodo_Telemetrica_Inicio, teleIniFrom, teleIniTo)) return false
      }
      if (teleFimFrom || teleFimTo) {
        if (!inRange(s.Data_Periodo_Telemetrica_Fim, teleFimFrom, teleFimTo)) return false
      }
      if (ultAtualFrom || ultAtualTo) {
        if (!inRange(s.Data_Ultima_Atualizacao, ultAtualFrom, ultAtualTo)) return false
      }
      // Tipo_Estacao_* selectors
      if (tipoPluviometro && (s.Tipo_Estacao_Pluviometro || '').trim() !== tipoPluviometro) return false
      if (tipoRegChuva && (s.Tipo_Estacao_Registrador_Chuva || '').trim() !== tipoRegChuva) return false
      if (tipoRegNivel && (s.Tipo_Estacao_Registrador_Nivel || '').trim() !== tipoRegNivel) return false
      if (tipoTelemetrica && (s.Tipo_Estacao_Telemetrica || '').trim() !== tipoTelemetrica) return false
      return true
    })

    // Apply advanced rules
    const applyRule = (s: any, r: FilterRule) => {
      const raw = s[r.field]
      const t = r.type
      const v1 = r.value1
      const v2 = r.value2
      if (t === 'string') {
        const val = (raw ?? '').toString()
        const norm = (x: string) => x.toLowerCase()
        switch (r.op) {
          case 'contains': return norm(val).includes(norm(v1 || ''))
          case 'notContains': return !norm(val).includes(norm(v1 || ''))
          case 'equals': return norm(val) === norm(v1 || '')
          case 'startsWith': return norm(val).startsWith(norm(v1 || ''))
          case 'endsWith': return norm(val).endsWith(norm(v1 || ''))
          case 'in': {
            const list = (v1 || '').split(',').map(x => norm(x.trim())).filter(Boolean)
            return list.length ? list.includes(norm(val)) : true
          }
          default: return true
        }
      } else {
        const num = Number(String(raw).replace(',', '.'))
        const a = Number(String(v1).replace(',', '.'))
        const b = Number(String(v2).replace(',', '.'))
        switch (r.op) {
          case '=': return num === a
          case '!=': return num !== a
          case '>': return num > a
          case '>=': return num >= a
          case '<': return num < a
          case '<=': return num <= a
          case 'between': return !Number.isNaN(a) && !Number.isNaN(b) ? (num >= a && num <= b) : true
          default: return true
        }
      }
    }
    const passesAll = (s: any) => (rules || []).every(r => applyRule(s, r))
    return base.filter(passesAll)
  }, [
    stations, tipo, operando, rio, rules,
    pluvIniFrom, pluvIniTo, pluvFimFrom, pluvFimTo,
    regChuvaIniFrom, regChuvaIniTo, regChuvaFimFrom, regChuvaFimTo,
    regNivelIniFrom, regNivelIniTo, regNivelFimFrom, regNivelFimTo,
    teleIniFrom, teleIniTo, teleFimFrom, teleFimTo,
    ultAtualFrom, ultAtualTo,
    tipoPluviometro, tipoRegChuva, tipoRegNivel, tipoTelemetrica,
  ])

  const availableFields = useMemo(() => {
    const sample = stations.slice(0, 200)
    const typeMap = new Map<string, FieldType>()
    const preferNumber = new Set(['Latitude', 'Longitude', 'Altitude'])
    for (const s of sample) {
      for (const k of Object.keys(s as any)) {
        const v = (s as any)[k]
        if (v === null || v === undefined) continue
        if (!typeMap.has(k)) {
          if (preferNumber.has(k)) {
            typeMap.set(k, 'number')
          } else {
            const maybeNum = Number(String(v).replace(',', '.'))
            typeMap.set(k, Number.isFinite(maybeNum) && String(v).trim() !== '' ? 'number' : 'string')
          }
        }
      }
    }
    // Fields order: highlight common ones first
    const priority = ['codigoestacao','Estacao_Nome','UF_Estacao','Rio_Nome','Tipo_Estacao','Operando','Latitude','Longitude']
    const setPriority = new Set(priority)
    const rest = Array.from(typeMap.entries())
      .filter(([k]) => !setPriority.has(k))
      .sort(([a],[b]) => a.localeCompare(b))
    const prioritized = [
      ...priority.filter(k => typeMap.has(k)).map(k => [k, typeMap.get(k)!] as const),
      ...rest,
    ]
    return prioritized.map(([name, type]) => ({ name, type }))
  }, [stations])

  return (
    <div className="map-root">
      <div className="panel">
        <div className="panel-header">
          <h1 className="panel-title">
            <span>💧</span> Estações Hidrológicas - ANA
          </h1>
          <p className="panel-subtitle">Sistema de Monitoramento de Recursos Hídricos</p>
        </div>

        <div className="stats-row">
          {loading && <div className="loading">Carregando dados...</div>}
          {error && <div className="text-error">{error}</div>}
          {!loading && !error && (
            <>
              <div className="stat-badge">
                <span className="stat-value">{stations.length}</span>
                <span className="stat-label">Total</span>
              </div>
              <div className="stat-badge">
                <span className="stat-value">{filteredStations.length}</span>
                <span className="stat-label">Filtradas</span>
              </div>
              <div className="stat-badge">
                <span className="stat-value">{uf}</span>
                <span className="stat-label">Estado</span>
              </div>
            </>
          )}
        </div>

        <div className="panel-row">
          <label>
            Estado (UF):
            <select value={uf} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setUf(e.target.value)}>
              {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </label>
          <label>
            Busca Rápida:
            <input value={qInput} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQInput(e.target.value)} placeholder="nome, código, rio..." />
          </label>
          <button className="btn primary" onClick={() => setQ(qInput)}>🔍 Buscar</button>
        </div>

        <div className="panel-row">
          <label>
            Tipo de Estação:
            <select value={tipo} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTipo(e.target.value)}>
              <option value="">Todos os tipos</option>
              {Array.from(new Set(stations.map(s => (s.Tipo_Estacao || '').trim()).filter(Boolean))).sort().map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Status Operacional:
            <select value={operando} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setOperando(e.target.value as any)}>
              <option value="Todos">Todas</option>
              <option value="Sim">✓ Operando</option>
              <option value="Não">✗ Inativa</option>
            </select>
          </label>
          <label>
            Rio:
            <input value={rio} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRio(e.target.value)} placeholder="nome do rio..." />
          </label>
        </div>
        <div className="divider" />
        <details className="details" open>
          <summary>Filtros por período (datas)</summary>
          <div className="grid grid-4">
            <label>Pluviômetro Início: De <input type="date" value={pluvIniFrom} onChange={e=>setPluvIniFrom(e.target.value)} /> Até <input type="date" value={pluvIniTo} onChange={e=>setPluvIniTo(e.target.value)} /></label>
            <label>Pluviômetro Fim: De <input type="date" value={pluvFimFrom} onChange={e=>setPluvFimFrom(e.target.value)} /> Até <input type="date" value={pluvFimTo} onChange={e=>setPluvFimTo(e.target.value)} /></label>
            <label>Reg. Chuva Início: De <input type="date" value={regChuvaIniFrom} onChange={e=>setRegChuvaIniFrom(e.target.value)} /> Até <input type="date" value={regChuvaIniTo} onChange={e=>setRegChuvaIniTo(e.target.value)} /></label>
            <label>Reg. Chuva Fim: De <input type="date" value={regChuvaFimFrom} onChange={e=>setRegChuvaFimFrom(e.target.value)} /> Até <input type="date" value={regChuvaFimTo} onChange={e=>setRegChuvaFimTo(e.target.value)} /></label>
            <label>Reg. Nível Início: De <input type="date" value={regNivelIniFrom} onChange={e=>setRegNivelIniFrom(e.target.value)} /> Até <input type="date" value={regNivelIniTo} onChange={e=>setRegNivelIniTo(e.target.value)} /></label>
            <label>Reg. Nível Fim: De <input type="date" value={regNivelFimFrom} onChange={e=>setRegNivelFimFrom(e.target.value)} /> Até <input type="date" value={regNivelFimTo} onChange={e=>setRegNivelFimTo(e.target.value)} /></label>
            <label>Telemétrica Início: De <input type="date" value={teleIniFrom} onChange={e=>setTeleIniFrom(e.target.value)} /> Até <input type="date" value={teleIniTo} onChange={e=>setTeleIniTo(e.target.value)} /></label>
            <label>Telemétrica Fim: De <input type="date" value={teleFimFrom} onChange={e=>setTeleFimFrom(e.target.value)} /> Até <input type="date" value={teleFimTo} onChange={e=>setTeleFimTo(e.target.value)} /></label>
            <label>Última Atualização: De <input type="date" value={ultAtualFrom} onChange={e=>setUltAtualFrom(e.target.value)} /> Até <input type="date" value={ultAtualTo} onChange={e=>setUltAtualTo(e.target.value)} /></label>
          </div>
        </details>
        <details className="details">
          <summary>Filtros por tipo de estação</summary>
          <div className="panel-row">
            <label>Tipo Pluviômetro: <select value={tipoPluviometro} onChange={e=>setTipoPluviometro(e.target.value)}>
              <option value="">Todos</option>
              {Array.from(new Set(stations.map(s => (s.Tipo_Estacao_Pluviometro || '').trim()).filter(Boolean))).sort().map(v => (<option key={v} value={v}>{v}</option>))}
            </select></label>
            <label>Tipo Reg. Chuva: <select value={tipoRegChuva} onChange={e=>setTipoRegChuva(e.target.value)}>
              <option value="">Todos</option>
              {Array.from(new Set(stations.map(s => (s.Tipo_Estacao_Registrador_Chuva || '').trim()).filter(Boolean))).sort().map(v => (<option key={v} value={v}>{v}</option>))}
            </select></label>
            <label>Tipo Reg. Nível: <select value={tipoRegNivel} onChange={e=>setTipoRegNivel(e.target.value)}>
              <option value="">Todos</option>
              {Array.from(new Set(stations.map(s => (s.Tipo_Estacao_Registrador_Nivel || '').trim()).filter(Boolean))).sort().map(v => (<option key={v} value={v}>{v}</option>))}
            </select></label>
            <label>Tipo Telemétrica: <select value={tipoTelemetrica} onChange={e=>setTipoTelemetrica(e.target.value)}>
              <option value="">Todos</option>
              {Array.from(new Set(stations.map(s => (s.Tipo_Estacao_Telemetrica || '').trim()).filter(Boolean))).sort().map(v => (<option key={v} value={v}>{v}</option>))}
            </select></label>
          </div>
        </details>
        <FilterPanel
          fields={availableFields}
          rules={rules}
          onChange={setRules}
          onApply={() => setRules([...rules])}
          onReset={() => {
            setRules([])
            setTipo('')
            setOperando('Todos')
            setRio('')
            setQInput('')
            setQ('')
            setPluvIniFrom(''); setPluvIniTo('')
            setPluvFimFrom(''); setPluvFimTo('')
            setRegChuvaIniFrom(''); setRegChuvaIniTo('')
            setRegChuvaFimFrom(''); setRegChuvaFimTo('')
            setRegNivelIniFrom(''); setRegNivelIniTo('')
            setRegNivelFimFrom(''); setRegNivelFimTo('')
            setTeleIniFrom(''); setTeleIniTo('')
            setTeleFimFrom(''); setTeleFimTo('')
            setUltAtualFrom(''); setUltAtualTo('')
            setTipoPluviometro(''); setTipoRegChuva(''); setTipoRegNivel(''); setTipoTelemetrica('')
          }}
        />
      </div>
      <MapContainer center={center} zoom={zoom} className="map-container">
        <Recenter center={center} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          maxZoom={20}
        />
        {filteredStations.map((s) => {
          const lat = toNumber(s.Latitude)
          const lng = toNumber(s.Longitude)
          if (lat === null || lng === null) return null
          const position: [number, number] = [lat, lng]
          
          // Determine if station is active
          const isActive = String(s.Operando || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').includes('sim')
          const markerIcon = isActive ? activeIcon : inactiveIcon
          
          return (
            <Marker key={s.codigoestacao} position={position} icon={markerIcon}>
              <Popup maxWidth={300}>
                <div style={{ lineHeight: '1.6' }}>
                  <div style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '2px solid #0284c7' }}>
                    <strong style={{ fontSize: '1.1em', color: '#0284c7' }}>{s.Estacao_Nome || 'Sem nome'}</strong>
                  </div>
                  <div style={{ display: 'grid', gap: '6px', fontSize: '0.9em' }}>
                    <div><strong>🔢 Código:</strong> {s.codigoestacao}</div>
                    {s.UF_Estacao && <div><strong>📍 UF:</strong> {s.UF_Estacao}</div>}
                    {s.Rio_Nome && <div><strong>🌊 Rio:</strong> {s.Rio_Nome}</div>}
                    {s.Tipo_Estacao && <div><strong>📊 Tipo:</strong> {s.Tipo_Estacao}</div>}
                    {typeof s.Operando !== 'undefined' && s.Operando !== null && (
                      <div><strong>⚡ Status:</strong> <span style={{ color: String(s.Operando).toLowerCase().includes('sim') ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                        {String(s.Operando).toLowerCase().includes('sim') ? '✓ Operando' : '✗ Inativa'}
                      </span></div>
                    )}
                    <div style={{ marginTop: '4px', paddingTop: '8px', borderTop: '1px solid #e2e8f0', fontSize: '0.85em', color: '#64748b' }}>
                      <strong>🗺️ Coordenadas:</strong> {lat.toFixed(5)}°, {lng.toFixed(5)}°
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
}
