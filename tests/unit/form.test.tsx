import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RequestForm, validateRequest } from "@/features/request-project";
import { services } from "@/entities/service";
const valid = {
  name: "Иван Петров",
  company: "",
  phone: "+7 (999) 123-45-67",
  email: "ivan@example.com",
  serviceId: "software",
  consent: true,
};
function fill() {
  fireEvent.change(screen.getByLabelText("Имя и фамилия"), {
    target: { value: valid.name },
  });
  fireEvent.change(screen.getByLabelText("Телефон"), {
    target: { value: valid.phone },
  });
  fireEvent.change(screen.getByLabelText("E-mail"), {
    target: { value: valid.email },
  });
  fireEvent.change(screen.getByLabelText("Услуга"), {
    target: { value: valid.serviceId },
  });
  fireEvent.click(screen.getByRole("checkbox"));
}
describe("Request form", () => {
  it("validates required fields and service membership", () => {
    expect(validateRequest(valid, ["software"])).toEqual({});
    expect(
      validateRequest(
        {
          ...valid,
          name: " ",
          phone: "123",
          email: "x@",
          serviceId: "unknown",
          consent: false,
        },
        ["software"],
      ),
    ).toHaveProperty("serviceId");
    expect(
      Object.keys(
        validateRequest(
          {
            ...valid,
            name: " ",
            phone: "123",
            email: "x@",
            serviceId: "unknown",
            consent: false,
          },
          ["software"],
        ),
      ),
    ).toHaveLength(5);
  });
  it("focuses first invalid input without sending", async () => {
    const submit = vi.fn();
    render(<RequestForm services={services} repository={{ submit }} />);
    fireEvent.click(screen.getByRole("button", { name: "Отправить" }));
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Имя и фамилия")).toHaveFocus();
  });
  it("prevents duplicate submits and retains data on failure", async () => {
    let reject!: (reason: Error) => void;
    const submit = vi.fn(
      () =>
        new Promise<{ id: string }>((_, r) => {
          reject = r;
        }),
    );
    render(<RequestForm services={services} repository={{ submit }} />);
    fill();
    const form = screen.getByRole("form");
    fireEvent.submit(form);
    fireEvent.submit(form);
    expect(submit).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button")).toBeDisabled();
    reject(new Error("offline"));
    await screen.findByRole("alert");
    expect(screen.getByLabelText("Имя и фамилия")).toHaveValue(valid.name);
    expect(screen.getByRole("button")).toBeEnabled();
  });
  it("allows retry after failure", async () => {
    const submit = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue({ id: "demo" });
    render(<RequestForm services={services} repository={{ submit }} />);
    fill();
    fireEvent.submit(screen.getByRole("form"));
    await screen.findByRole("alert");
    fireEvent.submit(screen.getByRole("form"));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Демонстрация завершена",
      ),
    );
    expect(submit).toHaveBeenCalledTimes(2);
  });
});
