"use client";
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Container } from '@/shared/ui';
import s from './technology-globe.module.css';
export function TechnologyGlobe() {
 const host = useRef<HTMLDivElement>(null); const controller = useRef<import('./scene').GlobeController | null>(null);
 const [ready,setReady] = useState(false); const [failed,setFailed] = useState(false); const [paused,setPaused] = useState(false);
 useEffect(()=>{
  const element = host.current; if(!element) return;
  let disposed = false; let started = false; let visible = false;
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const preference = ()=>{ controller.current?.setPaused(media.matches); setPaused(media.matches); };
  media.addEventListener('change',preference); preference();
  const observer = new IntersectionObserver(async entries=>{
   visible = entries[0].isIntersecting; controller.current?.setVisible(visible && !document.hidden);
   if(!visible || started) return; started = true;
   try {
    const {createGlobe} = await import('./scene'); if(disposed) return;
    controller.current = createGlobe(element); controller.current.setPaused(media.matches); controller.current.setVisible(visible && !document.hidden);setReady(true);
   } catch { if(!disposed) setFailed(true); }
  },{rootMargin:'160px'});
  observer.observe(element);
  const visibility = ()=>controller.current?.setVisible(visible && !document.hidden);
  document.addEventListener('visibilitychange',visibility);
  return ()=>{disposed=true;observer.disconnect();media.removeEventListener('change',preference);document.removeEventListener('visibilitychange',visibility);controller.current?.dispose();controller.current=null;};
 },[]);
 return <section id="technologies" className={s.technology} aria-labelledby="technology-title"><Container><h2 id="technology-title">Наши технологии</h2><div className={s.technology__viewport}>
 <div className={s.technology__meta}><span><i/>3D INTERACTIVE VIEWPORT · DRAG TO ROTATE</span><span>GL CORE V4.2</span></div>
 <div ref={host} className={s.technology__scene} data-ready={ready} tabIndex={ready?0:-1} role="group" aria-label="Интерактивный глобус технологий. Вращайте мышью, касанием или клавишами стрелок. Home — сброс." onKeyDown={event=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key)){event.preventDefault();controller.current?.key(event.key);}}}>
 {!ready && <Image className={s.technology__fallback} src="/landing/globe-fallback.png" alt="Технологический глобус: Python, Docker, Java, React, PostgreSQL, iOS и Android" fill sizes="(max-width: 767px) 100vw, 1024px"/>}
 </div>
 <div className={s.technology__bottom}><div className={s.technology__controls}>{ready?<><button type="button" onClick={()=>{const next=!paused;setPaused(next);controller.current?.setPaused(next);}} aria-pressed={paused}>{paused?'Вращать':'Пауза'}</button><button type="button" onClick={()=>controller.current?.reset()}>Сбросить</button></>:<span>{failed?'Статичная версия · 3D недоступно':'Загрузка 3D…'}</span>}</div><span>ENTERPRISE GRADE ARCHITECTURE · 2025</span></div>
 </div></Container></section>;
}
