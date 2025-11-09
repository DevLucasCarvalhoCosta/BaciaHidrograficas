import { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import '../styles/sync-manager.css';

interface SyncStatus {
  isRunning: boolean;
  currentStation?: string;
  progress?: {
    current: number;
    total: number;
    percentage: number;
  };
  lastSync?: {
    startTime: string;
    endTime?: string;
    recordsProcessed: number;
    errors: number;
  };
  currentOperation?: string;
}

interface SyncResult {
  success: boolean;
  totalRegistros: number;
  totalRequisicoes: number;
  erros: number;
  duracaoMs: number;
  detalhes?: string[];
}

interface SyncManagerProps {
  codigoEstacaoInicial?: string;
}

export function SyncManager({ codigoEstacaoInicial }: SyncManagerProps) {
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  // Formulário de sincronização manual
  const [codigoEstacao, setCodigoEstacao] = useState(codigoEstacaoInicial || '75650010');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [dias, setDias] = useState(7);

  // Auto-scroll para o final dos logs quando novos logs forem adicionados
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [syncLogs]);

  // Atualizar código da estação quando a prop mudar
  useEffect(() => {
    if (codigoEstacaoInicial) {
      setCodigoEstacao(codigoEstacaoInicial);
    }
  }, [codigoEstacaoInicial]);

  // Buscar status a cada 2 segundos quando estiver executando
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const fetchStatus = async () => {
      try {
        const data = await api.get('/api/ana/sync/status');
        setStatus(data);
        
        // Não adicionar logs duplicados do status - os logs vêm diretamente da resposta da sincronização
        
        // Se não está executando, parar o polling
        if (!data.isRunning && interval) {
          clearInterval(interval);
          interval = null;
        }
      } catch (error) {
        console.error('Erro ao buscar status:', error);
      }
    };

    // Buscar status inicial
    fetchStatus();

    // Iniciar polling apenas se houver sincronização ativa
    if (status?.isRunning) {
      interval = setInterval(fetchStatus, 2000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [status?.isRunning]); // Reiniciar polling quando status mudar

  // Inicializar datas com valores padrão
  useEffect(() => {
    const hoje = new Date();
    const seteDiasAtras = new Date(hoje);
    seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
    
    setDataFim(hoje.toISOString().split('T')[0]);
    setDataInicio(seteDiasAtras.toISOString().split('T')[0]);
  }, []);

  const handleSyncManual = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setSyncLogs([]);
    setShowLogs(true);
    setLastResult(null);

    // Adicionar log inicial
    setSyncLogs(prev => [...prev, `🚀 Iniciando sincronização da estação ${codigoEstacao}`]);
    setSyncLogs(prev => [...prev, `📅 Período: ${dataInicio} até ${dataFim}`]);

    try {
      const response = await api.post('/api/ana/sync/manual', {
        codigoEstacao,
        dataInicio,
        dataFim,
      }, { timeout: 300000 }); // 5 minutos de timeout para sincronizações longas

      // Se a resposta tem detalhes, adicionar aos logs
      if (response?.detalhes && Array.isArray(response.detalhes)) {
        setSyncLogs(prev => [...prev, ...response.detalhes]);
      } else {
        setSyncLogs(prev => [...prev, '✅ Sincronização iniciada com sucesso']);
        setSyncLogs(prev => [...prev, '⏳ Aguarde enquanto os dados são coletados da API da ANA...']);
      }

      // Armazenar resultado final
      if (response) {
        setLastResult(response);
      }

      setMessage({
        type: 'success',
        text: `Sincronização concluída! ${response?.totalRegistros || 0} registros processados.`,
      });
    } catch (error: any) {
      setSyncLogs(prev => [...prev, `❌ Erro: ${error?.message || 'Erro desconhecido'}`]);
      setMessage({
        type: 'error',
        text: error?.message || 'Erro ao iniciar sincronização',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSyncUltimosDias = async () => {
    setLoading(true);
    setMessage(null);
    setSyncLogs([]);
    setShowLogs(true);
    setLastResult(null);

    // Adicionar log inicial
    setSyncLogs(prev => [...prev, `🚀 Iniciando sincronização rápida`]);
    setSyncLogs(prev => [...prev, `📊 Estação: ${codigoEstacao}`]);
    setSyncLogs(prev => [...prev, `📅 Últimos ${dias} dias`]);

    try {
      const response = await api.post('/api/ana/sync/ultimos-dias', {
        codigoEstacao,
        dias,
      }, { timeout: 300000 }); // 5 minutos de timeout para sincronizações longas

      // Se a resposta tem detalhes, adicionar aos logs
      if (response?.detalhes && Array.isArray(response.detalhes)) {
        setSyncLogs(prev => [...prev, ...response.detalhes]);
      } else {
        setSyncLogs(prev => [...prev, '✅ Sincronização iniciada com sucesso']);
        setSyncLogs(prev => [...prev, '⏳ Aguarde enquanto os dados são coletados da API da ANA...']);
      }

      // Armazenar resultado final
      if (response) {
        setLastResult(response);
      }

      setMessage({
        type: 'success',
        text: `Sincronização concluída! ${response?.totalRegistros || 0} registros processados.`,
      });
    } catch (error: any) {
      setSyncLogs(prev => [...prev, `❌ Erro: ${error?.message || 'Erro desconhecido'}`]);
      setMessage({
        type: 'error',
        text: error?.message || 'Erro ao iniciar sincronização',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('pt-BR');
  };

  return (
    <div className="sync-manager">
      <div className="sync-header">
        <h2>🔄 Gerenciador de Sincronização</h2>
        <p className="sync-subtitle">
          Controle a coleta de dados das estações telemétricas da ANA
        </p>
      </div>

      {/* Status da Sincronização */}
      <div className="sync-status-card">
        <h3>📊 Status Atual</h3>
        {!status ? (
          // Loading skeleton
          <div className="status-content">
            <div className="skeleton-line"></div>
            <div className="skeleton-line short"></div>
          </div>
        ) : (
          <div className="status-content">
            <div className="status-row">
              <span className="status-label">Estado:</span>
              <span className={`status-badge ${status.isRunning ? 'running' : 'idle'}`}>
                {status.isRunning ? '🔄 Executando' : '✅ Ocioso'}
              </span>
            </div>

            {status.isRunning && (
              <>
                <div className="status-row">
                  <span className="status-label">Estação:</span>
                  <span className="status-value">{status.currentStation}</span>
                </div>

                {status.currentOperation && (
                  <div className="status-row">
                    <span className="status-label">Operação:</span>
                    <span className="status-value operation-text">
                      {status.currentOperation}
                    </span>
                  </div>
                )}

                {status.progress && (
                  <div className="progress-section">
                    <div className="progress-bar-container">
                      <div 
                        className="progress-bar" 
                        style={{ width: `${status.progress.percentage}%` }}
                      >
                        <span className="progress-text">
                          {status.progress.percentage}%
                        </span>
                      </div>
                    </div>
                    <span className="progress-label">
                      {status.progress.current} / {status.progress.total} requisições
                    </span>
                  </div>
                )}
              </>
            )}

            {status.lastSync && (
              <div className="last-sync-section">
                <h4>📅 Última Sincronização</h4>
                <div className="status-row">
                  <span className="status-label">Início:</span>
                  <span className="status-value">{formatDate(status.lastSync.startTime)}</span>
                </div>
                {status.lastSync.endTime && (
                  <div className="status-row">
                    <span className="status-label">Fim:</span>
                    <span className="status-value">{formatDate(status.lastSync.endTime)}</span>
                  </div>
                )}
                <div className="status-row">
                  <span className="status-label">Registros:</span>
                  <span className="status-value">{status.lastSync.recordsProcessed.toLocaleString('pt-BR')}</span>
                </div>
                {status.lastSync.errors > 0 && (
                  <div className="status-row">
                    <span className="status-label">Erros:</span>
                    <span className="status-value error">{status.lastSync.errors}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mensagens */}
      {message && (
        <div className={`sync-message ${message.type}`}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      {/* Sincronização Rápida */}
      <div className="sync-card">
        <h3>⚡ Sincronização Rápida</h3>
        <p className="card-description">
          Sincronize os dados mais recentes rapidamente
        </p>
        
        <div className="quick-sync-controls">
          <div className="input-group">
            <label>Últimos:</label>
            <select 
              value={dias} 
              onChange={(e) => setDias(Number(e.target.value))}
              disabled={loading || status?.isRunning}
            >
              <option value={1}>1 dia</option>
              <option value={3}>3 dias</option>
              <option value={7}>7 dias</option>
              <option value={15}>15 dias</option>
              <option value={30}>30 dias</option>
            </select>
          </div>
          
          <button
            onClick={handleSyncUltimosDias}
            disabled={loading || status?.isRunning}
            className="btn btn-primary"
          >
            {loading ? '⏳ Iniciando...' : '🚀 Sincronizar'}
          </button>
        </div>
      </div>

      {/* Sincronização Manual */}
      <div className="sync-card">
        <h3>🎯 Sincronização Personalizada</h3>
        <p className="card-description">
          Configure o período específico para sincronização
        </p>

        <form onSubmit={handleSyncManual} className="sync-form">
          <div className="form-row">
            <div className="input-group">
              <label>Código da Estação:</label>
              <input
                type="text"
                value={codigoEstacao}
                onChange={(e) => setCodigoEstacao(e.target.value)}
                placeholder="Ex: 75650010"
                required
                disabled={loading || status?.isRunning}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="input-group">
              <label>Data Início:</label>
              <input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                required
                disabled={loading || status?.isRunning}
              />
            </div>

            <div className="input-group">
              <label>Data Fim:</label>
              <input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                required
                disabled={loading || status?.isRunning}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || status?.isRunning}
            className="btn btn-secondary"
          >
            {loading ? '⏳ Iniciando...' : '📅 Sincronizar Período'}
          </button>
        </form>
      </div>

      {/* Informações */}
      <div className="sync-info">
        <h4>ℹ️ Informações</h4>
        <ul>
          <li>A sincronização pode levar alguns minutos dependendo do período</li>
          <li>Os dados são atualizados automaticamente no dashboard após a sincronização</li>
          <li>Apenas uma sincronização pode ser executada por vez</li>
          <li>A API da ANA tem limite de requisições, use com moderação</li>
        </ul>
      </div>

      {/* Console de Logs - Nova seção */}
      {showLogs && syncLogs.length > 0 && (
        <div className="sync-logs-card">
          <div className="logs-header">
            <h3>📝 Console de Sincronização</h3>
            <button 
              className="btn-close-logs"
              onClick={() => setShowLogs(false)}
              title="Fechar console"
            >
              ✕
            </button>
          </div>
          <div className="logs-content">
            {syncLogs.map((log, index) => (
              <div key={index} className="log-line">
                <span className="log-timestamp">[{new Date().toLocaleTimeString('pt-BR')}]</span>
                <span className="log-message">{log}</span>
              </div>
            ))}
            {status?.isRunning && (
              <div className="log-line loading">
                <span className="log-timestamp">[...]</span>
                <span className="log-message">
                  <span className="loading-dots">Processando</span>
                </span>
              </div>
            )}
            <div ref={logsEndRef} />
          </div>
          {lastResult && (
            <div className="logs-summary">
              <h4>📊 Resumo Final</h4>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-icon">✅</span>
                  <span className="summary-value">{lastResult.totalRegistros.toLocaleString('pt-BR')}</span>
                  <span className="summary-label">Registros</span>
                </div>
                <div className="summary-item">
                  <span className="summary-icon">📡</span>
                  <span className="summary-value">{lastResult.totalRequisicoes}</span>
                  <span className="summary-label">Requisições</span>
                </div>
                <div className="summary-item">
                  <span className="summary-icon">{lastResult.erros > 0 ? '⚠️' : '✨'}</span>
                  <span className="summary-value">{lastResult.erros}</span>
                  <span className="summary-label">Erros</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
