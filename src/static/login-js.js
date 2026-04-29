/**
 * Login.js 静态文件内容
 */

export const loginJs = `const ADMIN_STORAGE_KEY = 'adminToken';
const USER_SESSION_KEY = 'userSessionToken';
const USER_PROFILE_KEY = 'userProfile';
const USER_API_KEY_KEY = 'userApiKey';
const PROJECT_START_DISPLAY = '2025-10-09';
const PROJECT_START_DATE = new Date('2025-10-09T00:00:00+08:00');
const TURNSTILE_SITE_KEY_PLACEHOLDER = '__TURNSTILE_SITE_KEY_PLACEHOLDER__';
const TURNSTILE_SITE_KEY_RAW = '{{TURNSTILE_SITE_KEY}}' || TURNSTILE_SITE_KEY_PLACEHOLDER;
const TURNSTILE_SITE_KEY = TURNSTILE_SITE_KEY_RAW === TURNSTILE_SITE_KEY_PLACEHOLDER ? '' : TURNSTILE_SITE_KEY_RAW;
const TURNSTILE_ENABLED_RAW = '{{TURNSTILE_ENABLED}}';
const TURNSTILE_ENABLED = TURNSTILE_ENABLED_RAW === 'true';
const HAS_TURNSTILE = TURNSTILE_ENABLED && Boolean(TURNSTILE_SITE_KEY);

const loginForm = $('#login-form');
const tokenInput = $('#admin-token');
const rememberMe = $('#remember-me');
const startLogin = $('#start-login');
const introSection = $('#intro-section');
const togglePassword = $('#toggle-password');
const eyeIcon = $('#eye-icon');
const eyeOffIcon = $('#eye-off-icon');
const authTabButtons = $('[data-auth-tab]');
const adminPanel = $('#admin-auth-panel');
const userPanel = $('#user-auth-panel');
const userTabButtons = $('[data-user-tab]');
const loginModeButtons = $('[data-login-mode]');
const loginModeTabs = $('#login-mode-tabs');
const userLoginForm = $('#user-login-form');
const userRegisterForm = $('#user-register-form');
const sendCodeButtons = $('.send-code-btn');
const providerSelects = $('.user-provider-select');
const userLoginCodeInput = $('#user-login-code');
const userLoginPasswordInput = $('#user-login-password');
const codeModeSection = $('[data-mode-section=\"code\"]');
const passwordModeSection = $('[data-mode-section=\"password\"]');
const loginSendCodeButton = $('#login-send-code');

const providerOptions = [
    { value: 'ollama', label: 'Ollama' },
    { value: 'openrouter', label: 'OpenRouter' }
];

let currentLoginMode = 'code';

const turnstileQueues = {};
const turnstileWidgets = {};
window.__turnstileWidgets = turnstileWidgets;
window.__turnstileQueues = turnstileQueues;

function updateFooterTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeStr = year + '年' + month + '月' + day + '日 ' + hours + ':' + minutes + ':' + seconds;
    $('#footer-time').text(timeStr);

    if (!Number.isNaN(PROJECT_START_DATE.getTime())) {
        let diffMs = now.getTime() - PROJECT_START_DATE.getTime();
        if (diffMs < 0) diffMs = 0;
        const totalMinutes = Math.floor(diffMs / 60000);
        const days = Math.floor(totalMinutes / 1440);
        const hoursDiff = Math.floor((totalMinutes % 1440) / 60);
        const minutesDiff = totalMinutes % 60;
        $('#project-launch-date').text(PROJECT_START_DISPLAY);
        $('#project-runtime').text(days + ' 天 ' + hoursDiff + ' 小时 ' + minutesDiff + ' 分钟');
    }
}
updateFooterTime();
setInterval(updateFooterTime, 1000);

function showToast(message, type) {
    const colors = { success: 'from-emerald-500 to-green-500', error: 'from-rose-500 to-red-500', info: 'from-indigo-500 to-primary' };
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = $('<div>').addClass('transform transition-all duration-300 translate-x-full opacity-0')
        .html('<div class="flex items-center gap-3 text-white px-4 py-3 rounded-2xl shadow-lg bg-gradient-to-r ' + (colors[type] || colors.info) + '">' +
            '<span class="text-lg">' + (icons[type] || icons.info) + '</span><span class="text-sm">' + message + '</span></div>');
    $('#toast-container').append(toast);
    setTimeout(function () { toast.removeClass('translate-x-full opacity-0').addClass('translate-x-0 opacity-100'); }, 10);
    setTimeout(function () {
        toast.addClass('translate-x-full opacity-0');
        setTimeout(function () { toast.remove(); }, 300);
    }, 3800);
}

var EMAIL_REGEX = /^[a-z0-9]+([._%+-][a-z0-9]+)*@([a-z0-9-]+\.)+[a-z]{2,}$/i;

function isValidEmail(email) {
    return EMAIL_REGEX.test(email);
}

function setAuthTabActive(tab) {
    authTabButtons.each(function () {
        const btn = $(this);
        const target = btn.data('auth-tab');
        if (target === tab) {
            btn.addClass('auth-tab-active bg-white text-slate-900 shadow-md font-semibold')
               .removeClass('text-slate-500 hover:text-slate-800 bg-transparent shadow-none');
        } else {
            btn.removeClass('auth-tab-active bg-white text-slate-900 shadow-md font-semibold')
               .addClass('text-slate-500 hover:text-slate-800 bg-transparent shadow-none');
        }
    });
    if (tab === 'admin') {
        adminPanel.removeClass('hidden');
        userPanel.addClass('hidden');
    } else {
        userPanel.removeClass('hidden');
        adminPanel.addClass('hidden');
    }
}

function setUserTab(tab) {
    if (tab !== 'register') {
        tab = 'login';
    }
    userTabButtons.each(function () {
        const btn = $(this);
        const target = btn.data('user-tab');
        if (target === tab) {
            btn.addClass('user-tab-active bg-slate-900 text-white shadow-md font-semibold')
               .removeClass('text-slate-500 hover:text-slate-800 bg-transparent shadow-none');
        } else {
            btn.removeClass('user-tab-active bg-slate-900 text-white shadow-md font-semibold')
               .addClass('text-slate-500 hover:text-slate-800 bg-transparent shadow-none');
        }
    });
    if (tab === 'login') {
        userLoginForm.removeClass('hidden');
        userRegisterForm.addClass('hidden');
        loginModeTabs.removeClass('hidden');
    } else {
        userRegisterForm.removeClass('hidden');
        userLoginForm.addClass('hidden');
        loginModeTabs.addClass('hidden');
    }
}

function setLoginMode(mode) {
    if (mode !== 'password') {
        mode = 'code';
    }
    currentLoginMode = mode;
    loginModeButtons.each(function () {
        const btn = $(this);
        const target = btn.data('login-mode');
        if (target === mode) {
            btn.addClass('bg-slate-900 text-white shadow-md font-semibold')
               .removeClass('text-slate-500 hover:text-slate-800 bg-transparent shadow-none');
        } else {
            btn.removeClass('bg-slate-900 text-white shadow-md font-semibold')
               .addClass('text-slate-500 hover:text-slate-800 bg-transparent shadow-none');
        }
    });
    if (mode === 'code') {
        codeModeSection.removeClass('hidden');
        passwordModeSection.addClass('hidden');
        userLoginPasswordInput.val('');
    } else {
        passwordModeSection.removeClass('hidden');
        codeModeSection.addClass('hidden');
        userLoginCodeInput.val('');
        if (loginSendCodeButton.length) {
            resetCountdown(loginSendCodeButton);
        }
    }
}

function renderProviderOptions() {
    providerSelects.each(function () {
        const select = $(this);
        select.empty();
        providerOptions.forEach(function (item) {
            const option = $('<option>').attr('value', item.value).text(item.label);
            select.append(option);
        });
    });
}

function resetCountdown(button) {
    const timer = button.data('timer');
    if (timer) {
        clearInterval(timer);
        button.removeData('timer');
    }
    const originalText = button.data('original-text') || '获取验证码';
    button.text(originalText);
    button.prop('disabled', false).removeClass('opacity-60 cursor-not-allowed');
}

function startCountdown(button, seconds) {
    resetCountdown(button);
    const originalText = button.data('original-text') || button.text().trim() || '获取验证码';
    button.data('original-text', originalText);
    let remaining = seconds;
    button.text(remaining + 's');
    button.prop('disabled', true).addClass('opacity-60 cursor-not-allowed');
    const timer = setInterval(function () {
        remaining -= 1;
        if (remaining <= 0) {
            resetCountdown(button);
        } else {
            button.text(remaining + 's');
        }
    }, 1000);
    button.data('timer', timer);
}

function ensureTurnstileReady() {
    if (!HAS_TURNSTILE) return true;
    if (typeof window.turnstile === 'undefined') {
        showToast('Turnstile 正在初始化，请稍后重试', 'error');
        return false;
    }
    if (typeof window.initTurnstileWidgets === 'function') {
        window.initTurnstileWidgets();
    }
    return true;
}

function requestTurnstileToken(widgetKey, action) {
    if (!HAS_TURNSTILE) return Promise.resolve('');
    if (!ensureTurnstileReady()) {
        return Promise.reject(new Error('Turnstile 尚未就绪'));
    }
    const existingId = turnstileWidgets[widgetKey];
    if (!existingId) {
        return Promise.reject(new Error('Turnstile 未找到对应控件'));
    }
    if (!turnstileQueues[widgetKey]) {
        turnstileQueues[widgetKey] = [];
    }
    return new Promise(function (resolve, reject) {
        turnstileQueues[widgetKey].push({ resolve, reject });
        try {
            window.turnstile.execute(existingId, action ? { action: action } : {});
        } catch (error) {
            turnstileQueues[widgetKey].pop();
            reject(error);
        }
    });
}

window.initTurnstileWidgets = function () {
    if (!HAS_TURNSTILE) return;
    if (typeof window.turnstile === 'undefined') return;
    const mapping = {
        login: document.getElementById('turnstile-login'),
        common: document.getElementById('turnstile-common')
    };
    Object.keys(mapping).forEach(function (key) {
        const container = mapping[key];
        if (!container) return;
        if (turnstileWidgets[key]) return;
        turnstileQueues[key] = [];
        turnstileWidgets[key] = window.turnstile.render(container, {
            sitekey: TURNSTILE_SITE_KEY,
            appearance: 'execute',
            execution: 'execute',
            callback: function (token) {
                const queue = turnstileQueues[key];
                if (queue && queue.length) {
                    const item = queue.shift();
                    item.resolve(token);
                }
                window.turnstile.reset(turnstileWidgets[key]);
            },
            'error-callback': function () {
                const queue = turnstileQueues[key];
                if (queue && queue.length) {
                    const item = queue.shift();
                    item.reject(new Error('Turnstile 验证失败，请刷新后再尝试'));
                }
                window.turnstile.reset(turnstileWidgets[key]);
            },
            'expired-callback': function () {
                const queue = turnstileQueues[key];
                if (queue && queue.length) {
                    const item = queue.shift();
                    item.reject(new Error('Turnstile 验证已过期，请重试'));
                }
                window.turnstile.reset(turnstileWidgets[key]);
            }
        });
    });
};

function persistUserSession(data, remember) {
    const storage = remember ? localStorage : sessionStorage;
    const other = remember ? sessionStorage : localStorage;
    storage.setItem(USER_SESSION_KEY, data.token);
    other.removeItem(USER_SESSION_KEY);
    if (data.user) {
        storage.setItem(USER_PROFILE_KEY, JSON.stringify(data.user));
        other.removeItem(USER_PROFILE_KEY);
        if (data.user.keyToken) {
            storage.setItem(USER_API_KEY_KEY, data.user.keyToken);
        } else {
            storage.removeItem(USER_API_KEY_KEY);
        }
        other.removeItem(USER_API_KEY_KEY);
    }
}

function formatDateTime(value) {
    if (!value) return '--';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '--';
    return date.getFullYear() + '-' +
        String(date.getMonth() + 1).padStart(2, '0') + '-' +
        String(date.getDate()).padStart(2, '0') + ' ' +
        String(date.getHours()).padStart(2, '0') + ':' +
        String(date.getMinutes()).padStart(2, '0');
}

function handleUserAuthSuccess(data, options) {
    const remember = options && options.remember === true;
    persistUserSession(data, remember);
    showToast((options && options.message) || '操作成功', 'success');
    setTimeout(function () {
        window.location.href = '/user';
    }, 200);
}

function loadStoredUser() {
    const token = localStorage.getItem(USER_SESSION_KEY) || sessionStorage.getItem(USER_SESSION_KEY);
    if (token) {
        window.location.href = '/user';
    }
}

startLogin.on('click', function () {
    introSection.addClass('hidden');
    loginForm.removeClass('hidden');
    tokenInput.trigger('focus');
});

togglePassword.on('click', function () {
    const isPassword = tokenInput.attr('type') === 'password';
    tokenInput.attr('type', isPassword ? 'text' : 'password');
    eyeIcon.toggleClass('hidden', isPassword);
    eyeOffIcon.toggleClass('hidden', !isPassword);
});

const savedToken = localStorage.getItem(ADMIN_STORAGE_KEY) || sessionStorage.getItem(ADMIN_STORAGE_KEY);
if (savedToken) window.location.href = '/dashboard?verify=true';

loginForm.on('submit', async function (e) {
    e.preventDefault();
    const token = tokenInput.val().trim();
    if (!token) {
        showToast('请输入管理员 Token', 'error');
        return;
    }
    const btn = loginForm.find('button[type="submit"]');
    btn.prop('disabled', true).addClass('opacity-70').text('登录中...');
    try {
        const res = await fetch('/admin/verify', { headers: { Authorization: 'Bearer ' + token } });
        if (!res.ok) {
            showToast(res.status === 401 || res.status === 403 ? 'Token 无效' : '登录失败', 'error');
            return;
        }
        if (rememberMe.is(':checked')) localStorage.setItem(ADMIN_STORAGE_KEY, token);
        else sessionStorage.setItem(ADMIN_STORAGE_KEY, token);
        showToast('登录成功', 'success');
        setTimeout(function () { window.location.href = '/dashboard?verify=true'; }, 400);
    } catch (err) {
        showToast('网络异常', 'error');
    } finally {
        btn.prop('disabled', false).removeClass('opacity-70').text('进入控制台');
    }
});

authTabButtons.on('click', function () {
    const tab = $(this).data('auth-tab');
    setAuthTabActive(tab);
});

loginModeButtons.on('click', function () {
    const mode = $(this).data('login-mode');
    setLoginMode(mode);
});

userLoginCodeInput.on('input', function () {
    const value = $(this).val();
    if (typeof value === 'string' && value.trim().length > 0) {
        userLoginPasswordInput.val('');
    }
});

userLoginPasswordInput.on('input', function () {
    const value = $(this).val();
    if (typeof value === 'string' && value.trim().length > 0) {
        userLoginCodeInput.val('');
    }
});

sendCodeButtons.on('click', async function () {
    const btn = $(this);
    const targetSelector = btn.data('target');
    const purpose = btn.data('purpose') || 'login';
    const emailInput = $(targetSelector);
    const email = emailInput.val() ? String(emailInput.val()).trim() : '';

    if (!email) {
        showToast('请先填写邮箱地址', 'error');
        return;
    }
    if (!isValidEmail(email)) {
        showToast('请输入有效的邮箱地址', 'error');
        return;
    }
    resetCountdown(btn);
    btn.text('发送中...');
    btn.prop('disabled', true).addClass('opacity-70');
    try {
        const turnstileAction = purpose === 'register' ? 'send_register_code' : 'send_login_code';
        const turnstileToken = await requestTurnstileToken('common', turnstileAction);
        const response = await fetch('/api/auth/send-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, purpose: purpose, turnstileToken: turnstileToken })
        });
        const result = await response.json().catch(function () { return null; });
        if (!response.ok) {
            const errorMsg = result && result.error ? result.error : '验证码发送失败';
            if (purpose === 'login' && errorMsg.includes('未注册')) {
                showToast('该邮箱未注册，请点击"快速注册"标签进行注册', 'error');
            } else {
                showToast(errorMsg, 'error');
            }
            btn.prop('disabled', false).removeClass('opacity-70');
            btn.text(btn.data('original-text') || '获取验证码');
            return;
        }
        showToast('验证码已发送，请检查邮箱', 'success');
        startCountdown(btn, 60);
    } catch (error) {
        showToast(error && error.message ? error.message : '验证码发送失败', 'error');
        btn.prop('disabled', false).removeClass('opacity-70');
        btn.text(btn.data('original-text') || '获取验证码');
    }
});

userLoginForm.on('submit', async function (e) {
    e.preventDefault();
    const email = $('#user-login-email').val() ? String($('#user-login-email').val()).trim() : '';
    const code = $('#user-login-code').val() ? String($('#user-login-code').val()).trim() : '';
    const password = $('#user-login-password').val() ? String($('#user-login-password').val()) : '';
    const provider = $('#user-login-provider').val() || 'ollama';
    const remember = $('#user-login-remember').is(':checked');
    if (!email) {
        showToast('请输入邮箱地址', 'error');
        return;
    }
    if (!isValidEmail(email)) {
        showToast('请输入有效的邮箱地址', 'error');
        return;
    }
    if (currentLoginMode === 'code') {
        if (!code) {
            showToast('请输入邮箱验证码', 'error');
            return;
        }
    } else if (!password) {
        showToast('请输入邮箱密码', 'error');
        return;
    }
    const submitBtn = userLoginForm.find('button[type="submit"]');
    submitBtn.prop('disabled', true).addClass('opacity-70').text('登录中...');
    try {
        const turnstileAction = currentLoginMode === 'password' ? 'login_password' : 'login_code';
        const turnstileToken = await requestTurnstileToken('login', turnstileAction);
        const payload = { email: email, provider: provider, turnstileToken: turnstileToken };
        if (currentLoginMode === 'password') {
            payload.password = password;
        } else {
            payload.code = code;
        }
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json().catch(function () { return null; });
        if (!response.ok) {
            showToast(result && result.error ? result.error : '登录失败', 'error');
            return;
        }
        handleUserAuthSuccess(result, { remember: remember, message: '登录成功' });
    } catch (error) {
        showToast(error && error.message ? error.message : '登录失败', 'error');
    } finally {
        submitBtn.prop('disabled', false).removeClass('opacity-70').text('登录账户');
    }
});

userTabButtons.on('click', function () {
    const tab = $(this).data('user-tab');
    setUserTab(tab);
});

userRegisterForm.on('submit', async function (e) {
    e.preventDefault();
    const email = $('#user-register-email').val() ? String($('#user-register-email').val()).trim() : '';
    const code = $('#user-register-code').val() ? String($('#user-register-code').val()).trim() : '';
    const password = $('#user-register-password').val() ? String($('#user-register-password').val()) : '';
    const passwordConfirm = $('#user-register-password-confirm').val() ? String($('#user-register-password-confirm').val()) : '';
    const provider = $('#user-register-provider').val() || 'ollama';
    const remember = $('#user-register-remember').is(':checked');

    if (!email) {
        showToast('请输入邮箱地址', 'error');
        return;
    }
    if (!isValidEmail(email)) {
        showToast('请输入有效的邮箱地址', 'error');
        return;
    }
    if (!code) {
        showToast('请输入邮箱验证码', 'error');
        return;
    }
    if (!password) {
        showToast('请设置密码', 'error');
        return;
    }
    if (password.length < 6) {
        showToast('密码至少需要 6 位字符', 'error');
        return;
    }
    if (password !== passwordConfirm) {
        showToast('两次输入的密码不一致', 'error');
        return;
    }

    const submitBtn = userRegisterForm.find('button[type="submit"]');
    submitBtn.prop('disabled', true).addClass('opacity-70').text('注册中...');

    try {
        const turnstileToken = await requestTurnstileToken('register', 'register');
        const payload = {
            email: email,
            code: code,
            password: password,
            provider: provider,
            turnstileToken: turnstileToken
        };

        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json().catch(function () { return null; });

        if (!response.ok) {
            showToast(result && result.error ? result.error : '注册失败', 'error');
            return;
        }

        handleUserAuthSuccess(result, { remember: remember, message: '注册成功' });
    } catch (error) {
        showToast(error && error.message ? error.message : '注册失败', 'error');
    } finally {
        submitBtn.prop('disabled', false).removeClass('opacity-70').text('创建账户');
    }
});

setAuthTabActive('admin');
setUserTab('login');
setLoginMode('code');
renderProviderOptions();
loadStoredUser();
if (HAS_TURNSTILE && typeof window.initTurnstileWidgets === 'function') {
    window.initTurnstileWidgets();
}
`;
