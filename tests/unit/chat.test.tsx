import { render, screen, fireEvent } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { AiChat } from "@/features/ai-chat";
it("retries a failed message without duplicating history", async () => {
  const send = vi
    .fn()
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValue({ id: "reply", role: "assistant", text: "Демоответ" });
  render(<AiChat repository={{ send }} />);
  expect(screen.getByRole("button", { name: "Отправить" })).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Ваш запрос"), {
    target: { value: "Нужна CRM" },
  });
  fireEvent.submit(screen.getByRole("form"));
  await screen.findByRole("alert");
  fireEvent.click(screen.getByRole("button", { name: "Повторить запрос" }));
  await screen.findByText("Демоответ");
  expect(screen.getAllByText("Нужна CRM")).toHaveLength(1);
  expect(send.mock.calls[1][0]).toHaveLength(1);
  expect(screen.getByLabelText("Ваш запрос")).toBeEnabled();
});
