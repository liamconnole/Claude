// The Overpass, Episode 2: Unpacking the Incident. Scene renderers for global time t.

const SC = Object.fromEntries(TL.scenes.map(s => [s.name, s]));
const PIP = { hide: ['title', 'open', 'reveal'], right: [] };

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

// ---------- Menti ----------
const MENTI = {
  menti1: { n: 1, multi: true, items: [{ c: 'q1', q: 'Which of these businesses do you think is responsible for this incident?', type: 'mc',
    opts: [['Ironclad Steel Fabrication', 'Ironclad'], ['Meridian Construction Group', 'Meridian'], ['Outback Heavy Haulage Pty Ltd', 'Outback']] }] },
  menti2: { n: 2, multi: true, items: [{ c: 'q2', q: 'Whose job was it to ask “how does this get transported and restrained” before agreeing to the design and fabrication?', type: 'mc',
    opts: [['Aryav Nair · Project Manager, Meridian', 'Aryav', 'aryav'], ['Rachel Whitfield · Transport Manager, Outback', 'Rachel', 'rachel'], ['Vince Murphy · Design Engineer, Ironclad', 'Vince', 'vince']] }] },
  menti3: { n: 3, intro: 'q3', items: [
    { c: 'q3a', q: 'What should IRONCLAD have considered about the transportation task?', type: 'mc', opts: [['Loading & restraining of the truss during design', 'Loading'], ['Delivery timeframe', 'delivery'], ['The route', 'route'], ['Hazards involved in the job', 'hazards']] },
    { c: 'q3b', q: 'Is the Load Restraint Guide relevant in a case like this?', type: 'yn' },
    { c: 'q3c', q: 'Should attachment points for load restraint be considered in the design?', type: 'yn' },
    { c: 'q3d', q: 'Is the absence of tie-down points concerning?', type: 'yn' },
    { c: 'q3e', q: 'Should MERIDIAN have considered the transportation task when ordering the steel truss to be made?', type: 'yn' },
    { c: 'q3f', q: 'Should Meridian have been responsible for developing a Loading Plan?', type: 'yn' },
    { c: 'q3g', q: 'What parts of the transport task should MERIDIAN have considered?', type: 'mc', opts: [['The route', 'route'], ['Time of day', 'time'], ['Hazards on route', 'hazards'], ['All of the above', 'all']] },
  ] },
  menti4: { n: 4, intro: 'q4', items: [
    { c: 'q4a', q: 'Should Ironclad have produced a loading plan?', type: 'yn' },
    { c: 'q4b', q: 'Should Meridian have considered the journey plan as part of the engagement process with Outback?', type: 'yn' },
    { c: 'q4c', q: "Should Meridian have verified Outback's capability to undertake this task?", type: 'yn' },
    { c: 'q4d', q: 'Before engaging Outback Haulage, should Meridian have asked them:', type: 'ynlist', opts: [['About the experience Outback has with loads like this?', 'experience'], ['How they will restrain the truss?', 'restrain'], ['Do they have any questions?', 'questions']] },
    { c: 'q4e', q: 'Does verbal confirmation count as due diligence?', type: 'yn' },
    { c: 'q4f', q: 'Should Outback have considered formalising a journey plan and hazards?', type: 'yn' },
    { c: 'q4g', q: 'Should Outback have asked questions about the nature of the freight item and whether there was a loading plan?', type: 'yn' },
    { c: 'q4h', q: 'When should they have asked questions?', type: 'mc', opts: [['When first contacted', 'first'], ['Prior to picking up the truss', 'picking'], ["Prior to leaving Ironclad's depot with the truss", 'leaving']] },
    { c: 'q4i', q: 'Before giving the job to Mick, should Rachel have considered:', type: 'ynlist', opts: [['Whether he has the work hours available', 'work'], ['His experience with such loads', 'experience'], ['His knowledge of load restraint', 'restraint'], ['His knowledge of the route', 'route']] },
  ] },
  menti5: { n: 5, intro: 'q5', items: [
    { c: 'q5a', q: "Whose duty is route / risk assessment once it's already known from an earlier job?", type: 'mc', opts: [['Outback Haulage', 'Outback'], ['Meridian', 'Meridian'], ['Ironclad', 'Ironclad']] },
    { c: 'q5b', q: 'When should risk assessment have happened?', type: 'mc', opts: [['Design stage', 'design'], ['Project planning stage', 'project'], ['When engaging Outback', 'engaging']] },
    { c: 'q5c', q: 'What hazards should have been planned for?', type: 'mc', opts: [['Load restraint failure', 'load'], ['Vehicles cutting in front of truck', 'vehicles'], ['The railway crossing hazard', 'railway'], ['Other…', 'other']] },
    { c: 'q5d', q: 'Should Ironclad have factored in supervising the loading and the load restraint before the truck left their depot?', type: 'yn' },
    { c: 'q5e', q: "Where does Meridian's duty end?", type: 'mc', opts: [['When truck loaded', 'loaded'], ['When truck is on road', 'road'], ['When the load is delivered', 'delivered']] },
    { c: 'q5f', q: "Should Outback have assessed Mick's competency and provided him with any necessary training?", type: 'yn' },
    { c: 'q5g', q: 'What training might be needed?', type: 'text' },
    { c: 'q5h', q: 'With no loading plan, what should Mick have done before departure?', type: 'mc', opts: [['Refuse the job', 'refuse'], ['Escalate', 'escalate'], ['Use judgement / experience', 'use']] },
    { c: 'q5i', q: 'What should Mick have done when he felt the jolt crossing the rail line 15 minutes before the incident?', type: 'mc', opts: [['Stop at Wattlebrook Rest Area to check the load', 'stop'], ["Keep going because he's nearly there", 'keep']] },
    { c: 'q5j', q: 'What action should Outback Haulage take following the incident?', type: 'mc', opts: [["Check on Mick's wellbeing", 'check'], ['Attend the scene', 'attend'], ['Call their lawyer', 'call'], ['Notify NHVR of a reportable incident', 'notify']] },
  ] },
};
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
  const qLines = wrap(it.q, 44);
  const nOpt = it.type === 'yn' ? 1.6 : it.type === 'text' ? 1.4 : it.opts.length;
  const H = 150 + qLines.length * 64 + nOpt * 96 + (M.items.length > 1 ? 70 : 40);
  const top = 520 - H / 2;
  let inner = `<rect x="-760" y="${-H / 2 + 14}" width="1520" height="${H}" rx="34" fill="${OL}"/><rect x="-770" y="${-H / 2}" width="1520" height="${H}" rx="34" fill="#fff" stroke="${OL}" stroke-width="8"/>`;
  inner += `<rect x="-770" y="${-H / 2}" width="1520" height="96" rx="34" fill="#5b3fd1"/><rect x="-770" y="${-H / 2 + 60}" width="1520" height="36" fill="#5b3fd1"/>`;
  inner += txt(-720, -H / 2 + 66, `MENTI QUESTION ${M.n}`, 46, '#fff', { anchor: 'start', stroke: 0 });
  if (M.items.length > 1) inner += txt(700, -H / 2 + 62, `PART ${idx + 1} OF ${M.items.length}`, 34, COL.yellow, { anchor: 'end', font: 'Fredoka', stroke: 0, weight: 700 });
  if (M.multi) inner += `<rect x="190" y="${-H / 2 + 22}" width="520" height="52" rx="26" fill="${COL.yellow}"/>` + txt(450, -H / 2 + 58, 'YOU MAY SELECT MORE THAN ONE', 26, OL, { font: 'Fredoka', stroke: 0, weight: 700 });
  inner += qLines.map((ln, i) => txt(0, -H / 2 + 160 + i * 64, ln, 54, COL.navy, { font: 'Fredoka', stroke: 0, weight: 700 })).join('');
  let y = -H / 2 + 150 + qLines.length * 64 + 30;
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
      txt(o[2] ? -450 : -530, 14, o[0], 40, OL, { anchor: 'start', font: 'Fredoka', stroke: 0, weight: 600 });
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

// ---------- scenes ----------
function sTitle(t) {
  const l = t - SC.title.start;
  let s = skyGrad('tsky', '#7fd0ff', '#d9f3ff') + `<rect width="1920" height="1080" fill="url(#tsky)"/>`;
  s += `<circle cx="1650" cy="200" r="110" fill="${COL.yellow}" stroke="${OL}" stroke-width="7"/>` + cloud(300 + l * 20, 180, .9) + cloud(1100 - l * 15, 120, .7);
  s += `<path d="M0 760 Q300 600 640 720 Q1000 590 1340 720 Q1640 620 1920 700 L1920 1080 L0 1080 Z" fill="#8fd27e" stroke="${OL}" stroke-width="7"/>`;
  s += `<rect x="0" y="820" width="1920" height="160" fill="${COL.road}" stroke="${OL}" stroke-width="7"/><path d="M0 900 H1920" stroke="#fff" stroke-width="8" stroke-dasharray="70 50" stroke-dashoffset="${l * 300}"/>`;
  s += G(`translate(${-1300 + l * 520},905) scale(.55)`, truckSide(l, { dist: l * 950, driver: { blink: blinkAt(l) } }));
  s += popAt(960, 330, pop(t, SC.title.start + .5, .7), txt(0, 0, 'THE OVERPASS', 210, COL.yellow, { stroke: 30 }), Math.sin(l * 2.2) * 2);
  s += popAt(960, 470, pop(t, SC.title.start + 1.3), `<rect x="-560" y="-50" width="1120" height="96" rx="20" fill="${COL.red}" stroke="${OL}" stroke-width="6"/>` + txt(0, 22, 'EPISODE 2: UNPACKING THE INCIDENT', 54, '#fff'), -2);
  s += op(clamp((l - 2.4) * 2), txt(960, 1050, 'SARTA  •  NHVR  •  KJK LEGAL', 34, '#fff', { font: 'Fredoka', stroke: 6, weight: 700 }));
  return s;
}
function hostStage(t, inner) {
  let s = sunburst(500, 600, t, '#ffe9b8', '#ffdc8a') + `<rect x="0" y="880" width="1920" height="200" fill="#f2b950" stroke="${OL}" stroke-width="7"/>`;
  s += G('translate(470,540) scale(1.3)', person(CHARS.mod, { full: true, pose: 'mic', mouth: mouth('mod', t), blink: blinkAt(t), t }));
  s += G('translate(470,110)', `<rect x="-170" y="-40" width="340" height="70" rx="14" fill="${COL.navy}" stroke="${OL}" stroke-width="6"/>` + txt(0, 12, 'MODERATOR', 40, COL.yellow, { stroke: 0 }));
  return s + inner;
}
function sOpen(t) {
  return hostStage(t, popAt(1300, 330, pop(t, C('m_open') + .2), `<rect x="-470" y="-90" width="940" height="180" rx="30" fill="${COL.navy}" stroke="${OL}" stroke-width="7"/>` + txt(0, -10, 'EPISODE 2', 56, COL.yellow) + txt(0, 56, 'UNPACKING THE INCIDENT', 54, '#fff')) +
    popAt(1300, 660, pop(t, W('m_open', 'over')), G('translate(-250,0)', phone(.9, Math.sin(t * 6) * 8)) + txt(140, -20, "IT'S OVER", 70, COL.red) + txt(140, 60, 'TO YOU!', 70, COL.red)));
}
function sReveal(t) {
  const sp = pop(t, W('m_r1', 'Jane') - .3);
  let scr = `<rect x="-520" y="-300" width="1040" height="600" rx="16" fill="#fff" stroke="${OL}" stroke-width="10"/><rect x="-560" y="-330" width="1120" height="40" rx="10" fill="#555" stroke="${OL}" stroke-width="6"/>` +
    txt(0, -170, "NHVR'S ANSWERS", 76, COL.navy, { stroke: 0 }) + txt(0, -90, 'coming up on screen…', 44, '#777', { font: 'Fredoka', stroke: 0 });
  for (let i = 0; i < 3; i++) { const h = 80 + 60 * (1 + Math.sin(t * 3 + i * 2)); scr += `<rect x="${-240 + i * 180}" y="${230 - h}" width="120" height="${h}" rx="10" fill="${[COL.orange, COL.teal, '#5b3fd1'][i]}" stroke="${OL}" stroke-width="5"/>` + txt(-180 + i * 180, 270, '?', 40, OL, { stroke: 0 }); }
  return hostStage(t, burst(1300, 150, pop(t, W('m_r1', 'interesting') - .4) * .7, 'HMMM…', COL.yellow, -6, 80) + popAt(1300, 560, sp, scr) + chip(1300, 930, pop(t, W('m_r1', 'Jane')), 'OVER TO JANE', COL.red, 520, 50, 3));
}
function roadmap(t, t0, active = 0) {
  let s = sunburst(960, 900, t, '#d9f3ff', '#c6ebff');
  s += `<path d="M-50 860 C400 860 400 560 800 600 S1300 900 1500 600 S1800 300 2000 340" stroke="${OL}" stroke-width="110" fill="none"/><path d="M-50 860 C400 860 400 560 800 600 S1300 900 1500 600 S1800 300 2000 340" stroke="${COL.road}" stroke-width="90" fill="none"/>` +
    `<path d="M-50 860 C400 860 400 560 800 600 S1300 900 1500 600 S1800 300 2000 340" stroke="#fff" stroke-width="8" fill="none" stroke-dasharray="40 34" stroke-dashoffset="${-t * 60}"/>`;
  const posts = [[420, 600, '1', 'DESIGN &', 'MANUFACTURE'], [1100, 680, '2', 'ENGAGING THE', 'TRANSPORTER'], [1640, 420, '3', 'THE', 'JOURNEY']];
  posts.forEach(([x, y, n, a, b], i) => {
    const on = active === i + 1;
    s += popAt(x, y, pop(t, t0 + i * .5), `<rect x="-10" y="-40" width="20" height="160" fill="#8b5a2b" stroke="${OL}" stroke-width="5"/><rect x="-200" y="-260" width="400" height="230" rx="24" fill="${on ? COL.yellow : '#fff'}" stroke="${OL}" stroke-width="8"/>` +
      txt(0, -186, `STAGE ${n}`, 54, on ? OL : COL.navy, { stroke: 0 }) + txt(0, -122, a, 38, OL, { font: 'Fredoka', stroke: 0, weight: 700 }) + txt(0, -76, b, 38, OL, { font: 'Fredoka', stroke: 0, weight: 700 }));
  });
  return s;
}
function sUnpack(t) { return roadmap(t, C('m_unpack') + .3) + popAt(960, 150, pop(t, C('m_unpack')), txt(0, 0, "LET'S UNPACK THIS", 110, COL.yellow), -2); }

function sStage1(t) {
  let s = room('workshop', t);
  s += G('translate(380,560) scale(.85)', person(CHARS.vince, { full: true, pose: t > C('m_s1c') ? 'shrug' : 'point', t, mouth: 0, blink: blinkAt(t), expr: t > C('m_s1c') ? 'grin' : 'happy' }));
  // blueprint
  let bp = `<rect x="-520" y="-300" width="1040" height="560" rx="10" fill="#2f63b8" stroke="${OL}" stroke-width="8"/>`;
  for (let x = -500; x < 520; x += 40) bp += `<path d="M${x} -290 V250" stroke="#4b7fd0" stroke-width="2"/>`;
  for (let y = -280; y < 260; y += 40) bp += `<path d="M-510 ${y} H510" stroke="#4b7fd0" stroke-width="2"/>`;
  bp += G('translate(-330,170) scale(1.05)', `<g opacity=".95">${trussSide(0, 0, 0, 0, false).replace(/#d9632b/g, '#ffffff').replace(new RegExp(OL, 'g'), '#2f63b8')}</g>`);
  bp += txt(-490, -250, 'TRUSS – FABRICATION DRAWING', 30, '#fff', { anchor: 'start', font: 'Fredoka', stroke: 0, weight: 700 });
  s += popAt(1260, 460, pop(t, SC.stage1.start + 1.8), bp);
  s += stageChip(t, C('m_s1'), 1, 'DESIGN & MANUFACTURE');
  s += op(t < C('m_s1c') + .2 ? 1 : 0, stamp(1450, 300, prog(t, W('m_s1b', 'structural') - .1, .7), ['STRUCTURAL', 'GEOMETRY ✓'], COL.teal, -6, 48, 440));
  const qp = pop(t, W('m_s1c', 'tie'));
  [[230, -230], [380, -270], [560, -120], [90, -150], [470, -30]].forEach(([x, y], i) => s += popAt(1260 - 330 + x * 1.05, 460 + 170 + y * 1.05, qp * (1 + .1 * Math.sin(t * 8 + i)), `<circle r="34" fill="none" stroke="${COL.red}" stroke-width="7" stroke-dasharray="10 8"/>` + txt(0, 16, '?', 46, COL.yellow, { stroke: 8 })));
  s += chip(1260, 820, qp, 'TIE-DOWN & LIFTING POINTS?', COL.red, 820, 44);
  s += popAt(780, 230, pop(t, W('m_s1c', 'site')), `<rect x="-200" y="-110" width="400" height="220" fill="#fff59d" stroke="${OL}" stroke-width="6"/>` + txt(0, -30, '“SITE', 52, OL, { stroke: 0 }) + txt(0, 30, 'PROBLEM!”', 52, OL, { stroke: 0 }) + txt(0, 80, '¯\\_(ツ)_/¯', 30, '#666', { font: 'Fredoka', stroke: 0 }), -6);
  s += popAt(1620, 180, pop(t, W('m_s1c', 'transporter')), `<rect x="-260" y="-80" width="520" height="160" rx="20" fill="#fff" stroke="${OL}" stroke-width="6"/>` + G('translate(-170,40) scale(.13)', truckSide(t, { truss: false })) +
    txt(70, -12, 'Transporter can', 36, OL, { font: 'Fredoka', stroke: 0, weight: 700 }) + txt(70, 34, 'sort it out!', 36, OL, { font: 'Fredoka', stroke: 0, weight: 700 }), 4);
  return s;
}

const panelText = (lines, size = 52, col = OL, y0 = 0) => lines.map((l, i) => txt(0, y0 + i * size * 1.2, l, size, col, { stroke: 0 })).join('');
function sVince(t) {
  const meeting = (tt) => {
    let s = `<rect x="-450" y="-270" width="900" height="520" fill="#e7ecf5"/><ellipse cx="0" cy="130" rx="330" ry="80" fill="#b98b5a" stroke="${OL}" stroke-width="6"/>`;
    [['vince', -240], ['worker', 0], ['d1', 240]].forEach(([k, x], i) => s += G(`translate(${x},${40 + Math.sin(tt * 3 + i) * 3}) scale(.55)`, head(CHARS[k], { blink: blinkAt(tt, i), mouth: k === 'vince' ? Math.abs(Math.sin(tt * 9)) * .6 : 0 })));
    const fp = fadeIO(tt, C('v1') + .4, W('v1', 'never'), .5);
    s += op(fp, bubble(-140, -110, 360, 110, ['Load restraint…?'], 1, [-60, 90], 36));
    return s + chip(200, 205, 1, 'IRONCLAD SCOPING MEETING', COL.navy, 560, 30);
  };
  const record = (tt) => {
    let s = `<rect x="-450" y="-270" width="900" height="520" fill="#f6f6f6"/>`;
    s += G('translate(-230,0)', `<rect x="-150" y="-100" width="300" height="200" rx="14" fill="#fff" stroke="${OL}" stroke-width="7"/><path d="M-150 -100 L0 20 L150 -100" stroke="${OL}" stroke-width="7" fill="none"/>`) + txt(-230, 150, 'EMAIL', 44, COL.navy, { stroke: 0 }) + cross(-110, -100, pop(tt, W('v1', 'email')));
    s += G('translate(230,10) scale(.7)', doc('FILE NOTE')) + txt(230, 150, 'FILE NOTE', 44, COL.navy, { stroke: 0 }) + cross(350, -100, pop(tt, W('v1', 'file')));
    return s + stamp(0, 30, prog(tt, W('v1', 'record') - .1, .7), ['NO RECORD'], COL.red, -8, 90, 560);
  };
  return interview(t, 'vince', 'vince', [
    [C('v1'), W('v1', 'never') - .2, 'MENTIONED IN PASSING', COL.orange, meeting],
    [W('v1', 'never'), SC.vince.end, 'NO EMAIL • NO FILE NOTE', COL.red, record],
  ], tt => tt > W('v1', 'never') ? 'worried' : 'happy');
}

function sTight(t) {
  let s = room('site', t);
  s += G('translate(420,560) scale(.85)', person(CHARS.aryav, { full: true, blink: blinkAt(t), expr: 'worried', pose: 'clip' }));
  const page = Math.floor(clamp((t - C('m_tight')) * 5, 0, 30));
  s += popAt(1150, 430, pop(t, C('m_tight')), `<rect x="-230" y="-230" width="460" height="460" rx="24" fill="#fff" stroke="${OL}" stroke-width="8"/><rect x="-230" y="-230" width="460" height="110" rx="24" fill="${COL.red}" stroke="${OL}" stroke-width="8"/>` +
    txt(0, -150, 'SCHEDULE', 50, '#fff', { stroke: 0 }) + txt(0, 110, String(30 - page), 200, OL, { stroke: 0 }) + txt(0, 190, 'DAYS LEFT', 40, '#666', { font: 'Fredoka', stroke: 0 }), -3);
  for (let i = 0; i < 4; i++) { const p = ((t * 1.3 + i * .25) % 1); s += `<rect x="${1150 + p * 600}" y="${300 - p * 300 + i * 30}" width="140" height="140" rx="10" fill="#fff" stroke="${OL}" stroke-width="5" opacity="${(1 - p) * (t > C('m_tight') ? 1 : 0)}" transform="rotate(${p * 200} ${1220 + p * 600} ${370 - p * 300})"/>`; }
  s += G('translate(1650,300)', `<circle r="130" fill="#fff" stroke="${OL}" stroke-width="8"/><path d="M0 0 L0 -100" stroke="${OL}" stroke-width="10" stroke-linecap="round" transform="rotate(${t * 360})"/><path d="M0 0 L60 0" stroke="${OL}" stroke-width="12" stroke-linecap="round" transform="rotate(${t * 30})"/>`);
  s += stamp(1300, 740, prog(t, W('m_tight', 'fast') - .1, .7), ['FAST-TRACKED!'], COL.red, -6, 76, 680);
  s += chip(560, 120, pop(t, W('m_tight', 'tight')), 'TIGHT SCHEDULE', COL.navy, 560, 52, -3);
  return s;
}
function sStage2(t) {
  let s = room('site', t);
  s += G(`translate(420,${600 + Math.sin(t * 2) * 3}) scale(1.2)`, person(CHARS.aryav, { pose: 'phone', blink: blinkAt(t), mouth: Math.abs(Math.sin(t * 8)) * .5 * (t > C('m_s2b') ? 1 : 0) }));
  s += stageChip(t, C('m_s2'), 2, 'ENGAGING THE TRANSPORTER');
  const wk = pop(t, W('m_s2b', 'quote') - .3);
  let cal = `<rect x="-420" y="-150" width="840" height="300" rx="24" fill="#fff" stroke="${OL}" stroke-width="8"/>` + txt(0, -80, 'QUOTE WITHIN 1 WEEK', 52, COL.navy, { stroke: 0 });
  const done = clamp(Math.floor((t - W('m_s2b', 'week')) * 4), 0, 7);
  for (let i = 0; i < 7; i++) cal += `<rect x="${-385 + i * 110}" y="-30" width="90" height="130" rx="12" fill="${i < done ? '#ffd2d2' : '#f2f2f2'}" stroke="${OL}" stroke-width="5"/>` + txt(-340 + i * 110, 50, 'MTWTFSS'[i], 44, OL, { stroke: 0 }) + (i < done ? `<path d="M${-370 + i * 110} -10 L${-310 + i * 110} 80 M${-310 + i * 110} -10 L${-370 + i * 110} 80" stroke="${COL.red}" stroke-width="7"/>` : '');
  s += popAt(1300, 420, wk, cal);
  s += stamp(1100, 780, prog(t, W('m_s2b', 'short') - .1, .7), ['SHORT NOTICE'], COL.red, -5, 64, 560);
  s += chip(1600, 780, pop(t, W('m_s2b', 'Outback')), 'OUTBACK', COL.orange, 380, 54, 4);
  return s;
}
function sRachel1(t) {
  const first = (tt) => `<rect x="-450" y="-270" width="900" height="520" fill="#fff4e3"/>` + G('translate(-420,190) scale(.75)', truckSide(tt, {})) +
    chip(-200, -150, pop(tt, W('r1', 'OSOM')), 'OSOM LOADS ✓', COL.teal, 380, 40) + burst(220, -40, pop(tt, W('r1', 'first')) * .55, 'FIRST TIME!', COL.yellow, 8, 70);
  const plan = (tt) => `<rect x="-450" y="-270" width="900" height="520" fill="#fff"/>` + G('translate(-260,30) scale(.85)', doc('LOAD PLAN')) +
    txt(160, -40, 'Asked for?', 50, OL, { stroke: 0 }) + cross(370, -56, pop(tt, W('r1', 'ask'))) + txt(160, 100, 'Provided?', 50, OL, { stroke: 0 }) + cross(370, 84, pop(tt, W('r1', 'provided')));
  return interview(t, 'rachel1', 'rachel', [
    [C('r1'), W('r1', 'No') - .2, 'NEVER DONE A JOB LIKE THIS', COL.orange, first],
    [W('r1', 'No'), SC.rachel1.end, 'LOADING PLAN', COL.red, plan],
  ]);
}
function sAryav(t) {
  const allgood = (tt) => `<rect x="-450" y="-270" width="900" height="520" fill="#eef7ec"/>` + card(0, 30, 560, 280, '#fff', txt(0, -30, 'ALLGOOD', 70, COL.navy, { stroke: 0 }) + txt(0, 40, 'HAULAGE', 50, COL.navy, { stroke: 0 }), 1) +
    stamp(0, 40, prog(tt, W('a1', 'cancelled') - .1, .7), ['CANCELLED'], COL.red, -12, 80, 560);
  const quotes = (tt) => {
    let s = `<rect x="-450" y="-270" width="900" height="520" fill="#eef7ec"/>`;
    [['HAULER A', '$$$$'], ['HAULER B', '$$$'], ['OUTBACK', '$$']].forEach(([n, p], i) => {
      const win = i === 2 && tt > W('a1', 'cheaper') - .1;
      s += popAt(-290 + i * 290, 40, pop(tt, W('a1', 'contacted') + i * .3), `<rect x="-120" y="-150" width="240" height="300" rx="16" fill="${win ? COL.yellow : '#fff'}" stroke="${OL}" stroke-width="6"/>` + txt(0, -80, n, 36, COL.navy, { stroke: 0 }) + txt(0, 30, p, 64, '#2a9d2a', { stroke: 0 }) + txt(0, 100, 'QUOTE', 30, '#777', { font: 'Fredoka', stroke: 0 }));
    });
    return s + tick(290, -120, pop(tt, W('a1', 'cheaper')));
  };
  const permits = (tt) => {
    let s = `<rect x="-450" y="-270" width="900" height="520" fill="#d9eccf"/>`;
    const segs = [[-380, 150, -150, 40, COL.teal], [-150, 40, 90, 100, COL.red], [90, 100, 380, -60, COL.orange]];
    segs.forEach(([a, b, c, d, col], i) => s += `<path d="M${a} ${b} L${c} ${d}" stroke="${OL}" stroke-width="30" stroke-linecap="round"/><path d="M${a} ${b} L${c} ${d}" stroke="${col}" stroke-width="18" stroke-linecap="round" opacity="${clamp((tt - C('m_permit') - i * .5) * 3)}"/>`);
    s += chip(-20, -110, pop(tt, W('m_permit', 'permits')), 'NO PERMIT', COL.red, 340, 40, -4) + chip(250, 170, pop(tt, W('m_permit', 'notice')), 'UNDER NOTICE', COL.orange, 380, 40, 3);
    return s + `<circle cx="-380" cy="150" r="22" fill="${OL}"/>` + G('translate(380,-60)', `<rect x="-40" y="-40" width="80" height="80" rx="10" fill="${COL.yellow}" stroke="${OL}" stroke-width="5"/>`) + txt(380, -48, 'SITE', 22, OL, { stroke: 0 });
  };
  const jplan = (tt) => `<rect x="-450" y="-270" width="900" height="520" fill="#fff"/>` + G('translate(0,20) scale(.95)', doc('JOURNEY PLAN', 5, '#f2f6ff')) +
    [-260, 260, -200, 210].map((x, i) => popAt(x, [-120, -100, 140, 130][i], pop(tt, W('a2', 'What') + i * .12) * (1 + .08 * Math.sin(tt * 7 + i)), txt(0, 30, '?', 120, COL.yellow, { stroke: 14 }))).join('');
  const loads = (tt) => `<rect x="-450" y="-270" width="900" height="520" fill="#fff"/>` +
    [['IRREGULAR', -110], ['OFFSET', 0], ['HIGH CoG', 110]].map(([n, y], i) => popAt(-60, y - 30, pop(tt, C('iq_a3') + .5 + i * .4), `<rect x="-280" y="-44" width="560" height="88" rx="20" fill="#f4f1ff" stroke="${OL}" stroke-width="5"/>` + txt(-30, 16, n, 46, OL, { stroke: 0 })) + cross(300, y - 30, pop(tt, W('a3', 'No')))).join('') +
    chip(0, 200, pop(tt, W('a3', 'knew')), 'JUST KNEW THEY DID OSOM', COL.navy, 640, 38);
  return interview(t, 'aryav', 'aryav', [
    [C('a1'), W('a1', 'contacted') - .2, 'FIRST CHOICE', COL.navy, allgood],
    [W('a1', 'contacted'), CE('a1') + .2, 'QUOTES', '#2a9d2a', quotes],
    [C('m_permit'), CE('m_permit') + .2, 'PERMITS', COL.red, permits],
    [C('a2'), CE('a2') + .3, 'JOURNEY PLAN?', COL.orange, jplan],
    [C('iq_a3') + .3, SC.aryav.end, 'LOAD TYPE: ASKED?', COL.red, loads],
  ], tt => (tt > C('a2') && tt < CE('a2') + .5) ? 'worried' : 'happy');
}
function sMick(t) {
  const weeks = (tt) => {
    let s = `<rect x="-450" y="-270" width="900" height="520" fill="#eef6ff"/>`;
    for (let i = 0; i < 6; i++) s += popAt(-300 + i * 120, 20, pop(tt, C('mk1') + .5 + i * .15), `<rect x="-50" y="-60" width="100" height="120" rx="12" fill="#fff" stroke="${OL}" stroke-width="5"/>` + txt(0, 20, `W${i + 1}`, 40, COL.navy, { stroke: 0 }));
    return s + chip(0, 170, pop(tt, W('mk1', 'six')), '6 WEEKS AT OUTBACK', COL.orange, 560, 44);
  };
  const usual = (tt) => {
    let s = `<rect x="-450" y="-270" width="900" height="520" fill="#eef6ff"/>`;
    s += popAt(-210, 20, pop(tt, W('mk1', 'general')), G('scale(1.1)', iconFreight()) + txt(0, 150, 'GENERAL FREIGHT', 36, COL.navy, { stroke: 0 }));
    s += popAt(220, 20, pop(tt, W('mk1', 'livestock')), G('scale(1.1)', iconCattle(tt)) + txt(0, 150, 'LIVESTOCK', 36, COL.navy, { stroke: 0 }));
    return s;
  };
  const first = (tt) => `<rect x="-450" y="-270" width="900" height="520" fill="#fff4e3"/>` + burst(0, -20, pop(tt, W('mk1', 'first')) * .6, 'FIRST OSOM JOB!', COL.yellow, -5, 70) +
    popAt(0, 170, pop(tt, W('mk1', 'didn')), txt(0, 0, 'OSOM = ???', 80, COL.red), 3);
  return interview(t, 'mick', 'mick', [
    [C('mk1'), W('mk1', 'usually') - .2, 'NEW STARTER', COL.navy, weeks],
    [W('mk1', 'usually'), W('mk1', 'this') - .2, 'USUAL WORK', COL.teal, usual],
    [W('mk1', 'this'), SC.mick.end, 'FIRST TIME', COL.red, first],
  ], tt => tt > W('mk1', 'didn') ? 'worried' : 'happy');
}
function iconFreight() {
  const st = `stroke="${OL}" stroke-width="6" stroke-linejoin="round"`;
  return `<rect x="-150" y="-90" width="200" height="130" rx="8" fill="#fff" ${st}/><path d="M50 40 L50 -50 L110 -50 L140 -10 L140 40 Z" fill="${COL.orange}" ${st}/><circle cx="-100" cy="50" r="22" fill="#2a2d36" ${st}/><circle cx="100" cy="50" r="22" fill="#2a2d36" ${st}/>` + txt(-50, -10, 'BOXES', 30, COL.navy, { stroke: 0 });
}
function iconCattle(tt) {
  const st = `stroke="${OL}" stroke-width="6" stroke-linejoin="round"`;
  let s = `<rect x="-150" y="-90" width="200" height="130" rx="8" fill="#c9a26b" ${st}/>`;
  for (let i = 0; i < 4; i++) s += `<path d="M-150 ${-70 + i * 28} h200" stroke="${OL}" stroke-width="4"/>`;
  s += `<ellipse cx="-60" cy="${-110 + Math.sin(tt * 4) * 4}" rx="40" ry="32" fill="#fff" ${st}/><circle cx="-74" cy="${-112 + Math.sin(tt * 4) * 4}" r="10" fill="#111"/><ellipse cx="-60" cy="${-92 + Math.sin(tt * 4) * 4}" rx="24" ry="12" fill="#f4a6b6" ${st}/>`;
  return s + `<path d="M50 40 L50 -50 L110 -50 L140 -10 L140 40 Z" fill="${COL.orange}" ${st}/><circle cx="-100" cy="50" r="22" fill="#2a2d36" ${st}/><circle cx="100" cy="50" r="22" fill="#2a2d36" ${st}/>`;
}
function sRachel2(t) {
  const why = (tt) => `<rect x="-450" y="-270" width="900" height="520" fill="#fff"/>` + txt(-80, -40, 'Experienced driver', 52, OL, { stroke: 0 }) + tick(320, -56, pop(tt, W('r2', 'experienced'))) +
    txt(-80, 100, 'Available on the day', 52, OL, { stroke: 0 }) + tick(320, 84, pop(tt, W('r2', 'available')));
  const lic = (tt) => `<rect x="-450" y="-270" width="900" height="520" fill="#fff"/>` +
    chip(0, -110, pop(tt, W('r3', 'No')), 'OSOM EXPERIENCE: NOT DISCUSSED', COL.red, 820, 40) +
    popAt(0, 110, pop(tt, W('r3', 'licence')), `<rect x="-260" y="-110" width="520" height="220" rx="20" fill="#e0f2ff" stroke="${OL}" stroke-width="7"/>` + G('translate(-160,10) scale(.5)', head(CHARS.mick, {})) +
      txt(80, -40, 'DRIVER LICENCE', 34, COL.navy, { stroke: 0 }) + txt(80, 20, 'CLASS: HC', 40, OL, { stroke: 0 }) + txt(80, 70, 'M. DELANEY', 30, '#555', { font: 'Fredoka', stroke: 0 }), -4);
  return interview(t, 'rachel2', 'rachel', [
    [C('r2'), CE('r2') + .2, 'WHY MICK?', COL.navy, why],
    [C('r3'), SC.rachel2.end, '“HE’S GOT A LICENCE!”', COL.orange, lic],
  ], tt => tt > C('r3') ? 'grin' : 'happy');
}
function sRail(t) {
  let s = room('depot', t);
  ['d1', 'd2', 'd3'].forEach((k, i) => s += G(`translate(${220 + i * 230},${560 + Math.sin(t * 2 + i) * 3}) scale(.62)`, person(CHARS[k], { full: true, blink: blinkAt(t, i), mouth: t > W('m_rail2', 'discussed') && t < W('m_rail2', 'never') && Math.floor(t * 1.5) % 3 === i ? Math.abs(Math.sin(t * 10)) * .6 : 0 })));
  s += bubble(330, 220, 420, 120, ['Watch that rail', 'crossing!'], t < W('m_rail2', 'never') ? pop(t, W('m_rail2', 'discussed')) : 0, [-80, 100], 34);
  s += bubble(700, 330, 300, 100, ['Nasty bump!'], t < W('m_rail2', 'never') ? pop(t, W('m_rail2', 'discussed') + .8) : 0, [-60, 90], 34);
  s += popAt(1450, 300, pop(t, C('m_rail1') + .3), `<rect x="-330" y="-140" width="660" height="280" rx="24" fill="${COL.yellow}" stroke="${OL}" stroke-width="8"/><g transform="translate(-200,-10)"><rect x="-80" y="-14" width="160" height="28" fill="#fff" stroke="${OL}" stroke-width="4" transform="rotate(30)"/><rect x="-80" y="-14" width="160" height="28" fill="#fff" stroke="${OL}" stroke-width="4" transform="rotate(-30)"/></g>` +
    txt(80, -40, 'RAIL CROSSING', 44, OL, { stroke: 0 }) + txt(80, 10, '20 km before school', 32, OL, { font: 'Fredoka', stroke: 0, weight: 700 }) + txt(80, 80, 'KNOWN HAZARD', 50, COL.red, { stroke: 0 }), -2);
  const rg = pop(t, W('m_rail2', 'recorded') - .2);
  s += popAt(1080, 690, rg, `<rect x="-200" y="-130" width="400" height="260" rx="10" fill="#fff" stroke="${OL}" stroke-width="7"/><path d="M0 -130 V130" stroke="${OL}" stroke-width="5"/>` + txt(-100, -70, 'HAZARD', 30, COL.navy, { stroke: 0 }) + txt(-100, -36, 'REGISTER', 30, COL.navy, { stroke: 0 }) + txt(100, 10, '(empty)', 30, '#999', { font: 'Fredoka', stroke: 0 }), -3);
  s += cross(1240, 580, pop(t, W('m_rail2', 'register')));
  s += popAt(1560, 690, pop(t, W('m_rail2', 'briefing')), `<rect x="-180" y="-60" width="360" height="120" rx="20" fill="#fff" stroke="${OL}" stroke-width="6"/>` + txt(-30, -4, 'FORMAL', 40, OL, { stroke: 0 }) + txt(-30, 40, 'BRIEFING', 40, OL, { stroke: 0 })) + cross(1700, 640, pop(t, W('m_rail2', 'briefing') + .2));
  const fp = pop(t, W('m_rail2', 'flagged'));
  s += popAt(1330, 880, fp, `<rect x="-420" y="-60" width="840" height="120" rx="60" fill="${COL.red}" stroke="${OL}" stroke-width="7"/>` + G('translate(-350,0) scale(.32)', head(CHARS.rachel, {})) + G('translate(350,0) scale(.32)', head(CHARS.mick, { expr: 'worried' })) +
    txt(0, 16, 'NOT FLAGGED TO MICK', 46, '#fff', { stroke: 0 }));
  return s;
}

// ---------- stage 3 ----------
function sStage3(t) {
  let s = sunburst(960, 900, t, '#d9f3ff', '#c6ebff') + op(.3, roadmap(t, SC.stage3.start, 3));
  s += stageChip(t, C('m_s3'), 3, 'THE JOURNEY');
  s += popAt(560, 380, pop(t, W('s3a', 'journey') - .2), G('scale(.9)', doc('JOURNEY PLAN', 5, '#f2f6ff')), -4);
  s += stamp(560, 400, prog(t, W('s3a', 'exist') - .1, .7), ['DOES NOT', 'EXIST'], COL.red, -12, 64, 460);
  s += popAt(1300, 320, pop(t, W('s3a', 'rail')), `<rect x="-230" y="-90" width="460" height="180" rx="20" fill="${COL.yellow}" stroke="${OL}" stroke-width="7"/>` + txt(0, -10, 'RAIL CROSSING', 44, OL, { stroke: 0 }) + txt(0, 50, 'known hazard…', 34, OL, { font: 'Fredoka', stroke: 0, weight: 700 }), 3);
  s += popAt(1300, 640, pop(t, W('s3a', 'nowhere')), txt(0, 0, '…nowhere to include it for Mick', 46, COL.red, { stroke: 7, strokeCol: '#fff' }));
  return s;
}
function depot(t, sky) {
  let s = sky + `<rect x="0" y="0" width="1920" height="1080" fill="url(#dsky)"/>`;
  s += `<rect x="1360" y="240" width="560" height="560" fill="#8a94a8" stroke="${OL}" stroke-width="6"/><path d="M1340 250 L1640 140 L1940 250 Z" fill="#6a7186" stroke="${OL}" stroke-width="6"/>` + txt(1640, 330, 'IRONCLAD', 60, '#fff') + txt(1640, 380, 'STEEL FABRICATION', 32, '#fff', { font: 'Fredoka', stroke: 0, weight: 700 });
  s += `<rect x="1460" y="460" width="360" height="340" fill="#4a4f5c" stroke="${OL}" stroke-width="6"/>`;
  return s + `<rect x="0" y="800" width="1920" height="280" fill="#9a9a9a" stroke="${OL}" stroke-width="6"/>`;
}
function sLoading(t) {
  const sc = SC.loading;
  let s = depot(t, skyGrad('dsky', '#ff9e6b', '#ffd9a8'));
  s += `<circle cx="300" cy="300" r="90" fill="#ffcf5a" opacity=".9"/>`;
  // gantry crane
  s += `<rect x="140" y="160" width="40" height="660" fill="${COL.yellow}" stroke="${OL}" stroke-width="6"/><rect x="1180" y="160" width="40" height="660" fill="${COL.yellow}" stroke="${OL}" stroke-width="6"/><rect x="120" y="130" width="1120" height="50" fill="${COL.yellow}" stroke="${OL}" stroke-width="6"/>`;
  const drop = 1 - eio(prog(t, C('s3b') + .5, 3.0));
  const ty = -240 * drop;
  const S = .9, X = 160, Y = 860;
  s += `<path d="M${X + S * 450} 180 L${X + S * 450} ${Y + S * (-86 + ty - 300)}" stroke="${OL}" stroke-width="6"/>`;
  s += G(`translate(${X},${Y}) scale(${S})`, truckSide(t, { truss: false }) + G(`translate(70,${-86 + ty})`, trussSide(t, 0, 0, 0, t > W('s3d', 'secured'))));
  // binders
  const bpos = [120, 60, 300, 520, 560];
  bpos.forEach((bx, i) => s += popAt(X + S * (70 + bx), Y + S * -58 + 52, pop(t, W('s3d', 'all') + i * .25), `<rect x="-26" y="-18" width="52" height="36" rx="6" fill="${COL.yellow}" stroke="${OL}" stroke-width="5"/><circle cx="0" cy="-48" r="22" fill="${COL.navy}" stroke="#fff" stroke-width="4"/>` + txt(0, -38, String(i + 1), 28, '#fff', { stroke: 0 })));
  s += chip(700, 120, pop(t, W('s3d', 'binders')), '5 LOAD BINDERS • 20 t LOAD', COL.navy, 760, 44, -2);
  s += hud2(1640, 90, 'AFTERNOON', '12 HRS BEFORE DEPARTURE', pop(t, sc.start + .3));
  // people
  s += G('translate(1340,700) scale(.5)', person(CHARS.mick, { full: true, blink: blinkAt(t), mouth: t > C('s3c') && t < W('s3c', 'told') ? Math.abs(Math.sin(t * 10)) * .6 : 0, expr: t > W('s3c', 'judgement') ? 'worried' : 'happy' }));
  s += G('translate(1560,700) scale(.5)', person(CHARS.worker, { full: true, blink: blinkAt(t, 2), pose: t > W('s3c', 'told') && t < CE('s3c') + 1 ? 'shrug' : '', t, mouth: t > W('s3c', 'told') && t < CE('s3c') ? Math.abs(Math.sin(t * 9)) * .6 : 0 }));
  s += bubble(1180, 410, 440, 120, ['Got a loading plan?'], t < CE('s3c') + .8 ? pop(t, C('s3c') + .2) : 0, [120, 100], 36);
  s += bubble(1640, 300, 420, 150, ['Nope! Use your', 'judgement, mate.'], t < CE('s3c') + .8 ? pop(t, W('s3c', 'told')) : 0, [-20, 120], 36);
  return s;
}
function sMorning(t) {
  const sc = SC.morning;
  let s = depot(t, skyGrad('dsky', '#9fd8ff', '#ffe7b3'));
  s += `<circle cx="300" cy="520" r="110" fill="#ffd23f" opacity=".95"/>`;
  s += G('translate(160,860) scale(.9)', truckSide(t, { loose: 0 }));
  const wx = lerp(-120, 1180, eio(prog(t, sc.start + .3, sc.end - sc.start - 1)));
  s += G(`translate(${wx},${700 + Math.abs(Math.sin(t * 7)) * -8}) scale(.5)`, person(CHARS.mick, { full: true, blink: blinkAt(t), expr: 'grin' }) + `<rect x="100" y="150" width="50" height="64" rx="8" fill="#fff" stroke="${OL}" stroke-width="6"/><path d="M110 140 q10 -30 0 -50 M130 140 q10 -30 0 -50" stroke="#bbb" stroke-width="5" fill="none"/>`);
  s += hud2(1640, 90, 'NEXT MORNING', 'TIME TO DEPART', pop(t, sc.start + .3));
  s += popAt(560, 200, pop(t, W('s3e', 'check') - .2), `<rect x="-300" y="-130" width="600" height="260" rx="20" fill="#fff" stroke="${OL}" stroke-width="7"/>` + txt(0, -66, 'PRE-DEPARTURE CHECK', 40, COL.navy, { stroke: 0 }) +
    txt(-60, 10, 'Load', 46, OL, { stroke: 0 }) + txt(-60, 90, 'Restraints', 46, OL, { stroke: 0 }), -3);
  s += cross(760, 200, pop(t, W('s3e', 'load'))) + cross(760, 280, pop(t, W('s3e', 'restraints')));
  return s;
}
function sJourney(t) {
  const sc = SC.journey, l = t - sc.start, speed = 650, d = l * speed;
  let s = skyGrad('osky', '#8fb3d6', '#dfe9f2') + `<rect width="1920" height="1080" fill="url(#osky)"/>`;
  for (let i = 0; i < 5; i++) s += cloud(((i * 520 - l * 25) % 2600 + 2600) % 2600 - 300, 110 + (i % 2) * 70, .9, '#cfd8e3');
  let hp = 'M0 700 ';
  for (let x = 0; x <= 1920; x += 40) hp += `L${x} ${620 + 50 * Math.sin((x + d * .12) / 260) + 30 * Math.sin((x + d * .12) / 110)} `;
  s += `<path d="${hp} L1920 1080 L0 1080 Z" fill="#7d9c79" stroke="${OL}" stroke-width="6"/>`;
  for (let i = 0; i < 10; i++) { const x = ((i * 300 - d * .45) % 3000 + 3000) % 3000 - 300; s += tree(x, 740, .75, '#5f8f5a'); }
  s += `<rect x="0" y="770" width="1920" height="310" fill="#3e434f" stroke="${OL}" stroke-width="6"/><rect x="0" y="790" width="1920" height="12" fill="#e6e6e6"/><path d="M0 960 H1920" stroke="#e6e6e6" stroke-width="10" stroke-dasharray="90 70" stroke-dashoffset="${d}"/>`;
  const fg = (T0, xAt) => xAt - speed * (t - T0);
  const rx = fg(E.jolt, 1390);
  if (rx > -300 && rx < 2300) {
    s += G(`translate(${rx + 200},790)`, `<rect x="-8" y="-300" width="16" height="300" fill="#eee" stroke="${OL}" stroke-width="4"/><g transform="translate(0,-260)"><rect x="-90" y="-16" width="180" height="32" fill="#fff" stroke="${OL}" stroke-width="4" transform="rotate(30)"/><rect x="-90" y="-16" width="180" height="32" fill="#fff" stroke="${OL}" stroke-width="4" transform="rotate(-30)"/></g>`);
    s += `<path d="M${rx - 50} 790 L${rx - 70} 1080 M${rx + 50} 790 L${rx + 70} 1080" stroke="#6b6b6b" stroke-width="16"/><path d="M${rx - 50} 790 L${rx - 70} 1080 M${rx + 50} 790 L${rx + 70} 1080" stroke="#c9ced8" stroke-width="6"/>`;
  }
  const s2 = fg(W('s3g', 'drove') + .9, 1500);
  if (s2 > -500 && s2 < 2400) s += G(`translate(${s2},790)`, `<rect x="-10" y="-280" width="20" height="280" fill="#888" stroke="${OL}" stroke-width="4"/><rect x="190" y="-280" width="20" height="280" fill="#888" stroke="${OL}" stroke-width="4"/><rect x="-60" y="-470" width="320" height="210" rx="14" fill="#1d4fa8" stroke="#fff" stroke-width="6"/>` +
    txt(100, -420, 'WATTLEBROOK', 34, '#fff', { stroke: 0 }) + txt(100, -378, 'REST AREA', 34, '#fff', { stroke: 0 }) + txt(30, -300, 'P', 56, '#fff', { stroke: 0 }) + txt(220, -300, '➜', 50, '#fff', { stroke: 0 }));
  const bump = [E.jolt, E.jolt + .25].reduce((a, h) => a + (t > h ? 16 * Math.exp(-(t - h) * 5) * Math.abs(Math.sin((t - h) * 22)) : 0), 0);
  s += G(`translate(300,${878 - bump})`, truckSide(t, { dist: d, shift: eout(prog(t, E.jolt + .05, .35)), loose: prog(t, E.jolt + .1, .6), driver: { blink: blinkAt(t), expr: t > E.jolt && t < E.jolt + 1.5 ? 'shock' : 'happy' } }));
  s += burst(1150, 300, t < E.jolt + 1.6 ? pop(t, E.jolt) : 0, 'JOLT!', COL.yellow, -8, 90);
  s += bubble(1290, 300, 460, 130, ['Huh? Just a bump…'], t < C('s3g') ? pop(t, W('s3f', 'register') - .4) : 0, [-110, 160], 40, true);
  s += popAt(640, 140, t < C('s3h') ? pop(t, W('s3f', 'hadn')) : 0, `<rect x="-420" y="-80" width="840" height="160" rx="24" fill="${COL.red}" stroke="${OL}" stroke-width="7"/>` + txt(0, -8, 'NOT TOLD ABOUT THE CROSSING', 46, '#fff') + txt(0, 46, '…or any other hazards', 36, '#fff', { font: 'Fredoka', stroke: 0, weight: 700 }), -2);
  s += popAt(720, 300, t < C('s3h') ? pop(t, W('s3g', 'past')) : 0, `<rect x="-250" y="-50" width="500" height="100" rx="20" fill="${COL.navy}" stroke="${OL}" stroke-width="6"/>` + txt(0, 20, '…DRIVES PAST!', 50, '#fff'), -4);
  s += popAt(960, 260, pop(t, C('s3h')), `<rect x="-480" y="-130" width="960" height="260" rx="26" fill="#fff" stroke="${OL}" stroke-width="8"/>` + txt(0, -56, 'SITE ACCESS', 60, COL.navy, { stroke: 0 }) +
    txt(-120, 22, 'Considered', 46, OL, { font: 'Fredoka', stroke: 0, weight: 700 }) + txt(-120, 92, 'For oversize loads', 46, OL, { font: 'Fredoka', stroke: 0, weight: 700 }));
  s += tick(1220 + 0, 260 + 6, pop(t, W('s3h', 'considered'))) + cross(1220 + 0, 260 + 76, pop(t, W('s3h', 'oversize')));
  return s + rain(t, 60, .2);
}
function sFell(t) {
  let s = crashWorld(t);
  s += burst(1560, 860, t < E.fall + 3 ? pop(t, E.fall + .75) : 0, 'CRUNCH!', COL.orange, 6, 80);
  s += burst(1200, 880, t < E.scrape + 2.5 ? pop(t, E.scrape) : 0, 'SCRAPE!', COL.yellow, -6, 70);
  [['MEDIAN BARRIER DAMAGED', 'damaging'], ['ONCOMING LANE BLOCKED', 'blocking'], ['SCHOOL BUS STRUCK', 'striking']].forEach(([lab, w], i) =>
    s += chip(1500, 70 + i * 100, pop(t, W('s3i', w) - .1), lab, COL.red, 680, 42, i % 2 ? 1.5 : -1.5));
  return s;
}
function sEnd(t) {
  const sc = SC.end, l = t - sc.start;
  let s = `<rect width="1920" height="1080" fill="#151a33"/><ellipse cx="960" cy="520" rx="${700 + Math.sin(l) * 20}" ry="440" fill="#26315c"/>`;
  s += popAt(960, 330, pop(t, sc.start + .3), txt(0, 0, 'THE OVERPASS', 150, COL.yellow));
  s += popAt(960, 450, pop(t, sc.start + .8), txt(0, 0, 'Episode 2: Unpacking the Incident', 54, '#fff', { font: 'Fredoka', stroke: 0, weight: 700 }));
  s += popAt(960, 620, pop(t, W('m_end', 'continued')), `<rect x="-470" y="-70" width="940" height="140" rx="30" fill="${COL.red}" stroke="${OL}" stroke-width="8"/>` + txt(0, 26, 'TO BE CONTINUED…', 84, '#fff'), Math.sin(l * 3) * 2);
  s += op(clamp((t - CE('m_end')) * 2), txt(960, 760, 'A joint production by SARTA • the NHVR • KJK Legal', 36, '#cfd6ea', { font: 'Fredoka', stroke: 0 }) + txt(960, 810, 'The scenario and characters are fictional.', 30, '#9aa4c0', { font: 'Fredoka', stroke: 0 }));
  ['vince', 'aryav', 'rachel', 'mick', 'angelo', 'steve'].forEach((k, i) => s += popAt(260 + i * 280, 1010, pop(t, sc.start + .5 + i * .12), G('scale(.42)', person(CHARS[k], { pose: 'wave', t: t + i, blink: blinkAt(t, i) }))));
  return s;
}

const RENDER = {
  title: sTitle, open: sOpen, menti1: t => mentiScene('menti1', t), reveal: sReveal, unpack: sUnpack, stage1: sStage1, vince: sVince,
  menti2: t => mentiScene('menti2', t), menti3: t => mentiScene('menti3', t), tight: sTight, stage2: sStage2, rachel1: sRachel1,
  aryav: sAryav, mick: sMick, rachel2: sRachel2, rail: sRail, menti4: t => mentiScene('menti4', t), stage3: sStage3, loading: sLoading,
  morning: sMorning, journey: sJourney, fell: sFell, menti5: t => mentiScene('menti5', t), end: sEnd,
};
