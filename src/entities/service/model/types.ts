export interface Service {
  id: string;
  title: string;
  description: string;
  category?: string;
  detail?: string;
}
export interface ServiceRepository {
  list(signal?: AbortSignal): Promise<Service[]>;
}
