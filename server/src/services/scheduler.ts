import { sincronizarUltimosDias } from './syncService';

// Configurações do scheduler
const SYNC_INTERVAL_HOURS = parseInt(process.env.SYNC_INTERVAL_HOURS || '24', 10);
const SYNC_ENABLED = process.env.SYNC_AUTO_ENABLED !== 'false'; // Habilitado por padrão
const ESTACAO_PADRAO = '75650010';

let schedulerInterval: NodeJS.Timeout | null = null;

/**
 * Executa sincronização automática
 */
async function executarSyncAutomatico() {
  console.log('[Scheduler] Iniciando sincronização automática...');
  
  try {
    const result = await sincronizarUltimosDias(ESTACAO_PADRAO, 1); // Sincronizar último dia
    
    if (result.success) {
      console.log('[Scheduler] ✅ Sincronização concluída com sucesso');
      console.log(`[Scheduler] 📊 ${result.totalRegistros} registros processados`);
    } else {
      console.error('[Scheduler] ❌ Sincronização falhou');
      console.error(`[Scheduler] Erros: ${result.erros}`);
    }
  } catch (error: any) {
    console.error('[Scheduler] ❌ Erro durante sincronização automática:', error.message);
  }
}

/**
 * Inicia o agendador de sincronização automática
 */
export function iniciarScheduler() {
  if (!SYNC_ENABLED) {
    console.log('[Scheduler] ⏸️  Sincronização automática desabilitada (SYNC_AUTO_ENABLED=false)');
    return;
  }

  const intervalMs = SYNC_INTERVAL_HOURS * 60 * 60 * 1000;
  
  console.log(`[Scheduler] 🚀 Iniciando scheduler de sincronização automática`);
  console.log(`[Scheduler] ⏱️  Intervalo: a cada ${SYNC_INTERVAL_HOURS} hora(s)`);
  console.log(`[Scheduler] 🎯 Estação: ${ESTACAO_PADRAO}`);

  // Executar imediatamente na inicialização (opcional)
  if (process.env.SYNC_ON_STARTUP === 'true') {
    console.log('[Scheduler] 🏃 Executando sincronização inicial...');
    setTimeout(() => {
      executarSyncAutomatico();
    }, 5000); // Aguardar 5 segundos após startup
  }

  // Agendar execuções periódicas
  schedulerInterval = setInterval(executarSyncAutomatico, intervalMs);
  
  console.log('[Scheduler] ✅ Scheduler iniciado com sucesso');
}

/**
 * Para o agendador de sincronização automática
 */
export function pararScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[Scheduler] ⏸️  Scheduler parado');
  }
}

/**
 * Verifica se o scheduler está ativo
 */
export function schedulerAtivo(): boolean {
  return schedulerInterval !== null;
}
