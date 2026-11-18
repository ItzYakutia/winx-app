const test = require('node:test'),
  assert = require('node:assert/strict');
const fs = require('node:fs'),
  path = require('node:path'),
  vm = require('node:vm'),
  ts = require('typescript');
class Element {
  constructor(interactive = false) {
    this.interactive = interactive;
    this.clientWidth = 320;
    this.capture = new Set();
  }
  closest() {
    return this.interactive ? this : null;
  }
  setPointerCapture(id) {
    this.capture.add(id);
  }
  hasPointerCapture(id) {
    return this.capture.has(id);
  }
  releasePointerCapture(id) {
    this.capture.delete(id);
  }
}
function card(width = 320) {
  const host = new Element();
  host.clientWidth = width;
  const decorator = () => () => {};
  class EventEmitter {
    constructor() {
      this.values = [];
    }
    emit(value) {
      this.values.push(value);
    }
  }
  const module = { exports: {} };
  const source = ts.transpileModule(
    fs.readFileSync(
      path.join(__dirname, '../src/app/shared/swipe-card/swipe-card.directive.ts'),
      'utf8',
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        experimentalDecorators: true,
      },
    },
  ).outputText;
  const context = vm.createContext({
    Element,
    performance,
    require: () => ({
      Directive: decorator,
      Input: decorator,
      Output: decorator,
      HostBinding: decorator,
      HostListener: decorator,
      EventEmitter,
    }),
    module,
    exports: module.exports,
  });
  vm.runInContext(source, context);
  const directive = new module.exports.SwipeCardDirective({ nativeElement: host });
  const event = (x = 0, y = 0, time = 0, extra = {}) => ({
    isPrimary: true,
    pointerId: 1,
    pointerType: 'touch',
    button: 0,
    clientX: x,
    clientY: y,
    timeStamp: time,
    target: host,
    preventDefault() {},
    stopPropagation() {},
    ...extra,
  });
  const drag = (x, y = 0, duration = 250) => {
    directive.pointerDown(event());
    directive.pointerMove(event(x, y, duration / 2));
    directive.pointerUp(event(x, y, duration));
  };
  return { host, directive, event, drag };
}
test('left and right drags emit one decision and reset visual displacement', () => {
  for (const [distance, direction] of [
    [120, 'right'],
    [-120, 'left'],
  ]) {
    const c = card();
    c.drag(distance);
    assert.deepEqual(c.directive.swiped.values, [direction]);
    assert.equal(c.directive.swipeDrag.values.at(-1), 0);
    assert.equal(c.host.capture.size, 0);
  }
});
test('small movements snap back without making a choice', () => {
  const c = card();
  c.drag(25);
  assert.deepEqual(c.directive.swiped.values, []);
  assert.equal(c.directive.swipeDrag.values.at(-1), 0);
});
test('vertical and diagonal page scrolling never chooses a person', () => {
  for (const [x, y] of [
    [5, 100],
    [50, 120],
    [100, 100],
  ]) {
    const c = card();
    c.drag(x, y);
    assert.deepEqual(c.directive.swiped.values, []);
  }
});
test('a quick deliberate flick can commit below the full distance threshold', () => {
  const c = card();
  c.drag(60, 0, 50);
  assert.deepEqual(c.directive.swiped.values, ['right']);
});
test('threshold scales with card width', () => {
  const narrow = card(250);
  narrow.drag(70);
  assert.equal(narrow.directive.swiped.values.length, 1);
  const wide = card(600);
  wide.drag(70);
  assert.equal(wide.directive.swiped.values.length, 0);
  wide.drag(120);
  assert.equal(wide.directive.swiped.values.length, 1);
});
test('pointer cancellation and loss of card capture reset without a decision', () => {
  for (const cancel of ['cancel', 'lostCapture']) {
    const c = card();
    c.directive.pointerDown(c.event());
    c.directive.pointerMove(c.event(100, 0, 100));
    if (cancel === 'cancel') c.directive.cancel();
    else c.directive.lostCapture({ target: c.host });
    c.directive.pointerUp(c.event(130, 0, 200));
    assert.equal(c.directive.swiped.values.length, 0);
    assert.equal(c.host.capture.size, 0);
  }
});
test('implicit capture leaving a child does not cancel the swipe', () => {
  const c = card();
  c.directive.pointerDown(c.event());
  c.directive.pointerMove(c.event(100, 0, 100));
  c.directive.lostCapture({ target: new Element() });
  c.directive.pointerUp(c.event(130, 0, 200));
  assert.deepEqual(c.directive.swiped.values, ['right']);
});
test('disabled card, secondary pointer and right mouse button are ignored', () => {
  for (const extra of [{ isPrimary: false }, { pointerType: 'mouse', button: 2 }]) {
    const c = card();
    c.directive.pointerDown(c.event(0, 0, 0, extra));
    c.directive.pointerMove(c.event(140, 0, 100));
    c.directive.pointerUp(c.event(140, 0, 200));
    assert.equal(c.directive.swiped.values.length, 0);
  }
  const c = card();
  c.directive.swipeDisabled = true;
  c.drag(140);
  assert.equal(c.directive.swiped.values.length, 0);
});
test('disabling mid-gesture clears capture without submitting', () => {
  const c = card();
  c.directive.pointerDown(c.event());
  c.directive.pointerMove(c.event(100, 0, 100));
  c.directive.swipeDisabled = true;
  c.directive.ngOnChanges();
  c.directive.pointerUp(c.event(140, 0, 200));
  assert.equal(c.directive.swiped.values.length, 0);
  assert.equal(c.host.capture.size, 0);
});
test('nested interactive controls keep their normal click behavior', () => {
  const c = card();
  c.directive.pointerDown(c.event(0, 0, 0, { target: new Element(true) }));
  c.directive.pointerMove(c.event(140, 0, 100));
  c.directive.pointerUp(c.event(140, 0, 200));
  assert.equal(c.directive.swiped.values.length, 0);
});
test('keyboard arrows work on the card and ignore nested controls and repeat events', () => {
  const c = card(),
    key = (key, extra = {}) => ({
      key,
      target: c.host,
      repeat: false,
      preventDefault() {},
      ...extra,
    });
  c.directive.keydown(key('ArrowRight'));
  c.directive.keydown(key('ArrowLeft'));
  c.directive.keydown(key('ArrowRight', { repeat: true }));
  c.directive.keydown(key('ArrowLeft', { target: new Element(true) }));
  assert.deepEqual(c.directive.swiped.values, ['right', 'left']);
});
