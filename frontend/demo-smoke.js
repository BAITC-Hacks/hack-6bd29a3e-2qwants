// Запуск на macOS: /System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc frontend/demo-smoke.js
class FakeNode {
  constructor(tag='div') {
    this.tagName=tag; this.children=[]; this.dataset={}; this.textContent=''; this.attributes={}; this.events={}; this.clientWidth=320;
    const classes=new Set();
    this.classList={add:name=>classes.add(name),remove:name=>classes.delete(name),contains:name=>classes.has(name),toggle:(name,force)=>{if(force===undefined? !classes.has(name):force)classes.add(name);else classes.delete(name);}};
  }
  append(...children){this.children.push(...children);}
  replaceChildren(...children){this.children=[...children];this.textContent='';}
  setAttribute(name,value){this.attributes[name]=String(value);}
  addEventListener(name,handler){this.events[name]=handler;}
  focus(){}
  scrollIntoView(){}
  scrollBy(options){this.lastScroll=options;}
  click(){this.events.click?.({preventDefault(){}});}
}
const nodes={};
nodes['#history-panel']=new FakeNode();nodes['#history-panel'].hidden=true;
const fakeDocument={
  body:new FakeNode('body'),documentElement:{lang:'ru'},
  querySelector(selector){return nodes[selector] ||= new FakeNode();},
  querySelectorAll(selector){if(selector==='[data-lang]')return [ru,kz];return [];},
  createElement(tag){return new FakeNode(tag);},
  createElementNS(namespace,tag){return new FakeNode(tag);},
  addEventListener(){}
};
const ru=new FakeNode('button'); ru.dataset.lang='ru';
const kz=new FakeNode('button'); kz.dataset.lang='kz';
const storage=new Map();
const fakeWindow={location:{hash:''},sessionStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},confirm:()=>true};
const source=readFile('frontend/demo.js');
const assertions=String.raw`
function check(condition,label){if(!condition)throw Error(label);print('✓ '+label);}
check(products.length===6,'Каталог загружен');
check(document.querySelector('#chat-messages').children[0].className==='chat-landing','Первый экран — приветствие Quant');
const firstRail=document.querySelector('#chat-messages').children[0].children.at(-1).children[1];
check(firstRail.children.length===6,'Подсказки показаны в горизонтальном слайдере');
document.querySelector('#chat-messages').children[0].children.at(-1).children[0].children[1].children[1].click();
check(firstRail.lastScroll.left>0,'Стрелка слайдера прокручивает подсказки');
check(findProduct('EK-CAB-VVG-325-20').sku==='EK-CAB-VVG-325-20','Точный длинный артикул не путается с коротким');
check(findProduct('ВА47-29 C25').sku==='EK-VA4729-C25','Номинал C25 не путается с C16');
check(findProduct('несуществующий товар')===null,'Неизвестный товар не подменяется предыдущим');
setLanguage('kz');
check(document.documentElement.lang==='kk' && document.querySelector('#chat-input').placeholder.includes('Quant-тан'),'RU/KZ меняет язык чата');
check(document.querySelector('#chat-messages').children[0].children.at(-1).children[1].children[0].children[1].textContent.includes('бар ма'),'Подсказки переведены');
setLanguage('ru');
handleQuestion('Есть ли кабель EK-CAB-VVG-325?');
check(document.querySelector('#chat-messages').children.at(-1).textContent.includes('длина бухты отличается'),'Нулевой остаток даёт обоснованный аналог');
showProduct(products[0]);
const card=document.querySelector('#chat-messages').children.at(-1).children[0];
const actions=card.children.at(-1);
actions.children[0].click();
check(document.querySelector('#chat-messages').children.at(-2).textContent.includes('Сравнить:'),'Выбор «Сравнить» записан сообщением пользователя');
actions.children[1].click();
check(document.querySelector('#chat-messages').children.at(-2).textContent.includes('Купить:'),'Выбор «Купить» записан сообщением пользователя');
check(state.cart.length===0 && state.pending.quantity===1,'Выбор покупки не меняет корзину');
const confirmation=document.querySelector('#chat-messages').children.at(-1).children[0];
check(confirmation.className==='confirm-card' && confirmation.children.at(-1).className==='confirm-card__actions','Подтверждение вынесено в отдельную карточку');
confirmation.children[3].children[1].children[2].click();
check(state.pending.quantity===2,'Количество меняется отдельным шагом');
confirmation.children.at(-1).children[0].click();
check(state.cart[0].quantity===2 && document.querySelector('#cart-count').textContent===2,'Явное подтверждение добавляет выбранное количество');
check(document.querySelector('#chat-messages').children.at(-2).textContent.includes('Подтверждаю:'),'Подтверждение записано в диалоге');
check(document.querySelector('#chat-messages').children.at(-1).children.some(item=>item.href==='#cart'),'После добавления есть прямая ссылка на корзину');
prepareAdd(products[0],100);
check(state.cart[0].quantity===2,'Запрос выше остатка не меняет корзину');
prepareAdd(products[0],1); const stale=state.pending;
prepareAdd(products[1],1); confirmAdd(stale);
check(state.cart.length===1,'Старая кнопка подтверждения не добавляет другой товар');
confirmAdd();
check(state.cart.length===2,'Актуальная кнопка добавляет выбранный товар');
const previousChat=state.chatId;newChat();
check(state.chatId!==previousChat && state.chats.length===2,'Новый чат отделён от предыдущего');
check(document.querySelector('#chat-messages').children[0].children.length>=4,'На старте нового чата есть слайдер прошлых запросов');
const longQuery='Какие условия оплаты, доставки и минимальная партия для юридического лица в Алматы?';send(longQuery);
check(currentChat().title===longQuery && document.querySelector('#history-list').children[0].children[1].children[0].textContent===longQuery,'Длинный заголовок истории не обрезается');
document.querySelector('#agent-history').click();
check(document.querySelector('#history-panel').hidden===false && document.querySelector('#history-list').children.length===2,'Кнопка истории открывает список чатов');
document.querySelector('#history-close').click();
check(document.querySelector('#history-panel').hidden===true,'История закрывается отдельной кнопкой');
selectChat(previousChat);
check(currentChat().messages.length>0 && document.querySelector('#chat-messages').children.length>1,'История восстанавливает диалог');
check(currentChat().messages.some(message=>message.text.includes('Номинальный ток')),'Сравнение остаётся читаемым в истории');
check(storage.has(HISTORY_KEY),'История сохраняется в пределах вкладки');
setFullscreen(true);
check(state.fullscreen && document.querySelector('#agent-panel').classList.contains('fullscreen'),'Полноэкранный режим включается');
setFullscreen(false);
check(!state.fullscreen,'Полноэкранный режим выключается');
attach([{name:'spec.pdf',size:1024}]);send('');
check(state.attachments.length===0 && document.querySelector('#chat-messages').children.at(-1).textContent.includes('не анализируется'),'Вложение принимается без ложного анализа');
const beforeSensitive=currentChat().messages.length;send('Моя карта 4111 1111 1111 1111');
check(currentChat().messages.length===beforeSensitive+1 && document.querySelector('#chat-messages').children.at(-1).textContent.includes('Платёжные данные'),'Платёжные данные не записываются в историю');
print('Демо-проверки завершены');
`;
new Function('document','window',source+'\n'+assertions)(fakeDocument,fakeWindow);
const reloaded=new Function('document','window',source+'\nreturn {chats:state.chats.length,cart:state.cart.reduce((sum,line)=>sum+line.quantity,0),active:!!currentChat()};')(fakeDocument,fakeWindow);
if(reloaded.chats<2||reloaded.cart<3||!reloaded.active)throw Error('История и корзина не восстановились после перезагрузки');
print('✓ История и корзина восстанавливаются после перезагрузки вкладки');
