export interface ProjectRequest {
  name: string;
  company: string;
  phone: string;
  email: string;
  serviceId: string;
  consent: boolean;
}
export type RequestErrors = Partial<Record<keyof ProjectRequest, string>>;
export interface RequestRepository {
  submit(data: ProjectRequest, signal?: AbortSignal): Promise<{ id: string }>;
}
