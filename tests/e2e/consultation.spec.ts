import { test, expect } from '@playwright/test';
import catalog from '../../backend/data/services.json';

test('catalog selection, chat retry, history and request work together', async ({ page }, testInfo) => {
  const messages: { id: string; role: string; text: string }[] = [];
  let fail = true;
  let requestId = '';
  await page.route('**/api/**', async route => {
    const request = route.request();
    const path = new URL(request.url()).pathname;
    if (path === '/api/services') return route.fulfill({ json: catalog });
    if (path === '/api/chat/sessions') return route.fulfill({ json: { token: 'test-token', mode: 'polza' } });
    if (path === '/api/chat/messages' && request.method() === 'GET') return route.fulfill({ json: { messages, mode: 'polza' } });
    if (path === '/api/chat/messages') {
      const body = request.postDataJSON();
      expect(body.serviceId).toBe('web');
      if (fail) { fail = false; requestId = body.id; return route.fulfill({ status: 503, json: { message: 'Provider unavailable' } }); }
      expect(body.id).toBe(requestId);
      const reply = { id: 'answer', role: 'assistant', text: 'Корпоративный портал: от 650 000 ₽, ориентировочно 6–12 недель.', mode: 'polza' };
      messages.push({ id: body.id, role: 'user', text: body.text }, reply);
      return route.fulfill({ json: reply });
    }
    if (path === '/api/requests') {
      expect(request.postDataJSON()).toMatchObject({ serviceId: 'web', consent: true });
      return route.fulfill({ status: 201, json: { id: 'saved-request' } });
    }
    if (path === '/api/chat/session') { messages.length = 0; return route.fulfill({ status: 204 }); }
    return route.abort();
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('#services-list > a')).toHaveCount(3);
  await page.getByRole('button', { name: 'Все услуги каталога' }).click();
  await expect(page.locator('#services-list > a')).toHaveCount(12);
  await page.locator('#services-list > a').filter({ hasText: 'Сайты и корпоративные порталы' }).click();
  await expect(page.getByLabel('Тема консультации')).toHaveValue('web');
  await expect(page.getByLabel('Услуга', { exact: true })).toHaveValue('web');
  await page.getByLabel('Ваш запрос').fill('Нужен корпоративный портал. Сколько стоит?');
  await page.getByRole('form', { name: 'Сообщение ИИ' }).getByRole('button', { name: 'Отправить' }).click();
  await page.getByRole('button', { name: 'Повторить запрос', exact: true }).click();
  await expect(page.getByRole('log')).toContainText('650 000');
  await expect(page.getByRole('log').getByText('Нужен корпоративный портал. Сколько стоит?')).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('#consultation').screenshot({ path: `test-results/consultation-${testInfo.project.name}.png` });
  const form = page.getByRole('form', { name: 'Заявка на проект' });
  await form.getByLabel('Имя и фамилия').fill('Тестовый клиент');
  await form.getByLabel('Телефон').fill('+7 999 123-45-67');
  await form.getByLabel('E-mail').fill('test@example.com');
  await form.getByRole('checkbox').check();
  await form.getByRole('button', { name: 'Отправить' }).click();
  await expect(form.getByRole('status')).toContainText('Заявка сохранена');
  await page.reload();
  await expect(page.getByRole('log')).toContainText('650 000');
  await page.getByRole('button', { name: 'Удалить историю и начать заново' }).click();
  await expect(page.getByRole('log')).toHaveCount(0);
  await expect(page.getByLabel('Ваш запрос')).toBeEnabled();
});
