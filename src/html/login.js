/**
 * 登录页面 HTML - 静态内容
 */

export const loginHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ollama / OpenRouter API Pool 管理登录</title>
    <meta name="description" content="登录 Ollama / OpenRouter API Pool 管理后台，集中管理多 Provider 代理池，实现负载均衡、统一鉴权与实时统计。">
    <meta name="keywords" content="Ollama API Pool, OpenRouter, 多 Provider, API 代理池, Cloudflare Workers, 统一鉴权, 负载均衡, PostgreSQL, Redis">
    <link rel="canonical" href="https://ollama-api-pool.h7ml.workers.dev/dashboard">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="mask-icon" href="/favicon.svg" color="#4f46e5">
    <link rel="apple-touch-icon" href="/favicon.svg">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Ollama / OpenRouter API Pool">
    <meta property="og:title" content="登录 Ollama / OpenRouter API Pool 管理后台">
    <meta property="og:description" content="多 Provider 统一代理池：账号轮询、健康巡检、客户端 Token 与实时统计，一站式完成。">
    <meta property="og:url" content="https://ollama-api-pool.h7ml.workers.dev/dashboard">
    <meta property="og:image" content="https://ollama-api-pool.h7ml.workers.dev/logo.svg">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Ollama / OpenRouter API Pool 管理后台">
    <meta name="twitter:description" content="集中管理多 Provider API 账号，支持 PostgreSQL 与 Redis，提供实时统计与鉴权。">
    <meta name="twitter:image" content="https://ollama-api-pool.h7ml.workers.dev/logo.svg">
    <meta name="robots" content="index,follow">
    <script src="/vendor/tailwind.js"></script>
    <script src="/vendor/jquery.js"></script>
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
        };
        function onTurnstileLoad() {
            if (typeof window.initTurnstileWidgets === 'function') {
                window.initTurnstileWidgets();
            }
        }
    </script>
    <script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=onTurnstileLoad" async defer></script>
    <style>
        body { font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .auth-tab-active { background: #fff; color: #0f172a; box-shadow: 0 12px 24px -16px rgba(15, 23, 42, 0.45); }
        .user-tab-active { background: #0f172a; color: #fff; box-shadow: 0 12px 24px -16px rgba(15, 23, 42, 0.55); }
    </style>
</head>
<body class="bg-slate-50 min-h-screen flex flex-col text-slate-800">
    <header class="bg-white border-b border-slate-200/80">
        <div class="max-w-7xl mx-auto px-5 sm:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <a href="/dashboard" class="flex items-center gap-3 text-slate-900 no-underline hover:text-primary transition-colors">
                <div class="rounded-xl bg-gradient-to-br from-primary to-accent text-white p-2.5">
                    <span class="text-2xl">🔐</span>
                </div>
                <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.35em] text-primary">Ollama API Pool</p>
                    <h1 class="text-base sm:text-lg font-semibold">管理控制台登录</h1>
                </div>
            </a>
            <div class="flex w-full sm:w-auto flex-wrap items-center justify-start sm:justify-end gap-2 sm:gap-3 text-xs sm:text-sm">
                <a href="/project" class="px-3 py-1 sm:px-4 sm:py-2 rounded-lg border border-primary/20 text-primary hover:bg-primary/10 transition-colors flex items-center gap-2">
                    🧾 <span>项目介绍</span>
                </a>
                <a href="/api-docs" class="px-3 py-1 sm:px-4 sm:py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1">
                    📖 <span>API 文档</span>
                </a>
                <a href="/stats" class="px-3 py-1 sm:px-4 sm:py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1">
                    📊 <span>公开统计</span>
                </a>
            </div>
        </div>
    </header>

    <main class="flex-1">
        <div class="max-w-7xl mx-auto px-5 sm:px-8 py-12 lg:py-16">
            <div class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_400px] items-start">
                <section class="space-y-8">
                    <div class="space-y-5">
                        <span class="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">多 Provider · 统一管控</span>
                        <h2 class="text-3xl sm:text-4xl font-bold text-slate-900 leading-tight">进入后台，维护高可用的 Ollama / OpenRouter 代理池</h2>
                        <p class="text-base text-slate-600 leading-relaxed">
                            接入多组 Ollama 与 OpenRouter API 账号，自动选择健康 Key，支持 PostgreSQL + Redis 的混合存储架构，
                            提供验证、统计、限流、仪表盘等一站式能力，帮助你快速搭建面向内部或外部用户的推理服务。
                        </p>
                        <div class="grid gap-3 sm:grid-cols-2">
                            <div class="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4">
                                <span class="text-lg">🧭</span>
                                <div>
                                    <p class="font-semibold text-slate-900">智能轮询 + 健康度管理</p>
                                    <p class="text-sm text-slate-500">自动避开故障账号，根据失败次数动态降权，保障高可用。</p>
                                </div>
                            </div>
                            <div class="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4">
                                <span class="text-lg">📈</span>
                                <div>
                                    <p class="font-semibold text-slate-900">实时监控 + 公开统计</p>
                                    <p class="text-sm text-slate-500">仪表盘掌握请求耗时、吞吐、错误分布；公开页展示模型热点。</p>
                                </div>
                            </div>
                            <div class="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4">
                                <span class="text-lg">🛡️</span>
                                <div>
                                    <p class="font-semibold text-slate-900">可控鉴权系统</p>
                                    <p class="text-sm text-slate-500">内置客户端 Token 体系，支持有效期、使用次数与渠道隔离。</p>
                                </div>
                            </div>
                            <div class="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4">
                                <span class="text-lg">⚙️</span>
                                <div>
                                    <p class="font-semibold text-slate-900">一键部署 · 开箱即用</p>
                                    <p class="text-sm text-slate-500">Worker + Redis + PostgreSQL 组合，提供完整运维脚本与自动化流程。</p>
                                </div>
                            </div>
                        </div>

                        <div class="space-y-3">
                            <p class="text-sm font-semibold text-slate-700">更多相关项目</p>
                            <div class="grid gap-3 sm:grid-cols-2">
                                <a href="https://hivechat.jhun.edu.kg/?source=https://ollama-api-pool.h7ml.workers.dev" target="_blank" rel="noopener noreferrer" class="group flex items-start gap-3 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 hover:shadow-md transition-all">
                                    <span class="text-lg">💬</span>
                                    <div class="flex-1">
                                        <p class="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">HiveChat AI 聊天</p>
                                        <p class="text-sm text-slate-600">专为中小团队设计的 AI 聊天应用</p>
                                    </div>
                                    <svg class="w-5 h-5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                                    </svg>
                                </a>
                                <a href="https://html2web.jhun.edu.kg/?source=https://ollama-api-pool.h7ml.workers.dev" target="_blank" rel="noopener noreferrer" class="group flex items-start gap-3 rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-4 hover:shadow-md transition-all">
                                    <span class="text-lg">🎨</span>
                                    <div class="flex-1">
                                        <p class="font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">HTML2Web</p>
                                        <p class="text-sm text-slate-600">粘贴代码，实时成站 · 秒变可分享的创意舞台</p>
                                    </div>
                                    <svg class="w-5 h-5 text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                                    </svg>
                                </a>
                                <a href="https://teach.jhun.edu.kg/?source=https://ollama-api-pool.h7ml.workers.dev" target="_blank" rel="noopener noreferrer" class="group flex items-start gap-3 rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 hover:shadow-md transition-all">
                                    <span class="text-lg">📧</span>
                                    <div class="flex-1">
                                        <p class="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">Plan University Email Server</p>
                                        <p class="text-sm text-slate-600">高等教育专用邮件服务</p>
                                    </div>
                                    <svg class="w-5 h-5 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                                    </svg>
                                </a>
                                <a href="https://gemini.jhun.edu.kg/?source=https://ollama-api-pool.h7ml.workers.dev" target="_blank" rel="noopener noreferrer" class="group flex items-start gap-3 rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-4 hover:shadow-md transition-all">
                                    <span class="text-lg">🎓</span>
                                    <div class="flex-1">
                                        <p class="font-semibold text-slate-900 group-hover:text-amber-600 transition-colors">Plan University 公益站</p>
                                        <p class="text-sm text-slate-600">AI智能代理 · 面向高等教育的解决方案</p>
                                    </div>
                                    <svg class="w-5 h-5 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="space-y-8">
                    <div class="bg-white/95 backdrop-blur rounded-3xl shadow-soft border border-slate-100 p-6 sm:p-8 space-y-6">
                        <div class="flex items-center justify-between gap-3 flex-wrap">
                            <div class="bg-slate-100 rounded-2xl p-1 flex items-center gap-1">
                                <button type="button" data-auth-tab="admin" class="auth-tab inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold text-slate-900 bg-white shadow-md transition-all">管理员登录</button>
                                <button type="button" data-auth-tab="user" class="auth-tab inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-800 transition-all">用户登录 / 注册</button>
                            </div>
                            <span class="text-xs uppercase text-slate-400 tracking-[0.3em]">Access Center</span>
                        </div>

                        <div id="admin-auth-panel" class="space-y-5">
                            <div id="intro-section" class="space-y-4">
                                <div class="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                                    <p class="text-sm font-medium text-slate-900">仅管理员可见：</p>
                                    <ul class="mt-2 space-y-1 text-sm text-slate-600 list-disc pl-5">
                                        <li>批量导入与维护多 Provider API Key</li>
                                        <li>高级限流策略与健康检查配置</li>
                                        <li>请求指标、错误追踪与实时统计</li>
                                        <li>用户授权、每日签到及访问续期</li>
                                    </ul>
                                </div>
                                <button id="start-login" class="w-full rounded-2xl bg-gradient-to-r from-primary via-indigo-500 to-accent py-3 text-white font-semibold shadow-md hover:shadow-lg transition-transform duration-300 hover:-translate-y-0.5">
                                    开始登录
                                </button>
                                <p class="text-xs text-slate-400 text-center">点击后输入 <code class="bg-slate-100 px-2 py-0.5 rounded">ADMIN_TOKEN</code> 完成认证。</p>
                            </div>

                            <form id="login-form" class="hidden space-y-5">
                                <div>
                                    <label for="admin-token" class="block text-sm font-medium text-slate-700 mb-2">管理员 Token</label>
                                    <div class="relative">
                                        <input type="password" id="admin-token" class="w-full rounded-xl border border-slate-200 px-4 py-3 pr-12 focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all text-slate-900" placeholder="请输入管理员 Token" autocomplete="off" required>
                                        <button type="button" id="toggle-password" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" title="切换密码显示">
                                            <svg id="eye-icon" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                            </svg>
                                            <svg id="eye-off-icon" class="w-5 h-5 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs sm:text-sm text-slate-600">
                                    <label class="inline-flex items-center">
                                        <input type="checkbox" id="remember-me" class="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary">
                                        <span class="ml-2">记住登录状态</span>
                                    </label>
                                    <span class="text-slate-400">若使用公共设备，建议关闭此选项</span>
                                </div>

                                <div id="error-message" class="hidden rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"></div>

                                <button type="submit" class="w-full rounded-xl bg-slate-900 py-3 text-white font-semibold shadow-md hover:bg-slate-700 transition-colors">
                                    进入控制台
                                </button>
                            </form>
                        </div>

                        <div id="user-auth-panel" class="space-y-6 hidden">
                            <div class="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-slate-600 leading-relaxed">
                                使用邮箱即可登录或注册账户。<strong>已注册用户</strong>可选择"验证码"或"密码"登录；<strong>新用户</strong>请点击右侧"快速注册"标签。
                            </div>

                            <div class="flex items-center gap-2 bg-slate-900/5 rounded-2xl p-1 text-sm font-medium text-slate-500">
                                <button type="button" data-user-tab="login" class="user-tab inline-flex items-center justify-center px-4 py-2 rounded-xl bg-slate-900 text-white shadow-md transition-all">邮箱登录</button>
                                <button type="button" data-user-tab="register" class="user-tab inline-flex items-center justify-center px-4 py-2 rounded-xl hover:text-slate-800 transition-all">快速注册</button>
                            </div>

                            <div id="login-mode-tabs" class="flex items-center gap-2 bg-white/50 rounded-2xl p-1 text-sm font-medium text-slate-500">
                                <button type="button" data-login-mode="code" class="login-mode-btn inline-flex items-center justify-center px-4 py-2 rounded-xl bg-primary text-white shadow-md transition-all">验证码登录</button>
                                <button type="button" data-login-mode="password" class="login-mode-btn inline-flex items-center justify-center px-4 py-2 rounded-xl hover:text-slate-800 transition-all">邮箱密码登录</button>
                            </div>

                            <form id="user-login-form" class="space-y-4">
                                <div>
                                    <label for="user-login-email" class="block text-sm font-medium text-slate-700 mb-2">邮箱地址</label>
                                    <input type="email" id="user-login-email" class="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all text-slate-900" placeholder="name@example.com" autocomplete="email" required>
                                </div>

                                <div data-mode-section="code" class="space-y-3">
                                    <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] items-start">
                                        <div>
                                            <label for="user-login-code" class="block text-sm font-medium text-slate-700 mb-2">邮箱验证码</label>
                                            <input type="text" id="user-login-code" class="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all text-slate-900" placeholder="输入邮箱验证码" autocomplete="one-time-code" inputmode="numeric">
                                        </div>
                                        <button type="button" id="login-send-code" class="send-code-btn mt-7 sm:mt-auto px-4 py-2.5 rounded-xl bg-primary text-white font-medium shadow hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed" data-purpose="login" data-target="#user-login-email">
                                            获取验证码
                                        </button>
                                    </div>
                                    <p class="text-xs text-slate-500">验证码有效期 10 分钟。<span class="text-amber-600">若提示"未注册"，请切换到"快速注册"标签。</span></p>
                                </div>

                                <div data-mode-section="password" class="space-y-3 hidden">
                                    <div>
                                        <label for="user-login-password" class="block text-sm font-medium text-slate-700 mb-2">邮箱密码</label>
                                        <input type="password" id="user-login-password" class="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all text-slate-900" placeholder="已设置密码的账户可直接登录" autocomplete="current-password">
                                    </div>
                                    <p class="text-xs text-slate-500">密码由管理员或后台配置，忘记密码可切换至验证码登录。</p>
                                </div>

                                <div class="space-y-4">
                                    <div>
                                        <label for="user-login-provider" class="block text-sm font-medium text-slate-700 mb-2">默认服务提供方</label>
                                        <select id="user-login-provider" class="user-provider-select w-full rounded-xl border border-slate-200 px-4 py-3 bg-white focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all text-slate-900"></select>
                                    </div>
                                    <div class="flex items-center justify-between px-1">
                                        <label class="inline-flex items-center gap-2 cursor-pointer">
                                            <input type="checkbox" id="user-login-remember" class="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary" checked>
                                            <span class="text-sm font-medium text-slate-700">保持登录状态</span>
                                        </label>
                                        <span class="text-xs text-slate-400">公共设备请关闭</span>
                                    </div>
                                </div>

                                <button type="submit" class="w-full rounded-xl bg-slate-900 py-3 text-white font-semibold shadow hover:bg-slate-700 transition-colors">
                                    登录账户
                                </button>
                            </form>

                            <form id="user-register-form" class="space-y-4 hidden">
                                <div>
                                    <label for="user-register-email" class="block text-sm font-medium text-slate-700 mb-2">邮箱地址</label>
                                    <input type="email" id="user-register-email" class="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all text-slate-900" placeholder="name@example.com" autocomplete="email" required>
                                </div>
                                <div class="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] items-start">
                                    <div>
                                        <label for="user-register-code" class="block text-sm font-medium text-slate-700 mb-2">邮箱验证码</label>
                                        <input type="text" id="user-register-code" class="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all text-slate-900" placeholder="输入 6 位验证码" autocomplete="one-time-code" inputmode="numeric" required>
                                    </div>
                                    <button type="button" class="send-code-btn mt-7 sm:mt-auto px-4 py-2.5 rounded-xl bg-primary text-white font-medium shadow hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed" data-purpose="register" data-target="#user-register-email">
                                        获取验证码
                                    </button>
                                </div>
                                <div class="grid gap-3 sm:grid-cols-2">
                                    <div>
                                        <label for="user-register-password" class="block text-sm font-medium text-slate-700 mb-2">设置密码</label>
                                        <input type="password" id="user-register-password" class="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all text-slate-900" placeholder="至少 6 位字符" autocomplete="new-password" required>
                                    </div>
                                    <div>
                                        <label for="user-register-password-confirm" class="block text-sm font-medium text-slate-700 mb-2">确认密码</label>
                                        <input type="password" id="user-register-password-confirm" class="w-full rounded-xl border border-slate-200 px-4 py-3 focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all text-slate-900" placeholder="再次输入密码" autocomplete="new-password" required>
                                    </div>
                                </div>
                                <div>
                                    <label for="user-register-provider" class="block text-sm font-medium text-slate-700 mb-2">默认服务提供方</label>
                                    <select id="user-register-provider" class="user-provider-select w-full rounded-xl border border-slate-200 px-4 py-3 bg-white focus:ring-2 focus:ring-primary/40 focus:border-transparent transition-all text-slate-900"></select>
                                </div>
                                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-500">
                                    <label class="inline-flex items-center gap-2">
                                        <input type="checkbox" id="user-register-remember" class="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary" checked>
                                        <span>注册后保持登录</span>
                                    </label>
                                    <span>验证码 10 分钟内有效</span>
                                </div>
                                <button type="submit" class="w-full rounded-xl bg-primary py-3 text-white font-semibold shadow hover:bg-primary/90 transition-colors">
                                    创建账户
                                </button>
                            </form>

                            <div id="user-account-panel" class="hidden space-y-4">
                                <div class="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 space-y-4">
                                    <div class="flex items-center gap-3">
                                        <span class="text-2xl">🎉</span>
                                        <div>
                                            <h3 class="text-lg font-semibold text-emerald-800">邮箱验证完成，账户已激活</h3>
                                            <p class="text-sm text-emerald-700">以下凭证仅在当前页面展示，请妥善保存并在 24 小时内体验。</p>
                                        </div>
                                    </div>
                                    <div class="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <p class="text-xs text-emerald-700 uppercase tracking-wider">会话 Token</p>
                                            <div class="mt-1 flex items-center gap-2">
                                                <code id="user-session-token" class="break-all text-sm text-emerald-900 bg-white/80 px-3 py-2 rounded-lg shadow-inner">--</code>
                                                <button type="button" class="copy-btn inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors" data-copy-target="#user-session-token">复制</button>
                                            </div>
                                        </div>
                                        <div>
                                            <p class="text-xs text-emerald-700 uppercase tracking-wider">API 访问凭证</p>
                                            <div class="mt-1 flex items-center gap-2">
                                                <code id="user-api-token" class="break-all text-sm text-emerald-900 bg-white/80 px-3 py-2 rounded-lg shadow-inner">--</code>
                                                <button type="button" class="copy-btn inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 transition-colors" data-copy-target="#user-api-token">复制</button>
                                            </div>
                                        </div>
                                        <div>
                                            <p class="text-xs text-emerald-700 uppercase tracking-wider">账户邮箱</p>
                                            <p id="user-email-display" class="text-sm font-semibold text-emerald-900 mt-1 break-all">--</p>
                                        </div>
                                        <div>
                                            <p class="text-xs text-emerald-700 uppercase tracking-wider">默认服务</p>
                                            <p id="user-default-provider" class="text-sm font-semibold text-emerald-900 mt-1">--</p>
                                        </div>
                                        <div>
                                            <p class="text-xs text-emerald-700 uppercase tracking-wider">凭证到期时间</p>
                                            <p id="user-api-expire" class="text-sm font-semibold text-emerald-900 mt-1">--</p>
                                        </div>
                                    </div>
                                    <div class="text-xs text-emerald-800 leading-relaxed bg-white/70 rounded-xl px-4 py-3 space-y-1.5">
                                        <p>• 使用会话 Token 访问 <code class="bg-emerald-100 px-1 rounded">/api/auth/profile</code> 可同步账户信息。</p>
                                        <p>• 使用 API 凭证作为 <code class="bg-emerald-100 px-1 rounded">Authorization: Bearer &lt;token&gt;</code> 调用 <code class="bg-emerald-100 px-1 rounded">/v1/chat/completions</code>。</p>
                                        <p>• 每日签到可续期 API 凭证，登录后调用 <code class="bg-emerald-100 px-1 rounded">/api/auth/sign</code> 即可。</p>
                                    </div>
                                </div>
                                <div class="flex flex-wrap items-center gap-3">
                                    <a href="/api-docs" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold shadow hover:bg-slate-700 transition-colors">
                                        📖 <span>查看 API 文档</span>
                                    </a>
                                    <a href="/stats" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:border-slate-300 transition-colors">
                                        📊 <span>浏览公共统计</span>
                                    </a>
                                    <button type="button" id="user-logout-btn" class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 text-sm font-semibold hover:bg-rose-50 transition-colors">
                                        退出登录
                                    </button>
                                </div>
                            </div>

                            <div class="hidden">
                                <div id="turnstile-login"></div>
                                <div id="turnstile-common"></div>
                            </div>
                        </div>
                        </div>

                        <div class="space-y-2 text-xs text-slate-500">
                            <p>• 在 <code class="bg-slate-100 px-2 py-0.5 rounded">wrangler.toml</code> 中配置 <code>ADMIN_TOKEN</code> 后重新部署即可更新登录凭证。</p>
                            <p>• 如需面向用户提供账号体系，可在 PostgreSQL 中开放注册审批机制并结合 Redis 做验证码分发。</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    </main>

    <div id="toast-container" class="fixed top-6 right-6 space-y-3 z-50"></div>

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
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path>
                    </svg>
                    <span>GitHub</span>
                </a>
            </div>
            <div class="italic text-slate-400 tracking-wide">欲买桂花同载酒，终不似，少年游</div>
        </div>
    </footer>

    <script charset="UTF-8" id="LA_COLLECT" src="//sdk.51.la/js-sdk-pro.min.js"></script>
    <script>if (window.LA && typeof window.LA.init === 'function') { LA.init({id:"Ky3jFxCaiJ9zgtRy",ck:"Ky3jFxCaiJ9zgtRy",autoTrack:true,hashMode:true,screenRecord:true}); }</script>
    <script src="/js/login.js?v=8"></script>
</body>
</html>`;
