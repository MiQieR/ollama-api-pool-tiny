/**
 * 公开统计页面 HTML（极简版）
 */

export const statsHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>实时统计 - Ollama / OpenRouter API Pool</title>
  <meta name="description" content="实时查看 Ollama / OpenRouter API Pool 的请求趋势、模型热度、成功率等关键指标，掌握代理池运行状况。">
  <meta name="keywords" content="Ollama / OpenRouter, OpenRouter, 实时统计, 模型热度, 请求监控, Cloudflare Workers">
  <meta name="robots" content="index,follow">
  <link rel="canonical" href="https://ollama-api-pool.h7ml.workers.dev/stats">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="mask-icon" href="/favicon.svg" color="#4f46e5">
  <link rel="apple-touch-icon" href="/favicon.svg">
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="Ollama / OpenRouter API Pool">
  <meta property="og:title" content="实时统计 · Ollama / OpenRouter API Pool">
  <meta property="og:description" content="公开展示代理池的请求趋势、成功率与资源状态，透明掌控运行质量。">
  <meta property="og:url" content="https://ollama-api-pool.h7ml.workers.dev/stats">
  <meta property="og:image" content="https://ollama-api-pool.h7ml.workers.dev/logo.svg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="实时统计 · Ollama / OpenRouter API Pool">
  <meta name="twitter:description" content="查看多 Provider 代理池的实时监控指标，快速感知异常。">
  <meta name="twitter:image" content="https://ollama-api-pool.h7ml.workers.dev/logo.svg">
  <script src="/vendor/tailwind.js"></script>
  <script src="/vendor/jquery.js"></script>
  <script src="/vendor/chart.js"></script>
  <script src="/vendor/echarts.js"></script>
  <script>
    window.tailwind = window.tailwind || {};
        tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: '#4f46e5',
            accent: '#0ea5e9'
          },
          boxShadow: {
            soft: '0 18px 40px -24px rgba(30, 41, 59, 0.35)'
          }
        }
      }
    }
  </script>
  <style>
    body {
      font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
    .card {
      background: #ffffff;
      border: 1px solid rgba(15, 23, 42, 0.08);
      border-radius: 18px;
      box-shadow: 0 12px 32px -18px rgba(15, 23, 42, 0.25);
      transition: box-shadow 0.2s ease, transform 0.2s ease;
    }
    .card:hover {
      box-shadow: 0 18px 40px -18px rgba(15, 23, 42, 0.35);
      transform: translateY(-1px);
    }
    .metric-card {
      border: 1px solid rgba(148, 163, 184, 0.25);
      border-radius: 18px;
      background: linear-gradient(180deg, rgba(248, 250, 252, 1), #ffffff);
      padding: 20px 22px;
    }
    .skeleton {
      border-radius: 16px;
      background: linear-gradient(90deg, rgba(226, 232, 240, 0.18) 25%, rgba(226, 232, 240, 0.36) 37%, rgba(226, 232, 240, 0.18) 63%);
      background-size: 400% 100%;
      animation: shimmer 1.2s ease infinite;
    }
    @keyframes shimmer {
      0% { background-position: 100% 0; }
      100% { background-position: -100% 0; }
    }
    .empty-state {
      border: 1px dashed rgba(148, 163, 184, 0.5);
      border-radius: 14px;
      padding: 32px 16px;
      text-align: center;
      background: rgba(248, 250, 252, 0.9);
      color: #64748b;
      font-size: 0.9rem;
    }
  </style>
</head>
<body class="bg-slate-50 min-h-screen flex flex-col text-slate-800">
  <header class="bg-white border-b border-slate-200/80">
        <div class="max-w-7xl mx-auto px-5 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
      <a href="/dashboard" class="flex items-center gap-3 text-slate-900 no-underline hover:text-primary transition-colors">
        <div class="rounded-xl bg-gradient-to-br from-primary to-accent text-white p-2.5">
          <span class="text-2xl">📊</span>
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.35em] text-primary">Ollama / OpenRouter</p>
          <h1 class="text-base sm:text-lg font-semibold">实时公开统计</h1>
        </div>
      </a>
      <div class="flex w-full sm:w-auto flex-wrap items-center justify-start sm:justify-end gap-2 sm:gap-3 text-xs sm:text-sm">
        <a href="/project" class="px-3 py-1 sm:px-4 sm:py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1">🧾 <span>项目介绍</span></a>
        <a href="/api-docs" class="px-3 py-1 sm:px-4 sm:py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1">📖 <span>API 文档</span></a>
        <a href="/stats" class="px-3 py-1 sm:px-4 sm:py-2 rounded-lg border border-primary/20 text-primary hover:bg-primary/10 transition-colors flex items-center gap-1">📊 <span>公开统计</span></a>
        <a href="/dashboard?verify=true" class="px-3 py-1 sm:px-4 sm:py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-700 transition-colors">返回控制台</a>
      </div>
    </div>
  </header>

  <main class="flex-1">
    <div class="max-w-7xl mx-auto px-5 sm:px-8 py-4 lg:py-6 space-y-8">
      <section class="rounded-2xl border border-slate-200 bg-white p-6 lg:p-8 shadow-soft">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div class="flex items-center gap-3 text-3xl font-semibold text-slate-900">
              <span>实时监控中心</span>
              <span id="storage-pill" class="hidden px-3 py-1 text-xs font-semibold rounded-full bg-slate-900 text-white"></span>
            </div>
            <p class="mt-2 text-sm text-slate-500">
              追踪 Ollama / OpenRouter 的请求趋势、模型使用表现与关键资源状态。
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <button id="refresh-btn" class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-full hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900">
              🔄 手动刷新
            </button>
            <span class="text-xs text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-3 py-1">系统每 30 秒自动更新一次</span>
          </div>
        </div>
      </section>

      <section class="space-y-8">
        <div id="skeleton-loader" class="space-y-6">
          <div class="rounded-2xl border border-slate-200 bg-white p-6 text-center">
            <div class="inline-flex items-center gap-3 text-slate-600">
              <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span id="loading-text" class="text-sm font-medium">正在加载统计数据...</span>
            </div>
            <p class="mt-2 text-xs text-slate-400">首次加载可能需要 5-15 秒，请耐心等待</p>
          </div>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="h-28 skeleton"></div>
            <div class="h-28 skeleton"></div>
            <div class="h-28 skeleton"></div>
            <div class="h-28 skeleton"></div>
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div class="h-72 skeleton"></div>
            <div class="h-72 skeleton"></div>
          </div>
          <div class="h-52 skeleton"></div>
        </div>

        <div id="dashboard-content" class="hidden space-y-8">
          <section class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <article class="metric-card">
              <p class="text-xs uppercase tracking-wide text-slate-400">总请求数</p>
              <p id="metric-total-requests" class="mt-3 text-3xl font-semibold text-slate-900">--</p>
            </article>
            <article class="metric-card">
              <p class="text-xs uppercase tracking-wide text-slate-400">成功率</p>
              <p id="metric-success-rate" class="mt-3 text-3xl font-semibold text-slate-900">--</p>
            </article>
            <article class="metric-card">
              <p class="text-xs uppercase tracking-wide text-slate-400">成功次数</p>
              <p id="metric-success-count" class="mt-3 text-3xl font-semibold text-slate-900">--</p>
            </article>
            <article class="metric-card">
              <p class="text-xs uppercase tracking-wide text-slate-400">失败次数</p>
              <p id="metric-failure-count" class="mt-3 text-3xl font-semibold text-slate-900">--</p>
            </article>
          </section>

          <div id="no-data-banner" class="card p-4 text-sm text-slate-500 flex items-center gap-3 hidden">
            <span class="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500">ℹ️</span>
            <span>尚未采集到新的统计数据。发起一次 API 请求后，点击「手动刷新」即可查看最新指标。</span>
          </div>

          <section class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <article class="card p-6">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-slate-500">API Key 总数</p>
                  <p class="mt-2 text-2xl font-semibold text-slate-900">
                    <span id="metric-total-keys">--</span>
                  </p>
                  <p class="mt-1 text-xs text-slate-400">活跃率：<span id="metric-active-percentage" class="text-slate-600 font-medium">--</span></p>
                </div>
                <div class="text-right text-xs text-slate-400">
                  <p>活跃：<span id="metric-active-keys" class="text-slate-600 font-medium">--</span></p>
                  <p class="mt-1">禁用/失败：<span id="metric-failed-keys" class="text-slate-600 font-medium">--</span></p>
                </div>
              </div>
              <div class="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div id="active-progress-bar" class="h-2 bg-slate-900 transition-all duration-500" style="width:0%;"></div>
              </div>
              <div class="mt-4 flex items-center gap-3 text-xs text-slate-400">
                <span id="metric-storage" class="px-3 py-1 rounded-full border border-slate-200 text-slate-500">--</span>
                <span>最近同步：<span id="metric-sync-time" class="text-slate-600 font-medium">--</span></span>
              </div>
            </article>

            <article class="card p-6">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-slate-900">最近 24 小时热门模型</h2>
                <span class="text-xs text-slate-400 border border-slate-200 rounded-full px-3 py-1">Top 3</span>
              </div>
              <div id="recent-top-models" class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm"></div>
              <div id="recent-top-models-empty" class="mt-6 empty-state hidden">
                暂无近 24 小时数据
              </div>
            </article>
          </section>

          <section class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <article class="card p-6">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-slate-900">请求趋势（24 小时）</h2>
                <span id="trend-empty-badge" class="hidden text-xs text-slate-400">暂无数据</span>
              </div>
              <div class="mt-4" style="height:300px">
                <canvas id="hourly-trend-chart"></canvas>
              </div>
            </article>

            <article class="card p-6">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-semibold text-slate-900">热门模型占比</h2>
                <span id="top-models-empty" class="hidden text-xs text-slate-400">暂无数据</span>
              </div>
              <div class="mt-4" style="height:300px" id="top-models-echart"></div>
            </article>
          </section>

          <section class="card p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-slate-900">Top 10 模型详细数据</h2>
              <span class="text-xs text-slate-400">采样统计</span>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full text-sm text-slate-600">
                <thead class="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th class="py-3 pr-4 text-left">排名</th>
                    <th class="py-3 pr-4 text-left">模型名称</th>
                    <th class="py-3 pr-4 text-center">总请求</th>
                    <th class="py-3 pr-4 text-center">成功</th>
                    <th class="py-3 pr-4 text-center">失败</th>
                    <th class="py-3 pr-4 text-center">成功率</th>
                  </tr>
                </thead>
                <tbody id="top-models-table">
                  <tr><td colspan="6" class="py-6 text-center text-slate-400">加载中...</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <p class="text-xs text-slate-400 text-center">
            自动刷新频率：30 秒 · 最后更新：<span id="footer-last-update" class="text-slate-600 font-medium">--</span>
          </p>
        </div>
      </section>
         <section class="card p-6">
         <script id="LA-DATA-WIDGET" crossorigin="anonymous" charset="UTF-8" src="https://v6-widget.51.la/v6/Ky3jFxCaiJ9zgtRy/quote.js?theme=0&col=true&f=12&badge=icon_0&icon=center"></script>
           </section>
    </div>
  </main>

  <div id="toast-container" class="fixed top-5 left-1/2 -translate-x-1/2 space-y-2 z-50 pointer-events-none"></div>

  <footer class="mt-auto bg-white border-t border-slate-200">
    <div class="max-w-7xl mx-auto px-5 sm:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
      <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-slate-500">
        <div class="flex items-center gap-1 sm:gap-2">
          <span>当前时间: <span id="footer-time" class="font-medium text-slate-700"></span></span>
          <span class="hidden sm:inline text-slate-300">·</span>
          <span>构建时间: <span id="build-time" class="font-medium text-slate-700">{{BUILD_TIME}}</span></span>
        </div>
        <div class="flex items-center gap-1 sm:gap-2">
          <span>首次运行: <span id="project-launch-date" class="font-medium text-slate-700">2025-10-09</span></span>
          <span class="hidden sm:inline text-slate-300">·</span>
          <span>已稳定运行 <span id="project-runtime" class="font-medium text-slate-700">--</span></span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <a href="https://github.com/dext7r/ollama-api-pool" target="_blank" rel="noopener" class="flex items-center gap-1 hover:text-primary transition-colors">
          <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          <span>GitHub</span>
        </a>
      </div>
      <div class="italic text-slate-400 tracking-wide">欲买桂花同载酒，终不似，少年游</div>
    </div>
  </footer>

  <script>
    const PROJECT_START_DISPLAY = '2025-10-09';
    const PROJECT_START_DATE = new Date('2025-10-09T00:00:00+08:00');
    const REFRESH_INTERVAL = 30000;
    const MANUAL_REFRESH_COOLDOWN = 30000; // 手动刷新冷却时间 30 秒
    const state = {
      trendChart: null,
      modelsChart: null,
      timer: null,
      loaded: false,
      lastManualRefresh: 0
    };

    const numberFormatter = new Intl.NumberFormat('zh-CN');
    const percentFormatter = new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    function updateFooterTime() {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      const timeStr = year + '年' + month + '月' + day + '日 ' + hours + ':' + minutes + ':' + seconds;

      const footerTime = document.getElementById('footer-time');
      if (footerTime) footerTime.textContent = timeStr;

      if (!Number.isNaN(PROJECT_START_DATE.getTime())) {
        let diffMs = now.getTime() - PROJECT_START_DATE.getTime();
        if (diffMs < 0) diffMs = 0;

        const totalMinutes = Math.floor(diffMs / 60000);
        const days = Math.floor(totalMinutes / 1440);
        const hoursDiff = Math.floor((totalMinutes % 1440) / 60);
        const minutesDiff = totalMinutes % 60;

        const launchEl = document.getElementById('project-launch-date');
        if (launchEl) launchEl.textContent = PROJECT_START_DISPLAY;
        const runtimeEl = document.getElementById('project-runtime');
        if (runtimeEl) runtimeEl.textContent = days + ' 天 ' + hoursDiff + ' 小时 ' + minutesDiff + ' 分钟';
      }
    }

    updateFooterTime();
    setInterval(updateFooterTime, 1000);

    function toggleSkeleton(show) {
      if (show) {
        $('#skeleton-loader').removeClass('hidden');
        $('#dashboard-content').addClass('hidden');
      } else {
        $('#skeleton-loader').addClass('hidden');
        $('#dashboard-content').removeClass('hidden');
      }
    }

    function showToast(message, type = 'info') {
      const id = 'toast-' + Date.now();
      const baseClass = type === 'success'
        ? 'bg-emerald-500 text-white'
        : type === 'error'
          ? 'bg-red-500 text-white'
          : type === 'warning'
            ? 'bg-amber-500 text-white'
            : 'bg-slate-900 text-white';
      const toast = $(\`
        <div id="\${id}" class="\${baseClass} px-4 py-2 text-sm font-medium rounded-full shadow-lg">
          \${message}
        </div>
      \`);
      const container = $('#toast-container');
      container.removeClass('pointer-events-none');
      container.append(toast);
      setTimeout(() => toast.fadeOut(300, () => {
        toast.remove();
        if (!container.children().length) {
          container.addClass('pointer-events-none');
        }
      }), 2200);
    }

    function formatNumber(value) {
      if (value === undefined || value === null) return '--';
      return numberFormatter.format(value);
    }

    function formatPercentValue(value) {
      if (value === undefined || value === null || Number.isNaN(value)) return '--';
      return percentFormatter.format(value) + '%';
    }

    async function fetchStats(forceSkeleton = false) {
      try {
        if (!state.loaded || forceSkeleton) {
          toggleSkeleton(true);
        }

        const startTime = Date.now();
        let loadingTextTimer = null;

        // 5秒后更新加载提示
        loadingTextTimer = setTimeout(() => {
          const loadingText = document.getElementById('loading-text');
          if (loadingText) {
            loadingText.textContent = '数据量较大，正在聚合中...';
          }
        }, 5000);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20秒超时

        const response = await fetch('/admin/public-stats', {
          headers: { 'Cache-Control': 'no-store' },
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        clearTimeout(loadingTextTimer);

        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }

        const data = await response.json();
        const loadTime = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(\`统计数据加载完成，耗时 \${loadTime} 秒\`);

        renderDashboard(data);
        state.loaded = true;
      } catch (error) {
        if (error.name === 'AbortError') {
          console.error('统计数据加载超时');
          showToast('加载超时（>20秒），请稍后重试或联系管理员', 'error');
        } else {
          console.error('统计数据加载失败:', error);
          showToast('统计数据加载失败', 'error');
        }
      } finally {
        toggleSkeleton(false);
      }
    }

    function renderDashboard(data) {
      if (!data || !data.global) return;

      const global = data.global;
      const meta = data.meta || {};
      const storage = meta.storage || global.storage || 'kv';
      const successRateValue = parseFloat(meta.successRate ?? global.successRate ?? 0);

      $('#metric-total-requests').text(formatNumber(global.totalRequests || 0));
      $('#metric-success-rate').text(formatPercentValue(successRateValue));
      $('#metric-success-count').text(formatNumber(global.successCount || 0));
      $('#metric-failure-count').text(formatNumber(global.failureCount || 0));

      const totalKeys = meta.totalApiKeys ?? global.totalApiKeys ?? 0;
      const activeKeys = meta.activeKeys ?? global.activeKeys ?? 0;
      const failedKeys = meta.failedKeys ?? global.failedKeys ?? 0;
      const activePercent = totalKeys > 0 ? Math.min(activeKeys / totalKeys * 100, 100) : 0;

      $('#metric-total-keys').text(formatNumber(totalKeys));
      $('#metric-active-keys').text(formatNumber(activeKeys));
      $('#metric-failed-keys').text(formatNumber(failedKeys));
      $('#metric-active-percentage').text(formatPercentValue(activePercent));
      $('#active-progress-bar').css('width', \`\${activePercent.toFixed(1)}%\`);
      $('#metric-storage').text('存储后端：' + storage.toUpperCase());
      $('#storage-pill').removeClass('hidden').text(storage.toUpperCase());

      const timestamp = meta.generatedAt || data.timestamp;
      const formattedTime = timestamp
        ? new Date(timestamp).toLocaleString('zh-CN', {
            timeZone: 'Asia/Shanghai',
            hour12: false,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        : '--';
      $('#metric-sync-time').text(formattedTime);
      $('#footer-last-update').text(formattedTime);

      const hasData = (global.totalRequests || 0) > 0 || (global.successCount || 0) > 0 || (global.failureCount || 0) > 0;
      $('#no-data-banner').toggleClass('hidden', hasData);

      updateTrendChart(data.hourlyTrend || []);
      updateModelsChart(data.topModels || []);
      updateRecentModels(data.recentTopModels || []);
      updateModelsTable(data.topModels || []);
    }

    function updateTrendChart(trend) {
      const ctx = document.getElementById('hourly-trend-chart');

      if (state.trendChart) {
        state.trendChart.destroy();
        state.trendChart = null;
      }

      if (!trend.length) {
        $('#trend-empty-badge').removeClass('hidden');
        return;
      }
      $('#trend-empty-badge').addClass('hidden');

      state.trendChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: trend.map(item => item.hour),
          datasets: [
            {
              label: '总请求',
              data: trend.map(item => item.requests),
              borderColor: '#1f2937',
              backgroundColor: 'rgba(31, 41, 55, 0.08)',
              fill: true,
              tension: 0.3,
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 4
            },
            {
              label: '成功',
              data: trend.map(item => item.success),
              borderColor: '#15803d',
              backgroundColor: 'rgba(21, 128, 61, 0.12)',
              fill: true,
              tension: 0.3,
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 4
            },
            {
              label: '失败',
              data: trend.map(item => item.failure),
              borderColor: '#dc2626',
              backgroundColor: 'rgba(220, 38, 38, 0.12)',
              fill: true,
              tension: 0.3,
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { usePointStyle: true, padding: 16 }
            },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              cornerRadius: 6,
              padding: 10,
              titleFont: { size: 13, family: 'Inter' },
              bodyFont: { size: 12, family: 'Inter' }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(148, 163, 184, 0.2)' }
            },
            x: {
              grid: { display: false }
            }
          },
          interaction: { intersect: false, mode: 'index' }
        }
      });
    }

    function updateModelsChart(models) {
      if (state.modelsChart) {
        state.modelsChart.dispose();
        state.modelsChart = null;
      }

      if (!models.length) {
        $('#top-models-empty').removeClass('hidden');
        $('#top-models-echart').addClass('hidden');
        return;
      }
      $('#top-models-empty').addClass('hidden');
      $('#top-models-echart').removeClass('hidden');

      const chartDom = document.getElementById('top-models-echart');
      state.modelsChart = echarts.init(chartDom, null, { renderer: 'svg' });

      state.modelsChart.setOption({
        tooltip: {
          trigger: 'item',
          formatter: params => \`\${params.marker} \${params.name}<br/>请求数：\${numberFormatter.format(params.value)}<br/>占比：\${params.percent}%\`
        },
        legend: {
          orient: 'vertical',
          right: 0,
          top: 'middle',
          itemWidth: 10,
          itemHeight: 10,
          textStyle: { color: '#475569', fontSize: 12 }
        },
        series: [{
          type: 'pie',
          radius: ['35%', '65%'],
          center: ['35%', '50%'],
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            color: '#1f2937',
            formatter: '{b|{b}}\\n{c|{c}}',
            rich: {
              b: { fontWeight: 600, fontSize: 12 },
              c: { color: '#6b7280', fontSize: 11 }
            }
          },
          data: models.slice(0, 8).map(item => ({ name: item.model, value: item.requests }))
        }]
      });
    }

    function updateRecentModels(list) {
      const container = $('#recent-top-models');
      container.empty();

      if (!list.length) {
        $('#recent-top-models-empty').removeClass('hidden');
        return;
      }
      $('#recent-top-models-empty').addClass('hidden');

      list.forEach((item, index) => {
        const successRate = item.requests > 0 ? formatPercentValue((item.success || 0) / item.requests * 100) : '--';
        container.append(\`
          <div class="rounded-lg border border-slate-200 bg-white px-4 py-4">
            <div class="flex items-center justify-between text-xs text-slate-500">
              <span class="px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">#\${index + 1}</span>
              <span>\${formatNumber(item.requests || 0)} 次</span>
            </div>
            <p class="mt-3 text-base font-semibold text-slate-800 break-words">\${item.model || '未知模型'}</p>
            <dl class="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
              <div>
                <dt>成功</dt>
                <dd class="text-slate-700 font-medium mt-1">\${formatNumber(item.success || 0)}</dd>
              </div>
              <div>
                <dt>失败</dt>
                <dd class="text-slate-700 font-medium mt-1">\${formatNumber(item.failure || 0)}</dd>
              </div>
              <div class="col-span-2">
                <dt>成功率</dt>
                <dd class="text-emerald-600 font-semibold mt-1">\${successRate}</dd>
              </div>
            </dl>
          </div>
        \`);
      });
    }

    function updateModelsTable(models) {
      const tbody = $('#top-models-table');
      tbody.empty();

      if (!models.length) {
        tbody.append('<tr><td colspan="6" class="py-6 text-center text-slate-400 text-sm">暂无模型统计数据</td></tr>');
        return;
      }

      models.forEach((item, index) => {
        const successRate = item.requests > 0 ? formatPercentValue((item.success || 0) / item.requests * 100) : '--';
        let rankClass = 'bg-slate-100 text-slate-500';
        if (index === 0) rankClass = 'bg-slate-900 text-white';
        else if (index === 1) rankClass = 'bg-slate-700 text-white';
        else if (index === 2) rankClass = 'bg-slate-500 text-white';

        tbody.append(\`
          <tr class="border-b border-slate-100 last:border-0">
            <td class="py-3 pr-4">
              <span class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold \${rankClass}">\${index + 1}</span>
            </td>
            <td class="py-3 pr-4 text-slate-700 font-medium">\${item.model}</td>
            <td class="py-3 pr-4 text-center">\${formatNumber(item.requests || 0)}</td>
            <td class="py-3 pr-4 text-center text-emerald-600">\${formatNumber(item.success || 0)}</td>
            <td class="py-3 pr-4 text-center text-rose-500">\${formatNumber(item.failure || 0)}</td>
            <td class="py-3 pr-4 text-center text-slate-700 font-semibold">\${successRate}</td>
          </tr>
        \`);
      });
    }

    $(document).ready(() => {
      fetchStats(true);
      state.timer = setInterval(() => fetchStats(false), REFRESH_INTERVAL);

      $('#refresh-btn').on('click', () => {
        const now = Date.now();
        const timeSinceLastRefresh = now - state.lastManualRefresh;

        if (timeSinceLastRefresh < MANUAL_REFRESH_COOLDOWN) {
          const remainingSeconds = Math.ceil((MANUAL_REFRESH_COOLDOWN - timeSinceLastRefresh) / 1000);
          showToast(\`请等待 \${remainingSeconds} 秒后再刷新\`, 'warning');
          return;
        }

        state.lastManualRefresh = now;
        fetchStats(true);
        showToast('正在刷新', 'success');

        // 添加冷却视觉效果
        const btn = $('#refresh-btn');
        btn.prop('disabled', true).addClass('opacity-50 cursor-not-allowed');

        let countdown = Math.floor(MANUAL_REFRESH_COOLDOWN / 1000);
        const originalText = btn.text();

        const countdownTimer = setInterval(() => {
          countdown--;
          if (countdown > 0) {
            btn.text(\`🔄 冷却中 (\${countdown}s)\`);
          } else {
            clearInterval(countdownTimer);
            btn.text(originalText).prop('disabled', false).removeClass('opacity-50 cursor-not-allowed');
          }
        }, 1000);
      });

      $(window).on('beforeunload', () => {
        if (state.timer) clearInterval(state.timer);
      });

      $(window).on('resize', () => {
        if (state.modelsChart) {
          state.modelsChart.resize();
        }
      });
    });
  </script>
  <script charset="UTF-8" id="LA_COLLECT" src="//sdk.51.la/js-sdk-pro.min.js"></script>
  <script>if (window.LA && typeof window.LA.init === 'function') { LA.init({id:"Ky3jFxCaiJ9zgtRy",ck:"Ky3jFxCaiJ9zgtRy",autoTrack:true,hashMode:true,screenRecord:true}); }</script>
</body>
</html>`;
