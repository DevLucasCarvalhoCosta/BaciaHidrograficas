import { Router, Request, Response } from 'express';
import { prisma } from '../db/prisma';

const router = Router();

// Helper para converter BigInt em Number
function convertBigInt(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return Number(obj);
  if (obj instanceof Date) return obj.toISOString(); // Converter Date para ISO string
  if (Array.isArray(obj)) return obj.map(convertBigInt);
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      converted[key] = convertBigInt(obj[key]);
    }
    return converted;
  }
  return obj;
}

// Endpoint: Estatísticas gerais da estação
router.get('/stats/:codigoEstacao', async (req: Request, res: Response) => {
  try {
    const { codigoEstacao } = req.params;

    const [total, periodo, stats] = await Promise.all([
      // Total de registros
      prisma.serieTelemetrica.count({ where: { codigoestacao: codigoEstacao } }),
      
      // Período disponível
      prisma.$queryRaw`
        SELECT 
          MIN("Data_Hora_Medicao") as inicio,
          MAX("Data_Hora_Medicao") as fim
        FROM "SerieTelemetrica"
        WHERE codigoestacao = ${codigoEstacao}
      `,
      
      // Estatísticas gerais - Agregado por dia primeiro, depois estatísticas sobre os dias
      prisma.$queryRaw`
        WITH dados_diarios AS (
          SELECT 
            DATE("Data_Hora_Medicao") as dia,
            SUM(CAST(NULLIF("Chuva_Adotada", '') AS DECIMAL)) as chuva_diaria,
            AVG(CAST(NULLIF("Temperatura_Agua", '') AS DECIMAL)) as temp_diaria,
            AVG(CAST(COALESCE(NULLIF("Cota_Adotada", ''), NULLIF("Cota_Sensor", '')) AS DECIMAL)) as cota_diaria,
            AVG(CAST(NULLIF("Vazao_Adotada", '') AS DECIMAL)) as vazao_diaria
          FROM "SerieTelemetrica"
          WHERE codigoestacao = ${codigoEstacao}
          GROUP BY DATE("Data_Hora_Medicao")
        )
        SELECT 
          COUNT(*) as total_medicoes,
          MIN(chuva_diaria) as chuva_min,
          MAX(chuva_diaria) as chuva_max,
          AVG(chuva_diaria) as chuva_media,
          MIN(temp_diaria) as temp_min,
          MAX(temp_diaria) as temp_max,
          AVG(temp_diaria) as temp_media,
          MIN(cota_diaria) as cota_min,
          MAX(cota_diaria) as cota_max,
          AVG(cota_diaria) as cota_media,
          MIN(vazao_diaria) as vazao_min,
          MAX(vazao_diaria) as vazao_max,
          AVG(vazao_diaria) as vazao_media
        FROM dados_diarios
      `
    ]);

    res.json(convertBigInt({
      codigoEstacao,
      totalRegistros: total,
      periodo: (periodo as any)[0],
      estatisticas: (stats as any)[0]
    }));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/serie-chuva/:codigoEstacao', async (req: Request, res: Response) => {
  try {
    const { codigoEstacao } = req.params;
    const { dataInicio, dataFim } = req.query;

    console.log('🔍 [API serie-chuva] Request recebido:', {
      codigoEstacao,
      dataInicio,
      dataFim
    });

    console.log('   📊 Retornando dados AGREGADOS por dia');
    
    let sqlQuery = `
      SELECT 
        DATE("Data_Hora_Medicao") as data,
        SUM(CAST(NULLIF("Chuva_Adotada", '') AS DECIMAL)) as chuva_diaria,
        COUNT(*) as medicoes_dia
      FROM "SerieTelemetrica"
      WHERE codigoestacao = '${codigoEstacao}'
        AND NULLIF("Chuva_Adotada", '') IS NOT NULL
    `;
    
    if (dataInicio && dataInicio !== '' && typeof dataInicio === 'string') {
      sqlQuery += ` AND "Data_Hora_Medicao" >= '${dataInicio}'`;
      console.log('   ✓ Filtro data início:', dataInicio);
    }
    if (dataFim && dataFim !== '' && typeof dataFim === 'string') {
      sqlQuery += ` AND "Data_Hora_Medicao" <= '${dataFim}'`;
      console.log('   ✓ Filtro data fim:', dataFim);
    }
    
    sqlQuery += `
      GROUP BY DATE("Data_Hora_Medicao")
      ORDER BY data ASC
    `;
    
    const dados = await prisma.$queryRawUnsafe(sqlQuery) as any[];

    console.log('   ✅ Dados agregados:', dados.length, 'dias');
    if (dados.length > 0) {
      console.log('   📊 Primeiro dia:', dados[0]);
      console.log('   📊 Último dia:', dados[dados.length - 1]);
    }

    res.json(convertBigInt({
      codigoEstacao,
      total: dados.length,
      dados: dados.map(d => ({
        data: d.data,
        chuva_diaria: d.chuva_diaria,
        medicoes_dia: d.medicoes_dia
      }))
    }));
  } catch (error: any) {
    console.error('❌ [API serie-chuva] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Série temporal de temperatura (sempre agregado por dia)
router.get('/serie-temperatura/:codigoEstacao', async (req: Request, res: Response) => {
  try {
    const { codigoEstacao } = req.params;
    const { dataInicio, dataFim } = req.query;

    console.log('🔍 [API serie-temperatura] Request recebido:', {
      codigoEstacao,
      dataInicio,
      dataFim
    });

    console.log('   📊 Retornando dados AGREGADOS por dia');
    
    let sqlQuery = `
      SELECT 
        DATE("Data_Hora_Medicao") as data,
        AVG(CAST("Temperatura_Agua" AS DECIMAL)) as agua,
        AVG(CAST("Temperatura_Interna" AS DECIMAL)) as interna,
        MIN(CAST("Temperatura_Agua" AS DECIMAL)) as agua_min,
        MAX(CAST("Temperatura_Agua" AS DECIMAL)) as agua_max,
        COUNT(*) as medicoes_dia
      FROM "SerieTelemetrica"
      WHERE codigoestacao = '${codigoEstacao}'
    `;
    
    if (dataInicio && dataInicio !== '' && typeof dataInicio === 'string') {
      sqlQuery += ` AND "Data_Hora_Medicao" >= '${dataInicio}'`;
      console.log('   ✓ Filtro data início:', dataInicio);
    }
    if (dataFim && dataFim !== '' && typeof dataFim === 'string') {
      sqlQuery += ` AND "Data_Hora_Medicao" <= '${dataFim}'`;
      console.log('   ✓ Filtro data fim:', dataFim);
    }
    
    sqlQuery += `
      GROUP BY DATE("Data_Hora_Medicao")
      ORDER BY data ASC
    `;
    
    const dados = await prisma.$queryRawUnsafe(sqlQuery) as any[];

    console.log('   ✅ Dados agregados:', dados.length, 'dias');
    if (dados.length > 0) {
      console.log('   📊 Primeiro dia:', dados[0]);
      console.log('   📊 Último dia:', dados[dados.length - 1]);
    }

    res.json(convertBigInt({
      codigoEstacao,
      total: dados.length,
      dados: dados.map(d => ({
        data: d.data,
        agua: d.agua,
        interna: d.interna,
        agua_min: d.agua_min,
        agua_max: d.agua_max,
        medicoes_dia: d.medicoes_dia
      }))
    }));
  } catch (error: any) {
    console.error('❌ [API serie-temperatura] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Dados agregados por dia
router.get('/agregado-diario/:codigoEstacao', async (req: Request, res: Response) => {
  try {
    const { codigoEstacao } = req.params;
    const { mes } = req.query; // formato: 2025-01

    let dados;
    
    if (mes) {
      // Com filtro de mês
      const mesStr = mes as string;
      const [year, month] = mesStr.split('-');
      const monthStr = month.padStart(2, '0');
      
      dados = await prisma.$queryRaw`
        SELECT 
          DATE("Data_Hora_Medicao") as dia,
          COUNT(*) as total_medicoes,
          SUM(CAST(NULLIF("Chuva_Adotada", '') AS DECIMAL)) as chuva_diaria,
          AVG(CAST(NULLIF("Temperatura_Agua", '') AS DECIMAL)) as temp_media,
          MIN(CAST(NULLIF("Temperatura_Agua", '') AS DECIMAL)) as temp_minima,
          MAX(CAST(NULLIF("Temperatura_Agua", '') AS DECIMAL)) as temp_maxima,
          AVG(CAST(COALESCE(NULLIF("Cota_Adotada", ''), NULLIF("Cota_Sensor", '')) AS DECIMAL)) as cota_media,
          MIN(CAST(COALESCE(NULLIF("Cota_Adotada", ''), NULLIF("Cota_Sensor", '')) AS DECIMAL)) as cota_minima,
          MAX(CAST(COALESCE(NULLIF("Cota_Adotada", ''), NULLIF("Cota_Sensor", '')) AS DECIMAL)) as cota_maxima,
          AVG(CAST(NULLIF("Vazao_Adotada", '') AS DECIMAL)) as vazao_media,
          MIN(CAST(NULLIF("Vazao_Adotada", '') AS DECIMAL)) as vazao_minima,
          MAX(CAST(NULLIF("Vazao_Adotada", '') AS DECIMAL)) as vazao_maxima
        FROM "SerieTelemetrica"
        WHERE codigoestacao = ${codigoEstacao}
          AND TO_CHAR("Data_Hora_Medicao", 'YYYY-MM') = ${`${year}-${monthStr}`}
        GROUP BY DATE("Data_Hora_Medicao")
        ORDER BY dia DESC
      ` as any[];
    } else {
      // Sem filtro de mês
      dados = await prisma.$queryRaw`
        SELECT 
          DATE("Data_Hora_Medicao") as dia,
          COUNT(*) as total_medicoes,
          SUM(CAST(NULLIF("Chuva_Adotada", '') AS DECIMAL)) as chuva_diaria,
          AVG(CAST(NULLIF("Temperatura_Agua", '') AS DECIMAL)) as temp_media,
          MIN(CAST(NULLIF("Temperatura_Agua", '') AS DECIMAL)) as temp_minima,
          MAX(CAST(NULLIF("Temperatura_Agua", '') AS DECIMAL)) as temp_maxima,
          AVG(CAST(COALESCE(NULLIF("Cota_Adotada", ''), NULLIF("Cota_Sensor", '')) AS DECIMAL)) as cota_media,
          MIN(CAST(COALESCE(NULLIF("Cota_Adotada", ''), NULLIF("Cota_Sensor", '')) AS DECIMAL)) as cota_minima,
          MAX(CAST(COALESCE(NULLIF("Cota_Adotada", ''), NULLIF("Cota_Sensor", '')) AS DECIMAL)) as cota_maxima,
          AVG(CAST(NULLIF("Vazao_Adotada", '') AS DECIMAL)) as vazao_media,
          MIN(CAST(NULLIF("Vazao_Adotada", '') AS DECIMAL)) as vazao_minima,
          MAX(CAST(NULLIF("Vazao_Adotada", '') AS DECIMAL)) as vazao_maxima
        FROM "SerieTelemetrica"
        WHERE codigoestacao = ${codigoEstacao}
        GROUP BY DATE("Data_Hora_Medicao")
        ORDER BY dia DESC
      `;
    }

    res.json(convertBigInt({
      codigoEstacao,
      periodo: mes || 'todos',
      dados
    }));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Comparação mensal
router.get('/comparacao-mensal/:codigoEstacao', async (req: Request, res: Response) => {
  try {
    const { codigoEstacao } = req.params;

    const dados = await prisma.$queryRaw`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "Data_Hora_Medicao"), 'YYYY-MM') as mes,
        COUNT(*) as total_medicoes,
        SUM(CAST(NULLIF("Chuva_Adotada", '') AS DECIMAL)) as chuva_mensal,
        AVG(CAST(NULLIF("Temperatura_Agua", '') AS DECIMAL)) as temp_media,
        AVG(CAST(COALESCE(NULLIF("Cota_Adotada", ''), NULLIF("Cota_Sensor", '')) AS DECIMAL)) as cota_media,
        AVG(CAST(NULLIF("Vazao_Adotada", '') AS DECIMAL)) as vazao_media
      FROM "SerieTelemetrica"
      WHERE codigoestacao = ${codigoEstacao}
      GROUP BY DATE_TRUNC('month', "Data_Hora_Medicao")
      ORDER BY mes ASC
    `;

    res.json(convertBigInt({
      codigoEstacao,
      dados
    }));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Alertas (valores extremos)
router.get('/alertas/:codigoEstacao', async (req: Request, res: Response) => {
  try {
    const { codigoEstacao } = req.params;

    const [tempAlta, tempBaixa] = await Promise.all([
      // Temperatura alta (> 30°C)
      prisma.$queryRaw`
        SELECT 
          "Data_Hora_Medicao",
          "Temperatura_Agua"
        FROM "SerieTelemetrica"
        WHERE codigoestacao = ${codigoEstacao}
          AND CAST("Temperatura_Agua" AS DECIMAL) > 30
        ORDER BY "Data_Hora_Medicao" DESC
        LIMIT 10
      `,
      
      // Temperatura baixa (< 15°C)
      prisma.$queryRaw`
        SELECT 
          "Data_Hora_Medicao",
          "Temperatura_Agua"
        FROM "SerieTelemetrica"
        WHERE codigoestacao = ${codigoEstacao}
          AND CAST("Temperatura_Agua" AS DECIMAL) < 15
        ORDER BY "Data_Hora_Medicao" DESC
        LIMIT 10
      `
    ]);

    res.json(convertBigInt({
      codigoEstacao,
      alertas: {
        temperaturaAlta: tempAlta,
        temperaturaBaixa: tempBaixa
      }
    }));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Dados brutos do mês
router.get('/dados-brutos/:codigoEstacao', async (req: Request, res: Response) => {
  try {
    const { codigoEstacao } = req.params;
    const { mes } = req.query; // Formato: YYYY-MM

    if (!mes || typeof mes !== 'string') {
      return res.status(400).json({ error: 'Parâmetro "mes" é obrigatório (formato: YYYY-MM)' });
    }

    // Calcular início e fim do mês usando SQL diretamente (evita problemas de timezone)
    const [year, month] = mes.split('-');
    const monthStr = month.padStart(2, '0');
    
    // Buscar todos os registros brutos do mês usando query SQL raw para garantir precisão
    const dados = await prisma.$queryRaw`
      SELECT 
        "Data_Hora_Medicao",
        "Data_Atualizacao",
        "Chuva_Acumulada",
        "Chuva_Acumulada_Status",
        "Chuva_Adotada",
        "Chuva_Adotada_Status",
        "Cota_Sensor",
        "Cota_Sensor_Status",
        "Cota_Adotada",
        "Cota_Adotada_Status",
        "Cota_Display",
        "Cota_Display_Status",
        "Cota_Manual",
        "Cota_Manual_Status",
        "Vazao_Adotada",
        "Vazao_Adotada_Status",
        "Temperatura_Agua",
        "Temperatura_Agua_Status",
        "Temperatura_Interna",
        "Pressao_Atmosferica",
        "Pressao_Atmosferica_Status",
        "Bateria"
      FROM "SerieTelemetrica"
      WHERE codigoestacao = ${codigoEstacao}
        AND TO_CHAR("Data_Hora_Medicao", 'YYYY-MM') = ${`${year}-${monthStr}`}
      ORDER BY "Data_Hora_Medicao" DESC
    ` as any[];

    res.json(convertBigInt({
      codigoEstacao,
      mes,
      totalRegistros: dados.length,
      dados
    }));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Série temporal de cota/nível do rio (sempre agregado por dia)
router.get('/serie-cota/:codigoEstacao', async (req: Request, res: Response) => {
  try {
    const { codigoEstacao } = req.params;
    const { dataInicio, dataFim } = req.query;

    console.log('🔍 [API serie-cota] Request recebido:', {
      codigoEstacao,
      dataInicio,
      dataFim
    });

    console.log('   📊 Retornando dados AGREGADOS por dia');
    
    let sqlQuery = `
      SELECT 
        DATE("Data_Hora_Medicao") as data,
        AVG(CAST(COALESCE(NULLIF("Cota_Adotada", ''), NULLIF("Cota_Sensor", '')) AS DECIMAL)) as cota_media,
        MIN(CAST(COALESCE(NULLIF("Cota_Adotada", ''), NULLIF("Cota_Sensor", '')) AS DECIMAL)) as cota_min,
        MAX(CAST(COALESCE(NULLIF("Cota_Adotada", ''), NULLIF("Cota_Sensor", '')) AS DECIMAL)) as cota_max,
        COUNT(*) as medicoes_dia
      FROM "SerieTelemetrica"
      WHERE codigoestacao = '${codigoEstacao}'
        AND (COALESCE(NULLIF("Cota_Adotada", ''), NULLIF("Cota_Sensor", '')) IS NOT NULL)
    `;
    
    if (dataInicio && dataInicio !== '' && typeof dataInicio === 'string') {
      sqlQuery += ` AND "Data_Hora_Medicao" >= '${dataInicio}'`;
      console.log('   ✓ Filtro data início:', dataInicio);
    }
    if (dataFim && dataFim !== '' && typeof dataFim === 'string') {
      sqlQuery += ` AND "Data_Hora_Medicao" <= '${dataFim}'`;
      console.log('   ✓ Filtro data fim:', dataFim);
    }
    
    sqlQuery += `
      GROUP BY DATE("Data_Hora_Medicao")
      ORDER BY data ASC
    `;
    
    const dados = await prisma.$queryRawUnsafe(sqlQuery) as any[];

    console.log('   ✅ Dados agregados:', dados.length, 'dias');
    if (dados.length > 0) {
      console.log('   📊 Primeiro dia:', dados[0]);
      console.log('   📊 Último dia:', dados[dados.length - 1]);
    }

    res.json(convertBigInt({
      codigoEstacao,
      total: dados.length,
      dados: dados.map(d => ({
        data: d.data,
        cota_media: d.cota_media,
        cota_min: d.cota_min,
        cota_max: d.cota_max,
        medicoes_dia: d.medicoes_dia
      }))
    }));
  } catch (error: any) {
    console.error('❌ [API serie-cota] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Série temporal de vazão (sempre agregado por dia)
router.get('/serie-vazao/:codigoEstacao', async (req: Request, res: Response) => {
  try {
    const { codigoEstacao } = req.params;
    const { dataInicio, dataFim } = req.query;

    console.log('🔍 [API serie-vazao] Request recebido:', {
      codigoEstacao,
      dataInicio,
      dataFim
    });

    console.log('   📊 Retornando dados AGREGADOS por dia');
    
    let sqlQuery = `
      SELECT 
        DATE("Data_Hora_Medicao") as data,
        AVG(CAST(NULLIF("Vazao_Adotada", '') AS DECIMAL)) as vazao_media,
        MIN(CAST(NULLIF("Vazao_Adotada", '') AS DECIMAL)) as vazao_min,
        MAX(CAST(NULLIF("Vazao_Adotada", '') AS DECIMAL)) as vazao_max,
        COUNT(*) as medicoes_dia
      FROM "SerieTelemetrica"
      WHERE codigoestacao = '${codigoEstacao}'
        AND NULLIF("Vazao_Adotada", '') IS NOT NULL
    `;
    
    if (dataInicio && dataInicio !== '' && typeof dataInicio === 'string') {
      sqlQuery += ` AND "Data_Hora_Medicao" >= '${dataInicio}'`;
      console.log('   ✓ Filtro data início:', dataInicio);
    }
    if (dataFim && dataFim !== '' && typeof dataFim === 'string') {
      sqlQuery += ` AND "Data_Hora_Medicao" <= '${dataFim}'`;
      console.log('   ✓ Filtro data fim:', dataFim);
    }
    
    sqlQuery += `
      GROUP BY DATE("Data_Hora_Medicao")
      ORDER BY data ASC
    `;
    
    const dados = await prisma.$queryRawUnsafe(sqlQuery) as any[];

    console.log('   ✅ Dados agregados:', dados.length, 'dias');
    if (dados.length > 0) {
      console.log('   📊 Primeiro dia:', dados[0]);
      console.log('   📊 Último dia:', dados[dados.length - 1]);
    }

    res.json(convertBigInt({
      codigoEstacao,
      total: dados.length,
      dados: dados.map(d => ({
        data: d.data,
        vazao_media: d.vazao_media,
        vazao_min: d.vazao_min,
        vazao_max: d.vazao_max,
        medicoes_dia: d.medicoes_dia
      }))
    }));
  } catch (error: any) {
    console.error('❌ [API serie-vazao] Erro:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
