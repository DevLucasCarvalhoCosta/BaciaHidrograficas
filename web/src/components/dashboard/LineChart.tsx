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
  height = 300 
}) => {
  const { points, min, max, labels } = useMemo(() => {
    if (!data.length) return { points: '', min: 0, max: 0, labels: [] }
    
    const values = data.map(d => parseFloat(d[yKey]) || 0).filter(v => v > 0)
    
    if (values.length === 0) return { points: '', min: 0, max: 0, labels: [] }
    
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    
    const width = 100
    const chartHeight = 100
    const stepX = width / (data.length - 1 || 1)
    
    const points = data.map((d, i) => {
      const value = parseFloat(d[yKey]) || 0
      const x = i * stepX
      const y = value > 0 
        ? chartHeight - ((value - min) / range) * chartHeight
        : chartHeight // Coloca no fundo se for 0
      return `${x},${y}`
    }).join(' ')
    
    // Gerar labels do eixo X (mostrar apenas alguns)
    const totalDays = data.length
    const maxLabels = 6 // Máximo de labels a mostrar
    const step = Math.max(1, Math.ceil(totalDays / maxLabels))
    
    const labels = data
      .map((d, i) => ({ d, i }))
      .filter(({ i }) => i % step === 0 || i === totalDays - 1)
      .map(({ d }) => {
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
        } catch {
          text = 'N/A'
        }
        
        return text
      })
    
    return { points, min, max, labels }
  }, [data, xKey, yKey])

  if (!data.length) {
    return <div className="chart-empty">Sem dados para exibir</div>
  }

  if (points === '') {
    return <div className="chart-empty">Sem dados válidos para exibir</div>
  }

  return (
    <div className="line-chart" style={{ height: `${height}px`, display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: '1 1 auto', minHeight: 0, marginBottom: '10px' }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: '100%' }}>
          {/* Grid lines */}
          <line x1="0" y1="25" x2="100" y2="25" stroke="#e5e7eb" strokeWidth="0.2" opacity="0.5" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="#e5e7eb" strokeWidth="0.2" opacity="0.5" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="#e5e7eb" strokeWidth="0.2" opacity="0.5" />
          
          {/* Area fill with gradient */}
          <defs>
            <linearGradient id={`gradient-line-${color.replace('#', '')}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.4" />
              <stop offset="100%" stopColor={color} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <polyline
            fill={`url(#gradient-line-${color.replace('#', '')})`}
            stroke="none"
            points={`0,100 ${points} 100,100`}
          />
          
          {/* Line */}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />
        </svg>
      </div>
      <div className="chart-axis" style={{ flexShrink: 0 }}>
        <span className="axis-label" style={{ fontWeight: 700, color: '#374151' }}>{min.toFixed(1)} {unit}</span>
        <span className="axis-label" style={{ fontWeight: 700, color: '#374151' }}>{max.toFixed(1)} {unit}</span>
      </div>
      <div className="chart-labels" style={{ position: 'relative', height: '30px', marginTop: '8px' }}>
        {labels.map((label, i) => (
          <span 
            key={i} 
            className="label"
            style={{ 
              position: 'absolute',
              left: `${(i / data.length) * 100}%`,
              transform: 'translateX(-50%)',
              fontSize: '11px',
              fontWeight: 600,
              color: '#6b7280',
              whiteSpace: 'nowrap'
            }}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
