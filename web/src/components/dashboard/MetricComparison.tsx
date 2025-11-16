import React, { useMemo } from 'react'

interface MetricComparisonProps {
  data: any[]
}

export const MetricComparison: React.FC<MetricComparisonProps> = ({ data }) => {
  const chartData = useMemo(() => {
    if (!data.length) return { bars: [], maxChuva: 0, maxTemp: 0, minChuva: 0, minTemp: 0 }
    
    const chuvas = data.map(d => parseFloat(d.chuva_mensal || '0') || 0).filter(v => v > 0)
    const temps = data.map(d => parseFloat(d.temp_media || '0') || 0).filter(v => v > 0)
    
    const maxChuva = chuvas.length > 0 ? Math.max(...chuvas) : 0
    const minChuva = chuvas.length > 0 ? Math.min(...chuvas) : 0
    const maxTemp = temps.length > 0 ? Math.max(...temps) : 0
    const minTemp = temps.length > 0 ? Math.min(...temps) : 0
    
    const bars = data.map((d, i) => {
      const chuva = parseFloat(d.chuva_mensal || '0') || 0
      const temp = parseFloat(d.temp_media || '0') || 0
      
      let mesNome = 'N/A'
      try {
        const date = new Date(d.mes + '-01')
        if (!isNaN(date.getTime())) {
          mesNome = date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
        }
      } catch {
        mesNome = d.mes
      }
      
      return {
        mes: d.mes,
        mesNome,
        chuva,
        temp,
        chuvaPercent: maxChuva > minChuva ? ((chuva - minChuva) / (maxChuva - minChuva)) * 100 : 50,
        tempPercent: maxTemp > minTemp ? ((temp - minTemp) / (maxTemp - minTemp)) * 100 : 50
      }
    })
    
    return { bars, maxChuva, maxTemp, minChuva, minTemp }
  }, [data])

  if (!data.length) {
    return <div className="chart-empty">Sem dados para comparação</div>
  }

  return (
    <div className="metric-comparison">
      <div className="comparison-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#3b82f6' }}></span>
          <span>Chuva Mensal Total (mm)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ background: '#f59e0b' }}></span>
          <span>Temperatura Média (°C)</span>
        </div>
      </div>
      
      {/* Gráfico de Chuva */}
      <div style={{ marginBottom: '40px' }}>
        <h4 style={{ fontSize: '15px', color: '#3b82f6', marginBottom: '12px', fontWeight: 600 }}>
          🌧️ Chuva Mensal Total por Mês
        </h4>
        <div className="comparison-chart-separate">
          {chartData.bars.map((bar, i) => (
            <div key={i} className="bar-container">
              <div 
                className="bar bar-chuva"
                style={{ 
                  height: `${bar.chuvaPercent}%`,
                  background: '#3b82f6'
                }}
                title={`${bar.chuva.toFixed(2)} mm (total do mês)`}
              >
                <span className="bar-value">{bar.chuva.toFixed(1)}</span>
              </div>
              <span className="bar-label">{bar.mesNome}</span>
            </div>
          ))}
        </div>
        <div className="chart-range">
          <span>Min: {chartData.minChuva.toFixed(2)} mm</span>
          <span>Max: {chartData.maxChuva.toFixed(2)} mm</span>
        </div>
      </div>

      {/* Gráfico de Temperatura */}
      <div>
        <h4 style={{ fontSize: '15px', color: '#ef4444', marginBottom: '12px', fontWeight: 600 }}>
          🌡️ Temperatura Média por Mês
        </h4>
        <div className="comparison-chart-separate">
          {chartData.bars.map((bar, i) => (
            <div key={i} className="bar-container">
              <div 
                className="bar bar-temp"
                style={{ 
                  height: `${bar.tempPercent}%`,
                  background: '#ef4444'
                }}
                title={`${bar.temp.toFixed(1)} °C`}
              >
                <span className="bar-value">{bar.temp.toFixed(1)}</span>
              </div>
              <span className="bar-label">{bar.mesNome}</span>
            </div>
          ))}
        </div>
        <div className="chart-range">
          <span>Min: {chartData.minTemp.toFixed(1)} °C</span>
          <span>Max: {chartData.maxTemp.toFixed(1)} °C</span>
        </div>
      </div>
    </div>
  )
}
