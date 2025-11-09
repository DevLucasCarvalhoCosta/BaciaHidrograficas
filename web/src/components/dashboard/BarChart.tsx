import React, { useMemo } from 'react'

interface BarChartProps {
  data: any[]
  xKey: string
  yKey: string
  color: string
  unit: string
  height?: number
}

export const BarChart: React.FC<BarChartProps> = ({ 
  data, 
  xKey, 
  yKey, 
  color, 
  unit,
  height = 350 
}) => {
  const { bars, max, yAxisLabels, xAxisLabels } = useMemo(() => {
    if (!data.length) return { bars: [], max: 0, yAxisLabels: [], xAxisLabels: [] }
    
    const values = data.map(d => parseFloat(d[yKey]) || 0)
    const max = Math.max(...values, 1)
    
    // Arredondar max para cima para um número "bonito"
    const niceMax = Math.ceil(max * 1.1 / 10) * 10
    
    const bars = data.map((d, i) => {
      const value = parseFloat(d[yKey]) || 0
      const heightPercent = niceMax > 0 ? (value / niceMax) * 100 : 0
      return { value, heightPercent, index: i }
    })
    
    // Labels do eixo Y (5 níveis)
    const yAxisLabels = [
      { value: niceMax, label: niceMax.toFixed(0) },
      { value: niceMax * 0.75, label: (niceMax * 0.75).toFixed(0) },
      { value: niceMax * 0.5, label: (niceMax * 0.5).toFixed(0) },
      { value: niceMax * 0.25, label: (niceMax * 0.25).toFixed(0) },
      { value: 0, label: '0' }
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
    
    return { bars, max: niceMax, yAxisLabels, xAxisLabels }
  }, [data, xKey, yKey])

  if (!data.length) {
    return <div className="chart-empty">Sem dados para exibir</div>
  }

  const barWidth = 100 / data.length
  const gap = Math.max(barWidth * 0.1, 0.2)

  return (
    <div className="bar-chart-container">
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
      <div className="bar-chart-wrapper">
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
            // Posição central de cada barra
            const x = ((i + 0.5) / data.length) * 100
            return (
              <line 
                key={`grid-${i}`}
                x1={x} 
                y1="0" 
                x2={x} 
                y2="100" 
                stroke="#f3f4f6" 
                strokeWidth="0.15"
                strokeDasharray="2,2"
                opacity="0.6"
              />
            )
          })}
          
          {/* Gradiente das barras */}
          <defs>
            <linearGradient id={`bar-gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="1" />
              <stop offset="100%" stopColor={color} stopOpacity="0.7" />
            </linearGradient>
          </defs>
          
          {/* Barras */}
          {bars.map((bar, i) => (
            <g key={i}>
              <rect
                x={i * barWidth + gap}
                y={100 - bar.heightPercent}
                width={Math.max(barWidth - 2 * gap, 0.3)}
                height={bar.heightPercent}
                fill={`url(#bar-gradient-${color.replace('#', '')})`}
                rx="0.5"
              />
              <title>{bar.value.toFixed(2)} {unit}</title>
            </g>
          ))}
        </svg>
        
        {/* Eixo X */}
        <div className="x-axis">
          {xAxisLabels.filter(l => l.show).map((label, i) => {
            // Calcular posição central da barra
            const barCenter = ((label.index + 0.5) / data.length) * 100
            
            return (
              <span 
                key={i}
                className="x-axis-label"
                style={{ 
                  left: `${barCenter}%`,
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
