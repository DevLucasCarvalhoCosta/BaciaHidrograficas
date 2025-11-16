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
  DataTable,
  MonthlyComparisonChart,
  TrendInsights,
  MethodologyExplainer
} from './dashboard'

interface StationDashboardProps {
  codigoEstacao: string
  nomeEstacao?: string
  onClose: () => void
}

export const StationDashboard: React.FC<StationDashboardProps> = ({ codigoEstacao, nomeEstacao, onClose }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'series' | 'comparison' | 'alerts' | 'rawdata' | 'aggregated' | 'methodology'>('overview')
  
  // Estados para dados
  const [stats, setStats] = useState<any>(null)
  const [serieChuva, setSerieChuva] = useState<any[]>([])
  const [serieTemp, setSerieTemp] = useState<any[]>([])
  const [serieCota, setSerieCota] = useState<any[]>([])
  const [serieVazao, setSerieVazao] = useState<any[]>([])
  const [comparacaoMensal, setComparacaoMensal] = useState<any[]>([])
  const [alertas, setAlertas] = useState<any>(null)
  const [agregadoDiario, setAgregadoDiario] = useState<any[]>([])
  const [dadosBrutos, setDadosBrutos] = useState<any[]>([])
  
  // Filtros de período
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>('')

  // Carregar dados iniciais
  useEffect(() => {
    // Limpar dados anteriores ao trocar de estação
    setSerieChuva([])
    setSerieTemp([])
    setSerieCota([])
    setSerieVazao([])
    setAgregadoDiario([])
    setDadosBrutos([])
    setDateRange(null)
    setActiveTab('overview')
    
    loadData()
  }, [codigoEstacao])

  // Carregar séries temporais quando mudar para a aba "series"
  useEffect(() => {
    console.log('🔄 [useEffect-series] Mudança de aba detectada');
    console.log('   Active Tab:', activeTab);
    
    if (activeTab === 'series') {
      console.log('   ▶️ Carregando séries temporais');
      loadSeriesData(undefined, undefined)
    }
  }, [activeTab])

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
      const errorMessage = err.message || 'Erro ao carregar dados'
      
      // Se for erro 403 (estação não permitida ou sem dados), fechar o dashboard
      if (errorMessage.includes('Estação não permitida') || errorMessage.includes('não encontrada')) {
        alert(`⚠️ Esta estação não possui dados sincronizados.\n\nPara visualizar o dashboard, primeiro sincronize os dados na aba "Sincronização".`)
        onClose() // Fechar o dashboard
        return
      }
      
      setError(errorMessage)
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
    console.log('🔍 [loadSeriesData] Iniciando carregamento de séries temporais');
    console.log('   Código Estação:', codigoEstacao);
    console.log('   Data Início:', dataInicio);
    console.log('   Data Fim:', dataFim);
    
    try {
      const params: any = {};
      
      // Sempre usar dados agregados por dia
      if (dataInicio && dataInicio.trim() !== '') {
        params.dataInicio = dataInicio;
        console.log('   ✓ Filtro dataInicio:', dataInicio);
      }
      if (dataFim && dataFim.trim() !== '') {
        params.dataFim = dataFim;
        console.log('   ✓ Filtro dataFim:', dataFim);
      }
      
      console.log('   📊 Buscando dados agregados por dia');
      console.log('   📡 Params finais:', params);
      
      const [chuvaRes, tempRes, cotaRes, vazaoRes] = await Promise.all([
        api.get(`/api/dashboard/serie-chuva/${codigoEstacao}`, { params }).catch(() => ({ dados: [], total: 0 })),
        api.get(`/api/dashboard/serie-temperatura/${codigoEstacao}`, { params }).catch(() => ({ dados: [], total: 0 })),
        api.get(`/api/dashboard/serie-cota/${codigoEstacao}`, { params }).catch(() => ({ dados: [], total: 0 })),
        api.get(`/api/dashboard/serie-vazao/${codigoEstacao}`, { params }).catch(() => ({ dados: [], total: 0 }))
      ]);
      
      console.log('   ✅ Resposta Chuva:', {
        total: chuvaRes.total,
        dadosLength: chuvaRes.dados?.length || 0
      });
      console.log('   ✅ Resposta Temperatura:', {
        total: tempRes.total,
        dadosLength: tempRes.dados?.length || 0
      });
      console.log('   ✅ Resposta Cota:', {
        total: cotaRes.total,
        dadosLength: cotaRes.dados?.length || 0
      });
      console.log('   ✅ Resposta Vazão:', {
        total: vazaoRes.total,
        dadosLength: vazaoRes.dados?.length || 0
      });
      
      setSerieChuva(chuvaRes.dados || []);
      setSerieTemp(tempRes.dados || []);
      setSerieCota(cotaRes.dados || []);
      setSerieVazao(vazaoRes.dados || []);
      
      console.log('   ✓ Estados atualizados com sucesso');
    } catch (err) {
      console.error('❌ [loadSeriesData] Erro ao carregar séries temporais:', err);
    }
  };

  // Calcular insights
  const insights = useMemo(() => {
    if (!stats?.estatisticas || !comparacaoMensal.length) return null

    const est = stats.estatisticas
    const ultimoMes = comparacaoMensal[comparacaoMensal.length - 1]
    const penultimoMes = comparacaoMensal[comparacaoMensal.length - 2]
    
    const tendenciaChuva = ultimoMes && penultimoMes && ultimoMes.chuva_mensal && penultimoMes.chuva_mensal
      ? ((parseFloat(ultimoMes.chuva_mensal) - parseFloat(penultimoMes.chuva_mensal)) / parseFloat(penultimoMes.chuva_mensal)) * 100
      : 0
    
    const tendenciaTemp = ultimoMes && penultimoMes && ultimoMes.temp_media && penultimoMes.temp_media
      ? ((parseFloat(ultimoMes.temp_media) - parseFloat(penultimoMes.temp_media)) / parseFloat(penultimoMes.temp_media)) * 100
      : 0
    
    const tendenciaCota = ultimoMes && penultimoMes && ultimoMes.cota_media && penultimoMes.cota_media
      ? ((parseFloat(ultimoMes.cota_media) - parseFloat(penultimoMes.cota_media)) / parseFloat(penultimoMes.cota_media)) * 100
      : 0
    
    const tendenciaVazao = ultimoMes && penultimoMes && ultimoMes.vazao_media && penultimoMes.vazao_media
      ? ((parseFloat(ultimoMes.vazao_media) - parseFloat(penultimoMes.vazao_media)) / parseFloat(penultimoMes.vazao_media)) * 100
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
      cotaMin: parseFloat(est.cota_min || 0),
      cotaMax: parseFloat(est.cota_max || 0),
      cotaMedia: parseFloat(est.cota_media || 0),
      vazaoMin: parseFloat(est.vazao_min || 0),
      vazaoMax: parseFloat(est.vazao_max || 0),
      vazaoMedia: parseFloat(est.vazao_media || 0),
      tendenciaChuva,
      tendenciaTemp,
      tendenciaCota,
      tendenciaVazao,
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
          <h1>📊 Dashboard - {nomeEstacao || `Estação ${codigoEstacao}`}</h1>
          <p className="subtitle">
            Código: <strong>{codigoEstacao}</strong> • {insights.totalRegistros.toLocaleString()} registros
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
        <button 
          className={activeTab === 'methodology' ? 'active' : ''}
          onClick={() => setActiveTab('methodology')}
        >
          📚 Guia Metodológico
        </button>
      </div>

      {/* Conteúdo das tabs */}
      <div className="dashboard-content">
        {/* TAB: Visão Geral */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {/* Cards de estatísticas */}
            <div className="stats-grid">
              {insights.cotaMedia > 0 && (
                <StatCard
                  title="Nível do Rio"
                  icon="🌊"
                  value={insights.cotaMedia.toFixed(2)}
                  unit="m"
                  subtitle={`Variação: ${insights.cotaMin.toFixed(2)} - ${insights.cotaMax.toFixed(2)} m`}
                  trend={insights.tendenciaCota}
                  color="#0ea5e9"
                />
              )}
              {insights.vazaoMedia > 0 && (
                <StatCard
                  title="Vazão"
                  icon="💧"
                  value={insights.vazaoMedia.toFixed(2)}
                  unit="m³/s"
                  subtitle={`Variação: ${insights.vazaoMin.toFixed(2)} - ${insights.vazaoMax.toFixed(2)} m³/s`}
                  trend={insights.tendenciaVazao}
                  color="#06b6d4"
                />
              )}
              {insights.chuvaMedia > 0 && (
                <StatCard
                  title="Chuva Diária (Média)"
                  icon="🌧️"
                  value={insights.chuvaMedia.toFixed(2)}
                  unit="mm"
                  subtitle={`Variação: ${insights.chuvaMin.toFixed(1)} - ${insights.chuvaMax.toFixed(1)} mm/dia`}
                  trend={insights.tendenciaChuva}
                  color="#3b82f6"
                />
              )}
              {insights.tempMedia > 0 && (
                <StatCard
                  title="Temperatura da Água"
                  icon="🌡️"
                  value={insights.tempMedia.toFixed(1)}
                  unit="°C"
                  subtitle={`Variação: ${insights.tempMin.toFixed(1)} - ${insights.tempMax.toFixed(1)} °C`}
                  trend={insights.tendenciaTemp}
                  color="#ef4444"
                />
              )}
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
                {agregadoDiario.some(d => d.cota_media && parseFloat(d.cota_media) > 0) && (
                  <div className="chart-card">
                    <h3>🌊 Nível do Rio - Evolução Diária</h3>
                    <p className="chart-description">
                      Monitoramento do <strong>nível médio do rio</strong> ao longo dos dias do mês selecionado. 
                      O nível representa a altura da superfície da água medida em metros. 
                      Aumentos significativos podem indicar risco de enchentes, enquanto quedas acentuadas podem sinalizar estiagem.
                    </p>
                    <LineChart
                      data={agregadoDiario.filter(d => d.cota_media && parseFloat(d.cota_media) > 0)}
                      xKey="dia"
                      yKey="cota_media"
                      color="#0ea5e9"
                      unit="m"
                    />
                    <div className="chart-legend">
                      <span className="legend-item">
                        <span className="legend-point" style={{ background: '#0ea5e9' }}></span>
                        Cada ponto = 1 dia
                      </span>
                      <span className="legend-item">
                        <span className="legend-line" style={{ borderLeft: '2px solid #0ea5e9', opacity: 0.8 }}></span>
                        Tendência do nível
                      </span>
                    </div>
                  </div>
                )}
                {agregadoDiario.some(d => d.vazao_media && parseFloat(d.vazao_media) > 0) && (
                  <div className="chart-card">
                    <h3>💧 Vazão - Volume de Água Diário</h3>
                    <p className="chart-description">
                      Medição do <strong>volume de água que passa pela seção do rio</strong> em metros cúbicos por segundo (m³/s). 
                      Cada barra representa a vazão média diária. A vazão é essencial para gestão hídrica, geração de energia e navegação.
                    </p>
                    <BarChart
                      data={agregadoDiario.filter(d => d.vazao_media && parseFloat(d.vazao_media) > 0)}
                      xKey="dia"
                      yKey="vazao_media"
                      color="#06b6d4"
                      unit="m³/s"
                    />
                    <div className="chart-legend">
                      <span className="legend-item">
                        <span className="legend-bar" style={{ background: 'linear-gradient(180deg, #06b6d4 0%, rgba(6, 182, 212, 0.7) 100%)' }}></span>
                        Cada barra = 1 dia
                      </span>
                      <span className="legend-item">
                        <span className="legend-line" style={{ borderLeft: '2px dashed #f3f4f6' }}></span>
                        Grade diária
                      </span>
                    </div>
                  </div>
                )}
                {agregadoDiario.some(d => d.chuva_diaria && parseFloat(d.chuva_diaria) > 0) && (
                  <div className="chart-card">
                    <h3>🌧️ Chuva Diária</h3>
                    <p className="chart-description">
                      Este gráfico mostra o <strong>total de precipitação registrado em cada dia</strong> do mês selecionado. 
                      O valor representa a soma de todas as medições de chuva_adotada do dia em milímetros (mm). 
                      Útil para correlacionar com variações no nível do rio e entender o impacto das chuvas na bacia hidrográfica.
                    </p>
                    <BarChart
                      data={agregadoDiario.filter(d => d.chuva_diaria && parseFloat(d.chuva_diaria) > 0)}
                      xKey="dia"
                      yKey="chuva_diaria"
                      color="#3b82f6"
                      unit="mm"
                    />
                    <div className="chart-legend">
                      <span className="legend-item">
                        <span className="legend-bar" style={{ background: 'linear-gradient(180deg, #3b82f6 0%, rgba(59, 130, 246, 0.7) 100%)' }}></span>
                        Cada barra = 1 dia
                      </span>
                      <span className="legend-item">
                        <span className="legend-line" style={{ borderLeft: '2px dashed #f3f4f6' }}></span>
                        Grade diária
                      </span>
                    </div>
                  </div>
                )}
                {agregadoDiario.some(d => d.temp_media && parseFloat(d.temp_media) > 0) && (
                  <div className="chart-card">
                    <h3>🌡️ Temperatura Média Diária</h3>
                    <p className="chart-description">
                      Apresenta a <strong>temperatura média da água</strong> calculada a partir de todas as medições do dia. 
                      Cada ponto na linha representa um dia do mês. Variações abruptas podem indicar mudanças climáticas ou entrada de afluentes. 
                      A temperatura ideal varia entre 20-25°C para a maioria dos ecossistemas aquáticos.
                    </p>
                    <LineChart
                      data={agregadoDiario.filter(d => d.temp_media && parseFloat(d.temp_media) > 0)}
                      xKey="dia"
                      yKey="temp_media"
                      color="#ef4444"
                      unit="°C"
                    />
                    <div className="chart-legend">
                      <span className="legend-item">
                        <span className="legend-point" style={{ background: '#ef4444' }}></span>
                        Cada ponto = 1 dia
                      </span>
                      <span className="legend-item">
                        <span className="legend-line" style={{ borderLeft: '2px solid #ef4444', opacity: 0.8 }}></span>
                        Tendência diária
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : selectedMonth ? (
              <div className="empty-state">
                <p>😔 Não há dados disponíveis para o mês selecionado</p>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>Tente selecionar outro mês com registros disponíveis</p>
              </div>
            ) : null}

            {/* Tendências mensais - Gráfico Comparativo Profissional */}
            <div className="chart-card full-width">
              <h3>📊 Tendências Mensais - Comparativo Integrado</h3>
              <MonthlyComparisonChart data={comparacaoMensal} />
            </div>

            {/* Análise de Tendências Históricas Avançada */}
            <div className="chart-card full-width">
              <HistoricalTrends data={comparacaoMensal} />
            </div>

            {/* Insights Inteligentes Profissionais */}
            <div className="chart-card full-width">
              <TrendInsights data={comparacaoMensal} />
            </div>
          </div>
        )}

        {/* TAB: Séries Temporais */}
        {activeTab === 'series' && (
          <div className="series-tab">
            <DateRangePicker
              onApply={(start: string, end: string) => {
                console.log('📅 [DateRangePicker] Aplicar período:', { start, end });
                setDateRange({ start, end })
                loadSeriesData(start, end)
              }}
              onViewAll={() => {
                console.log('📅 [DateRangePicker] Ver todos os dados');
                setDateRange(null)
                loadSeriesData(undefined, undefined)
              }}
            />
            
            {serieCota.length > 0 && (
              <div className="chart-card">
                <h3>🌊 Série Temporal - Nível do Rio</h3>
                <p className="chart-description">
                  <strong>Visualização por dia</strong> {dateRange ? 'do período selecionado' : 'de todo o histórico disponível'}. 
                  Cada ponto representa o <strong>nível médio do rio em metros</strong>. 
                  O nível do rio é fundamental para monitoramento de cheias e gestão de recursos hídricos.
                </p>
                <TimeSeriesChart
                  data={serieCota}
                  xKey="data"
                  yKey="cota_media"
                  color="#0ea5e9"
                  unit="m"
                />
                <div className="chart-insights">
                  <p><strong>Total de dias:</strong> {serieCota.length.toLocaleString()}</p>
                  <p><strong>Período:</strong> {dateRange ? (() => {
                    try {
                      const start = new Date(dateRange.start)
                      const end = new Date(dateRange.end)
                      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'N/A'
                      return `${start.toLocaleDateString('pt-BR')} a ${end.toLocaleDateString('pt-BR')}`
                    } catch {
                      return 'N/A'
                    }
                  })() : 'Todo o histórico'}</p>
                </div>
              </div>
            )}

            {serieVazao.length > 0 && (
              <div className="chart-card">
                <h3>💧 Série Temporal - Vazão</h3>
                <p className="chart-description">
                  <strong>Médias diárias de vazão</strong> {dateRange ? 'do período selecionado' : 'de todo o histórico disponível'}. 
                  Cada ponto representa o <strong>volume médio de água que passou pela seção do rio</strong> em metros cúbicos por segundo. 
                  Essencial para planejamento de uso múltiplo da água.
                </p>
                <TimeSeriesChart
                  data={serieVazao}
                  xKey="data"
                  yKey="vazao_media"
                  color="#06b6d4"
                  unit="m³/s"
                />
                <div className="chart-insights">
                  <p><strong>Total de dias:</strong> {serieVazao.length.toLocaleString()}</p>
                </div>
              </div>
            )}
            
            {serieChuva.length > 0 && (
              <div className="chart-card">
                <h3>🌧️ Série Temporal - Chuva Diária</h3>
                <p className="chart-description">
                  <strong>Visualização por dia</strong> {dateRange ? 'do período selecionado' : 'de todo o histórico disponível'}. 
                  Cada ponto representa o <strong>total de chuva do dia</strong> (soma de chuva_adotada em MM). 
                  Ideal para correlacionar com variações no nível do rio e entender padrões de precipitação na bacia.
                </p>
                <TimeSeriesChart
                  data={serieChuva}
                  xKey="data"
                  yKey="chuva_diaria"
                  color="#3b82f6"
                  unit="mm"
                />
                <div className="chart-insights">
                  <p><strong>Total de dias:</strong> {serieChuva.length.toLocaleString()}</p>
                  <p><strong>Período:</strong> {dateRange ? (() => {
                    try {
                      const start = new Date(dateRange.start)
                      const end = new Date(dateRange.end)
                      if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'N/A'
                      return `${start.toLocaleDateString('pt-BR')} a ${end.toLocaleDateString('pt-BR')}`
                    } catch {
                      return 'N/A'
                    }
                  })() : 'Todo o histórico'}</p>
                </div>
              </div>
            )}

            {serieTemp.length > 0 && (
              <div className="chart-card">
                <h3>🌡️ Série Temporal - Temperatura da Água</h3>
                <p className="chart-description">
                  <strong>Médias diárias de temperatura da água</strong> {dateRange ? 'do período selecionado' : 'de todo o histórico disponível'}. 
                  Cada ponto representa a <strong>temperatura média da água</strong> do dia. 
                  As medições originais são feitas a cada 15 minutos e agregadas diariamente.
                </p>
                <TimeSeriesChart
                  data={serieTemp}
                  xKey="data"
                  yKey="agua"
                  color="#ef4444"
                  unit="°C"
                  legend={['Temperatura da Água']}
                />
                <div className="chart-insights">
                  <p><strong>Total de dias:</strong> {serieTemp.length.toLocaleString()}</p>
                </div>
              </div>
            )}

            {serieCota.length === 0 && serieVazao.length === 0 && serieChuva.length === 0 && serieTemp.length === 0 && (
              <div className="empty-state">
                <p>⏳ Carregando séries temporais ou sem dados disponíveis...</p>
                <p style={{ fontSize: '14px', color: '#6b7280' }}>
                  Aguarde enquanto carregamos os dados
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB: Comparações */}
        {activeTab === 'comparison' && (
          <div className="comparison-tab">
            <div className="chart-card">
              <h3>📊 Comparação Mensal - Chuva vs Temperatura</h3>
              <p className="chart-description">
                Gráfico de <strong>duplo eixo</strong> que sobrepõe precipitação e temperatura mensais para análise correlacional. 
                Permite identificar relações inversas típicas (mais chuva → temperatura menor) ou anomalias que indicam 
                mudanças nos padrões climáticos locais. Essencial para estudos de impacto hidrológico.
              </p>
              <MetricComparison data={comparacaoMensal} />
            </div>

            <div className="chart-card">
              <h3>🗓️ Mapa de Calor - Temperatura Média por Mês</h3>
              <p className="chart-description">
                <strong>Visualização matricial colorida</strong> que facilita a identificação rápida de períodos com temperaturas 
                anormalmente altas (vermelho) ou baixas (azul). Cores mais intensas indicam desvios maiores da média histórica. 
                Útil para detectar tendências sazonais e eventos climáticos extremos.
              </p>
              <MonthlyHeatmap 
                data={comparacaoMensal}
                metric="temp_media"
                title="Temperatura (°C)"
              />
            </div>

            <div className="comparison-table">
              <h3>📋 Tabela Comparativa Mensal</h3>
              <p className="chart-description">
                Dados consolidados mês a mês com <strong>valores numéricos precisos</strong> para análises detalhadas. 
                Inclui volume de medições (completude dos dados), precipitação mensal e médias térmicas. 
                Exportável para análises estatísticas externas e relatórios técnicos.
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Mês</th>
                    <th>Medições</th>
                    <th>Chuva Mensal (mm)</th>
                    <th>Temp Média (°C)</th>
                  </tr>
                </thead>
                <tbody>
                  {comparacaoMensal.map((m: any) => (
                    <tr key={m.mes}>
                      <td>{new Date(m.mes + '-01').toLocaleDateString('pt-BR', { year: 'numeric', month: 'long' })}</td>
                      <td>{parseInt(m.total_medicoes).toLocaleString()}</td>
                      <td>{m.chuva_mensal ? parseFloat(m.chuva_mensal).toFixed(2) : 'N/A'}</td>
                      <td>{m.temp_media ? parseFloat(m.temp_media).toFixed(1) : 'N/A'}</td>
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
            </div>

            <div className="alerts-info">
              <h3>ℹ️ Sobre os Alertas</h3>
              <ul>
                <li><strong>Temperatura Alta:</strong> Valores acima de 30°C podem indicar condições anormais ou problemas no sensor.</li>
                <li><strong>Temperatura Baixa:</strong> Valores abaixo de 15°C são incomuns e devem ser verificados.</li>
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
                  key: 'Temp_Interna',
                  label: 'Temp. Interna (°C)',
                  sortable: true,
                  filterable: false,
                  format: (value) => value != null ? Number(value).toFixed(1) : 'N/A'
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
                  key: 'chuva_diaria',
                  label: 'Chuva Diária (mm)',
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
                <li><strong>Chuva Diária:</strong> Soma de todos os valores de chuva_adotada registrados no dia (total de precipitação em mm)</li>
                <li><strong>Temperaturas:</strong> Média, mínima e máxima calculadas a partir de todos os registros do dia</li>
                <li><strong>Total Medições:</strong> Quantidade de registros brutos usados no cálculo (ideal: 96)</li>
              </ul>
              <p>Use os filtros nas colunas para buscar valores específicos e clique nos cabeçalhos para ordenar.</p>
            </div>
          </div>
        )}

        {/* TAB: Guia Metodológico */}
        {activeTab === 'methodology' && (
          <div className="methodology-tab">
            <MethodologyExplainer />
          </div>
        )}
      </div>
    </div>
  )
}
