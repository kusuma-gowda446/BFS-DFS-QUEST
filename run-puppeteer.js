const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER_CONSOLE:', msg.text()));
  page.on('pageerror', error => console.error('BROWSER_ERROR:', error.message));
  
  console.log('Navigating to http://localhost:8080/ ...');
  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle0' });
  
  console.log('Clicking btn-start-game...');
  try {
    await page.click('#btn-start-game');
    console.log('Clicked successfully. Waiting...');
    await new Promise(r => setTimeout(r, 2000));
  } catch(e) {
    console.error('Error clicking:', e);
  }

  await browser.close();
})();
