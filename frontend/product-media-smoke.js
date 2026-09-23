// macOS: /System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc frontend/product-media-smoke.js
class MediaNode {
  constructor(tag){this.tagName=tag;this.children=[];this.attributes={};this.events={};}
  append(...children){this.children.push(...children);}
  setAttribute(name,value){this.attributes[name]=value;}
  addEventListener(name,handler){this.events[name]=handler;}
}
const mediaDocument={documentElement:{lang:'ru'},createElement:tag=>new MediaNode(tag),createElementNS:(_,tag)=>new MediaNode(tag)};
const mediaWindow={};
new Function('window','document',readFile('frontend/product-media.js'))(mediaWindow,mediaDocument);
const catalog=JSON.parse(readFile('frontend/backend-catalog.json'));
function check(value,message){if(!value)throw Error(message);print('✓ '+message);}
const media=mediaWindow.QuantMedia;
check(catalog.every(item=>media.get(item.sku)),'Все артикулы backend имеют привязку изображения');
check(catalog.filter(item=>media.get(item.sku).model).length===3,'В каталоге ровно три интерактивные модели');
check(media.get('EK-VA4729-C16').image!==media.get('EK-VA4729-C25').image,'C16 и C25 используют отдельные фотографии');
check(media.get('EK-CAB-VVG-325-20').model==='cable','Кабелю назначена модель кабеля');
check(media.get('EK-LED-18W').note.includes('пример'),'Неподтверждённое изображение светильника помечено как пример');
check(media.createThumbnail({sku:'UNKNOWN'})===null,'Неизвестному SKU не подставляется чужое изображение');
const product=catalog.find(item=>item.sku==='EK-VA4729-C16');
const card=media.createThumbnail(product,'chat');
check(card.className==='product-media product-media--chat','Миниатюра поддерживает карточку чата');
check(card.children[0].children[0].src===media.get(product.sku).image,'Фото соответствует артикулу');
check(card.children[0].attributes['aria-label'].includes(product.name),'Кнопка фото имеет доступное название товара');
check(card.children[2].attributes['aria-label'].startsWith('3D-модель:'),'Отдельная кнопка открывает 3D');
mediaDocument.documentElement.lang='kk';
check(media.createThumbnail(product).children[0].attributes['aria-label'].startsWith('Суретті ашу'),'Подпись открытия фото учитывает KZ');
const onlyPhoto=media.createThumbnail(catalog.find(item=>item.sku==='EK-VA4729-C25'));
check(onlyPhoto.children.length===2,'У товара без 3D нет неработающей кнопки');
