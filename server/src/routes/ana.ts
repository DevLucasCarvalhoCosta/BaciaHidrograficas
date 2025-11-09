import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AnaClient } from '../services/anaClient';
import { prisma } from '../db/prisma';
import { 
  executarSincronizacao, 
  sincronizarUltimosDias, 
  getSyncStatus,
  type SyncOptions 
} from '../services/syncService';

export const router = Router();

const LoginSchema = z.object({
  identificador: z.string().min(1),
  senha: z.string().min(1),
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const envBaseUrl = process.env.ANA_BASE_URL ?? '';
    if (!envBaseUrl) {
      return res.status(500).json({
        error: 'Configuração ausente: defina ANA_BASE_URL no arquivo .env',
      });
    }
    const client = new AnaClient({ baseURL: envBaseUrl });
    const parsed = LoginSchema.partial().parse(req.body ?? {});
    const identificador = parsed.identificador ?? process.env.ANA_IDENTIFICADOR ?? '';
    const senha = parsed.senha ?? process.env.ANA_SENHA ?? '';

    if (!identificador || !senha) {
      return res.status(400).json({
        error: 'Credenciais ausentes. Forneça no body { identificador, senha } ou configure ANA_IDENTIFICADOR e ANA_SENHA no .env.',
      });
    }

    const result = await client.login(identificador, senha);

    return res.json({
      token: result.token,
    });
  } catch (err: any) {
    const status = err?.response?.status ?? 500;
    const message = err?.message ?? 'Erro inesperado ao autenticar na ANA';
    return res.status(status >= 400 && status < 600 ? status : 500).json({ error: message });
  }
});


const SyncSchema = z.object({
  token: z.string().optional(),
  identificador: z.string().optional(),
  senha: z.string().optional(),
});

router.post('/estacoes/hidrosat/sync', async (req: Request, res: Response) => {
  try {
    const envBaseUrl = process.env.ANA_BASE_URL ?? '';
    if (!envBaseUrl) {
      return res.status(500).json({ error: 'Configuração ausente: defina ANA_BASE_URL no arquivo .env' });
    }
    const client = new AnaClient({ baseURL: envBaseUrl });

    const parsed = SyncSchema.parse(req.body ?? {});
    let token = parsed.token;
    if (!token) {
      const identificador = parsed.identificador ?? process.env.ANA_IDENTIFICADOR ?? '';
      const senha = parsed.senha ?? process.env.ANA_SENHA ?? '';
      if (!identificador || !senha) {
        return res.status(400).json({ error: 'Informe token no body ou credenciais (identificador, senha) no body/.env.' });
      }
      const login = await client.login(identificador, senha);
      token = login.token;
    }

    const items = await client.getHidrosatInventarioEstacoes(token);

    let upserted = 0;
    for (const it of items as any[]) {
      const codigoestacao = String(
        it.codigoestacao ?? it.codigoEstacao ?? it.codigo ?? it.id ?? ''
      ).trim();
      if (!codigoestacao) continue;

      const Estacao_Nome = it['Estacao_Nome'] != null
        ? String(it['Estacao_Nome']).trim()
        : undefined;

      const Estacao_Status = it['Estacao_Status'] != null
        ? String(it['Estacao_Status']).trim()
        : undefined;

      const latRaw = it['Latitude'] ?? it.latitude;
      const lonRaw = it['Longitude'] ?? it.longitude;
      const Latitude = latRaw != null ? parseFloat(String(latRaw)) : undefined;
      const Longitude = lonRaw != null ? parseFloat(String(lonRaw)) : undefined;

      const ufRaw = it['UF'] ?? it.uf;
      const UF = ufRaw && String(ufRaw).trim() !== '--'
        ? String(ufRaw).slice(0, 2).toUpperCase()
        : undefined;

      const Corpo_Hidrico = it['Corpo_Hidrico'] != null
        ? String(it['Corpo_Hidrico'])
        : undefined;

      await prisma.station.upsert({
        where: { codigoestacao },
        update: { Estacao_Nome, Estacao_Status, Latitude, Longitude, UF, Corpo_Hidrico },
        create: { codigoestacao, Estacao_Nome, Estacao_Status, Latitude, Longitude, UF, Corpo_Hidrico },
      });
      upserted++;
    }

    return res.json({ total: (items as any[]).length, upserted });
  } catch (err: any) {
    const status = err?.response?.status ?? 500;
    const message = err?.message ?? 'Erro ao sincronizar inventário Hidrosat';
    return res.status(status >= 400 && status < 600 ? status : 500).json({ error: message });
  }
});

const HidroSyncSchema = z.object({
  token: z.string().optional(),
  identificador: z.string().optional(),
  senha: z.string().optional(),
  // Preferimos "unidadefederativa" mas mantemos compatibilidade com UF
  unidadefederativa: z.string().optional(),
  UF: z.string().optional(),
  codigoestacao: z.string().optional(),
  codigobacia: z.string().optional(),
});

router.post('/estacoes/hidro/sync', async (req: Request, res: Response) => {
  try {
    const envBaseUrl = process.env.ANA_BASE_URL ?? '';
    if (!envBaseUrl) return res.status(500).json({ error: 'Configuração ausente: defina ANA_BASE_URL no arquivo .env' });
    const client = new AnaClient({ baseURL: envBaseUrl });

  const parsed = HidroSyncSchema.parse(req.body ?? {});
    let token = parsed.token;
    if (!token) {
      const identificador = parsed.identificador ?? process.env.ANA_IDENTIFICADOR ?? '';
      const senha = parsed.senha ?? process.env.ANA_SENHA ?? '';
      if (!identificador || !senha) return res.status(400).json({ error: 'Informe token no body ou credenciais (identificador, senha) no body/.env.' });
      const login = await client.login(identificador, senha);
      token = login.token;
    }

  // Suportar tanto body.unidadefederativa quanto body.UF
  const unidadeFederativa = ((parsed.unidadefederativa ?? parsed.UF) ?? 'GO').toString().trim().toUpperCase();
  const params = { UF: unidadeFederativa, codigoestacao: parsed.codigoestacao, codigobacia: parsed.codigobacia };
    console.log('[HIDRO sync] Params =>', params);
    const items = await client.getHidroInventarioEstacoes(token!, params);
    console.log('[HIDRO sync] ANA returned items:', Array.isArray(items) ? (items as any[]).length : 0);

    let upserted = 0;
    for (const it of items as any[]) {
      const codigoestacao = String(it.codigoestacao ?? '').trim();
      if (!codigoestacao) continue;

      await prisma.hidroStation.upsert({
        where: { codigoestacao },
        update: {
          Altitude: it.Altitude ?? null,
          Area_Drenagem: it.Area_Drenagem ?? null,
          Bacia_Nome: it.Bacia_Nome ?? null,
          Codigo_Adicional: it.Codigo_Adicional ?? null,
          Codigo_Operadora_Unidade_UF: it.Codigo_Operadora_Unidade_UF ?? null,
          Data_Periodo_Climatologica_Fim: it.Data_Periodo_Climatologica_Fim ?? null,
          Data_Periodo_Climatologica_Inicio: it.Data_Periodo_Climatologica_Inicio ?? null,
          Data_Periodo_Desc_Liquida_Fim: it.Data_Periodo_Desc_Liquida_Fim ?? null,
          Data_Periodo_Desc_liquida_Inicio: it.Data_Periodo_Desc_liquida_Inicio ?? null,
          Data_Periodo_Escala_Fim: it.Data_Periodo_Escala_Fim ?? null,
          Data_Periodo_Escala_Inicio: it.Data_Periodo_Escala_Inicio ?? null,
          Data_Periodo_Piezometria_Fim: it.Data_Periodo_Piezometria_Fim ?? null,
          Data_Periodo_Piezometria_Inicio: it.Data_Periodo_Piezometria_Inicio ?? null,
          Data_Periodo_Pluviometro_Fim: it.Data_Periodo_Pluviometro_Fim ?? null,
          Data_Periodo_Pluviometro_Inicio: it.Data_Periodo_Pluviometro_Inicio ?? null,
          Data_Periodo_Qual_Agua_Fim: it.Data_Periodo_Qual_Agua_Fim ?? null,
          Data_Periodo_Qual_Agua_Inicio: it.Data_Periodo_Qual_Agua_Inicio ?? null,
          Data_Periodo_Registrador_Chuva_Fim: it.Data_Periodo_Registrador_Chuva_Fim ?? null,
          Data_Periodo_Registrador_Chuva_Inicio: it.Data_Periodo_Registrador_Chuva_Inicio ?? null,
          Data_Periodo_Registrador_Nivel_Fim: it.Data_Periodo_Registrador_Nivel_Fim ?? null,
          Data_Periodo_Registrador_Nivel_Inicio: it.Data_Periodo_Registrador_Nivel_Inicio ?? null,
          Data_Periodo_Sedimento_Inicio: it.Data_Periodo_Sedimento_Inicio ?? null,
          Data_Periodo_Sedimento_fim: it.Data_Periodo_Sedimento_fim ?? null,
          Data_Periodo_Tanque_Evapo_Fim: it.Data_Periodo_Tanque_Evapo_Fim ?? null,
          Data_Periodo_Tanque_Evapo_Inicio: it.Data_Periodo_Tanque_Evapo_Inicio ?? null,
          Data_Periodo_Telemetrica_Fim: it.Data_Periodo_Telemetrica_Fim ?? null,
          Data_Periodo_Telemetrica_Inicio: it.Data_Periodo_Telemetrica_Inicio ?? null,
          Data_Ultima_Atualizacao: it.Data_Ultima_Atualizacao ?? null,
          Estacao_Nome: it.Estacao_Nome ?? null,
          Latitude: it.Latitude ?? null,
          Longitude: it.Longitude ?? null,
          Municipio_Codigo: it.Municipio_Codigo ?? null,
          Municipio_Nome: it.Municipio_Nome ?? null,
          Operadora_Codigo: it.Operadora_Codigo ?? null,
          Operadora_Sigla: it.Operadora_Sigla ?? null,
          Operadora_Sub_Unidade_UF: it.Operadora_Sub_Unidade_UF ?? null,
          Operando: it.Operando ?? null,
          Responsavel_Codigo: it.Responsavel_Codigo ?? null,
          Responsavel_Sigla: it.Responsavel_Sigla ?? null,
          Responsavel_Unidade_UF: it.Responsavel_Unidade_UF ?? null,
          Rio_Codigo: it.Rio_Codigo ?? null,
          Rio_Nome: it.Rio_Nome ?? null,
          Sub_Bacia_Codigo: it.Sub_Bacia_Codigo ?? null,
          Sub_Bacia_Nome: it.Sub_Bacia_Nome ?? null,
          Tipo_Estacao: it.Tipo_Estacao ?? null,
          Tipo_Estacao_Climatologica: it.Tipo_Estacao_Climatologica ?? null,
          Tipo_Estacao_Desc_Liquida: it.Tipo_Estacao_Desc_Liquida ?? null,
          Tipo_Estacao_Escala: it.Tipo_Estacao_Escala ?? null,
          Tipo_Estacao_Piezometria: it.Tipo_Estacao_Piezometria ?? null,
          Tipo_Estacao_Pluviometro: it.Tipo_Estacao_Pluviometro ?? null,
          Tipo_Estacao_Qual_Agua: it.Tipo_Estacao_Qual_Agua ?? null,
          Tipo_Estacao_Registrador_Chuva: it.Tipo_Estacao_Registrador_Chuva ?? null,
          Tipo_Estacao_Registrador_Nivel: it.Tipo_Estacao_Registrador_Nivel ?? null,
          Tipo_Estacao_Sedimentos: it.Tipo_Estacao_Sedimentos ?? null,
          Tipo_Estacao_Tanque_evapo: it.Tipo_Estacao_Tanque_evapo ?? null,
          Tipo_Estacao_Telemetrica: it.Tipo_Estacao_Telemetrica ?? null,
          Tipo_Rede_Basica: it.Tipo_Rede_Basica ?? null,
          Tipo_Rede_Captacao: it.Tipo_Rede_Captacao ?? null,
          Tipo_Rede_Classe_Vazao: it.Tipo_Rede_Classe_Vazao ?? null,
          Tipo_Rede_Curso_Dagua: it.Tipo_Rede_Curso_Dagua ?? null,
          Tipo_Rede_Energetica: it.Tipo_Rede_Energetica ?? null,
          Tipo_Rede_Estrategica: it.Tipo_Rede_Estrategica ?? null,
          Tipo_Rede_Navegacao: it.Tipo_Rede_Navegacao ?? null,
          Tipo_Rede_Qual_Agua: it.Tipo_Rede_Qual_Agua ?? null,
          Tipo_Rede_Sedimentos: it.Tipo_Rede_Sedimentos ?? null,
          UF_Estacao: it.UF_Estacao ?? null,
          UF_Nome_Estacao: it.UF_Nome_Estacao ?? null,
          codigobacia: it.codigobacia ?? null,
        },
        create: {
          codigoestacao,
          Altitude: it.Altitude ?? null,
          Area_Drenagem: it.Area_Drenagem ?? null,
          Bacia_Nome: it.Bacia_Nome ?? null,
          Codigo_Adicional: it.Codigo_Adicional ?? null,
          Codigo_Operadora_Unidade_UF: it.Codigo_Operadora_Unidade_UF ?? null,
          Data_Periodo_Climatologica_Fim: it.Data_Periodo_Climatologica_Fim ?? null,
          Data_Periodo_Climatologica_Inicio: it.Data_Periodo_Climatologica_Inicio ?? null,
          Data_Periodo_Desc_Liquida_Fim: it.Data_Periodo_Desc_Liquida_Fim ?? null,
          Data_Periodo_Desc_liquida_Inicio: it.Data_Periodo_Desc_liquida_Inicio ?? null,
          Data_Periodo_Escala_Fim: it.Data_Periodo_Escala_Fim ?? null,
          Data_Periodo_Escala_Inicio: it.Data_Periodo_Escala_Inicio ?? null,
          Data_Periodo_Piezometria_Fim: it.Data_Periodo_Piezometria_Fim ?? null,
          Data_Periodo_Piezometria_Inicio: it.Data_Periodo_Piezometria_Inicio ?? null,
          Data_Periodo_Pluviometro_Fim: it.Data_Periodo_Pluviometro_Fim ?? null,
          Data_Periodo_Pluviometro_Inicio: it.Data_Periodo_Pluviometro_Inicio ?? null,
          Data_Periodo_Qual_Agua_Fim: it.Data_Periodo_Qual_Agua_Fim ?? null,
          Data_Periodo_Qual_Agua_Inicio: it.Data_Periodo_Qual_Agua_Inicio ?? null,
          Data_Periodo_Registrador_Chuva_Fim: it.Data_Periodo_Registrador_Chuva_Fim ?? null,
          Data_Periodo_Registrador_Chuva_Inicio: it.Data_Periodo_Registrador_Chuva_Inicio ?? null,
          Data_Periodo_Registrador_Nivel_Fim: it.Data_Periodo_Registrador_Nivel_Fim ?? null,
          Data_Periodo_Registrador_Nivel_Inicio: it.Data_Periodo_Registrador_Nivel_Inicio ?? null,
          Data_Periodo_Sedimento_Inicio: it.Data_Periodo_Sedimento_Inicio ?? null,
          Data_Periodo_Sedimento_fim: it.Data_Periodo_Sedimento_fim ?? null,
          Data_Periodo_Tanque_Evapo_Fim: it.Data_Periodo_Tanque_Evapo_Fim ?? null,
          Data_Periodo_Tanque_Evapo_Inicio: it.Data_Periodo_Tanque_Evapo_Inicio ?? null,
          Data_Periodo_Telemetrica_Fim: it.Data_Periodo_Telemetrica_Fim ?? null,
          Data_Periodo_Telemetrica_Inicio: it.Data_Periodo_Telemetrica_Inicio ?? null,
          Data_Ultima_Atualizacao: it.Data_Ultima_Atualizacao ?? null,
          Estacao_Nome: it.Estacao_Nome ?? null,
          Latitude: it.Latitude ?? null,
          Longitude: it.Longitude ?? null,
          Municipio_Codigo: it.Municipio_Codigo ?? null,
          Municipio_Nome: it.Municipio_Nome ?? null,
          Operadora_Codigo: it.Operadora_Codigo ?? null,
          Operadora_Sigla: it.Operadora_Sigla ?? null,
          Operadora_Sub_Unidade_UF: it.Operadora_Sub_Unidade_UF ?? null,
          Operando: it.Operando ?? null,
          Responsavel_Codigo: it.Responsavel_Codigo ?? null,
          Responsavel_Sigla: it.Responsavel_Sigla ?? null,
          Responsavel_Unidade_UF: it.Responsavel_Unidade_UF ?? null,
          Rio_Codigo: it.Rio_Codigo ?? null,
          Rio_Nome: it.Rio_Nome ?? null,
          Sub_Bacia_Codigo: it.Sub_Bacia_Codigo ?? null,
          Sub_Bacia_Nome: it.Sub_Bacia_Nome ?? null,
          Tipo_Estacao: it.Tipo_Estacao ?? null,
          Tipo_Estacao_Climatologica: it.Tipo_Estacao_Climatologica ?? null,
          Tipo_Estacao_Desc_Liquida: it.Tipo_Estacao_Desc_Liquida ?? null,
          Tipo_Estacao_Escala: it.Tipo_Estacao_Escala ?? null,
          Tipo_Estacao_Piezometria: it.Tipo_Estacao_Piezometria ?? null,
          Tipo_Estacao_Pluviometro: it.Tipo_Estacao_Pluviometro ?? null,
          Tipo_Estacao_Qual_Agua: it.Tipo_Estacao_Qual_Agua ?? null,
          Tipo_Estacao_Registrador_Chuva: it.Tipo_Estacao_Registrador_Chuva ?? null,
          Tipo_Estacao_Registrador_Nivel: it.Tipo_Estacao_Registrador_Nivel ?? null,
          Tipo_Estacao_Sedimentos: it.Tipo_Estacao_Sedimentos ?? null,
          Tipo_Estacao_Tanque_evapo: it.Tipo_Estacao_Tanque_evapo ?? null,
          Tipo_Estacao_Telemetrica: it.Tipo_Estacao_Telemetrica ?? null,
          Tipo_Rede_Basica: it.Tipo_Rede_Basica ?? null,
          Tipo_Rede_Captacao: it.Tipo_Rede_Captacao ?? null,
          Tipo_Rede_Classe_Vazao: it.Tipo_Rede_Classe_Vazao ?? null,
          Tipo_Rede_Curso_Dagua: it.Tipo_Rede_Curso_Dagua ?? null,
          Tipo_Rede_Energetica: it.Tipo_Rede_Energetica ?? null,
          Tipo_Rede_Estrategica: it.Tipo_Rede_Estrategica ?? null,
          Tipo_Rede_Navegacao: it.Tipo_Rede_Navegacao ?? null,
          Tipo_Rede_Qual_Agua: it.Tipo_Rede_Qual_Agua ?? null,
          Tipo_Rede_Sedimentos: it.Tipo_Rede_Sedimentos ?? null,
          UF_Estacao: it.UF_Estacao ?? null,
          UF_Nome_Estacao: it.UF_Nome_Estacao ?? null,
          codigobacia: it.codigobacia ?? null,
        },
      });
      upserted++;
    }

  console.log('[HIDRO sync] Upserted:', upserted);
  return res.json({ total: (items as any[]).length, upserted });
  } catch (err: any) {
    const status = err?.response?.status ?? 500;
    const message = err?.message ?? 'Erro ao sincronizar inventário HIDRO';
    return res.status(status >= 400 && status < 600 ? status : 500).json({ error: message });
  }
});

router.get('/estacoes/hidro', async (req: Request, res: Response) => {
  try {
    const pagina = Math.max(1, parseInt(String(req.query.pagina ?? '1'), 10) || 1);
    const tamanho = Math.min(200, Math.max(1, parseInt(String(req.query.tamanho ?? '50'), 10) || 50));
    // Aceitar ?unidadefederativa= como alias de ?uf=
    const ufParam = (typeof req.query.unidadefederativa === 'string' && req.query.unidadefederativa.trim())
      ? req.query.unidadefederativa
      : (typeof req.query.uf === 'string' ? req.query.uf : undefined);
    const uf = typeof ufParam === 'string' && ufParam.trim() ? ufParam.trim().toUpperCase() : undefined;
    const q = typeof req.query.q === 'string' && req.query.q.trim() ? req.query.q.trim() : undefined;
    const codigobacia = typeof req.query.codigobacia === 'string' && req.query.codigobacia.trim() ? req.query.codigobacia.trim() : undefined;
    const bacia = typeof req.query.bacia === 'string' && req.query.bacia.trim() ? req.query.bacia.trim() : undefined;
    const subbacia = typeof req.query.subbacia === 'string' && req.query.subbacia.trim() ? req.query.subbacia.trim() : undefined;

    const where: any = {};
    if (uf) where.UF_Estacao = uf;
    if (codigobacia) where.codigobacia = codigobacia;
    if (bacia) where.Bacia_Nome = { contains: bacia, mode: 'insensitive' as const };
    if (subbacia) where.Sub_Bacia_Nome = { contains: subbacia, mode: 'insensitive' as const };
    if (q) {
      where.OR = [
        { Estacao_Nome: { contains: q, mode: 'insensitive' as const } },
        { codigoestacao: { contains: q, mode: 'insensitive' as const } },
        { Rio_Nome: { contains: q, mode: 'insensitive' as const } },
      ];
    }

    const [total, data] = await Promise.all([
      prisma.hidroStation.count({ where }),
      prisma.hidroStation.findMany({
        where,
        orderBy: { Estacao_Nome: 'asc' },
        skip: (pagina - 1) * tamanho,
        take: tamanho,
      }),
    ]);

    return res.json({ data, pagination: { pagina, tamanho, total, paginas: Math.max(1, Math.ceil(total / tamanho)) } });
  } catch (err: any) {
    const status = err?.response?.status ?? 500;
    const message = err?.message ?? 'Erro ao listar estações HIDRO';
    return res.status(status >= 400 && status < 600 ? status : 500).json({ error: message });
  }
});

// Lista agregada de bacias hidrográficas por UF (padrão GO), usando dados já sincronizados em HidroStation
router.get('/bacias', async (req: Request, res: Response) => {
  try {
    // UF padrão GO, pode sobrescrever com ?uf=XX ou ?unidadefederativa=XX
    const ufParam = (typeof req.query.unidadefederativa === 'string' && req.query.unidadefederativa.trim())
      ? req.query.unidadefederativa
      : (typeof req.query.uf === 'string' ? req.query.uf : 'GO');
    const uf = typeof ufParam === 'string' && ufParam.trim() ? ufParam.trim().toUpperCase() : 'GO';

    const q = typeof req.query.q === 'string' && req.query.q.trim() ? req.query.q.trim() : undefined;
    const includeSub = String(req.query.includeSub ?? 'false').toLowerCase() === 'true';

    // Filtros base
    const whereBase: any = { UF_Estacao: uf };
    // Excluir nulos e vazios
    whereBase.AND = [
      { OR: [
        { codigobacia: { not: null } },
        { Bacia_Nome: { not: null } },
      ] },
    ];
    if (q) {
      // Busca por nome da bacia/sub-bacia contendo q (case-insensitive)
      whereBase.OR = [
        { Bacia_Nome: { contains: q, mode: 'insensitive' as const } },
        { Sub_Bacia_Nome: { contains: q, mode: 'insensitive' as const } },
        { codigobacia: { contains: q, mode: 'insensitive' as const } },
      ];
    }

    // Tentar usar groupBy do Prisma para trazer contagens
    try {
      if (includeSub) {
        const grouped = await prisma.hidroStation.groupBy({
          by: ['codigobacia', 'Bacia_Nome', 'Sub_Bacia_Nome'],
          where: whereBase,
          _count: { _all: true },
          orderBy: { _count: { _all: 'desc' } },
        } as any);
        const data = grouped
          .filter((g: any) => (g.codigobacia ?? g.Bacia_Nome ?? g.Sub_Bacia_Nome) != null)
          .map((g: any) => ({
            codigobacia: g.codigobacia ?? null,
            bacia: g.Bacia_Nome ?? null,
            subbacia: g.Sub_Bacia_Nome ?? null,
            count: g._count?._all ?? 0,
          }));
        return res.json({ uf, data });
      } else {
        const grouped = await prisma.hidroStation.groupBy({
          by: ['codigobacia', 'Bacia_Nome'],
          where: whereBase,
          _count: { _all: true },
          orderBy: { _count: { _all: 'desc' } },
        } as any);
        const data = grouped
          .filter((g: any) => (g.codigobacia ?? g.Bacia_Nome) != null)
          .map((g: any) => ({
            codigobacia: g.codigobacia ?? null,
            bacia: g.Bacia_Nome ?? null,
            count: g._count?._all ?? 0,
          }));
        return res.json({ uf, data });
      }
    } catch (e) {
      // Fallback para distinct sem contagem, se groupBy não estiver disponível
      const distinctFields = includeSub ? ['codigobacia', 'Bacia_Nome', 'Sub_Bacia_Nome'] : ['codigobacia', 'Bacia_Nome'];
      const rows = await prisma.hidroStation.findMany({
        where: whereBase,
        distinct: distinctFields as any,
        select: includeSub
          ? { codigobacia: true, Bacia_Nome: true, Sub_Bacia_Nome: true }
          : { codigobacia: true, Bacia_Nome: true },
        orderBy: [{ Bacia_Nome: 'asc' }, includeSub ? { Sub_Bacia_Nome: 'asc' } : {}].filter(Boolean) as any,
      });
      const data = rows.map((r: any) => ({
        codigobacia: r.codigobacia ?? null,
        bacia: r.Bacia_Nome ?? null,
        ...(includeSub ? { subbacia: r.Sub_Bacia_Nome ?? null } : {}),
        count: undefined,
      }));
      return res.json({ uf, data, note: 'groupBy indisponível — retornando lista sem contagens' });
    }
  } catch (err: any) {
    const status = err?.response?.status ?? 500;
    const message = err?.message ?? 'Erro ao listar bacias';
    return res.status(status >= 400 && status < 600 ? status : 500).json({ error: message });
  }
});

// Versão "ao vivo": busca na ANA em tempo real e agrega bacias (sem depender do banco)
router.get('/bacias/live', async (req: Request, res: Response) => {
  try {
    const envBaseUrl = process.env.ANA_BASE_URL ?? '';
    if (!envBaseUrl) {
      return res.status(500).json({ error: 'Configuração ausente: defina ANA_BASE_URL no arquivo .env' });
    }
    const client = new AnaClient({ baseURL: envBaseUrl });

    // UF padrão GO; aceita ?uf=XX ou ?unidadefederativa=XX
    const ufParam = (typeof req.query.unidadefederativa === 'string' && req.query.unidadefederativa.trim())
      ? req.query.unidadefederativa
      : (typeof req.query.uf === 'string' ? req.query.uf : 'GO');
    const uf = typeof ufParam === 'string' && ufParam.trim() ? ufParam.trim().toUpperCase() : 'GO';

    const q = typeof req.query.q === 'string' && req.query.q.trim() ? req.query.q.trim() : undefined;
    const includeSub = String(req.query.includeSub ?? 'false').toLowerCase() === 'true';

    // Obter token: Authorization header (Bearer), ?token=, ou fazer login com .env/consulta
    const authHeader = typeof req.headers.authorization === 'string' ? req.headers.authorization : undefined;
    const tokenFromHeader = authHeader && /bearer\s+(.+)/i.test(authHeader) ? (authHeader.match(/bearer\s+(.+)/i)![1]).trim() : undefined;
    const tokenFromQuery = typeof req.query.token === 'string' && req.query.token.trim() ? req.query.token.trim() : undefined;
    let token = tokenFromHeader || tokenFromQuery;
    if (!token) {
      // login com credenciais do .env (ou fornecidas via query ?identificador= & ?senha=)
      const identificador = (typeof req.query.identificador === 'string' && req.query.identificador.trim())
        ? String(req.query.identificador)
        : (process.env.ANA_IDENTIFICADOR ?? '');
      const senha = (typeof req.query.senha === 'string' && req.query.senha.trim())
        ? String(req.query.senha)
        : (process.env.ANA_SENHA ?? '');
      if (!identificador || !senha) {
        return res.status(400).json({ error: 'Forneça Authorization: Bearer <token>, ?token=, ou configure/enviar ANA_IDENTIFICADOR e ANA_SENHA.' });
      }
      const login = await client.login(identificador, senha);
      token = login.token;
    }

    const items = await client.getHidroInventarioEstacoes(token!, { UF: uf });
    type Row = { codigobacia?: unknown; Bacia_Nome?: unknown; Sub_Bacia_Nome?: unknown } & Record<string, unknown>;

    // agrega
    const key = (r: Row) => {
      const cod = normalizeStr(r.codigobacia);
      const bac = normalizeStr(r.Bacia_Nome);
      const sub = normalizeStr(r.Sub_Bacia_Nome);
      return includeSub ? `${cod}||${bac}||${sub}` : `${cod}||${bac}`;
    };
    const map = new Map<string, { codigobacia: string | null; bacia: string | null; subbacia?: string | null; count: number }>();
    for (const it of items as Row[]) {
      const cod = normalizeStr(it.codigobacia);
      const bac = normalizeStr(it.Bacia_Nome);
      const sub = normalizeStr(it.Sub_Bacia_Nome);
      // ignorar linhas sem bacia e sem código
      if (!cod && !bac && (!includeSub || !sub)) continue;
      const k = includeSub ? `${cod}||${bac}||${sub}` : `${cod}||${bac}`;
      const cur = map.get(k) ?? { codigobacia: cod, bacia: bac, ...(includeSub ? { subbacia: sub } : {}), count: 0 } as any;
      cur.count += 1;
      map.set(k, cur);
    }
    let data = Array.from(map.values());

    if (q) {
      const QQ = q.toLowerCase();
      data = data.filter(d =>
        (d.codigobacia ?? '').toLowerCase().includes(QQ) ||
        (d.bacia ?? '').toLowerCase().includes(QQ) ||
        ((d as any).subbacia ?? '').toLowerCase().includes(QQ)
      );
    }

    // ordenar por count desc, depois nome asc
    data.sort((a, b) => {
      const c = (b.count ?? 0) - (a.count ?? 0);
      if (c !== 0) return c;
      const an = (a.bacia ?? '') as string; const bn = (b.bacia ?? '') as string;
      return an.localeCompare(bn, 'pt-BR', { sensitivity: 'base' });
    });

    return res.json({ uf, source: 'live', fetched: (items as any[]).length, data });
  } catch (err: any) {
    const status = err?.response?.status ?? 500;
    const message = err?.message ?? 'Erro ao listar bacias (live)';
    return res.status(status >= 400 && status < 600 ? status : 500).json({ error: message });
  }
});

function normalizeStr(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

router.get('/estacoes', async (req: Request, res: Response) => {
  try {
    const pagina = Math.max(1, parseInt(String(req.query.pagina ?? '1'), 10) || 1);
    const tamanho = Math.min(200, Math.max(1, parseInt(String(req.query.tamanho ?? '50'), 10) || 50));
    const ufParam2 = (typeof req.query.unidadefederativa === 'string' && req.query.unidadefederativa.trim())
      ? req.query.unidadefederativa
      : (typeof req.query.uf === 'string' ? req.query.uf : undefined);
    const uf = typeof ufParam2 === 'string' && ufParam2.trim() ? ufParam2.trim().slice(0, 2).toUpperCase() : undefined;
    const q = typeof req.query.q === 'string' && req.query.q.trim() ? req.query.q.trim() : undefined;

    const where: any = {};
    if (uf) where.UF = uf;
    if (q) {
      where.OR = [
        { Estacao_Nome: { contains: q, mode: 'insensitive' as const } },
        { codigoestacao: { contains: q, mode: 'insensitive' as const } },
        { Corpo_Hidrico: { contains: q, mode: 'insensitive' as const } },
      ];
    }

    const [total, data] = await Promise.all([
      prisma.station.count({ where }),
      prisma.station.findMany({
        where,
        orderBy: { Estacao_Nome: 'asc' },
        skip: (pagina - 1) * tamanho,
        take: tamanho,
      }),
    ]);

    return res.json({
      data,
      pagination: {
        pagina,
        tamanho,
        total,
        paginas: Math.max(1, Math.ceil(total / tamanho)),
      },
    });
  } catch (err: any) {
    const status = err?.response?.status ?? 500;
    const message = err?.message ?? 'Erro ao listar estações';
    return res.status(status >= 400 && status < 600 ? status : 500).json({ error: message });
  }
});

// ============================================
// SÉRIES TELEMÉTRICAS - Buscar e armazenar dados detalhados
// ============================================

const SerieTelemetricaSchema = z.object({
  token: z.string().optional(),
  identificador: z.string().optional(),
  senha: z.string().optional(),
  codigoEstacao: z.string().min(1, 'Código da estação é obrigatório'),
  // Novos parâmetros conforme interface da ANA
  tipoFiltroData: z.string().optional(), // ex: DATA_LEITURA (padrão)
  dataBusca: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato yyyy-MM-dd'), // ex: 2025-10-01
  rangeIntervalo: z.string().optional(),  // ex: DIAS_30, MINUTO_5, HORA_1, etc.
  tipo: z.enum(['chuva', 'vazao', 'nivel']).optional(), // Se não informado, busca todos
});

/**
 * GET /api/ana/series/test/:codigoEstacao
 * Endpoint de teste para ver a estrutura dos dados da ANA
 * Query params OBRIGATÓRIOS:
 * - dataBusca: data de referência no formato yyyy-MM-dd (ex: 2025-10-01)
 * Query params opcionais:
 * - tipoFiltroData: tipo do filtro (padrão: DATA_LEITURA)
 * - rangeIntervalo: intervalo de busca (padrão: DIAS_30)
 * 
 * NOTA: Atualmente restrito à estação 75650010
 */
router.get('/series/test/:codigoEstacao', async (req: Request, res: Response) => {
  try {
    const envBaseUrl = process.env.ANA_BASE_URL ?? '';
    if (!envBaseUrl) return res.status(500).json({ error: 'Configuração ausente: defina ANA_BASE_URL no arquivo .env' });
    
    const client = new AnaClient({ baseURL: envBaseUrl });
    const { codigoEstacao } = req.params;
    
    if (!codigoEstacao) {
      return res.status(400).json({ error: 'Código da estação é obrigatório' });
    }
    
    // Validar dataBusca obrigatória
    const dataBusca = req.query.dataBusca as string;
    if (!dataBusca) {
      return res.status(400).json({
        error: 'Parâmetro obrigatório ausente',
        message: 'dataBusca é obrigatório no formato yyyy-MM-dd (ex: ?dataBusca=2025-10-01)'
      });
    }
    
    // Validar formato da data
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataBusca)) {
      return res.status(400).json({
        error: 'Formato de data inválido',
        message: 'dataBusca deve estar no formato yyyy-MM-dd (ex: 2025-10-01)'
      });
    }

    // Obter token
    const identificador = process.env.ANA_IDENTIFICADOR ?? '';
    const senha = process.env.ANA_SENHA ?? '';
    if (!identificador || !senha) {
      return res.status(400).json({ error: 'Configure ANA_IDENTIFICADOR e ANA_SENHA no .env' });
    }
    const login = await client.login(identificador, senha);
    const token = login.token;

    // Usar parâmetros da query ou valores padrão
    const tipoFiltroData = (req.query.tipoFiltroData as string) ?? 'DATA_LEITURA';
    const rangeIntervalo = (req.query.rangeIntervalo as string) ?? 'DIAS_30';

    console.log(`\n[TEST] Buscando dados de teste para estação ${codigoEstacao}`);
    console.log(`[TEST] Data: ${dataBusca}, Filtro: ${tipoFiltroData}, Intervalo: ${rangeIntervalo}`);

    const results: any = {
      codigoEstacao,
      parametros: { dataBusca, tipoFiltroData, rangeIntervalo },
      dadosDetalhados: null,
    };

    // Buscar dados do endpoint unificado (v2)
    try {
      const dadosDetalhados = await client.getSerieTelemetricaDetalhada(token, {
        codigoEstacao,
        tipoFiltroData,
        dataBusca,
        rangeIntervalo,
      });
      results.dadosDetalhados = {
        total: Array.isArray(dadosDetalhados) ? dadosDetalhados.length : 0,
        sample: Array.isArray(dadosDetalhados) ? dadosDetalhados.slice(0, 3) : null,
        estruturaCompleta: dadosDetalhados,
      };
      console.log(`[TEST] Dados detalhados: ${results.dadosDetalhados.total} registros`);
    } catch (error: any) {
      results.dadosDetalhados = { error: error.message };
      console.log(`[TEST] Dados detalhados: erro - ${error.message}`);
    }

    res.json(results);
  } catch (error: any) {
    console.error('[TEST] Erro geral:', error);
    res.status(500).json({ 
      error: 'Erro ao testar dados da ANA',
      details: error.message 
    });
  }
});

/**
 * POST /api/ana/series/sync
 * Busca séries telemétricas da ANA e armazena no banco
 * Agora usa a estrutura unificada SerieTelemetrica que armazena TODOS os dados
 */
router.post('/series/sync', async (req: Request, res: Response) => {
  try {
    const envBaseUrl = process.env.ANA_BASE_URL ?? '';
    if (!envBaseUrl) return res.status(500).json({ error: 'Configuração ausente: defina ANA_BASE_URL no arquivo .env' });
    
    const client = new AnaClient({ baseURL: envBaseUrl });
    const parsed = SerieTelemetricaSchema.parse(req.body ?? {});
    
    // Obter token
    let token = parsed.token;
    if (!token) {
      const identificador = parsed.identificador ?? process.env.ANA_IDENTIFICADOR ?? '';
      const senha = parsed.senha ?? process.env.ANA_SENHA ?? '';
      if (!identificador || !senha) {
        return res.status(400).json({ error: 'Informe token ou credenciais (identificador, senha).' });
      }
      const login = await client.login(identificador, senha);
      token = login.token;
    }

    const { codigoEstacao, tipoFiltroData, dataBusca, rangeIntervalo, tipo } = parsed;
    const params = { 
      codigoEstacao, 
      tipoFiltroData: tipoFiltroData ?? 'DATA_LEITURA',
      dataBusca,  // Obrigatório
      rangeIntervalo: rangeIntervalo ?? 'DIAS_30',
    };
    const results: any = { 
      codigoEstacao, 
      parametros: { 
        tipoFiltroData: params.tipoFiltroData,
        dataBusca: params.dataBusca,
        rangeIntervalo: params.rangeIntervalo,
      },
    };

    // Buscar séries do endpoint unificado (v2)
    let totalUpserted = 0;

    try {
      // Usar endpoint detalhado que traz todos os dados em uma única chamada
      const items = await client.getSerieTelemetricaDetalhada(token!, params) as any[];

      // Processar todos os registros na nova estrutura unificada
      for (const it of items) {
        const dataHoraMedicao = parseDataHora(it.Data_Hora_Medicao ?? it.DataHora ?? it.dataHora ?? it.Data);
        if (!dataHoraMedicao) continue;

        // Extrair todos os campos da API (mantendo como strings)
        const data = {
          codigoestacao: codigoEstacao,
          Data_Hora_Medicao: dataHoraMedicao,
          
          // Campos de Chuva
          Chuva_Acumulada: it.Chuva_Acumulada || null,
          Chuva_Adotada: it.Chuva_Adotada || null,
          Chuva_Acumulada_Status: it.Chuva_Acumulada_Status || null,
          Chuva_Adotada_Status: it.Chuva_Adotada_Status || null,
          
          // Campos de Cota (Nível)
          Cota_Sensor: it.Cota_Sensor || null,
          Cota_Adotada: it.Cota_Adotada || null,
          Cota_Display: it.Cota_Display || null,
          Cota_Manual: it.Cota_Manual || null,
          Cota_Sensor_Status: it.Cota_Sensor_Status || null,
          Cota_Adotada_Status: it.Cota_Adotada_Status || null,
          Cota_Display_Status: it.Cota_Display_Status || null,
          Cota_Manual_Status: it.Cota_Manual_Status || null,
          
          // Campos de Vazão
          Vazao_Adotada: it.Vazao_Adotada || null,
          Vazao_Adotada_Status: it.Vazao_Adotada_Status || null,
          
          // Temperatura
          Temperatura_Agua: it.Temperatura_Agua || null,
          Temperatura_Agua_Status: it.Temperatura_Agua_Status || null,
          Temperatura_Interna: it.Temperatura_Interna || null,
          
          // Outros sensores
          Pressao_Atmosferica: it.Pressao_Atmosferica || null,
          Pressao_Atmosferica_Status: it.Pressao_Atmosferica_Status || null,
          Bateria: it.Bateria || null,
          
          // Data de atualização (mantendo como string)
          Data_Atualizacao: it.Data_Atualizacao || null,
        };

        // Upsert no banco (usando a estrutura unificada)
        await prisma.serieTelemetrica.upsert({
            where: {
              codigoestacao_Data_Hora_Medicao: {
                codigoestacao: codigoEstacao,
                Data_Hora_Medicao: dataHoraMedicao,
              },
            },
            update: data,
            create: data,
          });
          totalUpserted++;
        }
        
        console.log(`[Séries Detalhadas] Processados ${items.length} registros, ${totalUpserted} inseridos/atualizados`);
      } catch (e: any) {
        console.error(`[Séries Detalhadas] Erro:`, e.message);
        return res.status(500).json({ error: e.message });
      }

    return res.json({ 
      total: totalUpserted, 
      codigoEstacao, 
      success: true 
    });
  } catch (err: any) {
    const status = err?.response?.status ?? 500;
    const message = err?.message ?? 'Erro ao sincronizar séries telemétricas';
    return res.status(status >= 400 && status < 600 ? status : 500).json({ error: message });
  }
});

/**
 * GET /api/ana/series/estacoes/lista
 * Retorna lista de todas as estações que possuem dados sincronizados
 */
router.get('/series/estacoes/lista', async (_req: Request, res: Response) => {
  try {
    // Buscar estações únicas com dados
    const estacoes = await prisma.serieTelemetrica.groupBy({
      by: ['codigoestacao'],
      _count: {
        codigoestacao: true
      },
      _min: {
        Data_Hora_Medicao: true
      },
      _max: {
        Data_Hora_Medicao: true
      }
    });

    // Buscar informações das estações do banco
    const estacoesComInfo = await Promise.all(
      estacoes.map(async (est) => {
        const station = await prisma.hidroStation.findUnique({
          where: { codigoestacao: est.codigoestacao }
        });

        return {
          codigoEstacao: est.codigoestacao,
          nome: station?.Estacao_Nome || 'Nome não disponível',
          latitude: station?.Latitude ? parseFloat(station.Latitude) : null,
          longitude: station?.Longitude ? parseFloat(station.Longitude) : null,
          totalRegistros: est._count.codigoestacao,
          periodoInicio: est._min.Data_Hora_Medicao,
          periodoFim: est._max.Data_Hora_Medicao
        };
      })
    );

    // Ordenar por nome
    estacoesComInfo.sort((a, b) => a.nome.localeCompare(b.nome));

    return res.json(estacoesComInfo);
  } catch (err: any) {
    const message = err?.message ?? 'Erro ao buscar lista de estações';
    return res.status(500).json({ error: message });
  }
});

/**
 * GET /api/ana/series/:codigoEstacao
 * Retorna estatísticas das séries armazenadas para uma estação
 */
router.get('/series/:codigoEstacao', async (req: Request, res: Response) => {
  try {
    const codigoEstacao = req.params.codigoEstacao;
    
    // Contar total de registros telemetricos
    const totalCount = await prisma.serieTelemetrica.count({ where: { codigoestacao: codigoEstacao } });

    // Buscar período disponível
    const [first, last] = await Promise.all([
      prisma.serieTelemetrica.findFirst({ 
        where: { codigoestacao: codigoEstacao }, 
        orderBy: { Data_Hora_Medicao: 'asc' } 
      }),
      prisma.serieTelemetrica.findFirst({ 
        where: { codigoestacao: codigoEstacao }, 
        orderBy: { Data_Hora_Medicao: 'desc' } 
      }),
    ]);

    // Contar registros com dados específicos
    const [comChuva, comVazao, comCota, comTemperatura] = await Promise.all([
      prisma.serieTelemetrica.count({ 
        where: { 
          codigoestacao: codigoEstacao,
          OR: [
            { Chuva_Acumulada: { not: null } },
            { Chuva_Adotada: { not: null } }
          ]
        } 
      }),
      prisma.serieTelemetrica.count({ 
        where: { 
          codigoestacao: codigoEstacao,
          Vazao_Adotada: { not: null }
        } 
      }),
      prisma.serieTelemetrica.count({ 
        where: { 
          codigoestacao: codigoEstacao,
          OR: [
            { Cota_Sensor: { not: null } },
            { Cota_Adotada: { not: null } }
          ]
        } 
      }),
      prisma.serieTelemetrica.count({ 
        where: { 
          codigoestacao: codigoEstacao,
          OR: [
            { Temperatura_Agua: { not: null } },
            { Temperatura_Interna: { not: null } }
          ]
        } 
      }),
    ]);

    return res.json({
      codigoEstacao,
      total: totalCount,
      periodo: first && last ? {
        inicio: first.Data_Hora_Medicao,
        fim: last.Data_Hora_Medicao,
      } : null,
      tiposDados: {
        chuva: comChuva,
        vazao: comVazao,
        cota: comCota,
        temperatura: comTemperatura,
      },
    });
  } catch (err: any) {
    const status = err?.response?.status ?? 500;
    const message = err?.message ?? 'Erro ao obter informações das séries';
    return res.status(status >= 400 && status < 600 ? status : 500).json({ error: message });
  }
});

/**
 * GET /api/ana/series/:codigoEstacao/:tipo
 * Retorna dados de série específica (chuva, vazao, cota, temperatura ou all)
 */
router.get('/series/:codigoEstacao/:tipo', async (req: Request, res: Response) => {
  try {
    const { codigoEstacao, tipo } = req.params;
    const limit = Math.min(1000, parseInt(String(req.query.limit ?? '100'), 10));
    const offset = Math.max(0, parseInt(String(req.query.offset ?? '0'), 10));
    const dataInicio = typeof req.query.dataInicio === 'string' ? req.query.dataInicio : undefined;
    const dataFim = typeof req.query.dataFim === 'string' ? req.query.dataFim : undefined;

    const where: any = { codigoestacao: codigoEstacao };
    if (dataInicio || dataFim) {
      where.Data_Hora_Medicao = {};
      if (dataInicio) where.Data_Hora_Medicao.gte = new Date(dataInicio);
      if (dataFim) where.Data_Hora_Medicao.lte = new Date(dataFim);
    }

    // Filtrar por tipo de dado se solicitado
    if (tipo === 'chuva') {
      where.OR = [
        { Chuva_Acumulada: { not: null } },
        { Chuva_Adotada: { not: null } }
      ];
    } else if (tipo === 'vazao') {
      where.Vazao_Adotada = { not: null };
    } else if (tipo === 'cota' || tipo === 'nivel') {
      where.OR = [
        { Cota_Sensor: { not: null } },
        { Cota_Adotada: { not: null } },
        { Cota_Display: { not: null } },
        { Cota_Manual: { not: null } }
      ];
    } else if (tipo === 'temperatura') {
      where.OR = [
        { Temperatura_Agua: { not: null } },
        { Temperatura_Interna: { not: null } }
      ];
    } else if (tipo !== 'all') {
      return res.status(400).json({ error: 'Tipo inválido. Use: chuva, vazao, cota, temperatura ou all' });
    }

    const [data, total] = await Promise.all([
      prisma.serieTelemetrica.findMany({ 
        where, 
        orderBy: { Data_Hora_Medicao: 'asc' }, 
        skip: offset, 
        take: limit 
      }),
      prisma.serieTelemetrica.count({ where }),
    ]);

    return res.json({
      codigoEstacao,
      tipo,
      data,
      pagination: {
        offset,
        limit,
        total,
      },
    });
  } catch (err: any) {
    const status = err?.response?.status ?? 500;
    const message = err?.message ?? 'Erro ao obter dados da série';
    return res.status(status >= 400 && status < 600 ? status : 500).json({ error: message });
  }
});

// Função auxiliar para parsear data/hora
function parseDataHora(val: any): Date | null {
  if (!val) return null;
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

// ============================================
// SINCRONIZAÇÃO - Novos endpoints para gerenciar sync
// ============================================

/**
 * POST /api/ana/sync/manual
 * Dispara uma sincronização manual de dados
 * Body: { codigoEstacao, dataInicio, dataFim, intervaloDias? }
 */
router.post('/sync/manual', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      codigoEstacao: z.string().min(1, 'Código da estação é obrigatório'),
      dataInicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato yyyy-MM-dd'),
      dataFim: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato yyyy-MM-dd'),
      intervaloDias: z.number().min(1).max(90).optional(),
    });

    const options = schema.parse(req.body) as SyncOptions;

    // Validar que dataInicio < dataFim
    if (new Date(options.dataInicio) > new Date(options.dataFim)) {
      return res.status(400).json({ error: 'dataInicio deve ser anterior a dataFim' });
    }

    // Executar sincronização e aguardar resultado
    const result = await executarSincronizacao(options);
    
    console.log('[Sync] Concluída:', result);
    
    // Retornar resultado completo com detalhes
    return res.json(result);

  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: err.errors });
    }
    const message = err?.message ?? 'Erro ao iniciar sincronização';
    return res.status(500).json({ error: message });
  }
});

/**
 * POST /api/ana/sync/ultimos-dias
 * Sincroniza os últimos N dias
 * Body: { codigoEstacao, dias? }
 */
router.post('/sync/ultimos-dias', async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      codigoEstacao: z.string().min(1, 'Código da estação é obrigatório'),
      dias: z.number().min(1).max(30).optional().default(7),
    });

    const { codigoEstacao, dias } = schema.parse(req.body);

    // Executar sincronização e aguardar resultado
    const result = await sincronizarUltimosDias(codigoEstacao, dias);
    
    console.log('[Sync Últimos Dias] Concluída:', result);
    
    // Retornar resultado completo com detalhes
    return res.json(result);

  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', details: err.errors });
    }
    const message = err?.message ?? 'Erro ao iniciar sincronização';
    return res.status(500).json({ error: message });
  }
});

/**
 * GET /api/ana/sync/status
 * Retorna o status atual da sincronização
 */
router.get('/sync/status', async (_req: Request, res: Response) => {
  try {
    const status = getSyncStatus();
    return res.json(status);
  } catch (err: any) {
    const message = err?.message ?? 'Erro ao obter status da sincronização';
    return res.status(500).json({ error: message });
  }
});

