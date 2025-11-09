import { useState, useEffect } from 'react';
import { api } from '../services/api';
import '../styles/data-viewer.css';

interface StationInfo {
  codigoEstacao: string;
  nome: string;
  latitude: number | null;
  longitude: number | null;
  totalRegistros: number;
  periodoInicio: string;
  periodoFim: string;
}

interface StationStats {
  codigoEstacao: string;
  total: number;
  periodo: {
    inicio: string;
    fim: string;
  } | null;
  tiposDados: {
    chuva: number;
    vazao: number;
    cota: number;
    temperatura: number;
  };
}

interface SerieData {
  Data_Hora_Medicao: string;
  Chuva_Acumulada: string | null;
  Chuva_Adotada: string | null;
  Temperatura_Agua: string | null;
  Vazao_Adotada: string | null;
  Cota_Adotada: string | null;
  Bateria: string | null;
}

interface DataViewerProps {
  onGoToMap?: (codigoEstacao: string) => void;
}

export function DataViewer({ onGoToMap }: DataViewerProps) {
  const [estacoes, setEstacoes] = useState<StationInfo[]>([]);
  const [stats, setStats] = useState<StationStats | null>(null);
  const [dados, setDados] = useState<SerieData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [codigoEstacao, setCodigoEstacao] = useState<string>(''); // Agora será selecionável
  const [nomeEstacao, setNomeEstacao] = useState<string>(''); // Nome da estação selecionada
  const [tipoDado, setTipoDado] = useState<'all' | 'chuva' | 'vazao' | 'cota' | 'temperatura'>('all');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [limit, setLimit] = useState(100);

  // Carregar lista de estações ao montar
  useEffect(() => {
    carregarEstacoes();
  }, []);

  // Carregar estatísticas quando estação for selecionada
  useEffect(() => {
    if (codigoEstacao) {
      carregarEstatisticas();
    }
  }, [codigoEstacao]);

  const carregarEstacoes = async () => {
    try {
      setLoading(true);
      const data = await api.get('/api/ana/series/estacoes/lista');
      setEstacoes(data);
      
      // Selecionar a primeira estação automaticamente
      if (data.length > 0 && !codigoEstacao) {
        setCodigoEstacao(data[0].codigoEstacao);
        setNomeEstacao(data[0].nome);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const carregarEstatisticas = async () => {
    if (!codigoEstacao) return;
    
    try {
      setLoading(true);
      const data = await api.get(`/api/ana/series/${codigoEstacao}`);
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const carregarDados = async () => {
    if (!codigoEstacao) {
      setError('Selecione uma estação primeiro');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const params: any = { limit };
      if (dataInicio) params.dataInicio = dataInicio;
      if (dataFim) params.dataFim = dataFim;

      const data = await api.get(`/api/ana/series/${codigoEstacao}/${tipoDado}`, { params });
      setDados(data.data || []);
    } catch (err: any) {
      setError(err.message);
      setDados([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR');
  };

  const formatValue = (value: string | null) => {
    if (!value || value === 'null') return '-';
    const num = parseFloat(value);
    return isNaN(num) ? value : num.toFixed(2);
  };

  return (
    <div className="data-viewer">
      <div className="data-header">
        <h2>📊 Visualização de Dados</h2>
        <p className="data-subtitle">
          Estações com dados sincronizados
        </p>
      </div>

      {/* Lista de Estações */}
      <div className="stations-selector">
        <h3>🏢 Selecione uma Estação</h3>
        
        {estacoes.length === 0 && !loading && (
          <div className="empty-stations">
            <p>Nenhuma estação com dados sincronizados</p>
            <p className="hint">Use a aba "Sincronização" para importar dados</p>
          </div>
        )}

        {estacoes.length > 0 && (
          <div className="stations-grid">
            {estacoes.map((est) => (
              <div 
                key={est.codigoEstacao}
                className={`station-card ${codigoEstacao === est.codigoEstacao ? 'selected' : ''}`}
                onClick={() => {
                  setCodigoEstacao(est.codigoEstacao);
                  setNomeEstacao(est.nome);
                }}
              >
                <div className="station-header">
                  <h4>{est.nome}</h4>
                  <span className="station-code">{est.codigoEstacao}</span>
                </div>
                <div className="station-info">
                  <span>📊 {est.totalRegistros.toLocaleString('pt-BR')} registros</span>
                  {est.latitude && est.longitude && onGoToMap && (
                    <button 
                      className="btn-map-mini"
                      onClick={(e) => {
                        e.stopPropagation();
                        onGoToMap(est.codigoEstacao);
                      }}
                      title="Dashboard detalhado"
                    >
                      �
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mostrar estatísticas apenas se uma estação estiver selecionada */}
      {codigoEstacao && (
        <>
          <div className="selected-station-info">
            <div>
              <h3>📍 {nomeEstacao}</h3>
              <p style={{ margin: '5px 0 0 0', opacity: 0.9, fontSize: '0.95em' }}>
                Código: <strong>{codigoEstacao}</strong>
              </p>
            </div>
            {onGoToMap && (
              <button 
                className="btn-view-map"
                onClick={() => onGoToMap(codigoEstacao)}
              >
                📊 Dashboard Detalhado
              </button>
            )}
          </div>

      {/* Estatísticas */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <div className="stat-value">{stats.total.toLocaleString('pt-BR')}</div>
              <div className="stat-label">Registros Totais</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🌧️</div>
            <div className="stat-content">
              <div className="stat-value">{stats.tiposDados.chuva.toLocaleString('pt-BR')}</div>
              <div className="stat-label">Dados de Chuva</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🌊</div>
            <div className="stat-content">
              <div className="stat-value">{stats.tiposDados.vazao.toLocaleString('pt-BR')}</div>
              <div className="stat-label">Dados de Vazão</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🌡️</div>
            <div className="stat-content">
              <div className="stat-value">{stats.tiposDados.temperatura.toLocaleString('pt-BR')}</div>
              <div className="stat-label">Dados de Temperatura</div>
            </div>
          </div>

          {stats.periodo && (
            <div className="stat-card">
              <div className="stat-icon">📅</div>
              <div className="stat-content">
                <div className="stat-value" style={{ fontSize: '1.2em' }}>Período</div>
                <div className="stat-label" style={{ fontSize: '1em', whiteSpace: 'normal', lineHeight: '1.3', marginTop: '8px' }}>
                  {formatDate(stats.periodo.inicio).split(',')[0]}
                </div>
                <div className="stat-label" style={{ marginTop: '4px' }}>
                  ATÉ {formatDate(stats.periodo.fim).split(',')[0]}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filtros */}
      <div className="filters-card">
        <h3>🔍 Filtros</h3>
        
        <div className="filter-row">
          <div className="filter-group">
            <label>Tipo de Dado:</label>
            <select value={tipoDado} onChange={(e) => setTipoDado(e.target.value as any)}>
              <option value="all">Todos os Dados</option>
              <option value="chuva">🌧️ Chuva</option>
              <option value="vazao">🌊 Vazão</option>
              <option value="cota">📏 Nível/Cota</option>
              <option value="temperatura">🌡️ Temperatura</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Limite de Registros:</label>
            <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
              <option value={50}>50 registros</option>
              <option value={100}>100 registros</option>
              <option value={500}>500 registros</option>
              <option value={1000}>1000 registros</option>
            </select>
          </div>
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <label>Data Início:</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Data Fim:</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
            />
          </div>
        </div>

        <button 
          onClick={carregarDados} 
          disabled={loading}
          className="btn-load"
        >
          {loading ? '⏳ Carregando...' : '🔍 Buscar Dados'}
        </button>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <div className="error-message">
          ❌ {error}
        </div>
      )}

      {/* Tabela de dados */}
      {dados.length > 0 && (
        <div className="data-table-container">
          <div className="table-header">
            <h3>📋 Dados ({dados.length} registros)</h3>
            <button 
              onClick={() => exportarCSV(dados)} 
              className="btn-export"
            >
              📥 Exportar CSV
            </button>
          </div>

          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Chuva (mm)</th>
                  <th>Temperatura (°C)</th>
                  <th>Vazão (m³/s)</th>
                  <th>Cota (m)</th>
                  <th>Bateria (V)</th>
                </tr>
              </thead>
              <tbody>
                {dados.map((item, index) => (
                  <tr key={index}>
                    <td className="date-cell">{formatDate(item.Data_Hora_Medicao)}</td>
                    <td>{formatValue(item.Chuva_Acumulada || item.Chuva_Adotada)}</td>
                    <td>{formatValue(item.Temperatura_Agua)}</td>
                    <td>{formatValue(item.Vazao_Adotada)}</td>
                    <td>{formatValue(item.Cota_Adotada)}</td>
                    <td>{formatValue(item.Bateria)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {dados.length >= limit && (
            <div className="table-footer">
              ℹ️ Mostrando {dados.length} registros. Ajuste o limite ou use filtros de data para ver mais.
            </div>
          )}
        </div>
      )}
        </>
      )}

      {/* Mensagem vazia */}
      {!loading && dados.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>Nenhum dado encontrado</p>
          <p className="empty-hint">
            Configure os filtros e clique em "Buscar Dados"
          </p>
        </div>
      )}
    </div>
  );
}

// Função para exportar CSV
function exportarCSV(dados: SerieData[]) {
  const headers = ['Data/Hora', 'Chuva (mm)', 'Temperatura (°C)', 'Vazão (m³/s)', 'Cota (m)', 'Bateria (V)'];
  
  const rows = dados.map(item => [
    new Date(item.Data_Hora_Medicao).toLocaleString('pt-BR'),
    item.Chuva_Acumulada || item.Chuva_Adotada || '',
    item.Temperatura_Agua || '',
    item.Vazao_Adotada || '',
    item.Cota_Adotada || '',
    item.Bateria || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `dados_estacao_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
