import React, { useMemo } from 'react'

interface LineChartProps {
  data: any[]
  xKey: string
  yKey: string
  color: string
  unit: string
  height?: number
}

export const LineChart: React.FC<LineChartProps> = ({ 
  data, 
  xKey, 
  yKey, 
  color, 
  unit,
  height = 350 
}) => {
  const { points, areaPoints, min, max, yAxisLabels, xAxisLabels } = useMemo(() => {
    if (!data.length) return { points: '', areaPoints: '', min: 0, max: 0, yAxisLabels: [], xAxisLabels: [] }
    
    const values = data.map(d => parseFloat(d[yKey]) || 0).filter(v => v > 0)
    
    if (values.length === 0) return { points: '', areaPoints: '', min: 0, max: 0, yAxisLabels: [], xAxisLabels: [] }
    
    const min = Math.min(...values)
    const max = Math.max(...values)
    
    // Arredondar para valores "bonitos"
    const niceMin = Math.floor(min * 0.95)
    const niceMax = Math.ceil(max * 1.05)
    const range = niceMax - niceMin || 1
    
    const width = 100
    const chartHeight = 100
    const stepX = width / (data.length - 1 || 1)
    
    const pointsArray = data.map((d, i) => {
      const value = parseFloat(d[yKey]) || 0
      const x = i * stepX
      const y = value > 0 
        ? chartHeight - ((value - niceMin) / range) * chartHeight
        : chartHeight
      return { x, y, value }
    })
    
    const points = pointsArray.map(p => `${p.x},${p.y}`).join(' ')
    
    // Criar pontos para área preenchida
    const areaPoints = `0,${chartHeight} ${points} ${width},${chartHeight}`
    
    // Labels do eixo Y (5 níveis)
    const yAxisLabels = [
      { value: niceMax, label: niceMax.toFixed(1) },
      { value: niceMin + range * 0.75, label: (niceMin + range * 0.75).toFixed(1) },
      { value: niceMin + range * 0.5, label: (niceMin + range * 0.5).toFixed(1) },
      { value: niceMin + range * 0.25, label: (niceMin + range * 0.25).toFixed(1) },
      { value: niceMin, label: niceMin.toFixed(1) }
    ]
    
    // Labels do eixo X - mostrar TODOS os dias
    const totalDays = data.length
    
    const xAxisLabels = data.map((d, i) => {
      const dateValue = d[xKey]
      let text = ''
      
      // Extrair o número do dia
      let dayNumber = 0
      try {
        if (typeof dateValue === 'string' && dateValue.includes('-')) {
          const parts = dateValue.split('-')
          dayNumber = parts[2] ? parseInt(parts[2], 10) : 0
        } else if (typeof dateValue === 'number') {
          dayNumber = dateValue
        }
      } catch {
        dayNumber = 0
      }
      
      text = dayNumber > 0 ? String(dayNumber) : ''
      
      // Mostrar TODOS os dias
      return { text, index: i, show: true }
    })
    
    return { points, areaPoints, min: niceMin, max: niceMax, yAxisLabels, xAxisLabels }
  }, [data, xKey, yKey])

  if (!data.length) {
    return <div className="chart-empty">Sem dados para exibir</div>
  }

  if (points === '') {
    return <div className="chart-empty">Sem dados válidos para exibir</div>
  }

  return (
    <div className="line-chart-container">
      {/* Eixo Y */}
      <div className="y-axis">
        <div className="y-axis-unit">{unit}</div>
        {yAxisLabels.map((label, i) => (
          <div key={i} className="y-axis-label">
            <span>{label.label}</span>
          </div>
        ))}
      </div>
      
      {/* Área do gráfico */}
      <div className="line-chart-wrapper">
        <svg 
          viewBox="0 0 100 100" 
          preserveAspectRatio="none"
          style={{ width: '100%', height: `${height}px`, display: 'block' }}
        >
          {/* Grid lines horizontais */}
          {[0, 25, 50, 75, 100].map(y => (
            <line 
              key={y}
              x1="0" 
              y1={y} 
              x2="100" 
              y2={y} 
              stroke="#e5e7eb" 
              strokeWidth="0.2"
            />
          ))}
          
          {/* Grid lines verticais para cada dia */}
          {data.map((_, i) => {
            const x = (i / (data.length - 1)) * 100
            return (
              <line 
                key={`grid-${i}`}
                x1={x} 
                y1="0" 
                x2={x} 
                y2="100" 
                stroke="#f3f4f6" 
                strokeWidth="0.1"
                opacity="0.5"
              />
            )
          })}
          
          {/* Gradiente da área */}
          <defs>
            <linearGradient id={`gradient-line-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.3" />
              <stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          
          {/* Área preenchida */}
          <polygon
            fill={`url(#gradient-line-${color.replace('#', '')})`}
            stroke="none"
            points={areaPoints}
          />
          
          {/* Linha */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
          
          {/* Pontos de dados visíveis */}
          {data.map((d, i) => {
            const value = parseFloat(d[yKey]) || 0
            if (value <= 0) return null
            
            const x = (i / (data.length - 1)) * 100
            const y = 100 - ((value - min) / (max - min)) * 100
            
            return (
              <circle
                key={`point-${i}`}
                cx={x}
                cy={y}
                r="0.8"
                fill={color}
                opacity="0.7"
              >
                <title>{value.toFixed(2)} {unit}</title>
              </circle>
            )
          })}
        </svg>
        
        {/* Eixo X */}
        <div className="x-axis">
          {xAxisLabels.filter(l => l.show).map((label, i) => {
            // Para gráfico de linha, usar posição exata do ponto
            const pointPosition = data.length > 1 
              ? (label.index / (data.length - 1)) * 100 
              : 50
            
            return (
              <span 
                key={i}
                className="x-axis-label"
                style={{ 
                  left: `${pointPosition}%`,
                }}
              >
                {label.text}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
