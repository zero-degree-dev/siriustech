import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import s from './technology-globe.module.css';
export interface GlobeController { setPaused(value:boolean):void; setVisible(value:boolean):void; key(key:string):void; reset():void; dispose():void }
const technologies = [
 {text:'Python & FastAPI', position:[0.8,2.1,0.2],color:'#38bdf8'},
 {text:'Docker & Kubernetes',position:[-1.8,1.25,0.6],color:'#38bdf8'},
 {text:'Kafka & Microservices',position:[2.05,1,0.1],color:'#38bdf8'},
 {text:'1С:Предприятие 8.3',position:[-2,0.45,0.3],color:'#fbbf24'},
 {text:'React / TypeScript',position:[2.1,-0.1,0.6],color:'#38bdf8'},
 {text:'Highload Golang / Rust',position:[-2.15,-1,0.4],color:'#38bdf8'},
 {text:'iOS (Swift) / Android',position:[-1.2,-1.8,0.4],color:'#22c55e'},
 {text:'CI/CD Cloud DevOps',position:[0.9,-2.1,0.2],color:'#38bdf8'},
 {text:'Java & Spring Boot',position:[0.5,0.8,-1.4],color:'#38bdf8'},
 {text:'PostgreSQL & Oracle',position:[0.7,-0.8,-1.3],color:'#38bdf8'},
];
export function createGlobe(host:HTMLDivElement):GlobeController {
 const renderer = new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.75));renderer.setClearColor(0x071324,0);host.appendChild(renderer.domElement);
 renderer.domElement.setAttribute('aria-hidden','true');
 const scene=new THREE.Scene();const camera=new THREE.PerspectiveCamera(43,1,0.1,100);camera.position.set(0,0.2,7.3);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableZoom=false;controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=0.06;controls.autoRotate=true;controls.autoRotateSpeed=0.35;controls.minPolarAngle=0.35;controls.maxPolarAngle=Math.PI-0.35;
 const group=new THREE.Group();group.rotation.z=-0.17;scene.add(group);
 const surface=new THREE.Mesh(new THREE.SphereGeometry(1.6,48,32),new THREE.MeshPhongMaterial({color:0x003b9c,emissive:0x001c5c,shininess:80,transparent:true,opacity:0.92}));group.add(surface);
 const wire=new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.SphereGeometry(1.61,32,20)),new THREE.LineBasicMaterial({color:0x009be8,transparent:true,opacity:0.42}));group.add(wire);
 scene.add(new THREE.AmbientLight(0x1c4fff,1.2));const light=new THREE.PointLight(0x008cff,28,20);light.position.set(2,3,4);scene.add(light);
 const rim=new THREE.Mesh(new THREE.SphereGeometry(1.66,40,32),new THREE.ShaderMaterial({transparent:true,side:THREE.BackSide,depthWrite:false,uniforms:{color:{value:new THREE.Color(0x009eea)}},vertexShader:'varying vec3 vNormal; varying vec3 vView; void main(){vec4 p=modelViewMatrix*vec4(position,1.);vNormal=normalize(normalMatrix*normal);vView=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',fragmentShader:'uniform vec3 color; varying vec3 vNormal; varying vec3 vView; void main(){float edge=pow(1.-abs(dot(normalize(vNormal),normalize(vView))),3.);gl_FragColor=vec4(color,edge*.85);}'}));group.add(rim);
 [0.3,-0.65,1.1].forEach((tilt,i)=>{const points=[];for(let j=0;j<=128;j++){const a=j/128*Math.PI*2;points.push(new THREE.Vector3(Math.cos(a)*(2.45+i*.1),Math.sin(a)*0.95,0));}const ring=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0x00b9ed,transparent:true,opacity:0.65}));ring.rotation.x=tilt;ring.rotation.z=tilt;group.add(ring);});
 const starPositions=[];let seed=42;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<100;i++)starPositions.push((random()-.5)*9,(random()-.5)*6,-1-random()*3);
 const starsGeometry=new THREE.BufferGeometry();starsGeometry.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));scene.add(new THREE.Points(starsGeometry,new THREE.PointsMaterial({color:0x43c7ef,size:0.018,transparent:true,opacity:0.65})));
 const labels=technologies.map(item=>{const element=document.createElement('span');element.className=s.technology__label;element.textContent=item.text;element.style.setProperty('--label-color',item.color);host.appendChild(element);const position=new THREE.Vector3(...item.position as [number,number,number]);const dot=new THREE.Mesh(new THREE.SphereGeometry(0.035,8,8),new THREE.MeshBasicMaterial({color:item.color}));dot.position.copy(position);group.add(dot);return {element,position};});
 let running=false;let disposed=false;let frame=0;let previous=0;let paused=false;let width=1,height=1;
 function render(time:number){if(!running||disposed)return;const delta=previous?Math.min((time-previous)/1000,.05):0;previous=time;controls.update(delta);group.updateMatrixWorld();for(const label of labels){const world=group.localToWorld(label.position.clone());const projected=world.clone().project(camera);label.element.style.left=`${(projected.x*.5+.5)*width}px`;label.element.style.top=`${(-projected.y*.5+.5)*height}px`;const back=world.clone().sub(camera.position).length()>camera.position.length()+.5;label.element.style.opacity=back?'0.24':'1';label.element.style.zIndex=back?'0':'2';}renderer.render(scene,camera);frame=requestAnimationFrame(render);}
 const resize=()=>{width=host.clientWidth;height=host.clientHeight;renderer.setSize(width,height);camera.aspect=width/height;camera.position.setLength(width<600?9.5:7.3);camera.updateProjectionMatrix();};
 const observer=new ResizeObserver(resize);observer.observe(host);resize();
 const stopInteraction=()=>{controls.autoRotate=false;};const startAgain=()=>{controls.autoRotate=!paused;};controls.addEventListener('start',stopInteraction);controls.addEventListener('end',startAgain);
 return {
 setPaused(value){paused=value;controls.autoRotate=!value;},
 setVisible(value){if(value&&!running){running=true;previous=0;frame=requestAnimationFrame(render);}else if(!value){running=false;cancelAnimationFrame(frame);}},
 key(key){if(key==='Home')controls.reset();else if(key==='ArrowLeft')controls.rotateLeft(.12);else if(key==='ArrowRight')controls.rotateLeft(-.12);else if(key==='ArrowUp')controls.rotateUp(.12);else if(key==='ArrowDown')controls.rotateUp(-.12);},
 reset(){controls.reset();resize();},
 dispose(){disposed=true;running=false;cancelAnimationFrame(frame);observer.disconnect();controls.dispose();scene.traverse(object=>{if(object instanceof THREE.Mesh||object instanceof THREE.Line||object instanceof THREE.Points){object.geometry.dispose();const materials=Array.isArray(object.material)?object.material:[object.material];materials.forEach(material=>material.dispose());}});renderer.dispose();renderer.domElement.remove();labels.forEach(label=>label.element.remove());}
 };
}
