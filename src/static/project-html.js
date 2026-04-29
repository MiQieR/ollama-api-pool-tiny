export const projectHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>项目介绍 · Ollama / OpenRouter API Pool</title>
    <meta name="description" content="了解 Ollama / OpenRouter API Pool 的核心能力、版本更新、部署方式与最佳实践，支持中英文 README 切换与可视化图表。">
    <meta name="keywords" content="Ollama API Pool, OpenRouter, README, 多语言文档, 代理池, Cloudflare Workers, 发布标签, 部署指南">
    <meta name="robots" content="index,follow">
    <link rel="canonical" href="https://ollama-api-pool.h7ml.workers.dev/project">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="mask-icon" href="/favicon.svg" color="#4f46e5">
    <link rel="apple-touch-icon" href="/favicon.svg">
    <meta property="og:type" content="article">
    <meta property="og:site_name" content="Ollama / OpenRouter API Pool">
    <meta property="og:title" content="项目介绍 · Ollama / OpenRouter API Pool">
    <meta property="og:description" content="浏览最新 README、版本信息与标签，快速了解多 Provider 代理池的能力与部署实践。">
    <meta property="og:url" content="https://ollama-api-pool.h7ml.workers.dev/project">
    <meta property="og:image" content="https://ollama-api-pool.h7ml.workers.dev/logo.svg">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="项目介绍 · Ollama / OpenRouter API Pool">
    <meta name="twitter:description" content="集中查看项目亮点、最新版本与 README 内容，支持中英文切换与 mermaid 图表。">
    <meta name="twitter:image" content="https://ollama-api-pool.h7ml.workers.dev/logo.svg">
    <script src="/vendor/tailwind.js"></script>
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
                        soft: '0 18px 40px -24px rgba(15, 23, 42, 0.35)'
                    }
                }
            }
        };
    </script>
    <style>
        body { font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .markdown-body {
            background: #ffffff;
            border-radius: 24px;
            padding: 2.25rem 2.75rem;
            border: 1px solid rgba(148, 163, 184, 0.25);
            box-shadow: 0 24px 54px -36px rgba(15, 23, 42, 0.4);
            color: #0f172a;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
        }
        .markdown-body h1,
        .markdown-body h2,
        .markdown-body h3,
        .markdown-body h4 {
            margin-top: 1.75rem;
            margin-bottom: 0.85rem;
            font-weight: 600;
            color: #0f172a;
        }
        .markdown-body pre {
            background: #0f172a;
            color: #e2e8f0;
            border-radius: 16px;
            padding: 1.1rem 1.3rem;
            overflow-x: auto;
        }
        .markdown-body code {
            border-radius: 6px;
            padding: 0.15rem 0.4rem;
            font-size: 0.85rem;
        }
        .markdown-body img {
            max-width: 100%;
            display: inline-block;
            vertical-align: middle;
            margin: 0 0.25rem 0.35rem;
        }
        .markdown-body a {
            color: #2563eb;
            font-weight: 600;
            text-decoration: none;
            transition: color 0.2s ease, text-decoration-color 0.2s ease;
        }
        .markdown-body a:hover {
            color: #1d4ed8;
            text-decoration: underline;
            text-decoration-color: rgba(37, 99, 235, 0.6);
        }
        .markdown-body a code {
            color: inherit;
        }
        .markdown-body table {
            width: 100%;
            border-collapse: collapse;
            overflow: hidden;
        }
        .markdown-body table thead {
            background: rgba(15, 23, 42, 0.04);
        }
        .markdown-body table th,
        .markdown-body table td {
            border: 1px solid rgba(148, 163, 184, 0.35);
            padding: 0.65rem 0.85rem;
            text-align: left;
            font-size: 0.9rem;
            vertical-align: top;
        }
        .markdown-body table tbody tr:nth-child(every) {
            background: rgba(15, 23, 42, 0.02);
        }
        .markdown-body table tbody tr:hover {
            background: rgba(79, 70, 229, 0.08);
        }
        @media (max-width: 768px) {
            .markdown-body table {
                display: block;
                overflow-x: auto;
            }
            .markdown-body table thead,
            .markdown-body table tbody,
            .markdown-body table th,
            .markdown-body table td,
            .markdown-body table tr {
                display: block;
            }
            .markdown-body table tr {
                margin-bottom: 0.75rem;
            }
            .markdown-body table th {
                border-bottom: none;
                font-size: 0.8rem;
                text-transform: uppercase;
                letter-spacing: 0.08em;
            }
            .markdown-body table td {
                border-left: none;
                border-right: none;
                padding-left: 0;
                padding-right: 0;
            }
        }
        .markdown-body [align="center"] {
            text-align: center;
        }
        .lang-switch {
            display: inline-flex;
            align-items: center;
            gap: 0.6rem;
            padding: 0.4rem 0.5rem;
            border-radius: 9999px;
            background: rgba(148, 163, 184, 0.2);
        }
        .lang-switch button {
            border: none;
            padding: 0.45rem 1.1rem;
            border-radius: 9999px;
            background: transparent;
            color: #475569;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            transition: all .2s ease;
        }
        .lang-switch button.active {
            background: linear-gradient(135deg, #4f46e5, #0ea5e9);
            color: #ffffff;
            box-shadow: 0 18px 36px -24px rgba(79, 70, 229, 0.65);
        }
        .mermaid {
            background: #ffffff;
            border-radius: 18px;
            border: 1px solid rgba(148, 163, 184, 0.3);
            padding: 1rem;
            margin: 1.5rem 0;
        }
        .meta-card-grid {
            display: grid;
            gap: 1.2rem;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        }
        .meta-card {
            background: linear-gradient(145deg, #f8fbff 0%, #ffffff 100%);
            border-radius: 24px;
            padding: 1.8rem 2rem;
            border: 1px solid rgba(148, 163, 184, 0.22);
            box-shadow: 0 28px 60px -40px rgba(15, 23, 42, 0.45);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .meta-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 36px 72px -38px rgba(79, 70, 229, 0.35);
        }
        .meta-card h3 {
            margin: 0;
            font-size: 1rem;
            font-weight: 600;
            color: #0f172a;
            letter-spacing: 0.02em;
        }
        .meta-meta {
            margin-top: 1rem;
            display: grid;
            gap: 0.65rem;
        }
        .meta-line {
            display: flex;
            align-items: center;
            gap: 0.65rem;
            font-size: 0.92rem;
            color: #344155;
        }
        .meta-line strong {
            color: #111827;
        }
        .meta-icon {
            width: 1.8rem;
            height: 1.8rem;
            border-radius: 9999px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(79, 70, 229, 0.12);
            color: #4338ca;
            font-size: 0.95rem;
        }
        .meta-link {
            color: #2563eb;
            text-decoration: none;
            font-weight: 600;
        }
        .meta-link:hover {
            text-decoration: underline;
        }
        .tag-cloud {
            display: flex;
            flex-wrap: wrap;
            gap: 0.6rem;
            margin-top: 0.9rem;
        }
        .tag-pill {
            display: inline-flex;
            align-items: center;
            gap: 0.45rem;
            padding: 0.5rem 1rem;
            border-radius: 9999px;
            background: rgba(99, 102, 241, 0.14);
            color: #312e81;
            text-decoration: none;
            font-size: 0.85rem;
            font-weight: 600;
            transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
        }
        .tag-pill:hover {
            background: rgba(99, 102, 241, 0.22);
            color: #1e3a8a;
            transform: translateY(-1px);
        }
        .tag-pill span {
            font-family: 'JetBrains Mono', 'Fira Code', monospace;
            font-size: 0.78rem;
            color: #475569;
        }
        .tag-pill--ghost {
            background: rgba(148, 163, 184, 0.18);
            color: #1f2937;
        }
        .tag-pill--ghost:hover {
            background: rgba(148, 163, 184, 0.26);
            color: #111827;
        }
        .release-card {
            background: linear-gradient(160deg, rgba(79, 70, 229, 0.08), rgba(14, 165, 233, 0.08));
            border-radius: 24px;
            padding: 1.8rem 2rem;
            border: 1px solid rgba(79, 70, 229, 0.2);
            box-shadow: 0 26px 56px -40px rgba(79, 70, 229, 0.35);
        }
        .release-list {
            display: grid;
            gap: 1.2rem;
            margin-top: 1.2rem;
        }
        .release-item {
            background: rgba(255, 255, 255, 0.9);
            border-radius: 18px;
            border: 1px solid rgba(148, 163, 184, 0.25);
            padding: 1.2rem 1.4rem;
            box-shadow: 0 16px 32px -28px rgba(15, 23, 42, 0.45);
        }
        .release-header {
            display: flex;
            flex-direction: column;
            gap: 0.45rem;
        }
        .release-title a {
            color: #1f2937;
            font-weight: 600;
            font-size: 1rem;
            text-decoration: none;
        }
        .release-title a:hover {
            color: #4338ca;
            text-decoration: underline;
        }
        .release-meta {
            margin-top: 0.5rem;
            display: flex;
            flex-wrap: wrap;
            gap: 0.6rem;
            font-size: 0.75rem;
            color: #64748b;
        }
        .release-tag {
            padding: 0.2rem 0.65rem;
            border-radius: 9999px;
            background: rgba(99, 102, 241, 0.12);
            color: #4338ca;
            font-weight: 600;
        }
        .release-time {
            font-weight: 600;
        }
        .release-badges {
            display: inline-flex;
            gap: 0.4rem;
        }
        .release-summary {
            margin-top: 0.75rem;
            font-size: 0.85rem;
            line-height: 1.55;
            color: #1e293b;
        }
        .release-summary.muted {
            color: #94a3b8;
            font-style: italic;
        }
        .release-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.3rem;
            padding: 0 0.45rem;
            border-radius: 9999px;
            font-size: 0.7rem;
            font-weight: 600;
        }
        .release-badge.prerelease {
            background: rgba(249, 115, 22, 0.18);
            color: #ea580c;
        }
        .release-badge.draft {
            background: rgba(148, 163, 184, 0.2);
            color: #334155;
        }
        .release-footer {
            margin-top: 1.5rem;
            font-size: 0.75rem;
            color: #64748b;
        }
        @media (max-width: 640px) {
            .release-card {
                padding: 1.5rem 1.4rem;
            }
            .release-item {
                padding: 1rem 1.1rem;
            }
        }
    </style>
</head>
<body class="bg-slate-50 min-h-screen flex flex-col text-slate-800">
    <header class="bg-white border-b border-slate-200/80">
        <div class="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <a href="/dashboard" class="flex items-center gap-3 text-slate-900 no-underline hover:text-primary transition-colors">
                <div class="rounded-xl bg-gradient-to-br from-primary to-accent text-white p-2.5">
                    <span class="text-2xl">🧾</span>
                </div>
                <div>
                    <p class="text-xs font-semibold uppercase tracking-[0.35em] text-primary">Ollama / OpenRouter</p>
                    <h1 class="text-base sm:text-lg font-semibold text-slate-900">项目介绍与版本信息</h1>
                </div>
            </a>
            <div class="flex w-full sm:w-auto flex-wrap items-center justify-start sm:justify-end gap-2 sm:gap-3 text-xs sm:text-sm">
                <a href="/project" class="px-3 py-1 sm:px-4 sm:py-2 rounded-lg border border-primary/20 text-primary hover:bg-primary/10 transition-colors flex items-center gap-1">
                    🧾 <span>项目介绍</span>
                </a>
                <a href="/api-docs" class="px-3 py-1 sm:px-4 sm:py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1">
                    📖 <span>API 文档</span>
                </a>
                <a href="/stats" class="px-3 py-1 sm:px-4 sm:py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors flex items-center gap-1">
                    📊 <span>公开统计</span>
                </a>
                <a href="/dashboard?verify=true" class="px-3 py-1 sm:px-4 sm:py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-700 transition-colors">返回控制台</a>
            </div>
        </div>
    </header>

    <main class="flex-1">
        <div class="max-w-7xl mx-auto px-6 py-10 space-y-10">
            <section class="space-y-6">
                <div class="space-y-4">
                    <span class="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">README 精选 · 最新信息</span>
                    <h2 class="text-3xl sm:text-4xl font-bold text-slate-900">快速了解 API Pool 的能力、版本与最佳实践</h2>
                    <p class="text-sm sm:text-base leading-relaxed text-slate-600 max-w-3xl">
                        页面通过代理实时获取 GitHub 仓库的中英双语 README，并展示最新版本、标签与更新时间。切换语言即可查看对应内容，mermaid 图表将自动渲染，便于团队共享。
                    </p>
                </div>

                <div class="meta-card-grid">
                    <article id="repo-version" class="meta-card">
                        <h3 class="text-sm font-semibold text-slate-900">版本状态</h3>
                        <p class="mt-2 text-xs text-slate-500">正在获取最新版本信息…</p>
                    </article>
                    <article id="repo-updated" class="meta-card">
                        <h3 class="text-sm font-semibold text-slate-900">最近更新</h3>
                        <p class="mt-2 text-xs text-slate-500">加载中…</p>
                    </article>
                    <article id="repo-tags" class="meta-card">
                        <h3 class="text-sm font-semibold text-slate-900">最新标签</h3>
                        <p class="mt-2 text-xs text-slate-500">等待加载标签列表…</p>
                    </article>
                </div>

                <div id="repo-releases" class="release-card">
                    <h3 class="text-sm font-semibold text-slate-900">版本公告</h3>
                    <p class="mt-2 text-xs text-slate-500">正在同步 GitHub Releases…</p>
                </div>

                <div class="flex items-center justify-between flex-wrap gap-4">
                    <div class="lang-switch" role="tablist">
                        <button type="button" class="active" data-lang="zh">简体中文</button>
                        <button type="button" data-lang="en">English</button>
                    </div>
                    <div class="flex items-center gap-3 flex-wrap">
                        <select id="doc-selector" class="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium text-slate-700 bg-white hover:border-primary transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50">
                            <option value="">README (默认)</option>
                            <option value="API_PARAMETERS.md">API 参数说明</option>
                            <option value="CONFIGURATION.md">配置指南</option>
                            <option value="PROVIDER_TOGGLE.md">Provider 开关控制</option>
                            <option value="PROJECT_SUMMARY.md">项目摘要</option>
                            <option value="CHANGELOG.md">更新日志</option>
                            <option value="CONTRIBUTING.md">贡献指南</option>
                            <option value="OPTIMIZATION.md">优化建议</option>
                        </select>
                        <span class="text-xs text-slate-400">实时同步 GitHub 仓库</span>
                    </div>
                </div>
            </section>

            <section>
                <article id="project-content" class="markdown-body">
                    <p style="color:#64748b;">正在加载内容…</p>
                </article>
            </section>
        </div>
    </main>

    <footer class="bg-white border-t border-slate-200 mt-auto">
        <div class="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div class="flex items-center gap-2">
                <span>© ${new Date().getFullYear()} Ollama / OpenRouter API Pool</span>
                <span class="hidden sm:inline text-slate-300">·</span>
                <span>README 来源 <a href="https://github.com/dext7r/ollama-api-pool" target="_blank" rel="noopener" class="text-primary hover:underline">GitHub</a></span>
            </div>
            <div class="flex items-center gap-2">
                <a href="https://github.com/dext7r/ollama-api-pool" target="_blank" rel="noopener" class="flex items-center gap-1 hover:text-primary transition-colors">
                    <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.563 21.8 24 17.302 24 12c0-6.627-5.373-12-12-12z"/></svg>
                    <span>GitHub</span>
                </a>
            </div>
            <div class="italic text-slate-400 tracking-wide">欲买桂花同载酒，终不似，少年游</div>
        </div>
    </footer>

    <script charset="UTF-8" id="LA_COLLECT" src="//sdk.51.la/js-sdk-pro.min.js"></script>
    <script>if (window.LA && typeof window.LA.init === 'function') { LA.init({id:"Ky3jFxCaiJ9zgtRy",ck:"Ky3jFxCaiJ9zgtRy",autoTrack:true,hashMode:true,screenRecord:true}); }</script>
    <script src="/vendor/marked.js"></script>
    <script src="/vendor/mermaid.js"></script>
    <script src="/js/project.js?v=1"></script>
</body>
</html>`;
