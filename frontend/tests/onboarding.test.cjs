const test = require('node:test'),
  assert = require('node:assert/strict');
const fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm'),
  ts = require('typescript'),
  rx = require('rxjs');
class HttpErrorResponse extends Error {
  constructor(status) {
    super('HTTP ' + status);
    this.status = status;
  }
}
function load() {
  const module = { exports: {} };
  const source = ts.transpileModule(
    fs.readFileSync(path.join(__dirname, '../src/app/core/services/onboarding.service.ts'), 'utf8'),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        experimentalDecorators: true,
      },
    },
  ).outputText;
  vm.runInNewContext(source, {
    module,
    exports: module.exports,
    require: (name) =>
      name === 'rxjs'
        ? rx
        : name === '@angular/core'
          ? { Injectable: () => () => {} }
          : { HttpErrorResponse },
  });
  return module.exports;
}
test('new and unfinished profiles require setup, existing profiles keep working', () => {
  const { needsOnboarding } = load();
  assert.equal(needsOnboarding(null), true);
  assert.equal(needsOnboarding({ first_name: 'A' }), true);
  assert.equal(needsOnboarding({ first_name: 'A', location: { city: 'Almaty' } }), false);
  assert.equal(
    needsOnboarding({
      first_name: 'A',
      location: { city: 'Almaty' },
      preferences: { onboarding_step: 3, onboarding_complete: false },
    }),
    true,
  );
  assert.equal(needsOnboarding({ preferences: { onboarding_complete: true } }), false);
});
function harness() {
  const { OnboardingService } = load();
  let session = 'one',
    calls = 0,
    response = () => rx.of({ data: { first_name: 'A', location: { city: 'Almaty' } } });
  const service = new OnboardingService(
    {
      getMe: () => {
        calls++;
        return response();
      },
    },
    {
      sessionId: () => session,
      assertSession: (id) => {
        if (id !== session) throw new Error('Session changed');
      },
    },
  );
  return {
    service,
    calls: () => calls,
    session: (id) => (session = id),
    response: (r) => (response = r),
  };
}
test('completion cache belongs to one login, never to another account', async () => {
  const h = harness();
  assert.equal(await h.service.required(), false);
  assert.equal(await h.service.required(), false);
  assert.equal(h.calls(), 1);
  h.session('two');
  h.response(() => rx.of({ data: {} }));
  assert.equal(await h.service.required(), true);
  assert.equal(h.calls(), 2);
});
test('missing profile starts setup; unavailable server stays retryable', async () => {
  const h = harness();
  h.response(() => rx.throwError(() => new HttpErrorResponse(404)));
  assert.equal(await h.service.required(), true);
  h.response(() => rx.throwError(() => new HttpErrorResponse(503)));
  await assert.rejects(h.service.required(), /HTTP 503/);
  h.response(() => rx.of({ data: { preferences: { onboarding_complete: true } } }));
  assert.equal(await h.service.required(), false);
});
test('unfinished setup is checked again so completion in another tab is observed', async () => {
  const h = harness();
  h.response(() => rx.of({ data: { preferences: { onboarding_step: 2 } } }));
  assert.equal(await h.service.required(), true);
  h.response(() => rx.of({ data: { preferences: { onboarding_complete: true } } }));
  assert.equal(await h.service.required(), false);
});
test('a profile response from a previous account cannot complete another account', async () => {
  const h = harness(),
    pending = new rx.Subject();
  h.response(() => pending);
  const required = h.service.required();
  h.session('two');
  pending.next({ data: { preferences: { onboarding_complete: true } } });
  pending.complete();
  await assert.rejects(required, /Session changed/);
  h.response(() => rx.of({ data: {} }));
  assert.equal(await h.service.required(), true);
});
