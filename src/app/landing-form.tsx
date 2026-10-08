"use client";
import { RequestForm, createRequestMock } from '@/features/request-project';
import { services } from '@/entities/service';
const repository=createRequestMock();
export function LandingForm(){return <RequestForm services={services} repository={repository} compact/>;}
