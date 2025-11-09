import React, { useMemo, useState } from 'react'

interface HistoricalTrendsProps {
  data: any[]
}

interface TooltipProps {
  title: string
  content: string | React.ReactNode
}

const InfoTooltip: React.FC<TooltipProps> = ({ title, content }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const tooltipRef = React.useRef<HTMLDivElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const tooltipWidth = 380
      const viewportWidth = window.innerWidth
      
      let left = rect.right + 8
      let top = rect.top
      
      // Se não couber na direita, coloca na esquerda
      if (left + tooltipWidth > viewportWidth - 20) {
        left = rect.left - tooltipWidth - 8
      }
      
      // Se ainda não couber, centraliza
      if (left < 20) {
        left = Math.max(20, (viewportWidth - tooltipWidth) / 2)
        top = rect.bottom + 8
      }
      
      setPosition({ top, left })
    }
  }

  React.useEffect(() => {
    if (isVisible && tooltipRef.current) {
      const hasScroll = tooltipRef.current.scrollHeight > tooltipRef.current.clientHeight
      if (hasScroll) {
        tooltipRef.current.classList.add('has-scroll')
      } else {
        tooltipRef.current.classList.remove('has-scroll')
      }
      updatePosition()
    }
  }, [isVisible])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isPinned &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsPinned(false)
        setIsVisible(false)
      }
    }

    const handleScroll = () => {
      if (isVisible) {
        updatePosition()
      }
    }

    if (isPinned) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    if (isVisible) {
      window.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', handleScroll)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleScroll)
    }
  }, [isPinned, isVisible])

  const handleMouseEnter = () => {
    if (!isPinned) {
      setIsVisible(true)
    }
  }

  const handleMouseLeave = () => {
    if (!isPinned) {
      setIsVisible(false)
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isPinned) {
      setIsPinned(false)
      setIsVisible(false)
    } else {
      setIsPinned(true)
      setIsVisible(true)
    }
  }

  return (
    <div className="tooltip-container" ref={containerRef}>
      <button
        ref={buttonRef}
        className={`info-icon ${isPinned ? 'pinned' : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        aria-label="Informação"
      />
      {isVisible && (
        <div 
          ref={tooltipRef}
          className="tooltip-content" 
          style={{ top: `${position.top}px`, left: `${position.left}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <h4>{title}</h4>
          {typeof content === 'string' ? <p>{content}</p> : content}
        </div>
      )}
    </div>
  )
}

interface TrendAnalysis {
  periodo: string
  meses: number
  chuva: {
    start: number
    end: number
    change: number
    avg: number
    max: number
    min: number
    stdDev: number
    coefficient: number // Coeficiente de variação
  }
  temp: {
    start: number
    end: number
    change: number
    avg: number
    max: number
    min: number
    stdDev: number
    amplitude: number
  }
  bateria: {
    start: number
    end: number
    change: number
    avg: number
    status: 'excelente' | 'bom' | 'adequado' | 'crítico'
  }
  sazonalidade: {
    periodoMaisChuvoso: string
    periodoMaisQuente: string
    periodoMaisFrio: string
  }
  correlacao: {
    chuvaTempNegativa: boolean
    intensidade: 'forte' | 'moderada' | 'fraca'
  }
}

export const HistoricalTrends: React.FC<HistoricalTrendsProps> = ({ data }) => {
  const trends = useMemo(() => {
    if (data.length < 2) return null
    
    const firstMonth = data[0]
    const lastMonth = data[data.length - 1]
    
    // Valores numéricos
    const chuvaValues = data.map(d => parseFloat(d.chuva_maxima))
    const tempValues = data.map(d => parseFloat(d.temp_media))
    const bateriaValues = data.map(d => parseFloat(d.bateria_media))
    
    // Cálculos estatísticos - Chuva
    const chuvaAvg = chuvaValues.reduce((a, b) => a + b, 0) / chuvaValues.length
    const chuvaMax = Math.max(...chuvaValues)
    const chuvaMin = Math.min(...chuvaValues)
    const chuvaStdDev = Math.sqrt(chuvaValues.reduce((sq, n) => sq + Math.pow(n - chuvaAvg, 2), 0) / chuvaValues.length)
    const chuvaCoefficient = (chuvaStdDev / chuvaAvg) * 100
    
    // Cálculos estatísticos - Temperatura
    const tempAvg = tempValues.reduce((a, b) => a + b, 0) / tempValues.length
    const tempMax = Math.max(...tempValues)
    const tempMin = Math.min(...tempValues)
    const tempStdDev = Math.sqrt(tempValues.reduce((sq, n) => sq + Math.pow(n - tempAvg, 2), 0) / tempValues.length)
    const tempAmplitude = tempMax - tempMin
    
    // Cálculos estatísticos - Bateria
    const bateriaAvg = bateriaValues.reduce((a, b) => a + b, 0) / bateriaValues.length
    let bateriaStatus: 'excelente' | 'bom' | 'adequado' | 'crítico'
    if (bateriaAvg >= 13) bateriaStatus = 'excelente'
    else if (bateriaAvg >= 12.5) bateriaStatus = 'bom'
    else if (bateriaAvg >= 12) bateriaStatus = 'adequado'
    else bateriaStatus = 'crítico'
    
    // Mudanças percentuais
    const chuvaChange = ((parseFloat(lastMonth.chuva_maxima) - parseFloat(firstMonth.chuva_maxima)) / parseFloat(firstMonth.chuva_maxima)) * 100
    const tempChange = ((parseFloat(lastMonth.temp_media) - parseFloat(firstMonth.temp_media)) / parseFloat(firstMonth.temp_media)) * 100
    const bateriaChange = ((parseFloat(lastMonth.bateria_media) - parseFloat(firstMonth.bateria_media)) / parseFloat(firstMonth.bateria_media)) * 100
    
    // Identificar sazonalidade - encontrar diretamente no array original de dados
    
    // Buscar o mês com maior chuva
    let mesComMaiorChuva = data[0]
    let maiorChuva = parseFloat(data[0].chuva_maxima)
    for (let i = 1; i < data.length; i++) {
      const chuvaAtual = parseFloat(data[i].chuva_maxima)
      if (chuvaAtual > maiorChuva) {
        maiorChuva = chuvaAtual
        mesComMaiorChuva = data[i]
      }
    }
    
    // Buscar o mês com maior temperatura
    let mesComMaiorTemp = data[0]
    let maiorTemp = parseFloat(data[0].temp_media)
    for (let i = 1; i < data.length; i++) {
      const tempAtual = parseFloat(data[i].temp_media)
      if (tempAtual > maiorTemp) {
        maiorTemp = tempAtual
        mesComMaiorTemp = data[i]
      }
    }
    
    // Buscar o mês com menor temperatura
    let mesComMenorTemp = data[0]
    let menorTemp = parseFloat(data[0].temp_media)
    for (let i = 1; i < data.length; i++) {
      const tempAtual = parseFloat(data[i].temp_media)
      if (tempAtual < menorTemp) {
        menorTemp = tempAtual
        mesComMenorTemp = data[i]
      }
    }
    
    const formatMes = (mes: string) => {
      try {
        // Extrai ano e mês separadamente para evitar problemas de timezone
        const [ano, mesNumero] = mes.split('-')
        const date = new Date(parseInt(ano), parseInt(mesNumero) - 1, 15) // Dia 15 para evitar problemas de timezone
        if (!isNaN(date.getTime())) {
          const formatted = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
          return formatted
        }
      } catch {
        return mes
      }
      return mes
    }
    
    // Análise de correlação (simplificada)
    let somaChuvaTempProduto = 0
    for (let i = 0; i < data.length; i++) {
      somaChuvaTempProduto += (chuvaValues[i] - chuvaAvg) * (tempValues[i] - tempAvg)
    }
    const correlacao = somaChuvaTempProduto / (data.length * chuvaStdDev * tempStdDev)
    const chuvaTempNegativa = correlacao < -0.3
    const intensidadeCorrelacao: 'forte' | 'moderada' | 'fraca' = 
      Math.abs(correlacao) > 0.6 ? 'forte' : Math.abs(correlacao) > 0.3 ? 'moderada' : 'fraca'
    
    return {
      periodo: `${formatMes(firstMonth.mes)} → ${formatMes(lastMonth.mes)}`,
      meses: data.length,
      chuva: {
        start: parseFloat(firstMonth.chuva_maxima),
        end: parseFloat(lastMonth.chuva_maxima),
        change: chuvaChange,
        avg: chuvaAvg,
        max: chuvaMax,
        min: chuvaMin,
        stdDev: chuvaStdDev,
        coefficient: chuvaCoefficient
      },
      temp: {
        start: parseFloat(firstMonth.temp_media),
        end: parseFloat(lastMonth.temp_media),
        change: tempChange,
        avg: tempAvg,
        max: tempMax,
        min: tempMin,
        stdDev: tempStdDev,
        amplitude: tempAmplitude
      },
      bateria: {
        start: parseFloat(firstMonth.bateria_media),
        end: parseFloat(lastMonth.bateria_media),
        change: bateriaChange,
        avg: bateriaAvg,
        status: bateriaStatus
      },
      sazonalidade: {
        periodoMaisChuvoso: formatMes(mesComMaiorChuva.mes),
        periodoMaisQuente: formatMes(mesComMaiorTemp.mes),
        periodoMaisFrio: formatMes(mesComMenorTemp.mes)
      },
      correlacao: {
        chuvaTempNegativa,
        intensidade: intensidadeCorrelacao
      }
    }
  }, [data])

  if (!trends) {
    return <div className="chart-empty">Dados insuficientes para análise de tendências (mínimo 2 meses necessário)</div>
  }

  const getTrendIcon = (value: number) => {
    if (value > 5) return '📈'
    if (value < -5) return '📉'
    return '➡️'
  }

  const getTrendColor = (value: number) => {
    if (value > 5) return '#10b981'
    if (value < -5) return '#ef4444'
    return '#6b7280'
  }

  const getBateriaColor = (status: string) => {
    const colors = {
      'excelente': '#10b981',
      'bom': '#3b82f6',
      'adequado': '#f59e0b',
      'crítico': '#ef4444'
    }
    return colors[status as keyof typeof colors] || '#6b7280'
  }

  return (
    <div className="historical-trends-advanced">
      <div className="trends-header">
        <div className="header-main">
          <h4>📊 Análise de Tendências Históricas</h4>
          <span className="period-badge">{trends.meses} meses analisados</span>
        </div>
        <p className="trends-period">{trends.periodo}</p>
      </div>
      
      {/* Cards de métricas principais */}
      <div className="trends-grid-enhanced">
        {/* Card Chuva */}
        <div className="trend-card-enhanced" style={{ position: 'relative' }}>
          <InfoTooltip
            title="Análise de Precipitação"
            content={
              <>
                <p>
                  <strong>Chuva Máxima Mensal</strong> representa o maior valor de precipitação 
                  registrado em cada mês do período analisado.
                </p>
                <div className="tooltip-section">
                  <div className="tooltip-section-title">📊 Métricas Calculadas:</div>
                  <ul>
                    <li><strong>Média:</strong> Valor médio das máximas mensais</li>
                    <li><strong>Máximo/Mínimo:</strong> Extremos observados no período</li>
                    <li><strong>Variabilidade:</strong> Coeficiente de variação (CV = σ/μ × 100)</li>
                  </ul>
                </div>
                <div className="tooltip-note">
                  💡 CV {'>'} 40% indica alta variabilidade pluviométrica, 
                  característico de climas tropicais com estações bem definidas.
                </div>
              </>
            }
          />
          <div className="trend-card-header">
            <span className="trend-icon-large">🌧️</span>
            <div>
              <h5>Precipitação</h5>
              <p className="metric-subtitle">Chuva Máxima Mensal</p>
            </div>
          </div>
          
          <div className="trend-values-enhanced">
            <div className="value-box">
              <span className="value-label">Início</span>
              <span className="value-number">{trends.chuva.start.toFixed(2)}</span>
              <span className="value-unit">mm</span>
            </div>
            <div className="trend-arrow-large" style={{ color: getTrendColor(trends.chuva.change) }}>
              {getTrendIcon(trends.chuva.change)}
            </div>
            <div className="value-box">
              <span className="value-label">Atual</span>
              <span className="value-number">{trends.chuva.end.toFixed(2)}</span>
              <span className="value-unit">mm</span>
            </div>
          </div>
          
          <div className="trend-change-badge" style={{ 
            background: getTrendColor(trends.chuva.change) + '20',
            color: getTrendColor(trends.chuva.change),
            borderColor: getTrendColor(trends.chuva.change)
          }}>
            {trends.chuva.change > 0 ? '+' : ''}{trends.chuva.change.toFixed(1)}% de variação
          </div>

          <div className="trend-stats">
            <div className="stat-row">
              <span className="stat-label">📊 Média:</span>
              <span className="stat-value">{trends.chuva.avg.toFixed(2)} mm</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">📈 Máximo:</span>
              <span className="stat-value">{trends.chuva.max.toFixed(2)} mm</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">📉 Mínimo:</span>
              <span className="stat-value">{trends.chuva.min.toFixed(2)} mm</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">📏 Variabilidade:</span>
              <span className="stat-value">{trends.chuva.coefficient.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Card Temperatura */}
        <div className="trend-card-enhanced" style={{ position: 'relative' }}>
          <InfoTooltip
            title="Análise de Temperatura"
            content={
              <>
                <p>
                  <strong>Temperatura Média da Água</strong> é calculada a partir das 
                  medições coletadas pelo sensor submerso da estação hidrométrica.
                </p>
                <div className="tooltip-section">
                  <div className="tooltip-section-title">🌡️ Importância Ecológica:</div>
                  <ul>
                    <li>Influencia metabolismo de organismos aquáticos</li>
                    <li>Afeta solubilidade de oxigênio dissolvido</li>
                    <li>Indicador de qualidade ambiental</li>
                  </ul>
                </div>
                <div className="tooltip-section">
                  <div className="tooltip-section-title">📈 Amplitude Térmica:</div>
                  <p>
                    Diferença entre temperatura máxima e mínima. Amplitude {'>'} 8°C 
                    indica forte sazonalidade térmica.
                  </p>
                </div>
                <div className="tooltip-note">
                  ⚠️ Temperaturas {'>'} 26°C podem reduzir oxigenação e favorecer eutrofização.
                </div>
              </>
            }
          />
          <div className="trend-card-header">
            <span className="trend-icon-large">🌡️</span>
            <div>
              <h5>Temperatura</h5>
              <p className="metric-subtitle">Temperatura Média da Água</p>
            </div>
          </div>
          
          <div className="trend-values-enhanced">
            <div className="value-box">
              <span className="value-label">Início</span>
              <span className="value-number">{trends.temp.start.toFixed(1)}</span>
              <span className="value-unit">°C</span>
            </div>
            <div className="trend-arrow-large" style={{ color: getTrendColor(trends.temp.change) }}>
              {getTrendIcon(trends.temp.change)}
            </div>
            <div className="value-box">
              <span className="value-label">Atual</span>
              <span className="value-number">{trends.temp.end.toFixed(1)}</span>
              <span className="value-unit">°C</span>
            </div>
          </div>
          
          <div className="trend-change-badge" style={{ 
            background: getTrendColor(trends.temp.change) + '20',
            color: getTrendColor(trends.temp.change),
            borderColor: getTrendColor(trends.temp.change)
          }}>
            {trends.temp.change > 0 ? '+' : ''}{trends.temp.change.toFixed(1)}% de variação
          </div>

          <div className="trend-stats">
            <div className="stat-row">
              <span className="stat-label">📊 Média Geral:</span>
              <span className="stat-value">{trends.temp.avg.toFixed(1)}°C</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">🔥 Máxima:</span>
              <span className="stat-value">{trends.temp.max.toFixed(1)}°C</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">❄️ Mínima:</span>
              <span className="stat-value">{trends.temp.min.toFixed(1)}°C</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">📏 Amplitude:</span>
              <span className="stat-value">{trends.temp.amplitude.toFixed(1)}°C</span>
            </div>
          </div>
        </div>

        {/* Card Bateria */}
        <div className="trend-card-enhanced" style={{ position: 'relative' }}>
          <InfoTooltip
            title="Sistema de Energia"
            content={
              <>
                <p>
                  <strong>Tensão da Bateria</strong> indica a saúde do sistema de 
                  energia off-grid (solar + bateria) da estação de monitoramento.
                </p>
                <div className="tooltip-section">
                  <div className="tooltip-section-title">🔋 Classificação de Status:</div>
                  <ul>
                    <li><strong style={{color: '#10b981'}}>Excelente (≥ 13V):</strong> Sistema totalmente carregado</li>
                    <li><strong style={{color: '#3b82f6'}}>Bom (12.5-13V):</strong> Operação normal</li>
                    <li><strong style={{color: '#f59e0b'}}>Adequado (12-12.5V):</strong> Requer monitoramento</li>
                    <li><strong style={{color: '#ef4444'}}>Crítico ({'<'} 12V):</strong> Manutenção urgente!</li>
                  </ul>
                </div>
                <div className="tooltip-note">
                  ⚡ Baterias de chumbo-ácido operando abaixo de 12V sofrem 
                  degradação irreversível (sulfatação).
                </div>
              </>
            }
          />
          <div className="trend-card-header">
            <span className="trend-icon-large">🔋</span>
            <div>
              <h5>Sistema</h5>
              <p className="metric-subtitle">Saúde da Bateria</p>
            </div>
          </div>
          
          <div className="trend-values-enhanced">
            <div className="value-box">
              <span className="value-label">Início</span>
              <span className="value-number">{trends.bateria.start.toFixed(2)}</span>
              <span className="value-unit">V</span>
            </div>
            <div className="trend-arrow-large" style={{ color: getTrendColor(trends.bateria.change) }}>
              {getTrendIcon(trends.bateria.change)}
            </div>
            <div className="value-box">
              <span className="value-label">Atual</span>
              <span className="value-number">{trends.bateria.end.toFixed(2)}</span>
              <span className="value-unit">V</span>
            </div>
          </div>
          
          <div className="trend-change-badge" style={{ 
            background: getTrendColor(trends.bateria.change) + '20',
            color: getTrendColor(trends.bateria.change),
            borderColor: getTrendColor(trends.bateria.change)
          }}>
            {trends.bateria.change > 0 ? '+' : ''}{trends.bateria.change.toFixed(1)}% de variação
          </div>

          <div className="trend-stats">
            <div className="stat-row">
              <span className="stat-label">� Média:</span>
              <span className="stat-value">{trends.bateria.avg.toFixed(2)} V</span>
            </div>
            <div className="stat-row" style={{ marginTop: '12px' }}>
              <span className="stat-label">🔍 Status:</span>
              <span 
                className="status-badge" 
                style={{ 
                  background: getBateriaColor(trends.bateria.status) + '20',
                  color: getBateriaColor(trends.bateria.status),
                  borderColor: getBateriaColor(trends.bateria.status)
                }}
              >
                {trends.bateria.status.toUpperCase()}
              </span>
            </div>
            <div className="status-info">
              {trends.bateria.status === 'excelente' && '✅ Sistema totalmente carregado'}
              {trends.bateria.status === 'bom' && '✓ Operação normal'}
              {trends.bateria.status === 'adequado' && '⚠️ Monitorar carga'}
              {trends.bateria.status === 'crítico' && '🚨 Manutenção urgente'}
            </div>
          </div>
        </div>
      </div>

      {/* Análise de sazonalidade */}
      <div className="seasonality-section" style={{ position: 'relative' }}>
        <InfoTooltip
          title="Análise de Sazonalidade"
          content={
            <>
              <p>
                <strong>Sazonalidade</strong> refere-se aos padrões cíclicos que se 
                repetem ao longo do ano devido a fatores climáticos e astronômicos.
              </p>
              <div className="tooltip-section">
                <div className="tooltip-section-title">📊 Metodologia:</div>
                <p>
                  Identificamos os meses com valores extremos (máximos e mínimos) 
                  de cada variável para caracterizar os períodos sazonais.
                </p>
              </div>
              <div className="tooltip-section">
                <div className="tooltip-section-title">🌍 Importância:</div>
                <ul>
                  <li>Planejamento de agricultura irrigada</li>
                  <li>Gestão de reservatórios hídricos</li>
                  <li>Previsão de riscos de enchentes/secas</li>
                </ul>
              </div>
              <div className="tooltip-note">
                💡 Padrões sazonais consistentes indicam estabilidade climática regional.
              </div>
            </>
          }
        />
        <h5 className="section-title">
          <span className="title-icon">📅</span>
          Padrões Sazonais Identificados
        </h5>
        <div className="seasonality-grid">
          <div className="season-item">
            <span className="season-icon">🌧️</span>
            <div className="season-content">
              <span className="season-label">Período Mais Chuvoso</span>
              <span className="season-value">{trends.sazonalidade.periodoMaisChuvoso}</span>
            </div>
          </div>
          <div className="season-item">
            <span className="season-icon">🔥</span>
            <div className="season-content">
              <span className="season-label">Período Mais Quente</span>
              <span className="season-value">{trends.sazonalidade.periodoMaisQuente}</span>
            </div>
          </div>
          <div className="season-item">
            <span className="season-icon">❄️</span>
            <div className="season-content">
              <span className="season-label">Período Mais Frio</span>
              <span className="season-value">{trends.sazonalidade.periodoMaisFrio}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
