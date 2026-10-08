import { test, expect } from "@playwright/test";
test("kit layout and keyboard navigation", async ({ page }, testInfo) => {
  await page.goto("/ui-kit");
  await expect(
    page.getByRole("heading", { name: "SiriusTech / UI Kit" }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expect(
    page.getByText("Демонстрационная заявка", { exact: true }),
  ).toBeAttached();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Перейти к компонентам" }),
  ).toBeFocused();
  await page.screenshot({
    path: `test-results/ui-kit-${testInfo.project.name}.png`,
    fullPage: true,
  });
});
test("form and chat demo scenarios", async ({ page }) => {
  await page.goto("/ui-kit");
  const form = page.getByRole("form", { name: "Заявка на проект" });
  await form.getByLabel("Имя и фамилия").fill("Иван Петров");
  await form.getByLabel("Телефон").fill("+7 999 123 45 67");
  await form.getByLabel("E-mail").fill("ivan@example.com");
  await form.getByLabel("Услуга", { exact: true }).selectOption("software");
  await form.getByRole("checkbox").check();
  await form.getByRole("button", { name: "Отправить", exact: true }).click();
  await expect(form.getByRole("status")).toContainText(
    "Данные никуда не отправлены",
  );
  await page.getByLabel("Сценарий ответа").selectOption("error");
  await page.getByLabel("Ваш запрос").fill("Нужна CRM");
  await page
    .getByRole("form", { name: "Сообщение ИИ" })
    .getByRole("button")
    .click();
  await expect(
    page.getByRole("button", { name: "Повторить запрос", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Сценарий ответа").selectOption("success");
  await page
    .getByRole("button", { name: "Повторить запрос", exact: true })
    .click();
  await expect(page.getByRole("log")).toContainText(
    "Это демонстрационный ответ",
  );
  await expect(
    page.getByRole("log").getByText("Нужна CRM", { exact: true }),
  ).toHaveCount(1);
});
