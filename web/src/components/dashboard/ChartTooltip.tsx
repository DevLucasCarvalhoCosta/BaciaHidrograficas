import React, { useState } from 'react'

interface ChartTooltipProps {
  title: string
  content: string | React.ReactNode
  children: React.ReactNode
}

export const ChartTooltip: React.FC<ChartTooltipProps> = ({ title, content, children }) => {
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
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div 
        ref={containerRef}
        className="tooltip-container" 
        style={{ position: 'absolute', top: '0', right: '0', zIndex: 10 }}
      >
        <button
          ref={buttonRef}
          className={`info-icon ${isPinned ? 'pinned' : ''}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          aria-label="Informação sobre o gráfico"
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
      {children}
    </div>
  )
}
