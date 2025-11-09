import React, { useMemo } from 'react'

interface MonthlyData {
  mes: string
  chuva_maxima: string
  temp_media: string
  bateria_media: string
  total_medicoes: string
}

interface MonthlyComparisonChartProps {
  data: MonthlyData[]
}

export const MonthlyComparisonChart: React.FC<MonthlyComparisonChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null

    const chuvaValues = data.map(d => parseFloat(d.chuva_maxima))
    const tempValues = data.map(d => parseFloat(d.temp_media))

    const chuvaMax = Math.max(...chuvaValues)
    const tempMax = Math.max(...tempValues)
    const tempMin = Math.min(...tempValues)

    return {
      months: data.map(d => {
        try {
          const [year, month] = d.mes.split('-')
          const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
          return `${monthNames[parseInt(month) - 1]}/${year.slice(2)}`
        } catch {
          return d.mes
        }
      }),
      chuva: chuvaValues,
      temperatura: tempValues,
      chuvaMax,
      tempMax,
      tempMin,
      chuvaScale: chuvaMax > 0 ? 100 / chuvaMax : 1,
      tempScale: (tempMax - tempMin) > 0 ? 100 / (tempMax - tempMin) : 1,
      tempOffset: tempMin
    }
  }, [data])

  if (!chartData) {
    return <div className="chart-empty">Dados insuficientes para gráfico comparativo</div>
  }

  const { months, chuva, temperatura, chuvaMax, tempMax, tempMin, chuvaScale, tempScale, tempOffset } = chartData

  // Calcular médias móveis (3 períodos)
  const movingAvgChuva = chuva.map((val, idx) => {
    if (idx < 1) return val
    const start = Math.max(0, idx - 1)
    const values = chuva.slice(start, idx + 1)
    return values.reduce((a, b) => a + b, 0) / values.length
  })

  const movingAvgTemp = temperatura.map((val, idx) => {
    if (idx < 1) return val
    const start = Math.max(0, idx - 1)
    const values = temperatura.slice(start, idx + 1)
    return values.reduce((a, b) => a + b, 0) / values.length
  })

  return (
    <div className="monthly-comparison-chart">
      {/* Descrição do gráfico - mesmo estilo dos outros */}
      <p className="chart-description" style={{ marginBottom: '20px' }}>
        <strong>Visualização dual-axis</strong> que sobrepõe precipitação (barras azuis) e temperatura (linha vermelha) mensais em escala sincronizada. 
        As <strong>linhas tracejadas</strong> mostram médias móveis que suavizam flutuações e revelam tendências de médio prazo. 
        Esta análise comparativa facilita a identificação de <strong>correlações inversas</strong> (mais chuva → menor temperatura) 
        ou padrões atípicos que merecem investigação. Essencial para estudos de sazonalidade climática e planejamento de recursos hídricos.
      </p>

      <div className="chart-legend-dual">
        <div className="legend-title">📊 Legendas e Métricas</div>
        <div className="legend-groups">
          <div className="legend-group">
            <div className="legend-item">
              <div className="legend-symbol bar" style={{ background: 'linear-gradient(180deg, #3b82f6 0%, rgba(59, 130, 246, 0.6) 100%)' }}></div>
              <span>Chuva Máxima (mm)</span>
            </div>
            <div className="legend-item">
              <div className="legend-symbol line" style={{ borderColor: '#ef4444' }}></div>
              <span>Temperatura Média (°C)</span>
            </div>
          </div>
          <div className="legend-group">
            <div className="legend-item">
              <div className="legend-symbol dashed" style={{ borderColor: '#93c5fd' }}></div>
              <span>Tendência Chuva</span>
            </div>
            <div className="legend-item">
              <div className="legend-symbol dashed" style={{ borderColor: '#fca5a5' }}></div>
              <span>Tendência Temperatura</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dual-axis-chart">
        {/* Eixo Y esquerdo (Chuva) */}
        <div className="y-axis-left">
          <span className="axis-label">{chuvaMax.toFixed(0)}</span>
          <span className="axis-label">{(chuvaMax * 0.75).toFixed(0)}</span>
          <span className="axis-label">{(chuvaMax * 0.5).toFixed(0)}</span>
          <span className="axis-label">{(chuvaMax * 0.25).toFixed(0)}</span>
          <span className="axis-label">0</span>
        </div>

        {/* Área do gráfico */}
        <div className="chart-area">
          <svg className="chart-svg" viewBox="0 0 1000 300" preserveAspectRatio="none">
            {/* Grid horizontal */}
            {[0, 25, 50, 75, 100].map((y) => (
              <line
                key={`grid-${y}`}
                x1="0"
                y1={300 - (y * 3)}
                x2="1000"
                y2={300 - (y * 3)}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            ))}

            {/* Barras de chuva */}
            {chuva.map((val, idx) => {
              const x = (idx / (chuva.length - 1)) * 1000
              const height = val * chuvaScale * 3
              const barWidth = 1000 / (chuva.length * 2)
              
              return (
                <g key={`bar-${idx}`}>
                  <rect
                    x={x - barWidth / 2}
                    y={300 - height}
                    width={barWidth}
                    height={height}
                    fill="url(#chuva-gradient)"
                    opacity="0.8"
                  />
                  <title>{`${months[idx]}\nChuva: ${val.toFixed(2)} mm`}</title>
                </g>
              )
            })}

            {/* Linha de temperatura */}
            <polyline
              points={temperatura
                .map((val, idx) => {
                  const x = (idx / (temperatura.length - 1)) * 1000
                  const y = 300 - ((val - tempOffset) * tempScale * 3)
                  return `${x},${y}`
                })
                .join(' ')}
              fill="none"
              stroke="#ef4444"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Pontos de temperatura */}
            {temperatura.map((val, idx) => {
              const x = (idx / (temperatura.length - 1)) * 1000
              const y = 300 - ((val - tempOffset) * tempScale * 3)
              
              return (
                <g key={`point-${idx}`}>
                  <circle
                    cx={x}
                    cy={y}
                    r="5"
                    fill="#ef4444"
                    stroke="white"
                    strokeWidth="2"
                  />
                  <title>{`${months[idx]}\nTemperatura: ${val.toFixed(1)}°C`}</title>
                </g>
              )
            })}

            {/* Linha de tendência - Chuva (média móvel) */}
            <polyline
              points={movingAvgChuva
                .map((val, idx) => {
                  const x = (idx / (movingAvgChuva.length - 1)) * 1000
                  const y = 300 - (val * chuvaScale * 3)
                  return `${x},${y}`
                })
                .join(' ')}
              fill="none"
              stroke="#93c5fd"
              strokeWidth="2"
              strokeDasharray="8 4"
              opacity="0.7"
            />

            {/* Linha de tendência - Temperatura (média móvel) */}
            <polyline
              points={movingAvgTemp
                .map((val, idx) => {
                  const x = (idx / (movingAvgTemp.length - 1)) * 1000
                  const y = 300 - ((val - tempOffset) * tempScale * 3)
                  return `${x},${y}`
                })
                .join(' ')}
              fill="none"
              stroke="#fca5a5"
              strokeWidth="2"
              strokeDasharray="8 4"
              opacity="0.7"
            />

            {/* Gradientes */}
            <defs>
              <linearGradient id="chuva-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
              </linearGradient>
            </defs>
          </svg>

          {/* Eixo X (meses) */}
          <div className="x-axis">
            {months.map((month, idx) => (
              <span key={idx} className="x-label" style={{ left: `${(idx / (months.length - 1)) * 100}%` }}>
                {month}
              </span>
            ))}
          </div>
        </div>

        {/* Eixo Y direito (Temperatura) */}
        <div className="y-axis-right">
          <span className="axis-label">{tempMax.toFixed(1)}°C</span>
          <span className="axis-label">{(tempMax - (tempMax - tempMin) * 0.25).toFixed(1)}°C</span>
          <span className="axis-label">{((tempMax + tempMin) / 2).toFixed(1)}°C</span>
          <span className="axis-label">{(tempMin + (tempMax - tempMin) * 0.25).toFixed(1)}°C</span>
          <span className="axis-label">{tempMin.toFixed(1)}°C</span>
        </div>
      </div>

      {/* Estatísticas resumidas */}
      <div className="chart-summary">
        <div className="summary-item">
          <span className="summary-icon">🌧️</span>
          <div className="summary-content">
            <span className="summary-label">Chuva Média</span>
            <span className="summary-value">{(chuva.reduce((a, b) => a + b, 0) / chuva.length).toFixed(2)} mm</span>
          </div>
        </div>
        <div className="summary-item">
          <span className="summary-icon">📊</span>
          <div className="summary-content">
            <span className="summary-label">Variação Chuva</span>
            <span className="summary-value">{(Math.max(...chuva) - Math.min(...chuva)).toFixed(2)} mm</span>
          </div>
        </div>
        <div className="summary-item">
          <span className="summary-icon">🌡️</span>
          <div className="summary-content">
            <span className="summary-label">Temperatura Média</span>
            <span className="summary-value">{(temperatura.reduce((a, b) => a + b, 0) / temperatura.length).toFixed(1)}°C</span>
          </div>
        </div>
        <div className="summary-item">
          <span className="summary-icon">📈</span>
          <div className="summary-content">
            <span className="summary-label">Amplitude Térmica</span>
            <span className="summary-value">{(tempMax - tempMin).toFixed(1)}°C</span>
          </div>
        </div>
      </div>
    </div>
  )
}
