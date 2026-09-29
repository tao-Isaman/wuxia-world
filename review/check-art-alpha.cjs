const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
  await page.goto('http://127.0.0.1:3017/progress');
  await page.getByRole('button', { name: 'walkNorth', exact: true }).click();
  await page.locator('.progress-character-study').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1800);
  await page.screenshot({ path: 'review/characters-north.png' });
  await page.getByRole('button', { name: 'walkSouth', exact: true }).click();
  await page.waitForTimeout(350);
  await page.screenshot({ path: 'review/characters-south.png' });
  const samples = await page.evaluate(async () => {
    return Promise.all(['m1','m2','m3','m4','f1','f2','f3','f4'].map(async id => {
      const img = new Image(); img.src = '/art/characters/' + id + '-directions.png'; await img.decode();
      const canvas = document.createElement('canvas'); canvas.width=img.width; canvas.height=img.height;
      const ctx = canvas.getContext('2d'); ctx.drawImage(img,0,0);
      return { id, gap: [...ctx.getImageData(Math.round(img.width/4),Math.round(img.height/4),1,1).data], corner: [...ctx.getImageData(2,2,1,1).data] };
    }));
  });
  console.log(samples);
  await browser.close();
})();
