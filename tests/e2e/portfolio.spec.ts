import { test, expect, type Page } from "@playwright/test";

async function openPortfolio(page: Page, speed = 1) {
  if (speed !== 1) await page.addInitScript((rate) => {
    window.setInterval(() => document.querySelector("#portfolio [data-phase]")?.getAnimations({ subtree: true })
      .forEach((animation) => animation.updatePlaybackRate(rate)), 30);
  }, speed);
  await page.goto("/");
  await page.mouse.move(0, 0);
  const section = page.locator("#portfolio");
  await section.scrollIntoViewIfNeeded();
  const visual = section.locator("[data-phase]");
  return { section, visual, frame: visual.locator('[data-layer="foreground"]'), background: visual.locator('[data-layer="background"]') };
}

test("all text fields type during image growth and each change collapses before expanding", async ({ page }) => {
  const { section, visual, frame, background } = await openPortfolio(page, 2);
  await expect(visual).toHaveAttribute("data-phase", "expand", { timeout: 20000 });
  await expect(section).toHaveAttribute("data-text-phase", "typing");
  await visual.evaluate((element) => {
    element.getAnimations({ subtree: true }).forEach((animation) => {
      animation.pause();
      if (animation.effect instanceof KeyframeEffect && animation.effect.target === element) animation.currentTime = 200;
    });
  });
  const fields = section.locator('[class*="portfolio__live"] [data-typed-text]');
  await expect.poll(() => fields.evaluateAll((nodes) => nodes.map((node) => node.querySelectorAll('[data-visible="true"]').length))).toEqual([8, 8, 8, 4, 8, 3]);
  const imageBox = (await frame.boundingBox())!;
  const hostBox = (await visual.boundingBox())!;
  expect(imageBox.width).toBeLessThan(hostBox.width);
  await visual.evaluate((element) => element.getAnimations({ subtree: true }).forEach((animation) => animation.play()));
  await expect(section).toHaveAttribute("data-text-phase", "idle");
  // Clicking a logo can scroll the page on mobile; compare document coordinates.
  const caseBounds = () => page.locator("#case").evaluate(element => {
    const { width, height, x, y } = element.getBoundingClientRect();
    return { width, height, x: x + window.scrollX, y: y + window.scrollY };
  });
  const bounds = await caseBounds();
  await section.getByRole("button", { name: "Кейс Ozon", exact: true }).click();
  await expect(section.getByRole("button", { name: "Кейс Ozon", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(section).toHaveAttribute("data-case", "mvideo");
  await expect(visual).toHaveAttribute("data-phase", "collapse");
  await expect(background).toBeHidden();
  await expect(visual).not.toHaveAttribute("data-duplicate-handle", "true");
  await expect(visual).toHaveAttribute("data-current", "1");
  await expect(visual).toHaveAttribute("data-phase", "expand");
  await expect(section).toHaveAttribute("data-text-phase", "typing");
  await expect(frame.locator("img:not([hidden])")).toHaveAttribute("src", /ozon/);
  await expect(section.getByRole("heading", { level: 3 })).toHaveAccessibleName("Система управления фулфилментом");
  await expect(section).toHaveAttribute("data-text-phase", "idle");
  expect(await caseBounds()).toEqual(bounds);
  await expect(section.getByRole("button", { name: "Кейс СДЭК", exact: true })).toHaveAttribute("aria-pressed", "true", { timeout: 10000 });
  await expect(visual).toHaveAttribute("data-phase", "collapse");
  await expect(visual).toHaveAttribute("data-current", "2");
  await expect(visual).toHaveAttribute("data-phase", "expand");
});

test("rapid clicks select immediately and settle on the latest case without a pause button or scrollbar", async ({ page }) => {
  const { section, visual } = await openPortfolio(page, 4);
  await expect(visual).toHaveAttribute("data-phase", "hold", { timeout: 20000 });
  await section.getByRole("button", { name: "Кейс Ozon", exact: true }).click();
  await section.getByRole("button", { name: "Кейс СДЭК", exact: true }).click();
  await section.getByRole("button", { name: "Кейс Ростелеком", exact: true }).click();
  await expect(section.getByRole("button", { name: "Кейс Ростелеком", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(section).toHaveAttribute("data-case", "rostelecom", { timeout: 15000 });
  await expect(section).toHaveAttribute("data-text-phase", "idle");
  await expect(section.getByRole("button", { pressed: true })).toHaveCount(1);
  await expect(section.getByRole("button", { name: /автопереключение/ })).toHaveCount(0);
  expect(await section.getByRole("group", { name: "Выбрать кейс" }).evaluate((element) => getComputedStyle(element).scrollbarWidth)).toBe("none");
  await section.getByText("Подробнее", { exact: true }).click();
  await expect(section.locator("details")).toHaveAttribute("open", "");
  await page.waitForTimeout(1500);
  await expect(section).toHaveAttribute("data-case", "rostelecom");
});

test("reduced motion supports keyboard selection and a stable responsive composition", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const { section, visual, frame } = await openPortfolio(page);
  await expect(visual).toHaveAttribute("data-phase", "static");
  await expect(section.getByRole("heading", { level: 3 })).toHaveAccessibleName("Омниканальная платформа заказов");
  const button = section.getByRole("button", { name: "Кейс Ростелеком", exact: true });
  await button.focus();
  await page.keyboard.press("Enter");
  await expect(section).toHaveAttribute("data-case", "rostelecom");
  await expect(section).toHaveAttribute("data-text-phase", "idle");
  await expect(visual.locator("svg")).toBeHidden();
  expect(await frame.evaluate((element) => element.getAnimations().length)).toBe(0);
  await expect(section.locator('[data-visible="false"]')).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  await section.locator("img").evaluateAll(async (images) => {
    await Promise.all(images.map((image) => (image as HTMLImageElement).decode()));
  });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `test-results/page-${testInfo.project.name}.png`, fullPage: true });
  await section.screenshot({ path: `test-results/portfolio-${testInfo.project.name}.png` });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(visual).toHaveAttribute("data-phase", "hold", { timeout: 20000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(section).toHaveAttribute("data-text-phase", "idle");
  await expect(visual).toHaveAttribute("data-phase", "static");
});
