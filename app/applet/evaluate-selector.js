const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Fake login
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('token', 'fake-token');
  });

  await page.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle0' });
  
  // Let's get the text content of the element safely.
  const elText = await page.evaluate(() => {
    const el = document.querySelector('div#root:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2)');
    return el ? el.innerText : 'Element not found on default view';
  });
  console.log('Text content:', elText.trim().replace(/\n/g, ' '));
  await browser.close();
})();
