import React, { useMemo } from 'react'

interface TimeSeriesChartProps {
  data: any[]
  xKey: string
  yKey: string
  secondaryKey?: string
  color: string
  secondaryColor?: string
  unit: string
  legend?: string[]
  height?: number
}

export const TimeSeriesChart: React.FC<TimeSeriesChartProps> = ({ 
  data, 
  xKey, 
  yKey,
  secondaryKey,
  color,
  secondaryColor,
  unit,
  legend,
  height = 400 
}) => {
  const chartData = useMemo(() => {
    if (!data.length) return { 
      primaryPoints: [], 
      secondaryPoints: [], 
      min: 0, 
      max: 0, 
      labels: [], 
      gridLines: [], 
      width: 1000, 
      chartHeight: 100 
    }
    
    const primaryValues = data.map(d => parseFloat(d[yKey]) || 0)
    const secondaryValues = secondaryKey ? data.map(d => parseFloat(d[secondaryKey]) || 0) : []
    
    const allValues = [...primaryValues, ...secondaryValues].filter(v => !isNaN(v))
    const min = Math.min(...allValues)
    const max = Math.max(...allValues)
    const range = max - min || 1
    
    const width = 1000
    const chartHeight = 100
    const padding = 2
    
    // Criar pontos para o gráfico
    const createPoints = (values: number[]) => {
      return values.map((val, i) => {
        const x = (i / (values.length - 1 || 1)) * (width - 2 * padding) + padding
        const y = chartHeight - ((val - min) / range) * (chartHeight - 2 * padding) - padding
        return { x, y: isNaN(y) ? chartHeight / 2 : y, value: val }
      })
    }
    
    const primaryPoints = createPoints(primaryValues)
    const secondaryPoints = secondaryKey ? createPoints(secondaryValues) : []
    
    // Gerar labels do eixo X (mostrar alguns pontos chave)
    const labelCount = Math.min(10, data.length)
    const step = Math.floor(data.length / labelCount) || 1
    const labels = data
      .filter((_, i) => i % step === 0 || i === data.length - 1)
      .map((d, idx) => {
        const dateValue = d[xKey]
        let text = 'N/A'
        
        try {
          const date = new Date(dateValue)
          if (!isNaN(date.getTime())) {
            text = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
          }
        } catch {
          text = String(dateValue).slice(0, 10)
        }
        
        return {
          text,
          position: ((idx * step) / (data.length - 1 || 1)) * 100
        }
      })
    
    // Linhas de grade horizontais
    const gridCount = 5
    const gridLines = Array.from({ length: gridCount }, (_, i) => {
      const value = min + (range * i / (gridCount - 1))
      const y = chartHeight - ((value - min) / range) * chartHeight
      return { y, value }
    })
    
    return { primaryPoints, secondaryPoints, min, max, labels, gridLines, width, chartHeight }
  }, [data, xKey, yKey, secondaryKey])

  if (!data.length) {
    return <div className="chart-empty">Sem dados para exibir</div>
  }

  const createPathD = (points: { x: number; y: number }[]) => {
    if (!points.length) return ''
    
    let d = `M ${points[0].x} ${points[0].y}`
    
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1]
      const curr = points[i]
      const next = points[i + 1]
      
      // Criar curva suave (Catmull-Rom)
      const cp1x = prev.x + (curr.x - (points[i - 2]?.x || prev.x)) / 6
      const cp1y = prev.y + (curr.y - (points[i - 2]?.y || prev.y)) / 6
      const cp2x = curr.x - (next?.x || curr.x - curr.x) / 6
      const cp2y = curr.y - (next?.y || curr.y - curr.y) / 6
      
      d += ` L ${curr.x} ${curr.y}`
    }
    
    return d
  }

  const createAreaD = (points: { x: number; y: number }[]) => {
    if (!points.length) return ''
    const path = createPathD(points)
    return `${path} L ${points[points.length - 1].x} ${chartData.chartHeight} L ${points[0].x} ${chartData.chartHeight} Z`
  }

  return (
    <div className="time-series-chart-container" style={{ height: `${height}px` }}>
      {legend && (
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-line" style={{ background: color }}></span>
            <span>{legend[0]}</span>
          </div>
          {legend[1] && secondaryColor && (
            <div className="legend-item">
              <span className="legend-line" style={{ background: secondaryColor }}></span>
              <span>{legend[1]}</span>
            </div>
          )}
        </div>
      )}
      
      <div className="time-series-chart">
        <div className="chart-y-axis">
          {chartData.gridLines.map((line, i) => (
            <div key={i} className="y-axis-label">
              {line.value.toFixed(1)} {unit}
            </div>
          ))}
        </div>
        
        <div className="chart-area">
          <svg 
            viewBox={`0 0 ${chartData.width} ${chartData.chartHeight}`} 
            preserveAspectRatio="none"
            style={{ width: '100%', height: '100%' }}
          >
            <defs>
              <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{ stopColor: color, stopOpacity: 0.3 }} />
                <stop offset="100%" style={{ stopColor: color, stopOpacity: 0.05 }} />
              </linearGradient>
              {secondaryColor && (
                <linearGradient id={`gradient-${secondaryColor}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: secondaryColor, stopOpacity: 0.2 }} />
                  <stop offset="100%" style={{ stopColor: secondaryColor, stopOpacity: 0.02 }} />
                </linearGradient>
              )}
            </defs>
            
            {/* Linhas de grade */}
            {chartData.gridLines.map((line, i) => (
              <line
                key={i}
                x1="0"
                y1={line.y}
                x2={chartData.width}
                y2={line.y}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
            ))}
            
            {/* Área preenchida - Primary */}
            {chartData.primaryPoints.length > 0 && (
              <path
                d={createAreaD(chartData.primaryPoints)}
                fill={`url(#gradient-${color})`}
              />
            )}
            
            {/* Linha principal - Primary */}
            {chartData.primaryPoints.length > 0 && (
              <path
                d={createPathD(chartData.primaryPoints)}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            
            {/* Pontos de dados - Primary */}
            {chartData.primaryPoints.map((point, i) => {
              if (i % Math.ceil(chartData.primaryPoints.length / 50) === 0) {
                return (
                  <circle
                    key={i}
                    cx={point.x}
                    cy={point.y}
                    r="3"
                    fill="white"
                    stroke={color}
                    strokeWidth="2"
                  >
                    <title>{point.value.toFixed(2)} {unit}</title>
                  </circle>
                )
              }
              return null
            })}
            
            {/* Linha secundária */}
            {chartData.secondaryPoints.length > 0 && secondaryColor && (
              <>
                <path
                  d={createAreaD(chartData.secondaryPoints)}
                  fill={`url(#gradient-${secondaryColor})`}
                />
                <path
                  d={createPathD(chartData.secondaryPoints)}
                  fill="none"
                  stroke={secondaryColor}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="5,3"
                />
              </>
            )}
          </svg>
        </div>
      </div>
      
      <div className="chart-x-labels">
        {chartData.labels.map((label, i) => (
          <span 
            key={i} 
            className="x-label"
            style={{ left: `${label.position}%` }}
          >
            {label.text}
          </span>
        ))}
      </div>
      
      <div className="chart-stats-summary">
        <div className="stat-summary-item">
          <span className="stat-summary-label">Mínimo:</span>
          <span className="stat-summary-value" style={{ color }}>{chartData.min.toFixed(2)} {unit}</span>
        </div>
        <div className="stat-summary-item">
          <span className="stat-summary-label">Máximo:</span>
          <span className="stat-summary-value" style={{ color }}>{chartData.max.toFixed(2)} {unit}</span>
        </div>
        <div className="stat-summary-item">
          <span className="stat-summary-label">Média:</span>
          <span className="stat-summary-value" style={{ color }}>
            {((chartData.min + chartData.max) / 2).toFixed(2)} {unit}
          </span>
        </div>
        <div className="stat-summary-item">
          <span className="stat-summary-label">Total de pontos:</span>
          <span className="stat-summary-value">{data.length}</span>
        </div>
      </div>
    </div>
  )
}
