import type { ProjectRequest, RequestErrors } from "./types";
export function validateRequest(
  data: ProjectRequest,
  serviceIds: string[],
): RequestErrors {
  const errors: RequestErrors = {};
  if (!data.name.trim()) errors.name = "Укажите имя и фамилию";
  const digits = data.phone.replace(/\D/g, "");
  if (
    digits.length < 10 ||
    digits.length > 15 ||
    /[^+\d\s()–-]/.test(data.phone)
  )
    errors.phone = "Введите телефон: от 10 до 15 цифр";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()))
    errors.email = "Введите полный адрес, например alex@company.ru";
  if (!serviceIds.includes(data.serviceId))
    errors.serviceId = "Выберите услугу";
  if (!data.consent) errors.consent = "Подтвердите согласие";
  return errors;
}
