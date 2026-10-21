export interface Service {
  id: string;
  title: string;
  description: string;
  category?: string;
  detail?: string;
  priceFrom?: number;
  priceUnit?: string;
  duration?: string;
}
export interface ServiceRepository {
  list(signal?: AbortSignal): Promise<Service[]>;
}
