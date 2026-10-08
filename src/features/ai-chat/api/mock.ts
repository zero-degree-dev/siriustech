import { ApiError, mockDelay, type DemoScenario } from "@/shared/api";
import type { ChatRepository } from "../model/types";
export function createChatMock(
  scenario: DemoScenario = "success",
): ChatRepository {
  return {
    async send(messages, signal) {
      await mockDelay(signal, 900);
      if (scenario === "error")
        throw new ApiError("Данные временно недоступны", "http", 503);
      return {
        id: `demo-reply-${messages.length}`,
        role: "assistant",
        text: "Это демонстрационный ответ. В рабочей версии здесь появятся уточнения по вашему проекту. Сейчас можно проверить форму заявки ниже.",
      };
    },
  };
}
