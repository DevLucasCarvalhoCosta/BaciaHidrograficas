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


  async getHidrosatInventarioEstacoes(token: string): Promise<unknown[]> {
    if (!token) throw new Error('Token é obrigatório para consultar o inventário Hidrosat.');
    const resp = await this.http.get('/EstacoesTelemetricas/HidrosatInventarioEstacoes/v1', {
      headers: {
        Authorization: `Bearer ${token}`,
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
      const resp = await this.http.get('/EstacoesTelemetricas/HidroInventarioEstacoes/v1', {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json, text/plain, */*' },
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

