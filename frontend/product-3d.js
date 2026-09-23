import * as THREE from 'three';
import { OrbitControls } from './vendor/three/OrbitControls.js';
import { RoundedBoxGeometry } from './vendor/three/RoundedBoxGeometry.js';

const material = (color, options={}) => new THREE.MeshStandardMaterial({color,roughness:.4,metalness:0,...options});
function mesh(parent, geometry, surface, position=[0,0,0], part=0) {
  const item=new THREE.Mesh(geometry,surface);item.position.set(...position);item.castShadow=true;item.receiveShadow=true;item.userData.part=part;parent.add(item);return item;
}
const box = (parent,size,surface,position,part) => mesh(parent,new RoundedBoxGeometry(...size,3,.055),surface,position,part);
const cylinder = (parent,radius,length,surface,position,part) => mesh(parent,new THREE.CylinderGeometry(radius,radius,length,40),surface,position,part);
function anchor(parent,position){const point=new THREE.Object3D();point.position.set(...position);parent.add(point);return point;}
function part(lang,ru,kz,ruDescription,kzDescription,point){return {title:lang==='kz'?kz:ru,description:lang==='kz'?kzDescription:ruDescription,anchor:point};}

function cableModel(lang) {
  const group=new THREE.Group();group.rotation.z=-.18;
  const jacket=new THREE.Group();group.add(jacket);
  // Открытый конец показывает три изолированные медные жилы.
  cylinder(jacket,.53,2.15,material('#17212d',{roughness:.65}),[0,-.6,0],0);
  cylinder(jacket,.47,.035,material('#d6e1e8'),[0,.48,0],0);
  const cores=[];
  [[-.23,.06,'#267cdd'],[.21,.08,'#e8cb37'],[0,-.25,'#e1e8eb']].forEach(([x,z,color],index)=>{
    const core=new THREE.Group();core.position.set(x,0,z);group.add(core);cores.push(core);
    cylinder(core,.184,1.02,material(color,{roughness:.32}),[0,.84,0],1);
    if(index===1){const stripe=mesh(core,new THREE.CylinderGeometry(.186,.186,1.02,24,1,false,0,.55),material('#23834b'),[0,.84,0],1);stripe.rotation.y=.25;}
    cylinder(core,.105,.56,material('#bf7d37',{metalness:.85,roughness:.25}),[0,1.62,0],2);
    for(let i=0;i<5;i++)cylinder(core,.009,.57,material('#dc9a50',{metalness:.8,roughness:.3}),[Math.cos(i*1.25)*.05,1.62,Math.sin(i*1.25)*.05],2);
  });
  const parts=[
    part(lang,'Оболочка','Қабық','Наружная оболочка объединяет жилы кабеля. Разобранный вид помогает увидеть их расположение.','Сыртқы қабық кабель өзектерін біріктіреді. Бөлшектелген көрініс олардың орналасуын көрсетеді.',anchor(jacket,[.48,-.68,.22])),
    part(lang,'Изоляция','Оқшаулау','Три жилы имеют отдельную изоляцию. Цвета на модели приведены для наглядности.','Үш өзектің жеке оқшаулауы бар. Модель түстері көрнекілік үшін берілген.',anchor(cores[0],[-.12,.9,.12])),
    part(lang,'Медная жила','Мыс өзек','По данным демо-каталога: медные жилы, сечение 3 × 2,5 мм². Изображён условный короткий фрагмент.','Демо-каталог бойынша: мыс өзектер, қимасы 3 × 2,5 мм². Қысқа шартты бөлік көрсетілген.',anchor(cores[1],[.04,1.84,.03]))
  ];
  let exploded=false;let progress=0;
  const label=()=>lang==='kz'?(exploded?'Жинау':'Бөлшектеу'):(exploded?'Собрать кабель':'Разобрать кабель');
  return {group,parts,get actionLabel(){return label();},action(){exploded=!exploded;return label();},update(delta){progress=THREE.MathUtils.damp(progress,exploded?1:0,9,delta);jacket.position.y=-progress*.3;cores[0].position.x=-.23-progress*.36;cores[1].position.x=.21+progress*.36;cores[2].position.z=-.25-progress*.33;}};
}

function labelTexture() {
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const ctx=canvas.getContext('2d');
  ctx.fillStyle='#fafcff';ctx.fillRect(0,0,512,512);ctx.fillStyle='#e2edf9';ctx.fillRect(0,78,512,5);
  ctx.fillStyle='#193757';ctx.font='700 57px Arial';ctx.fillText('ВА47-29',32,64);ctx.font='700 85px Arial';ctx.fillText('C16',30,193);ctx.font='30px Arial';ctx.fillText('2P    4,5 кА',32,250);ctx.font='22px Arial';ctx.fillStyle='#7191b4';ctx.fillText('3D · DEMO',32,305);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

function breakerModel(lang) {
  const group=new THREE.Group();const white=material('#eff3f6',{roughness:.35});const bodyFront=material('#ffffff',{roughness:.32});const dark=material('#293446');const screw=material('#adb3a0',{metalness:.82,roughness:.3});
  [-.355,.355].forEach(x=>{
    box(group,[.69,2.7,1.16],white,[x,0,0],0);
    box(group,[.66,1.5,.23],bodyFront,[x,-.04,.65],0);
    [-1.02,1.02].forEach(y=>{
      const recess=cylinder(group,.16,.07,dark,[x,y,.611],1);recess.rotation.x=Math.PI/2;
      const head=cylinder(group,.103,.08,screw,[x,y,.66],1);head.rotation.x=Math.PI/2;
      box(group,[.12,.017,.01],material('#41505c'),[x,y,.708],1);
      box(group,[.017,.12,.01],material('#41505c'),[x,y,.71],1);
    });
    for(let i=0;i<5;i++)box(group,[.017,.7,.03],material('#d3dfe8'),[x-.27+i*.13,.6,-.593],0);
  });
  const label=mesh(group,new THREE.PlaneGeometry(1.25,.98),new THREE.MeshStandardMaterial({map:labelTexture(),roughness:.5}),[0,.27,.775],0);
  const lever=new THREE.Group();lever.position.set(0,-.48,.78);group.add(lever);
  box(group,[1.24,.25,.34],material('#e5b32a',{roughness:.33}),[0,0,.14],2);
  [-.34,.34].forEach(x=>box(lever,[.48,.36,.18],material('#efc342'),[x,-.16,.08],2));
  box(group,[.7,.17,.24],dark,[0,-1.36,-.35],0);
  const parts=[
    part(lang,'Корпус','Корпус','Двухполюсный автомат ВА47-29. На схеме показана общая форма без точных монтажных размеров.','ВА47-29 екі полюсті автоматы. Схемада нақты монтаж өлшемдерінсіз жалпы пішін көрсетілген.',anchor(group,[-.57,.37,.62])),
    part(lang,'Клеммы','Клеммалар','Контактные зажимы для подключения проводников. Нажмите на модель, чтобы рассмотреть расположение.','Өткізгіштерді қосуға арналған қысқыштар. Орналасуын көру үшін модельді басыңыз.',anchor(group,[.35,1.05,.72])),
    part(lang,'Рычаг','Тетік','Нажмите на рычаг или кнопку под моделью: он изменит положение. Это демонстрация механики.','Тетікті немесе модель астындағы батырманы басыңыз: орны өзгереді. Бұл механика демонстрациясы.',anchor(lever,[.48,-.02,.36]))
  ];
  let enabled=true;let rotation=0;const actionLabel=()=>lang==='kz'?'Тетікті ауыстыру':'Переключить рычаг';
  return {group,parts,actionLabel:actionLabel(),action(){enabled=!enabled;return actionLabel();},onPart(index){if(index===2)enabled=!enabled;},update(delta){rotation=THREE.MathUtils.damp(rotation,enabled?-.25:.62,12,delta);lever.rotation.x=rotation;}};
}

function lightModel(lang) {
  const group=new THREE.Group();const base=material('#293949',{roughness:.4});
  const body=cylinder(group,1.27,.35,base,[0,0,0],0);body.rotation.x=Math.PI/2;
  const rim=mesh(group,new THREE.TorusGeometry(1.19,.115,24,80),material('#33475b'),[0,0,.21],0);
  const offColor=new THREE.Color('#95b1c4');const onColor=new THREE.Color('#f7fcff');
  const diffuserMaterial=material(offColor,{roughness:.27,emissive:'#b8dcff',emissiveIntensity:.04});
  const diffuser=mesh(group,new THREE.SphereGeometry(1.12,64,32),diffuserMaterial,[0,0,.23],1);diffuser.scale.z=.15;
  const rear=cylinder(group,.78,.12,material('#d3deea'),[0,0,-.23],2);rear.rotation.x=Math.PI/2;
  [-.6,.6].forEach(x=>box(group,[.23,.35,.12],material('#445366'),[x,0,-.27],2));
  const parts=[
    part(lang,'Корпус','Корпус','Корпус светильника. В демо-каталоге для выбранной позиции указана степень защиты IP65.','Жарықшам корпусы. Демо-каталогта осы тауар үшін IP65 қорғаныс дәрежесі көрсетілген.',anchor(group,[1.15,.4,.23])),
    part(lang,'Рассеиватель','Шашыратқыш','Матовый рассеиватель. Включите свет, чтобы увидеть условный эффект свечения.','Күңгірт шашыратқыш. Шартты жарық әсерін көру үшін шамды қосыңыз.',anchor(group,[-.4,.35,.42])),
    part(lang,'Основание','Табан','Задняя часть показана схематично. Поверните модель, чтобы рассмотреть её со всех сторон.','Артқы бөлік шартты түрде көрсетілген. Барлық жағынан көру үшін модельді айналдырыңыз.',anchor(group,[-.8,-.65,-.22]))
  ];
  let enabled=false;let glow=0;const label=()=>lang==='kz'?(enabled?'Жарықты өшіру':'Жарықты қосу'):(enabled?'Выключить свет':'Включить свет');
  return {group,parts,get actionLabel(){return label();},action(){enabled=!enabled;return label();},update(delta){glow=THREE.MathUtils.damp(glow,enabled?1:0,7,delta);diffuserMaterial.color.copy(offColor).lerp(onColor,glow);diffuserMaterial.emissiveIntensity=.04+glow*.95;}};
}

export function createProductViewer(host,type,{lang='ru',onSelect=()=>{}}={}) {
  const make={cable:cableModel,breaker:breakerModel,light:lightModel}[type];
  if(!make)throw new Error('Unknown model');
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.setClearColor(0xffffff,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;host.append(renderer.domElement);
  const canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',lang==='kz'?'Интерактивті 3D-модель. Көрсеткілер — айналдыру, плюс пен минус — масштаб.':'Интерактивная 3D-модель. Стрелки — вращение, плюс и минус — масштаб.');
  const scene=new THREE.Scene();const model=make(lang);scene.add(model.group);
  scene.add(new THREE.HemisphereLight('#ffffff','#7497c1',2.8));
  const main=new THREE.DirectionalLight('#fff6e8',4.4);main.position.set(4,6,5);main.castShadow=true;main.shadow.mapSize.set(1024,1024);main.shadow.camera.left=-4;main.shadow.camera.right=4;main.shadow.camera.top=4;main.shadow.camera.bottom=-4;main.shadow.normalBias=.025;scene.add(main);
  const fill=new THREE.DirectionalLight('#b2d8ff',2.2);fill.position.set(-4,2,3);scene.add(fill);
  const back=new THREE.DirectionalLight('#ffffff',3);back.position.set(2,3,-4);scene.add(back);
  const floor=mesh(scene,new THREE.CircleGeometry(4,64),new THREE.ShadowMaterial({opacity:.1}),[0,-1.95,0]);floor.rotation.x=-Math.PI/2;floor.castShadow=false;floor.userData.part=undefined;
  const camera=new THREE.PerspectiveCamera(35,1,.1,60);camera.position.set(3,1.8,6);if(type==='light')camera.position.set(2.4,1.4,5.8);
  const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.085;controls.enablePan=false;controls.minDistance=3.3;controls.maxDistance=10;controls.minPolarAngle=.15;controls.maxPolarAngle=Math.PI-.15;controls.rotateSpeed=.7;controls.saveState();
  let active=false;let disposed=false;let frame=0;let last=0;let selected=0;
  const markers=model.parts.map((item,index)=>{const value=document.createElement('button');value.className='model-hotspot';value.type='button';value.textContent=`0${index+1}`;value.setAttribute('aria-label',item.title);value.addEventListener('click',()=>select(index));host.append(value);return value;});
  const projector=new THREE.Vector3();
  function select(index){selected=index;markers.forEach((value,i)=>value.setAttribute('aria-pressed',String(i===index)));onSelect(index);}
  function resize(){const rect=host.getBoundingClientRect();if(!rect.width||!rect.height)return;camera.aspect=rect.width/rect.height;camera.updateProjectionMatrix();renderer.setSize(rect.width,rect.height,false);}
  function tick(time){if(!active||disposed)return;const delta=last?Math.min((time-last)/1000,.05):.016;last=time;model.update(delta);controls.update();scene.updateMatrixWorld(true);renderer.render(scene,camera);
    const rect=host.getBoundingClientRect();model.parts.forEach((item,index)=>{item.anchor.getWorldPosition(projector);projector.project(camera);const marker=markers[index];marker.style.left=`${(projector.x*.5+.5)*rect.width}px`;marker.style.top=`${(-projector.y*.5+.5)*rect.height}px`;marker.hidden=projector.z>1||projector.z<-1;});
    frame=requestAnimationFrame(tick);
  }
  function setActive(value){active=value&&!document.hidden;cancelAnimationFrame(frame);last=0;if(active){resize();frame=requestAnimationFrame(tick);}}
  const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();let down=null;
  const onDown=event=>{down={x:event.clientX,y:event.clientY};};
  const onUp=event=>{if(!down||Math.hypot(event.clientX-down.x,event.clientY-down.y)>6)return;const rect=canvas.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObject(model.group,true).find(item=>Number.isInteger(item.object.userData.part));if(hit){select(hit.object.userData.part);model.onPart?.(selected);}down=null;};
  canvas.addEventListener('pointerdown',onDown);canvas.addEventListener('pointerup',onUp);
  function zoom(factor){const offset=camera.position.clone().sub(controls.target);offset.setLength(THREE.MathUtils.clamp(offset.length()*factor,controls.minDistance,controls.maxDistance));camera.position.copy(controls.target).add(offset);controls.update();}
  const keydown=event=>{if(event.key==='+'||event.key==='=')zoom(.86);else if(event.key==='-')zoom(1.16);else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(event.key)){const spherical=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));spherical.theta+=event.key==='ArrowLeft'?.14:event.key==='ArrowRight'?-.14:0;spherical.phi=THREE.MathUtils.clamp(spherical.phi+(event.key==='ArrowUp'?-.14:event.key==='ArrowDown'?.14:0),.15,Math.PI-.15);camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));controls.update();}else return;event.preventDefault();};canvas.addEventListener('keydown',keydown);
  let requestedActive=false;const visibility=()=>setActive(requestedActive);document.addEventListener('visibilitychange',visibility);
  const observer=new ResizeObserver(resize);observer.observe(host);resize();
  return {parts:model.parts,actionLabel:model.actionLabel,action:()=>model.action(),select,zoom,reset(){controls.reset();},setActive(value){requestedActive=value;setActive(value);},dispose(){disposed=true;active=false;cancelAnimationFrame(frame);observer.disconnect();document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('pointerdown',onDown);canvas.removeEventListener('pointerup',onUp);canvas.removeEventListener('keydown',keydown);controls.dispose();const geometries=new Set(),materials=new Set(),textures=new Set();scene.traverse(object=>{if(object.geometry)geometries.add(object.geometry);if(object.material){for(const surface of [object.material].flat()){materials.add(surface);for(const value of Object.values(surface))if(value?.isTexture)textures.add(value);}}});textures.forEach(value=>value.dispose());geometries.forEach(value=>value.dispose());materials.forEach(value=>value.dispose());renderer.dispose();renderer.forceContextLoss();host.replaceChildren();}};
}
