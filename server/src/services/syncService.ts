import { prisma } from '../db/prisma';
import { AnaClient } from './anaClient';

const ANA_BASE_URL = process.env.ANA_BASE_URL || 'https://api.ana.gov.br/hidrowebservice';
const ANA_IDENTIFICADOR = process.env.ANA_IDENTIFICADOR || '';
const ANA_SENHA = process.env.ANA_SENHA || '';

export interface SyncStatus {
  isRunning: boolean;
  currentStation?: string;
  progress?: {
    current: number;
    total: number;
    percentage: number;
  };
  lastSync?: {
    startTime: Date;
    endTime?: Date;
    recordsProcessed: number;
    errors: number;
  };
  currentOperation?: string;
}

export interface SyncOptions {
  codigoEstacao: string;
  dataInicio: string; // yyyy-MM-dd
  dataFim: string;    // yyyy-MM-dd
  intervaloDias?: number; // Padrão: 30
}

export interface SyncResult {
  success: boolean;
  codigoEstacao: string;
  periodo: {
    inicio: string;
    fim: string;
  };
  totalRequisicoes: number;
  totalRegistros: number;
  erros: number;
  duracaoMs: number;
  detalhes: string[];
}

// Estado global da sincronização
let syncStatus: SyncStatus = {
  isRunning: false,
};

/**
 * Obtém o status atual da sincronização
 */
export function getSyncStatus(): SyncStatus {
  return { ...syncStatus };
}

/**
 * Gera lista de datas com intervalos configuráveis
 */
function gerarIntervalosDatas(dataInicio: string, dataFim: string, intervaloDias: number = 30): string[] {
  const datas: string[] = [];
  const inicio = new Date(dataInicio);
  const fim = new Date(dataFim);
  
  let dataAtual = inicio;
  
  while (dataAtual <= fim) {
    const ano = dataAtual.getFullYear();
    const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
    const dia = String(dataAtual.getDate()).padStart(2, '0');
    datas.push(`${ano}-${mes}-${dia}`);
    
    // Avançar N dias
    dataAtual = new Date(dataAtual.getTime() + intervaloDias * 24 * 60 * 60 * 1000);
  }
  
  return datas;
}

/**
 * Processa e salva os dados de uma requisição
 */
async function processarDados(codigoEstacao: string, dados: any[]): Promise<{ salvos: number; erros: number }> {
  let salvos = 0;
  let erros = 0;
  
  for (const item of dados) {
    try {
      await prisma.serieTelemetrica.upsert({
        where: {
          codigoestacao_Data_Hora_Medicao: {
            codigoestacao: item.codigoestacao || codigoEstacao,
            Data_Hora_Medicao: new Date(item.Data_Hora_Medicao),
          },
        },
        update: {
          Data_Atualizacao: item.Data_Atualizacao,
          Chuva_Acumulada: item.Chuva_Acumulada,
          Chuva_Acumulada_Status: item.Chuva_Acumulada_Status,
          Chuva_Adotada: item.Chuva_Adotada,
          Chuva_Adotada_Status: item.Chuva_Adotada_Status,
          Cota_Sensor: item.Cota_Sensor,
          Cota_Sensor_Status: item.Cota_Sensor_Status,
          Cota_Adotada: item.Cota_Adotada,
          Cota_Adotada_Status: item.Cota_Adotada_Status,
          Cota_Display: item.Cota_Display,
          Cota_Display_Status: item.Cota_Display_Status,
          Cota_Manual: item.Cota_Manual,
          Cota_Manual_Status: item.Cota_Manual_Status,
          Vazao_Adotada: item.Vazao_Adotada,
          Vazao_Adotada_Status: item.Vazao_Adotada_Status,
          Temperatura_Agua: item.Temperatura_Agua,
          Temperatura_Agua_Status: item.Temperatura_Agua_Status,
          Temperatura_Interna: item.Temperatura_Interna,
          Pressao_Atmosferica: item.Pressao_Atmosferica,
          Pressao_Atmosferica_Status: item.Pressao_Atmosferica_Status,
          Bateria: item.Bateria,
        },
        create: {
          codigoestacao: item.codigoestacao || codigoEstacao,
          Data_Hora_Medicao: new Date(item.Data_Hora_Medicao),
          Data_Atualizacao: item.Data_Atualizacao,
          Chuva_Acumulada: item.Chuva_Acumulada,
          Chuva_Acumulada_Status: item.Chuva_Acumulada_Status,
          Chuva_Adotada: item.Chuva_Adotada,
          Chuva_Adotada_Status: item.Chuva_Adotada_Status,
          Cota_Sensor: item.Cota_Sensor,
          Cota_Sensor_Status: item.Cota_Sensor_Status,
          Cota_Adotada: item.Cota_Adotada,
          Cota_Adotada_Status: item.Cota_Adotada_Status,
          Cota_Display: item.Cota_Display,
          Cota_Display_Status: item.Cota_Display_Status,
          Cota_Manual: item.Cota_Manual,
          Cota_Manual_Status: item.Cota_Manual_Status,
          Vazao_Adotada: item.Vazao_Adotada,
          Vazao_Adotada_Status: item.Vazao_Adotada_Status,
          Temperatura_Agua: item.Temperatura_Agua,
          Temperatura_Agua_Status: item.Temperatura_Agua_Status,
          Temperatura_Interna: item.Temperatura_Interna,
          Pressao_Atmosferica: item.Pressao_Atmosferica,
          Pressao_Atmosferica_Status: item.Pressao_Atmosferica_Status,
          Bateria: item.Bateria,
        },
      });
      salvos++;
    } catch (error) {
      console.error(`Erro ao salvar registro de ${item.Data_Hora_Medicao}:`, error);
      erros++;
    }
  }
  
  return { salvos, erros };
}

/**
 * Executa sincronização de dados da ANA
 */
export async function executarSincronizacao(options: SyncOptions): Promise<SyncResult> {
  // Verificar se já está executando
  if (syncStatus.isRunning) {
    throw new Error('Já existe uma sincronização em andamento');
  }

  const { codigoEstacao, dataInicio, dataFim, intervaloDias = 30 } = options;
  const detalhes: string[] = [];
  const startTime = Date.now();

  // Atualizar status
  syncStatus = {
    isRunning: true,
    currentStation: codigoEstacao,
    lastSync: {
      startTime: new Date(),
      recordsProcessed: 0,
      errors: 0,
    },
  };

  try {
    // Verificar credenciais
    if (!ANA_IDENTIFICADOR || !ANA_SENHA) {
      throw new Error('Configure ANA_IDENTIFICADOR e ANA_SENHA no arquivo .env');
    }

    const anaClient = new AnaClient({ baseURL: ANA_BASE_URL });

    // Obter token de autenticação
    detalhes.push('🔑 Fazendo login na API da ANA...');
    const { token } = await anaClient.login(ANA_IDENTIFICADOR, ANA_SENHA);
    detalhes.push('✅ Token obtido com sucesso');

    // Gerar intervalos de datas
    const datas = gerarIntervalosDatas(dataInicio, dataFim, intervaloDias);
    detalhes.push(`📅 Total de requisições necessárias: ${datas.length}`);
    detalhes.push(`   Período: ${datas[0]} até ${datas[datas.length - 1]}`);

    let totalRegistros = 0;
    let totalErros = 0;

    // Processar cada intervalo
    for (let i = 0; i < datas.length; i++) {
      const dataBusca = datas[i];
      
      // Atualizar progresso
      syncStatus.progress = {
        current: i + 1,
        total: datas.length,
        percentage: Math.round(((i + 1) / datas.length) * 100),
      };
      syncStatus.currentOperation = `Buscando dados de ${dataBusca}`;

      try {
        detalhes.push(`[${i + 1}/${datas.length}] 📡 Buscando dados de ${dataBusca}...`);

        // Buscar dados telemetricos detalhados
        const dados = await anaClient.getSerieTelemetricaDetalhada(token, {
          codigoEstacao: codigoEstacao,
          tipoFiltroData: 'DATA_LEITURA',
          dataBusca: dataBusca,
          rangeIntervalo: `DIAS_${intervaloDias}`,
        });

        if (!dados || dados.length === 0) {
          detalhes.push(`   ⚠️  Nenhum dado retornado para esta data`);
          continue;
        }

        detalhes.push(`   ✅ ${dados.length} registros recebidos`);
        detalhes.push(`   💾 Salvando no banco de dados...`);

        const { salvos, erros } = await processarDados(codigoEstacao, dados as any[]);
        totalRegistros += salvos;
        totalErros += erros;

        // Atualizar contador no status
        if (syncStatus.lastSync) {
          syncStatus.lastSync.recordsProcessed = totalRegistros;
          syncStatus.lastSync.errors = totalErros;
        }

        detalhes.push(`   ✅ ${salvos} registros salvos/atualizados`);
        if (erros > 0) {
          detalhes.push(`   ⚠️ ${erros} erros ao salvar`);
        }

        // Pequena pausa entre requisições
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        totalErros++;
        detalhes.push(`   ❌ Erro ao processar ${dataBusca}: ${error.message}`);
        detalhes.push(`   ⏭️  Continuando com próxima data...`);
      }
    }

    const duracaoMs = Date.now() - startTime;
    detalhes.push('═══════════════════════════════════════════════════════════');
    detalhes.push('✅ Sincronização concluída!');
    detalhes.push(`📊 Total de registros processados: ${totalRegistros}`);
    detalhes.push(`⏱️  Duração: ${Math.round(duracaoMs / 1000)}s`);

    // Atualizar status final
    if (syncStatus.lastSync) {
      syncStatus.lastSync.endTime = new Date();
      syncStatus.lastSync.recordsProcessed = totalRegistros;
      syncStatus.lastSync.errors = totalErros;
    }

    return {
      success: true,
      codigoEstacao,
      periodo: { inicio: dataInicio, fim: dataFim },
      totalRequisicoes: datas.length,
      totalRegistros,
      erros: totalErros,
      duracaoMs,
      detalhes,
    };

  } catch (error: any) {
    detalhes.push(`❌ Erro fatal: ${error.message}`);
    
    if (syncStatus.lastSync) {
      syncStatus.lastSync.endTime = new Date();
    }

    return {
      success: false,
      codigoEstacao,
      periodo: { inicio: dataInicio, fim: dataFim },
      totalRequisicoes: 0,
      totalRegistros: syncStatus.lastSync?.recordsProcessed || 0,
      erros: syncStatus.lastSync?.errors || 0,
      duracaoMs: Date.now() - startTime,
      detalhes,
    };

  } finally {
    // Resetar status
    syncStatus.isRunning = false;
    syncStatus.currentOperation = undefined;
    syncStatus.progress = undefined;
  }
}

/**
 * Sincroniza automaticamente os últimos 7 dias
 */
export async function sincronizarUltimosDias(codigoEstacao: string, dias: number = 7): Promise<SyncResult> {
  const hoje = new Date();
  const dataFim = hoje.toISOString().split('T')[0];
  
  const dataInicioDate = new Date(hoje);
  dataInicioDate.setDate(dataInicioDate.getDate() - dias);
  const dataInicio = dataInicioDate.toISOString().split('T')[0];

  return executarSincronizacao({
    codigoEstacao,
    dataInicio,
    dataFim,
    intervaloDias: Math.min(dias, 30), // Usar intervalo menor para períodos curtos
  });
}
