import React, { useMemo } from 'react'

interface HistoricalTrendsProps {
  data: any[]
}

export const HistoricalTrends: React.FC<HistoricalTrendsProps> = ({ data }) => {
  const trends = useMemo(() => {
    if (data.length < 2) return null
    
    const firstMonth = data[0]
    const lastMonth = data[data.length - 1]
    
    const chuvaChange = ((parseFloat(lastMonth.chuva_maxima) - parseFloat(firstMonth.chuva_maxima)) / parseFloat(firstMonth.chuva_maxima)) * 100
    const tempChange = ((parseFloat(lastMonth.temp_media) - parseFloat(firstMonth.temp_media)) / parseFloat(firstMonth.temp_media)) * 100
    const bateriaChange = ((parseFloat(lastMonth.bateria_media) - parseFloat(firstMonth.bateria_media)) / parseFloat(firstMonth.bateria_media)) * 100
    
    const formatMes = (mes: string) => {
      try {
        const date = new Date(mes + '-01')
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
        }
      } catch {
        return mes
      }
      return mes
    }
    
    return {
      periodo: `${formatMes(firstMonth.mes)} → ${formatMes(lastMonth.mes)}`,
      chuva: { 
        start: parseFloat(firstMonth.chuva_maxima), 
        end: parseFloat(lastMonth.chuva_maxima), 
        change: chuvaChange 
      },
      temp: { 
        start: parseFloat(firstMonth.temp_media), 
        end: parseFloat(lastMonth.temp_media), 
        change: tempChange 
      },
      bateria: { 
        start: parseFloat(firstMonth.bateria_media), 
        end: parseFloat(lastMonth.bateria_media), 
        change: bateriaChange 
      }
    }
  }, [data])

  if (!trends) {
    return <div className="chart-empty">Dados insuficientes para análise de tendências</div>
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

  return (
    <div className="historical-trends">
      <div className="trends-header">
        <h4>Análise de Tendências Históricas</h4>
        <p className="trends-period">{trends.periodo}</p>
      </div>
      
      <div className="trends-grid">
        <div className="trend-item">
          <div className="trend-header">
            <span className="trend-icon">🌧️</span>
            <h5>Chuva Acumulada</h5>
          </div>
          <div className="trend-values">
            <div className="trend-value">
              <span className="label">Início:</span>
              <span className="value">{trends.chuva.start.toFixed(2)} mm</span>
            </div>
            <div className="trend-arrow" style={{ color: getTrendColor(trends.chuva.change) }}>
              {getTrendIcon(trends.chuva.change)}
            </div>
            <div className="trend-value">
              <span className="label">Atual:</span>
              <span className="value">{trends.chuva.end.toFixed(2)} mm</span>
            </div>
          </div>
          <div className="trend-change" style={{ color: getTrendColor(trends.chuva.change) }}>
            {trends.chuva.change > 0 ? '+' : ''}{trends.chuva.change.toFixed(1)}%
          </div>
        </div>

        <div className="trend-item">
          <div className="trend-header">
            <span className="trend-icon">🌡️</span>
            <h5>Temperatura Média</h5>
          </div>
          <div className="trend-values">
            <div className="trend-value">
              <span className="label">Início:</span>
              <span className="value">{trends.temp.start.toFixed(1)} °C</span>
            </div>
            <div className="trend-arrow" style={{ color: getTrendColor(trends.temp.change) }}>
              {getTrendIcon(trends.temp.change)}
            </div>
            <div className="trend-value">
              <span className="label">Atual:</span>
              <span className="value">{trends.temp.end.toFixed(1)} °C</span>
            </div>
          </div>
          <div className="trend-change" style={{ color: getTrendColor(trends.temp.change) }}>
            {trends.temp.change > 0 ? '+' : ''}{trends.temp.change.toFixed(1)}%
          </div>
        </div>

        <div className="trend-item">
          <div className="trend-header">
            <span className="trend-icon">🔋</span>
            <h5>Bateria Média</h5>
          </div>
          <div className="trend-values">
            <div className="trend-value">
              <span className="label">Início:</span>
              <span className="value">{trends.bateria.start.toFixed(2)} V</span>
            </div>
            <div className="trend-arrow" style={{ color: getTrendColor(trends.bateria.change) }}>
              {getTrendIcon(trends.bateria.change)}
            </div>
            <div className="trend-value">
              <span className="label">Atual:</span>
              <span className="value">{trends.bateria.end.toFixed(2)} V</span>
            </div>
          </div>
          <div className="trend-change" style={{ color: getTrendColor(trends.bateria.change) }}>
            {trends.bateria.change > 0 ? '+' : ''}{trends.bateria.change.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="trends-insights">
        <h5>💡 Insights:</h5>
        <ul>
          {Math.abs(trends.chuva.change) > 20 && (
            <li>
              {trends.chuva.change > 0 
                ? '⚠️ Aumento significativo na chuva acumulada, indicando período mais chuvoso'
                : '⚠️ Redução significativa na chuva acumulada, possível período de seca'}
            </li>
          )}
          {Math.abs(trends.temp.change) > 10 && (
            <li>
              {trends.temp.change > 0
                ? '🔥 Temperatura da água em elevação, pode indicar mudanças sazonais ou climáticas'
                : '❄️ Temperatura da água em queda, pode indicar mudanças sazonais'}
            </li>
          )}
          {trends.bateria.change < -5 && (
            <li>
              🔋 Bateria apresentando tendência de queda, considerar manutenção preventiva
            </li>
          )}
          {Math.abs(trends.chuva.change) < 10 && Math.abs(trends.temp.change) < 5 && (
            <li>
              ✓ Condições relativamente estáveis ao longo do período analisado
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
