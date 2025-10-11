import React, { useState, useMemo } from 'react'
import * as XLSX from 'xlsx'

interface DataTableProps {
  data: any[]
  columns: {
    key: string
    label: string
    sortable?: boolean
    filterable?: boolean
    format?: (value: any) => string
  }[]
  title?: string
  exportFileName?: string
}

type SortDirection = 'asc' | 'desc' | null

export const DataTable: React.FC<DataTableProps> = ({ 
  data, 
  columns, 
  title = 'Dados',
  exportFileName = 'dados-exportados'
}) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  // Aplicar filtros e ordenação
  const processedData = useMemo(() => {
    let filtered = [...data]

    // Aplicar filtros
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        filtered = filtered.filter(item => {
          const itemValue = String(item[key] || '').toLowerCase()
          return itemValue.includes(value.toLowerCase())
        })
      }
    })

    // Aplicar ordenação
    if (sortColumn && sortDirection) {
      filtered.sort((a, b) => {
        const aVal = a[sortColumn]
        const bVal = b[sortColumn]
        
        if (aVal === null || aVal === undefined) return 1
        if (bVal === null || bVal === undefined) return -1
        
        // Tentar comparar como número
        const aNum = parseFloat(aVal)
        const bNum = parseFloat(bVal)
        
        if (!isNaN(aNum) && !isNaN(bNum)) {
          return sortDirection === 'asc' ? aNum - bNum : bNum - aNum
        }
        
        // Comparar como string
        const aStr = String(aVal).toLowerCase()
        const bStr = String(bVal).toLowerCase()
        
        if (sortDirection === 'asc') {
          return aStr < bStr ? -1 : aStr > bStr ? 1 : 0
        } else {
          return aStr > bStr ? -1 : aStr < bStr ? 1 : 0
        }
      })
    }

    return filtered
  }, [data, filters, sortColumn, sortDirection])

  // Paginação
  const totalPages = Math.ceil(processedData.length / itemsPerPage)
  const paginatedData = processedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey)
    if (!column?.sortable) return

    if (sortColumn === columnKey) {
      // Alternar direção: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortDirection(null)
        setSortColumn(null)
      }
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  const handleFilterChange = (columnKey: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [columnKey]: value
    }))
    setCurrentPage(1) // Resetar para primeira página ao filtrar
  }

  const clearFilters = () => {
    setFilters({})
    setSortColumn(null)
    setSortDirection(null)
    setCurrentPage(1)
  }

  const exportToExcel = () => {
    // Preparar dados para exportação
    const exportData = processedData.map(row => {
      const formattedRow: any = {}
      columns.forEach(col => {
        const value = row[col.key]
        formattedRow[col.label] = col.format ? col.format(value) : value
      })
      return formattedRow
    })

    // Criar workbook e worksheet
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    
    // Limitar nome da planilha para 31 caracteres (limite do Excel)
    const sheetName = title.length > 31 ? title.substring(0, 28) + '...' : title
    XLSX.utils.book_append_sheet(wb, ws, sheetName)

    // Ajustar largura das colunas
    const columnWidths = columns.map(col => ({
      wch: Math.max(col.label.length + 2, 15)
    }))
    ws['!cols'] = columnWidths

    // Download
    const timestamp = new Date().toISOString().slice(0, 10)
    XLSX.writeFile(wb, `${exportFileName}_${timestamp}.xlsx`)
  }

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) return '⇅'
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  return (
    <div className="data-table-container">
      <div className="data-table-header">
        <div className="table-title-section">
          <h3>{title}</h3>
          <span className="table-count">
            {processedData.length} {processedData.length === 1 ? 'registro' : 'registros'}
            {processedData.length !== data.length && ` (filtrado de ${data.length})`}
          </span>
        </div>
        
        <div className="table-actions">
          {Object.keys(filters).some(key => filters[key]) && (
            <button className="btn-clear-filters" onClick={clearFilters}>
              🗑️ Limpar Filtros
            </button>
          )}
          <button className="btn-export" onClick={exportToExcel}>
            📊 Exportar XLSX
          </button>
        </div>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} className={col.sortable ? 'sortable' : ''}>
                  <div className="th-content">
                    <span 
                      onClick={() => col.sortable && handleSort(col.key)}
                      className="column-label"
                    >
                      {col.label}
                      {col.sortable && (
                        <span className="sort-icon">{getSortIcon(col.key)}</span>
                      )}
                    </span>
                  </div>
                  {col.filterable && (
                    <input
                      type="text"
                      className="column-filter"
                      placeholder="Filtrar..."
                      value={filters[col.key] || ''}
                      onChange={(e) => handleFilterChange(col.key, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="no-data">
                  Nenhum dado encontrado
                </td>
              </tr>
            ) : (
              paginatedData.map((row, idx) => (
                <tr key={idx}>
                  {columns.map(col => (
                    <td key={col.key}>
                      {col.format ? col.format(row[col.key]) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="table-pagination">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            ⟪
          </button>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            ‹
          </button>
          
          <div className="pagination-info">
            Página {currentPage} de {totalPages}
          </div>
          
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            ›
          </button>
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            ⟫
          </button>
        </div>
      )}
    </div>
  )
}
