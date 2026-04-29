/**
 * Redis 工具模块
 * 基于 Upstash REST API 封装常用命令，优先用于缓存与限流。
 */

const configCache = new Map();

/**
 * 解析 REDIS_URL 并缓存配置。
 */
function resolveConfig(env) {
  const redisUrl = env?.REDIS_URL;
  if (!redisUrl) return null;

  if (redisUrl.includes('<') || redisUrl.includes('>') || redisUrl.includes('your-') || redisUrl.includes('your_')) {
    return null;
  }

  if (configCache.has(redisUrl)) {
    return configCache.get(redisUrl);
  }

  try {
    const url = new URL(redisUrl);
    // Upstash REST API 使用 https 协议。
    const baseUrl = `https://${url.hostname}`;
    const token = url.password;

    if (!token) {
      console.warn('REDIS_URL 缺少密码部分，无法创建授权头');
      return null;
    }

    const headers = {
      Authorization: `Bearer ${token}`
    };

    const config = { baseUrl, headers };
    configCache.set(redisUrl, config);
    return config;
  } catch (error) {
    console.warn('解析 REDIS_URL 失败:', error);
    return null;
  }
}

export function isRedisEnabled(env) {
  return Boolean(resolveConfig(env));
}

function encodeArg(arg) {
  return encodeURIComponent(String(arg));
}

async function redisRequest(env, segments, { method = 'GET', body, searchParams } = {}) {
  const config = resolveConfig(env);
  if (!config) return null;

  const path = segments.map(encodeArg).join('/');
  const url = new URL(`${config.baseUrl}/${path}`);

  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  try {
    const headers = {
      ...config.headers,
      ...(body ? { 'Content-Type': 'text/plain; charset=utf-8' } : {})
    };

    const response = await fetch(url.toString(), {
      method,
      headers,
      body
    });

    if (!response.ok) {
      console.warn('Redis 请求失败:', response.status, await response.text());
      return null;
    }

    const data = await response.json();
    if (data.error) {
      console.warn('Redis 返回错误:', data.error);
      return null;
    }

    return data.result ?? null;
  } catch (error) {
    console.warn('Redis 请求异常:', error);
    return null;
  }
}

export async function redisGet(env, key) {
  return await redisRequest(env, ['GET', key]);
}

export async function redisSet(env, key, value, ttlSeconds) {
  const payload = typeof value === 'string' ? value : JSON.stringify(value);
  return await redisRequest(env, ['SET', key], {
    method: 'POST',
    body: payload,
    searchParams: ttlSeconds ? { EX: ttlSeconds } : undefined
  });
}

export async function redisDelete(env, key) {
  return await redisRequest(env, ['DEL', key]);
}

export async function redisDeleteMany(env, keys) {
  if (!keys || keys.length === 0) return 0;
  const result = await redisRequest(env, ['DEL', ...keys]);
  return typeof result === 'number' ? result : Number(result ?? 0);
}

export async function redisIncr(env, key) {
  const result = await redisRequest(env, ['INCR', key]);
  return typeof result === 'number' ? result : Number(result ?? 0);
}

export async function redisExpire(env, key, ttlSeconds) {
  const result = await redisRequest(env, ['EXPIRE', key, ttlSeconds]);
  return typeof result === 'number' ? result : Number(result ?? 0);
}

export async function redisScanPattern(env, pattern, count = 100) {
  const keys = [];
  let cursor = '0';

  do {
    const result = await redisRequest(env, ['SCAN', cursor, 'MATCH', pattern, 'COUNT', count]);
    if (!result || !Array.isArray(result) || result.length < 2) {
      break;
    }

    cursor = result[0];
    const batch = Array.isArray(result[1]) ? result[1] : [];
    keys.push(...batch);
  } while (cursor !== '0');

  return keys;
}
