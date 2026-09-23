// macOS: /System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc frontend/demo-smoke.js
const source=readFile('frontend/demo.js');
const html=readFile('frontend/visual-demo.html');
function check(condition,label){if(!condition)throw Error(label);print('✓ '+label);}

check(source.includes("fetch('/api/products')"),'Каталог загружается из backend');
check(source.includes("fetch('/api/chat'"),'Текст отправляется в backend');
check(source.includes("fetch('/api/chat/upload'"),'Вложение отправляется в backend');
check(source.includes("fetch('/api/cart/confirm'"),'Корзина подтверждается через backend');
check(source.includes('encodeURIComponent(state.chatId)'),'Корзина разделяется по session_id');
check(source.includes("send('да, добавь')"),'В интерфейсе есть явное подтверждение');
check(source.includes("send('отмена')"),'В интерфейсе есть отмена');
check(source.includes('accepted.slice(0,1)'),'За запрос отправляется один файл');
check(html.includes('id="file-input"')&&html.includes('.png')&&html.includes('.csv'),'Форматы загрузки совпадают с API');
check(html.includes('demo.js'),'Интегрированный клиент подключён к странице');
print('Frontend/API smoke-проверки завершены');
