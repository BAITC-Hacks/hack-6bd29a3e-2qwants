const sessionId = crypto.randomUUID();
const messages = document.querySelector('#messages');
const form = document.querySelector('#chat-form');
const input = document.querySelector('#message-input');
const products = document.querySelector('#product-list');

function addMessage(text, role = 'assistant') {
  const el = document.createElement('div');
  el.className = `message ${role}`;
  el.textContent = text;
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;
}

function showProducts(items = []) {
  products.innerHTML = items.map(item => `<article class="product"><div><b>${item.name}</b><small>${item.sku} · ${item.stock} шт. · ${item.price} ₸</small></div>${item.certificate ? `<a href="${item.certificate.url}" target="_blank">Сертификат</a>` : ''}</article>`).join('');
}

async function refreshCart() {
  const response = await fetch(`/api/cart/${sessionId}`);
  const cart = await response.json();
  document.querySelector('#cart-count').textContent = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelector('#cart-total').textContent = `${cart.total.toLocaleString('ru-RU')} ₸`;
  document.querySelector('#cart-items').innerHTML = cart.items.length ? cart.items.map(item => `<div>${item.name} × ${item.quantity}</div>`).join('') : 'Корзина пока пуста';
}

async function sendMessage(text) {
  addMessage(text, 'user');
  input.value = '';
  const response = await fetch('/api/chat', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({message: text, session_id: sessionId})});
  const data = await response.json();
  addMessage(data.message);
  showProducts(data.products);
  if (data.action?.type === 'confirm_add') {
    const confirm = await fetch('/api/cart/confirm', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({session_id: sessionId, sku: data.action.sku, quantity: data.action.quantity})});
    const cart = await confirm.json();
    addMessage(cart.message + ` Ссылка: ${cart.checkout_url}`);
    await refreshCart();
  }
}

form.addEventListener('submit', event => { event.preventDefault(); if (input.value.trim()) sendMessage(input.value.trim()); });
document.querySelectorAll('.quick button').forEach(button => button.addEventListener('click', () => sendMessage(button.dataset.message)));
refreshCart();

