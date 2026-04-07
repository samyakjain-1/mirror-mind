const puppeteer = require('puppeteer');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const delay = ms => new Promise(res => setTimeout(res, ms));

(async () => {
  try {
    const browser = await puppeteer.launch({ 
      headless: 'new', // new headless
      defaultViewport: { width: 1280, height: 800 }
    });
    const page = await browser.newPage();
    
    console.log("Loading home...");
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
    await delay(1000);
    await page.screenshot({ path: '/Users/samyak/Desktop/Github/mirrormind/screenshots/01-home.png' });

    console.log("Typing text...");
    await page.type('#journal-entry', "I don't know what to do anymore. I've been staying in my room all week and I keep canceling plans with friends. Everything just feels pointless.", { delay: 5 });
    await delay(500); 
    console.log("Clicking analyze...");
    await page.evaluate(() => {
       const btns = Array.from(document.querySelectorAll('button'));
       const analyze = btns.find(b => b.textContent.includes('Analyze') || b.textContent.includes('Analyzing'));
       if(analyze) analyze.click();
    });
    
    console.log("Waiting for analysis result...");
    await page.waitForSelector('[role="region"][aria-label="Analysis results"]', { visible: true, timeout: 15000 });
    await delay(1500); // Wait for full animations
    await page.screenshot({ path: '/Users/samyak/Desktop/Github/mirrormind/screenshots/02-analysis.png' });

    console.log("Going to dashboard...");
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
    // Let's populate the demo data if needed. Actually the store persists in localstorage? Yes, maybe `useStore` is persisted? Even if not, the entry we added above might still exist since it's the same origin if zustand uses localstorage or if it doesn't we might need demo data. But wait, we navigated. If zustand isn't persisted we'd lose it. We can just click Jump To Day 14.
    await delay(2000); // dashboard has 0.8s animations
    await page.screenshot({ path: '/Users/samyak/Desktop/Github/mirrormind/screenshots/03-dashboard.png', fullPage: true });

    console.log("Scrolling for chart...");
    await page.evaluate(() => {
       window.scrollBy(0, 300);
    });
    await delay(1000);
    await page.screenshot({ path: '/Users/samyak/Desktop/Github/mirrormind/screenshots/04-chart.png' });

    console.log("Expanding highlights...");
    await page.evaluate(() => {
       const btn = document.querySelector('button[aria-label="Show full analysis"]') || document.querySelector('button[aria-label="Show analysis"]');
       if(btn) btn.click();
    });
    await delay(800);
    await page.screenshot({ path: '/Users/samyak/Desktop/Github/mirrormind/screenshots/05-highlights.png' });

    console.log("Mobile resize...");
    await page.setViewport({ width: 390, height: 844 });
    await delay(1000);
    await page.screenshot({ path: '/Users/samyak/Desktop/Github/mirrormind/screenshots/06-mobile.png' });

    await browser.close();
    console.log("Done taking screenshots.");

    console.log("Generating PDF...");
    const doc = new PDFDocument({ autoFirstPage: false });
    doc.pipe(fs.createWriteStream('/Users/samyak/Desktop/Github/mirrormind/screenshots/MirrorMind-Mockups.pdf'));
    
    // Cover page
    doc.addPage({ margin: 50 });
    doc.moveDown(10);
    doc.fontSize(48).text('MirrorMind', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(24).text('UW Digital Health Challenge 2026', { align: 'center' });
    
    const shots = [
      { file: '01-home.png', caption: 'Home — Journal Entry Interface' },
      { file: '02-analysis.png', caption: 'Home — AI Analysis Result with Phrase Highlighting' },
      { file: '03-dashboard.png', caption: 'Dashboard — 14-Day Linguistic Timeline' },
      { file: '04-chart.png', caption: 'Dashboard — Risk Trend Chart' },
      { file: '05-highlights.png', caption: 'Dashboard — Expanded Entry with Pattern Detection' },
      { file: '06-mobile.png', caption: 'Mobile — Responsive Design' }
    ];

    for (const shot of shots) {
      doc.addPage({ margin: 50 });
      doc.image(`/Users/samyak/Desktop/Github/mirrormind/screenshots/${shot.file}`, {
        fit: [500, 630], 
        align: 'center', 
        valign: 'center'
      });
      doc.fontSize(16).text(shot.caption, 50, 700, { align: 'center' });
    }

    doc.end();
    console.log("PDF Created!");

  } catch(e) {
    console.error(e);
  }
})();
