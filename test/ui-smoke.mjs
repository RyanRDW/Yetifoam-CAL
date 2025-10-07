import { chromium } from 'playwright';

const consoleLogs = [];
const networkLogs = [];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();

page.on('console', (msg) => {
  consoleLogs.push({ type: msg.type(), text: msg.text() });
});

page.on('response', async (response) => {
  if (!response.url().includes('/api/')) return;
  let body = '';
  try {
    body = await response.text();
  } catch (error) {
    body = `<<unavailable: ${error instanceof Error ? error.message : String(error)}>>`;
  }
  networkLogs.push({ url: response.url(), status: response.status(), body });
});

const baseUrl = 'http://localhost:5175';
await page.goto(baseUrl, { waitUntil: 'networkidle' });

await page.waitForSelector('#dimension-length', { timeout: 45000 });
await page.fill('#dimension-length', '10');
await page.fill('#dimension-width', '5');
await page.fill('#dimension-height', '3');

await page.locator("button:has-text('10° Pitch')").first().click();
await page.locator("button:has-text('Corrugated')").first().click();
await page.locator('section#mem').scrollIntoViewIfNeeded();
await page.waitForSelector('section#mem button:has-text("Top-hat")');
await page.locator('section#mem button:has-text("Top-hat")').first().click();
await page.locator('section#mem button:has-text("Top-hat")').nth(1).click();
await page.locator('section#opt').scrollIntoViewIfNeeded();
await page.waitForSelector('section#opt label:has-text("Roof Battens")');
await page.locator('section#opt label:has-text("Roof Battens")').first().click();
await page.locator('section#open > button').click();
await page.waitForTimeout(200);
await page.locator("section#open button:has-text('Manage openings')").first().click();
await page.locator('li', { hasText: 'PA Door' }).getByRole('button', { name: '+' }).click();
await page.getByRole('button', { name: 'Apply changes' }).click();

await page.getByRole('button', { name: /Calculate coverage/i }).click();
await page.waitForTimeout(500);

await page.locator('[data-testid="ai-advisor-panel"]').locator('button:has-text("OpenAI")').click();
await page.waitForTimeout(300);
await page.getByPlaceholder('Ask how to position this configuration...').fill('What benefits should we highlight?');
await page.getByRole('button', { name: 'Send' }).click();
try {
  await page.locator('[data-testid="advisor-history"]').waitFor({ timeout: 45000 });
} catch (error) {
  // allow failures when the advisor call times out during automation
  await page.waitForTimeout(500);
}

await page.locator('textarea[placeholder="Add optional notes or next steps..."]').fill('UI smoke test note');

await page.waitForTimeout(1000);

const summaryPreview = await page.locator('textarea[readonly]').first().inputValue();

const screenshotPath = 'artifacts/ui-modern.png';
await page.screenshot({ path: screenshotPath, fullPage: true });

await browser.close();

console.log(
  JSON.stringify(
    {
      summaryPreview,
      consoleLogs,
      networkLogs,
      screenshotPath,
    },
    null,
    2,
  ),
);
