// Run with Playwright available through NODE_PATH; uses a fresh browser session.
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.QUANT_BROWSER_CHANNEL||undefined,args:['--enable-unsafe-swiftshader']});
 try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.QUANT_TEST_URL||'http://127.0.0.1:8001/static/visual-demo.html');
 await page.waitForFunction(()=>document.querySelectorAll('#product-grid .product-card').length===10);
 const cards=page.locator('#product-grid .product-card');
 for(const sku of ['EK-VA4729-C16','EK-CAB-VVG-325-20','EK-LED-18W']){
   await cards.filter({hasText:sku}).getByRole('button',{name:/^3D-модель:/}).click();
   await page.locator('.media-stage canvas').waitFor();
   await page.waitForFunction(()=>!document.querySelector('.media-tool--action').disabled);
   await page.locator('.media-tool--action').click();
   await page.getByRole('button',{name:'Приблизить',exact:true}).click();
   await page.getByRole('button',{name:'Исходный вид',exact:true}).click();
   await page.getByRole('button',{name:'Закрыть просмотр',exact:true}).click();
   console.log('3D interaction OK',sku);
 }
 await cards.filter({hasText:'EK-VA4729-C16'}).getByRole('button',{name:/^3D-модель:/}).click();
 await page.getByRole('button',{name:'Выбрать количество',exact:true}).click();
 const card=page.locator('.chat-product').last();
 const before=await page.locator('#chat-messages>.message').count();
 await card.getByRole('button',{name:'Похожие',exact:true}).click();
 if(await page.locator('#chat-messages>.message').count()!==before)throw Error('Related made new message');
 if(!(await card.locator('.chat-product__related').innerText()).includes('C25'))throw Error('Missing related');
 await card.getByRole('button',{name:'Увеличить количество',exact:true}).click();
 await card.getByRole('button',{name:'Добавить в корзину',exact:true}).click();
 await page.getByRole('button',{name:'Да, добавить',exact:true}).waitFor();
 if(await page.locator('#cart-count').innerText()!=='0')throw Error('Cart changed before confirm');
 await page.getByRole('button',{name:'Да, добавить',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('#cart-count').textContent==='2');
 console.log('Quantity=2, explicit confirmation, server cart OK');
 if(errors.length)throw Error(errors.join('\n'));
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
