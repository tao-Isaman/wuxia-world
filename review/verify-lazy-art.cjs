const { chromium, expect } = require('@playwright/test');
(async () => {
 const browser = await chromium.launch({headless:true});
 try {
  const page = await browser.newPage({viewport:{width:1440,height:900}});
  await page.addInitScript(() => { Math.random = () => 0.5; });
  const requests = new Set(); const errors = [];
  page.on('request', r => { if(r.url().includes('/art/characters/')) requests.add(new URL(r.url()).pathname); });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:3017');
  async function painted(selector) {
   await expect.poll(() => page.locator(selector).evaluateAll(nodes => nodes.length > 0 && nodes.every(node => {
    const rgba = node.getContext('2d').getImageData(0,0,node.width,node.height).data;
    return rgba.some((value,index) => index % 4 === 3 && value > 32);
   })), {timeout:60000}).toBe(true);
  }
  await expect(page.locator('.body-options canvas')).toHaveCount(4);
  await painted('.body-options canvas');
  await page.getByRole('button',{name:'หญิง',exact:true}).click();
  await expect(page.locator('.body-options canvas[data-character-id="f4"]')).toBeVisible();
  await painted('.body-options canvas');
  await page.getByRole('button',{name:'ชาย',exact:true}).click();
  await expect(page.locator('.body-options canvas[data-character-id="m4"]')).toBeVisible();
  await painted('.body-options canvas');
  const titleDirections = [...requests].filter(path => path.endsWith('-directions.png'));
  expect(titleDirections).toEqual([]);
  await page.locator('#hero-name').fill('Art loading check');
  await page.getByRole('button',{name:'เริ่มเกมใหม่'}).click();
  await expect(page.getByTestId('world-canvas')).toHaveAttribute('data-ready','true',{timeout:60000});
  expect([...requests].filter(path => path.endsWith('-directions.png'))).toEqual(['/art/characters/m1-directions.png']);
  async function visit(id) {
   await expect(page.getByTestId('world-canvas')).toHaveAttribute('data-ready','true',{timeout:60000});
   await page.getByRole('button',{name:/จุดหมาย/}).click();
   await page.locator('[data-marker-id="'+id+'"]').click();
  }
  await visit('route_home_player__to__city_capital');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('wusia-world-v1')).state.currentSceneId)).toBe('route_home_player__to__city_capital');
  await visit('destination-0');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('wusia-world-v1')).state.currentSceneId)).toBe('city_capital');
  await expect(page.getByTestId('world-canvas')).toHaveAttribute('data-ready','true',{timeout:60000});
  expect([...requests].filter(path => path.endsWith('-directions.png'))).toEqual(['/art/characters/m1-directions.png']);
  await page.goto('http://127.0.0.1:3017/progress');
  await expect(page.locator('.progress-character-gallery canvas')).toHaveCount(15);
  await painted('.progress-character-gallery canvas');
  await page.getByRole('button',{name:'walkNorth',exact:true}).click();
  await expect.poll(() => [...requests].filter(path => path.endsWith('-directions.png')).length).toBe(8);
  await painted('.progress-character-gallery canvas');
  await page.locator('.progress-character-study').screenshot({path:'review/wave7-character-gallery.png'});
  expect(errors).toEqual([]);
  console.log(JSON.stringify({titleDirectionRequests:titleDirections,selectedHeroDirections:1,capitalExtraNpcDirections:0,galleryCharacters:15,explicitNorthDirections:8,errors}));
 } finally { await browser.close(); }
})();
