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
  height = 300 
}) => {
  const { bars, max, labels } = useMemo(() => {
    if (!data.length) return { bars: [], max: 0, labels: [] }
    
    const values = data.map(d => parseFloat(d[yKey]) || 0)
    const max = Math.max(...values, 1) // Mínimo 1 para evitar divisão por zero
    
    const bars = data.map((d, i) => {
      const value = parseFloat(d[yKey]) || 0
      const heightPercent = max > 0 ? (value / max) * 100 : 0
      return { value, heightPercent, index: i }
    })
    
    // Gerar TODOS os labels - um para cada dia
    const labels = data.map((d, i) => {
      const dateValue = d[xKey]
      let text = 'N/A'
      
      try {
        if (typeof dateValue === 'string') {
          // Se tem hífen, é uma data YYYY-MM-DD, pega só o dia
          if (dateValue.includes('-')) {
            const parts = dateValue.split('-')
            const day = parts[2] ? parseInt(parts[2], 10) : null
            text = day ? String(day) : 'N/A'
          } else {
            // Tenta parsear como número
            const num = parseInt(dateValue, 10)
            text = !isNaN(num) ? String(num) : 'N/A'
          }
        } else if (typeof dateValue === 'number') {
          text = String(dateValue)
        } else {
          // Tenta parsear como Date
          const date = new Date(dateValue)
          if (!isNaN(date.getTime())) {
            text = String(date.getDate())
          }
        }
      } catch (e) {
        text = 'N/A'
      }
      
      return {
        text,
        index: i
      }
    })
    
    return { bars, max, labels }
  }, [data, xKey, yKey])

  if (!data.length) {
    return <div className="chart-empty">Sem dados para exibir</div>
  }

  const barWidth = 100 / data.length
  const gap = Math.max(barWidth * 0.15, 0.3) // Gap proporcional, mínimo 0.3

  return (
    <div className="bar-chart" style={{ height: `${height}px`, display: 'flex', flexDirection: 'column' }}>
      <div className="chart-bars" style={{ flex: '1 1 auto', minHeight: 0 }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '100%' }}>
          {/* Grid lines */}
          <line x1="0" y1="25" x2="100" y2="25" stroke="#e5e7eb" strokeWidth="0.2" opacity="0.5" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="#e5e7eb" strokeWidth="0.2" opacity="0.5" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="#e5e7eb" strokeWidth="0.2" opacity="0.5" />
          
          {/* Bars */}
          <defs>
            <linearGradient id={`bar-gradient-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.9" />
              <stop offset="100%" stopColor={color} stopOpacity="0.6" />
            </linearGradient>
          </defs>
          {bars.map((bar, i) => (
            <rect
              key={i}
              x={i * barWidth + gap}
              y={100 - bar.heightPercent}
              width={Math.max(barWidth - 2 * gap, 0.3)}
              height={bar.heightPercent}
              fill={`url(#bar-gradient-${color.replace('#', '')})`}
              rx="0.5"
            >
              <title>{bar.value.toFixed(2)} {unit}</title>
            </rect>
          ))}
        </svg>
      </div>
      <div className="chart-axis" style={{ flexShrink: 0 }}>
        <span className="axis-label" style={{ fontWeight: 700, color: '#374151' }}>0 {unit}</span>
        <span className="axis-label" style={{ fontWeight: 700, color: '#374151' }}>{max.toFixed(1)} {unit}</span>
      </div>
      <div className="chart-labels" style={{ flexShrink: 0, position: 'relative', height: '30px', marginTop: '8px' }}>
        {labels.map((label, i) => (
          <span 
            key={i} 
            className="label"
            style={{ 
              position: 'absolute',
              left: `${(label.index / data.length) * 100}%`,
              transform: 'translateX(-50%)',
              fontSize: '11px',
              fontWeight: 600,
              color: '#6b7280',
              whiteSpace: 'nowrap'
            }}
          >
            {label.text}
          </span>
        ))}
      </div>
    </div>
  )
}
