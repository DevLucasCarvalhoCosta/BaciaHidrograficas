import React, { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { api } from '../services/api'
import { FilterPanel, FilterRule, FieldType } from './FilterPanel'
import { fixLeafletIcons } from '../services/leafletIcons'
import { createStationMarkerIcon } from '../services/customMarkerIcon'
import { MapLayerControl } from './MapLayerControl'
import { StationDashboard } from './StationDashboard'

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
  Operando?: string | boolean | null
  Data_Periodo_Pluviometro_Fim?: string | null
  Data_Periodo_Pluviometro_Inicio?: string | null
  Data_Periodo_Registrador_Chuva_Fim?: string | null
  Data_Periodo_Registrador_Chuva_Inicio?: string | null
  Data_Periodo_Registrador_Nivel_Fim?: string | null
  Data_Periodo_Registrador_Nivel_Inicio?: string | null
  Data_Periodo_Telemetrica_Inicio?: string | null
  Data_Periodo_Telemetrica_Fim?: string | null
  Data_Ultima_Atualizacao?: string | null
  Tipo_Estacao_Pluviometro?: string | boolean | null
  Tipo_Estacao_Registrador_Chuva?: string | boolean | null
  Tipo_Estacao_Registrador_Nivel?: string | boolean | null
  Tipo_Estacao_Telemetrica?: string | boolean | null
  Tipo_Estacao_Climatologica?: string | boolean | null
  Tipo_Estacao_Qual_Agua?: string | boolean | null
  Tipo_Estacao_Sedimentos?: string | boolean | null
  Tipo_Rede_Basica?: string | boolean | null
  Tipo_Rede_Captacao?: string | boolean | null
  Tipo_Rede_Qual_Agua?: string | boolean | null
}

function toNumber(val: string | number | null | undefined): number | null {
  if (val === null || val === undefined) return null
  if (typeof val === 'number') return isFinite(val) ? val : null
  const n = Number(String(val).replace(',', '.'))
  return isNaN(n) ? null : n
}

function toBoolean(val: string | number | boolean | null | undefined): boolean {
  if (val === null || val === undefined) return false
  if (typeof val === 'boolean') return val
  const str = String(val).trim()
  if (str === '1') return true
  if (str === '0') return false
  const normalized = str.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
  return normalized === 'sim' || normalized === 'true' || normalized === 'yes'
}

// Normalize station data from API response
function normalizeStation(raw: any): HidroStation {
  return {
    ...raw,
    Operando: toBoolean(raw.Operando),
    Tipo_Estacao_Pluviometro: toBoolean(raw.Tipo_Estacao_Pluviometro),
    Tipo_Estacao_Registrador_Chuva: toBoolean(raw.Tipo_Estacao_Registrador_Chuva),
    Tipo_Estacao_Registrador_Nivel: toBoolean(raw.Tipo_Estacao_Registrador_Nivel),
    Tipo_Estacao_Telemetrica: toBoolean(raw.Tipo_Estacao_Telemetrica),
    Tipo_Estacao_Climatologica: toBoolean(raw.Tipo_Estacao_Climatologica),
    Tipo_Estacao_Qual_Agua: toBoolean(raw.Tipo_Estacao_Qual_Agua),
    Tipo_Estacao_Sedimentos: toBoolean(raw.Tipo_Estacao_Sedimentos),
    Tipo_Rede_Basica: toBoolean(raw.Tipo_Rede_Basica),
    Tipo_Rede_Captacao: toBoolean(raw.Tipo_Rede_Captacao),
    Tipo_Rede_Qual_Agua: toBoolean(raw.Tipo_Rede_Qual_Agua),
  }
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
  const [syncingStation, setSyncingStation] = useState<string | null>(null)
  const [dashboardStation, setDashboardStation] = useState<string | null>(null)
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
        // Normalize all stations to convert "0"/"1" to boolean
        const normalized = res.map((s: any) => normalizeStation(s))
        if (!cancelled) setStations(normalized)
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Erro ao carregar estações')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [uf, q])

  // Centro e zoom baseado no estado selecionado
  const center = useMemo<[number, number]>(() => {
    const centers: Record<string, [number, number]> = {
      'GO': [-15.827, -49.836],  // Goiás
      'RS': [-30.034, -51.217],  // Rio Grande do Sul
      'SP': [-23.550, -46.633],  // São Paulo
      'MG': [-19.817, -43.956],  // Minas Gerais
      'PR': [-25.252, -52.021],  // Paraná
      'SC': [-27.595, -48.548],  // Santa Catarina
      'BA': [-12.971, -38.511],  // Bahia
      'MT': [-15.601, -56.097],  // Mato Grosso
      'MS': [-20.469, -54.620],  // Mato Grosso do Sul
      'PA': [-1.455, -48.490],   // Pará
      'AM': [-3.119, -60.021],   // Amazonas
      'RO': [-8.761, -63.904],   // Rondônia
      'AC': [-8.770, -70.550],   // Acre
      'TO': [-10.249, -48.324],  // Tocantins
      'MA': [-2.530, -44.303],   // Maranhão
      'PI': [-5.089, -42.803],   // Piauí
      'CE': [-3.717, -38.543],   // Ceará
      'RN': [-5.795, -36.954],   // Rio Grande do Norte
      'PB': [-7.115, -34.863],   // Paraíba
      'PE': [-8.047, -34.877],   // Pernambuco
      'AL': [-9.665, -35.735],   // Alagoas
      'SE': [-10.925, -37.073],  // Sergipe
      'ES': [-20.319, -40.338],  // Espírito Santo
      'RJ': [-22.906, -43.173],  // Rio de Janeiro
      'DF': [-15.793, -47.883],  // Distrito Federal
      'RR': [2.820, -60.675],    // Roraima
      'AP': [0.034, -51.066],    // Amapá
    }
    return centers[uf] || centers['GO']
  }, [uf])
  
  const zoom = 7

  // Create custom marker icons for active/inactive stations
  const activeIcon = useMemo(() => createStationMarkerIcon(true), [])
  const inactiveIcon = useMemo(() => createStationMarkerIcon(false), [])

  // Função para buscar dados detalhados de uma estação
  const handleSyncSeriesData = async (codigoEstacao: string) => {
    if (syncingStation) {
      alert('Aguarde a sincronização anterior terminar.')
      return
    }

    const confirm = window.confirm(
      `Deseja buscar os dados detalhados da estação ${codigoEstacao}?\n\n` +
      `Isso irá:\n` +
      `• Buscar séries de chuva, vazão e nível dos últimos 12 meses\n` +
      `• Armazenar no banco de dados para análises futuras\n` +
      `• Pode levar alguns segundos`
    )

    if (!confirm) return

    setSyncingStation(codigoEstacao)
    
    try {
      // Calcular datas (últimos 12 meses)
      const dataFim = new Date().toISOString().split('T')[0]
      const dataInicio = new Date()
      dataInicio.setMonth(dataInicio.getMonth() - 12)
      const dataInicioStr = dataInicio.toISOString().split('T')[0]

      const response = await api.post('/api/ana/series/sync', {
        codigoEstacao,
        dataInicio: dataInicioStr,
        dataFim: dataFim,
        // tipo: undefined = busca todos (chuva, vazao, nivel)
      })

      const result = response.data
      let message = `✅ Dados sincronizados com sucesso!\n\n`
      
      if (result.chuva) {
        message += `💧 Chuva: ${result.chuva.upserted || result.chuva.total || 0} registros\n`
      }
      if (result.vazao) {
        message += `🌊 Vazão: ${result.vazao.upserted || result.vazao.total || 0} registros\n`
      }
      if (result.nivel) {
        message += `📏 Nível: ${result.nivel.upserted || result.nivel.total || 0} registros\n`
      }

      message += `\n📊 Agora você pode visualizar esses dados em dashboards!`
      
      alert(message)
    } catch (error: any) {
      console.error('Erro ao sincronizar dados:', error)
      alert(`❌ Erro ao buscar dados:\n\n${error?.response?.data?.error || error?.message || 'Erro desconhecido'}`)
    } finally {
      setSyncingStation(null)
    }
  }

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
        const isOperating = typeof s.Operando === 'boolean' ? s.Operando : toBoolean(s.Operando)
        const target = operando === 'Sim'
        if (isOperating !== target) return false
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
      // Tipo_Estacao_* selectors (now boolean)
      if (tipoPluviometro) {
        const hasType = typeof s.Tipo_Estacao_Pluviometro === 'boolean' ? s.Tipo_Estacao_Pluviometro : toBoolean(s.Tipo_Estacao_Pluviometro)
        if (tipoPluviometro === 'true' && !hasType) return false
        if (tipoPluviometro === 'false' && hasType) return false
      }
      if (tipoRegChuva) {
        const hasType = typeof s.Tipo_Estacao_Registrador_Chuva === 'boolean' ? s.Tipo_Estacao_Registrador_Chuva : toBoolean(s.Tipo_Estacao_Registrador_Chuva)
        if (tipoRegChuva === 'true' && !hasType) return false
        if (tipoRegChuva === 'false' && hasType) return false
      }
      if (tipoRegNivel) {
        const hasType = typeof s.Tipo_Estacao_Registrador_Nivel === 'boolean' ? s.Tipo_Estacao_Registrador_Nivel : toBoolean(s.Tipo_Estacao_Registrador_Nivel)
        if (tipoRegNivel === 'true' && !hasType) return false
        if (tipoRegNivel === 'false' && hasType) return false
      }
      if (tipoTelemetrica) {
        const hasType = typeof s.Tipo_Estacao_Telemetrica === 'boolean' ? s.Tipo_Estacao_Telemetrica : toBoolean(s.Tipo_Estacao_Telemetrica)
        if (tipoTelemetrica === 'true' && !hasType) return false
        if (tipoTelemetrica === 'false' && hasType) return false
      }
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
    <>
      {dashboardStation && (
        <StationDashboard 
          codigoEstacao={dashboardStation} 
          onClose={() => setDashboardStation(null)} 
        />
      )}
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
            <select value={uf} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setUf(e.target.value)} title="Selecione o estado para visualizar estações">
              <option value="GO">GO - Goiás</option>
              <option value="RS">RS - Rio Grande do Sul</option>
              <option value="SP">SP - São Paulo</option>
              <option value="MG">MG - Minas Gerais</option>
              <option value="PR">PR - Paraná</option>
              <option value="SC">SC - Santa Catarina</option>
              <option value="BA">BA - Bahia</option>
              <option value="MT">MT - Mato Grosso</option>
              <option value="MS">MS - Mato Grosso do Sul</option>
              <option value="PA">PA - Pará</option>
              <option value="AM">AM - Amazonas</option>
              <option value="RO">RO - Rondônia</option>
              <option value="AC">AC - Acre</option>
              <option value="TO">TO - Tocantins</option>
              <option value="MA">MA - Maranhão</option>
              <option value="PI">PI - Piauí</option>
              <option value="CE">CE - Ceará</option>
              <option value="RN">RN - Rio Grande do Norte</option>
              <option value="PB">PB - Paraíba</option>
              <option value="PE">PE - Pernambuco</option>
              <option value="AL">AL - Alagoas</option>
              <option value="SE">SE - Sergipe</option>
              <option value="ES">ES - Espírito Santo</option>
              <option value="RJ">RJ - Rio de Janeiro</option>
              <option value="DF">DF - Distrito Federal</option>
              <option value="RR">RR - Roraima</option>
              <option value="AP">AP - Amapá</option>
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
              <option value="true">✓ Possui</option>
              <option value="false">✗ Não possui</option>
            </select></label>
            <label>Tipo Reg. Chuva: <select value={tipoRegChuva} onChange={e=>setTipoRegChuva(e.target.value)}>
              <option value="">Todos</option>
              <option value="true">✓ Possui</option>
              <option value="false">✗ Não possui</option>
            </select></label>
            <label>Tipo Reg. Nível: <select value={tipoRegNivel} onChange={e=>setTipoRegNivel(e.target.value)}>
              <option value="">Todos</option>
              <option value="true">✓ Possui</option>
              <option value="false">✗ Não possui</option>
            </select></label>
            <label>Tipo Telemétrica: <select value={tipoTelemetrica} onChange={e=>setTipoTelemetrica(e.target.value)}>
              <option value="">Todos</option>
              <option value="true">✓ Possui</option>
              <option value="false">✗ Não possui</option>
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
        <MapLayerControl />
        {filteredStations.map((s) => {
          const lat = toNumber(s.Latitude)
          const lng = toNumber(s.Longitude)
          if (lat === null || lng === null) return null
          const position: [number, number] = [lat, lng]
          
          // Determine if station is active (now it's a boolean)
          const isActive = typeof s.Operando === 'boolean' ? s.Operando : toBoolean(s.Operando)
          const markerIcon = isActive ? activeIcon : inactiveIcon
          
          return (
            <Marker key={s.codigoestacao} position={position} icon={markerIcon}>
              <Popup maxWidth={320}>
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
                      <div><strong>⚡ Status:</strong> <span style={{ color: isActive ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                        {isActive ? '✓ Operando' : '✗ Inativa'}
                      </span></div>
                    )}
                    <div style={{ marginTop: '4px', paddingTop: '8px', borderTop: '1px solid #e2e8f0', fontSize: '0.85em', color: '#64748b' }}>
                      <strong>🗺️ Coordenadas:</strong> {lat.toFixed(5)}°, {lng.toFixed(5)}°
                    </div>
                  </div>
                  <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                      onClick={() => setDashboardStation(s.codigoestacao)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#059669'}
                      onMouseOut={(e) => e.currentTarget.style.background = '#10b981'}
                    >
                      📊 Ver Dashboard Completo
                    </button>
                    <button
                      onClick={() => handleSyncSeriesData(s.codigoestacao)}
                      disabled={syncingStation === s.codigoestacao}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: syncingStation === s.codigoestacao ? '#9ca3af' : '#0284c7',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: syncingStation === s.codigoestacao ? 'not-allowed' : 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        transition: 'all 0.2s',
                      }}
                      onMouseOver={(e) => {
                        if (syncingStation !== s.codigoestacao) {
                          e.currentTarget.style.background = '#0369a1'
                        }
                      }}
                      onMouseOut={(e) => {
                        if (syncingStation !== s.codigoestacao) {
                          e.currentTarget.style.background = '#0284c7'
                        }
                      }}
                    >
                      {syncingStation === s.codigoestacao ? '⏳ Sincronizando...' : '� Buscar Dados da ANA'}
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
      </div>
    </>
  )
}
