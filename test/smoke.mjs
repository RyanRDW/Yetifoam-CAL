import { chromium } from 'playwright';

const consoleLogs = [];
const networkLogs = [];

function createSalesPayload() {
  return {
    form: {
      dimensions: { length: 10, width: 5, height: 3 },
      pitch: { selected: '10', suggested: null, assumed: false },
      cladding: { type: 'corrugated' },
      members: { roof: 'top_hat', walls: 'top_hat' },
      spray: { includeRoofBattens: true, includeWallPurlins: false },
      openings: {
        single_roller: 0,
        double_roller: 0,
        high_roller: 0,
        large_roller: 0,
        pa_door: 1,
        window: 0,
        sliding_single: 0,
        sliding_double: 0,
        laserlight: 0,
        custom: 0,
      },
    },
    feedback: { notes: 'Smoke test fetch' },
  };
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

page.on('console', (msg) => {
  consoleLogs.push({ type: msg.type(), text: msg.text() });
});

page.on('response', async (response) => {
  const url = response.url();
  if (url.includes('/api/')) {
    let body = '';
    try {
      body = await response.text();
    } catch (error) {
      body = `<<unavailable: ${error instanceof Error ? error.message : String(error)}>>`;
    }
    networkLogs.push({ url, status: response.status(), body });
  }
});

async function ensureSectionOpen(id) {
  await page.evaluate((sectionId) => {
    const section = document.querySelector(sectionId);
    if (section && section.getAttribute('data-state') !== 'open') {
      const header = section.querySelector('header');
      header?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
  }, id);
}

await page.goto('http://localhost:5174', { waitUntil: 'networkidle' });

await page.fill('#dimension-length', '10');
await page.fill('#dimension-width', '5');
await page.fill('#dimension-height', '3');

await ensureSectionOpen('#clad');
await page.locator('#clad').locator('button:has-text("Corrugated")').first().click();

await ensureSectionOpen('#mem');
await page.locator('#mem').locator('button:has-text("Top-hat")').first().click();
await page.locator('#mem').locator('button:has-text("Top-hat")').nth(1).click();

await page.getByRole('button', { name: '10° Pitch' }).click();

await ensureSectionOpen('#opt');
await page.locator('#opt').locator('label:has-text("Roof Battens")').first().click();

await ensureSectionOpen('#open');
await page.getByRole('button', { name: 'Manage Openings…' }).click();
await page.locator('li', { hasText: 'PA Door' }).getByRole('button', { name: '+' }).click();
await page.getByRole('button', { name: 'Apply Changes' }).click();

await page.getByRole('button', { name: /Calculate/i }).click();
await page.waitForTimeout(1000);

const resultsSummary = await page
  .locator('section')
  .filter({ hasText: 'Results' })
  .locator('table')
  .first()
  .allInnerTexts()
  .catch(() => []);

await page.getByPlaceholder('Ask how to position this configuration...').fill('What benefits should we highlight?');
await page.getByRole('button', { name: 'Send' }).click();
const advisorPanel = page.locator('[data-testid="ai-advisor-panel"]');
await advisorPanel.locator('[data-testid="advisor-history"] li').first().waitFor({ timeout: 45000 });
const advisorVariants = await advisorPanel.locator('[data-testid="advisor-variants"] li').allTextContents().catch(() => []);
const advisorClosing = (await advisorPanel.locator('[data-testid="advisor-closing"]').last().textContent().catch(() => '')).trim();

await page.locator('textarea').first().fill('Smoke test note');
const summaryField = page.locator('textarea[readonly]').first();
await summaryField.waitFor({ timeout: 5000 });
await page.waitForTimeout(500);
const exportSummary = await summaryField.inputValue().catch(() => '');

await browser.close();

const salesPayload = createSalesPayload();
const salesResponse = await fetch('http://localhost:8788/api/sales', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(salesPayload),
});
const salesFetch = { status: salesResponse.status, body: await salesResponse.text() };

const apiResponses = networkLogs.filter((entry) => entry.url.includes('/api/'));

console.log(
  JSON.stringify(
    {
      resultsSummary,
      advisorVariants,
      advisorClosing,
      exportSummary,
      apiResponses,
      salesFetch,
      consoleLogs,
    },
    null,
    2,
  ),
);
