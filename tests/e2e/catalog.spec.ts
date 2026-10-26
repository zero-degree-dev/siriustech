import { test, expect } from '@playwright/test';
import catalog from '../../backend/data/services.json';

test('collapsing the catalogue preserves the viewport and keyboard focus', async ({ page }) => {
  await page.route('**/api/**', route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/services') return route.fulfill({ json: catalog });
    if (path === '/api/chat/sessions') return route.fulfill({ json: { token: 'test-token', mode: 'polza' } });
    if (path === '/api/chat/messages') return route.fulfill({ json: { messages: [], mode: 'polza' } });
    return route.abort();
  });
  await page.goto('/');
  const cards = page.locator('#services-list > a');
  const toggle = page.locator('button[aria-controls="services-list"]');
  await expect(cards).toHaveCount(3);

  for (const keyboard of [false, true]) {
    await toggle.click();
    await expect(cards).toHaveCount(catalog.length);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    // Preserve the position where the visitor actually activates the control.
    await toggle.evaluate(element => element.scrollIntoView({ block: 'center', behavior: 'instant' }));
    const before = (await toggle.boundingBox())!;
    if (keyboard) await toggle.press('Enter');
    else await toggle.click();
    await expect(cards).toHaveCount(3);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
    const after = (await toggle.boundingBox())!;
    expect(Math.abs(after.y - before.y)).toBeLessThan(3);
    // Smooth scrolling or browser anchoring must not move it later either.
    await page.waitForTimeout(400);
    const settled = (await toggle.boundingBox())!;
    expect(Math.abs(settled.y - before.y)).toBeLessThan(3);
    expect(await toggle.evaluate(element => {
      const box = element.getBoundingClientRect();
      return Boolean(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2)?.closest('#services'));
    })).toBe(true);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
