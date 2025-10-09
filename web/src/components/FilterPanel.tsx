import React from 'react'

export type FieldType = 'string' | 'number'

export type FilterOp =
  | 'contains'
  | 'notContains'
  | 'equals'
  | 'startsWith'
  | 'endsWith'
  | 'in'
  | '>'
  | '>='
  | '<'
  | '<='
  | '='
  | '!='
  | 'between'

export interface FilterRule {
  id: string
  field: string
  type: FieldType
  op: FilterOp
  value1: string
  value2?: string
}

export interface FilterPanelProps {
  fields: Array<{ name: string; type: FieldType }>
  rules: FilterRule[]
  onChange: (rules: FilterRule[]) => void
  onApply: () => void
  onReset: () => void
}

function newRule(defaultField?: { name: string; type: FieldType }): FilterRule {
  return {
    id: Math.random().toString(36).slice(2),
    field: defaultField?.name || '',
    type: defaultField?.type || 'string',
    op: defaultField?.type === 'number' ? '=' : 'contains',
    value1: '',
  }
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ fields, rules, onChange, onApply, onReset }) => {
  const onAdd = () => onChange([...(rules || []), newRule(fields[0])])
  const onRemove = (id: string) => onChange((rules || []).filter(r => r.id !== id))
  const onUpdate = (id: string, patch: Partial<FilterRule>) =>
    onChange((rules || []).map(r => (r.id === id ? { ...r, ...patch } : r)))

  const renderOps = (t: FieldType) => (
    <>
      {t === 'string' ? (
        <>
          <option value="contains">contém</option>
          <option value="notContains">não contém</option>
          <option value="equals">igual</option>
          <option value="startsWith">começa com</option>
          <option value="endsWith">termina com</option>
          <option value="in">em lista (vírgulas)</option>
        </>
      ) : (
        <>
          <option value="=">=</option>
          <option value=">">&gt;</option>
          <option value=">=">&gt;=</option>
          <option value="<">&lt;</option>
          <option value="<=">&lt;=</option>
          <option value="!=">!=</option>
          <option value="between">entre</option>
        </>
      )}
    </>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={onAdd} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>➕</span> Adicionar Filtro
        </button>
        <button onClick={onApply} className="btn primary">
          ✓ Aplicar Filtros
        </button>
        <button onClick={onReset} style={{ background: '#fef2f2', color: '#dc2626', borderColor: '#fca5a5' }}>
          🗑️ Limpar Tudo
        </button>
      </div>
      {(rules || []).map((r) => (
        <div key={r.id} style={{ 
          display: 'flex', 
          gap: 8, 
          alignItems: 'center', 
          flexWrap: 'wrap',
          padding: '12px',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1.5px solid #e2e8f0'
        }}>
          <select
            value={r.field}
            onChange={(e) => {
              const f = fields.find(x => x.name === e.target.value) || fields[0]
              onUpdate(r.id, { field: f.name, type: f.type, op: f.type === 'number' ? '=' : 'contains', value1: '', value2: '' })
            }}
            style={{ flex: '1 1 180px' }}
          >
            {fields.map((f) => (
              <option key={f.name} value={f.name}>{f.name}</option>
            ))}
          </select>
          <select 
            value={r.op} 
            onChange={(e) => onUpdate(r.id, { op: e.target.value as FilterOp })}
            style={{ flex: '0 1 140px' }}
          >
            {renderOps(r.type)}
          </select>
          <input
            placeholder={r.type === 'number' ? 'valor numérico' : 'texto para busca'}
            value={r.value1}
            onChange={(e) => onUpdate(r.id, { value1: e.target.value })}
            style={{ flex: '1 1 160px' }}
          />
          {r.type === 'number' && r.op === 'between' && (
            <input
              placeholder="valor máximo"
              value={r.value2 || ''}
              onChange={(e) => onUpdate(r.id, { value2: e.target.value })}
              style={{ flex: '1 1 160px' }}
            />
          )}
          <button 
            onClick={() => onRemove(r.id)}
            style={{ 
              background: '#fef2f2', 
              color: '#dc2626', 
              borderColor: '#fca5a5',
              flex: '0 0 auto'
            }}
          >
            ✗
          </button>
        </div>
      ))}
    </div>
  )
}
