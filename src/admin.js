/**
 * 管理后台 API 模块
 */

import {
  errorResponse,
  jsonResponse,
  isKvStorageEnabled,
  toAsiaShanghaiISOString,
  toAsiaShanghaiHourMinute
} from './utils';
import {
  addApiKey, removeApiKey, listApiKeys, importApiKeys,
  getAllKeyStats, disableApiKey, enableApiKey, healthCheckAll,
  hashApiKey, countApiKeys,
  getNextApiKey, markApiKeyFailed
} from './keyManager';
import { createClientToken, listClientTokens, deleteClientToken } from './auth';
import {
  getCachedStats, setCachedStats, invalidateCache, clearAllCache, getCacheStats
} from './cache';
import { isRedisEnabled, redisGet, redisScanPattern } from './redis';
import {
  isPostgresEnabled,
  pgImportApiAccountEntries,
  pgGetGlobalStats,
  pgListModelStats,
  pgGetModelHourlyAggregated,
  pgGetRecentTopModels,
  pgListUsers,
  pgCountUsers,
  pgUpdateUserMeta,
  pgGetUserById,
  pgUpdateClientTokenExpiry,
  pgListUserSignins
} from './postgres';
import { normalizeProvider, getProviderConfig, buildUpstreamHeaders, getDefaultProbeModel } from './providers';

const USER_KEY_DEFAULT_TTL = 3 * 24 * 60 * 60;

function sanitizeAdminUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    isActive: user.is_active !== false,
    defaultProvider: user.default_provider,
    keyToken: user.key_token,
    keyProvider: user.key_provider,
    keyExpiresAt: user.key_expires_at,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    lastLoginAt: user.last_login_at,
    lastSignInAt: user.last_sign_in_at
  };
}

export async function handleAdmin(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const providerParam = normalizeProvider(url.searchParams.get('provider'));
  const resolveProvider = (body) => body && body.provider ? normalizeProvider(body.provider) : providerParam;

  // 公开统计 API（无需鉴权）
  if (path === '/admin/public-stats' && request.method === 'GET') {
    const stats = await getPublicStats(env, providerParam);
    return jsonResponse(stats);
  }

  // 验证管理员权限
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || authHeader !== `Bearer ${env.ADMIN_TOKEN}`) {
    return errorResponse('Unauthorized', 401);
  }

  // 路由分发
  if (path === '/admin/verify' && request.method === 'GET') {
    return jsonResponse({ success: true });

  } else if (path === '/admin/users' && request.method === 'GET') {
    if (!isPostgresEnabled(env)) {
      return errorResponse('PostgreSQL 支持未启用，无法使用用户管理功能', 400);
    }

    const page = Math.max(1, parseInt(url.searchParams.get('page')) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize')) || 20));
    const search = (url.searchParams.get('search') || '').trim();

    const users = await pgListUsers(env, { page, pageSize, search: search || undefined });
    const total = await pgCountUsers(env, search || undefined);

    return jsonResponse({
      page,
      pageSize,
      total,
      users: users.map(sanitizeAdminUser)
    });

  } else if (path.startsWith('/admin/users/')) {
    if (!isPostgresEnabled(env)) {
      return errorResponse('PostgreSQL 支持未启用，无法使用用户管理功能', 400);
    }

    const base = '/admin/users/';
    const remainder = path.substring(base.length);
    if (!remainder) {
      return errorResponse('用户 ID 缺失', 400);
    }

    const [userId, action] = remainder.split('/');

    if (!userId) {
      return errorResponse('用户 ID 缺失', 400);
    }

    if (!action && request.method === 'GET') {
      const user = await pgGetUserById(env, userId);
      if (!user) {
        return errorResponse('用户不存在', 404);
      }
      return jsonResponse({ user: sanitizeAdminUser(user) });
    }

    if (!action && request.method === 'PATCH') {
      const body = await request.json();
      const updates = {};

      if (body.role) {
        updates.role = body.role;
      }
      if (body.isActive !== undefined) {
        updates.is_active = Boolean(body.isActive);
      }
      if (body.defaultProvider) {
        updates.default_provider = normalizeProvider(body.defaultProvider);
      }

      if (Object.keys(updates).length === 0) {
        return errorResponse('未提供需要更新的字段', 400);
      }

      updates.updated_at = new Date().toISOString();

      await pgUpdateUserMeta(env, userId, updates);
      const updated = await pgGetUserById(env, userId);
      if (!updated) {
        return errorResponse('用户不存在', 404);
      }
      return jsonResponse({ user: sanitizeAdminUser(updated) });
    }

    if (action === 'reset-key' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const ttlSeconds = Number(body.ttlSeconds) > 0 ? Number(body.ttlSeconds) : USER_KEY_DEFAULT_TTL;
      const providerInput = body.provider;

      const user = await pgGetUserById(env, userId);
      if (!user) {
        return errorResponse('用户不存在', 404);
      }

      const provider = normalizeProvider(providerInput || user.key_provider || user.default_provider || 'ollama');

      if (user.key_token) {
        await deleteClientToken(env, user.key_token, normalizeProvider(user.key_provider || provider));
      }

      const tokenInfo = await createClientToken(env, body.name || `用户 ${user.email} 重置`, ttlSeconds, provider);

      await pgUpdateUserMeta(env, userId, {
        key_token: tokenInfo.token,
        key_provider: provider,
        key_expires_at: tokenInfo.expiresAt,
        updated_at: new Date().toISOString()
      });

      const refreshed = await pgGetUserById(env, userId);
      return jsonResponse({
        success: true,
        user: sanitizeAdminUser(refreshed),
        token: tokenInfo
      });
    }

    if (action === 'extend-key' && request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      const days = Number(body.days) > 0 ? Number(body.days) : 1;

      const user = await pgGetUserById(env, userId);
      if (!user) {
        return errorResponse('用户不存在', 404);
      }

      if (!user.key_token) {
        return errorResponse('用户尚未拥有访问凭证，请先重置密钥', 400);
      }

      const provider = normalizeProvider(user.key_provider || user.default_provider || 'ollama');
      const baseTime = Math.max(Date.now(), user.key_expires_at ? new Date(user.key_expires_at).getTime() : Date.now());
      const newExpiresAt = new Date(baseTime + days * 24 * 60 * 60 * 1000).toISOString();

      await pgUpdateClientTokenExpiry(env, user.key_token, provider, newExpiresAt);
      await pgUpdateUserMeta(env, userId, {
        key_expires_at: newExpiresAt,
        updated_at: new Date().toISOString()
      });

      const refreshed = await pgGetUserById(env, userId);
      return jsonResponse({ success: true, user: sanitizeAdminUser(refreshed) });
    }

    if (action === 'signins' && request.method === 'GET') {
      const limit = Math.min(90, Math.max(1, parseInt(url.searchParams.get('limit')) || 10));
      const signins = await pgListUserSignins(env, userId, limit);
      return jsonResponse({ signins });
    }

    return errorResponse('Not Found', 404);

  } else if (path === '/admin/api-keys' && request.method === 'GET') {
    // 获取 API Key 列表（优化版：支持分页，避免一次加载所有）
    const url = new URL(request.url);
    const fetchAll = url.searchParams.get('fetch') === 'all';
    const page = Math.max(1, parseInt(url.searchParams.get('page')) || 1);
    const pageSizeParam = parseInt(url.searchParams.get('pageSize'));
    const pageSize = fetchAll ? Math.max(1, Number.MAX_SAFE_INTEGER) : (Number.isFinite(pageSizeParam) ? Math.min(200, Math.max(1, pageSizeParam)) : 50);
    const status = (url.searchParams.get('status') || 'all').toLowerCase();
    const search = (url.searchParams.get('search') || '').trim();

    const result = await listApiKeysPaginated(env, {
      page,
      pageSize,
      provider: providerParam,
      status,
      search,
      fetchAll
    });
    return jsonResponse(result);

  } else if (path === '/admin/api-keys' && request.method === 'POST') {
    // 添加 API Key
    const body = await request.json();
    const provider = resolveProvider(body);
    const { username, api_key, apiKey, ttl } = body;
    const key = api_key || apiKey;

    if (!key) {
      return errorResponse('API Key is required', 400);
    }

    const added = await addApiKey(env, key, username, ttl, provider);
    return jsonResponse({ success: added, message: added ? 'Added' : 'Already exists' });

  } else if (path === '/admin/api-keys' && request.method === 'DELETE') {
    // 删除单个或批量删除 API Keys
    const body = await request.json();
    const provider = resolveProvider(body);

    if (body.apiKeys && Array.isArray(body.apiKeys)) {
      // 批量删除
      const result = await batchRemoveApiKeys(env, body.apiKeys, provider);
      return jsonResponse(result);
    } else if (body.apiKey) {
      // 单个删除
      const removed = await removeApiKey(env, body.apiKey, provider);
      return jsonResponse({ success: removed });
    } else {
      return errorResponse('Missing apiKey or apiKeys', 400);
    }

  } else if (path === '/admin/api-keys/import' && request.method === 'POST') {
    // 批量导入 API Keys
    const body = await request.json();
    const provider = resolveProvider(body);
    const { keys } = body;
    const result = await importApiKeys(env, keys, provider);
    return jsonResponse(result);

  } else if (path === '/admin/api-keys/import-from-txt' && request.method === 'POST') {
    // 从 ollama.txt 格式导入
    const body = await request.json();
    const provider = resolveProvider(body);
    const keys = parseOllamaTxt(body.content);
    const result = await importApiKeys(env, keys, provider);
    return jsonResponse(result);

  } else if (path === '/admin/api-keys/import-with-validation' && request.method === 'POST') {
    // 逐行导入并验证 API Keys
    const body = await request.json();
    const provider = resolveProvider(body);
    const result = await importAndValidateKeys(env, body.content, provider);
    return jsonResponse(result);

  } else if (path === '/admin/tokens' && request.method === 'GET') {
    // 获取客户端 Token 列表
    const tokens = await listClientTokens(env, providerParam);
    return jsonResponse({ tokens });

  } else if (path === '/admin/tokens' && request.method === 'POST') {
    // 创建客户端 Token
    const body = await request.json();
    const provider = resolveProvider(body);
    const { name, expiresIn } = body;
    const token = await createClientToken(env, name, expiresIn, provider);
    return jsonResponse(token);

  } else if (path === '/admin/tokens' && request.method === 'DELETE') {
    // 删除客户端 Token
    const body = await request.json();
    const provider = resolveProvider(body);
    await deleteClientToken(env, body.token, provider);
    return jsonResponse({ success: true });

  } else if (path === '/admin/stats' && request.method === 'GET') {
    // 获取统计信息
    const stats = await getStats(env, providerParam);
    return jsonResponse(stats);

  } else if (path === '/admin/keys/stats' && request.method === 'GET') {
    // 获取所有 API Key 的详细统计
    const keyStats = await getAllKeyStats(env, providerParam);
    return jsonResponse({ stats: keyStats });

  } else if (path === '/admin/keys/enable' && request.method === 'POST') {
    // 手动启用 API Key
    const body = await request.json();
    const provider = resolveProvider(body);
    await enableApiKey(env, body.apiKey, provider);
    return jsonResponse({ success: true, message: 'API Key enabled' });

  } else if (path === '/admin/keys/disable' && request.method === 'POST') {
    // 手动禁用 API Key
    const body = await request.json();
    const provider = resolveProvider(body);
    await disableApiKey(env, body.apiKey, body.duration || 3600, provider);
    return jsonResponse({ success: true, message: 'API Key disabled' });

  } else if (path === '/admin/keys/health-check' && request.method === 'POST') {
    // 批量健康检查
    const body = await request.json().catch(() => ({}));
    const provider = resolveProvider(body);
    const results = await healthCheckAll(env, provider);
    return jsonResponse({ results });

  } else if (path === '/admin/cache/stats' && request.method === 'GET') {
    // 获取缓存统计
    const stats = await getCacheStats(env);
    return jsonResponse(stats);

  } else if (path === '/admin/cache/clear' && request.method === 'POST') {
    // 清除所有缓存
    const body = await request.json();
    const provider = resolveProvider(body);
    const { pattern, scope } = body;
    if (pattern) {
      await invalidateCache(env, pattern, provider);
      return jsonResponse({ success: true, message: `清除缓存: ${pattern}*` });
    } else {
      await clearAllCache(env, scope === 'all' ? 'all' : provider);
      return jsonResponse({ success: true, message: scope === 'all' ? '已清除所有缓存' : '已清除指定提供方缓存' });
    }

  } else if (path === '/admin/import' && request.method === 'POST') {
    // 批量导入账号（支持多种格式）
    const body = await request.json();
    const provider = resolveProvider(body);
    const result = await importAccountsFlexible(env, body.accounts, provider);
    return jsonResponse(result);

  } else if (path === '/admin/verify-key' && request.method === 'POST') {
    // 验证单个 API Key
    const body = await request.json();
    const provider = resolveProvider(body);
    const result = await verifyApiKey(env, body.apiKey, provider);
    return jsonResponse(result);

  } else if (path.startsWith('/admin/api-keys/')) {
    // 删除单个 API Key (DELETE /admin/api-keys/{key})
    const apiKey = decodeURIComponent(path.substring('/admin/api-keys/'.length));
    if (request.method === 'DELETE') {
      await removeApiKey(env, apiKey, providerParam);
      return jsonResponse({ success: true });
    }

  } else if (path.startsWith('/admin/client-tokens/')) {
    // 删除单个客户端 Token (DELETE /admin/client-tokens/{token})
    const token = decodeURIComponent(path.substring('/admin/client-tokens/'.length));
    if (request.method === 'DELETE') {
      await deleteClientToken(env, token, providerParam);
      return jsonResponse({ success: true });
    }

  } else if (path === '/admin/client-tokens' && request.method === 'GET') {
    // 获取客户端 Token 列表
    const tokens = await listClientTokens(env, providerParam);
    return jsonResponse({ client_tokens: tokens });

  } else if (path === '/admin/client-tokens' && request.method === 'POST') {
    // 生成新的客户端 Token
    const body = await request.json();
    const provider = resolveProvider(body);
    const token = await createClientToken(env, body.name || '未命名', body.ttl, provider);
    return jsonResponse({ token: token.token, name: token.name });

  } else {
    return errorResponse('Not Found', 404);
  }
}

// 解析 ollama.txt 格式
function parseOllamaTxt(content) {
  const lines = content.split('\n');
  const keys = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    // 格式: email----password----session----api_key 或 email----password----session;aid=xxx----api_key
    const parts = line.split('----');
    if (parts.length >= 4) {
      const apiKey = parts[3].trim();
      if (apiKey) {
        keys.push(apiKey);
      }
    }
  }

  return keys;
}

// 获取统计信息（含全局请求统计，带缓存）
async function getStats(env, provider = 'ollama') {
  const normalized = normalizeProvider(provider);

  const cached = await getCachedStats(env, 'global', normalized);
  if (cached) {
    return cached;
  }

  const usePostgres = isPostgresEnabled(env);

  const clientTokens = await listClientTokens(env, normalized);
  const totalApiKeys = await countApiKeys(env, normalized);
  const apiKeys = await listApiKeys(env, normalized);

  const totalClientTokens = Array.isArray(clientTokens) ? clientTokens.length : 0;
  const failedKeys = Array.isArray(apiKeys)
    ? apiKeys.filter(item => item.status && item.status !== 'active').length
    : 0;

  let globalStats = null;
  if (usePostgres) {
    globalStats = await pgGetGlobalStats(env, normalized);
    if (globalStats) {
      globalStats = {
        totalRequests: globalStats.totalRequests || 0,
        successCount: globalStats.successCount || 0,
        failureCount: globalStats.failureCount || 0
      };
    }
  }

  if (!globalStats) {
    const kvKey = normalized === 'ollama' ? 'global_stats' : `${normalized}:global_stats`;
    const globalStatsData = await env.API_KEYS.get(kvKey);
    globalStats = globalStatsData ? JSON.parse(globalStatsData) : {
      totalRequests: 0,
      successCount: 0,
      failureCount: 0
    };
  }

  const successRate = globalStats.totalRequests > 0
    ? ((globalStats.successCount / globalStats.totalRequests) * 100).toFixed(2)
    : '0.00';

  const normalizedFailed = Math.min(failedKeys, totalApiKeys);
  const activeKeys = Math.max(totalApiKeys - normalizedFailed, 0);

  const stats = {
    total_api_keys: totalApiKeys,
    active_keys: activeKeys,
    failed_keys: normalizedFailed,
    total_client_tokens: totalClientTokens,
    total_requests: globalStats.totalRequests,
    success_count: globalStats.successCount,
    failure_count: globalStats.failureCount,
    success_rate: successRate,
    storage: usePostgres ? 'postgres+kv' : 'kv',
    timestamp: new Date().toISOString()
  };

  await setCachedStats(env, 'global', stats, normalized);

  return stats;
}

// 分页获取 API Keys（优化版 - 快速版本，不查询每个key的详细状态）
async function listApiKeysPaginated(env, {
  page = 1,
  pageSize = 50,
  provider = 'ollama',
  status = 'all',
  search = '',
  fetchAll = false
} = {}) {
  const normalized = normalizeProvider(provider);
  const allKeys = await listApiKeys(env, normalized);

  let filtered = Array.isArray(allKeys) ? allKeys : [];
  const searchTerm = search ? search.toLowerCase() : '';

  if (status && status !== 'all') {
    filtered = filtered.filter(key => (key.status || '').toLowerCase() === status);
  }

  if (searchTerm) {
    filtered = filtered.filter(key => {
      const username = (key.username || '').toLowerCase();
      const apiKey = (key.api_key || '').toLowerCase();
      return username.includes(searchTerm) || apiKey.includes(searchTerm);
    });
  }

  const total = filtered.length;

  if (fetchAll) {
    return {
      api_keys: filtered,
      total,
      page: 1,
      pageSize: total,
      totalPages: 1
    };
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageKeys = filtered.slice(startIndex, endIndex);

  return {
    api_keys: pageKeys,
    total,
    page: currentPage,
    pageSize,
    totalPages
  };
}

// 验证单个 API Key
async function validateApiKey(env, apiKey, provider = 'ollama') {
  const normalized = normalizeProvider(provider);
  const config = getProviderConfig(normalized);
  const defaultModel = getDefaultProbeModel(normalized);
  const headers = buildUpstreamHeaders(normalized, apiKey, env, {
    Accept: '*/*',
    'Cache-Control': 'no-cache'
  });

  try {
    const response = await fetch(config.upstream.chatCompletions, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: defaultModel,
        messages: [
          { role: 'system', content: 'test' },
          { role: 'user', content: 'hi' }
        ],
        stream: true,
        stream_options: { include_usage: true }
      })
    });

    if (response.ok) {
      const modelInfo = await getModelInfo(env, apiKey, normalized);
      return {
        valid: true,
        status: response.status,
        category: modelInfo.category || 'general',
        model: modelInfo.model || defaultModel
      };
    }

    return {
      valid: false,
      status: response.status,
      error: await response.text()
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

// 获取模型信息用于分类
async function getModelInfo(env, apiKey, provider = 'ollama') {
  const normalized = normalizeProvider(provider);
  const config = getProviderConfig(normalized);
  const headers = buildUpstreamHeaders(normalized, apiKey, env);
  delete headers['Content-Type'];

  try {
    const response = await fetch(config.upstream.models, { headers });

    if (response.ok) {
      const data = await response.json();
      const models = Array.isArray(data.models) ? data.models : (Array.isArray(data.data) ? data.data : []);
      if (models.length > 0) {
        const first = models[0].name || models[0].model || models[0].id;
        const lower = first ? first.toLowerCase() : '';
        let category = 'general';

        if (lower.includes('kimi')) category = 'kimi';
        else if (lower.includes('llama')) category = 'llama';
        else if (lower.includes('qwen')) category = 'qwen';

        return { category, model: first || 'unknown' };
      }
    }
  } catch (error) {
    // ignore
  }

  return { category: 'general', model: 'unknown' };
}

// 导入并验证 API Keys
async function importAndValidateKeys(env, content, provider = 'ollama') {
  const normalized = normalizeProvider(provider);
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);

  const results = {
    total: lines.length,
    valid: [],
    invalid: [],
    categories: {}
  };

  for (const apiKey of lines) {
    const validation = await validateApiKey(env, apiKey, normalized);

    if (validation.valid) {
      await addApiKey(env, apiKey, null, null, normalized);

      const category = validation.category || 'general';
      const keyInfo = {
        key: apiKey.substring(0, 20) + '...',
        fullKey: apiKey,
        category,
        model: validation.model,
        addedAt: new Date().toISOString()
      };

      results.valid.push(keyInfo);

      if (!results.categories[category]) {
        results.categories[category] = [];
      }
      results.categories[category].push(keyInfo);

      const prefix = normalized === 'ollama' ? '' : `${normalized}:`;
      await env.API_KEYS.put(`${prefix}key_category:${apiKey}`, JSON.stringify({
        category,
        model: validation.model,
        verifiedAt: new Date().toISOString()
      }));

    } else {
      results.invalid.push({
        key: apiKey.substring(0, 20) + '...',
        error: validation.error || `HTTP ${validation.status}`
      });
    }
  }

  return results;
}

/**
 * 验证单个 API Key 并更新状态
 */
async function verifyApiKey(env, apiKey, provider = 'ollama') {
  const normalized = normalizeProvider(provider);
  try {
    const validation = await validateApiKey(env, apiKey, normalized);

    if (isPostgresEnabled(env)) {
      if (validation.valid) {
        await enableApiKey(env, apiKey, normalized);
      } else {
        await disableApiKey(env, apiKey, 0, normalized);
        await markApiKeyFailed(env, apiKey, normalized);
      }
    } else {
      const keyHash = await hashApiKey(apiKey);
      const prefix = normalized === 'ollama' ? '' : `${normalized}:`;
      const metadataKey = `${prefix}key_metadata:${keyHash}`;
      const metadata = await env.API_KEYS.get(metadataKey);
      if (metadata) {
        const meta = JSON.parse(metadata);
        meta.status = validation.valid ? 'active' : 'failed';
        meta.lastVerified = new Date().toISOString();
        if (validation.valid) {
          delete meta.failureReason;
        } else {
          meta.failureReason = validation.error || `HTTP ${validation.status || 500}`;
        }
        await env.API_KEYS.put(metadataKey, JSON.stringify(meta));
      }

      if (!validation.valid) {
        await markApiKeyFailed(env, apiKey, normalized);
      }
    }

    return {
      valid: validation.valid,
      status: validation.status || (validation.valid ? 200 : 500),
      error: validation.valid ? undefined : validation.error,
      apiKey: apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 8),
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    if (!isPostgresEnabled(env)) {
      const keyHash = await hashApiKey(apiKey);
      const prefix = normalized === 'ollama' ? '' : `${normalized}:`;
      const metadataKey = `${prefix}key_metadata:${keyHash}`;
      const metadata = await env.API_KEYS.get(metadataKey);
      if (metadata) {
        const meta = JSON.parse(metadata);
        meta.status = 'failed';
        meta.lastVerified = new Date().toISOString();
        meta.failureReason = error.message;
        await env.API_KEYS.put(metadataKey, JSON.stringify(meta));
      }
    } else {
      await markApiKeyFailed(env, apiKey, normalized);
    }

    return {
      valid: false,
      error: error.message,
      apiKey: apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 8),
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 灵活导入账号 - 支持多种格式
 * 格式1: 每行一个完整的 session cookie (自动生成用户名)
 * 格式2: email----password----session----aid----apikey (解析完整信息)
 */
async function importAccountsFlexible(env, accounts) {
  if (!Array.isArray(accounts) || accounts.length === 0) {
    return { success: false, error: '没有提供有效的账号数据', imported: 0 };
  }

  const MAX_DETAILS = 50;
  const details = [];
  const parseErrors = [];
  const parsedEntries = [];

  const pushDetail = (detail) => {
    if (details.length < MAX_DETAILS) {
      details.push(detail);
    }
  };

  for (const account of accounts) {
    try {
      let username;
      let apiKey;

      if (typeof account === 'string') {
        const trimmed = account.trim();

        if (trimmed.includes('----')) {
          const parts = trimmed.split('----').map(part => part.trim());
          if (parts.length >= 4) {
            username = parts[0] || `user_${Math.random().toString(36).slice(2, 7)}`;
            apiKey = parts[parts.length - 1];
          } else {
            parseErrors.push({ error: '格式错误，分段不足', line: trimmed.substring(0, 80) });
            pushDetail({ error: '格式错误，分段不足', line: trimmed.substring(0, 80) });
            continue;
          }
        } else {
          username = `user_${Math.random().toString(36).slice(2, 8)}`;
          apiKey = trimmed;
        }
      } else if (typeof account === 'object' && account !== null) {
        if (account.api_key) {
          apiKey = account.api_key;
          username = account.username || account.email || `user_${Math.random().toString(36).slice(2, 8)}`;
        } else {
          parseErrors.push({ error: '缺少 api_key 字段', data: JSON.stringify(account).substring(0, 80) });
          pushDetail({ error: '缺少 api_key 字段', data: JSON.stringify(account).substring(0, 80) });
          continue;
        }
      } else {
        parseErrors.push({ error: '不支持的格式', data: String(account).substring(0, 80) });
        pushDetail({ error: '不支持的格式', data: String(account).substring(0, 80) });
        continue;
      }

      if (!apiKey) {
        parseErrors.push({ error: '缺少 API Key', data: String(account).substring(0, 80) });
        pushDetail({ error: '缺少 API Key', data: String(account).substring(0, 80) });
        continue;
      }

      parsedEntries.push({ apiKey: apiKey.trim(), username: username || 'N/A' });
    } catch (error) {
      parseErrors.push({ error: error.message, data: JSON.stringify(account).substring(0, 80) });
      pushDetail({ error: error.message, data: JSON.stringify(account).substring(0, 80) });
    }
  }

  if (parsedEntries.length === 0) {
    return {
      success: false,
      imported: 0,
      failed: accounts.length,
      total: accounts.length,
      details
    };
  }

  if (isPostgresEnabled(env)) {
    const pgResult = await pgImportApiAccountEntries(env, parsedEntries);

    if (pgResult.duplicates > 0) {
      pushDetail({ info: `跳过重复 ${pgResult.duplicates} 条` });
    }

    return {
      success: true,
      imported: pgResult.added,
      failed: parseErrors.length + (pgResult.skipped || 0),
      total: accounts.length,
      duplicates: pgResult.duplicates,
      skipped: pgResult.skipped,
      details
    };
  }

  const uniqueMap = new Map();
  let duplicates = 0;

  for (const entry of parsedEntries) {
    if (uniqueMap.has(entry.apiKey)) {
      duplicates++;
      pushDetail({ info: `重复跳过: ${entry.apiKey.substring(0, 20)}...` });
      continue;
    }
    uniqueMap.set(entry.apiKey, entry.username);
  }

  let imported = 0;
  let failed = parseErrors.length + duplicates;

  for (const [apiKey, username] of uniqueMap.entries()) {
    try {
      const success = await addApiKey(env, apiKey, username);
      if (success) {
        imported++;
        pushDetail({ success: true, username, apiKey: `${apiKey.substring(0, 20)}...` });
      } else {
        failed++;
        pushDetail({ success: false, username, apiKey: `${apiKey.substring(0, 20)}...`, error: '添加失败（已存在或写入失败）' });
      }
    } catch (error) {
      failed++;
      pushDetail({ error: error.message, apiKey: `${apiKey.substring(0, 20)}...` });
    }
  }

  return {
    success: true,
    imported,
    failed,
    total: accounts.length,
    duplicates,
    details
  };
}

/**
 * 批量删除 API Keys
 */
async function batchRemoveApiKeys(env, apiKeys) {
  if (!Array.isArray(apiKeys) || apiKeys.length === 0) {
    return { success: false, error: '没有提供有效的 API Keys', deleted: 0 };
  }

  let deleted = 0;
  let failed = 0;

  for (const apiKey of apiKeys) {
    try {
      const removed = await removeApiKey(env, apiKey);
      if (removed) {
        deleted++;
      } else {
        failed++;
      }
    } catch (error) {
      failed++;
    }
  }

  return {
    success: true,
    deleted,
    failed,
    total: apiKeys.length
  };
}

/**
 * 获取公开统计数据（供前端图表使用，带缓存）
 */
async function getPublicStats(env, provider = 'ollama') {
  const normalized = normalizeProvider(provider);
  try {
    // 尝试从缓存获取
    const cached = await getCachedStats(env, 'public', normalized);
    if (cached) {
      return cached;
    }

    const usePostgres = isPostgresEnabled(env);
    const useRedis = isRedisEnabled(env);

    let globalStats = {
      totalRequests: 0,
      successCount: 0,
      failureCount: 0,
      lastUpdated: null
    };

    if (usePostgres) {
      const pgStats = await pgGetGlobalStats(env, normalized);
      if (pgStats) {
        globalStats = {
          totalRequests: pgStats.totalRequests,
          successCount: pgStats.successCount,
          failureCount: pgStats.failureCount,
          lastUpdated: pgStats.updatedAt
        };
      } else {
        console.warn('Supabase global stats unavailable, falling back to KV');
      }
    }

    if (!usePostgres || (globalStats.totalRequests === 0 && globalStats.successCount === 0 && globalStats.failureCount === 0 && !globalStats.lastUpdated)) {
      const kvKey = normalized === 'ollama' ? 'global_stats' : `${normalized}:global_stats`;
      const globalStatsData = await env.API_KEYS.get(kvKey);
      if (globalStatsData) {
        const kvStats = JSON.parse(globalStatsData);
        globalStats = {
          totalRequests: kvStats.totalRequests || 0,
          successCount: kvStats.successCount || 0,
          failureCount: kvStats.failureCount || 0,
          lastUpdated: kvStats.lastUpdated || null
        };
      }
    }

    const totalApiKeys = await countApiKeys(env, normalized);
    const apiKeyList = await listApiKeys(env, normalized);
    const failedKeys = Array.isArray(apiKeyList)
      ? apiKeyList.filter(item => item.status && item.status !== 'active').length
      : 0;
    const activeKeys = Math.max(totalApiKeys - failedKeys, 0);

    // 获取所有模型统计
    const modelAccumulator = new Map();

    const addModelStats = (item) => {
      if (!item || !item.model) {
        return;
      }

      const key = item.model;
      const record = modelAccumulator.get(key) || {
        model: key,
        totalRequests: 0,
        successCount: 0,
        failureCount: 0,
        lastUsed: null
      };

      if (typeof item.totalRequests === 'number') {
        record.totalRequests += item.totalRequests;
      } else if (typeof item.requests === 'number') {
        record.totalRequests += item.requests;
      }

      if (typeof item.successCount === 'number') {
        record.successCount += item.successCount;
      } else if (typeof item.success === 'number') {
        record.successCount += item.success;
      }

      if (typeof item.failureCount === 'number') {
        record.failureCount += item.failureCount;
      } else if (typeof item.failure === 'number') {
        record.failureCount += item.failure;
      }

      if (item.lastUsed) {
        record.lastUsed = item.lastUsed;
      }

      modelAccumulator.set(key, record);
    };

    if (useRedis) {
      try {
        const redisPattern = normalized === 'ollama' ? 'model_stats:*' : `${normalized}:model_stats:*`;
        const redisKeys = await redisScanPattern(env, redisPattern);
        for (const key of redisKeys) {
          const raw = await redisGet(env, key);
          if (raw) {
            try {
              addModelStats(JSON.parse(raw));
            } catch (error) {
              console.error('解析 Redis 模型统计失败:', error);
            }
          }
        }
      } catch (error) {
        console.warn('Redis 模型统计读取失败:', error);
      }
    }

    if (usePostgres) {
      try {
        const pgModels = await pgListModelStats(env, 10, normalized);
        pgModels.forEach(row => addModelStats({
          model: row.model,
          totalRequests: row.total_requests || 0,
          successCount: row.success_count || 0,
          failureCount: row.failure_count || 0,
          lastUsed: row.last_used || null
        }));
      } catch (error) {
        console.warn('Postgres 模型统计读取失败:', error);
      }
    }

    if (modelAccumulator.size === 0 && isKvStorageEnabled(env)) {
      const prefix = normalized === 'ollama' ? 'model_stats:' : `${normalized}:model_stats:`;
      const modelStatsList = await env.API_KEYS.list({ prefix });

      for (const item of modelStatsList.keys) {
        const data = await env.API_KEYS.get(item.name);
        if (data) {
          try {
            addModelStats(JSON.parse(data));
          } catch (e) {
            console.error('Failed to parse model stats:', e);
          }
        }
      }
    }

    const models = Array.from(modelAccumulator.values());

    // 按请求数排序，取前10
    const topModels = models
      .sort((a, b) => b.totalRequests - a.totalRequests)
      .slice(0, 10)
      .map(m => ({
        model: m.model,
        requests: m.totalRequests,
        success: m.successCount,
        failure: m.failureCount,
        successRate: m.totalRequests > 0 ? ((m.successCount / m.totalRequests) * 100).toFixed(2) : '0.00'
      }));

    // 获取最近24小时每小时的统计
    let hourlyStats = [];
    if (usePostgres) {
      hourlyStats = await getHourlyStatsFromPostgres(env, 24, normalized);
    }
    if (!hourlyStats.length) {
      hourlyStats = await getHourlyStats(env, 24, normalized);
    }

    // 获取最近24小时的Top3模型
    let recentTopModels = [];
    if (usePostgres) {
      recentTopModels = await getRecentTopModelsFromPostgres(env, 24, 3, normalized);
    }
    if (!recentTopModels.length) {
      recentTopModels = await getRecentTopModels(env, 24, 3, normalized);
    }

    const generatedAt = toAsiaShanghaiISOString(Date.now());
    const lastUpdated = globalStats.lastUpdated ? toAsiaShanghaiISOString(globalStats.lastUpdated) : generatedAt;
    const storageParts = [];
    if (usePostgres) storageParts.push('postgres');
    if (useRedis) storageParts.push('redis');
    if (isKvStorageEnabled(env)) storageParts.push('kv');
    const storage = storageParts.join('+') || 'memory';
    const successRateValue = globalStats.totalRequests > 0
      ? (globalStats.successCount / globalStats.totalRequests * 100)
      : 0;

    const result = {
      global: {
        totalRequests: globalStats.totalRequests,
        successCount: globalStats.successCount,
        failureCount: globalStats.failureCount,
        successRate: successRateValue.toFixed(2),
        lastUpdated,
        totalApiKeys,
        activeKeys,
        failedKeys,
        storage
      },
      topModels: topModels || [],
      recentTopModels: recentTopModels || [],
      hourlyTrend: hourlyStats || [],
      storage,
      meta: {
        totalApiKeys,
        activeKeys,
        failedKeys,
        storage,
        generatedAt,
        successRate: successRateValue
      },
      timestamp: generatedAt
    };

    // 缓存结果
    await setCachedStats(env, 'public', result, normalized);

    return result;
  } catch (error) {
    console.error('getPublicStats error:', error);
    // 返回默认数据，避免前端报错
    const generatedAt = toAsiaShanghaiISOString(Date.now());
    return {
      global: {
        totalRequests: 0,
        successCount: 0,
        failureCount: 0,
        successRate: '0.00',
        lastUpdated: generatedAt,
        totalApiKeys: 0,
        activeKeys: 0,
        failedKeys: 0,
        storage: 'kv'
      },
      topModels: [],
      recentTopModels: [],
      hourlyTrend: Array.from({ length: 24 }, (_, i) => {
        const time = new Date(Date.now() - (23 - i) * 3600000);
        return {
          hour: toAsiaShanghaiHourMinute(time),
          requests: 0,
          success: 0,
          failure: 0
        };
      }),
      meta: {
        totalApiKeys: 0,
        activeKeys: 0,
        failedKeys: 0,
        storage: 'kv',
        generatedAt,
        successRate: 0
      },
      storage: 'kv',
      timestamp: generatedAt
    };
  }
}

/**
 * 获取最近N小时的每小时统计
 */
async function getHourlyStats(env, hours, provider = 'ollama') {
  const normalized = normalizeProvider(provider);
  try {
    const now = new Date();
    const stats = [];

    const hourDataMap = new Map();
    let dataLoaded = false;

    if (isRedisEnabled(env)) {
      try {
        const redisPattern = normalized === 'ollama' ? 'model_hourly:*' : `${normalized}:model_hourly:*`;
        const redisKeys = await redisScanPattern(env, redisPattern);
        if (redisKeys.length > 0) {
          for (const key of redisKeys) {
            try {
              const raw = await redisGet(env, key);
              if (!raw) continue;
              const hourData = JSON.parse(raw);
              const hour = hourData.hour;
              if (!hourDataMap.has(hour)) {
                hourDataMap.set(hour, { requests: 0, success: 0, failure: 0 });
              }
              const existing = hourDataMap.get(hour);
              existing.requests += hourData.requests || 0;
              existing.success += hourData.success || 0;
              existing.failure += hourData.failure || 0;
            } catch (error) {
              console.error('解析 Redis 小时统计失败:', key, error);
            }
          }
          dataLoaded = hourDataMap.size > 0;
        }
      } catch (error) {
        console.warn('Redis 小时统计读取失败:', error);
      }
    }

    if (!dataLoaded && isKvStorageEnabled(env)) {
      const hourlyList = await env.API_KEYS.list({ prefix: normalized === 'ollama' ? 'model_hourly:' : `${normalized}:model_hourly:`, limit: 1000 });

      for (const item of hourlyList.keys) {
        try {
          const data = await env.API_KEYS.get(item.name);
          if (data) {
            const hourData = JSON.parse(data);
            const hour = hourData.hour;

            if (!hourDataMap.has(hour)) {
              hourDataMap.set(hour, { requests: 0, success: 0, failure: 0 });
            }

            const existing = hourDataMap.get(hour);
            existing.requests += hourData.requests || 0;
            existing.success += hourData.success || 0;
            existing.failure += hourData.failure || 0;
          }
        } catch (e) {
          console.error('Failed to parse hourly data:', item.name, e);
        }
      }
      dataLoaded = hourDataMap.size > 0;
    }

    // 生成最近 N 小时的统计
    for (let i = hours - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 3600000);
      const hour = time.toISOString().slice(0, 13);
      const hourData = hourDataMap.get(hour) || { requests: 0, success: 0, failure: 0 };

      const hourLabel = toAsiaShanghaiHourMinute(time) || time.toISOString().slice(11, 16);
      stats.push({
        hour: hourLabel, // HH:mm
        requests: hourData.requests,
        success: hourData.success,
        failure: hourData.failure
      });
    }

    return stats;
  } catch (error) {
    console.error('getHourlyStats error:', error);
    // 返回空数据占位
    return Array.from({ length: hours }, (_, i) => {
      const time = new Date(Date.now() - (hours - 1 - i) * 3600000);
      return {
        hour: toAsiaShanghaiHourMinute(time) || time.toISOString().slice(11, 16),
        requests: 0,
        success: 0,
        failure: 0
      };
    });
  }
}

/**
 * 获取最近N小时的Top N模型
 */
async function getRecentTopModels(env, hours, topN = 3, provider = 'ollama') {
  const normalized = normalizeProvider(provider);
  try {
    const now = new Date();
    const modelMap = new Map();

    const targetHours = new Set();
    for (let i = 0; i < hours; i++) {
      const time = new Date(now.getTime() - i * 3600000);
      targetHours.add(time.toISOString().slice(0, 13));
    }

    let dataLoaded = false;

    if (isRedisEnabled(env)) {
      try {
        const redisPattern = normalized === 'ollama' ? 'model_hourly:*' : `${normalized}:model_hourly:*`;
        const redisKeys = await redisScanPattern(env, redisPattern);
        if (redisKeys.length > 0) {
          for (const key of redisKeys) {
            try {
              const raw = await redisGet(env, key);
              if (!raw) continue;
              const hourData = JSON.parse(raw);
              const hour = hourData.hour;
              if (!targetHours.has(hour)) continue;

              const modelName = hourData.model;
              if (!modelMap.has(modelName)) {
                modelMap.set(modelName, { requests: 0, success: 0, failure: 0 });
              }
              const stats = modelMap.get(modelName);
              stats.requests += hourData.requests || 0;
              stats.success += hourData.success || 0;
              stats.failure += hourData.failure || 0;
            } catch (error) {
              console.error('解析 Redis 热门模型数据失败:', key, error);
            }
          }
          dataLoaded = modelMap.size > 0;
        }
      } catch (error) {
        console.warn('Redis 热门模型数据读取失败:', error);
      }
    }

    if (!dataLoaded && isKvStorageEnabled(env)) {
      const hourlyList = await env.API_KEYS.list({ prefix: normalized === 'ollama' ? 'model_hourly:' : `${normalized}:model_hourly:`, limit: 1000 });

      for (const item of hourlyList.keys) {
        try {
          const data = await env.API_KEYS.get(item.name);
          if (data) {
            const hourData = JSON.parse(data);
            const hour = hourData.hour;

            if (!targetHours.has(hour)) continue;

            const modelName = hourData.model;

            if (!modelMap.has(modelName)) {
              modelMap.set(modelName, { requests: 0, success: 0, failure: 0 });
            }

            const stats = modelMap.get(modelName);
            stats.requests += hourData.requests || 0;
            stats.success += hourData.success || 0;
            stats.failure += hourData.failure || 0;
          }
        } catch (e) {
          console.error('Failed to parse recent model data:', item.name, e);
        }
      }
    }

    // 转换为数组并排序
    const modelsArray = Array.from(modelMap.entries()).map(([model, stats]) => ({
      model,
      requests: stats.requests,
      success: stats.success,
      failure: stats.failure,
      successRate: stats.requests > 0 ? ((stats.success / stats.requests) * 100).toFixed(2) : '0.00'
    }));

    return modelsArray
      .sort((a, b) => b.requests - a.requests)
      .slice(0, topN);
  } catch (error) {
    console.error('getRecentTopModels error:', error);
    return [];
  }
}

async function getHourlyStatsFromPostgres(env, hours, provider = 'ollama') {
  try {
    const rows = await pgGetModelHourlyAggregated(env, { hours }, normalizeProvider(provider));
    if (!Array.isArray(rows) || rows.length === 0) {
      return [];
    }

    const now = new Date();
    const stats = [];
    const map = new Map();

    for (const row of rows) {
      const hourKey = row.hour;
      if (!hourKey) continue;
      map.set(hourKey, {
        requests: Number(row.sum_requests || 0),
        success: Number(row.sum_success || 0),
        failure: Number(row.sum_failure || 0)
      });
    }

    for (let i = hours - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 3600000);
      const hourKey = time.toISOString().slice(0, 13);
      const data = map.get(hourKey) || { requests: 0, success: 0, failure: 0 };
      stats.push({
        hour: toAsiaShanghaiHourMinute(time) || time.toISOString().slice(11, 16),
        requests: data.requests,
        success: data.success,
        failure: data.failure
      });
    }

    return stats;
  } catch (error) {
    console.error('getHourlyStatsFromPostgres error:', error);
    return [];
  }
}

async function getRecentTopModelsFromPostgres(env, hours, topN, provider = 'ollama') {
  try {
    const rows = await pgGetRecentTopModels(env, { hours, limit: topN }, normalizeProvider(provider));
    if (!Array.isArray(rows) || rows.length === 0) {
      return [];
    }

    return rows.map(row => ({
      model: row.model,
      requests: Number(row.sum_requests || 0),
      success: Number(row.sum_success || 0),
      failure: Number(row.sum_failure || 0),
      successRate: Number(row.sum_requests || 0) > 0
        ? ((Number(row.sum_success || 0) / Number(row.sum_requests || 0)) * 100).toFixed(2)
        : '0.00'
    }));
  } catch (error) {
    console.error('getRecentTopModelsFromPostgres error:', error);
    return [];
  }
}
