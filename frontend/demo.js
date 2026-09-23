const products = [
  {sku:'EK-VA4729-C16',name:'Автоматический выключатель ВА47-29 2P C16',category:'breaker',categoryName:'Низковольтная аппаратура',price:1850,warehouses:{Алматы:42,Астана:12},characteristics:{'Номинальный ток':'16 А','Количество полюсов':'2','Характеристика':'C','Отключающая способность':'4,5 кА'},certificate:{name:'Демо-сертификат ВА47-29',url:'demo-certificates.html#breaker'},tags:['автомат','ва47-29','c16','2p']},
  {sku:'EK-VA4729-C25',name:'Автоматический выключатель ВА47-29 2P C25',category:'breaker',categoryName:'Низковольтная аппаратура',price:1920,warehouses:{Алматы:18,Астана:5},characteristics:{'Номинальный ток':'25 А','Количество полюсов':'2','Характеристика':'C','Отключающая способность':'4,5 кА'},certificate:{name:'Демо-сертификат ВА47-29',url:'demo-certificates.html#breaker'},tags:['автомат','ва47-29','c25','2p']},
  {sku:'EK-CAB-VVG-325',name:'Кабель ВВГнг-LS 3×2,5, бухта 100 м',category:'cable',categoryName:'Кабель и провод',price:43800,warehouses:{Алматы:0,Астана:0},characteristics:{'Сечение':'3×2,5 мм²','Материал жилы':'медь','Напряжение':'0,66 кВ','Длина':'100 м'},certificate:{name:'Демо-декларация ВВГнг-LS',url:'demo-certificates.html#cable'},tags:['кабель','ввгнг-ls','3x2.5','3×2,5']},
  {sku:'EK-CAB-VVG-325-20',name:'Кабель ВВГнг-LS 3×2,5, бухта 20 м',category:'cable',categoryName:'Кабель и провод',price:9200,warehouses:{Алматы:12,Астана:7},characteristics:{'Сечение':'3×2,5 мм²','Материал жилы':'медь','Напряжение':'0,66 кВ','Длина':'20 м'},certificate:{name:'Демо-декларация ВВГнг-LS',url:'demo-certificates.html#cable'},tags:['кабель','ввгнг-ls','3x2.5','3×2,5']},
  {sku:'EK-LED-IP65-18',name:'Светильник светодиодный 18 Вт IP65',category:'light',categoryName:'Светильники и лампы',price:3650,warehouses:{Алматы:27,Астана:13},characteristics:{'Мощность':'18 Вт','Степень защиты':'IP65','Цветовая температура':'4000 K'},certificate:null,tags:['светильник','лед','led','18вт','ip65']},
  {sku:'EK-LED-IP65-24',name:'Светильник светодиодный 24 Вт IP65',category:'light',categoryName:'Светильники и лампы',price:4250,warehouses:{Алматы:15,Астана:8},characteristics:{'Мощность':'24 Вт','Степень защиты':'IP65','Цветовая температура':'4000 K'},certificate:null,tags:['светильник','лед','led','24вт','ip65']}
];

const $ = selector => document.querySelector(selector);
const HISTORY_KEY = 'kvant-demo-session-v3';
function readSaved(){
  try {
    const value=JSON.parse(window.sessionStorage.getItem(HISTORY_KEY)||'null');
    if(!value||!Array.isArray(value.chats))return null;
    const chats=value.chats.filter(chat=>chat&&typeof chat.id==='string'&&Array.isArray(chat.messages)).slice(0,15).map(chat=>({
      id:chat.id,title:typeof chat.title==='string'?chat.title.slice(0,140):'Новый чат',
      messages:chat.messages.filter(message=>message&&['user','assistant'].includes(message.role)&&typeof message.text==='string').slice(-100).map(message=>({role:message.role,text:message.text.slice(0,1200),kind:message.kind||'response',cartLink:message.cartLink===true}))
    }));
    return {chats,chatId:value.chatId,cart:Array.isArray(value.cart)?value.cart.filter(line=>line&&products.some(product=>product.sku===line.sku&&Number.isInteger(line.quantity)&&line.quantity>0&&line.quantity<=Object.values(product.warehouses).reduce((sum,count)=>sum+count,0))):[]};
  } catch {return null;}
}
const saved=readSaved();
const state = {lang:'ru',cart:saved?.cart||[],pending:null,pendingControls:null,lastProduct:null,attachments:[],open:false,fullscreen:false,chats:saved?.chats||[],chatId:saved?.chatId||null};
const copy = {
  ru:{welcome:'Здравствуйте! Я Quant. Помогу найти товар по артикулу или задаче, сравнить варианты, проверить остатки и сертификаты.',placeholder:'Артикул, товар или вопрос…',quick:['Наличие','Сравнить','Аналоги','Условия покупки','Сертификат','Корзина'],noMatch:'Не нашёл подтверждённого совпадения в демо-каталоге. Уточните артикул, категорию или ключевые характеристики.',attachment:'Файлы прикреплены. В этой визуальной версии содержимое файлов не анализируется; интеграция с обработкой Excel, Word, PDF и JPEG — следующий этап.',conditions:'В демо-каталоге условия оплаты, доставки и минимальной партии не указаны. Для точных условий проверьте карточку и оформление заказа на ekt.kz. Платёжные данные в чате не запрашиваются.',cartEmpty:'Корзина пока пуста. Выберите товар в каталоге.',confirm:'Подтвердите добавление фразой «да, добавь» или кнопкой ниже.',cancel:'Добавление отменено.',added:'Товар добавлен в корзину.',stock:'В наличии',out:'Нет в наличии',ask:'Спросить',compare:'Сравнение',recommended:'Рекомендую доступный вариант',certificateMissing:'Сертификат для этой позиции не указан в демо-каталоге.',noPayment:'Платёжные данные в чате не принимаются. Для оплаты перейдите к оформлению на сайте.',fullscreen:'Развернуть на весь экран',minimize:'Свернуть окно'},
  kz:{welcome:'Сәлеметсіз бе! Мен Quant-пын. Тауарды табуға, нұсқаларды салыстыруға, қалдық пен сертификатты тексеруге көмектесемін.',placeholder:'Артикул, тауар немесе сұрақ…',quick:['Қолжетімділік','Салыстыру','Баламалар','Сатып алу шарттары','Сертификат','Себет'],noMatch:'Демо-каталогтан расталған тауар табылмады. Артикулды немесе сипаттамаларды нақтылаңыз.',attachment:'Файлдар тіркелді. Бұл көрнекі нұсқада файл мазмұны талданбайды; Excel, Word, PDF және JPEG өңдеуі келесі кезеңге жоспарланған.',conditions:'Демо-каталогта төлем, жеткізу және ең аз партия шарттары көрсетілмеген. Нақты ақпаратты ekt.kz сайтындағы тауар бетінен немесе рәсімдеу кезінде тексеріңіз. Чатта төлем деректері сұралмайды.',cartEmpty:'Себет бос. Каталогтан тауар таңдаңыз.',confirm:'Қосу үшін «иә, қос» деп жазыңыз немесе төмендегі батырманы басыңыз.',cancel:'Қосу тоқтатылды.',added:'Тауар себетке қосылды.',stock:'Қоймада бар',out:'Қоймада жоқ',ask:'Сұрау',compare:'Салыстыру',recommended:'Қолда бар нұсқаны ұсынамын',certificateMissing:'Бұл тауардың сертификаты демо-каталогта көрсетілмеген.',noPayment:'Чатта төлем деректері қабылданбайды. Төлем үшін сайтта тапсырысты рәсімдеңіз.',fullscreen:'Толық экранға ашу',minimize:'Терезені кішірейту'}
};
const quick = [
  {icon:'search',ru:'Есть ли автомат ВА47-29 2P C16?',kz:'ВА47-29 2P C16 автоматы бар ма?'},
  {icon:'compare',ru:'Сравни автоматы ВА47-29 C16 и C25',kz:'ВА47-29 C16 және C25 автоматтарын салыстыр'},
  {icon:'box',ru:'Есть ли кабель ВВГнг-LS 3x2.5? Подбери аналог',kz:'ВВГнг-LS 3x2.5 кабеліне балама ұсын'},
  {icon:'truck',ru:'Какие условия оплаты, доставки и минимальная партия?',kz:'Төлем, жеткізу және ең аз партия шарттары қандай?'},
  {icon:'certificate',ru:'Покажи сертификат ВА47-29 2P C16',kz:'ВА47-29 2P C16 сертификатын көрсет'},
  {icon:'cart',ru:'Корзина',kz:'Себет'}
];
const money = amount => `${amount.toLocaleString('ru-RU')} ₸`;
const stock = product => Object.values(product.warehouses).reduce((sum,value)=>sum+value,0);
const normalize = value => value.toLowerCase().replace(/[×х]/g,'x').replace(/[,]/g,'.').replace(/\s+/g,' ');
const sensitive = value => /номер карты|cvv|cvc|плат[её]жн.*данн|карта нөмірі|\b(?:\d[ -]?){12,18}\d\b/i.test(value);
function currentChat(){return state.chats.find(chat=>chat.id===state.chatId);}
function persist(){
  try {window.sessionStorage.setItem(HISTORY_KEY,JSON.stringify({chats:state.chats.slice(0,15),chatId:state.chatId,cart:state.cart}));} catch {}
}
function recordMessage(text,role,kind){
  if(role==='user'&&sensitive(text))return;
  const chat=currentChat();if(!chat)return;
  chat.messages.push({text,role,kind});
  if(role==='user'&&kind==='query'&&chat.title==='Новый чат')chat.title=text.slice(0,140);
  persist();renderHistory();
}
function markLastMessage(meta){const chat=currentChat();if(!chat?.messages.length)return;Object.assign(chat.messages.at(-1),meta);persist();}

function svg(name){const icon=document.createElementNS('http://www.w3.org/2000/svg','svg');const use=document.createElementNS('http://www.w3.org/2000/svg','use');use.setAttribute('href',`#i-${name}`);icon.append(use);return icon;}
function element(tag,className,text){const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;}
function addText(text,role='assistant',kind='response') {const chat=currentChat();if(chat&&!chat.messages.length)$('#chat-messages').replaceChildren();const bubble=element('div',`message ${role}`,text);$('#chat-messages').append(bubble);recordMessage(text,role,kind);scrollChat();return bubble;}
function scrollChat(){const body=$('.agent-body');body.scrollTop=body.scrollHeight;}
function addLink(parent,text,href){const link=element('a','',text);link.href=href;if(href==='#cart')link.addEventListener('click',()=>{setFullscreen(false);closeAgent();});parent.append(link);return link;}
function addButton(parent,label,action){const button=element('button','',label);button.type='button';button.addEventListener('click',action);parent.append(button);return button;}

function recentQueries(){const seen=new Set();const values=[];for(const chat of state.chats){for(const message of [...chat.messages].reverse()){if(message.role!=='user'||message.kind!=='query'||sensitive(message.text)||seen.has(message.text))continue;seen.add(message.text);values.push(message.text);if(values.length===8)return values;}}return values;}
function carousel(title,items){
  const section=element('section','prompt-carousel');const head=element('div','prompt-carousel__head');head.append(element('h3','',title));
  const controls=element('div','prompt-carousel__controls');const rail=element('div','prompt-carousel__rail');
  for(const [label,direction] of [['‹',-1],['›',1]]){const button=addButton(controls,label,()=>rail.scrollBy({left:direction*Math.max(190,rail.clientWidth*.75),behavior:'smooth'}));button.setAttribute('aria-label',direction<0?'Прокрутить влево':'Прокрутить вправо');}
  head.append(controls);section.append(head,rail);
  items.forEach(item=>{const button=element('button','prompt-chip');button.type='button';button.append(svg(item.icon),element('span','',item.label));button.addEventListener('click',item.action);rail.append(button);});
  return section;
}
function renderLanding(){
  const root=$('#chat-messages');root.replaceChildren();const landing=element('div','chat-landing');
  const logo=element('img','chat-landing__logo');logo.src='quant-icon.png';logo.alt='';
  landing.append(logo,element('h2','',state.lang==='kz'?'Мен Quant-пын. Не іздейміз?':'Я Quant. Что найдём сегодня?'),element('p','',state.lang==='kz'?'Тауарды табамын, нұсқаларды салыстырамын және айырмашылығын түсіндіремін.':'Помогу найти товар, сравнить варианты и объяснить разницу.'));
  const queries=recentQueries();if(queries.length)landing.append(carousel(state.lang==='kz'?'Бұрын іздегеніңіз': 'Ранее вы спрашивали',queries.map(query=>({icon:'history',label:query,action:()=>send(query)}))));
  landing.append(carousel(state.lang==='kz'?'Неден бастаймыз?':'Попробуйте спросить',quick.map((item,index)=>({icon:item.icon,label:item.icon==='cart'?copy[state.lang].quick[index]:item[state.lang],action:()=>item.icon==='cart'?openCart():send(item[state.lang])}))));
  root.append(landing);
}
function renderHistory(){
  const root=$('#history-list');root.replaceChildren();
  for(const chat of state.chats){const button=element('button','history-item');button.type='button';if(chat.id===state.chatId)button.classList.add('active');const content=element('span','history-item__content');const count=chat.messages.length;const suffix=count%10===1&&count%100!==11?'сообщение':count%10>=2&&count%10<=4&&(count%100<12||count%100>14)?'сообщения':'сообщений';content.append(element('strong','',chat.title==='Новый чат'&&state.lang==='kz'?'Жаңа чат':chat.title),element('small','',state.lang==='kz'?`${count} хабарлама`:`${count} ${suffix}`));button.append(svg('history'),content);button.addEventListener('click',()=>selectChat(chat.id));root.append(button);}
  $('#history-title').textContent=state.lang==='kz'?'Чаттар тарихы':'История чатов';$('#new-chat-label').textContent=state.lang==='kz'?'Жаңа чат':'Новый чат';$('#clear-history').textContent=state.lang==='kz'?'Осы қойындыдағы тарихты өшіру':'Очистить историю в этой вкладке';$('#history-note').textContent=state.lang==='kz'?'Тарих тек осы қойындыда сақталады. Файлдар мен төлем деректері сақталмайды.':'История хранится только в этой вкладке. Файлы и платёжные данные не сохраняются.';
}
function renderConversation(){const chat=currentChat();const root=$('#chat-messages');root.replaceChildren();if(!chat||!chat.messages.length){renderLanding();return;}for(const message of chat.messages){const bubble=element('div',`message ${message.role}`,message.text);if(message.cartLink)addLink(bubble,state.lang==='kz'?'Себетті ашу →':'Открыть актуальную корзину →','#cart');root.append(bubble);}scrollChat();}
function toggleHistory(show){$('#history-panel').hidden=!show;$('#agent-history').setAttribute('aria-pressed',String(show));if(show)renderHistory();}
function selectChat(id){if(!state.chats.some(chat=>chat.id===id))return;expirePending();state.chatId=id;state.lastProduct=null;const last=[...currentChat().messages].reverse().find(message=>message.kind==='query');if(last)state.lastProduct=findProduct(last.text);persist();renderConversation();renderHistory();toggleHistory(false);}
function newChat(){expirePending();const chat={id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,title:'Новый чат',messages:[]};state.chats.unshift(chat);state.chats=state.chats.slice(0,15);state.chatId=chat.id;state.lastProduct=null;persist();renderConversation();renderHistory();toggleHistory(false);}

function openAgent(){if(!document.body.classList.contains('with-agent'))setMode(true);state.open=true;$('#agent-panel').classList.add('open');$('#agent-panel').setAttribute('aria-hidden','false');$('#agent-launcher').setAttribute('aria-expanded','true');$('#chat-input').focus();}
function closeAgent(){if(state.fullscreen)setFullscreen(false);toggleHistory(false);state.open=false;$('#agent-panel').classList.remove('open');$('#agent-panel').setAttribute('aria-hidden','true');$('#agent-launcher').setAttribute('aria-expanded','false');}
function setMode(enabled){document.body.classList.toggle('with-agent',enabled);$('#mode-base').classList.toggle('active',!enabled);$('#mode-agent').classList.toggle('active',enabled);if(!enabled)closeAgent();}
function setFullscreen(enabled){state.fullscreen=enabled;$('#agent-panel').classList.toggle('fullscreen',enabled);document.body.classList.toggle('agent-fullscreen',enabled);$('#agent-expand').setAttribute('aria-pressed',String(enabled));$('#agent-expand').setAttribute('aria-label',enabled?copy[state.lang].minimize:copy[state.lang].fullscreen);$('#agent-expand use').setAttribute('href',enabled?'#i-collapse':'#i-expand');}
function setLanguage(lang){state.lang=lang;document.documentElement.lang=lang==='kz'?'kk':'ru';document.querySelectorAll('[data-lang]').forEach(button=>{const active=button.dataset.lang===lang;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});$('#chat-input').placeholder=lang==='kz'?'Quant-тан сұраңыз…':'Спросите Quant…';$('#agent-launcher .agent-launcher__text').textContent=lang==='kz'?'Quant-тан сұраңыз':'Спросить Quant';$('#agent-expand').setAttribute('aria-label',state.fullscreen?copy[lang].minimize:copy[lang].fullscreen);renderHistory();if(!currentChat()?.messages.length)renderLanding();renderCart();}
function openCart(){closeAgent();window.location.hash='cart';$('#cart').scrollIntoView({behavior:'smooth'});}

function renderCatalog(list=products){
  const root=$('#product-grid');root.replaceChildren();$('#results-label').textContent=`Демо каталог · ${list.length} позиций`;
  if(!list.length){root.append(element('p','',copy[state.lang].noMatch));return;}
  list.forEach(product=>{
    const card=element('article','product-card');
    const visual=window.QuantMedia?.createThumbnail(product)||element('div','product-card__visual');
    if(!window.QuantMedia?.get(product.sku))visual.append(svg(product.category==='breaker'?'compare':product.category==='cable'?'box':'spark'));
    const category=element('span','product-card__type',product.categoryName);
    const title=element('h3','',product.name);
    const warehouses=Object.entries(product.warehouses).map(([city,count])=>`${city}: ${count} шт.`).join(' · ');
    const meta=element('div','product-card__meta',`Арт. ${product.sku} · ${warehouses}`);
    const pill=element('span','stock-pill',stock(product)>0?`${copy[state.lang].stock}: ${stock(product)} шт.`:copy[state.lang].out);
    const footer=element('div','product-card__footer');footer.append(element('strong','',money(product.price)));
    const ask=element('button','',copy[state.lang].ask);ask.type='button';
    ask.addEventListener('click',()=>{openAgent();addText(`${state.lang==='kz'?'Тауарды көрсету':'Покажи товар'}: ${product.sku}`,'user','action');showProduct(product);});
    footer.append(ask);card.append(visual,category,title,meta,pill,footer);root.append(card);
  });
}

function localKey(key){if(state.lang==='ru')return key;return {'Номинальный ток':'Номиналды ток','Количество полюсов':'Полюстер саны','Характеристика':'Сипаттама','Отключающая способность':'Ажырату қабілеті','Сечение':'Қимасы','Материал жилы':'Өзек материалы','Напряжение':'Кернеуі','Длина':'Ұзындығы','Мощность':'Қуаты','Степень защиты':'Қорғаныс дәрежесі','Цветовая температура':'Түс температурасы'}[key]||key;}
function productDetails(product){const names=Object.entries(product.characteristics).map(([key,value])=>`${localKey(key)}: ${value}`).join(' · ');const warehouses=Object.entries(product.warehouses).map(([city,count])=>`${city} — ${count} ${state.lang==='kz'?'дана':'шт.'}`).join('; ');return state.lang==='kz'?`${product.name}\nАртикул: ${product.sku}\nБағасы: ${money(product.price)}\nҚалдық: ${warehouses}\n${names}`:`${product.name}\nАртикул: ${product.sku}\nЦена: ${money(product.price)}\nОстатки: ${warehouses}\n${names}`;}
function productCard(product,parent){
  const card=element('div','chat-product');const photo=window.QuantMedia?.createThumbnail(product,'chat');if(photo)card.append(photo);card.append(element('strong','',product.name),element('small','',`${product.sku} · ${money(product.price)} · ${stock(product)} ${state.lang==='kz'?'дана':'шт.'}`));
  card.append(element('small','',Object.entries(product.characteristics).map(([key,value])=>`${localKey(key)}: ${value}`).join(' · ')));
  const actions=element('div','chat-product__actions');
  addButton(actions,state.lang==='kz'?'Салыстыру':'Сравнить',()=>{expirePending();addText(`${state.lang==='kz'?'Салыстыру':'Сравнить'}: ${product.name}`,'user','action');showComparison(comparisonGroup(normalize(product.name)));});
  if(stock(product)>0)addButton(actions,state.lang==='kz'?'Сатып алу':'Купить',()=>{addText(`${state.lang==='kz'?'Сатып алу':'Купить'}: ${product.name}`,'user','action');prepareAdd(product,1);}).classList.add('chat-product__primary');
  if(product.certificate){const link=addLink(actions,'Сертификат',product.certificate.url);link.target='_blank';link.rel='noopener';link.addEventListener('click',()=>addText(`${state.lang==='kz'?'Сертификатты ашу':'Открыть сертификат'}: ${product.sku}`,'user','action'));}
  card.append(actions);parent.append(card);
}
function showProduct(product){state.lastProduct=product;const bubble=addText(productDetails(product));productCard(product,bubble);}
function showComparison(items){const summary=items.map(product=>{const key=Object.entries(product.characteristics)[0];return `${product.name} — ${money(product.price)}, ${stock(product)} ${state.lang==='kz'?'дана':'шт.'}, ${localKey(key[0])}: ${key[1]}`;});const bubble=addText(`${copy[state.lang].compare}\n${summary.join('\n')}`);const wrap=element('div','comparison');const table=element('table','');const header=element('tr','');(state.lang==='kz'?['Тауар','Бағасы','Қалдық','Параметр']:['Товар','Цена','Остаток','Параметр']).forEach(label=>header.append(element('th','',label)));table.append(header);items.forEach(product=>{const row=element('tr','');const key=Object.entries(product.characteristics)[0];[product.name,money(product.price),`${stock(product)} ${state.lang==='kz'?'дана':'шт.'}`,`${localKey(key[0])}: ${key[1]}`].forEach(value=>row.append(element('td','',value)));table.append(row);});wrap.append(table);bubble.append(wrap);items.forEach(item=>productCard(item,bubble));scrollChat();}
function parseQuantity(text){const match=text.match(/(?:добавь|добавить|положи|купить|қос|сатып ал)\s+(\d+)\b|\b(\d+)\s*(?:шт|штук|дана)\b/i);return match?Number(match[1]||match[2]):1;}
function expirePending(){if(state.pendingControls){state.pendingControls.forEach(button=>{button.disabled=true;});state.pendingControls=null;}state.pending=null;}
function prepareAdd(product,quantity){
  openAgent();expirePending();state.lastProduct=product;
  const already=state.cart.find(line=>line.sku===product.sku)?.quantity||0;const available=stock(product)-already;
  if(quantity<1||quantity>available){addText(state.lang==='kz'?`Қолжетімді саны: ${Math.max(available,0)} дана.`:`Доступно для добавления: ${Math.max(available,0)} шт.`);return;}
  const pending={sku:product.sku,quantity};state.pending=pending;
  const bubble=addText(state.lang==='kz'?`Себетке қоспас бұрын таңдауыңызды тексеріңіз: ${product.name}, ${quantity} дана.`:`Проверьте выбор перед добавлением в корзину: ${product.name}, ${quantity} шт.`);
  const card=element('div','confirm-card');card.append(element('span','confirm-card__eyebrow',state.lang==='kz'?'РАСТАУ':'ПОДТВЕРЖДЕНИЕ'),element('strong','',product.name),element('small','',`${product.sku} · ${money(product.price)} · ${state.lang==='kz'?'Қолжетімді':'Доступно'}: ${available} ${state.lang==='kz'?'дана':'шт.'}`));
  const quantityRow=element('div','confirm-card__quantity');quantityRow.append(element('span','',state.lang==='kz'?'Саны':'Количество'));
  const stepper=element('div','quantity-stepper');const count=element('strong','',String(quantity));const total=element('strong','confirm-card__total',money(quantity*product.price));
  const minus=addButton(stepper,'−',()=>{if(state.pending!==pending||pending.quantity<=1)return;pending.quantity--;count.textContent=pending.quantity;total.textContent=money(pending.quantity*product.price);});minus.setAttribute('aria-label','Уменьшить количество');
  stepper.append(count);
  const plus=addButton(stepper,'+',()=>{if(state.pending!==pending||pending.quantity>=available)return;pending.quantity++;count.textContent=pending.quantity;total.textContent=money(pending.quantity*product.price);});plus.setAttribute('aria-label','Увеличить количество');
  quantityRow.append(stepper);card.append(quantityRow,total);
  const actions=element('div','confirm-card__actions');
  const confirm=addButton(actions,state.lang==='kz'?'Растау және қосу':'Подтвердить и добавить',()=>{if(state.pending!==pending)return;addText(`${state.lang==='kz'?'Растаймын':'Подтверждаю'}: ${product.name} × ${pending.quantity}`,'user','action');confirmAdd(pending);});confirm.classList.add('confirm-card__primary');
  const cancel=addButton(actions,state.lang==='kz'?'Бас тарту':'Отмена',()=>{if(state.pending!==pending)return;addText(`${state.lang==='kz'?'Бас тарту':'Отмена'}: ${product.name}`,'user','action');expirePending();addText(copy[state.lang].cancel);});
  card.append(actions);bubble.append(card);state.pendingControls=[minus,plus,confirm,cancel];scrollChat();
}
function confirmAdd(expectedPending){
  const pending=state.pending;if(!pending||expectedPending&&pending!==expectedPending)return;
  const product=products.find(item=>item.sku===pending.sku);const line=state.cart.find(item=>item.sku===pending.sku);const current=line?.quantity||0;
  if(!product||pending.quantity<1||current+pending.quantity>stock(product)){expirePending();addText(state.lang==='kz'?'Қалдық жеткіліксіз.':'Остатка недостаточно, корзина не изменена.');return;}
  if(line)line.quantity+=pending.quantity;else state.cart.push({sku:product.sku,quantity:pending.quantity});
  const addedQuantity=pending.quantity;expirePending();renderCart();persist();
  const bubble=addText(`${copy[state.lang].added} ${product.name} × ${addedQuantity}.`);addLink(bubble,state.lang==='kz'?'Себетті ашу →':'Открыть актуальную корзину →','#cart');markLastMessage({cartLink:true});
}
function renderCart(){const root=$('#cart-items');root.replaceChildren();if(!state.cart.length)root.textContent=copy[state.lang].cartEmpty;else state.cart.forEach(line=>{const product=products.find(item=>item.sku===line.sku);const row=element('div','cart-line');row.append(element('span','',`${product.name} × ${line.quantity}`),element('strong','',money(product.price*line.quantity)));root.append(row);});const count=state.cart.reduce((sum,line)=>sum+line.quantity,0);const total=state.cart.reduce((sum,line)=>sum+products.find(product=>product.sku===line.sku).price*line.quantity,0);$('#cart-count').textContent=count;$('#cart-total').textContent=money(total);$('#checkout-button').disabled=count===0;}

function findProduct(query){const text=normalize(query);const direct=[...products].sort((a,b)=>b.sku.length-a.sku.length).find(product=>text.includes(normalize(product.sku))||text.includes(normalize(product.name)));if(direct)return direct;if(/c25/.test(text))return products[1];if(/ва47|c16/.test(text))return products[0];if(/кабел|ввг|3x2.5/.test(text))return products[2];if(/светильник|ip65|led/.test(text))return products[4];return /^(?:его|её|этот|эта|осы|оны|сертификат|аналог|добавь|купить|қос|сатып ал|цена|бағасы)(?:\s|$)/.test(text)?state.lastProduct:null;}
function analogReason(product,alternative){if(product.category==='cable')return state.lang==='kz'?'Қимасы, өзек материалы мен кернеуі сәйкес; бухта ұзындығы басқа.':'Совпадают сечение, материал жилы и напряжение; длина бухты отличается.';if(product.category==='breaker')return state.lang==='kz'?'Номиналды ток өзгеше: бұл тікелей алмастыру емес, маманмен сәйкестігін тексеріңіз.':'Номинальный ток отличается: это не прямая замена, совместимость нужно проверить со специалистом.';return state.lang==='kz'?'Қорғаныс дәрежесі сәйкес, қуаты өзгеше.':'Степень защиты совпадает, мощность отличается.';}
function comparisonGroup(text){if(/кабел|ввг/.test(text))return products.filter(item=>item.category==='cable');if(/светильник|led/.test(text))return products.filter(item=>item.category==='light');if(/автомат|ва47|выключател|c16|c25/.test(text))return products.filter(item=>item.category==='breaker');return products.filter(item=>item.category===(state.lastProduct?.category||'breaker'));}
function handleQuestion(input){const text=normalize(input);if(sensitive(input)){addText(copy[state.lang].noPayment);return;}
  if(state.pending&&/^(да,?\s*добавь|подтверждаю добавление|иә,?\s*қос)[.!]?$/i.test(input.trim())){confirmAdd();return;}
  if(state.pending&&/^(отмена|нет|жоқ|бас тарту)[.!]?$/i.test(input.trim())){expirePending();addText(copy[state.lang].cancel);return;}
  if(state.pending)expirePending();
  if(/оплат|достав|минимальн|услови|төлем|жеткіз|шарт|ең аз|партия/.test(text)){addText(copy[state.lang].conditions);return;}
  if(/корзин|себет/.test(text)&&!/добав|қос/.test(text)){const bubble=addText(state.lang==='kz'?'Себетке өту үшін сілтемені ашыңыз.':'Откройте корзину по ссылке.');addLink(bubble,state.lang==='kz'?'Себет →':'Корзина →','#cart');return;}
  if(/сравн|салыст|разниц/.test(text)){showComparison(comparisonGroup(text));return;}
  const product=findProduct(input);
  if(/добав|положи|купить|қос|сатып ал/.test(text)){if(!product){addText(copy[state.lang].noMatch);return;}prepareAdd(product,parseQuantity(input));return;}
  if(/подбер|аналог|замен|балама/.test(text)&&product){const alternatives=products.filter(item=>item.category===product.category&&item.sku!==product.sku&&stock(item)>0);if(alternatives.length){const bubble=addText(`${product.name}: ${stock(product)} ${state.lang==='kz'?'дана':'шт.'}\n${copy[state.lang].recommended}: ${alternatives[0].name}. ${analogReason(product,alternatives[0])}`);productCard(alternatives[0],bubble);}else addText(copy[state.lang].noMatch);return;}
  if(!product){addText(copy[state.lang].noMatch);return;}
  if(/сертифик|құжат/.test(text)){state.lastProduct=product;if(product.certificate){const bubble=addText(`${product.name}\n${product.certificate.name}`);addLink(bubble,state.lang==='kz'?'Құжатты ашу →':'Открыть сертификат →',product.certificate.url).target='_blank';}else addText(copy[state.lang].certificateMissing);return;}
  if(stock(product)===0){const alternative=products.find(item=>item.category===product.category&&item.sku!==product.sku&&stock(item)>0);const bubble=addText(`${product.name}: ${copy[state.lang].out}.\n${alternative?`${copy[state.lang].recommended}: ${alternative.name}. ${analogReason(product,alternative)}`:copy[state.lang].noMatch}`);if(alternative)productCard(alternative,bubble);state.lastProduct=product;return;}
  showProduct(product);
}
function send(message){const input=message.trim();if(!input&&!state.attachments.length)return;openAgent();if(input){const kind=/^(да,?\s*добавь|подтверждаю добавление|иә,?\s*қос|отмена|нет|жоқ|бас тарту)[.!]?$/i.test(input)?'action':'query';addText(input,'user',kind);handleQuestion(input);}if(state.attachments.length){if(!input)addText(state.lang==='kz'?'Файл жіберу':'Отправить вложение','user','action');addText(copy[state.lang].attachment);state.attachments=[];$('#attachment-list').hidden=true;$('#attachment-list').replaceChildren();$('#file-input').value='';}$('#chat-input').value='';scrollChat();}
function attach(files){const valid=/\.(xlsx|xls|docx|doc|pdf|jpe?g)$/i;state.attachments=[...files].filter(file=>valid.test(file.name)&&file.size<=10*1024*1024);const root=$('#attachment-list');root.replaceChildren();root.hidden=!state.attachments.length;state.attachments.forEach(file=>root.append(element('span','',file.name)));if(files.length&&!state.attachments.length)addText(state.lang==='kz'?'Тек Excel, Word, PDF, JPEG файлдарын тіркеңіз (10 МБ дейін).':'Прикрепите Excel, Word, PDF или JPEG размером до 10 МБ.');}

$('#agent-launcher').addEventListener('click',openAgent);
$('#agent-close').addEventListener('click',closeAgent);
$('#agent-history').addEventListener('click',()=>toggleHistory($('#history-panel').hidden));
$('#history-close').addEventListener('click',()=>toggleHistory(false));
$('#new-chat').addEventListener('click',newChat);
$('#clear-history').addEventListener('click',()=>{if(!window.confirm(state.lang==='kz'?'Осы қойындыдағы чат тарихын өшіру керек пе?':'Удалить историю чатов в этой вкладке?'))return;state.chats=[];state.chatId=null;newChat();});
$('#agent-expand').addEventListener('click',()=>setFullscreen(!state.fullscreen));
$('#agent-cart').addEventListener('click',openCart);
$('#mode-base').addEventListener('click',()=>setMode(false));
$('#mode-agent').addEventListener('click',()=>setMode(true));
$('#hero-ask').addEventListener('click',openAgent);
document.querySelectorAll('[data-lang]').forEach(button=>button.addEventListener('click',()=>setLanguage(button.dataset.lang)));
document.querySelectorAll('[data-category]').forEach(button=>button.addEventListener('click',()=>{const category=button.dataset.category;renderCatalog(category==='other'?products:products.filter(product=>product.category===category));$('#products').scrollIntoView({behavior:'smooth'});}));
$('#site-search').addEventListener('submit',event=>{event.preventDefault();const query=$('#site-search-input').value.trim();if(!query)return;openAgent();send(query);});
$('#chat-form').addEventListener('submit',event=>{event.preventDefault();send($('#chat-input').value);});
$('#attach-button').addEventListener('click',()=>$('#file-input').click());
$('#file-input').addEventListener('change',event=>attach(event.target.files));
$('#checkout-button').addEventListener('click',()=>{const note=$('.cart-note');note.textContent='Демо-корзина готова. Оформление станет доступно после подключения к платформе ekt.kz.';note.scrollIntoView({behavior:'smooth'});});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){if(state.fullscreen)setFullscreen(false);else closeAgent();}});
window.QuantMedia?.configure({onAsk(product){openAgent();send(`${state.lang==='kz'?'Тауар туралы айт':'Расскажи о товаре'} ${product.sku}`);},onBuy(product){openAgent();addText(`${state.lang==='kz'?'Сатып алу':'Купить'}: ${product.name}`,'user','action');prepareAdd(product,1);}});
renderCatalog();renderCart();if(currentChat()){renderConversation();renderHistory();}else newChat();
