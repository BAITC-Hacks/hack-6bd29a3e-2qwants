/* Первый сквозной слой: UI остаётся во frontend, источник данных и корзина — backend. */
(() => {
  if (!/^https?:$/.test(location.protocol)) return;

  const sessionKey = 'quant-api-session-v1';
  const sessionId = sessionStorage.getItem(sessionKey) || crypto.randomUUID();
  sessionStorage.setItem(sessionKey, sessionId);
  let connected = false;
  let busy = false;

  function setStatus(message) {
    document.querySelector('.demo-strip__inner > span').textContent = message;
  }

  async function api(path, options = {}) {
    const response = await fetch(path, options);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || `Ошибка API: ${response.status}`);
    return data;
  }

  function categoryOf(product) {
    const value = product.category.toLowerCase();
    if (value.includes('кабел')) return 'cable';
    if (value.includes('автомат') || value.includes('выключател')) return 'breaker';
    return 'light';
  }

  function fromApi(product) {
    return {
      ...product,
      categoryName: product.category,
      category: categoryOf(product),
      warehouses: {[product.warehouse]: product.stock},
      tags: product.tags || []
    };
  }

  async function chat(message) {
    return api('/api/chat', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({session_id: sessionId, message})
    });
  }

  async function refreshCart() {
    const cart = await api(`/api/cart/${encodeURIComponent(sessionId)}`);
    state.cart = cart.items.map(item => ({sku: item.sku, quantity: item.quantity}));
    renderCart();
    persist();
    return cart;
  }

  function renderAnswer(answer) {
    const bubble = addText(answer.message || 'Сервер не вернул ответ.');
    const items = (answer.products || []).map(item => products.find(product => product.sku === item.sku)).filter(Boolean);
    items.forEach(item => productCard(item, bubble));
    if (answer.action?.type === 'confirm_add') {
      addText('Подтверждение получено. Завершите добавление выбранной кнопкой.');
    }
    scrollChat();
  }

  const originalRenderCatalog = renderCatalog;
  renderCatalog = function(list = products) {
    originalRenderCatalog(list);
    if (connected) $('#results-label').textContent = `Каталог backend · ${list.length} позиций`;
  };

  confirmAdd = async function(expectedPending) {
    const pending = state.pending;
    if (!pending || (expectedPending && pending !== expectedPending) || busy) return;
    const product = products.find(item => item.sku === pending.sku);
    if (!product) return;
    busy = true;
    const quantity = pending.quantity;
    try {
      const request = await chat(`Добавь ${quantity} шт. ${pending.sku} в корзину`);
      if (!request.requires_confirmation) throw new Error(request.message || 'Сервер не запросил подтверждение.');
      const approval = await chat('да, добавь');
      if (approval.action?.type !== 'confirm_add' || approval.action.sku !== pending.sku || approval.action.quantity !== quantity) {
        throw new Error('Подтверждение не совпало с выбранным товаром и количеством.');
      }
      const result = await api('/api/cart/confirm', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({session_id: sessionId, sku: pending.sku, quantity})
      });
      expirePending();
      await refreshCart();
      const bubble = addText(`${result.message} ${product.name} × ${quantity}.`);
      addLink(bubble, 'Открыть актуальную корзину →', '#cart');
      markLastMessage({cartLink: true});
    } catch (error) {
      expirePending();
      addText(`Не удалось изменить корзину: ${error.message}`);
    } finally {
      busy = false;
    }
  };

  send = async function(message) {
    const input = message.trim();
    if ((!input && !state.attachments.length) || busy) return;
    openAgent();
    $('#chat-input').value = '';
    if (input && sensitive(input)) { addText(copy[state.lang].noPayment); return; }
    if (input) {
      const confirmation = /^(да,?\s*добавь|подтверждаю добавление|иә,?\s*қос)[.!]?$/i.test(input);
      addText(input, 'user', confirmation ? 'action' : 'query');
      if (confirmation) {
        if (state.pending) await confirmAdd();
        else addText('Нет выбранного товара для подтверждения.');
        return;
      }
      if (/^(отмена|нет|жоқ|бас тарту)[.!]?$/i.test(input) && state.pending) {
        expirePending(); addText(copy[state.lang].cancel); return;
      }
      if (/добав|положи|купить|қос|сатып ал/i.test(input) && !state.attachments.length) {
        const product = findProduct(input);
        if (product) { prepareAdd(product, parseQuantity(input)); return; }
      }
    }
    if (!connected) { addText('Соединение с backend ещё не установлено. Повторите запрос через секунду.'); return; }
    busy = true;
    try {
      if (state.attachments.length) {
        for (const [index, file] of state.attachments.entries()) {
          const body = new FormData();
          body.append('session_id', sessionId);
          body.append('message', index === 0 ? input : 'Проверь этот файл по каталогу');
          body.append('file', file);
          renderAnswer(await api('/api/chat/upload', {method: 'POST', body}));
        }
      } else {
        const answer = await chat(input);
        renderAnswer(answer);
        if (answer.requires_confirmation && answer.products?.[0]) {
          const product = products.find(item => item.sku === answer.products[0].sku);
          if (product) prepareAdd(product, parseQuantity(input));
        }
      }
    } catch (error) {
      addText(`Не удалось получить ответ backend: ${error.message}`);
    } finally {
      busy = false;
      state.attachments = [];
      $('#attachment-list').hidden = true;
      $('#attachment-list').replaceChildren();
      $('#file-input').value = '';
    }
  };

  attach = function(files) {
    state.attachments = [...files].filter(file => /\.(xlsx|docx|pdf|jpe?g)$/i.test(file.name) && file.size <= 10 * 1024 * 1024);
    const root = $('#attachment-list');
    root.replaceChildren();
    root.hidden = !state.attachments.length;
    state.attachments.forEach(file => root.append(element('span', '', file.name)));
    if (files.length && !state.attachments.length) addText('Прикрепите .xlsx, .docx, PDF или JPEG размером до 10 МБ.');
  };

  setStatus('HACKALEM AI · подключаем каталог и корзину backend…');
  api('/static/backend-catalog.json').then(async data => {
    products.splice(0, products.length, ...data.map(fromApi));
    connected = true;
    state.lastProduct = null;
    renderCatalog();
    await refreshCart();
    setStatus('HACKALEM AI · Quant + backend · снимок синтетического каталога');
    $('.agent-footnote').textContent = 'Чат и корзина подключены к backend · каталог — снимок демо-данных · оплата недоступна';
  }).catch(error => {
    setStatus('HACKALEM AI · backend недоступен');
    addText(`Не удалось подключить backend: ${error.message}`);
  });
})();
