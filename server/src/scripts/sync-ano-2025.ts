/**
 * Script para sincronizar dados da estação 75650010 do ano inteiro de 2025
 * 
 * Este script faz requisições incrementais de 30 dias para coletar
 * todos os dados telemetricos do ano de 2025.
 * 
 * Uso: npx tsx src/scripts/sync-ano-2025.ts
 */

import { prisma } from '../db/prisma';
import { AnaClient } from '../services/anaClient';

const ANA_BASE_URL = process.env.ANA_BASE_URL || 'https://api.ana.gov.br/hidrowebservice';
const ANA_IDENTIFICADOR = process.env.ANA_IDENTIFICADOR || '';
const ANA_SENHA = process.env.ANA_SENHA || '';

const anaClient = new AnaClient({ baseURL: ANA_BASE_URL });

// Estação específica para a bacia
const CODIGO_ESTACAO = '75650010';

// Ano que queremos buscar
const ANO = 2025;

/**
 * Gera lista de datas com intervalos de 30 dias
 */
function gerarIntervalos30Dias(ano: number): string[] {
  const datas: string[] = [];
  
  // Começar de 30 em 30 dias a partir de 01/01/2025
  const dataInicial = new Date(ano, 0, 1); // 01/01/2025
  const dataFinal = new Date(ano, 11, 31); // 31/12/2025
  
  let dataAtual = dataInicial;
  
  while (dataAtual <= dataFinal) {
    // Formatar como yyyy-MM-dd
    const ano = dataAtual.getFullYear();
    const mes = String(dataAtual.getMonth() + 1).padStart(2, '0');
    const dia = String(dataAtual.getDate()).padStart(2, '0');
    datas.push(`${ano}-${mes}-${dia}`);
    
    // Avançar 30 dias
    dataAtual = new Date(dataAtual.getTime() + 30 * 24 * 60 * 60 * 1000);
  }
  
  return datas;
}

/**
 * Processa e salva os dados de uma requisição
 */
async function processarDados(dados: any[]): Promise<number> {
  let salvos = 0;
  
  for (const item of dados) {
    try {
      await prisma.serieTelemetrica.upsert({
        where: {
          codigoestacao_Data_Hora_Medicao: {
            codigoestacao: item.codigoestacao || CODIGO_ESTACAO,
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
          codigoestacao: item.codigoestacao || CODIGO_ESTACAO,
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
    }
  }
  
  return salvos;
}

/**
 * Função principal
 */
async function main() {
  console.log(`🚀 Iniciando sincronização de dados da estação ${CODIGO_ESTACAO} para o ano ${ANO}`);
  console.log('═══════════════════════════════════════════════════════════════════════\n');
  
  // Verificar credenciais
  if (!ANA_IDENTIFICADOR || !ANA_SENHA) {
    console.error('❌ Erro: Configure ANA_IDENTIFICADOR e ANA_SENHA no arquivo .env');
    process.exit(1);
  }
  
  // Obter token de autenticação
  console.log('🔑 Fazendo login na API da ANA...');
  const { token } = await anaClient.login(ANA_IDENTIFICADOR, ANA_SENHA);
  console.log('✅ Token obtido com sucesso\n');
  
  // Gerar intervalos de datas
  const datas = gerarIntervalos30Dias(ANO);
  console.log(`📅 Total de requisições necessárias: ${datas.length}`);
  console.log(`   (cobrindo de ${datas[0]} até ${datas[datas.length - 1]})\n`);
  
  let totalRegistros = 0;
  let requisicaoAtual = 0;
  
  // Processar cada intervalo
  for (const dataBusca of datas) {
    requisicaoAtual++;
    
    try {
      console.log(`[${requisicaoAtual}/${datas.length}] 📡 Buscando dados de ${dataBusca} (últimos 30 dias)...`);
      
      // Buscar dados telemetricos detalhados (endpoint unificado v2)
      const dados = await anaClient.getSerieTelemetricaDetalhada(token, {
        codigoEstacao: CODIGO_ESTACAO,
        tipoFiltroData: 'DATA_LEITURA',
        dataBusca: dataBusca,
        rangeIntervalo: 'DIAS_30',
      });
      
      if (!dados || dados.length === 0) {
        console.log(`   ⚠️  Nenhum dado retornado para esta data`);
        continue;
      }
      
      console.log(`   ✅ ${dados.length} registros recebidos`);
      console.log(`   💾 Salvando no banco de dados...`);
      
      const salvos = await processarDados(dados);
      totalRegistros += salvos;
      
      console.log(`   ✅ ${salvos} registros salvos/atualizados\n`);
      
      // Pequena pausa entre requisições para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error: any) {
      console.error(`   ❌ Erro ao processar ${dataBusca}:`, error.message);
      console.log(`   ⏭️  Continuando com próxima data...\n`);
    }
  }
  
  console.log('═══════════════════════════════════════════════════════════════════════');
  console.log(`✅ Sincronização concluída!`);
  console.log(`📊 Total de registros processados: ${totalRegistros}`);
  console.log(`📅 Período: Todo o ano de ${ANO}`);
  console.log(`🏷️  Estação: ${CODIGO_ESTACAO}`);
  console.log('═══════════════════════════════════════════════════════════════════════\n');
}

// Executar script
main()
  .catch((error) => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
