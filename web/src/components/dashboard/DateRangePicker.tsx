import React, { useState } from 'react'

interface DateRangePickerProps {
  onApply: (startDate: string, endDate: string) => void
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({ onApply }) => {
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleApply = () => {
    if (startDate && endDate) {
      onApply(startDate, endDate)
    }
  }

  const setPreset = (preset: string) => {
    const end = new Date()
    const start = new Date()
    
    switch (preset) {
      case '7d':
        start.setDate(end.getDate() - 7)
        break
      case '30d':
        start.setDate(end.getDate() - 30)
        break
      case '90d':
        start.setDate(end.getDate() - 90)
        break
      case '1y':
        start.setFullYear(end.getFullYear() - 1)
        break
    }
    
    const startStr = start.toISOString().split('T')[0]
    const endStr = end.toISOString().split('T')[0]
    
    setStartDate(startStr)
    setEndDate(endStr)
    onApply(startStr, endStr)
  }

  return (
    <div className="date-range-picker">
      <div className="date-inputs">
        <div className="input-group">
          <label>Data Inicial:</label>
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="input-group">
          <label>Data Final:</label>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <button 
          className="btn-apply"
          onClick={handleApply}
          disabled={!startDate || !endDate}
        >
          Aplicar
        </button>
      </div>
      
      <div className="date-presets">
        <span>Períodos rápidos:</span>
        <button onClick={() => setPreset('7d')}>7 dias</button>
        <button onClick={() => setPreset('30d')}>30 dias</button>
        <button onClick={() => setPreset('90d')}>90 dias</button>
        <button onClick={() => setPreset('1y')}>1 ano</button>
      </div>
    </div>
  )
}
