import { ApiError, mockDelay, type DemoScenario } from "@/shared/api";
import type { RequestRepository } from "../model/types";
export function createRequestMock(
  scenario: DemoScenario = "success",
): RequestRepository {
  return {
    async submit(_data, signal) {
      await mockDelay(signal);
      if (scenario === "error")
        throw new ApiError(
          "Не удалось отправить заявку. Попробуйте ещё раз.",
          "http",
          503,
        );
      return { id: "demo-request-001" };
    },
  };
}
