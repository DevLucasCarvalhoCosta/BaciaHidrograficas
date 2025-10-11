import React, { useState, useEffect, useMemo } from 'react'
import { api } from '../services/api'
import { 
  LineChart, 
  BarChart, 
  StatCard, 
  AlertCard, 
  DateRangePicker,
  MetricComparison,
  TimeSeriesChart,
  HistoricalTrends,
  MonthlyHeatmap,
  DataTable
} from './dashboard'

interface StationDashboardProps {
  codigoEstacao: string
  onClose: () => void
}

export const StationDashboard: React.FC<StationDashboardProps> = ({ codigoEstacao, onClose }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'series' | 'comparison' | 'alerts' | 'rawdata' | 'aggregated'>('overview')
  
  // Estados para dados
  const [stats, setStats] = useState<any>(null)
  const [serieChuva, setSerieChuva] = useState<any[]>([])
  const [serieTemp, setSerieTemp] = useState<any[]>([])
  const [comparacaoMensal, setComparacaoMensal] = useState<any[]>([])
  const [alertas, setAlertas] = useState<any>(null)
  const [agregadoDiario, setAgregadoDiario] = useState<any[]>([])
  const [dadosBrutos, setDadosBrutos] = useState<any[]>([])
  
  // Filtros de período
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>('')

  // Carregar dados iniciais
  useEffect(() => {
    loadData()
  }, [codigoEstacao])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Carregar dados em paralelo
      const [statsRes, comparacaoRes, alertasRes] = await Promise.all([
        api.get(`/api/dashboard/stats/${codigoEstacao}`),
        api.get(`/api/dashboard/comparacao-mensal/${codigoEstacao}`),
        api.get(`/api/dashboard/alertas/${codigoEstacao}`)
      ])
      
      setStats(statsRes)
      setComparacaoMensal(comparacaoRes.dados || [])
      setAlertas(alertasRes.alertas)
      
      // Definir mês atual como padrão
      const now = new Date()
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      setSelectedMonth(currentMonth)
      
      // Carregar dados do mês atual
      await loadMonthData(currentMonth)
      
    } catch (err: any) {
      console.error('Erro ao carregar dados:', err)
      setError(err.message || 'Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  const loadMonthData = async (mes: string) => {
    if (!mes) return
    
    try {
      const agregadoRes = await api.get(`/api/dashboard/agregado-diario/${codigoEstacao}`, {
        params: { mes }
      })
      
      setAgregadoDiario(agregadoRes.dados || [])
      
      // Carregar também os dados brutos do mês
      await loadRawData(mes)
    } catch (err) {
      console.error('Erro ao carregar dados do mês:', err)
    }
  }

  const loadRawData = async (mes: string) => {
    if (!mes) return
    
    try {
      // Buscar todos os registros brutos do mês usando o novo endpoint
      const response = await api.get(`/api/dashboard/dados-brutos/${codigoEstacao}`, {
        params: { mes }
      })
      
      setDadosBrutos(response.dados || [])
    } catch (err) {
      console.error('Erro ao carregar dados brutos:', err)
      setDadosBrutos([])
    }
  }

  const loadSeriesData = async (dataInicio?: string, dataFim?: string) => {
    try {
      const params = { dataInicio, dataFim }
      const [chuvaRes, tempRes] = await Promise.all([
        api.get(`/api/dashboard/serie-chuva/${codigoEstacao}`, { params }),
        api.get(`/api/dashboard/serie-temperatura/${codigoEstacao}`, { params })
      ])
      
      setSerieChuva(chuvaRes.dados || [])
      setSerieTemp(tempRes.dados || [])
    } catch (err) {
      console.error('Erro ao carregar séries temporais:', err)
    }
  }

  // Calcular insights
  const insights = useMemo(() => {
    if (!stats?.estatisticas || !comparacaoMensal.length) return null

    const est = stats.estatisticas
    const ultimoMes = comparacaoMensal[comparacaoMensal.length - 1]
    const penultimoMes = comparacaoMensal[comparacaoMensal.length - 2]
    
    const tendenciaChuva = ultimoMes && penultimoMes 
      ? ((parseFloat(ultimoMes.chuva_maxima) - parseFloat(penultimoMes.chuva_maxima)) / parseFloat(penultimoMes.chuva_maxima)) * 100
      : 0
    
    const tendenciaTemp = ultimoMes && penultimoMes
      ? ((parseFloat(ultimoMes.temp_media) - parseFloat(penultimoMes.temp_media)) / parseFloat(penultimoMes.temp_media)) * 100
      : 0

    return {
      periodoTotal: stats.periodo,
      totalRegistros: stats.totalRegistros,
      chuvaMin: parseFloat(est.chuva_min || 0),
      chuvaMax: parseFloat(est.chuva_max || 0),
      chuvaMedia: parseFloat(est.chuva_media || 0),
      tempMin: parseFloat(est.temp_min || 0),
      tempMax: parseFloat(est.temp_max || 0),
      tempMedia: parseFloat(est.temp_media || 0),
      bateriaMin: parseFloat(est.bateria_min || 0),
      bateriaMax: parseFloat(est.bateria_max || 0),
      bateriaMedia: parseFloat(est.bateria_media || 0),
      tendenciaChuva,
      tendenciaTemp,
      ultimoMes: ultimoMes?.mes,
      totalMeses: comparacaoMensal.length
    }
  }, [stats, comparacaoMensal])

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Carregando dados da estação {codigoEstacao}...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-message">
          <h3>❌ Erro ao carregar dados</h3>
          <p>{error}</p>
          <button onClick={loadData}>Tentar novamente</button>
          <button onClick={onClose}>Fechar</button>
        </div>
      </div>
    )
  }

  if (!insights) {
    return (
      <div className="dashboard-container">
        <div className="error-message">
          <h3>⚠️ Sem dados disponíveis</h3>
          <button onClick={onClose}>Fechar</button>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>📊 Dashboard - Estação {codigoEstacao}</h1>
          <p className="subtitle">
            Análise completa dos dados históricos • {insights.totalRegistros.toLocaleString()} registros
          </p>
          <p className="period">
            Período: {(() => {
              if (!insights.periodoTotal?.inicio) return 'N/A'
              try {
                const inicio = new Date(insights.periodoTotal.inicio)
                if (isNaN(inicio.getTime())) return 'N/A'
                return inicio.toLocaleDateString('pt-BR')
              } catch {
                return 'N/A'
              }
            })()} até{' '}
            {(() => {
              if (!insights.periodoTotal?.fim) return 'N/A'
              try {
                const fim = new Date(insights.periodoTotal.fim)
                if (isNaN(fim.getTime())) return 'N/A'
                return fim.toLocaleDateString('pt-BR')
              } catch {
                return 'N/A'
              }
            })()}
          </p>
        </div>
        <button className="btn-close" onClick={onClose}>✕</button>
      </div>

      {/* Tabs de navegação */}
      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          📈 Visão Geral
        </button>
        <button 
          className={activeTab === 'series' ? 'active' : ''}
          onClick={() => setActiveTab('series')}
        >
          📉 Séries Temporais
        </button>
        <button 
          className={activeTab === 'comparison' ? 'active' : ''}
          onClick={() => setActiveTab('comparison')}
        >
          📊 Comparações
        </button>
        <button 
          className={activeTab === 'alerts' ? 'active' : ''}
          onClick={() => setActiveTab('alerts')}
        >
          🚨 Alertas
        </button>
        <button 
          className={activeTab === 'rawdata' ? 'active' : ''}
          onClick={() => setActiveTab('rawdata')}
        >
          � Dados Brutos
        </button>
        <button 
          className={activeTab === 'aggregated' ? 'active' : ''}
          onClick={() => setActiveTab('aggregated')}
        >
          📊 Dados Agregados
        </button>
      </div>

      {/* Conteúdo das tabs */}
      <div className="dashboard-content">
        {/* TAB: Visão Geral */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {/* Cards de estatísticas */}
            <div className="stats-grid">
              <StatCard
                title="Chuva Acumulada"
                icon="🌧️"
                value={insights.chuvaMedia.toFixed(2)}
                unit="mm"
                subtitle={`Variação: ${insights.chuvaMin.toFixed(1)} - ${insights.chuvaMax.toFixed(1)} mm`}
                trend={insights.tendenciaChuva}
                color="#3b82f6"
              />
              <StatCard
                title="Temperatura da Água"
                icon="🌡️"
                value={insights.tempMedia.toFixed(1)}
                unit="°C"
                subtitle={`Variação: ${insights.tempMin.toFixed(1)} - ${insights.tempMax.toFixed(1)} °C`}
                trend={insights.tendenciaTemp}
                color="#ef4444"
              />
              <StatCard
                title="Bateria"
                icon="🔋"
                value={insights.bateriaMedia.toFixed(2)}
                unit="V"
                subtitle={`Variação: ${insights.bateriaMin.toFixed(1)} - ${insights.bateriaMax.toFixed(1)} V`}
                trend={0}
                color="#10b981"
              />
              <StatCard
                title="Registros"
                icon="📝"
                value={insights.totalRegistros}
                unit=""
                subtitle={`${insights.totalMeses} meses de dados`}
                trend={0}
                color="#8b5cf6"
              />
            </div>

            {/* Seletor de mês para dados diários */}
            <div className="month-selector">
              <label>Visualizar mês:</label>
              <select 
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value)
                  loadMonthData(e.target.value)
                }}
              >
                {comparacaoMensal.map(m => {
                  let label = 'N/A'
                  try {
                    // Usar split para evitar problemas de timezone
                    const [year, month] = m.mes.split('-')
                    const monthNames = [
                      'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
                      'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
                    ]
                    label = `${monthNames[parseInt(month) - 1]} de ${year}`
                  } catch {
                    label = m.mes
                  }
                  
                  return (
                    <option key={m.mes} value={m.mes}>
                      {label}
                    </option>
                  )
                })}
              </select>
            </div>

            {/* Gráficos de dados diários */}
            {agregadoDiario.length > 0 ? (
              <div className="charts-grid">
                <div className="chart-card">
                  <h3>🌧️ Chuva Máxima Diária</h3>
                  <BarChart
                    data={agregadoDiario}
                    xKey="dia"
                    yKey="chuva_maxima"
                    color="#3b82f6"
                    unit="mm"
                  />
                </div>
                <div className="chart-card">
                  <h3>🌡️ Temperatura Média Diária</h3>
                  <LineChart
                    data={agregadoDiario}
                    xKey="dia"
                    yKey="temp_media"
                    color="#ef4444"
                    unit="°C"
                  />
                </div>
              </div>
            ) : selectedMonth ? (
              <div className="empty-state">
                <p>😔 Não há dados disponíveis para o mês selecionado</p>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>Tente selecionar outro mês com registros disponíveis</p>
              </div>
            ) : null}

            {/* Tendências mensais */}
            <div className="chart-card full-width">
              <h3>📊 Tendências Mensais - Comparativo</h3>
              <HistoricalTrends data={comparacaoMensal} />
            </div>
          </div>
        )}

        {/* TAB: Séries Temporais */}
        {activeTab === 'series' && (
          <div className="series-tab">
            <DateRangePicker
              onApply={(start: string, end: string) => {
                setDateRange({ start, end })
                loadSeriesData(start, end)
              }}
            />
            
            {serieChuva.length > 0 && (
              <div className="chart-card">
                <h3>🌧️ Série Temporal - Chuva Acumulada</h3>
                <TimeSeriesChart
                  data={serieChuva}
                  xKey="data"
                  yKey="acumulada"
                  color="#3b82f6"
                  unit="mm"
                />
                <div className="chart-insights">
                  <p><strong>Total de medições:</strong> {serieChuva.length}</p>
                  <p><strong>Período:</strong> {dateRange ? (() => {
                    try {
                      const start = new Date(dateRange.start)
                      const end = new Date(dateRange.end)
                      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'N/A'
                      return `${start.toLocaleDateString('pt-BR')} a ${end.toLocaleDateString('pt-BR')}`
                    } catch {
                      return 'N/A'
                    }
                  })() : 'Todos os dados'}</p>
                </div>
              </div>
            )}

            {serieTemp.length > 0 && (
              <div className="chart-card">
                <h3>🌡️ Série Temporal - Temperatura da Água</h3>
                <TimeSeriesChart
                  data={serieTemp}
                  xKey="data"
                  yKey="agua"
                  secondaryKey="interna"
                  color="#ef4444"
                  secondaryColor="#f59e0b"
                  unit="°C"
                  legend={['Água', 'Interna']}
                />
                <div className="chart-insights">
                  <p><strong>Total de medições:</strong> {serieTemp.length}</p>
                </div>
              </div>
            )}

            {serieChuva.length === 0 && serieTemp.length === 0 && (
              <div className="empty-state">
                <p>Selecione um período para visualizar as séries temporais</p>
              </div>
            )}
          </div>
        )}

        {/* TAB: Comparações */}
        {activeTab === 'comparison' && (
          <div className="comparison-tab">
            <div className="chart-card">
              <h3>📊 Comparação Mensal - Chuva vs Temperatura</h3>
              <MetricComparison data={comparacaoMensal} />
            </div>

            <div className="chart-card">
              <h3>🗓️ Mapa de Calor - Temperatura Média por Mês</h3>
              <MonthlyHeatmap 
                data={comparacaoMensal}
                metric="temp_media"
                title="Temperatura (°C)"
              />
            </div>

            <div className="comparison-table">
              <h3>📋 Tabela Comparativa Mensal</h3>
              <table>
                <thead>
                  <tr>
                    <th>Mês</th>
                    <th>Medições</th>
                    <th>Chuva Máx (mm)</th>
                    <th>Temp Média (°C)</th>
                    <th>Bateria (V)</th>
                  </tr>
                </thead>
                <tbody>
                  {comparacaoMensal.map((m: any) => (
                    <tr key={m.mes}>
                      <td>{new Date(m.mes + '-01').toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' })}</td>
                      <td>{parseInt(m.total_medicoes).toLocaleString()}</td>
                      <td>{parseFloat(m.chuva_maxima).toFixed(2)}</td>
                      <td>{parseFloat(m.temp_media).toFixed(1)}</td>
                      <td>{parseFloat(m.bateria_media).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: Alertas */}
        {activeTab === 'alerts' && alertas && (
          <div className="alerts-tab">
            <div className="alerts-grid">
              <AlertCard
                title="🔥 Temperatura Alta"
                subtitle="Registros com temperatura > 30°C"
                data={alertas.temperaturaAlta}
                severity="warning"
                icon="🌡️"
              />
              <AlertCard
                title="❄️ Temperatura Baixa"
                subtitle="Registros com temperatura < 15°C"
                data={alertas.temperaturaBaixa}
                severity="info"
                icon="🧊"
              />
              <AlertCard
                title="🔋 Bateria Baixa"
                subtitle="Registros com bateria < 12V"
                data={alertas.bateriaBaixa}
                severity="danger"
                icon="⚠️"
              />
            </div>

            <div className="alerts-info">
              <h3>ℹ️ Sobre os Alertas</h3>
              <ul>
                <li><strong>Temperatura Alta:</strong> Valores acima de 30°C podem indicar condições anormais ou problemas no sensor.</li>
                <li><strong>Temperatura Baixa:</strong> Valores abaixo de 15°C são incomuns e devem ser verificados.</li>
                <li><strong>Bateria Baixa:</strong> Valores abaixo de 12V indicam necessidade de manutenção preventiva.</li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB: Dados Brutos */}
        {activeTab === 'rawdata' && (
          <div className="data-tab">
            <DataTable
              title={`Dados Brutos - Estação ${codigoEstacao} - ${selectedMonth}`}
              exportFileName={`dados_brutos_${codigoEstacao}_${selectedMonth}`}
              data={dadosBrutos}
              columns={[
                {
                  key: 'Data_Hora_Medicao',
                  label: 'Data/Hora',
                  sortable: true,
                  filterable: true,
                  format: (value) => {
                    try {
                      const date = new Date(value)
                      if (!isNaN(date.getTime())) {
                        return date.toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      }
                      return value
                    } catch {
                      return value
                    }
                  }
                },
                {
                  key: 'Data_Atualizacao',
                  label: 'Data Atualização',
                  sortable: true,
                  filterable: false,
                  format: (value) => value || 'N/A'
                },
                {
                  key: 'Chuva_Acumulada',
                  label: 'Chuva Acumulada (mm)',
                  sortable: true,
                  filterable: false,
                  format: (value) => value != null ? Number(value).toFixed(2) : 'N/A'
                },
                {
                  key: 'Chuva_Acumulada_Status',
                  label: 'Status Chuva Acum.',
                  sortable: false,
                  filterable: false,
                  format: (value) => value || 'N/A'
                },
                {
                  key: 'Chuva_Adotada',
                  label: 'Chuva Adotada (mm)',
                  sortable: true,
                  filterable: false,
                  format: (value) => value != null ? Number(value).toFixed(2) : 'N/A'
                },
                {
                  key: 'Chuva_Adotada_Status',
                  label: 'Status Chuva Adot.',
                  sortable: false,
                  filterable: false,
                  format: (value) => value || 'N/A'
                },
                {
                  key: 'Cota_Sensor',
                  label: 'Cota Sensor (m)',
                  sortable: true,
                  filterable: false,
                  format: (value) => value != null ? Number(value).toFixed(2) : 'N/A'
                },
                {
                  key: 'Cota_Sensor_Status',
                  label: 'Status Cota Sensor',
                  sortable: false,
                  filterable: false,
                  format: (value) => value || 'N/A'
                },
                {
                  key: 'Cota_Adotada',
                  label: 'Cota Adotada (m)',
                  sortable: true,
                  filterable: false,
                  format: (value) => value != null ? Number(value).toFixed(2) : 'N/A'
                },
                {
                  key: 'Cota_Adotada_Status',
                  label: 'Status Cota Adot.',
                  sortable: false,
                  filterable: false,
                  format: (value) => value || 'N/A'
                },
                {
                  key: 'Cota_Display',
                  label: 'Cota Display (m)',
                  sortable: true,
                  filterable: false,
                  format: (value) => value != null ? Number(value).toFixed(2) : 'N/A'
                },
                {
                  key: 'Cota_Display_Status',
                  label: 'Status Cota Display',
                  sortable: false,
                  filterable: false,
                  format: (value) => value || 'N/A'
                },
                {
                  key: 'Cota_Manual',
                  label: 'Cota Manual (m)',
                  sortable: true,
                  filterable: false,
                  format: (value) => value != null ? Number(value).toFixed(2) : 'N/A'
                },
                {
                  key: 'Cota_Manual_Status',
                  label: 'Status Cota Manual',
                  sortable: false,
                  filterable: false,
                  format: (value) => value || 'N/A'
                },
                {
                  key: 'Vazao_Adotada',
                  label: 'Vazão Adotada (m³/s)',
                  sortable: true,
                  filterable: false,
                  format: (value) => value != null ? Number(value).toFixed(2) : 'N/A'
                },
                {
                  key: 'Vazao_Adotada_Status',
                  label: 'Status Vazão',
                  sortable: false,
                  filterable: false,
                  format: (value) => value || 'N/A'
                },
                {
                  key: 'Temperatura_Agua',
                  label: 'Temp. Água (°C)',
                  sortable: true,
                  filterable: false,
                  format: (value) => value != null ? Number(value).toFixed(2) : 'N/A'
                },
                {
                  key: 'Temperatura_Agua_Status',
                  label: 'Status Temp. Água',
                  sortable: false,
                  filterable: false,
                  format: (value) => value || 'N/A'
                },
                {
                  key: 'Temperatura_Interna',
                  label: 'Temp. Interna (°C)',
                  sortable: true,
                  filterable: false,
                  format: (value) => value != null ? Number(value).toFixed(2) : 'N/A'
                },
                {
                  key: 'Pressao_Atmosferica',
                  label: 'Pressão Atm. (hPa)',
                  sortable: true,
                  filterable: false,
                  format: (value) => value != null ? Number(value).toFixed(2) : 'N/A'
                },
                {
                  key: 'Pressao_Atmosferica_Status',
                  label: 'Status Pressão',
                  sortable: false,
                  filterable: false,
                  format: (value) => value || 'N/A'
                },
                {
                  key: 'Bateria',
                  label: 'Bateria (V)',
                  sortable: true,
                  filterable: false,
                  format: (value) => value != null ? Number(value).toFixed(2) : 'N/A'
                }
              ]}
            />
            
            <div className="data-tab-info">
              <h3>💡 Sobre os Dados Brutos</h3>
              <ul>
                <li><strong>Dados originais:</strong> Todos os campos registrados pela estação telemétrica sem processamento</li>
                <li><strong>Frequência:</strong> Medições realizadas a cada 15 minutos (aprox. 96 registros/dia)</li>
                <li><strong>Chuva:</strong> Valores acumulados e adotados com status de qualidade</li>
                <li><strong>Cota:</strong> Níveis medidos por sensor, display, manual e adotado</li>
                <li><strong>Vazão:</strong> Volume de água adotado em m³/s</li>
                <li><strong>Temperaturas:</strong> Água e interna do equipamento em °C</li>
                <li><strong>Pressão:</strong> Pressão atmosférica em hPa</li>
                <li><strong>Bateria:</strong> Tensão da bateria do equipamento em V</li>
                <li><strong>Status:</strong> Códigos de qualidade para cada medição</li>
              </ul>
              <p>Use os filtros nas colunas para buscar valores específicos e clique nos cabeçalhos para ordenar.</p>
            </div>
          </div>
        )}

        {/* TAB: Dados Agregados */}
        {activeTab === 'aggregated' && (
          <div className="data-tab">
            <DataTable
              title={`Dados Agregados - Estação ${codigoEstacao} - ${selectedMonth}`}
              exportFileName={`dados_agregados_${codigoEstacao}_${selectedMonth}`}
              data={agregadoDiario}
              columns={[
                {
                  key: 'dia',
                  label: 'Data',
                  sortable: true,
                  filterable: true,
                  format: (value) => {
                    try {
                      if (typeof value === 'string' && value.includes('T')) {
                        const date = new Date(value)
                        if (!isNaN(date.getTime())) {
                          return date.toLocaleDateString('pt-BR')
                        }
                      }
                      if (typeof value === 'string' && value.includes('-')) {
                        const parts = value.split('-')
                        const day = parts[2] ? parseInt(parts[2], 10) : value
                        return `${String(day).padStart(2, '0')}/${parts[1]}/${parts[0]}`
                      }
                      return value
                    } catch {
                      return value
                    }
                  }
                },
                {
                  key: 'chuva_maxima',
                  label: 'Chuva Máxima (mm)',
                  sortable: true,
                  filterable: false,
                  format: (value) => value != null ? Number(value).toFixed(2) : 'N/A'
                },
                {
                  key: 'temp_media',
                  label: 'Temp. Média (°C)',
                  sortable: true,
                  filterable: false,
                  format: (value) => value != null ? Number(value).toFixed(2) : 'N/A'
                },
                {
                  key: 'temp_minima',
                  label: 'Temp. Mínima (°C)',
                  sortable: true,
                  filterable: false,
                  format: (value) => value != null ? Number(value).toFixed(2) : 'N/A'
                },
                {
                  key: 'temp_maxima',
                  label: 'Temp. Máxima (°C)',
                  sortable: true,
                  filterable: false,
                  format: (value) => value != null ? Number(value).toFixed(2) : 'N/A'
                },
                {
                  key: 'bateria_media',
                  label: 'Bateria Média (V)',
                  sortable: true,
                  filterable: false,
                  format: (value) => value != null ? Number(value).toFixed(2) : 'N/A'
                },
                {
                  key: 'total_medicoes',
                  label: 'Total Medições',
                  sortable: true,
                  filterable: false,
                  format: (value) => value != null ? value.toString() : '0'
                }
              ]}
            />
            
            <div className="data-tab-info">
              <h3>💡 Sobre os Dados Agregados</h3>
              <ul>
                <li><strong>Dados transformados:</strong> Agregação diária dos registros brutos</li>
                <li><strong>Chuva Máxima:</strong> Maior valor de chuva acumulada registrado no dia</li>
                <li><strong>Temperaturas:</strong> Média, mínima e máxima calculadas a partir de todos os registros do dia</li>
                <li><strong>Bateria:</strong> Tensão média da bateria ao longo do dia</li>
                <li><strong>Total Medições:</strong> Quantidade de registros brutos usados no cálculo (ideal: 96)</li>
              </ul>
              <p>Use os filtros nas colunas para buscar valores específicos e clique nos cabeçalhos para ordenar.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
