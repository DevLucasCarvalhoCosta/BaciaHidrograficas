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
    
    // LARGURA FIXA em pixels para manter proporções corretas
    const pixelsPerDay = 40
    const width = Math.max(800, data.length * pixelsPerDay)
    const chartHeight = 350
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
      
      // Calcular posição X exata do ponto
      const xPos = i * stepX
      
      return { text, index: i, show: true, xPos }
    })
    
    return { 
      points, 
      areaPoints, 
      min: niceMin, 
      max: niceMax, 
      yAxisLabels, 
      xAxisLabels,
      width,
      chartHeight,
      pointsArray
    }
  }, [data, xKey, yKey])

  if (!data.length) {
    return <div className="chart-empty">Sem dados para exibir</div>
  }

  if (points === '') {
    return <div className="chart-empty">Sem dados válidos para exibir</div>
  }
  
  const { width, chartHeight, pointsArray } = useMemo(() => {
    if (!data.length) return { width: 800, chartHeight: 350, pointsArray: [] }
    
    const pixelsPerDay = 40
    const width = Math.max(800, data.length * pixelsPerDay)
    const chartHeight = 350
    const stepX = width / (data.length - 1 || 1)
    
    const values = data.map(d => parseFloat(d[yKey]) || 0).filter(v => v > 0)
    const minVal = Math.min(...values)
    const maxVal = Math.max(...values)
    const niceMin = Math.floor(minVal * 0.95)
    const niceMax = Math.ceil(maxVal * 1.05)
    const range = niceMax - niceMin || 1
    
    const pointsArray = data.map((d, i) => {
      const value = parseFloat(d[yKey]) || 0
      const x = i * stepX
      const y = value > 0 
        ? chartHeight - ((value - niceMin) / range) * chartHeight
        : chartHeight
      return { x, y, value }
    })
    
    return { width, chartHeight, pointsArray }
  }, [data, yKey])

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
      <div className="line-chart-wrapper" style={{ 
        overflowX: 'auto',
        position: 'relative'
      }}>
        <svg 
          width={width}
          height={chartHeight}
          viewBox={`0 0 ${width} ${chartHeight}`}
          style={{ display: 'block' }}
        >
          {/* Grid lines horizontais */}
          {[0, 87.5, 175, 262.5, 350].map((y, i) => (
            <line 
              key={y}
              x1="0" 
              y1={y} 
              x2={width} 
              y2={y} 
              stroke="#e5e7eb" 
              strokeWidth="1"
            />
          ))}
          
          {/* Grid lines verticais para cada dia */}
          {xAxisLabels.map((label, i) => (
            <line 
              key={`grid-${i}`}
              x1={label.xPos} 
              y1="0" 
              x2={label.xPos} 
              y2={chartHeight} 
              stroke="#f3f4f6" 
              strokeWidth="1"
              opacity="0.5"
            />
          ))}
          
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
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
          
          {/* Pontos de dados visíveis - AGORA COM TAMANHO CORRETO */}
          {pointsArray.map((point, i) => {
            if (point.value <= 0) return null
            
            return (
              <circle
                key={`point-${i}`}
                cx={point.x}
                cy={point.y}
                r="5"
                fill="white"
                stroke={color}
                strokeWidth="2.5"
                style={{ cursor: 'pointer' }}
              >
                <title>{point.value.toFixed(2)} {unit}</title>
              </circle>
            )
          })}
        </svg>
        
        {/* Eixo X */}
        <div className="x-axis" style={{ 
          position: 'relative',
          width: `${width}px`,
          height: '30px',
          marginTop: '5px'
        }}>
          {xAxisLabels.filter(l => l.show).map((label, i) => {
            return (
              <span 
                key={i}
                className="x-axis-label"
                style={{ 
                  position: 'absolute',
                  left: `${label.xPos}px`,
                  transform: 'translateX(-50%)',
                  fontSize: '12px',
                  color: '#374151',
                  fontWeight: '600'
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
