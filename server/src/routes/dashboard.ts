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
    
    if (codigoEstacao !== '75650010') {
      return res.status(403).json({ error: 'Estação não permitida' });
    }

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
      
      // Estatísticas gerais
      prisma.$queryRaw`
        SELECT 
          COUNT(*) as total_medicoes,
          MIN(CAST("Chuva_Acumulada" AS DECIMAL)) as chuva_min,
          MAX(CAST("Chuva_Acumulada" AS DECIMAL)) as chuva_max,
          AVG(CAST("Chuva_Acumulada" AS DECIMAL)) as chuva_media,
          MIN(CAST("Temperatura_Agua" AS DECIMAL)) as temp_min,
          MAX(CAST("Temperatura_Agua" AS DECIMAL)) as temp_max,
          AVG(CAST("Temperatura_Agua" AS DECIMAL)) as temp_media,
          MIN(CAST("Bateria" AS DECIMAL)) as bateria_min,
          MAX(CAST("Bateria" AS DECIMAL)) as bateria_max,
          AVG(CAST("Bateria" AS DECIMAL)) as bateria_media
        FROM "SerieTelemetrica"
        WHERE codigoestacao = ${codigoEstacao}
          AND "Chuva_Acumulada" IS NOT NULL
          AND "Temperatura_Agua" IS NOT NULL
          AND "Bateria" IS NOT NULL
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

// Endpoint: Série temporal de chuva
router.get('/serie-chuva/:codigoEstacao', async (req: Request, res: Response) => {
  try {
    const { codigoEstacao } = req.params;
    const { dataInicio, dataFim } = req.query;
    
    if (codigoEstacao !== '75650010') {
      return res.status(403).json({ error: 'Estação não permitida' });
    }

    const whereClause: any = { codigoestacao: codigoEstacao };
    
    if (dataInicio) {
      whereClause.Data_Hora_Medicao = { gte: new Date(dataInicio as string) };
    }
    if (dataFim) {
      whereClause.Data_Hora_Medicao = { 
        ...whereClause.Data_Hora_Medicao,
        lte: new Date(dataFim as string) 
      };
    }

    const dados = await prisma.serieTelemetrica.findMany({
      where: whereClause,
      select: {
        Data_Hora_Medicao: true,
        Chuva_Acumulada: true,
        Chuva_Adotada: true,
        Chuva_Acumulada_Status: true
      },
      orderBy: { Data_Hora_Medicao: 'asc' }
    });

    res.json(convertBigInt({
      codigoEstacao,
      total: dados.length,
      dados: dados.map(d => ({
        data: d.Data_Hora_Medicao,
        acumulada: d.Chuva_Acumulada,
        adotada: d.Chuva_Adotada,
        status: d.Chuva_Acumulada_Status
      }))
    }));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Série temporal de temperatura
router.get('/serie-temperatura/:codigoEstacao', async (req: Request, res: Response) => {
  try {
    const { codigoEstacao } = req.params;
    const { dataInicio, dataFim } = req.query;
    
    if (codigoEstacao !== '75650010') {
      return res.status(403).json({ error: 'Estação não permitida' });
    }

    const whereClause: any = { codigoestacao: codigoEstacao };
    
    if (dataInicio) {
      whereClause.Data_Hora_Medicao = { gte: new Date(dataInicio as string) };
    }
    if (dataFim) {
      whereClause.Data_Hora_Medicao = { 
        ...whereClause.Data_Hora_Medicao,
        lte: new Date(dataFim as string) 
      };
    }

    const dados = await prisma.serieTelemetrica.findMany({
      where: whereClause,
      select: {
        Data_Hora_Medicao: true,
        Temperatura_Agua: true,
        Temperatura_Interna: true
      },
      orderBy: { Data_Hora_Medicao: 'asc' }
    });

    res.json(convertBigInt({
      codigoEstacao,
      total: dados.length,
      dados: dados.map(d => ({
        data: d.Data_Hora_Medicao,
        agua: d.Temperatura_Agua,
        interna: d.Temperatura_Interna
      }))
    }));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint: Dados agregados por dia
router.get('/agregado-diario/:codigoEstacao', async (req: Request, res: Response) => {
  try {
    const { codigoEstacao } = req.params;
    const { mes } = req.query; // formato: 2025-01
    
    if (codigoEstacao !== '75650010') {
      return res.status(403).json({ error: 'Estação não permitida' });
    }

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
          MAX(CAST("Chuva_Acumulada" AS DECIMAL)) as chuva_maxima,
          AVG(CAST("Temperatura_Agua" AS DECIMAL)) as temp_media,
          MIN(CAST("Temperatura_Agua" AS DECIMAL)) as temp_minima,
          MAX(CAST("Temperatura_Agua" AS DECIMAL)) as temp_maxima,
          AVG(CAST("Bateria" AS DECIMAL)) as bateria_media
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
          MAX(CAST("Chuva_Acumulada" AS DECIMAL)) as chuva_maxima,
          AVG(CAST("Temperatura_Agua" AS DECIMAL)) as temp_media,
          MIN(CAST("Temperatura_Agua" AS DECIMAL)) as temp_minima,
          MAX(CAST("Temperatura_Agua" AS DECIMAL)) as temp_maxima,
          AVG(CAST("Bateria" AS DECIMAL)) as bateria_media
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
    
    if (codigoEstacao !== '75650010') {
      return res.status(403).json({ error: 'Estação não permitida' });
    }

    const dados = await prisma.$queryRaw`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', "Data_Hora_Medicao"), 'YYYY-MM') as mes,
        COUNT(*) as total_medicoes,
        MAX(CAST("Chuva_Acumulada" AS DECIMAL)) as chuva_maxima,
        AVG(CAST("Temperatura_Agua" AS DECIMAL)) as temp_media,
        AVG(CAST("Bateria" AS DECIMAL)) as bateria_media
      FROM "SerieTelemetrica"
      WHERE codigoestacao = ${codigoEstacao}
        AND "Chuva_Acumulada" IS NOT NULL
        AND "Temperatura_Agua" IS NOT NULL
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
    
    if (codigoEstacao !== '75650010') {
      return res.status(403).json({ error: 'Estação não permitida' });
    }

    const [tempAlta, tempBaixa, bateriaBaixa] = await Promise.all([
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
      `,
      
      // Bateria baixa (< 12V)
      prisma.$queryRaw`
        SELECT 
          "Data_Hora_Medicao",
          "Bateria"
        FROM "SerieTelemetrica"
        WHERE codigoestacao = ${codigoEstacao}
          AND CAST("Bateria" AS DECIMAL) < 12.0
        ORDER BY "Data_Hora_Medicao" DESC
        LIMIT 10
      `
    ]);

    res.json(convertBigInt({
      codigoEstacao,
      alertas: {
        temperaturaAlta: tempAlta,
        temperaturaBaixa: tempBaixa,
        bateriaBaixa: bateriaBaixa
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
    
    if (codigoEstacao !== '75650010') {
      return res.status(403).json({ error: 'Estação não permitida' });
    }

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

export default router;
