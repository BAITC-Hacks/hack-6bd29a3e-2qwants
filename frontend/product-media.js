/* Медиа привязаны к артикулу: замена каталога не меняет соответствие фотографий. */
(() => {
  const breakerSource = 'https://www.iek.ru/products/catalog/modulnoe_oborudovanie/modulnoe_oborudovanie_karat/modulnye_avtomaticheskie_vyklyuchateli_karat/modulnye_avtomaticheskie_vyklyuchateli_va47_29/modulnye_avtomaticheskie_vyklyuchateli_va47_29_khar_ka_c/';
  const cable = {image:'assets/products/cable-vvg.jpg', label:'Изображение серии ВВГнг-LS', source:'https://ekt.kz/catalog/kabel_provod/kabel_silovoy_dlya_statsionarnoy_prokladki_/vvg_p_ng_a_ls_3kh_2_5_0_66_kv_300_gost_ekt/', credit:'ekt.kz', note:'Изображение серии. Упаковка и длина бухты зависят от выбранного артикула.'};
  const light = {image:'assets/products/light-ringo.jpg', label:'Пример светильника IP65', source:'https://taldykorgan.ekt.kz/catalog/svetilniki_lampy/svetilniki_germetichnye_dlya_vnutrennego_i_naruzhnogo_osveshcheniya/nakladnye_svetodiodnye_led_dpb_ip65/led_dpb_ringo_18w_1350lm_d220x67_4000k_ip65_megalight_20/', credit:'ekt.kz · MEGALIGHT', note:'В демо-каталоге серия не задана. Для визуализации использован RINGO; это пример формы, а не фото подтверждённой модели.'};
  const media = {
    'EK-VA4729-C16':{image:'assets/products/breaker-c16.png',label:'Фото ВА47-29 2P C16',model:'breaker',source:breakerSource+'karat_avtomaticheskiy_vyklyuchatel_va47_29_2p_c_16a_4_5ka_iek',credit:'IEK',note:'Фото ВА47-29 2P C16 из каталога производителя. 3D показывает устройство схематично.'},
    'EK-VA4729-C25':{image:'assets/products/breaker-c25.png',label:'Фото ВА47-29 2P C25',source:breakerSource+'karat_avtomaticheskiy_vyklyuchatel_va47_29_2p_c_25a_4_5ka_iek',credit:'IEK',note:'Фото ВА47-29 2P C25 из каталога производителя.'},
    'EK-CAB-VVG-325':{...cable},
    'EK-CAB-VVG-325-20':{...cable,model:'cable'},
    'EK-LED-18W':{...light,model:'light'},
    'EK-LED-IP65-18':{...light,model:'light'},
    'EK-LED-IP65-24':{...light}
  };
  const labels = {
    ru:{open:'Открыть изображение',photo:'Фото',model:'3D-модель',title:'ОБЗОР ТОВАРА',close:'Закрыть просмотр',hint:'Вращайте модель мышью или пальцем. Нажмите на деталь.',loading:'Загружаем 3D…',error:'Не удалось открыть 3D. Фотография доступна во вкладке «Фото».',file:'Для 3D откройте проект по адресу http://127.0.0.1:8010/',reset:'Исходный вид',zoomIn:'Приблизить',zoomOut:'Отдалить',parts:'Рассмотрите детали',disclaimer:'Наглядная 3D-схема. Геометрия и размеры условные.',stock:'В наличии',out:'Нет в наличии',ask:'Спросить Quant',buy:'Выбрать количество',source:'Источник изображения',characteristics:'Характеристики',available:'Доступно в 3D',unit:'шт.'},
    kz:{open:'Суретті ашу',photo:'Фото',model:'3D-модель',title:'ТАУАРДЫ ҚАРАУ',close:'Қарауды жабу',hint:'Модельді тінтуірмен не саусақпен айналдырыңыз. Бөлшекті басыңыз.',loading:'3D жүктелуде…',error:'3D ашылмады. Фото қойындысын пайдаланыңыз.',file:'3D үшін http://127.0.0.1:8010/ мекенжайын ашыңыз.',reset:'Бастапқы көрініс',zoomIn:'Жақындату',zoomOut:'Алыстату',parts:'Бөлшектерді қараңыз',disclaimer:'Көрнекі 3D-схема. Пішіні мен өлшемдері шартты.',stock:'Қоймада бар',out:'Қоймада жоқ',ask:'Quant-тан сұрау',buy:'Санын таңдау',source:'Сурет дереккөзі',characteristics:'Сипаттамалар',available:'3D қолжетімді',unit:'дана'}
  };
  const text = () => labels[document.documentElement.lang === 'kk' ? 'kz' : 'ru'];
  const node = (tag, className, content) => {const value=document.createElement(tag);value.className=className||'';if(content!==undefined)value.textContent=content;return value;};
  const button = (className,label,handler) => {const value=node('button',className,label);value.type='button';value.addEventListener('click',handler);return value;};
  const icon = name => {const value=document.createElementNS('http://www.w3.org/2000/svg','svg');const use=document.createElementNS('http://www.w3.org/2000/svg','use');use.setAttribute('href',`#i-${name}`);value.append(use);value.setAttribute('aria-hidden','true');return value;};
  let callbacks = {};
  let currentDialog = null;

  function createThumbnail(product, context='catalog') {
    const entry=media[product.sku];if(!entry)return null;
    const wrap=node('div',`product-media product-media--${context}`);
    const preview=button('product-media__photo','',()=>open(product,'photo'));
    preview.setAttribute('aria-label',`${text().open}: ${product.name}`);
    const image=node('img');image.src=entry.image;image.alt=entry.label;image.loading='lazy';image.decoding='async';
    image.addEventListener('error',()=>{image.hidden=true;preview.append(node('span','product-media__missing',product.name));},{once:true});
    preview.append(image,node('span','product-media__zoom','↗'));
    wrap.append(preview,node('span','product-media__caption',entry.label));
    if(entry.model){const view=button('product-media__3d','',()=>open(product,'model'));view.append(icon('box'),node('span','','3D'));view.setAttribute('aria-label',`${text().model}: ${product.name}`);wrap.append(view);}
    return wrap;
  }

  function open(product, initialMode='photo') {
    const entry=media[product.sku];if(!entry)return;
    currentDialog?.close();
    const copy=text();const lang=document.documentElement.lang==='kk'?'kz':'ru';
    const dialog=node('dialog','media-dialog');currentDialog=dialog;
    dialog.setAttribute('aria-labelledby','media-product-title');
    const header=node('header','media-dialog__header');
    const brand=node('div','media-dialog__brand');brand.append(node('span','media-dialog__quant','Q'),node('span','',`QUANT / ${copy.title}`));
    const close=button('media-dialog__close','×',()=>dialog.close());close.setAttribute('aria-label',copy.close);header.append(brand,close);
    const layout=node('div','media-dialog__layout');const visual=node('section','media-visual');
    const tabs=node('div','media-tabs');tabs.setAttribute('role','tablist');
    const photoTab=button('media-tabs__tab',copy.photo,()=>setMode('photo'));photoTab.setAttribute('role','tab');
    const modelTab=button('media-tabs__tab',copy.model,()=>setMode('model'));modelTab.setAttribute('role','tab');modelTab.hidden=!entry.model;
    tabs.append(photoTab,modelTab);const badge=node('span','media-visual__badge',entry.model?'360°':'ZOOM');
    const top=node('div','media-visual__top');top.append(tabs,badge);
    const stage=node('div','media-stage');const image=node('img','media-stage__photo');image.src=entry.image;image.alt=entry.label;
    const canvasHost=node('div','media-stage__canvas');canvasHost.hidden=true;
    const status=node('p','media-stage__status');status.setAttribute('role','status');status.hidden=true;
    stage.append(image,canvasHost,status);
    const tools=node('div','media-tools');tools.hidden=true;
    const zoomOut=button('media-tool','−',()=>viewer?.zoom(1.16));zoomOut.setAttribute('aria-label',copy.zoomOut);
    const zoomIn=button('media-tool','+',()=>viewer?.zoom(.86));zoomIn.setAttribute('aria-label',copy.zoomIn);
    const reset=button('media-tool media-tool--reset',copy.reset,()=>viewer?.reset());
    const interaction=button('media-tool media-tool--action','',()=>{if(viewer)interaction.textContent=viewer.action();});interaction.disabled=true;
    tools.append(zoomOut,zoomIn,reset,interaction);
    const hint=node('p','media-visual__hint',entry.label);visual.append(top,stage,tools,hint);
    const info=node('section','media-info');
    info.append(node('span','media-info__sku',product.sku));
    const title=node('h2','media-info__title',product.name);title.id='media-product-title';info.append(title);
    const pricing=node('div','media-info__pricing');pricing.append(node('strong','',`${product.price.toLocaleString('ru-RU')} ₸`));
    const count=Object.values(product.warehouses||{stock:product.stock||0}).reduce((a,b)=>a+b,0);pricing.append(node('span','',count?`${copy.stock}: ${count} ${copy.unit}`:copy.out));info.append(pricing);
    const specs=node('dl','media-specs');Object.entries(product.characteristics).forEach(([key,value])=>{const row=node('div');row.append(node('dt','',key),node('dd','',value));specs.append(row);});info.append(specs);
    const partPanel=node('section','media-parts');partPanel.hidden=true;partPanel.append(node('h3','',copy.parts));const partList=node('div','media-parts__list');partPanel.append(partList);
    const detail=node('div','media-part-detail');detail.setAttribute('aria-live','polite');partPanel.append(detail);info.append(partPanel);
    const note=node('p','media-info__note',entry.note);const source=node('a','media-info__source',`${copy.source}: ${entry.credit} ↗`);source.href=entry.source;source.target='_blank';source.rel='noopener noreferrer';info.append(note,source);
    const actions=node('div','media-info__actions');const ask=button('button media-ask',copy.ask,()=>{dialog.close();callbacks.onAsk?.(product);});ask.prepend(icon('spark'));actions.append(ask);
    if(count>0){const buy=button('button button--blue',copy.buy,()=>{dialog.close();callbacks.onBuy?.(product);});buy.prepend(icon('cart'));actions.append(buy);}info.append(actions);
    layout.append(visual,info);dialog.append(header,layout);document.body.append(dialog);
    document.body.classList.add('media-open');dialog.showModal();close.focus();
    let viewer=null;let loading=null;let mode='photo';let alive=true;
    const partButtons=[];
    function selectPart(index){partButtons.forEach((item,i)=>item.setAttribute('aria-pressed',String(i===index)));const item=viewer?.parts[index];if(item){detail.replaceChildren(node('strong','',item.title),node('p','',item.description));}}
    async function setMode(next) {
      mode=next;const is3d=next==='model'&&!!entry.model;
      photoTab.setAttribute('aria-selected',String(!is3d));modelTab.setAttribute('aria-selected',String(is3d));
      image.hidden=is3d;canvasHost.hidden=!is3d;tools.hidden=!is3d;partPanel.hidden=!is3d;
      hint.textContent=is3d?copy.hint:entry.label;note.textContent=is3d?copy.disclaimer:entry.note;
      if(!is3d){status.hidden=true;viewer?.setActive(false);return;}
      if(viewer){viewer.setActive(true);return;}
      status.hidden=false;status.textContent=copy.loading;
      if(location.protocol==='file:'){status.textContent=copy.file;return;}
      if(!loading)loading=import('./product-3d.js').then(module=>{
        if(!alive)return;
        viewer=module.createProductViewer(canvasHost,entry.model,{lang,onSelect:selectPart});
        viewer.parts.forEach((part,index)=>{const item=button('media-part','',()=>viewer.select(index));item.append(node('span','',`0${index+1}`),node('strong','',part.title));partList.append(item);partButtons.push(item);});
        interaction.textContent=viewer.actionLabel;interaction.disabled=false;viewer.select(0);viewer.setActive(mode==='model');
      }).catch(()=>{if(alive){status.textContent=copy.error;loading=null;}});
      await loading;if(alive&&viewer)status.hidden=true;
    }
    dialog.addEventListener('keydown',event=>{if(event.key==='Escape')event.stopPropagation();});
    dialog.addEventListener('click',event=>{if(event.target===dialog){const bounds=dialog.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)dialog.close();}});
    dialog.addEventListener('close',()=>{alive=false;viewer?.dispose();dialog.remove();if(currentDialog===dialog){document.body.classList.remove('media-open');currentDialog=null;}},{once:true});
    setMode(initialMode);
  }
  window.QuantMedia={createThumbnail,open,configure(value){callbacks=value;},get:sku=>media[sku]};
})();
