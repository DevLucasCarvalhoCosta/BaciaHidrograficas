import React, { useMemo } from 'react'

interface MonthlyHeatmapProps {
  data: any[]
  metric: string
  title: string
}

export const MonthlyHeatmap: React.FC<MonthlyHeatmapProps> = ({ data, metric, title }) => {
  const heatmapData = useMemo(() => {
    if (!data.length) return { cells: [], min: 0, max: 0 }
    
    const values = data.map(d => parseFloat(d[metric]) || 0)
    const min = Math.min(...values)
    const max = Math.max(...values)
    
    const cells = data.map(d => {
      const value = parseFloat(d[metric]) || 0
      const normalized = max > min ? (value - min) / (max - min) : 0
      return {
        mes: d.mes,
        value,
        intensity: normalized
      }
    })
    
    return { cells, min, max }
  }, [data, metric])

  if (!data.length) {
    return <div className="chart-empty">Sem dados para o mapa de calor</div>
  }

  const getColor = (intensity: number) => {
    // Gradient de azul (frio) para vermelho (quente)
    const r = Math.round(intensity * 255)
    const b = Math.round((1 - intensity) * 255)
    return `rgb(${r}, 100, ${b})`
  }

  return (
    <div className="monthly-heatmap">
      <div className="heatmap-grid">
        {heatmapData.cells.map((cell, i) => {
          let monthName = 'N/A'
          let year = ''
          
          try {
            const date = new Date(cell.mes + '-01')
            if (!isNaN(date.getTime())) {
              monthName = date.toLocaleDateString('pt-BR', { month: 'short' })
              year = String(date.getFullYear())
            }
          } catch {
            monthName = cell.mes.split('-')[1] || 'N/A'
            year = cell.mes.split('-')[0] || ''
          }
          
          return (
            <div 
              key={i} 
              className="heatmap-cell"
              style={{ background: getColor(cell.intensity) }}
              title={`${monthName}/${year}: ${cell.value.toFixed(2)}`}
            >
              <div className="cell-label">{monthName}</div>
              <div className="cell-value">{cell.value.toFixed(1)}</div>
            </div>
          )
        })}
      </div>
      
      <div className="heatmap-legend">
        <div className="legend-scale">
          <div className="scale-gradient"></div>
          <div className="scale-labels">
            <span>{heatmapData.min.toFixed(1)}</span>
            <span>{title}</span>
            <span>{heatmapData.max.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
