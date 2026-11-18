const test = require('node:test'),
  assert = require('node:assert/strict');
const fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm');
const ts = require('typescript'),
  rx = require('rxjs');
const storage = () => {
  const m = new Map();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
  };
};
class HttpErrorResponse extends Error {
  constructor(v) {
    super('HTTP ' + v.status);
    Object.assign(this, v);
  }
}
const success = () => ({
  data: { access_token: 'renewed', refresh_token: 'renewed-refresh', expires_in: 3600 },
});
const rejected = (status) => rx.throwError(() => new HttpErrorResponse({ status }));
function deferred() {
  let resolve;
  const promise = new Promise((r) => (resolve = r));
  return { promise, resolve };
}
function harness(
  initial = {
    id: 'a',
    access: 'old',
    refresh: 'refresh-a',
    expiresAt: null,
    email: 'a@example.test',
  },
) {
  const localStorage = storage(),
    sessionStorage = storage();
  if (initial) localStorage.setItem('winx_auth', JSON.stringify(initial));
  const calls = [],
    navigations = [],
    listeners = new Map();
  const h = {
    localStorage,
    sessionStorage,
    calls,
    navigations,
    reloads: 0,
    handle: () => rx.of({}),
  };
  class HttpClient {
    constructor(backend) {
      this.backend = backend;
    }
    post(url, body, options = {}) {
      return rx.defer(() => {
        const call = { url, body, ...options };
        calls.push(call);
        return this.backend.handle(call);
      });
    }
  }
  // Stub browser/Angular primitives; run the actual session and recovery code.
  const context = vm.createContext({
    console,
    URL,
    crypto: globalThis.crypto,
    localStorage,
    sessionStorage,
    navigator: {},
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    window: {
      location: { origin: 'http://localhost:4200', reload: () => h.reloads++ },
      addEventListener: (name, fn) => listeners.set(name, [...(listeners.get(name) || []), fn]),
      removeEventListener: () => {},
    },
  });
  const root = path.resolve(__dirname, '../src/app'),
    cache = new Map();
  function load(relative) {
    const filename = path.resolve(root, relative);
    if (cache.has(filename)) return cache.get(filename);
    const module = { exports: {} };
    const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        experimentalDecorators: true,
      },
    }).outputText;
    const localRequire = (name) => {
      if (name === '@angular/core')
        return {
          Injectable: () => (target) => target,
          signal: (value) => {
            const read = () => value;
            read.set = (next) => (value = next);
            return read;
          },
          inject: () => h.auth,
        };
      if (name === '@angular/common/http') return { HttpClient, HttpErrorResponse };
      if (name === 'rxjs') return rx;
      if (name.startsWith('.'))
        return load(path.relative(root, path.resolve(path.dirname(filename), name + '.ts')));
      throw new Error('Unexpected import ' + name);
    };
    vm.runInContext('(function(require,module,exports){' + source + '\n})', context, { filename })(
      localRequire,
      module,
      module.exports,
    );
    cache.set(filename, module.exports);
    return module.exports;
  }
  h.storage = load('core/services/auth-session.ts');
  h.auth = new (load('core/services/auth.service.ts').AuthService)(
    { handle: (call) => h.handle(call) },
    {
      url: '/team/profile',
      navigate: (commands, options) => {
        navigations.push({ commands, options });
        return Promise.resolve(true);
      },
    },
    { run: (action) => action() },
  );
  h.interceptor = load('core/interceptors/auth.interceptor.ts').authInterceptor;
  h.fireStorage = () => {
    for (const fn of listeners.get('storage') || []) fn({ key: 'winx_auth' });
  };
  h.snapshot = () => JSON.parse(localStorage.getItem('winx_auth'));
  return h;
}
function request(url = '/api/v1/profile/me', authorization) {
  return {
    url,
    headers: {
      has: (name) => name.toLowerCase() === 'authorization' && !!authorization,
      get: () => authorization,
    },
    clone: ({ setHeaders }) => request(url, setHeaders.Authorization),
  };
}
test('migration writes one session and logout tombstone rejects stale legacy tokens', () => {
  const h = harness(null);
  h.localStorage.setItem('winx_access_token', 'legacy');
  h.localStorage.setItem('winx_refresh_token', 'refresh');
  assert.equal(h.storage.readAuthSession().access, 'legacy');
  assert.equal(h.localStorage.getItem('winx_access_token'), null);
  h.storage.saveAuthSession(h.storage.emptySession());
  h.localStorage.setItem('winx_access_token', 'stale');
  assert.equal(h.storage.readAuthSession().id, null);
  assert.equal(h.localStorage.getItem('winx_access_token'), null);
});
test('corrupt or placeholder tokens never count as a session', () => {
  const h = harness(null);
  for (const raw of ['broken', 'null', '{"access":"undefined","refresh":"null"}']) {
    h.localStorage.setItem('winx_auth', raw);
    assert.equal(h.storage.readAuthSession().id, null);
  }
});
test('blocked persistent storage falls back to tab storage', () => {
  const h = harness(null);
  h.localStorage.setItem = () => {
    throw new Error('Blocked');
  };
  assert.equal(h.storage.saveAuthSession({ id: 'fallback', access: 'a', refresh: 'r' }), true);
  assert.equal(h.storage.readAuthSession().access, 'a');
});
test('return URLs accept app routes and reject outside destinations and auth loops', () => {
  const { storage: s } = harness();
  for (const url of [
    '/team/teams?course=2',
    '/team/chats',
    '/team/chats/12',
    '/chats/12',
    '/profile',
  ])
    assert.equal(s.safeReturnUrl(url), url);
  for (const url of [
    '//evil.test',
    'https://evil.test',
    'javascript:alert(1)',
    '/login',
    '/register',
    '/\\evil.test',
    '/team/other',
  ])
    assert.equal(s.safeReturnUrl(url), null);
});
test('parallel 401s share one refresh and retry with renewed access', async () => {
  const h = harness(),
    pending = deferred();
  h.handle = () => rx.from(pending.promise);
  const next = (req) =>
    req.headers.get() === 'Bearer renewed' ? rx.of({ ok: true }) : rejected(401);
  const results = Array.from({ length: 4 }, () =>
    rx.firstValueFrom(h.interceptor(request(), next)),
  );
  assert.equal(h.calls.length, 1);
  pending.resolve(success());
  await Promise.all(results);
  assert.equal(h.auth.getToken(), 'renewed');
  assert.equal(h.snapshot().refresh, 'renewed-refresh');
});
test('a late old 401 reuses access already refreshed by another request', async () => {
  const h = harness();
  h.handle = () => rx.of(success());
  const slow = new rx.Subject();
  const first = rx.firstValueFrom(
    h.interceptor(request('/api/v1/slow'), (req) =>
      req.headers.get() === 'Bearer renewed' ? rx.of({}) : slow,
    ),
  );
  await rx.firstValueFrom(
    h.interceptor(request(), (req) =>
      req.headers.get() === 'Bearer renewed' ? rx.of({}) : rejected(401),
    ),
  );
  slow.error(new HttpErrorResponse({ status: 401 }));
  await first;
  assert.equal(h.calls.length, 1);
});
test('known expiry refreshes before a protected request is sent', async () => {
  const h = harness({ id: 'a', access: 'old', refresh: 'r', expiresAt: Date.now() - 1 });
  h.handle = () => rx.of(success());
  await rx.firstValueFrom(
    h.interceptor(request(), (req) => {
      assert.equal(req.headers.get(), 'Bearer renewed');
      return rx.of({});
    }),
  );
  assert.equal(h.calls.length, 1);
});
test('invalid refresh clears credentials and remembers the route for sign-in', async () => {
  const h = harness();
  h.handle = () => rejected(401);
  await assert.rejects(rx.firstValueFrom(h.interceptor(request(), () => rejected(401))), {
    status: 401,
  });
  assert.equal(h.auth.isLoggedIn(), false);
  assert.equal(h.snapshot().refresh, null);
  assert.equal(h.navigations[0].options.queryParams.returnUrl, '/team/profile');
  assert.equal(h.navigations[0].options.queryParams.reason, 'expired');
});
test('a rejected retry logs out once without looping refresh', async () => {
  const h = harness();
  h.handle = () => rx.of(success());
  await assert.rejects(rx.firstValueFrom(h.interceptor(request(), () => rejected(401))), {
    status: 401,
  });
  assert.equal(h.calls.length, 1);
  assert.equal(h.auth.isLoggedIn(), false);
});
test('temporary network/server failure keeps credentials for retry', async () => {
  for (const status of [0, 503]) {
    const h = harness();
    h.handle = () => rejected(status);
    await assert.rejects(rx.firstValueFrom(h.interceptor(request(), () => rejected(401))), {
      status,
    });
    assert.equal(h.auth.getToken(), 'old');
    assert.equal(h.navigations.length, 0);
  }
});
test('access-only refresh retains the current refresh credential', async () => {
  const h = harness();
  h.handle = () => rx.of({ data: { access_token: 'new', expires_in: 3600 } });
  await rx.firstValueFrom(h.auth.refreshSession());
  assert.equal(h.snapshot().refresh, 'refresh-a');
});
test('logout is immediate and a late refresh cannot revive the session', async () => {
  const h = harness(),
    pending = deferred();
  h.handle = (call) => (call.url.endsWith('/refresh') ? rx.from(pending.promise) : rx.of({}));
  const refresh = rx.firstValueFrom(h.auth.refreshSession());
  h.auth.logout();
  assert.equal(h.auth.isLoggedIn(), false);
  assert.equal(h.snapshot().access, null);
  pending.resolve(success());
  await assert.rejects(refresh, { name: 'SessionChangedError' });
  await new Promise((done) => setImmediate(done));
  assert.equal(h.snapshot().access, null);
  assert.ok(
    h.calls.some((c) => c.url.endsWith('/logout') && c.headers.Authorization === 'Bearer renewed'),
  );
});
test('stale account responses cannot enter the next account', async () => {
  const h = harness(),
    pending = new rx.Subject(),
    result = rx.firstValueFrom(h.interceptor(request(), () => pending));
  h.localStorage.setItem(
    'winx_auth',
    JSON.stringify({ id: 'b', access: 'b-access', refresh: 'b-refresh' }),
  );
  h.fireStorage();
  pending.next({ privateData: 'a' });
  await assert.rejects(result, { name: 'SessionChangedError' });
  assert.equal(h.auth.getToken(), 'b-access');
  assert.equal(h.reloads, 1);
});
test('logout in another tab opens sign-in in this tab', () => {
  const h = harness();
  h.localStorage.setItem('winx_auth', JSON.stringify(h.storage.emptySession()));
  h.fireStorage();
  assert.equal(h.auth.isLoggedIn(), false);
  assert.equal(h.navigations[0].options.queryParams.reason, 'signed-out');
});
test('ordinary 403 does not refresh or clear credentials', async () => {
  const h = harness();
  await assert.rejects(rx.firstValueFrom(h.interceptor(request(), () => rejected(403))), {
    status: 403,
  });
  assert.equal(h.calls.length, 0);
  assert.equal(h.auth.isLoggedIn(), true);
});
test('external URLs, explicit authorization and auth forms are not rewritten', async () => {
  const h = harness();
  for (const req of [
    request('https://example.test/api/v1/private'),
    request('/api/v1/private', 'Bearer explicit'),
    request('/api/v1/login'),
  ]) {
    assert.equal(await rx.firstValueFrom(h.interceptor(req, (sent) => rx.of(sent))), req);
  }
  assert.equal(h.calls.length, 0);
});
