// Overlays shared by every episode: captions, host bubble, scene wipes.
// Each episode defines RENDER (scene name -> renderer) and PIP.
const WHO = {
  mod: ['MODERATOR', COL.navy], ang: ['ANGELO', COL.teal], news: ['NEWS READER', COL.red],
  vince: ['VINCE', '#5a6a8a'], rachel: ['RACHEL', COL.orange], aryav: ['ARYAV', '#3c9a3c'], mick: ['MICK', '#d9822b'],
};
function captions(t) {
  const c = TL.captions.find(c => t >= c.t0 && t < c.t1);
  if (!c) return '';
  const size = 44, w = Math.min(1640, c.text.length * size * .52 + 90);
  const [lab, col] = WHO[c.who];
  return `<g transform="translate(960,1005)"><rect x="${-w / 2}" y="-40" width="${w}" height="80" rx="20" fill="#11142a" opacity=".82"/>` +
    `<rect x="${-w / 2 + 16}" y="-64" width="${lab.length * 15 + 34}" height="36" rx="12" fill="${col}" stroke="#fff" stroke-width="3"/>` +
    txt(-w / 2 + 33, -38, lab, 22, '#fff', { anchor: 'start', font: 'Fredoka', stroke: 0, weight: 700 }) +
    txt(0, 15, c.text, size, '#fff', { font: 'Fredoka', stroke: 0, weight: 600 }) + '</g>';
}
function hostPip(t, scene) {
  if (PIP.hide.includes(scene)) return '';
  const px = PIP.right.includes(scene) ? 1770 : 150;
  const near = [0, .35, -.35].some(dt => speaking('mod', t + dt));
  if (!near) return '';
  const id = speaking('mod', t) || speaking('mod', t + .35) || speaking('mod', t - .35);
  const c = TL.clips[id];
  const s = clamp(Math.min((t - c.start + .35) / .35, (c.start + c.dur + .35 - t) / .35));
  return popAt(px, 830, eout(s), `<circle r="112" fill="${COL.yellow}" stroke="${OL}" stroke-width="8"/><clipPath id="pip"><circle r="104"/></clipPath><g clip-path="url(#pip)">` +
    G('translate(0,95) scale(.72)', person(CHARS.mod, { mouth: mouth('mod', t), blink: blinkAt(t) })) + '</g>');
}
function wipe(t) {
  let s = '';
  for (const sc of TL.scenes) {
    const b = sc.start;
    if (b === 0) continue;
    const p = (t - (b - .32)) / .64;
    if (p <= 0 || p >= 1) continue;
    const x = lerp(-2600, 2000, p);
    s += `<g transform="translate(${x},0) skewX(-14)"><rect x="0" y="-20" width="2400" height="1120" fill="${COL.orange}"/><rect x="120" y="-20" width="80" height="1120" fill="${COL.yellow}"/><rect x="2200" y="-20" width="80" height="1120" fill="${COL.yellow}"/>` +
      `<rect x="300" y="-20" width="1800" height="1120" fill="${COL.navy}"/></g>`;
  }
  return s;
}

function frame(t) {
  const sc = TL.scenes.find(s => t >= s.start && t < s.end) || TL.scenes[TL.scenes.length - 1];
  return RENDER[sc.name](t) + hostPip(t, sc.name) + captions(t) + wipe(t);
}
