import { test, expect, type Page } from "@playwright/test";

const firstAlt = "Команда инженеров в центре мониторинга информационной безопасности";
const thirdAlt = "Специалисты анализируют цифровые угрозы в исследовательской лаборатории";

async function openHero(page: Page) {
  await page.goto("/");
  const hero = page.locator('section[aria-labelledby="hero-title"]');
  const visual = hero.locator("[data-phase]");
  await visual.scrollIntoViewIfNeeded();
  return { hero, visual, frame: visual.locator('[data-layer="foreground"]') };
}

test("hero cycles all three photos without moving the layout", async ({ page }, testInfo) => {
  const { hero, visual, frame } = await openHero(page);
  await expect(visual).toHaveAttribute("data-phase", "hold", { timeout: 20000 });
  await expect(hero.getByAltText(firstAlt)).toBeVisible();
  const bounds = await visual.boundingBox();
  await page.screenshot({ path: `test-results/hero-${testInfo.project.name}.png` });

  for (const index of [1, 2, 0]) {
    await expect(visual).toHaveAttribute("data-current", String(index), { timeout: 20000 });
    await expect(visual).toHaveAttribute("data-phase", "hold");
    expect(await visual.boundingBox()).toEqual(bounds);
    await expect(frame.locator("img:not([hidden])")).toHaveCount(1);
  }
});

test("the next photo stays full size under the collapsing current photo", async ({ page }, testInfo) => {
  const { visual, frame } = await openHero(page);
  const background = visual.locator('[data-layer="background"]');
  const stationaryHandle = visual.locator('span[aria-hidden="true"]');
  await expect(visual).toHaveAttribute("data-phase", "hold", { timeout: 20000 });
  await expect(stationaryHandle).toBeHidden();
  await expect(visual).toHaveAttribute("data-phase", "collapse", { timeout: 20000 });
  await frame.evaluate((element) => {
    const animation = element.getAnimations()[0];
    animation.pause();
    animation.currentTime = 600;
  });
  await visual.locator('div[aria-hidden="true"]:not([data-layer])').evaluate((element) => {
    const animation = element.getAnimations()[0];
    animation.pause();
    animation.currentTime = 600;
  });
  await expect(frame.getByAltText(firstAlt)).toBeVisible();
  await expect(background).toBeVisible();
  await expect(background.locator("img:not([hidden])")).toHaveAttribute("src", /cloud-infrastructure/);
  await expect(background).toHaveAttribute("aria-hidden", "true");
  const bounds = (await visual.boundingBox())!;
  expect(await background.boundingBox()).toEqual(bounds);
  const collapsingBounds = (await frame.boundingBox())!;
  expect(collapsingBounds.width).toBeGreaterThan(bounds.width * 0.35);
  expect(collapsingBounds.width).toBeLessThan(bounds.width * 0.65);
  await expect(stationaryHandle).toBeVisible();
  const handleBounds = (await stationaryHandle.boundingBox())!;
  const movingStyle = await visual.locator('div[aria-hidden="true"]:not([data-layer])').evaluate((element) => {
    const style = getComputedStyle(element, "::after");
    return {
      width: parseFloat(style.width) + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth),
      height: parseFloat(style.height) + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth),
    };
  });
  expect(handleBounds.width).toBe(movingStyle.width);
  expect(handleBounds.height).toBe(movingStyle.height);
  expect(Math.abs(handleBounds.x + handleBounds.width - 10 - (bounds.x + bounds.width))).toBeLessThan(1);
  expect(Math.abs(handleBounds.y + handleBounds.height - 10 - (bounds.y + bounds.height))).toBeLessThan(1);
  await page.screenshot({ path: `test-results/hero-collapse-${testInfo.project.name}.png` });

  await frame.evaluate((element) => element.getAnimations()[0].play());
  await visual.locator('div[aria-hidden="true"]:not([data-layer])').evaluate((element) => element.getAnimations()[0].play());
  await expect(visual).toHaveAttribute("data-current", "1");
  await expect(visual).toHaveAttribute("data-phase", "hold");
  expect((await frame.boundingBox())!.width).toBeLessThan(5);
  expect(await background.boundingBox()).toEqual(bounds);
  await expect(visual).toHaveAttribute("data-phase", "expand");
  await expect(frame.getByAltText(thirdAlt)).toBeVisible();
  await expect(visual).toHaveAttribute("data-current", "2");
  expect(await frame.boundingBox()).toEqual(bounds);
});

test("cursor rests inside the photo and the hero pauses offscreen", async ({ page }) => {
  const { visual, frame } = await openHero(page);
  await expect(visual).toHaveAttribute("data-phase", "hold", { timeout: 20000 });
  await frame.evaluate((element) => element.getAnimations().forEach((animation) => animation.pause()));
  await visual.locator("svg").evaluate((element) => element.getAnimations().forEach((animation) => animation.finish()));
  const viewport = page.viewportSize()!;
  await page.setViewportSize({ width: viewport.width + 60, height: viewport.height });
  await expect.poll(async () => {
    const hostBox = await visual.boundingBox();
    const frameBox = await frame.boundingBox();
    return Math.abs(hostBox!.width - frameBox!.width);
  }).toBeLessThan(1);

  const frameBox = await frame.boundingBox();
  const cursorBox = await visual.locator("svg").boundingBox();
  expect(cursorBox!.x).toBeGreaterThan(frameBox!.x + frameBox!.width - 80);
  expect(cursorBox!.x + cursorBox!.width).toBeLessThan(frameBox!.x + frameBox!.width);
  expect(cursorBox!.y).toBeGreaterThan(frameBox!.y);
  expect(cursorBox!.y + cursorBox!.height).toBeLessThan(frameBox!.y + frameBox!.height);
  const imageBox = await frame.locator("img:not([hidden])").boundingBox();
  const viewportBox = await frame.locator(":scope > div").boundingBox();
  expect(imageBox!.x + imageBox!.width).toBeGreaterThanOrEqual(viewportBox!.x + viewportBox!.width);
  expect(imageBox!.y + imageBox!.height).toBeGreaterThanOrEqual(viewportBox!.y + viewportBox!.height);

  await page.locator("#contacts").scrollIntoViewIfNeeded();
  await expect.poll(() => frame.evaluate((element) => element.getAnimations()[0]?.playState)).toBe("paused");
  const pausedTime = await frame.evaluate((element) => element.getAnimations()[0].currentTime);
  await page.waitForTimeout(200);
  expect(await frame.evaluate((element) => element.getAnimations()[0].currentTime)).toBe(pausedTime);

  await visual.scrollIntoViewIfNeeded();
  await expect.poll(() => frame.evaluate((element) => element.getAnimations()[0]?.playState)).toBe("running");
});

test("reduced motion shows a static first photo, including preference changes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const { hero, visual, frame } = await openHero(page);
  await expect(hero.getByAltText(firstAlt)).toBeVisible();
  await expect(visual).toHaveAttribute("data-phase", "static");
  await expect(visual.locator("svg")).toBeHidden();
  expect(await frame.evaluate((element) => element.getAnimations().length)).toBe(0);

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(visual).toHaveAttribute("data-phase", "hold", { timeout: 20000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(visual).toHaveAttribute("data-phase", "static");
  await expect(hero.getByAltText(firstAlt)).toBeVisible();
  expect(await frame.evaluate((element) => element.getAnimations().length)).toBe(0);
});

test("the current photo stays open while the next image is loading", async ({ page }) => {
  let releaseNext!: () => void;
  const nextImageGate = new Promise<void>((resolve) => { releaseNext = resolve; });
  await page.route("**/_next/image?**", async (route) => {
    const src = new URL(route.request().url()).searchParams.get("url");
    if (src?.endsWith("cloud-infrastructure.png")) await nextImageGate;
    await route.continue();
  });

  try {
    const { hero, visual } = await openHero(page);
    await expect(visual).toHaveAttribute("data-phase", "hold", { timeout: 20000 });
    await page.waitForTimeout(3500);
    await expect(visual).toHaveAttribute("data-phase", "hold");
    await expect(hero.getByAltText(firstAlt)).toBeVisible();
    releaseNext();
    await expect(visual).toHaveAttribute("data-current", "1", { timeout: 20000 });
  } finally {
    releaseNext();
  }
});
