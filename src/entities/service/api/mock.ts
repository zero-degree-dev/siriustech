import { ApiError, mockDelay, type DemoScenario } from "@/shared/api";
import type { Service, ServiceRepository } from "../model/types";
import catalog from '../../../../backend/data/services.json';
export const services: Service[] = catalog;
export function createServiceMock(
  scenario: DemoScenario = "success",
): ServiceRepository {
  return {
    async list(signal) {
      await mockDelay(signal);
      if (scenario === "error")
        throw new ApiError("Не удалось загрузить услуги", "http", 503);
      return services.map((service) => ({ ...service }));
    },
  };
}
