"use client";
import { useState } from 'react';
import { services, ServiceCard } from '@/entities/service';
import { selectProjectService } from '@/features/request-project';
import { Container, Icon } from '@/shared/ui';
import s from './landing-services.module.css';
export function LandingServices() { const [expanded,setExpanded]=useState(false);return <section id="services" className={s.services} aria-labelledby="services-title"><Container><div className={s.services__heading}><h2 id="services-title">Инженерные услуги высшей категории</h2><button type="button" aria-expanded={expanded} aria-controls="services-list" onClick={()=>setExpanded(!expanded)}>{expanded?'Свернуть каталог':'Все услуги каталога'}<Icon/></button></div><div id="services-list" className={s.services__grid}>{services.slice(0,expanded?6:3).map((service,index)=><ServiceCard key={service.id} service={service} index={index} href="#request" onClick={()=>selectProjectService(service.id)}/>)}</div></Container></section>; }
