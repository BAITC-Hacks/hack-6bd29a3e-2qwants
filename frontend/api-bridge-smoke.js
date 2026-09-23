// Запуск из корня: jsc frontend/api-bridge-smoke.js
class FakeNode {
  constructor(tag = 'div') {
    this.tagName = tag; this.children = []; this.dataset = {}; this.textContent = ''; this.attributes = {}; this.events = {}; this.clientWidth = 320;
    const classes = new Set();
    this.classList = {add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name), toggle: (name, force) => { if (force === undefined ? !classes.has(name) : force) classes.add(name); else classes.delete(name); }};
  }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = [...children]; this.textContent = ''; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  addEventListener(name, handler) { this.events[name] = handler; }
  focus() {}
  scrollIntoView() {}
  scrollBy() {}
  click() { this.events.click?.({preventDefault() {}}); }
}

const nodes = {'#history-panel': new FakeNode()};
nodes['#history-panel'].hidden = true;
const ru = new FakeNode('button'); ru.dataset.lang = 'ru';
const kz = new FakeNode('button'); kz.dataset.lang = 'kz';
const document = {
  body: new FakeNode('body'), documentElement: {lang: 'ru'},
  querySelector(selector) { return nodes[selector] ||= new FakeNode(); },
  querySelectorAll(selector) { return selector === '[data-lang]' ? [ru, kz] : []; },
  createElement(tag) { return new FakeNode(tag); },
  createElementNS(namespace, tag) { return new FakeNode(tag); },
  addEventListener() {}
};
const storage = new Map();
const sessionStorage = {getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value)};
const window = {location: {hash: ''}, sessionStorage, confirm: () => true};
const location = {protocol: 'http:'};
const crypto = {randomUUID: () => 'bridge-smoke-session'};
const catalog = JSON.parse(readFile('backend/data/products.json'));
const serverCart = [];
const calls = [];
let pending;

function fetch(path, options = {}) {
  calls.push({path, body: options.body});
  let body;
  if (path === '/static/backend-catalog.json') body = catalog;
  else if (path.startsWith('/api/cart/bridge-smoke-session')) body = {items: serverCart, total: serverCart.reduce((sum, item) => sum + item.price * item.quantity, 0)};
  else if (path === '/api/chat') {
    const request = JSON.parse(options.body);
    if (request.message.startsWith('Добавь')) {
      pending = {sku: 'EK-VA4729-C16', quantity: Number(request.message.match(/\d+/)[0])};
      body = {message: 'Подтвердите добавление', requires_confirmation: true};
    } else if (request.message === 'да, добавь') {
      body = {message: 'Подтверждено', action: {type: 'confirm_add', ...pending}};
    } else body = {message: 'Ответ backend', products: [catalog[0]]};
  } else if (path === '/api/cart/confirm') {
    const request = JSON.parse(options.body);
    serverCart.push({sku: request.sku, name: catalog[0].name, price: catalog[0].price, quantity: request.quantity});
    body = {message: 'Товар добавлен в корзину.'};
  } else throw Error('Неожиданный запрос: ' + path);
  return Promise.resolve({ok: true, json: () => Promise.resolve(body)});
}

const scripts = readFile('frontend/demo.js') + '\n' + readFile('frontend/api-bridge.js');
const bridge = new Function('document', 'window', 'sessionStorage', 'location', 'crypto', 'fetch', 'FormData', scripts + '\nreturn {products,state,send,prepareAdd,confirmAdd};')(document, window, sessionStorage, location, crypto, fetch, class {});

drainMicrotasks();
if (bridge.products.length !== catalog.length || !nodes['.demo-strip__inner > span'].textContent.includes('backend')) throw Error('Каталог backend не подключился');
print('✓ Загружен снимок каталога backend');
bridge.send('Есть ли ВА47-29 2P C16?');
drainMicrotasks();
if (!bridge.state.chats[0].messages.some(item => item.text === 'Ответ backend')) throw Error('Чат не обращается к API');
print('✓ Ответ чата пришёл через API');
bridge.prepareAdd(bridge.products[0], 2);
if (serverCart.length) throw Error('Корзина изменилась до подтверждения');
print('✓ До подтверждения корзина пуста');
bridge.confirmAdd();
drainMicrotasks();
if (serverCart[0]?.quantity !== 2 || bridge.state.cart[0]?.quantity !== 2) throw Error('Подтверждение не изменило серверную корзину');
if (!calls.some(call => call.path === '/api/cart/confirm')) throw Error('Нет вызова подтверждения корзины');
print('✓ После подтверждения обновлена серверная корзина');
