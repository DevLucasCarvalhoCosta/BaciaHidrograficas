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
  height = 500 // Aumentado de 400 para 500
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
      chartHeight: 100,
      sampledCount: 0,
      totalCount: 0
    }
    
    console.log('📊 [TimeSeriesChart] Processando dados:', data.length, 'registros');
    
    // Dados agregados por dia raramente terão mais de alguns milhares
    const sampledData = data;
    const sampledCount = 0;
    
    // Filtrar e validar valores numéricos
    const primaryValues = sampledData
      .map(d => {
        const val = parseFloat(d[yKey])
        return isNaN(val) || val < 0 ? 0 : val
      })
    
    const secondaryValues = secondaryKey 
      ? sampledData.map(d => {
          const val = parseFloat(d[secondaryKey])
          return isNaN(val) || val < 0 ? 0 : val
        })
      : []
    
    const allValues = [...primaryValues, ...secondaryValues].filter(v => v > 0)
    
    if (allValues.length === 0) {
      console.log('   ⚠️ Nenhum valor válido encontrado');
      return { 
        primaryPoints: [], 
        secondaryPoints: [], 
        min: 0, 
        max: 0, 
        labels: [], 
        gridLines: [], 
        width: 1000, 
        chartHeight: 100,
        sampledCount: 0,
        totalCount: data.length
      }
    }
    
    const min = Math.min(...allValues)
    const max = Math.max(...allValues)
    const range = max - min || 1
    
    console.log('   📈 Range:', { min, max, range });
    
    // LARGURA DINÂMICA: Cada dia terá um espaço EXATO de 40px para ser legível
    const pixelsPerDay = 40;
    const minWidth = 1000; // Largura mínima para poucos dados
    const calculatedWidth = Math.max(minWidth, sampledData.length * pixelsPerDay);
    const width = calculatedWidth;
    
    const chartHeight = 100
    const padding = 20 // Padding maior para acomodar labels
    
    console.log('   📏 Largura do gráfico:', width, 'px para', sampledData.length, 'dias');
    
    // Criar pontos para o gráfico - CADA DIA TEM SEU PONTO EXATO
    const createPoints = (values: number[], dataArray: any[]) => {
      return values.map((val, i) => {
        // Posição X: cada dia tem seu espaço fixo de pixelsPerDay
        const x = padding + (i * pixelsPerDay) + (pixelsPerDay / 2)
        // CORRIGIDO: inverte o cálculo para o gráfico crescer de baixo para cima
        const y = chartHeight - padding - ((val - min) / range) * (chartHeight - 2 * padding)
        
        // Extrair data do registro
        const dateValue = dataArray[i][xKey]
        let dateLabel = ''
        try {
          const date = new Date(dateValue)
          if (!isNaN(date.getTime())) {
            dateLabel = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
          }
        } catch {
          dateLabel = String(dateValue)
        }
        
        return { 
          x, 
          y: isNaN(y) ? chartHeight / 2 : y, 
          value: val, 
          index: i,
          date: dateLabel
        }
      })
    }
    
    const primaryPoints = createPoints(primaryValues, sampledData)
    const secondaryPoints = secondaryKey ? createPoints(secondaryValues, sampledData) : []
    
    // Gerar labels do eixo X - TODOS os dias com suas posições EXATAS
    const labels = sampledData.map((d, i) => {
      const dateValue = d[xKey]
      let text = 'N/A'
      let shortText = 'N/A'
      let fullDate = ''
      
      try {
        const date = new Date(dateValue)
        if (!isNaN(date.getTime())) {
          shortText = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
          fullDate = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
          text = fullDate
        }
      } catch {
        text = String(dateValue).slice(0, 10)
        shortText = text
        fullDate = text
      }
      
      // Posição X exata do dia - igual ao ponto do gráfico
      const xPos = padding + (i * pixelsPerDay) + (pixelsPerDay / 2)
      
      return {
        text: shortText,
        fullDate,
        xPos
      }
    })
    
    // Linhas de grade horizontais
    const gridCount = 5
    const gridLines = Array.from({ length: gridCount }, (_, i) => {
      const value = min + (range * i / (gridCount - 1))
      const y = chartHeight - ((value - min) / range) * chartHeight
      return { y, value }
    })
    
    console.log('   ✅ Processamento concluído:', primaryPoints.length, 'pontos,', labels.length, 'labels');
    
    return { 
      primaryPoints, 
      secondaryPoints, 
      min, 
      max, 
      labels, 
      gridLines, 
      width, 
      chartHeight,
      sampledCount,
      totalCount: data.length
    }
  }, [data, xKey, yKey, secondaryKey])

  if (!data.length) {
    return <div className="chart-empty">Sem dados para exibir</div>
  }

  if (chartData.primaryPoints.length === 0 && chartData.secondaryPoints.length === 0) {
    return <div className="chart-empty">Sem dados válidos para exibir</div>
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
          {chartData.gridLines.slice().reverse().map((line, i) => (
            <div key={i} className="y-axis-label">
              {line.value.toFixed(1)} {unit}
            </div>
          ))}
        </div>
        
        {/* Container scrollável horizontalmente */}
        <div className="chart-area-scroll" style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          flex: 1,
          position: 'relative'
        }}>
          <div style={{ 
            minWidth: `${chartData.width}px`,
            height: '100%',
            position: 'relative',
            paddingBottom: '50px' // Espaço para os labels
          }}>
            <svg 
              viewBox={`0 0 ${chartData.width} ${chartData.chartHeight}`} 
              preserveAspectRatio="none"
              style={{ 
                width: '100%', 
                height: '100%',
                display: 'block'
              }}
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
              
              {/* Linhas de grade horizontais */}
              {chartData.gridLines.map((line, i) => (
                <line
                  key={`h-${i}`}
                  x1="0"
                  y1={line.y}
                  x2={chartData.width}
                  y2={line.y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
              ))}
              
              {/* Linhas verticais para cada dia */}
              {chartData.labels.map((label, i) => {
                // Mostrar linha vertical a cada 7 dias ou em dias específicos
                const showLine = i === 0 || i === chartData.labels.length - 1 || i % 7 === 0;
                if (showLine) {
                  return (
                    <line
                      key={`v-${i}`}
                      x1={label.xPos}
                      y1="0"
                      x2={label.xPos}
                      y2={chartData.chartHeight}
                      stroke="#e5e7eb"
                      strokeWidth="1"
                      strokeDasharray="2,2"
                      opacity="0.5"
                    />
                  )
                }
                return null
              })}
              
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
              
              {/* Pontos de dados - Primary - UM PONTO POR DIA */}
              {chartData.primaryPoints.map((point, i) => (
                <circle
                  key={`p-${i}`}
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="white"
                  stroke={color}
                  strokeWidth="2"
                >
                  <title>{point.date}: {point.value.toFixed(2)} {unit}</title>
                </circle>
              ))}
              
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
            
            {/* Labels de data no eixo X - dentro do container scrollável */}
            <div style={{
              position: 'absolute',
              bottom: '0',
              left: 0,
              width: '100%',
              height: '50px',
              pointerEvents: 'none'
            }}>
              {chartData.labels.map((label, i) => {
                // Mostrar labels estrategicamente
                const totalDays = chartData.labels.length;
                let showLabel = false;
                
                if (totalDays <= 50) {
                  showLabel = true;
                } else if (totalDays <= 200) {
                  showLabel = i % 3 === 0;
                } else if (totalDays <= 500) {
                  showLabel = i % 7 === 0;
                } else {
                  showLabel = i % 14 === 0;
                }
                
                if (i === 0 || i === totalDays - 1) showLabel = true;
                
                if (showLabel) {
                  return (
                    <span 
                      key={`label-${i}`}
                      style={{
                        position: 'absolute',
                        left: `${label.xPos}px`,
                        top: '5px',
                        transform: 'translateX(-50%) rotate(-45deg)',
                        transformOrigin: 'top left',
                        fontSize: '11px',
                        color: '#6b7280',
                        whiteSpace: 'nowrap',
                        userSelect: 'none',
                        fontWeight: '500'
                      }}
                      title={label.fullDate}
                    >
                      {label.text}
                    </span>
                  )
                }
                return null
              })}
            </div>
          </div>
        </div>
      </div>
      
      <div className="chart-stats-summary" style={{ marginTop: '15px' }}>
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
          <span className="stat-summary-label">Período:</span>
          <span className="stat-summary-value">{chartData.totalCount.toLocaleString()} dias</span>
        </div>
      </div>
    </div>
  )
}
