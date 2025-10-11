import axios, { AxiosInstance } from 'axios';

export interface AnaClientOptions {
  baseURL: string;
  timeoutMs?: number;
}

export interface LoginResult {
  token: string;
  raw: unknown;
}

export class AnaClient {
  private http: AxiosInstance;
  constructor(opts: AnaClientOptions) {
    if (!opts.baseURL) {
      throw new Error('ANA baseURL must be provided (env ANA_BASE_URL)');
    }
    const base = opts.baseURL.replace(/\/$/, '');
    if (/\/EstacoesTelemetricas\/OAUth\/v1\/?$/i.test(base)) {
      throw new Error('ANA_BASE_URL deve conter apenas a base (ex.: https://api.ana.gov.br/hidrowebservice), não inclua \/EstacoesTelemetricas\/OAUth\/v1');
    }
    this.http = axios.create({ baseURL: base, timeout: opts.timeoutMs ?? 15000 });
  }

  async login(identificador: string, senha: string): Promise<LoginResult> {
    if (!identificador || !senha) {
      throw new Error('Identificador e Senha são obrigatórios para login na ANA.');
    }
    const resp = await this.http.get('/EstacoesTelemetricas/OAUth/v1', {
      headers: {
        Identificador: identificador,
        Senha: senha,
      },
      validateStatus: (s) => s >= 200 && s < 500,
    });

    if (resp.status >= 400) {
      const msg = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);
      throw new Error(`Falha no login ANA (${resp.status}): ${msg}`);
    }

    const token = normalizeToken(resp.data, resp.headers?.authorization as string | undefined);
    if (!token) {
      throw new Error('Não foi possível identificar o token de autenticação retornado pela ANA.');
    }
    return { token, raw: resp.data };
  }

  /**
   * Busca séries telemétricas detalhadas (endpoint unificado v2)
   * Endpoint: /EstacoesTelemetricas/HidroinfoanaSerieTelemetricaDetalhada/v2
   * 
   * Este endpoint retorna TODOS os dados em um único objeto:
   * - Chuva (acumulada, adotada)
   * - Cota/Nível (sensor, adotada, display, manual)
   * - Vazão (adotada)
   * - Temperatura (água, interna)
   * - Pressão atmosférica
   * - Bateria
   * 
   * Parâmetros esperados pela API da ANA:
   * - Codigos_Estacoes: código(s) da(s) estação(ões) separados por vírgula
   * - Tipo Filtro Data: DATA_LEITURA (tipo do filtro de data)
   * - Data de Busca: data no formato yyyy-MM-dd
   * - Range Intervalo de busca: DIAS_30, HORA_1, MINUTO_5, etc.
   */
  async getSerieTelemetricaDetalhada(
    token: string,
    params: {
      codigoEstacao: string | string[]  // Aceita um código ou array de códigos
      tipoFiltroData?: string            // Padrão: DATA_LEITURA
      dataBusca: string                  // Data no formato yyyy-MM-dd
      rangeIntervalo?: string            // Padrão: DIAS_30
    }
  ): Promise<unknown[]> {
    if (!token) throw new Error('Token é obrigatório para consultar séries telemétricas.');
    if (!params.codigoEstacao) throw new Error('Código da estação é obrigatório.');
    if (!params.dataBusca) throw new Error('Data de busca é obrigatória.');
    
    // Normalizar código(s) da estação
    const codigos = Array.isArray(params.codigoEstacao) 
      ? params.codigoEstacao.join(',')
      : params.codigoEstacao;
    
    const search: Record<string, string> = {
      'Codigos_Estacoes': codigos,
      'Tipo Filtro Data': params.tipoFiltroData ?? 'DATA_LEITURA',
      'Data de Busca (yyyy-MM-dd)': params.dataBusca,
      'Range Intervalo de busca': params.rangeIntervalo ?? 'DIAS_30',
    };

    try {
      console.log('[ANA Detalhada] GET /EstacoesTelemetricas/HidroinfoanaSerieTelemetricaDetalhada/v2 params =', search);
      const cleanToken = token.replace(/[\r\n\t]/g, '').trim();
      const resp = await this.http.get('/EstacoesTelemetricas/HidroinfoanaSerieTelemetricaDetalhada/v2', {
        headers: { Authorization: `Bearer ${cleanToken}`, Accept: 'application/json, text/plain, */*' },
        params: search,
        validateStatus: (s) => s >= 200 && s < 500,
      });
      console.log('[ANA Detalhada] status =', resp.status);
      if (resp.status >= 400) {
        const msg = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);
        throw new Error(`Falha ao obter série telemetrica detalhada (${resp.status}): ${msg}`);
      }
      const arr = normalizeItemsArray(resp.data);
      console.log('[ANA Detalhada] items count =', Array.isArray(arr) ? arr.length : 0);
      return arr;
    } catch (e) {
      console.error('[ANA Detalhada] request failed:', (e as any)?.message || e);
      throw e;
    }
  }


  async getHidrosatInventarioEstacoes(token: string): Promise<unknown[]> {
    if (!token) throw new Error('Token é obrigatório para consultar o inventário Hidrosat.');
    // Sanitizar token: remover quebras de linha, espaços extras e caracteres inválidos
    const cleanToken = token.replace(/[\r\n\t]/g, '').trim();
    const resp = await this.http.get('/EstacoesTelemetricas/HidrosatInventarioEstacoes/v1', {
      headers: {
        Authorization: `Bearer ${cleanToken}`,
        Accept: 'application/json, text/plain, */*',
      },
      validateStatus: (s) => s >= 200 && s < 500,
    });
    if (resp.status >= 400) {
      const msg = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);
      throw new Error(`Falha ao obter inventário Hidrosat (${resp.status}): ${msg}`);
    }
    return normalizeItemsArray(resp.data);
  }
  async getHidroInventarioEstacoes(token: string, params: { UF?: string; codigoestacao?: string; codigobacia?: string }): Promise<unknown[]> {
    if (!token) throw new Error('Token é obrigatório para consultar o inventário HIDRO.');
    const search: Record<string, string> = {};
    // ANA exige UF como "Unidade Federativa"
    if (params?.UF) search['Unidade Federativa'] = params.UF;
    if (params?.codigoestacao) search['codigoestacao'] = params.codigoestacao;
    if (params?.codigobacia) search['codigobacia'] = params.codigobacia;
    if (Object.keys(search).length === 0) {
      throw new Error('Informe ao menos um filtro (UF, codigoestacao ou codigobacia) para HIDRO.');
    }
    try {
      console.log('[ANA HIDRO] GET /EstacoesTelemetricas/HidroInventarioEstacoes/v1 params =', search);
      // Sanitizar token: remover quebras de linha, espaços extras e caracteres inválidos
      const cleanToken = token.replace(/[\r\n\t]/g, '').trim();
      const resp = await this.http.get('/EstacoesTelemetricas/HidroInventarioEstacoes/v1', {
        headers: { Authorization: `Bearer ${cleanToken}`, Accept: 'application/json, text/plain, */*' },
        params: search,
        validateStatus: (s) => s >= 200 && s < 500,
      });
      console.log('[ANA HIDRO] status =', resp.status, '| content-type =', resp.headers?.['content-type']);
      if (resp.status >= 400) {
        const msg = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);
        throw new Error(`Falha ao obter inventário HIDRO (${resp.status}): ${msg}`);
      }
      const arr = normalizeItemsArray(resp.data);
      console.log('[ANA HIDRO] items count =', Array.isArray(arr) ? arr.length : 0);
      return arr;
    } catch (e) {
      console.error('[ANA HIDRO] request failed:', (e as any)?.message || e);
      throw e;
    }
  }

  /**
   * Busca séries telemétricas de chuva (pluviometria)
   * Endpoint: /EstacoesTelemetricas/SerieTelemetricaChuva/v1
   * 
   * Parâmetros esperados pela API da ANA:
   * - Codigos_Estacoes: código(s) da(s) estação(ões) separados por vírgula
   * - Tipo Filtro Data: tipo do filtro (ex: DATA_ULTIMA_ATUALIZACAO)
   * - Range Intervalo de busca: intervalo (DIAS_30, MINUTO_5, HORA_1, etc.)
   */
  async getSerieTelemetricaChuva(
    token: string,
    params: {
      codigoEstacao: string | string[]  // Aceita um código ou array de códigos
      tipoFiltroData?: string            // Padrão: DATA_LEITURA
      dataBusca: string                  // Data no formato yyyy-MM-dd
      rangeIntervalo?: string            // Padrão: DIAS_30
    }
  ): Promise<unknown[]> {
    if (!token) throw new Error('Token é obrigatório para consultar séries de chuva.');
    if (!params.codigoEstacao) throw new Error('Código da estação é obrigatório.');
    if (!params.dataBusca) throw new Error('Data de busca é obrigatória.');
    
    // Normalizar código(s) da estação
    const codigos = Array.isArray(params.codigoEstacao) 
      ? params.codigoEstacao.join(',')
      : params.codigoEstacao;
    
    const search: Record<string, string> = {
      'Codigos_Estacoes': codigos,
      'Tipo Filtro Data': params.tipoFiltroData ?? 'DATA_LEITURA',
      'Data de Busca': params.dataBusca,
      'Range Intervalo de busca': params.rangeIntervalo ?? 'DIAS_30',
    };

    try {
      console.log('[ANA Chuva] GET /EstacoesTelemetricas/SerieTelemetricaChuva/v1 params =', search);
      const cleanToken = token.replace(/[\r\n\t]/g, '').trim();
      const resp = await this.http.get('/EstacoesTelemetricas/SerieTelemetricaChuva/v1', {
        headers: { Authorization: `Bearer ${cleanToken}`, Accept: 'application/json, text/plain, */*' },
        params: search,
        validateStatus: (s) => s >= 200 && s < 500,
      });
      console.log('[ANA Chuva] status =', resp.status);
      if (resp.status >= 400) {
        const msg = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);
        throw new Error(`Falha ao obter série de chuva (${resp.status}): ${msg}`);
      }
      const arr = normalizeItemsArray(resp.data);
      console.log('[ANA Chuva] items count =', Array.isArray(arr) ? arr.length : 0);
      return arr;
    } catch (e) {
      console.error('[ANA Chuva] request failed:', (e as any)?.message || e);
      throw e;
    }
  }

  /**
   * Busca séries telemétricas de vazão
   * Endpoint: /EstacoesTelemetricas/SerieTelemetricaVazao/v1
   * 
   * Parâmetros esperados pela API da ANA:
   * - Codigos_Estacoes: código(s) da(s) estação(ões) separados por vírgula
   * - Tipo Filtro Data: tipo do filtro (ex: DATA_ULTIMA_ATUALIZACAO)
   * - Range Intervalo de busca: intervalo (DIAS_30, MINUTO_5, HORA_1, etc.)
   */
  async getSerieTelemetricaVazao(
    token: string,
    params: {
      codigoEstacao: string | string[]
      tipoFiltroData?: string
      dataBusca: string
      rangeIntervalo?: string
    }
  ): Promise<unknown[]> {
    if (!token) throw new Error('Token é obrigatório para consultar séries de vazão.');
    if (!params.codigoEstacao) throw new Error('Código da estação é obrigatório.');
    if (!params.dataBusca) throw new Error('Data de busca é obrigatória.');
    
    const codigos = Array.isArray(params.codigoEstacao) 
      ? params.codigoEstacao.join(',')
      : params.codigoEstacao;
    
    const search: Record<string, string> = {
      'Codigos_Estacoes': codigos,
      'Tipo Filtro Data': params.tipoFiltroData ?? 'DATA_LEITURA',
      'Data de Busca': params.dataBusca,
      'Range Intervalo de busca': params.rangeIntervalo ?? 'DIAS_30',
    };

    try {
      console.log('[ANA Vazão] GET /EstacoesTelemetricas/SerieTelemetricaVazao/v1 params =', search);
      const cleanToken = token.replace(/[\r\n\t]/g, '').trim();
      const resp = await this.http.get('/EstacoesTelemetricas/SerieTelemetricaVazao/v1', {
        headers: { Authorization: `Bearer ${cleanToken}`, Accept: 'application/json, text/plain, */*' },
        params: search,
        validateStatus: (s) => s >= 200 && s < 500,
      });
      console.log('[ANA Vazão] status =', resp.status);
      if (resp.status >= 400) {
        const msg = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);
        throw new Error(`Falha ao obter série de vazão (${resp.status}): ${msg}`);
      }
      const arr = normalizeItemsArray(resp.data);
      console.log('[ANA Vazão] items count =', Array.isArray(arr) ? arr.length : 0);
      return arr;
    } catch (e) {
      console.error('[ANA Vazão] request failed:', (e as any)?.message || e);
      throw e;
    }
  }

  /**
   * Busca séries telemétricas de nível (cota)
   * Endpoint: /EstacoesTelemetricas/SerieTelemetricaNivel/v1
   * 
   * Parâmetros esperados pela API da ANA:
   * - Codigos_Estacoes: código(s) da(s) estação(ões) separados por vírgula
   * - Tipo Filtro Data: tipo do filtro (ex: DATA_ULTIMA_ATUALIZACAO)
   * - Range Intervalo de busca: intervalo (DIAS_30, MINUTO_5, HORA_1, etc.)
   */
  async getSerieTelemetricaNivel(
    token: string,
    params: {
      codigoEstacao: string | string[]
      tipoFiltroData?: string
      dataBusca: string
      rangeIntervalo?: string
    }
  ): Promise<unknown[]> {
    if (!token) throw new Error('Token é obrigatório para consultar séries de nível.');
    if (!params.codigoEstacao) throw new Error('Código da estação é obrigatório.');
    if (!params.dataBusca) throw new Error('Data de busca é obrigatória.');
    
    const codigos = Array.isArray(params.codigoEstacao) 
      ? params.codigoEstacao.join(',')
      : params.codigoEstacao;
    
    const search: Record<string, string> = {
      'Codigos_Estacoes': codigos,
      'Tipo Filtro Data': params.tipoFiltroData ?? 'DATA_LEITURA',
      'Data de Busca': params.dataBusca,
      'Range Intervalo de busca': params.rangeIntervalo ?? 'DIAS_30',
    };

    try {
      console.log('[ANA Nível] GET /EstacoesTelemetricas/SerieTelemetricaNivel/v1 params =', search);
      const cleanToken = token.replace(/[\r\n\t]/g, '').trim();
      const resp = await this.http.get('/EstacoesTelemetricas/SerieTelemetricaNivel/v1', {
        headers: { Authorization: `Bearer ${cleanToken}`, Accept: 'application/json, text/plain, */*' },
        params: search,
        validateStatus: (s) => s >= 200 && s < 500,
      });
      console.log('[ANA Nível] status =', resp.status);
      if (resp.status >= 400) {
        const msg = typeof resp.data === 'string' ? resp.data : JSON.stringify(resp.data);
        throw new Error(`Falha ao obter série de nível (${resp.status}): ${msg}`);
      }
      const arr = normalizeItemsArray(resp.data);
      console.log('[ANA Nível] items count =', Array.isArray(arr) ? arr.length : 0);
      return arr;
    } catch (e) {
      console.error('[ANA Nível] request failed:', (e as any)?.message || e);
      throw e;
    }
  }
}

function normalizeToken(data: unknown, authHeader?: string): string | null {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;

    const items = obj['items'];
    if (items && typeof items === 'object') {
      const it = items as Record<string, unknown>;
      const tokenAuth = findStringByKeys(it, [
        'tokenautenticacao',
        'tokenAutenticacao',
        'token_autenticacao',
      ]);
      if (tokenAuth) return ensureBearer(tokenAuth);

      const tokenPlain = findStringByKeys(it, ['token']);
      if (tokenPlain) return ensureBearer(tokenPlain);
    }

    const flat = findStringByKeys(obj, [
      'token',
      'access_token',
      'accessToken',
      'bearerToken',
    ]);
    if (flat) return ensureBearer(flat);
  }

  if (typeof data === 'string') {
    if (data.toLowerCase().includes('bearer')) return extractBearer(data);
    return data.trim();
  }

  if (typeof authHeader === 'string') {
    return extractBearer(authHeader);
  }
  return null;
}

function extractBearer(value: string): string | null {
  const m = value.match(/Bearer\s+(.+)/i);
  return m ? m[1].trim() : null;
}

function ensureBearer(value: string): string {
  return value.trim();
}

function findStringByKeys(obj: Record<string, unknown>, keysLower: string[]): string | null {
  const lowerSet = new Set(keysLower.map((k) => k.toLowerCase()));
  for (const [k, v] of Object.entries(obj)) {
    if (!lowerSet.has(k.toLowerCase())) continue;
    if (typeof v === 'string' && v.trim().length > 0) return v.trim();
  }
  return null;
}

function normalizeItemsArray(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    const items = obj['items'];
    if (Array.isArray(items)) return items;
    if (items && typeof items === 'object') return [items as Record<string, unknown>];
  }
  return [];
}

