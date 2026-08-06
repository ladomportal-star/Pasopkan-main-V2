const puppeteer = require('puppeteer');
const http = require('http');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  // Set fake login token
  await page.evaluateOnNewDocument(() => {
    localStorage.setItem('token', 'fake-token');
  });

  await page.goto('http://localhost:3000/checkout', { waitUntil: 'networkidle0' });
  
  // Wait to see if we can just query the selector parts
  const text = await page.evaluate(() => {
     let sel = 'div#root:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2)';
     let el = document.querySelector(sel);
     
     if(el) {
       return 'FOUND FULL SELECTOR: ' + el.className + ' | text: ' + el.innerText.replace(/\n/g, ' ');
     } else {
       // try partials
       for (let i = 1; i < 6; i++) {
         let sub = sel.split(' > ').slice(-i).join(' > ');
         let els = document.querySelectorAll(sub);
         if (els.length > 0) {
            return `FOUND ${els.length} of partial ${sub}. First class: ${els[0].className} text: ${els[0].innerText.replace(/\n/g, ' ')}`;
         }
       }
       return 'NOT FOUND';
     }
  });
  console.log(text);
  await browser.close();
})();
