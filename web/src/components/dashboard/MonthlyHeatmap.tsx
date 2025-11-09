import React, { useMemo, useState } from 'react'

interface MonthlyHeatmapProps {
  data: any[]
  metric: string
  title: string
}

interface TooltipProps {
  title: string
  content: string | React.ReactNode
}

const InfoTooltip: React.FC<TooltipProps> = ({ title, content }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const tooltipRef = React.useRef<HTMLDivElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const tooltipWidth = 380
      const viewportWidth = window.innerWidth
      
      let left = rect.right + 8
      let top = rect.top
      
      // Se não couber na direita, coloca na esquerda
      if (left + tooltipWidth > viewportWidth - 20) {
        left = rect.left - tooltipWidth - 8
      }
      
      // Se ainda não couber, centraliza
      if (left < 20) {
        left = Math.max(20, (viewportWidth - tooltipWidth) / 2)
        top = rect.bottom + 8
      }
      
      setPosition({ top, left })
    }
  }

  React.useEffect(() => {
    if (isVisible && tooltipRef.current) {
      const hasScroll = tooltipRef.current.scrollHeight > tooltipRef.current.clientHeight
      if (hasScroll) {
        tooltipRef.current.classList.add('has-scroll')
      } else {
        tooltipRef.current.classList.remove('has-scroll')
      }
      updatePosition()
    }
  }, [isVisible])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isPinned &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsPinned(false)
        setIsVisible(false)
      }
    }

    const handleScroll = () => {
      if (isVisible) {
        updatePosition()
      }
    }

    if (isPinned) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    if (isVisible) {
      window.addEventListener('scroll', handleScroll, true)
      window.addEventListener('resize', handleScroll)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScroll, true)
      window.removeEventListener('resize', handleScroll)
    }
  }, [isPinned, isVisible])

  const handleMouseEnter = () => {
    if (!isPinned) {
      setIsVisible(true)
    }
  }

  const handleMouseLeave = () => {
    if (!isPinned) {
      setIsVisible(false)
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isPinned) {
      setIsPinned(false)
      setIsVisible(false)
    } else {
      setIsPinned(true)
      setIsVisible(true)
    }
  }

  return (
    <div className="tooltip-container" ref={containerRef}>
      <button
        ref={buttonRef}
        className={`info-icon ${isPinned ? 'pinned' : ''}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        aria-label="Informação"
      />
      {isVisible && (
        <div 
          ref={tooltipRef}
          className="tooltip-content" 
          style={{ top: `${position.top}px`, left: `${position.left}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <h4>{title}</h4>
          {typeof content === 'string' ? <p>{content}</p> : content}
        </div>
      )}
    </div>
  )
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
    <div className="monthly-heatmap" style={{ position: 'relative' }}>
      <InfoTooltip
        title="Mapa de Calor"
        content={
          <>
            <p>
              <strong>Visualização Termográfica</strong> que representa a intensidade 
              de {title.toLowerCase()} através de gradiente de cores.
            </p>
            <div className="tooltip-section">
              <div className="tooltip-section-title">🎨 Escala de Cores:</div>
              <p>
                <strong style={{color: '#6666ff'}}>Azul:</strong> Valores baixos (mínimo detectado)<br/>
                <strong style={{color: '#ff6666'}}>Vermelho:</strong> Valores altos (máximo detectado)
              </p>
            </div>
            <div className="tooltip-section">
              <div className="tooltip-section-title">📊 Interpretação:</div>
              <ul>
                <li>Padrões de cores agrupados indicam sazonalidade</li>
                <li>Células vermelhas isoladas podem indicar eventos extremos</li>
                <li>Transições graduais sugerem mudanças suaves</li>
              </ul>
            </div>
            <div className="tooltip-note">
              💡 Passe o mouse sobre cada célula para ver valores exatos.
            </div>
          </>
        }
      />
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
