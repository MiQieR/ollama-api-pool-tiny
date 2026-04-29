/**
 * 用户后台页面 HTML
 */

export const userDashboardHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>用户后台 · Ollama / OpenRouter API Pool</title>
    <meta name="description" content="查看个人访问凭证、注册信息与登录历史，管理 Ollama / OpenRouter API Pool 用户能力。">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <script src="/vendor/tailwind.js"></script>
    <script>
        window.tailwind = window.tailwind || {};
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#4f46e5',
                        accent: '#0ea5e9'
                    }
                }
            }
        };
    </script>
    <style>
        body { font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    </style>
</head>
<body class="bg-slate-50 min-h-screen flex flex-col text-slate-800">
    <header class="bg-white border-b border-slate-200">
        <div class="max-w-6xl mx-auto px-5 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div class="flex items-center gap-3">
                <div class="rounded-xl bg-gradient-to-br from-primary to-accent text-white p-2.5">
                    <span class="text-2xl">🧭</span>
                </div>
                <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.35em] text-primary">Ollama API Pool</p>
                    <h1 class="text-lg font-semibold text-slate-900">用户后台</h1>
                </div>
            </div>
            <nav class="flex flex-wrap items-center gap-3 text-sm">
                <a href="/dashboard" class="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">管理员入口</a>
                <a href="/api-docs" class="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">API 文档</a>
                <a href="/stats" class="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors">公开统计</a>
                <button id="logout-btn" class="px-4 py-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition-colors">退出登录</button>
            </nav>
        </div>
    </header>

    <main class="flex-1">
        <div class="max-w-6xl mx-auto px-5 sm:px-8 py-10 space-y-8">
            <section class="grid gap-5 md:grid-cols-4">
                <div class="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
                    <p class="text-xs uppercase tracking-wide text-slate-400">账号邮箱</p>
                    <p id="user-email" class="mt-2 text-lg font-semibold text-slate-900">--</p>
                    <p class="mt-3 text-xs text-slate-500">默认服务商：<span id="user-provider" class="font-medium text-slate-700">--</span></p>
                </div>
                <div class="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
                    <p class="text-xs uppercase tracking-wide text-slate-400">注册时间</p>
                    <p id="user-created-at" class="mt-2 text-lg font-semibold text-slate-900">--</p>
                    <p class="mt-3 text-xs text-slate-500">最近登录：<span id="user-last-login" class="font-medium text-slate-700">--</span></p>
                </div>
                <div class="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
                    <p class="text-xs uppercase tracking-wide text-slate-400">访问凭证</p>
                    <p class="mt-2 text-lg font-semibold text-slate-900">到期时间</p>
                    <p id="user-key-expire" class="mt-1 text-sm text-slate-600">--</p>
                    <button id="refresh-profile-btn" class="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-primary/30 text-primary text-sm font-medium hover:bg-primary/10 transition-colors">
                        🔄 刷新信息
                    </button>
                </div>
                <div class="rounded-2xl bg-white border border-slate-200 p-5 shadow-sm">
                    <p class="text-xs uppercase tracking-wide text-slate-400">每日签到</p>
                    <p id="sign-status" class="mt-2 text-lg font-semibold text-slate-900">今日未签到</p>
                    <p class="mt-2 text-xs text-slate-500">签到可延长访问凭证有效期 24 小时。</p>
                    <button id="sign-btn" class="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-white text-sm font-semibold shadow hover:bg-primary/90 transition-colors">
                        <span data-icon>✅</span>
                        <span>立即签到</span>
                    </button>
                </div>
            </section>

            <section class="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-5">
                <div class="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h2 class="text-base font-semibold text-slate-900">访问凭证</h2>
                        <p class="text-xs text-slate-500 mt-1">请妥善保管 Session 与 API Token，避免泄露。</p>
                    </div>
                    <div class="flex items-center gap-2 text-xs text-slate-500">
                        <span>构建时间：<span id="user-build-time" class="font-medium text-slate-700">{{BUILD_TIME}}</span></span>
                    </div>
                </div>
                <div class="grid gap-4 md:grid-cols-2">
                    <div class="rounded-xl border border-slate-200 p-4">
                        <div class="flex items-center justify-between">
                            <p class="text-sm font-medium text-slate-700">会话 Token</p>
                            <div class="flex items-center gap-2 text-xs">
                                <button data-copy-target="session-token" class="copy-btn px-2 py-1 rounded-lg bg-slate-900 text-white">复制</button>
                                <button data-toggle-target="session-token" class="toggle-btn px-2 py-1 rounded-lg border border-slate-300 text-slate-600">显示</button>
                            </div>
                        </div>
                        <p id="session-token" class="mt-3 text-sm text-slate-600 break-all select-all blur-sm">--</p>
                    </div>
                    <div class="rounded-xl border border-slate-200 p-4">
                        <div class="flex items-center justify-between">
                            <p class="text-sm font-medium text-slate-700">API 访问凭证</p>
                            <div class="flex items-center gap-2 text-xs">
                                <button data-copy-target="api-token" class="copy-btn px-2 py-1 rounded-lg bg-slate-900 text-white">复制</button>
                                <button data-toggle-target="api-token" class="toggle-btn px-2 py-1 rounded-lg border border-slate-300 text-slate-600">显示</button>
                            </div>
                        </div>
                        <p id="api-token" class="mt-3 text-sm text-slate-600 break-all select-all blur-sm">--</p>
                    </div>
                </div>
            </section>

            <section class="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-5">
                <div class="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h2 class="text-base font-semibold text-slate-900">使用统计</h2>
                        <p class="text-xs text-slate-500 mt-1">汇总个人签到、登录与凭证信息。</p>
                    </div>
                </div>
                <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <div class="rounded-xl border border-slate-200 p-4 bg-slate-50/60">
                        <p class="text-xs uppercase tracking-wide text-slate-400">累计请求次数</p>
                        <p id="stat-request-count" class="mt-2 text-2xl font-semibold text-slate-900">0</p>
                    </div>
                    <div class="rounded-xl border border-slate-200 p-4 bg-slate-50/60">
                        <p class="text-xs uppercase tracking-wide text-slate-400">累计签到次数</p>
                        <p id="stat-total-signins" class="mt-2 text-2xl font-semibold text-slate-900">0</p>
                    </div>
                    <div class="rounded-xl border border-slate-200 p-4 bg-slate-50/60">
                        <p class="text-xs uppercase tracking-wide text-slate-400">最近签到日期</p>
                        <p id="stat-last-signin" class="mt-2 text-base font-medium text-slate-800">--</p>
                    </div>
                    <div class="rounded-xl border border-slate-200 p-4 bg-slate-50/60">
                        <p class="text-xs uppercase tracking-wide text-slate-400">最近登录时间</p>
                        <p id="stat-last-login" class="mt-2 text-base font-medium text-slate-800">--</p>
                    </div>
                    <div class="rounded-xl border border-slate-200 p-4 bg-slate-50/60">
                        <p class="text-xs uppercase tracking-wide text-slate-400">凭证有效期</p>
                        <p id="stat-key-expire" class="mt-2 text-base font-medium text-slate-800">--</p>
                    </div>
                </div>
            </section>

            <section class="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-5">
                <div class="flex items-center justify-between flex-wrap gap-3">
                    <div>
                        <h2 class="text-base font-semibold text-slate-900">登录记录</h2>
                        <p class="text-xs text-slate-500 mt-1">展示最近的签到 / 登录时间线。</p>
                    </div>
                    <div class="flex items-center gap-2 text-xs text-slate-500">
                        <span id="signins-summary">--</span>
                    </div>
                </div>
                <div class="overflow-hidden rounded-xl border border-slate-200">
                    <table class="min-w-full divide-y divide-slate-200 text-sm">
                        <thead class="bg-slate-50 text-slate-500">
                            <tr>
                                <th class="px-4 py-3 text-left font-medium">签到日期</th>
                                <th class="px-4 py-3 text-left font-medium">记录时间</th>
                            </tr>
                        </thead>
                        <tbody id="signin-table-body" class="divide-y divide-slate-100">
                            <tr>
                                <td colspan="2" class="px-4 py-6 text-center text-slate-400 text-sm">加载中...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div class="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                    <div>
                        第 <span id="pagination-page">1</span> / <span id="pagination-total">1</span> 页，共 <span id="pagination-total-count">0</span> 条
                    </div>
                    <div class="flex items-center gap-2">
                        <button id="pagination-prev" class="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">上一页</button>
                        <button id="pagination-next" class="px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">下一页</button>
                    </div>
                </div>
            </section>
        </div>
    </main>

    <footer class="bg-white border-t border-slate-200">
        <div class="max-w-6xl mx-auto px-5 sm:px-8 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
            <div>Ollama / OpenRouter API Pool · 用户后台</div>
            <div class="flex items-center gap-2">
                <a href="https://github.com/dext7r/ollama-api-pool" target="_blank" rel="noopener" class="flex items-center gap-1 hover:text-primary transition-colors">
                    <span>GitHub</span>
                </a>
            </div>
        </div>
    </footer>

    <div id="toast-container" class="fixed top-6 right-6 space-y-3 z-50"></div>
    <script src="/js/user-dashboard.js?v=1"></script>
</body>
</html>`;
