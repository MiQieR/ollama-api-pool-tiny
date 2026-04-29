/**
 * Ollama API Pool - Cloudflare Worker
 *
 * 功能:
 * 1. API 代理池 - 轮询使用多个 Ollama API Key
 * 2. 鉴权系统 - 自定义 API Key 验证
 * 3. 管理后台 - 导入/管理账号
 * 4. 统计分析 - 请求统计和监控
 * 5. OpenAI 兼容 - 支持流式和非流式请求
 */

import { handleProxyRequest } from './proxy';
import { handleAuth } from './auth';
import { handleAdmin } from './admin';
import { handleDashboard, handleUserDashboard } from './dashboard';
import {
  corsHeaders,
  jsonResponse,
  errorResponse,
  getRandomUserAgent,
  isProviderEnabled,
  toAsiaShanghaiISOString
} from './utils';
import { getCachedModels, setCachedModels } from './cache';
import { countApiKeys, getNextApiKey } from './keyManager';
import { verifyClientToken } from './auth';
import { normalizeProvider, getProviderConfig, buildUpstreamHeaders } from './providers';
import { logoSvg, faviconSvg } from './static/assets';

const GITHUB_REPO = 'dext7r/ollama-api-pool';
const PROJECT_META_CACHE_TTL = 5 * 60 * 1000;
let projectMetaCache = { data: null, fetched: 0 };

const VENDOR_ASSETS = {
  '/vendor/tailwind.js': {
    url: 'https://cdn.tailwindcss.com/',
    contentType: 'application/javascript; charset=utf-8'
  },
  '/vendor/jquery.js': {
    url: 'https://code.jquery.com/jquery-3.7.1.min.js',
    contentType: 'application/javascript; charset=utf-8'
  },
  '/vendor/chart.js': {
    url: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
    contentType: 'application/javascript; charset=utf-8'
  },
  '/vendor/echarts.js': {
    url: 'https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js',
    contentType: 'application/javascript; charset=utf-8'
  },
  '/vendor/marked.js': {
    url: 'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
    contentType: 'application/javascript; charset=utf-8'
  },
  '/vendor/mermaid.js': {
    url: 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js',
    contentType: 'application/javascript; charset=utf-8'
  }
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 检查 ADMIN_TOKEN 是否已配置
    if (!env.ADMIN_TOKEN || env.ADMIN_TOKEN === 'your-admin-secret-token') {
      if (path !== '/') {
        return errorResponse('Service not configured. Please set ADMIN_TOKEN in wrangler.toml', 503);
      }
      // 首页显示配置引导
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head><title>Setup Required</title></head>
        <body style="font-family: sans-serif; padding: 50px; text-align: center;">
          <h1>⚙️ 初始化配置</h1>
          <p>请先配置 ADMIN_TOKEN</p>
          <ol style="text-align: left; max-width: 600px; margin: 20px auto;">
            <li>编辑 <code>wrangler.toml</code></li>
            <li>设置 <code>ADMIN_TOKEN = "your-secure-token"</code></li>
            <li>运行 <code>wrangler deploy</code> 重新部署</li>
          </ol>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // 处理 CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 路由分发
      if (path === '/' || path === '/dashboard') {
        // 管理后台首页
        return handleDashboard(request, env);
      } else if (path === '/user' || path === '/user/dashboard') {
        // 用户后台
        return handleUserDashboard(request, env);
      } else if (path === '/stats') {
        // 公开统计页面
        return handleStaticHtml('/stats.html', env);
      } else if (path === '/api-docs') {
        // API 使用文档
        return handleStaticHtml('/api-docs.html', env);
      } else if (path === '/project') {
        // 项目介绍页面
        return handleStaticHtml('/project.html', env);
      } else if (path === '/project/meta') {
        return handleProjectMeta();
      } else if (path === '/project/docs') {
        // 获取项目文档（支持查询参数 ?file=xxx.md）
        return handleProjectDocs(url);
      } else if (path.startsWith('/vendor/')) {
        return handleVendorAsset(request, ctx);
      } else if (path === '/api/test-templates') {
        return jsonResponse({ templates: getTestTemplatesPayload() });
      } else if (path.startsWith('/js/')) {
        // 静态 JS 文件
        return handleStaticJs(path, env);
      } else if (path === '/favicon.svg' || path === '/favicon.ico') {
        return new Response(faviconSvg, {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=86400'
          }
        });
      } else if (path === '/logo.svg') {
        return new Response(logoSvg, {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=86400'
          }
        });
      } else if (path.startsWith('/api/auth/')) {
        return handleAuth(request, env);
      } else if (path.startsWith('/admin/')) {
        // 管理 API
        return handleAdmin(request, env);
      } else if (path === '/v1/chat/completions') {
        // 检查 Ollama 是否启用
        if (!isProviderEnabled(env, 'ollama')) {
          return errorResponse('Ollama service is currently disabled by administrator', 503);
        }
        const hasKeys = await checkHasApiKeys(env, 'ollama');
        if (!hasKeys) {
          return errorResponse('No API keys configured. Please add keys via admin dashboard', 503);
        }
        return handleProxyRequest(request, env, 'ollama');
      } else if (path === '/openrouter/v1/chat/completions') {
        // 检查 OpenRouter 是否启用
        if (!isProviderEnabled(env, 'openrouter')) {
          return errorResponse('OpenRouter service is currently disabled by administrator', 503);
        }
        const hasKeys = await checkHasApiKeys(env, 'openrouter');
        if (!hasKeys) {
          return errorResponse('No OpenRouter API keys configured. Please add keys via admin dashboard', 503);
        }
        return handleProxyRequest(request, env, 'openrouter');
      } else if (path === '/v1/models') {
        // 检查 Ollama 是否启用
        if (!isProviderEnabled(env, 'ollama')) {
          return errorResponse('Ollama service is currently disabled by administrator', 503);
        }
        return handleModels(request, env, 'ollama');
      } else if (path === '/openrouter/v1/models') {
        // 检查 OpenRouter 是否启用
        if (!isProviderEnabled(env, 'openrouter')) {
          return errorResponse('OpenRouter service is currently disabled by administrator', 503);
        }
        return handleModels(request, env, 'openrouter');
      } else if (path === '/health') {
        // 健康检查
        const hasKeys = await checkHasApiKeys(env, 'ollama');

        return jsonResponse({
          status: 'ok',
          service: 'Ollama API Pool',
          version: '1.0.0',
          configured: hasKeys,
          providers: {
            ollama: {
              enabled: isProviderEnabled(env, 'ollama'),
              configured: hasKeys
            },
            openrouter: {
              enabled: isProviderEnabled(env, 'openrouter'),
              configured: await checkHasApiKeys(env, 'openrouter')
            }
          },
          project: {
            name: 'Ollama API Pool',
            description: 'Intelligent Ollama API proxy pool with load balancing and fault tolerance',
            homepage: 'https://ollama-api-pool.h7ml.workers.dev',
            repository: 'https://github.com/dext7r/ollama-api-pool',
            documentation: 'https://ollama-api-pool.h7ml.workers.dev/api-docs',
            statistics: 'https://ollama-api-pool.h7ml.workers.dev/stats',
            license: 'MIT'
          },
          author: {
            name: 'dext7r',
            email: 'h7ml@qq.com',
            github: 'https://github.com/dext7r'
          },
          timestamp: new Date().toISOString(),
          uptime: Date.now()
        });
      } else {
        return errorResponse('Not Found', 404);
      }
    } catch (error) {
      console.error('Worker Error:', error);
      return errorResponse(error.message, 500);
    }
  }
};

async function handleVendorAsset(request, ctx) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return errorResponse('Method Not Allowed', 405);
  }

  const url = new URL(request.url);
  const asset = VENDOR_ASSETS[url.pathname];
  if (!asset) {
    return errorResponse('Vendor asset not found', 404);
  }

  const isHeadRequest = request.method === 'HEAD';
  const cache = caches.default;
  const cacheKey = new Request(url.toString(), { method: 'GET' });
  const cached = await cache.match(cacheKey);
  if (cached) {
    if (isHeadRequest) {
      return new Response(null, {
        status: cached.status,
        headers: cached.headers
      });
    }
    return cached;
  }

  const upstream = await fetch(asset.url, {
    headers: {
      'User-Agent': getRandomUserAgent(),
      'Accept': '*/*'
    },
    cf: {
      cacheEverything: true,
      cacheTtl: 86400
    }
  });

  if (!upstream.ok) {
    return errorResponse(`Failed to load vendor asset: ${upstream.status}`, 502);
  }

  const headers = new Headers(upstream.headers);
  headers.set('Content-Type', asset.contentType);
  headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
  headers.set('Access-Control-Allow-Origin', '*');
  headers.delete('Set-Cookie');

  const response = new Response(isHeadRequest ? null : upstream.body, {
    status: upstream.status,
    headers
  });

  if (!isHeadRequest) {
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
  }

  return response;
}

async function handleProjectMeta() {
  const now = Date.now();
  if (projectMetaCache.data && now - projectMetaCache.fetched < PROJECT_META_CACHE_TTL) {
    return jsonResponse({ ...projectMetaCache.data, cached: true });
  }

  try {
    const baseHeaders = {
      'User-Agent': getRandomUserAgent(),
      Accept: 'application/vnd.github+json'
    };

    const [infoResponse, tagsResponse, releasesResponse] = await Promise.all([
      fetch(`https://api.github.com/repos/${GITHUB_REPO}`, { headers: baseHeaders }),
      fetch(`https://api.github.com/repos/${GITHUB_REPO}/tags?per_page=5`, { headers: baseHeaders }),
      fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=5`, { headers: baseHeaders })
    ]);

    const infoRaw = infoResponse.ok ? await infoResponse.json() : null;
    let tags = [];
    let releases = [];

    if (tagsResponse.ok) {
      const raw = await tagsResponse.json();
      if (Array.isArray(raw)) {
        tags = raw.slice(0, 5).map(tag => {
          const tagName = tag?.name || '';
          const commitSha = tag?.commit?.sha || '';
          return {
            name: tagName,
            sha: commitSha ? commitSha.slice(0, 7) : '',
            commit_sha: commitSha,
            url: tagName ? `https://github.com/${GITHUB_REPO}/releases/tag/${encodeURIComponent(tagName)}` : '',
            commit_url: commitSha ? `https://github.com/${GITHUB_REPO}/commit/${commitSha}` : ''
          };
        });
      }
    }

    if (releasesResponse.ok) {
      const raw = await releasesResponse.json();
      if (Array.isArray(raw)) {
        releases = raw.slice(0, 5).map(item => {
          const publishedAt = item?.published_at || item?.created_at || null;
          let summary = '';
          if (item?.body) {
            summary = item.body
              .split('\n')
              .map(line => line.trim())
              .filter(Boolean)
              .slice(0, 3)
              .join('\n')
              .slice(0, 280);
          }
          return {
            id: item?.id || null,
            name: item?.name || item?.tag_name || '未命名版本',
            tagName: item?.tag_name || '',
            url: item?.html_url || '',
            publishedAt: publishedAt ? toAsiaShanghaiISOString(publishedAt) : null,
            prerelease: Boolean(item?.prerelease),
            draft: Boolean(item?.draft),
            summary
          };
        });
      }
    }

    const sanitizedInfo = infoRaw
      ? {
          full_name: infoRaw.full_name || GITHUB_REPO,
          default_branch: infoRaw.default_branch || 'main',
          stargazers_count: infoRaw.stargazers_count || 0,
          forks_count: infoRaw.forks_count || 0,
          open_issues_count: infoRaw.open_issues_count || 0,
          pushed_at: infoRaw.pushed_at || null
        }
      : null;

    const record = {
      info: sanitizedInfo,
      tags,
      releases,
      fetched_at: toAsiaShanghaiISOString(now)
    };

    projectMetaCache = { data: record, fetched: now };

    return jsonResponse({ ...record, cached: false });
  } catch (error) {
    console.error('Project meta fetch failed:', error);
    if (projectMetaCache.data) {
      return jsonResponse({ ...projectMetaCache.data, cached: true });
    }
    return errorResponse('Failed to load project metadata', 502);
  }
}

// 获取项目文档（Markdown 文件）
const DOC_FILE_CACHE = new Map();
const DOC_CACHE_TTL = 10 * 60 * 1000; // 10 分钟缓存

async function handleProjectDocs(url) {
  const allowedFiles = [
    'README.md',
    'README_EN.md',
    'API_PARAMETERS.md',
    'CONFIGURATION.md',
    'PROVIDER_TOGGLE.md',
    'PROJECT_SUMMARY.md',
    'CHANGELOG.md',
    'CONTRIBUTING.md',
    'OPTIMIZATION.md'
  ];

  const fileName = url.searchParams.get('file');
  if (!fileName || !allowedFiles.includes(fileName)) {
    return errorResponse('Invalid or missing file parameter. Allowed files: ' + allowedFiles.join(', '), 400);
  }

  // 检查缓存
  const cached = DOC_FILE_CACHE.get(fileName);
  if (cached && Date.now() - cached.timestamp < DOC_CACHE_TTL) {
    return new Response(cached.content, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'X-Cache': 'HIT',
        ...corsHeaders
      }
    });
  }

  try {
    // 从 GitHub raw content 获取文件
    const rawUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${fileName}`;
    const response = await fetch(rawUrl, {
      headers: {
        'User-Agent': getRandomUserAgent()
      }
    });

    if (!response.ok) {
      return errorResponse(`Failed to fetch ${fileName}: ${response.status} ${response.statusText}`, response.status);
    }

    const content = await response.text();

    // 更新缓存
    DOC_FILE_CACHE.set(fileName, {
      content,
      timestamp: Date.now()
    });

    return new Response(content, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'X-Cache': 'MISS',
        ...corsHeaders
      }
    });
  } catch (error) {
    console.error(`Error fetching ${fileName}:`, error);
    return errorResponse(`Failed to fetch ${fileName}: ${error.message}`, 500);
  }
}

// 检查是否有可用的 API Keys
async function checkHasApiKeys(env, provider = 'ollama') {
  const normalized = normalizeProvider(provider);
  const total = await countApiKeys(env, normalized);
  return total > 0;
}

// 模型列表处理 - 代理到 ollama.com/api/tags 并转换为 OpenAI 格式
async function handleModels(request, env, provider = 'ollama') {
  try {
    const normalized = normalizeProvider(provider);
    const providerConfig = getProviderConfig(normalized);
    const modelHeaders = buildUpstreamHeaders(normalized, '', env);

    // 验证客户端 Token（可选，如果提供了 Authorization 头）
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const clientToken = authHeader.substring(7);
      const tokenCheck = await verifyClientToken(clientToken, env, normalized);
      if (!tokenCheck.valid) {
        return errorResponse(tokenCheck.message || 'Invalid API token', tokenCheck.status || 401);
      }
    }

    // 尝试从缓存获取
    const cachedModels = await getCachedModels(env, normalized);
    if (cachedModels) {
      return new Response(JSON.stringify(cachedModels), {
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
          'Cache-Control': 'public, max-age=300',
          ...corsHeaders
        }
      });
    }

    // 获取一个可用的 API Key 用于获取模型列表
    const apiKey = await getNextApiKey(env, normalized);

    if (!apiKey) {
      return errorResponse('No available API keys', 503);
    }

    const headers = buildUpstreamHeaders(normalized, apiKey, env, {
      'User-Agent': getRandomUserAgent()
    });
    delete headers['Content-Type'];

    const response = await fetch(providerConfig.upstream.models, {
      headers
    });

    if (!response.ok) {
      return errorResponse('Failed to fetch models', response.status);
    }

    const data = await response.json();

    let models;
    if (normalized === 'ollama') {
      models = (data.models || []).map(model => ({
        id: model.name || model.model,
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: 'ollama',
        permission: [],
        root: model.name || model.model,
        parent: null
      }));
    } else {
      const list = Array.isArray(data.data) ? data.data : (data.models || []);
      models = list.map(item => ({
        id: item.id || item.name,
        object: 'model',
        created: Math.floor(Date.now() / 1000),
        owned_by: item.owned_by || 'openrouter',
        permission: [],
        root: item.id || item.name,
        parent: null
      }));
    }

    const result = {
      object: 'list',
      data: models
    };

    // 缓存结果
    await setCachedModels(env, result, normalized);

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=300',
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Models error:', error);
    return errorResponse(error.message, 500);
  }
}

function getTestTemplatesPayload() {
  return [
    {
      id: 'ecommerce-support',
      label: '电商客服',
      description: '为大型电商平台提供售后咨询与物流跟踪答复。',
      systemPrompt: '你是一名电商平台的资深智能客服，擅长定位物流状态、解释售后政策并安抚客户情绪，回答需清晰、礼貌且给出下一步指引。',
      userMessage: '客户：我的订单 8923765 已经三天显示“运输中”没更新了，能帮我查查现在到哪了吗？',
      temperature: 0.4,
      stream: false
    },
    {
      id: 'fintech-analyst',
      label: '金融分析',
      description: '面向互联网金融平台的投研解读与风险提示。',
      systemPrompt: '你是一名互联网券商的策略分析师，要为普通投资者提供客观、审慎的趋势解读，并在必要时提示风险和免责声明。',
      userMessage: '用户想了解：近期人工智能概念股持续走强，接下来一周可能的风险点有哪些？',
      temperature: 0.35,
      stream: false
    },
    {
      id: 'telemedicine-assistant',
      label: '互联网医疗',
      description: '辅助在线问诊平台进行初步分诊与健康建议。',
      systemPrompt: '你是一名互联网医疗平台的健康顾问，遵循“非诊断性建议”原则，需提醒用户线下就医并给出生活方式建议。',
      userMessage: '患者：最近频繁熬夜后总觉得心悸、出汗，应该怎么调理？需要马上看医生吗？',
      temperature: 0.3,
      stream: false
    },
    {
      id: 'edu-mentor',
      label: '在线教育',
      description: '帮助 K12 在线课堂的学习规划与知识点讲解。',
      systemPrompt: '你是在线教育平台的学业导师，擅长将复杂知识拆解为步骤，鼓励学生积极思考。',
      userMessage: '学生：物理中动量守恒定律怎么理解？能用生活中的例子讲讲吗？',
      temperature: 0.5,
      stream: false
    },
    {
      id: 'marketing-planner',
      label: '品牌营销',
      description: '为新消费品牌生成社媒营销文案与活动创意。',
      systemPrompt: '你是新消费品牌的营销策划，总结品牌卖点，并输出具有创意的短文案，语气亲和、有画面感。',
      userMessage: '需求：围绕“零糖气泡水”设计三条适合小红书的推广短句，突出健康与夏日清爽感。',
      temperature: 0.75,
      stream: false
    },
    {
      id: 'travel-planner',
      label: '旅游行程',
      description: '面向在线旅行平台提供个性化路线规划。',
      systemPrompt: '你是在线旅行平台的行程规划师，需要根据用户画像提供兼顾预算与体验的计划，并附上交通提示。',
      userMessage: '用户：计划五一三天去成都，预算中等，喜欢美食和小众博物馆，怎么安排比较好？',
      temperature: 0.6,
      stream: false
    },
    {
      id: 'legal-brief',
      label: '法律助手',
      description: '服务合规平台的初步合同与权益解读。',
      systemPrompt: '你是企业合规平台的法律顾问助手，需要用通俗语言解释合同条款，并提醒用户最终以专业律师意见为准。',
      userMessage: '客户：给你一段竞业限制条款，帮我看看生效条件有哪些？',
      temperature: 0.25,
      stream: false
    },
    {
      id: 'game-narrative',
      label: '游戏剧情',
      description: '面向游戏工作室的 NPC 剧情与任务脚本设计。',
      systemPrompt: '你是一名 RPG 游戏的剧情策划，擅长塑造鲜明 NPC 和支线任务，语言富有感染力。',
      userMessage: '需求：为“星港酒吧”的女调酒师 NPC 设计一段接任务对白，并描述玩家需要完成的任务目标。',
      temperature: 0.8,
      stream: true
    }
  ];
}

// 处理静态 JS 文件
async function handleStaticJs(path, env) {
  // 移除查询参数（如 ?v=2）
  const cleanPath = path.split('?')[0];

  if (cleanPath === '/js/login.js') {
    const { loginJs } = await import('./static/login-js');
    const siteKey = env?.TURNSTILE_SITE_KEY || '';
    const enabled = env?.ENABLE_TURNSTILE === 'true' ? 'true' : 'false';
    let jsContent = loginJs.replace(/{{TURNSTILE_SITE_KEY}}/g, siteKey);
    jsContent = jsContent.replace(/{{TURNSTILE_ENABLED}}/g, enabled);
    return new Response(jsContent, {
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } else if (cleanPath === '/js/user-dashboard.js') {
    const { userDashboardJs } = await import('./static/user-dashboard-js');
    return new Response(userDashboardJs, {
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=1800'
      }
    });
  } else if (cleanPath === '/js/dashboard.js') {
    const { dashboardJs } = await import('./static/dashboard-js');
    return new Response(dashboardJs, {
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } else if (cleanPath === '/js/project.js') {
    const { projectJs } = await import('./static/project-js');
    return new Response(projectJs, {
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=1800'
      }
    });
  }

  return errorResponse('Not Found', 404);
}

// 处理静态 HTML 文件
async function handleStaticHtml(path, env) {
  const { getBuildTime } = await import('./buildInfo');
  const buildTime = getBuildTime(env);
  const applyBuildTime = html => (typeof html === 'string' ? html.replace(/{{BUILD_TIME}}/g, buildTime) : html);

  if (path === '/api-docs.html') {
    const { apiDocsHtml } = await import('./static/api-docs-html');
    const html = applyBuildTime(apiDocsHtml);

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } else if (path === '/stats.html') {
    const { statsHtml } = await import('./static/stats-html');

    return new Response(applyBuildTime(statsHtml), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300'
      }
    });
  } else if (path === '/project.html') {
    const { projectHtml } = await import('./static/project-html');

    return new Response(applyBuildTime(projectHtml), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=600'
      }
    });
  }

  return errorResponse('Not Found', 404);
}
