// Render frames of index.html with Playwright and pipe them to ffmpeg.
// usage: node render.js out.mp4 [startSec endSec] | node render.js --stills dir t1 t2 ...
// Set EP_HTML to render another episode's page (default: ./index.html).
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

(async () => {
  const args = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', e => { console.error('PAGE ERROR', e.message); process.exit(1); });
  await page.goto('file://' + path.resolve(process.env.EP_HTML || path.join(__dirname, 'index.html')));
  await page.evaluate(() => window.fontsReady);
  if (args[0] === '--stills') {
    const dir = args[1];
    for (const t of args.slice(2)) {
      await page.evaluate(t => window.render(t), Number(t));
      await page.screenshot({ path: `${dir}/still_${t}.png` });
    }
    await browser.close();
    return;
  }
  const TL = await page.evaluate(() => window.TL);
  const fps = TL.fps;
  const t0 = Number(args[1] ?? 0), t1 = Number(args[2] ?? TL.total);
  const f0 = Math.round(t0 * fps), f1 = Math.round(t1 * fps);
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', args[0]], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = f0; f < f1; f++) {
    await page.evaluate(t => window.render(t), f / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 94 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((f - f0) % 250 === 0) console.log(`${args[0]}: ${f - f0}/${f1 - f0}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await browser.close();
})();
