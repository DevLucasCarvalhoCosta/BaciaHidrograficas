import React, { useState } from 'react'

interface AlertCardProps {
  title: string
  subtitle: string
  data: any[]
  severity: 'danger' | 'warning' | 'info'
  icon: string
}

export const AlertCard: React.FC<AlertCardProps> = ({ 
  title, 
  subtitle, 
  data, 
  severity, 
  icon 
}) => {
  const [expanded, setExpanded] = useState(false)
  
  const severityColors = {
    danger: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b' },
    warning: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
    info: { bg: '#dbeafe', border: '#3b82f6', text: '#1e40af' }
  }
  
  const colors = severityColors[severity]
  const count = data?.length || 0

  return (
    <div 
      className="alert-card" 
      style={{ 
        background: colors.bg, 
        borderLeft: `4px solid ${colors.border}`,
        color: colors.text 
      }}
    >
      <div className="alert-header">
        <span className="alert-icon">{icon}</span>
        <div className="alert-info">
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <div className="alert-count" style={{ background: colors.border, color: 'white' }}>
          {count}
        </div>
      </div>
      
      {count > 0 && (
        <>
          <button 
            className="alert-toggle"
            onClick={() => setExpanded(!expanded)}
            style={{ color: colors.text }}
          >
            {expanded ? '▲' : '▼'} {expanded ? 'Ocultar' : 'Ver'} registros
          </button>
          
          {expanded && (
            <div className="alert-list">
              <table>
                <thead>
                  <tr>
                    <th>Data/Hora</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 10).map((item: any, i: number) => (
                    <tr key={i}>
                      <td>{(() => {
                        try {
                          const date = new Date(item.Data_Hora_Medicao)
                          if (isNaN(date.getTime())) return 'N/A'
                          return date.toLocaleString('pt-BR')
                        } catch {
                          return 'N/A'
                        }
                      })()}</td>
                      <td>
                        {item.Temperatura_Agua && `${parseFloat(item.Temperatura_Agua).toFixed(1)}°C`}
                        {item.Bateria && `${parseFloat(item.Bateria).toFixed(2)}V`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {count > 10 && (
                <p className="alert-more">E mais {count - 10} registros...</p>
              )}
            </div>
          )}
        </>
      )}
      
      {count === 0 && (
        <div className="alert-empty">
          <p>✓ Nenhum alerta encontrado</p>
        </div>
      )}
    </div>
  )
}
