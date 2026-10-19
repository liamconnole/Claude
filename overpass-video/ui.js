// Shared UI kit from Episode 2 onwards: helpers, rooms, interviews, Menti cards, host stage.
// Episodes define SC (scenes by name), E.pause (Menti pause times) and MENTI.

// ---------- helpers ----------
function wrap(s, n) {
  const out = []; let cur = '';
  for (const w of s.split(' ')) {
    if ((cur + ' ' + w).trim().length > n && cur) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
  }
  if (cur) out.push(cur);
  return out;
}
function para(x, y, s, size, n, fill = OL, o = {}) {
  return wrap(s, n).map((l, i) => txt(x, y + i * size * 1.2, l, size, fill, { font: 'Fredoka', stroke: 0, weight: 700, ...o })).join('');
}
const tick = (x, y, s = 1) => popAt(x, y, s, `<circle r="34" fill="${COL.teal}" stroke="${OL}" stroke-width="6"/><path d="M-16 0 L-4 13 L18 -14" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
const cross = (x, y, s = 1) => popAt(x, y, s, `<circle r="34" fill="${COL.red}" stroke="${OL}" stroke-width="6"/><path d="M-13 -13 L13 13 M13 -13 L-13 13" stroke="#fff" stroke-width="10" stroke-linecap="round"/>`);
const chip = (x, y, s, label, col, w, size = 40, rot = 0, fg = '#fff') =>
  popAt(x, y, s, `<rect x="${-w / 2}" y="-44" width="${w}" height="88" rx="22" fill="${col}" stroke="${OL}" stroke-width="6"/>` + txt(0, size * .36, label, size, fg, { stroke: 0 }), rot);
function doc(title, lines = 5, col = '#fff') {
  let l = '';
  for (let i = 0; i < lines; i++) l += `<path d="M-90 ${-40 + i * 34} h${i % 2 ? 140 : 180}" stroke="#b9c3d6" stroke-width="10" stroke-linecap="round"/>`;
  return `<path d="M-130 -170 L80 -170 L130 -120 L130 170 L-130 170 Z" fill="${col}" stroke="${OL}" stroke-width="7" stroke-linejoin="round"/><path d="M80 -170 L80 -120 L130 -120" fill="none" stroke="${OL}" stroke-width="6"/>` +
    txt(0, -100, title, 34, COL.navy, { stroke: 0 }) + l;
}
function hud2(x, y, label, sub, s = 1) {
  return popAt(x, y, s, `<rect x="-250" y="-60" width="500" height="120" rx="24" fill="${OL}" opacity=".85"/>
    <circle cx="-190" cy="0" r="40" fill="#fff" stroke="${COL.yellow}" stroke-width="6"/><path d="M-190 0 L-190 -28 M-190 0 L-170 8" stroke="${OL}" stroke-width="6" stroke-linecap="round"/>` +
    txt(40, 10, label, 48, '#fff', { stroke: 0 }) + txt(40, 44, sub, 24, COL.yellow, { font: 'Fredoka', stroke: 0 }));
}
function stageChip(t, t0, n, label) {
  const p = eio(prog(t, t0 + 1.8, .7));
  const x = lerp(960, 300, p), y = lerp(480, 66, p), sc = lerp(1, .42, p);
  return popAt(x, y, pop(t, t0, .5) * sc, `<rect x="-640" y="-110" width="1280" height="220" rx="40" fill="${COL.navy}" stroke="${OL}" stroke-width="10"/>` +
    `<rect x="-600" y="-74" width="300" height="148" rx="26" fill="${COL.yellow}" stroke="${OL}" stroke-width="7"/>` + txt(-450, 34, `STAGE ${n}`, 66, OL, { stroke: 0 }) +
    txt(170, 30, label, label.length > 18 ? 64 : 80, '#fff', { stroke: 0 }));
}

// ---------- rooms ----------
function room(kind, t) {
  const st = `stroke="${OL}" stroke-width="6" stroke-linejoin="round"`;
  let s = '';
  if (kind === 'workshop') {
    s += `<rect width="1920" height="1080" fill="#a3acbd"/>`;
    for (let x = 0; x < 1920; x += 60) s += `<path d="M${x} 0 V760" stroke="#8f98aa" stroke-width="10"/>`;
    s += `<rect x="0" y="760" width="1920" height="320" fill="#6b7180" stroke="${OL}" stroke-width="6"/>`;
    s += `<rect x="1180" y="80" width="560" height="110" rx="12" fill="#5a6175" ${st}/>` + txt(1460, 156, 'IRONCLAD STEEL', 56, '#fff', { stroke: 0 });
    for (let i = 0; i < 4; i++) s += `<path d="M${1100 + i * 40} 740 h560" stroke="${OL}" stroke-width="30"/><path d="M${1100 + i * 40} 740 h560" stroke="#8a94a8" stroke-width="18"/>`.replace(/740/g, String(740 - i * 36));
    const sp = (Math.floor(t * 8) % 3);
    for (let i = 0; i < 7; i++) { const a = -2.6 + i * .25 + sp * .08; s += `<path d="M1780 640 l${Math.cos(a) * 70} ${Math.sin(a) * 70}" stroke="${COL.yellow}" stroke-width="5" stroke-linecap="round"/>`; }
  } else if (kind === 'depot') {
    s += `<rect width="1920" height="1080" fill="#f3e2c4"/><rect x="0" y="780" width="1920" height="300" fill="#b98b5a" stroke="${OL}" stroke-width="6"/>`;
    s += `<rect x="1080" y="120" width="740" height="420" rx="10" fill="#bfe6ff" ${st}/><path d="M1450 120 V540" stroke="${OL}" stroke-width="6"/>`;
    s += `<clipPath id="win"><rect x="1080" y="120" width="740" height="420" rx="10"/></clipPath><g clip-path="url(#win)"><rect x="1080" y="430" width="740" height="110" fill="#8fd27e"/>` +
      G(`translate(${1120 + ((t * 60) % 900) - 200},500) scale(.32)`, truckSide(t, { truss: false, dist: t * 200 })) + `</g>`;
    s += `<rect x="1080" y="580" width="740" height="90" rx="12" fill="${COL.orange}" ${st}/>` + txt(1450, 642, 'OUTBACK HEAVY HAULAGE', 44, '#fff', { stroke: 0 });
    s += `<rect x="80" y="110" width="420" height="300" rx="10" fill="#fff" ${st}/>` + txt(290, 170, 'JOBS', 40, COL.navy, { stroke: 0 }) +
      [0, 1, 2].map(i => `<path d="M120 ${220 + i * 60} h${300 - i * 60}" stroke="#9ab" stroke-width="10" stroke-linecap="round"/>`).join('');
  } else if (kind === 'site') {
    s += `<rect width="1920" height="1080" fill="#d8ecd2"/><rect x="0" y="780" width="1920" height="300" fill="#9a8a72" stroke="${OL}" stroke-width="6"/>`;
    s += `<rect x="1100" y="110" width="700" height="430" rx="10" fill="#bfe6ff" ${st}/>`;
    s += `<path d="M1300 540 V200 M1250 200 H1700 M1660 200 V${300 + Math.sin(t * 1.5) * 20}" stroke="${COL.yellow}" stroke-width="16"/><rect x="1630" y="${300 + Math.sin(t * 1.5) * 20}" width="60" height="40" fill="${COL.truss}" ${st}/>`;
    s += `<path d="M1450 110 V540 M1100 330 H1800" stroke="${OL}" stroke-width="6"/>`;
    s += `<rect x="100" y="120" width="380" height="260" fill="#eaf2ff" ${st} transform="rotate(-3 290 250)"/><path d="M140 300 L210 180 L290 300 L370 180 L440 300" stroke="#3b6fd8" stroke-width="6" fill="none" transform="rotate(-3 290 250)"/>`;
    s += `<rect x="1100" y="580" width="700" height="90" rx="12" fill="#3c9a3c" ${st}/>` + txt(1450, 642, 'MERIDIAN CONSTRUCTION', 44, '#fff', { stroke: 0 });
  } else if (kind === 'nhvr') {
    s += `<rect width="1920" height="1080" fill="#d6ecea"/><rect x="0" y="780" width="1920" height="300" fill="#7a8a99" stroke="${OL}" stroke-width="6"/>`;
    s += `<rect x="1150" y="90" width="620" height="110" rx="14" fill="${COL.teal}" ${st}/>` + txt(1460, 166, 'NHVR', 70, '#fff', { stroke: 0 });
    for (let i = 0; i < 3; i++) s += `<rect x="${1180 + i * 200}" y="460" width="170" height="320" fill="#a7b4c2" ${st}/>` + [0, 1, 2].map(j => `<rect x="${1200 + i * 200}" y="${480 + j * 100}" width="130" height="80" fill="#c3ced9" stroke="${OL}" stroke-width="4"/><rect x="${1245 + i * 200}" y="${510 + j * 100}" width="40" height="12" rx="6" fill="${OL}"/>`).join('');
    s += `<rect x="90" y="110" width="440" height="300" fill="#c9a26b" ${st}/>` + [[140, 150], [300, 170], [190, 280], [380, 260]].map(([x, y], i) => `<rect x="${x}" y="${y}" width="110" height="80" fill="#fff" stroke="${OL}" stroke-width="4" transform="rotate(${(i % 2 ? 6 : -5)} ${x + 55} ${y + 40})"/><circle cx="${x + 55}" cy="${y + 4}" r="8" fill="${COL.red}"/>`).join('') +
      `<path d="M195 154 L355 174 L245 284 L435 264" stroke="${COL.red}" stroke-width="4" fill="none"/>`;
  } else if (kind === 'yard') {
    s += skyGrad('ysky', '#9fd8ff', '#e6f6ff') + `<rect width="1920" height="1080" fill="url(#ysky)"/>`;
    s += `<rect x="900" y="260" width="980" height="520" fill="#c9ced8" ${st}/><path d="M880 270 L1390 120 L1900 270 Z" fill="#8a94a8" ${st}/>` + txt(1390, 340, 'OUTBACK HEAVY HAULAGE', 50, COL.orange);
    s += `<rect x="0" y="780" width="1920" height="300" fill="#9a9a9a" stroke="${OL}" stroke-width="6"/>`;
    s += G('translate(980,780) scale(.7)', truckSide(t, { truss: false }));
  }
  return s;
}

// ---------- interview ----------
const PEOPLE = {
  steve: ['STEVE NGUYEN', 'NHVR Investigator', 'nhvr'],
  vince: ['VINCE MURPHY', 'Design / Production Engineer, Ironclad', 'workshop'],
  rachel: ['RACHEL WHITFIELD', 'Transport Manager, Outback Heavy Haulage', 'depot'],
  aryav: ['ARYAV NAIR', 'Project Manager, Meridian Construction', 'site'],
  mick: ['MICK DELANEY', 'Driver, Outback Heavy Haulage', 'yard'],
};
function panelBox(id, t, from, to, cap, col, inner) {
  if (t < from - .25 || t > to + .3) return '';
  const sp = pop(t, from - .25, .5) * fadeIO(t, from - .25, to + .3, .3);
  return popAt(1380, 470, sp, `<rect x="-470" y="-290" width="940" height="560" rx="18" fill="#fff" stroke="${OL}" stroke-width="10"/>` +
    `<clipPath id="pb${id}"><rect x="-450" y="-270" width="900" height="520" rx="8"/></clipPath><g clip-path="url(#pb${id})">${inner}</g>` +
    (cap ? `<rect x="-440" y="-260" width="${cap.length * 25 + 60}" height="64" rx="10" fill="${col}" stroke="${OL}" stroke-width="5"/>` + txt(-410, -214, cap, 38, '#fff', { anchor: 'start' }) : ''), id % 2 ? 1.5 : -1.5);
}
function interview(t, scene, who, panels, exprFn) {
  const [name, role, rk] = PEOPLE[who];
  const l = t - SC[scene].start;
  let s = room(rk, t);
  const ex = exprFn ? exprFn(t) : 'happy';
  s += G(`translate(470,${610 + Math.sin(l * 2) * 3}) scale(1.55)`, person(CHARS[who], { mouth: mouth(who, t), blink: blinkAt(t), expr: ex, pose: ex === 'shrug' ? 'shrug' : '' }));
  s += popAt(600, 870, pop(t, SC[scene].start + .3), `<rect x="-330" y="-50" width="660" height="100" rx="14" fill="${COL.navy}" stroke="${OL}" stroke-width="6"/>` +
    txt(0, -4, name, 44, COL.yellow, { stroke: 0 }) + txt(0, 34, role, role.length > 34 ? 24 : 28, '#fff', { font: 'Fredoka', stroke: 0 }));
  // moderator's question in a bubble
  const qid = speaking('mod', t) || speaking('mod', t + .3);
  if (qid && qid.startsWith('iq_')) {
    const c = TL.clips[qid];
    const lines = wrap(TL.captions.filter(x => x.t0 >= c.start - .01 && x.t0 < c.start + c.dur).map(x => x.text).join(' '), 40);
    const h = lines.length * 50 + 70;
    const sp = clamp(Math.min((t - c.start + .3) / .3, (c.start + c.dur + .3 - t) / .3));
    s += popAt(1360, 300, eout(sp), `<path d="M-380 ${h / 2 - 10} L-470 ${h / 2 + 60} L-320 ${h / 2 - 10}" fill="#fff" stroke="${OL}" stroke-width="6" stroke-linejoin="round"/><rect x="-480" y="${-h / 2}" width="960" height="${h}" rx="30" fill="#fff" stroke="${OL}" stroke-width="7"/><path d="M-374 ${h / 2 - 12} L-326 ${h / 2 - 12}" stroke="#fff" stroke-width="10"/>` +
      `<circle cx="-430" cy="${-h / 2 + 10}" r="40" fill="${COL.navy}" stroke="${OL}" stroke-width="6"/>` + txt(-430, -h / 2 + 26, 'Q', 46, COL.yellow, { stroke: 0 }) +
      lines.map((ln, i) => txt(0, -h / 2 + 62 + i * 50, ln, 40, OL, { font: 'Fredoka', stroke: 0, weight: 700 })).join(''));
  }
  panels.forEach((p, i) => { s += panelBox(i + 1, t, p[0], p[1], p[2], p[3], p[4](t)); });
  return s;
}


function phone(s2 = 1, wig = 0) {
  return G(`rotate(${wig}) scale(${s2})`, `<rect x="-90" y="-160" width="180" height="320" rx="30" fill="${OL}"/><rect x="-74" y="-130" width="148" height="250" rx="10" fill="#fff"/>` +
    txt(0, -90, 'MENTI', 30, '#5b3fd1', { stroke: 0 }) + [0, 1, 2].map(i => `<rect x="-56" y="${-60 + i * 56}" width="112" height="40" rx="10" fill="${['#e9e0ff', '#d6c8ff', '#c2afff'][i]}"/>`).join('') + `<circle cy="140" r="10" fill="#555"/>`);
}
function mentiScene(name, t) {
  const M = MENTI[name], sc = SC[name], l = t - sc.start;
  let s = sunburst(960, 540, l, '#efe8ff', '#e2d7ff');
  const first = TL.clips[M.items[0].c].start;
  // intro title card
  if (M.intro && t < first - .3) {
    s += popAt(960, 470, pop(t, sc.start + .2, .6), `<rect x="-560" y="-170" width="1120" height="340" rx="40" fill="#5b3fd1" stroke="${OL}" stroke-width="10"/>` +
      txt(80, -10, 'MENTI', 110, '#fff') + txt(80, 110, `QUESTION ${M.n}`, 110, COL.yellow) + G(`translate(-390,0)`, phone(.8, Math.sin(l * 6) * 8)));
    return s;
  }
  let idx = 0;
  M.items.forEach((it, i) => { if (t >= TL.clips[it.c].start - .3) idx = i; });
  const it = M.items[idx], c0 = TL.clips[it.c].start;
  const qs = it.qs || 54, qlh = qs * 1.18;
  const qLines = wrap(it.q, Math.round(44 * 54 / qs));
  const nOpt = it.type === 'yn' ? 1.6 : it.type === 'text' ? 1.4 : it.opts.length;
  const H = 150 + qLines.length * qlh + nOpt * 96 + (M.items.length > 1 ? 70 : 40);
  const top = 520 - H / 2;
  let inner = `<rect x="-760" y="${-H / 2 + 14}" width="1520" height="${H}" rx="34" fill="${OL}"/><rect x="-770" y="${-H / 2}" width="1520" height="${H}" rx="34" fill="#fff" stroke="${OL}" stroke-width="8"/>`;
  inner += `<rect x="-770" y="${-H / 2}" width="1520" height="96" rx="34" fill="#5b3fd1"/><rect x="-770" y="${-H / 2 + 60}" width="1520" height="36" fill="#5b3fd1"/>`;
  inner += txt(-720, -H / 2 + 66, `MENTI QUESTION ${M.n}`, 46, '#fff', { anchor: 'start', stroke: 0 });
  if (M.items.length > 1) inner += txt(700, -H / 2 + 62, `PART ${idx + 1} OF ${M.items.length}`, 34, COL.yellow, { anchor: 'end', font: 'Fredoka', stroke: 0, weight: 700 });
  if (M.multi) inner += `<rect x="190" y="${-H / 2 + 22}" width="520" height="52" rx="26" fill="${COL.yellow}"/>` + txt(450, -H / 2 + 58, 'YOU MAY SELECT MORE THAN ONE', 26, OL, { font: 'Fredoka', stroke: 0, weight: 700 });
  inner += qLines.map((ln, i) => txt(0, -H / 2 + 160 + i * qlh, ln, qs, COL.navy, { font: 'Fredoka', stroke: 0, weight: 700 })).join('');
  let y = -H / 2 + 150 + qLines.length * qlh + 30;
  const ynBtns = (cx, cy, s2, sc2 = 1) => popAt(cx, cy, s2, `<g transform="scale(${sc2})"><rect x="-250" y="-46" width="220" height="92" rx="46" fill="${COL.teal}" stroke="${OL}" stroke-width="6"/>` + txt(-140, 18, 'YES', 50, '#fff', { stroke: 0 }) +
    `<rect x="30" y="-46" width="220" height="92" rx="46" fill="${COL.red}" stroke="${OL}" stroke-width="6"/>` + txt(140, 18, 'NO', 50, '#fff', { stroke: 0 }) + '</g>');
  if (it.type === 'yn') inner += ynBtns(0, y + 70, pop(t, c0 + .3));
  if (it.type === 'text') inner += popAt(0, y + 60, pop(t, c0 + .6), `<rect x="-600" y="-50" width="1200" height="100" rx="18" fill="#f4f1ff" stroke="${OL}" stroke-width="5"/>` +
    txt(-560, 14, 'Type your answer…', 40, '#8a83a8', { anchor: 'start', font: 'Fredoka', stroke: 0 }) + (Math.floor(t * 2) % 2 ? `<rect x="-200" y="-26" width="6" height="52" fill="${OL}"/>` : ''));
  if (it.opts && it.type !== 'yn') it.opts.forEach((o, i) => {
    const yy = y + 48 + i * 96, sp = pop(t, W(it.c, o[1]) - .15);
    let row = `<rect x="-640" y="-40" width="1280" height="80" rx="18" fill="#f4f1ff" stroke="${OL}" stroke-width="5"/>`;
    if (it.type === 'mc') row += `<rect x="-610" y="-22" width="44" height="44" rx="8" fill="#fff" stroke="${OL}" stroke-width="5"/>` +
      (o[2] ? G('translate(-510,6) scale(.28)', head(CHARS[o[2]], { blink: blinkAt(t, i) })) : '') +
      txt(o[2] ? -450 : -530, 14, o[0], o[0].length > 50 ? 32 : 40, OL, { anchor: 'start', font: 'Fredoka', stroke: 0, weight: 600 });
    else row += txt(-600, 14, o[0], 38, OL, { anchor: 'start', font: 'Fredoka', stroke: 0, weight: 600 }) + ynBtns(470, 0, 1, .6);
    inner += popAt(0, yy, sp, row);
  });
  if (M.items.length > 1) inner += M.items.map((_, i) => `<circle cx="${(i - (M.items.length - 1) / 2) * 34}" cy="${H / 2 - 26}" r="10" fill="${i === idx ? '#5b3fd1' : '#d6cfee'}"/>`).join('');
  s += popAt(960, 500, idx === 0 && !M.intro ? pop(t, sc.start + .3) : 1 - .06 * Math.max(0, 1 - (t - (c0 - .3)) / .25), inner);
  // pause banner
  const P = E.pause[name];
  if (t > P - .2) {
    const pp = pop(t, P - .2, .5), rem = Math.max(0, sc.end - t), frac = rem / 6;
    const ang = 2 * Math.PI * frac;
    s += popAt(960, 950, pp, `<rect x="-640" y="-70" width="1280" height="140" rx="70" fill="${COL.red}" stroke="${OL}" stroke-width="8"/>` +
      `<circle cx="-560" cy="0" r="46" fill="#fff" stroke="${OL}" stroke-width="5"/><path d="M-560 0 L-560 -46 A46 46 0 ${ang > Math.PI ? 1 : 0} 1 ${-560 + 46 * Math.sin(ang)} ${-46 * Math.cos(ang)} Z" fill="${COL.yellow}"/>` +
      `<rect x="-578" y="-20" width="12" height="40" fill="${OL}"/><rect x="-554" y="-20" width="12" height="40" fill="${OL}"/>` +
      txt(40, 22, 'PAUSE • OVER TO THE ROOM', 64, '#fff'));
    s += popAt(1760, 760, pp, phone(.7, Math.sin(t * 8) * 10));
  }
  return s;
}

function hostStage(t, inner) {
  let s = sunburst(500, 600, t, '#ffe9b8', '#ffdc8a') + `<rect x="0" y="880" width="1920" height="200" fill="#f2b950" stroke="${OL}" stroke-width="7"/>`;
  s += G('translate(470,540) scale(1.3)', person(CHARS.mod, { full: true, pose: 'mic', mouth: mouth('mod', t), blink: blinkAt(t), t }));
  s += G('translate(470,110)', `<rect x="-170" y="-40" width="340" height="70" rx="14" fill="${COL.navy}" stroke="${OL}" stroke-width="6"/>` + txt(0, 12, 'MODERATOR', 40, COL.yellow, { stroke: 0 }));
  return s + inner;
}
