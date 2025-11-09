import React from 'react'

interface StatCardProps {
  title: string
  icon: string
  value: number | string
  unit: string
  subtitle: string
  trend: number // percentual de mudança
  color: string
  insightText?: string // Texto de insight contextual
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  icon, 
  value, 
  unit, 
  subtitle, 
  trend, 
  color,
  insightText
}) => {

  const getTrendIcon = () => {
    if (trend > 0) return '📈'
    if (trend < 0) return '📉'
    return '➡️'
  }

  const getTrendColor = () => {
    if (trend > 0) return '#10b981'
    if (trend < 0) return '#ef4444'
    return '#6b7280'
  }

  return (
    <div className="stat-card" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="stat-header">
        <span className="stat-icon">{icon}</span>
        <h3 className="stat-title">{title}</h3>
      </div>
      <div className="stat-value">
        <span className="value">{typeof value === 'number' ? value.toLocaleString() : value}</span>
        <span className="unit">{unit}</span>
      </div>
      <div className="stat-subtitle">{subtitle}</div>
      {trend !== 0 && (
        <div className="stat-trend" style={{ color: getTrendColor() }}>
          <span>{getTrendIcon()}</span>
          <span>{Math.abs(trend).toFixed(1)}%</span>
          <span className="trend-label">vs. mês anterior</span>
        </div>
      )}
      {insightText && (
        <div className="stat-insight">
          <div className="insight-icon">💡</div>
          <div className="insight-text">{insightText}</div>
        </div>
      )}
    </div>
  )
}
