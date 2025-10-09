import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { AnaClient } from '../services/anaClient';
import { prisma } from '../db/prisma';

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
