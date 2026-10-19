// The Overpass, Episode 1: scene renderers. Each returns SVG markup for global time t.

const SC = Object.fromEntries(TL.scenes.map(s => [s.name, s]));
const skyGrad = (id, a, b) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;

// ===================== the crash world (top-down) =====================
const CW = { outer: 320, inner: 420, wbInner: 552, wbOuter: 652, barrier: 486 };
function truckFront(T) {
  const B = E.brake;
  return T < B ? 900 + 320 * (T - B) : 900 + 260 * (1 - Math.exp(-(T - B) * 1.6));
}
function carPos(T) {
  const K = E.carCut, xf = truckFront(T);
  let x;
  if (T < K - 1.6) x = xf - 90 - 420 * (K - 1.6 - T);
  else if (T < K + .6) x = xf + 90 + 180 * (T - (K - .6));
  else x = xf + 90 + 180 * 1.2 + 180 * (T - (K + .6)) + 420 * (T - (K + .6)) ** 2;
  const y = lerp(CW.inner, CW.outer, eio(prog(T, K - .1, .6)));
  return [x, y];
}
const TRUSS_END = { x: 1420, y: 470, a: 27 };
function trussPose(T) {
  const F = E.fall, B = E.brake;
  const lurch = eout(prog(T, B + .3, .5));
  const xf = truckFront(Math.min(T, F));
  const sx = xf - 335 - 60 + 40 * lurch, sy = CW.outer + 4 * lurch, sa = 4 * lurch;
  const p = prog(T, F, 1.3);
  const e = eio(p);
  const bounce = p >= 1 ? 0 : Math.sin(p * Math.PI);
  return { x: lerp(sx, TRUSS_END.x, e), y: lerp(sy, TRUSS_END.y, e) - 30 * bounce, a: lerp(sa, TRUSS_END.a, e), lift: bounce, falling: p > 0 && p < 1 };
}
function busPose(T) {
  const u = T - E.busEnter, U = E.busStop - E.busEnter, u1 = 1.9;
  if (u < 0) return null;
  const a = 520 / (U - u1);
  const uu = Math.min(u, U);
  const D = 520 * uu - .5 * a * Math.max(0, uu - u1) ** 2;
  const x = 2400 - D + 160;
  const ls = eio(prog(T, E.swerve, .55));
  const y = lerp(CW.wbInner, CW.wbOuter, ls) + 6 * Math.sin(Math.PI * prog(T, E.swerve + .5, .5));
  const yaw = -9 * Math.sin(Math.PI * prog(T, E.swerve, .9));
  return { x, y, yaw };
}

function crashWorld(T, o = {}) {
  let s = `<rect width="1920" height="1080" fill="#79b86a"/>`;
  // verges & houses
  for (let i = 0; i < 9; i++) s += house(120 + i * 230, 190, ['#ffd9a0', '#bfe3ff', '#ffc7d1', '#d6f5c4'][i % 4], .75);
  for (let i = 0; i < 10; i++) s += tree(30 + i * 230 + 110, 250, .5, i % 2 ? '#5bb85b' : '#4aa04a');
  s += `<rect x="0" y="262" width="1920" height="448" fill="#4a4f5c"/>`;
  s += `<rect x="0" y="262" width="1920" height="448" fill="url(#wet)" opacity=".25"/>`;
  s += `<path d="M0 270 H1920 M0 702 H1920" stroke="#fff" stroke-width="5"/>`;
  s += `<path d="M0 370 H1920 M0 602 H1920" stroke="#fff" stroke-width="5" stroke-dasharray="50 40"/>`;
  // school verge bottom
  s += `<rect x="0" y="710" width="1920" height="370" fill="#83c473"/><rect x="0" y="712" width="1920" height="26" fill="#cfcfcf" stroke="${OL}" stroke-width="3"/>`;
  s += G('translate(520,800)', `<rect x="-115" y="-30" width="230" height="60" rx="8" fill="${COL.yellow}" stroke="${OL}" stroke-width="5"/>` + txt(0, 12, 'SCHOOL 400 m', 22, OL, { font: 'Fredoka', stroke: 0, weight: 700 }));
  for (let i = 0; i < 4; i++) s += tree(700 + i * 330, 900, .55, '#4aa04a');
  // median barrier with deformation
  const hit = eout(prog(T, E.fall + .75, .25));
  let bp = '';
  for (let x = 0; x <= 1920; x += 20) {
    const d = hit * 44 * Math.exp(-(((x - 1440) / 95) ** 2));
    bp += `${x},${(CW.barrier + d).toFixed(1)} `;
  }
  s += `<polyline points="${bp}" fill="none" stroke="${OL}" stroke-width="18" stroke-linejoin="round"/><polyline points="${bp}" fill="none" stroke="#c9ced8" stroke-width="10" stroke-linejoin="round"/>`;
  // skid marks
  if (T > E.brake) {
    const x0 = truckFront(E.brake) - 650, x1 = truckFront(T) - 650;
    s += `<path d="M${x0} ${CW.outer - 30} L${x1} ${CW.outer - 30} M${x0} ${CW.outer + 30} L${x1} ${CW.outer + 30}" stroke="#222" stroke-width="12" opacity=".5"/>`;
  }
  // westbound early traffic
  for (let i = 0; i < 3; i++) {
    const x = 2100 - 560 * (T - (SC.crash.start - .5 + i * 1.3));
    if (x > -150 && x < 2100 && T < E.fall) s += G(`translate(${x},${i % 2 ? CW.wbOuter : CW.wbInner}) rotate(180)`, carTop(['#3d8bfd', '#ffd23f', '#9b5de5'][i]));
  }
  // truck
  const xf = truckFront(Math.min(T, E.fall + 2));
  s += G(`translate(${xf - 335},${CW.outer})`, truckTop({ brake: T > E.brake }));
  // car
  const [cx, cy] = carPos(T);
  if (cx < 2100 && T > SC.crash.start - 3) s += G(`translate(${cx},${cy}) rotate(${-14 * Math.sin(Math.PI * prog(T, E.carCut - .1, .6))})`, carTop('#e63946'));
  // truss
  const tp = trussPose(T);
  if (tp.lift > 0) s += G(`translate(${tp.x + 18 * tp.lift},${tp.y + 30 * tp.lift}) rotate(${tp.a})`, `<rect x="-240" y="-36" width="480" height="72" rx="20" fill="#000" opacity=".25"/>`);
  s += G(`translate(${tp.x},${tp.y}) rotate(${tp.a}) scale(${1 + .15 * tp.lift})`, trussTop());
  // dust puff on impact
  const dp = prog(T, E.fall + .75, 1.2);
  if (dp > 0 && dp < 1) for (let i = 0; i < 8; i++) {
    const a = i / 8 * 6.28;
    s += `<circle cx="${1440 + Math.cos(a) * 120 * dp}" cy="${CW.barrier + Math.sin(a) * 60 * dp}" r="${30 * (1 - dp) + 10}" fill="#ddd" opacity="${.8 * (1 - dp)}"/>`;
  }
  // bus
  const bp2 = busPose(T);
  if (bp2) {
    s += G(`translate(${bp2.x},${bp2.y}) rotate(${bp2.yaw})`, busTop());
    const sp = prog(T, E.scrape, 1.0);
    if (sp > 0 && sp < 1) {
      let sparks = '';
      for (let i = 0; i < 16; i++) {
        const a = -2.2 + rnd(i + Math.floor(T * 25)) * 1.6, r = 30 + rnd(i * 3 + Math.floor(T * 25)) * 110;
        sparks += `M1612 600 l${(Math.cos(a) * r).toFixed(0)} ${(Math.sin(a) * r).toFixed(0)} `;
      }
      s += `<path d="${sparks}" stroke="${COL.yellow}" stroke-width="6" stroke-linecap="round"/><path d="${sparks}" stroke="#fff" stroke-width="2"/>`;
    }
    const gp = prog(T, E.scrape + .3, 1.4);
    if (gp > 0 && gp < 1) {
      let gl = '';
      for (let i = 0; i < 14; i++) {
        const gx = 1450 + rnd(i) * 260 - 150 * gp - 80, gy = 600 + rnd(i + 9) * 40 + 80 * gp * rnd(i + 2);
        gl += `<path d="M${gx} ${gy} l10 -8 l6 12 z" fill="#d6f1ff" stroke="#7fb2d6" stroke-width="2" opacity="${1 - gp}"/>`;
      }
      s += gl;
    }
  }
  if (o.police) {
    s += G(`translate(1760,${CW.inner})`, policeTop(T)) + G(`translate(960,${CW.wbInner})`, policeTop(T + .3));
    for (let i = 0; i < 6; i++) s += cone(1240 + i * 70, 470 - (i % 2) * 120 + 40, .6);
  }
  return skyGrad('wet', '#9fb4c8', '#4a4f5c') + s;
}
const nested = (x, y, w, h, vb, inner) => `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${vb}" preserveAspectRatio="xMidYMid slice">${inner}</svg>`;

// ===================== scenes =====================
function sTitle(t) {
  const l = t - SC.title.start;
  let s = skyGrad('tsky', '#7fd0ff', '#d9f3ff') + `<rect width="1920" height="1080" fill="url(#tsky)"/>`;
  s += `<circle cx="1650" cy="200" r="110" fill="${COL.yellow}" stroke="${OL}" stroke-width="7"/>`;
  s += cloud(300 + l * 20, 180, .9) + cloud(1100 - l * 15, 120, .7) + cloud(1500 + l * 10, 330, .6);
  s += `<path d="M0 760 Q300 600 640 720 Q1000 590 1340 720 Q1640 620 1920 700 L1920 1080 L0 1080 Z" fill="#8fd27e" stroke="${OL}" stroke-width="7"/>`;
  s += `<rect x="0" y="820" width="1920" height="160" fill="${COL.road}" stroke="${OL}" stroke-width="7"/><path d="M0 900 H1920" stroke="#fff" stroke-width="8" stroke-dasharray="70 50" stroke-dashoffset="${l * 300}"/>`;
  const tx = -1300 + l * 520;
  s += G(`translate(${tx},905) scale(.55)`, truckSide(l, { dist: l * 520 / .55, driver: { blink: blinkAt(l) } }));
  const tp = pop(t, SC.title.start + .5, .7);
  s += popAt(960, 330, tp, txt(0, 0, 'THE OVERPASS', 210, COL.yellow, { stroke: 30 }) + txt(0, 0, 'THE OVERPASS', 210, COL.yellow, { stroke: 0 }), Math.sin(l * 2.2) * 2);
  s += popAt(960, 450, pop(t, SC.title.start + 1.3), `<rect x="-520" y="-46" width="1040" height="80" rx="40" fill="${COL.navy}" stroke="${OL}" stroke-width="6"/>` + txt(0, 12, 'A hypothetical on the amended HVNL', 46, '#fff', { font: 'Fredoka', stroke: 0 }));
  s += popAt(960, 560, pop(t, SC.title.start + 2), `<rect x="-300" y="-44" width="600" height="80" rx="16" fill="${COL.red}" stroke="${OL}" stroke-width="6"/>` + txt(0, 18, 'EPISODE 1: THE INCIDENT', 46, '#fff'), -3);
  s += op(clamp((l - 2.8) * 2), txt(960, 1050, 'SARTA  •  NHVR  •  KJK LEGAL', 34, '#fff', { font: 'Fredoka', stroke: 6, weight: 700 }));
  return s;
}

function iconTruck(kind) {
  const st = `stroke="${OL}" stroke-width="6" stroke-linejoin="round"`;
  let s = `<ellipse cx="0" cy="62" rx="150" ry="10" fill="#000" opacity=".15"/>`;
  const w = (x) => `<circle cx="${x}" cy="44" r="20" fill="#2a2d36" ${st}/><circle cx="${x}" cy="44" r="8" fill="#ccc"/>`;
  s += `<path d="M70 40 L70 -50 L120 -50 L140 -10 L140 40 Z" fill="${COL.orange}" ${st}/><rect x="96" y="-40" width="30" height="26" fill="#bfe6ff" ${st}/>`;
  if (kind === 'freight') s += `<rect x="-140" y="-70" width="204" height="110" rx="6" fill="#fff" ${st}/>` + txt(-38, -2, 'FREIGHT', 30, COL.navy, { stroke: 0 });
  if (kind === 'tanker') s += `<rect x="-150" y="-60" width="214" height="90" rx="45" fill="#d9dee8" ${st}/><path d="M-120 -15 h150" stroke="${COL.red}" stroke-width="10"/>`;
  if (kind === 'osom') s += `<rect x="-160" y="10" width="226" height="22" fill="#666" ${st}/><path d="M-170 10 L-120 -80 L20 -80 L66 10 Z" fill="#9db7d6" ${st}/><rect x="-130" y="-22" width="150" height="34" fill="${COL.yellow}" ${st}/>` + txt(-55, 5, 'OVERSIZE', 24, OL, { stroke: 0 });
  if (kind === 'other') s += `<rect x="-140" y="-70" width="204" height="110" rx="6" fill="${COL.teal}" ${st}/>` + txt(-38, 10, '?', 80, '#fff', { stroke: 8 });
  s += w(-100) + w(-40) + w(110);
  return s;
}

function sIntro(t) {
  const l = t - SC.intro.start;
  let s = sunburst(500, 600, l, '#ffe9b8', '#ffdc8a');
  s += `<rect x="0" y="880" width="1920" height="200" fill="#f2b950" stroke="${OL}" stroke-width="7"/>`;
  s += G('translate(470,540) scale(1.3)', person(CHARS.mod, { full: true, pose: 'mic', mouth: mouth('mod', t), blink: blinkAt(t), t }));
  s += G('translate(470,110)', `<rect x="-170" y="-40" width="340" height="70" rx="14" fill="${COL.navy}" stroke="${OL}" stroke-width="6"/>` + txt(0, 12, 'MODERATOR', 40, COL.yellow, { stroke: 0 }));
  const X = 1300;
  // intro1
  const v1 = fadeIO(t, C('m_intro1'), C('m_intro2') - .1);
  s += op(v1, card(X, 380, 860, 300, '#fff', `
      <g transform="translate(-300,0)"><rect x="-80" y="-100" width="160" height="200" rx="12" fill="${COL.navy}" stroke="${OL}" stroke-width="6"/><rect x="-62" y="-84" width="124" height="168" rx="6" fill="#fff" opacity=".1"/>` + txt(0, -16, 'HVNL', 46, COL.yellow, { stroke: 0 }) + txt(0, 34, 'AMENDED', 22, '#fff', { font: 'Fredoka', stroke: 0 }) + `</g>` +
      txt(90, -40, 'HOW THE AMENDED', 48, OL, { stroke: 0 }) + txt(90, 20, 'HVNL WILL OPERATE', 56, COL.orange, { stroke: 8 }) + txt(90, 80, 'a hypothetical scenario', 32, '#666', { font: 'Fredoka', stroke: 0 }),
    pop(t, C('m_intro1') + .2)));
  s += op(v1, popAt(X, 680, pop(t, W('m_intro1', 'consider')), `<rect x="-420" y="-60" width="840" height="120" rx="60" fill="${COL.teal}" stroke="${OL}" stroke-width="6"/>` + txt(0, 16, 'What should YOU consider?', 50, '#fff')));
  // intro2
  const v2 = fadeIO(t, C('m_intro2'), C('m_intro3') - .1);
  s += op(v2, stamp(X, 340, prog(t, W('m_intro2', 'fictional') - .1, .8), ['SCENARIO & CHARACTERS', 'ARE FICTIONAL'], COL.red, -6, 54, 820));
  s += op(v2, stamp(X, 640, prog(t, W('m_intro2', 'probably') - .1, .8), ['YOUR OPERATION', 'PROBABLY DIFFERS'], COL.navy, 5, 54, 720));
  // intro3
  const v3 = fadeIO(t, C('m_intro3'), C('m_intro4') - .1);
  s += op(v3, popAt(X, 200, pop(t, W('m_intro3', 'legal')), `<rect x="-470" y="-80" width="940" height="160" rx="24" fill="${COL.red}" stroke="${OL}" stroke-width="7"/>` + txt(0, -10, 'SAME LEGAL OBLIGATIONS', 60, '#fff') + txt(0, 50, '& RESPONSIBILITIES', 44, COL.yellow)));
  s += op(v3, popAt(X, 360, pop(t, W('m_intro3', 'size')), txt(0, 0, 'regardless of SIZE & NATURE of your operation', 40, OL, { font: 'Fredoka', stroke: 0, weight: 700 })));
  const kinds = [['freight', 'GENERAL FREIGHT', 'general'], ['tanker', 'TANKERS', 'tankers'], ['osom', 'OSOM', 'oh'], ['other', 'ANY OTHER', 'any']];
  kinds.forEach(([k, lab, w], i) => {
    const x = X - 450 + i * 300, y = 590;
    s += op(v3, popAt(x, y, pop(t, W('m_intro3', w)), `<rect x="-135" y="-140" width="270" height="290" rx="24" fill="#fff" stroke="${OL}" stroke-width="6"/>` + G('translate(0,-20) scale(.75)', iconTruck(k)) + txt(0, 110, lab, 32, COL.navy, { stroke: 0 }), (i - 1.5) * 3));
  });
  // intro4
  const v4 = fadeIO(t, C('m_intro4'), SC.intro.end + 1);
  const bulb = `<circle cx="0" cy="-40" r="110" fill="${COL.yellow}" stroke="${OL}" stroke-width="8"/><rect x="-50" y="60" width="100" height="70" rx="10" fill="#bbb" stroke="${OL}" stroke-width="7"/><path d="M-30 -40 Q0 -100 30 -40" stroke="${OL}" stroke-width="7" fill="none"/>`;
  let rays = '';
  for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28 + l; rays += `M${Math.cos(a) * 140} ${-40 + Math.sin(a) * 140} L${Math.cos(a) * 180} ${-40 + Math.sin(a) * 180} `; }
  s += op(v4, popAt(X, 330, pop(t, C('m_intro4')), `<path d="${rays}" stroke="${OL}" stroke-width="10" stroke-linecap="round"/>` + bulb, Math.sin(l * 3) * 4));
  s += op(v4, popAt(X, 640, pop(t, W('m_intro4', 'think')), `<rect x="-470" y="-100" width="940" height="200" rx="30" fill="${COL.navy}" stroke="${OL}" stroke-width="7"/>` + txt(0, -20, 'THINK: HOW COULD THIS', 56, '#fff') + txt(0, 54, 'APPLY TO YOUR OPERATION?', 56, COL.yellow)));
  return s;
}

function sProject(t) {
  const l = t - SC.project.start;
  let s = `<rect width="1920" height="1080" fill="#8fd27e"/>`;
  // housing estate (top)
  s += `<rect x="0" y="0" width="1920" height="400" fill="#a5dc8f"/>`;
  for (let r = 0; r < 2; r++) for (let i = 0; i < 9; i++) s += house(110 + i * 210 + r * 100, 170 + r * 170, ['#ffd9a0', '#bfe3ff', '#ffc7d1', '#d6f5c4', '#fff1a8'][(i + r) % 5], .9);
  s += popAt(380, 60, pop(t, SC.project.start + .8), `<rect x="-200" y="-36" width="400" height="66" rx="14" fill="#fff" stroke="${OL}" stroke-width="5"/>` + txt(0, 12, 'HOUSING ESTATE', 36, COL.navy, { stroke: 0 }));
  // highway
  s += `<rect x="0" y="420" width="1920" height="260" fill="${COL.road}" stroke="${OL}" stroke-width="6"/><path d="M0 550 H1920" stroke="#c9ced8" stroke-width="14"/><path d="M0 485 H1920 M0 615 H1920" stroke="#fff" stroke-width="5" stroke-dasharray="50 40"/>`;
  s += txt(300, 560, 'BARRAPINYA HWY', 30, '#fff', { stroke: 0, extra: 'opacity=".7"' });
  // traffic
  for (let i = 0; i < 9; i++) {
    const top = i % 2 === 0, sp = 260 + rnd(i) * 120;
    const lane = top ? (i % 4 === 0 ? 455 : 515) : (i % 4 === 1 ? 585 : 645);
    let x = ((rnd(i + 4) * 2400 + sp * l) % 2400) - 240;
    if (!top) x = 1920 - x;
    const veh = i % 3 === 0 ? G('scale(.6)', busTop()) : carTop(['#e63946', '#3d8bfd', '#9b5de5', '#f4a261', '#2a9d8f'][i % 5]);
    s += G(`translate(${x},${lane}) rotate(${top ? 0 : 180}) scale(.75)`, veh);
  }
  // school (bottom)
  s += `<rect x="0" y="690" width="1920" height="390" fill="#8fd27e"/>`;
  const st = `stroke="${OL}" stroke-width="6" stroke-linejoin="round"`;
  s += G('translate(1260,960)', `<rect x="-330" y="-180" width="660" height="180" fill="#ffcf8a" ${st}/><path d="M-360 -176 L0 -250 L360 -176 Z" fill="${COL.red}" ${st}/>` +
    [-250, -130, 130, 250].map(x => `<rect x="${x - 40}" y="-140" width="80" height="60" fill="#bfe6ff" ${st}/>`).join('') +
    `<rect x="-50" y="-110" width="100" height="110" fill="#8b5a2b" ${st}/><path d="M400 0 L400 -260" stroke="${OL}" stroke-width="8"/><path d="M400 -260 Q440 ${-250 + Math.sin(l * 5) * 8} 480 -240 L480 -200 Q440 ${-210 + Math.sin(l * 5 + 1) * 8} 400 -220 Z" fill="${COL.teal}" ${st}/>`);
  s += popAt(1260, 760, pop(t, W('m_proj1', 'Wattlebrook')), `<rect x="-330" y="-40" width="660" height="76" rx="14" fill="${COL.navy}" stroke="${OL}" stroke-width="5"/>` + txt(0, 14, 'WATTLEBROOK PRIMARY SCHOOL', 40, COL.yellow, { stroke: 0 }));
  // overpass
  const bp = eout(prog(t, W('m_proj1', 'overpass') - .3, 1.4));
  if (bp > 0) {
    const y0 = 380, y1 = lerp(380, 720, bp);
    s += `<rect x="900" y="${y0}" width="120" height="${y1 - y0}" fill="#e7e2d6" stroke="${OL}" stroke-width="6"/><path d="M915 ${y0} V${y1} M1005 ${y0} V${y1}" stroke="${COL.teal}" stroke-width="8"/>`;
    s += popAt(1180, 440, pop(t, W('m_proj1', 'overpass') + .6), `<rect x="-190" y="-40" width="380" height="80" rx="40" fill="${COL.teal}" stroke="${OL}" stroke-width="6"/>` + txt(0, 14, 'NEW OVERPASS', 40, '#fff'), -4);
  }
  // pedestrians
  for (let i = 0; i < 10; i++) {
    const x = ((rnd(i) * 1900 + l * (40 + rnd(i + 1) * 30) * (i % 2 ? 1 : -1)) % 1900 + 1900) % 1900;
    const y = i % 2 ? 405 : 700;
    s += G(`translate(${x},${y + Math.abs(Math.sin(l * 8 + i)) * -6}) scale(${i % 3 ? .14 : .2})`, head(CHARS[['kid1', 'kid2', 'kid3', 'mod', 'rachel'][i % 5]], { expr: 'grin' }));
  }
  const p2 = C('m_proj2');
  s += popAt(650, 820, pop(t, W('m_proj2', 'hundreds')), `<rect x="-330" y="-70" width="660" height="140" rx="24" fill="#fff" stroke="${OL}" stroke-width="6"/>` + txt(0, -12, 'HUNDREDS OF PARENTS,', 40, COL.navy, { stroke: 0 }) + txt(0, 40, 'pedestrians & children', 36, '#555', { font: 'Fredoka', stroke: 0 }), -2);
  s += popAt(1500, 330, pop(t, W('m_proj2', 'buses')), `<rect x="-300" y="-60" width="600" height="120" rx="24" fill="${COL.yellow}" stroke="${OL}" stroke-width="6"/>` + txt(0, -6, 'SCHOOL BUSES', 44, OL, { stroke: 0 }) + txt(0, 38, 'every school day', 32, OL, { font: 'Fredoka', stroke: 0 }), 3);
  const vis = pop(t, W('m_proj2', 'visibility') - .4);
  s += popAt(960, 230, vis, `<rect x="-470" y="-75" width="940" height="150" rx="75" fill="${COL.red}" stroke="${OL}" stroke-width="8"/>` +
    `<g transform="translate(-370,0)"><ellipse rx="56" ry="34" fill="#fff" stroke="${OL}" stroke-width="6"/><circle r="20" fill="${OL}"/><circle cx="6" cy="-6" r="6" fill="#fff"/></g>` + txt(50, 20, 'HIGH COMMUNITY VISIBILITY', 52, '#fff'));
  return s;
}

function sFreight(t) {
  const l = t - SC.freight.start;
  let s = sunburst(700, 700, l, '#bff0e8', '#a6e6dc');
  s += popAt(960, 70, pop(t, SC.freight.start + .3), `<rect x="-330" y="-46" width="660" height="92" rx="20" fill="${COL.navy}" stroke="${OL}" stroke-width="6"/>` + txt(0, 20, 'THE FREIGHT TASK', 60, COL.yellow));
  // route strip
  const rp = eout(prog(t, C('m_frt1') + 1.5, 2.5));
  const rx0 = 260, rx1 = 1660, ry = 200;
  s += popAt(0, 0, pop(t, C('m_frt1') + .8) > 0 ? 1 : 0,
    `<path d="M${rx0} ${ry} C700 120 1100 300 ${rx1} ${ry}" stroke="${OL}" stroke-width="16" fill="none"/><path d="M${rx0} ${ry} C700 120 1100 300 ${rx1} ${ry}" stroke="#fff" stroke-width="8" fill="none" stroke-dasharray="26 18"/>` +
    G(`translate(${rx0},${ry})`, `<rect x="-90" y="-50" width="180" height="100" rx="12" fill="#8a94a8" stroke="${OL}" stroke-width="6"/><rect x="40" y="-100" width="30" height="60" fill="#8a94a8" stroke="${OL}" stroke-width="6"/>` + txt(0, 12, 'IRONCLAD', 30, '#fff', { stroke: 0 })) +
    G(`translate(${rx1},${ry})`, `<rect x="-90" y="-50" width="180" height="100" rx="12" fill="${COL.yellow}" stroke="${OL}" stroke-width="6"/>` + txt(0, 12, 'SITE', 38, OL, { stroke: 0 })));
  if (rp > 0) {
    // cubic bezier point for the little truck
    const u = rp, P = [[rx0, ry], [700, 120], [1100, 300], [rx1, ry]];
    const b = (k) => (1 - u) ** 3 * P[0][k] + 3 * (1 - u) ** 2 * u * P[1][k] + 3 * (1 - u) * u * u * P[2][k] + u ** 3 * P[3][k];
    s += G(`translate(${b(0)},${b(1) - 30}) scale(.22)`, truckSide(l, { dist: l * 400 }));
    s += popAt(960, 300, pop(t, W('m_frt1', 'five')), `<rect x="-130" y="-40" width="260" height="80" rx="40" fill="${COL.red}" stroke="${OL}" stroke-width="6"/>` + txt(0, 18, '520 KM', 50, '#fff'));
  }
  // the big truck
  const glow = .5 + .5 * Math.sin(l * 6);
  const hl = t > C('m_frt2') && t < CE('m_frt2') + .4 ? glow * .7 : 0;
  s += G('translate(150,950) scale(.95)', truckSide(l, { driver: { blink: blinkAt(t) }, glow: hl }));
  s += popAt(300, 470, pop(t, W('m_frt1', 'twenty')), `<path d="M0 -60 L0 30" stroke="${OL}" stroke-width="6"/><circle cx="0" cy="-70" r="12" fill="${OL}"/><path d="M-90 30 L90 30 L110 120 L-110 120 Z" fill="#5a6175" stroke="${OL}" stroke-width="7"/>` + txt(0, 100, '20 t', 60, COL.yellow), Math.sin(l * 2) * 4);
  // callouts
  const items = [['IRREGULAR & CONTORTED', 'irregular'], ["DOESN'T SIT FLAT", 'doesn'], ['OFFSET, HIGH CENTRE', 'offset', 'OF GRAVITY'], ['NO OBVIOUS TIE-DOWN', 'no', 'POINTS']];
  items.forEach(([a, w, b], i) => {
    const y = 360 + i * 125;
    s += popAt(1560, y, pop(t, W('m_frt2', w)), `<rect x="-300" y="-52" width="600" height="104" rx="20" fill="#fff" stroke="${OL}" stroke-width="6"/><circle cx="-250" cy="0" r="30" fill="${COL.orange}" stroke="${OL}" stroke-width="5"/>` + txt(-250, 13, '!', 40, '#fff', { stroke: 0 }) +
      txt(30, b ? -6 : 12, a, b ? 34 : 38, OL, { stroke: 0 }) + (b ? txt(30, 34, b, 34, OL, { stroke: 0 }) : ''));
  });
  // centre of gravity marker
  const cg = pop(t, W('m_frt2', 'offset'));
  s += popAt(150 + .95 * (70 + 400), 950 + .95 * (-86 - 230), cg, `<circle r="36" fill="#fff" stroke="${OL}" stroke-width="6"/><path d="M0 -36 A36 36 0 0 1 36 0 L0 0 Z M0 36 A36 36 0 0 1 -36 0 L0 0 Z" fill="${OL}"/>` + txt(0, -54, 'CoG', 34, COL.red, { stroke: 6, strokeCol: '#fff' }));
  const qp = pop(t, W('m_frt2', 'tie'));
  [[230, -230], [380, -270], [560, -120], [90, -150]].forEach(([x, y], i) =>
    s += popAt(150 + .95 * (70 + x), 950 + .95 * (-86 + y) - 40, qp * (1 + .1 * Math.sin(l * 8 + i)), txt(0, 0, '?', 70, COL.yellow, { stroke: 10 })));
  s += stamp(960, 560, prog(t, W('m_frt3', 'tailored') - .1, .8), ['CUSTOM-BUILT: NEEDS A', 'TAILORED RESTRAINT SOLUTION'], COL.red, -5, 60, 1120);
  return s;
}

function companyIcon(k, l) {
  const st = `stroke="${OL}" stroke-width="7" stroke-linejoin="round"`;
  if (k === 0) {
    let sp = '';
    for (let i = 0; i < 6; i++) { const a = -1.2 + i * .3 + Math.sin(l * 10 + i) * .1; sp += `M70 40 l${Math.cos(a) * 60} ${Math.sin(a) * 60} `; }
    return `<path d="M-110 -70 H110 V-40 H20 V40 H110 V70 H-110 V40 H-20 V-40 H-110 Z" fill="#8a94a8" ${st}/><path d="${sp}" stroke="${COL.yellow}" stroke-width="6" stroke-linecap="round"/>`;
  }
  if (k === 1) return `<path d="M-60 90 L-60 -90 L-30 -90 L-30 90 Z" fill="${COL.yellow}" ${st}/><path d="M-110 -90 L130 -90 L130 -70 L-110 -70 Z" fill="${COL.yellow}" ${st}/><path d="M${100} -70 L100 ${-10 + Math.sin(l * 2) * 10}" stroke="${OL}" stroke-width="4"/><rect x="80" y="${-10 + Math.sin(l * 2) * 10}" width="40" height="30" fill="${COL.truss}" ${st}/><rect x="-90" y="-70" width="40" height="40" fill="#555" ${st}/>`;
  return G('translate(-140,70) scale(.25)', truckSide(l, { dist: l * 100 }));
}
function sCompanies(t) {
  const l = t - SC.companies.start;
  let s = sunburst(960, 560, l, '#ffe0c2', '#ffd1a6');
  s += popAt(960, 90, pop(t, W('m_co', 'companies') - .3), `<rect x="-330" y="-50" width="660" height="100" rx="20" fill="${COL.navy}" stroke="${OL}" stroke-width="6"/>` + txt(0, 22, 'THE COMPANIES', 64, COL.yellow));
  const cos = [
    ['IRONCLAD STEEL', 'FABRICATION PTY LTD', ['Large steel fabrication', 'manufacturer'], '#c9d3e6', 'Ironclad'],
    ['MERIDIAN', 'CONSTRUCTION GROUP', ['Principal contractor', 'for the overpass build'], '#cdeec6', 'Meridian'],
    ['OUTBACK HEAVY', 'HAULAGE PTY LTD', ['Operator engaged to', 'transport the truss'], '#ffd7ae', 'Outback'],
  ];
  cos.forEach(([n1, n2, d, col, w], i) => {
    const x = 340 + i * 620;
    s += card(x, 540, 560, 620, col, G('translate(0,-150)', `<circle r="130" fill="#fff" stroke="${OL}" stroke-width="6"/>` + companyIcon(i, l)) +
      txt(0, 50, n1, 50, OL, { stroke: 0 }) + txt(0, 98, n2, 32, OL, { font: 'Fredoka', stroke: 0, weight: 700 }) +
      `<path d="M-200 130 H200" stroke="${OL}" stroke-width="4" stroke-dasharray="10 10"/>` +
      txt(0, 188, d[0], 34, '#333', { font: 'Fredoka', stroke: 0 }) + txt(0, 232, d[1], 34, '#333', { font: 'Fredoka', stroke: 0 }),
      pop(t, W('m_co', w) - .1), (i - 1) * 2);
  });
  return s;
}

const CAST = [
  ['vince', 'VINCE MURPHY', ['Design/Production Engineer', 'Signed off the design'], 'IRONCLAD', '#8a94a8', ['m_ch1', 'Vince']],
  ['aryav', 'ARYAV NAIR', ['Project Manager', 'for the build & the site'], 'MERIDIAN', '#4caf50', ['m_ch1', 'Aryav']],
  ['rachel', 'RACHEL WHITFIELD', ['Transport Manager'], 'OUTBACK HEAVY HAULAGE', COL.orange, ['m_ch2', 'Rachel']],
  ['mick', 'MICK DELANEY', ['Driver: 14 years’ experience', 'HC licence'], 'OUTBACK HEAVY HAULAGE', COL.orange, ['m_ch2', 'Mick']],
  ['angelo', 'ANGELO PETRAKIS', ['Wattlebrook school bus driver', 'Does the morning run'], 'SCHOOL BUS', '#e0b000', ['m_ch3', 'Angelo']],
  ['steve', 'STEVE NGUYEN', ['NHVR Investigator', 'Attends post-incident'], 'NHVR', COL.teal, ['m_ch3', 'Steve']],
];
function sCharacters(t) {
  const l = t - SC.characters.start;
  let s = sunburst(960, 540, l, '#d9ecff', '#c4e0ff');
  s += popAt(960, 70, pop(t, SC.characters.start + .2), `<rect x="-330" y="-46" width="660" height="92" rx="20" fill="${COL.navy}" stroke="${OL}" stroke-width="6"/>` + txt(0, 20, 'THE CHARACTERS', 60, COL.yellow));
  const times = CAST.map(c => W(c[5][0], c[5][1]) - .15);
  CAST.forEach(([k, name, roles, co, cc], i) => {
    const x = 330 + (i % 3) * 630, y = 320 + Math.floor(i / 3) * 400;
    const active = t >= times[i] && (i === 5 ? t < SC.characters.end : t < times[i + 1]);
    const inner = `<clipPath id="cc${i}"><rect x="-290" y="-180" width="580" height="360" rx="26"/></clipPath>` +
      (active ? `<rect x="-302" y="-192" width="604" height="384" rx="34" fill="none" stroke="${COL.yellow}" stroke-width="14"/>` : '') +
      `<g clip-path="url(#cc${i})"><circle cx="-170" cy="40" r="150" fill="${cc}" opacity=".35"/>` + G(`translate(-170,${70 + Math.sin(l * 2 + i) * 4}) scale(.62)`, person(CHARS[k], { blink: blinkAt(t, i), expr: active ? 'grin' : 'happy', pose: k === 'steve' ? 'clip' : '' })) + `</g>` +
      txt(110, -100, name, name.length > 13 ? 34 : 40, OL, { stroke: 0 }) +
      roles.map((r, j) => txt(110, -40 + j * 40, r, r.length > 24 ? 24 : 28, '#333', { font: 'Fredoka', stroke: 0 })).join('') +
      `<rect x="${110 - 150}" y="90" width="300" height="50" rx="25" fill="${cc}" stroke="${OL}" stroke-width="4"/>` + txt(110, 124, co, co.length > 12 ? 20 : 28, '#fff', { font: 'Fredoka', stroke: 0, weight: 700 });
    s += card(x, y, 580, 360, '#fff', inner, pop(t, times[i]), active ? 0 : (i % 2 ? 1.5 : -1.5));
  });
  return s;
}

function sCast(t) {
  const l = t - SC.cast.start;
  let s = `<rect width="1920" height="1080" fill="#2a1840"/>`;
  // spotlights
  for (let i = 0; i < 3; i++) {
    const x = 960 + Math.sin(l * .9 + i * 2) * 600;
    s += `<path d="M${400 + i * 560} -20 L${x - 220} 900 L${x + 220} 900 Z" fill="#fff6c8" opacity=".12"/>`;
  }
  s += `<rect x="0" y="820" width="1920" height="260" fill="#8b5a2b" stroke="${OL}" stroke-width="7"/><path d="M0 860 H1920" stroke="#6b4220" stroke-width="6"/>`;
  // curtains
  const curtain = (x, dir) => {
    let p = '';
    for (let i = 0; i < 4; i++) p += `<path d="M${x + dir * i * 50} 0 Q${x + dir * (i * 50 + 25)} 400 ${x + dir * i * 50 - dir * 10} 860 L${x + dir * (i * 50 + 50)} 860 Q${x + dir * (i * 50 + 40)} 400 ${x + dir * (i * 50 + 50)} 0 Z" fill="${i % 2 ? '#c1121f' : '#a10e1a'}" stroke="${OL}" stroke-width="5"/>`;
    return p;
  };
  s += curtain(0, 1) + curtain(1920, -1);
  s += `<path d="M0 0 H1920 V90 Q1440 160 960 90 Q480 160 0 90 Z" fill="#c1121f" stroke="${OL}" stroke-width="6"/>`;
  // marquee
  let bulbs = '';
  for (let i = 0; i < 24; i++) {
    const on = (Math.floor(l * 6) + i) % 3 === 0;
    const a = i / 24;
    const bx = -520 + a * 1040;
    bulbs += `<circle cx="${bx}" cy="-120" r="10" fill="${on ? '#fff6a0' : '#a08a40'}"/><circle cx="${bx}" cy="120" r="10" fill="${on ? '#a08a40' : '#fff6a0'}"/>`;
  }
  s += popAt(960, 270, pop(t, SC.cast.start + .3), `<rect x="-560" y="-150" width="1120" height="300" rx="30" fill="${COL.navy}" stroke="${COL.yellow}" stroke-width="10"/>${bulbs}` +
    txt(0, -40, 'WORLD PREMIERE', 52, '#fff', { stroke: 0 }) + txt(0, 70, 'THE OVERPASS', 120, COL.yellow));
  s += popAt(1560, 150, pop(t, W('m_cast', 'international')), `<circle r="100" fill="${COL.red}" stroke="${OL}" stroke-width="7"/>` + txt(0, -20, 'INTER-', 30, '#fff', { stroke: 0 }) + txt(0, 14, 'NATIONAL', 30, '#fff', { stroke: 0 }) + txt(0, 48, 'CAST', 34, COL.yellow, { stroke: 0 }), 12);
  // line-up
  ['vince', 'aryav', 'rachel', 'mick', 'angelo', 'steve'].forEach((k, i) => {
    const x = 330 + i * 252, ap = E.applause;
    const bow = t > ap ? 14 * Math.sin(Math.PI * clamp((t - ap - i * .08) / 1.2)) : 0;
    const sp = pop(t, SC.cast.start + .8 + i * .2, .6);
    s += popAt(x, 870, sp, G(`rotate(${bow} 0 0)`, G('translate(0,-210) scale(.55)', person(CHARS[k], { full: true, pose: 'wave', t: t + i, blink: blinkAt(t, i), expr: 'grin' }))));
  });
  s += op(clamp((t - W('m_cast', 'joint')) * 2), `<rect x="360" y="890" width="1200" height="64" rx="32" fill="#000" opacity=".5"/>` + txt(960, 934, 'A joint production by SARTA • the NHVR • KJK Legal', 38, '#fff', { font: 'Fredoka', stroke: 0, weight: 700 }));
  // confetti
  const cp = t - E.applause;
  if (cp > 0) for (let i = 0; i < 90; i++) {
    const x = rnd(i) * 1920 + Math.sin(cp * 3 + i) * 30, y = -40 + cp * (220 + rnd(i + 1) * 260) - rnd(i + 2) * 300;
    if (y > -40 && y < 1080) s += `<rect x="${x}" y="${y}" width="16" height="26" fill="${[COL.yellow, COL.red, COL.teal, '#fff', COL.orange][i % 5]}" transform="rotate(${cp * 300 + i * 40} ${x + 8} ${y + 13})"/>`;
  }
  return s;
}

function sDrive(t) {
  const sc = SC.drive, l = t - sc.start, speed = 650, d = l * speed;
  let s = skyGrad('osky', '#8c99ab', '#c9d2dc') + `<rect width="1920" height="1080" fill="url(#osky)"/>`;
  for (let i = 0; i < 5; i++) s += cloud(((i * 520 - l * 25) % 2600 + 2600) % 2600 - 300, 110 + (i % 2) * 70, .9 + (i % 3) * .2, '#b3bcc9');
  // hills
  let hp = 'M0 700 ';
  for (let x = 0; x <= 1920; x += 40) hp += `L${x} ${620 + 50 * Math.sin((x + d * .12) / 260) + 30 * Math.sin((x + d * .12) / 110)} `;
  s += `<path d="${hp} L1920 1080 L0 1080 Z" fill="#7d9c79" stroke="${OL}" stroke-width="6"/>`;
  for (let i = 0; i < 10; i++) { const x = ((i * 300 - d * .45) % 3000 + 3000) % 3000 - 300; s += tree(x, 740, .7 + (i % 3) * .1, '#5f8f5a'); }
  // power poles
  for (let i = 0; i < 5; i++) { const x = ((i * 600 - d * .7) % 3000 + 3000) % 3000 - 300; s += `<rect x="${x}" y="420" width="16" height="360" fill="#7a5a3a" stroke="${OL}" stroke-width="4"/><rect x="${x - 50}" y="440" width="116" height="14" fill="#7a5a3a" stroke="${OL}" stroke-width="4"/>`; }
  // road
  s += `<rect x="0" y="770" width="1920" height="310" fill="#3e434f" stroke="${OL}" stroke-width="6"/><rect x="0" y="790" width="1920" height="12" fill="#e6e6e6"/>`;
  s += `<path d="M0 960 H1920" stroke="#e6e6e6" stroke-width="10" stroke-dasharray="90 70" stroke-dashoffset="${d}"/>`;
  for (let i = 0; i < 12; i++) { const x = ((i * 190 - d) % 2280 + 2280) % 2280 - 180; s += `<path d="M${x} ${880 + (i % 3) * 30} h${60 + (i % 4) * 30}" stroke="#9fb0c4" stroke-width="6" opacity=".35" stroke-linecap="round"/>`; }
  const fg = (T0, xAt = 1390) => xAt - speed * (t - T0);
  // background-lane traffic in peak hour
  if (t > C('m_inc4') - 2) for (let i = 0; i < 4; i++) {
    const T0 = C('m_inc4') + i * 2.4, rel = 120 + rnd(i) * 140;
    const x = 2000 - rel * (t - T0 + 2);
    if (x > -300 && x < 2100) s += G(`translate(${x},${800}) scale(.75)`, carSide(['#e63946', '#3d8bfd', '#f4a261', '#9b5de5'][i], -(t * 12)));
  }
  // rail crossing
  const rx = fg(E.jolt, 1390);
  if (rx > -300 && rx < 2300) {
    s += G(`translate(${rx + 200},790)`, `<rect x="-8" y="-300" width="16" height="300" fill="#eee" stroke="${OL}" stroke-width="4"/><g transform="translate(0,-260)"><rect x="-90" y="-16" width="180" height="32" fill="#fff" stroke="${OL}" stroke-width="4" transform="rotate(30)"/><rect x="-90" y="-16" width="180" height="32" fill="#fff" stroke="${OL}" stroke-width="4" transform="rotate(-30)"/></g>` +
      txt(0, -196, 'RAILWAY', 22, OL, { font: 'Fredoka', stroke: 0, weight: 700 }) + `<circle cx="-40" cy="-160" r="18" fill="#511" stroke="${OL}" stroke-width="4"/><circle cx="40" cy="-160" r="18" fill="#511" stroke="${OL}" stroke-width="4"/>`);
    s += `<path d="M${rx - 50} 790 L${rx - 70} 1080 M${rx + 50} 790 L${rx + 70} 1080" stroke="#6b6b6b" stroke-width="16"/><path d="M${rx - 50} 790 L${rx - 70} 1080 M${rx + 50} 790 L${rx + 70} 1080" stroke="#c9ced8" stroke-width="6"/>`;
  }
  // rest area signs
  const s1 = fg(E.restSign + 1.6, 1500);
  if (s1 > -400 && s1 < 2300) s += G(`translate(${s1},790)`, `<rect x="-10" y="-260" width="20" height="260" fill="#888" stroke="${OL}" stroke-width="4"/><rect x="-170" y="-380" width="340" height="150" rx="14" fill="#1d6b3a" stroke="#fff" stroke-width="6"/>` +
    txt(0, -326, 'TRUCK REST AREA', 34, '#fff', { stroke: 0 }) + txt(0, -268, '1 km', 44, '#fff', { stroke: 0 }));
  const s2 = fg(E.drivePast + .9, 1500);
  if (s2 > -500 && s2 < 2400) s += G(`translate(${s2},790)`, `<rect x="-10" y="-280" width="20" height="280" fill="#888" stroke="${OL}" stroke-width="4"/><rect x="190" y="-280" width="20" height="280" fill="#888" stroke="${OL}" stroke-width="4"/><rect x="-60" y="-470" width="320" height="210" rx="14" fill="#1d4fa8" stroke="#fff" stroke-width="6"/>` +
    txt(100, -420, 'WATTLEBROOK', 34, '#fff', { stroke: 0 }) + txt(100, -378, 'REST AREA', 34, '#fff', { stroke: 0 }) + txt(30, -300, 'P', 56, '#fff', { stroke: 0 }) + `<path d="M120 -320 h30 v24 h-30 z M150 -312 q14 0 10 10" stroke="#fff" stroke-width="5" fill="none"/>` + txt(220, -300, '➜', 50, '#fff', { stroke: 0 }));
  const s3 = fg(E.schoolSign + 1.4, 1500);
  if (s3 > -400 && s3 < 2300) s += G(`translate(${s3},790)`, `<rect x="-10" y="-260" width="20" height="260" fill="#888" stroke="${OL}" stroke-width="4"/><rect x="-110" y="-470" width="220" height="220" fill="${COL.yellow}" stroke="${OL}" stroke-width="6" transform="rotate(45 0 -360)"/>` +
    txt(0, -370, 'SCHOOL', 40, OL, { stroke: 0 }) + txt(0, -326, '400 m', 40, OL, { stroke: 0 }));
  // truck
  const bump = [E.jolt, E.jolt + .25].reduce((a, h) => a + (t > h ? 16 * Math.exp(-(t - h) * 5) * Math.abs(Math.sin((t - h) * 22)) : 0), 0);
  const shift = eout(prog(t, E.jolt + .05, .35)), loose = prog(t, E.jolt + .1, .6);
  const worried = t > E.jolt + .3;
  s += G(`translate(300,${878 - bump})`, truckSide(t, { dist: d, shift, loose, driver: { blink: blinkAt(t), expr: worried ? 'worried' : 'happy', lx: worried ? -1 : 0 } }));
  s += rain(t, 150, .45);
  // callouts
  s += burst(1150, 300, t < E.jolt + 1.6 ? pop(t, E.jolt) : 0, 'JOLT!', COL.yellow, -8, 90);
  if (t > E.shiftNotice - .3) {
    const tw = Math.sin(t * 10) > 0 ? 1 : .6;
    [[480, 500], [700, 470], [860, 560]].forEach(([x, y]) => s += popAt(x, y, pop(t, E.shiftNotice - .2) * tw, `<path d="M0 -44 L40 30 L-40 30 Z" fill="${COL.yellow}" stroke="${OL}" stroke-width="6" stroke-linejoin="round"/>` + txt(0, 22, '!', 44, OL, { stroke: 0 })));
  }
  s += bubble(1270, 300, 500, 150, ['Uh oh… did the', 'load just shift?'], t < E.restSign - .2 ? pop(t, E.shiftNotice) : 0, [-110, 160], 40, true);
  const o1 = W('m_inc3', 'only');
  s += bubble(1270, 290, 560, 170, ['Only 15 mins to go…', "I'll rest at the site!"], t < E.drivePast + 1.8 ? pop(t, o1) : 0, [-110, 170], 40, true);
  s += popAt(1660, 470, t < C('m_inc4') ? pop(t, W('m_inc3', 'due')) : 0, `<rect x="-140" y="-80" width="280" height="160" fill="#fff59d" stroke="${OL}" stroke-width="5"/>` + txt(0, -20, 'BREAK DUE', 36, OL, { stroke: 0 }) + txt(0, 40, 'by 9:00 am', 40, COL.red, { font: 'Fredoka', stroke: 0, weight: 700 }), 6);
  s += popAt(720, 300, t < E.drivePast + 2.2 ? pop(t, E.drivePast + .6) : 0, `<rect x="-250" y="-50" width="500" height="100" rx="20" fill="${COL.red}" stroke="${OL}" stroke-width="6"/>` + txt(0, 20, '…AND DRIVES PAST!', 50, '#fff'), -4);
  // HUD
  const late = t > E.clock835;
  s += clockHud(220, 90, late ? '8:35 am' : '8:20 am', 'MONDAY • OVERCAST', late ? pop(t, E.clock835) : pop(t, sc.start + .3));
  if (t > E.clock835 + .3) {
    const sp = pop(t, E.clock835 + .3);
    const needle = -120 + 150 * eout(prog(t, E.clock835 + .4, 1));
    s += popAt(1760, 130, sp, `<circle r="100" fill="#fff" stroke="${OL}" stroke-width="7"/><path d="M-70 40 A80 80 0 1 1 70 40" stroke="${COL.teal}" stroke-width="12" fill="none"/>` +
      `<path d="M0 0 L${Math.cos((needle - 90) * Math.PI / 180) * 70} ${Math.sin((needle - 90) * Math.PI / 180) * 70}" stroke="${COL.red}" stroke-width="8" stroke-linecap="round"/><circle r="12" fill="${OL}"/>` + txt(0, 72, '60 km/h', 30, OL, { stroke: 0 }));
    s += popAt(1500, 240, pop(t, W('m_inc4', 'peak')), `<rect x="-170" y="-40" width="340" height="80" rx="40" fill="${COL.navy}" stroke="${OL}" stroke-width="5"/>` + txt(0, 14, 'PEAK HOUR', 42, COL.yellow, { stroke: 0 }), 4);
  }
  if (l < 7) s += popAt(560, 90, l < 6.5 ? pop(t, W('m_inc1', 'damp')) : 0, `<rect x="-150" y="-40" width="300" height="80" rx="20" fill="#9fb0c4" stroke="${OL}" stroke-width="5"/>` + txt(0, 14, 'DAMP ROAD', 40, '#fff', { stroke: 0 }), -3);
  return s;
}

function sCrash(t) {
  let s = crashWorld(t);
  s += rain(t, 90, .35);
  s += burst(1500, 160, t < E.brake + 1.8 ? pop(t, E.brake) : 0, 'SCREEECH!', COL.yellow, -6, 80);
  if (t > E.brake && t < E.brake + 2.6 && Math.floor(t * 4) % 2 === 0)
    s += G('translate(720,190)', `<rect x="-330" y="-50" width="660" height="100" rx="20" fill="${COL.red}" stroke="${OL}" stroke-width="6"/>` + txt(0, 18, 'AUTO EMERGENCY BRAKE!', 46, '#fff'));
  const [cx, cy] = carPos(t);
  s += popAt(cx, cy - 90, t > E.carCut - .2 && t < E.carCut + 1.4 ? pop(t, E.carCut - .2) : 0, `<circle r="44" fill="#fff" stroke="${OL}" stroke-width="6"/>` + txt(0, 22, '!', 64, COL.red, { stroke: 0 }));
  s += burst(1560, 860, t < E.fall + 3.5 ? pop(t, E.fall + .75) : 0, 'CRUNCH!', COL.orange, 6, 90);
  s += popAt(1700, 770, pop(t, E.fall + 2.4), `<rect x="-200" y="-56" width="400" height="112" rx="20" fill="#fff" stroke="${OL}" stroke-width="6"/>` + txt(0, -6, 'INTO ONCOMING', 38, COL.red, { stroke: 0 }) + txt(0, 36, 'TRAFFIC LANES!', 38, COL.red, { stroke: 0 }), 4);
  s += clockHud(220, 90, '8:35 am', 'MONDAY • DAMP ROAD', 1);
  return s;
}

function sBusDriver(t) {
  const sc = SC.busdriver, l = t - sc.start, d = l * 480;
  let s = skyGrad('osky2', '#8c99ab', '#c9d2dc') + `<rect width="1920" height="1080" fill="url(#osky2)"/>`;
  for (let i = 0; i < 4; i++) s += cloud(((i * 600 + l * 25) % 2600) - 300, 120 + (i % 2) * 60, 1, '#b3bcc9');
  for (let i = 0; i < 9; i++) { const x = ((i * 330 + d * .45) % 3000) - 300; s += tree(x, 760, .75, '#5f8f5a'); }
  s += `<rect x="0" y="770" width="1920" height="310" fill="#3e434f" stroke="${OL}" stroke-width="6"/><path d="M0 960 H1920" stroke="#e6e6e6" stroke-width="10" stroke-dasharray="90 70" stroke-dashoffset="${-d}"/>`;
  s += G(`translate(220,${880 + Math.sin(l * 9) * 2}) scale(1.2)`, busSide(t, { dist: d, driver: { blink: blinkAt(t), expr: 'focus', lx: Math.sin(l * 1.4) }, id: 'bd' }));
  s += rain(t, 110, .35);
  // zoom bubble on Angelo
  const zp = pop(t, sc.start + .9);
  s += popAt(1560, 340, zp, `<circle r="230" fill="#bfe6ff" stroke="${OL}" stroke-width="10"/><clipPath id="zc"><circle r="222"/></clipPath><g clip-path="url(#zc)">` +
    G('translate(0,110) scale(1.1)', person(CHARS.angelo, { blink: blinkAt(t, 2), expr: 'focus', lx: Math.sin(l * 1.4), mouth: 0 })) + `</g>`);
  s += `<path d="M${1560 - 200 * zp} ${340 + 120 * zp} L330 600" stroke="${OL}" stroke-width="6" stroke-dasharray="14 12" opacity="${zp > .1 ? 1 : 0}"/>`;
  const tags = [['EXPERIENCED DRIVER', 'experienced', COL.navy], ['SAFEGUARDS YOUNG PASSENGERS', 'safeguarding', COL.teal], ["WATCHES WHAT'S AHEAD", 'attention', COL.red]];
  tags.forEach(([lab, w, c], i) => s += popAt(500 + (i % 2) * 120, 110 + i * 105, pop(t, W('m_inc7', w)), `<rect x="-380" y="-42" width="760" height="84" rx="42" fill="${c}" stroke="${OL}" stroke-width="6"/>` + txt(0, 15, lab, 40, '#fff'), (i - 1) * 2));
  return s;
}

function sSwerve(t) {
  let s = crashWorld(t);
  s += rain(t, 80, .3);
  s += burst(1420, 900, t < E.swerve + 1.5 ? pop(t, E.swerve) : 0, 'HARD LEFT!', COL.yellow, -5, 72);
  s += burst(1640, 170, t < E.scrape + 2.4 ? pop(t, E.scrape) : 0, 'SCRRRAPE!', COL.orange, 5, 80);
  s += burst(1080, 950, pop(t, E.scrape + .5), 'SMASH!', '#bfe6ff', -8, 74);
  const ip = pop(t, E.busEnter + .4);
  s += popAt(260, 210, ip, `<circle r="170" fill="#fff" stroke="${OL}" stroke-width="9"/><clipPath id="sc1"><circle r="162"/></clipPath><g clip-path="url(#sc1)">` +
    G('translate(0,90) scale(.85)', person(CHARS.angelo, { expr: t > E.swerve - .3 && t < E.busStop + .6 ? 'shock' : 'focus', blink: false, lx: t > E.busStop + .6 ? 0 : -1 })) + `</g>`);
  return s;
}

function sInterview(t) {
  const l = t - SC.interview.start;
  let s = skyGrad('isky', '#93a3b8', '#d8dee6') + `<rect width="1920" height="1080" fill="url(#isky)"/>`;
  s += `<rect x="0" y="720" width="1920" height="360" fill="#555b68"/>`;
  s += G('translate(980,780) scale(1.05)', busSide(t, { broken: [2, 3, 4], scratch: 1, kidExpr: 'happy', id: 'iv' }));
  const fl = Math.floor(t * 3) % 2;
  s += `<circle cx="1820" cy="600" r="260" fill="${fl ? '#ff2a2a' : '#3355ff'}" opacity=".18"/>`;
  s += `<path d="M-20 140 L620 -20" stroke="${COL.yellow}" stroke-width="54"/><path d="M-20 140 L620 -20" stroke="${OL}" stroke-width="54" stroke-dasharray="70 70" opacity=".85"/>`;
  s += txt(300, 75, 'POLICE LINE', 30, '#fff', { stroke: 0, extra: 'transform="rotate(-14 300 75)"' });
  // Angelo
  const an = W('a2', 'straight'), a3 = C('a3');
  const expr = t > an - .3 && t < a3 + 4 ? 'shock' : t > C('a4') ? 'grin' : 'happy';
  s += G(`translate(440,${600 + Math.sin(l * 2) * 3}) scale(1.6)`, person(CHARS.angelo, { mouth: mouth('ang', t), blink: blinkAt(t), expr: expr === 'shock' && mouth('ang', t) > .1 ? 'worried' : expr }));
  s += popAt(440, 860, pop(t, SC.interview.start + .3), `<rect x="-330" y="-46" width="660" height="92" rx="14" fill="${COL.navy}" stroke="${OL}" stroke-width="6"/>` + txt(0, -2, 'ANGELO PETRAKIS', 44, COL.yellow, { stroke: 0 }) + txt(0, 34, 'Wattlebrook school bus driver', 28, '#fff', { font: 'Fredoka', stroke: 0 }));
  // question
  s += bubble(1260, 220, 760, 130, ['Angelo, tell us what happened?'], t < C('a1') + .3 ? pop(t, C('m_q') - .1) : 0, [-300, 130], 46);
  // comic panels
  const panel = (id, from, to, inner, cap, col) => {
    if (t < from - .2 || t > to + .3) return '';
    const sp = pop(t, from - .2, .5) * fadeIO(t, from - .2, to + .3, .3);
    return popAt(1360, 430, sp, `<rect x="-470" y="-290" width="940" height="560" rx="18" fill="#fff" stroke="${OL}" stroke-width="10"/>` +
      `<clipPath id="pc${id}"><rect x="-450" y="-270" width="900" height="520" rx="8"/></clipPath><g clip-path="url(#pc${id})">${inner}</g>` +
      `<rect x="-440" y="-260" width="${cap.length * 26 + 60}" height="66" rx="10" fill="${col}" stroke="${OL}" stroke-width="5"/>` + txt(-410, -214, cap, 40, '#fff', { anchor: 'start' }), (id % 2 ? 2 : -2));
  };
  const crop = (T, vb) => nested(-450, -270, 900, 520, vb, crashWorld(T));
  s += panel(1, C('a1'), CE('a1'), crop(clamp(E.carCut - 1 + (t - C('a1')) * .55, 0, E.brake + 2.5), '500 180 1200 690'), 'TRUCK BRAKES HARD', COL.red);
  s += panel(2, C('a2'), CE('a2'), crop(clamp(E.fall - .2 + (t - C('a2')) * .5, 0, E.fall + 2), '650 180 1100 635'), 'BEAM OVER THE BARRIER!', COL.orange);
  s += panel(3, C('a3'), CE('a3'), crop(clamp(E.busEnter + .6 + (t - C('a3')) * .4, 0, E.busStop + 1), '900 280 1000 577') +
    burst(250, 160, pop(t, W('a3', 'windows')), 'SMASH!', '#bfe6ff', 8, 60), 'HARD LEFT!', COL.navy);
  const kidsPanel = `<rect x="-450" y="-270" width="900" height="520" fill="#ffe9b8"/>` + ['kid1', 'kid2', 'kid3'].map((k, i) =>
    G(`translate(${-260 + i * 260},${130 + Math.sin(t * 5 + i) * 8}) scale(.8)`, person(CHARS[k], { pose: 'cheer', t: t + i, expr: 'grin', blink: blinkAt(t, i) }) +
      `<rect x="28" y="-92" width="44" height="18" rx="8" fill="#f6c28b" stroke="${OL}" stroke-width="3" transform="rotate(-20 50 -83)"/>`)).join('');
  s += panel(4, C('a4'), SC.interview.end, kidsPanel, 'KIDS CHECKED', COL.teal);
  return s;
}

function sRelief(t) {
  const l = t - SC.relief.start;
  let s = sunburst(700, 560, l, '#fff0c2', '#ffe08a');
  s += `<rect x="0" y="860" width="1920" height="220" fill="#8fd27e" stroke="${OL}" stroke-width="7"/>`;
  s += G('translate(560,580) scale(1.15)', person(CHARS.angelo, { full: true, pose: 'flag', t, blink: blinkAt(t), expr: 'grin' }));
  s += burst(560, 150, pop(t, W('m_aft1', 'reflexes') - .2), 'F1 REFLEXES!', COL.yellow, -6, 70);
  ['kid1', 'kid2', 'kid3'].forEach((k, i) => {
    const x = 1150 + i * 230, sp = pop(t, W('m_aft1', 'kids') + i * .12);
    s += popAt(x, 690, sp, G(`translate(0,${-Math.abs(Math.sin(t * 5 + i)) * 20}) scale(.5)`, person(CHARS[k], { full: true, pose: 'cheer', t: t + i, expr: 'grin', blink: blinkAt(t, i) }) +
      `<rect x="28" y="-92" width="48" height="20" rx="9" fill="#f6c28b" stroke="${OL}" stroke-width="4" transform="rotate(-20 52 -82)"/>`));
  });
  s += popAt(1380, 320, pop(t, W('m_aft1', 'okay')), `<rect x="-330" y="-60" width="660" height="120" rx="24" fill="#fff" stroke="${OL}" stroke-width="6"/>` + txt(0, -6, 'KIDS ALL OKAY', 48, COL.teal, { stroke: 0 }) + txt(0, 38, 'just a few cuts from the glass', 30, '#555', { font: 'Fredoka', stroke: 0 }), 3);
  s += stamp(1380, 540, prog(t, W('m_aft1', 'catastrophic') - .1, .8), ['IT COULD HAVE BEEN', 'CATASTROPHIC'], COL.red, -6, 58, 700);
  return s;
}

function sJam(t) {
  const sc = SC.jam, l = t - sc.start;
  const T = E.busStop + 6 + l;
  let inner = crashWorld(T, { police: true });
  const cols = ['#e63946', '#3d8bfd', '#f4a261', '#9b5de5', '#2a9d8f', '#ffd23f', '#adb5bd'];
  const slide = eout(prog(t, sc.start, 2.5));
  for (let i = 0; i < 8; i++) {
    inner += G(`translate(${370 - i * 150 - (1 - slide) * 600},${CW.outer}) `, carTop(cols[i % 7]));
    inner += G(`translate(${1020 - i * 150 - (1 - slide) * 600},${CW.inner})`, carTop(cols[(i + 3) % 7]));
    inner += G(`translate(${1900 + i * 150 + (1 - slide) * 600},${CW.wbInner}) rotate(180)`, carTop(cols[(i + 1) % 7]));
    inner += G(`translate(${1560 + i * 150 + (1 - slide) * 600},${CW.wbOuter}) rotate(180)`, carTop(cols[(i + 5) % 7]));
  }
  let s = `<rect width="1920" height="1080" fill="#79b86a"/>` + G('translate(960,560) scale(.9) translate(-960,-480)', inner);
  for (let i = 0; i < 6; i++) {
    const t0 = sc.start + 1 + i * 1.6, x = [200, 620, 1820, 1700, 340, 1500][i], y = [250, 520, 470, 720, 760, 280][i];
    s += burst(x, y, t > t0 && t < t0 + 1.1 ? pop(t, t0, .3) * .45 : 0, 'HONK!', '#fff', (i % 2 ? 8 : -8), 70);
  }
  s += popAt(960, 110, pop(t, W('m_aft2', 'police')), `<rect x="-420" y="-50" width="840" height="100" rx="50" fill="${COL.navy}" stroke="${OL}" stroke-width="6"/>` + txt(0, 18, 'POLICE TAKE CONTROL', 54, '#fff'));
  const hrs = 8 * 60 + 40 + eio(prog(t, W('m_aft2', 'disruption'), 3)) * 190;
  const hh = Math.floor(hrs / 60), mm = String(Math.floor(hrs % 60)).padStart(2, '0');
  s += clockHud(1660, 100, `${hh > 12 ? hh - 12 : hh}:${mm} ${hh >= 12 ? 'pm' : 'am'}`, 'STILL BLOCKED…', pop(t, W('m_aft2', 'disruption') - .3));
  s += popAt(960, 860, pop(t, W('m_aft2', 'disruption')), `<rect x="-480" y="-50" width="960" height="100" rx="20" fill="${COL.red}" stroke="${OL}" stroke-width="6"/>` + txt(0, 18, 'HOURS OF DISRUPTION & CONGESTION', 46, '#fff'), -2);
  return s;
}

function sMedia(t) {
  const sc = SC.media, l = t - sc.start;
  let s = skyGrad('msky', '#a7b4c6', '#e1e6ec') + `<rect width="1920" height="1080" fill="url(#msky)"/>`;
  s += `<rect x="0" y="780" width="1920" height="300" fill="#555b68" stroke="${OL}" stroke-width="6"/>`;
  // bent barrier + truss
  s += `<path d="M1100 760 L1350 760 Q1460 830 1560 760 L1920 760" stroke="${OL}" stroke-width="22" fill="none"/><path d="M1100 760 L1350 760 Q1460 830 1560 760 L1920 760" stroke="#c9ced8" stroke-width="12" fill="none"/>`;
  s += G('translate(1060,850) rotate(-8) scale(.9)', trussSide(t, 0, 0, 0, false));
  for (let i = 0; i < 4; i++) s += G(`translate(${1180 + i * 150},${870 + (i % 2) * 30})`, `<path d="M-26 0 L0 -50 L26 0 Z" fill="${COL.yellow}" stroke="${OL}" stroke-width="4"/>` + txt(0, -8, String(i + 1), 26, OL, { stroke: 0 }));
  // news van
  const st = `stroke="${OL}" stroke-width="6" stroke-linejoin="round"`;
  s += G('translate(80,880)', `<path d="M0 -40 L0 -300 L440 -300 L520 -200 L540 -40 Z" fill="#fff" ${st}/><path d="M450 -280 L505 -205 L450 -205 Z" fill="#bfe6ff" ${st}/>` +
    txt(220, -210, 'BARRA', 54, COL.red, { stroke: 0 }) + txt(220, -150, 'NEWS 6', 54, COL.navy, { stroke: 0 }) +
    `<path d="M160 -300 L160 -380" stroke="${OL}" stroke-width="10"/><ellipse cx="160" cy="-400" rx="80" ry="34" fill="#ddd" ${st} transform="rotate(-20 160 -400)"/>` + wheel(110, -36, 40, 0) + wheel(440, -36, 40, 0));
  // cameraman + reporter
  s += G('translate(760,620) scale(.62)', person(CHARS.camera, { full: true, blink: blinkAt(t, 3) }) + `<rect x="86" y="-150" width="150" height="80" rx="12" fill="#333" stroke="${OL}" stroke-width="6"/><circle cx="246" cy="-110" r="30" fill="#555" stroke="${OL}" stroke-width="6"/><circle cx="116" cy="-160" r="${Math.floor(t * 2) % 2 ? 10 : 0}" fill="#f22"/>`);
  s += G('translate(1010,620) scale(.62)', person(CHARS.reporter, { full: true, pose: 'mic', mouth: Math.abs(Math.sin(t * 11)) * .7, blink: blinkAt(t, 5) }));
  s += G('translate(1780,640) scale(.6)', person(CHARS.cop, { full: true, pose: 'clip', blink: blinkAt(t, 6) }));
  // flashes
  for (let i = 0; i < 6; i++) {
    const t0 = sc.start + .8 + i * 1.3;
    const p = prog(t, t0, .35);
    if (p > 0 && p < 1) s += G(`translate(${[600, 1300, 900, 1500, 700, 1200][i]},${[300, 260, 420, 380, 220, 470][i]}) scale(${1 + p})`, `<polygon points="0,-70 16,-16 70,0 16,16 0,70 -16,16 -70,0 -16,-16" fill="#fff" opacity="${1 - p}"/>`);
  }
  s += popAt(640, 110, pop(t, W('m_aft3', 'TV')), `<rect x="-340" y="-50" width="680" height="100" rx="20" fill="${COL.red}" stroke="${OL}" stroke-width="6"/>` + txt(0, 18, 'MEDIA ON THE SCENE', 52, '#fff'), -3);
  s += popAt(1460, 200, pop(t, W('m_aft3', 'evidence')), `<rect x="-380" y="-50" width="760" height="100" rx="20" fill="${COL.navy}" stroke="${OL}" stroke-width="6"/>` + txt(0, 18, 'AUTHORITIES COLLECT EVIDENCE', 44, '#fff'), 3);
  s += popAt(960, 470, pop(t, C('m_aft4')), `<rect x="-330" y="-60" width="660" height="120" rx="20" fill="${COL.yellow}" stroke="${OL}" stroke-width="7"/>` + txt(0, 22, 'TONIGHT ON THE NEWS…', 50, OL, { stroke: 0 }), -2);
  return s;
}

function sNews(t) {
  const sc = SC.news, l = t - sc.start;
  let s = `<rect width="1920" height="1080" fill="#3b2a20"/>`;
  // TV bezel
  s += `<rect x="40" y="20" width="1840" height="1040" rx="60" fill="#6b4a33" stroke="${OL}" stroke-width="10"/><rect x="70" y="50" width="1780" height="980" rx="40" fill="#1a1a1a" stroke="${OL}" stroke-width="8"/>`;
  const on = eout(prog(t, sc.start + .3, .6));
  let tv = '';
  tv += skyGrad('ns', '#1f3c88', '#0d1b45') + `<rect width="1920" height="1080" fill="url(#ns)"/>`;
  for (let i = 0; i < 12; i++) tv += `<rect x="${i * 170 - 40}" y="${520 - (rnd(i) * 260)}" width="120" height="${600}" fill="#2a4aa0" opacity=".5"/>`;
  tv += G(`translate(1400,${560 + Math.sin(l * 1.5) * 3}) scale(1.25)`, person(CHARS.anchor, { mouth: mouth('news', t), blink: blinkAt(t, 4) }));
  tv += `<path d="M960 760 L1880 760 L1860 900 L980 900 Z" fill="#c9ced8" stroke="${OL}" stroke-width="7"/><rect x="960" y="740" width="920" height="30" fill="#e8ecf2" stroke="${OL}" stroke-width="6"/>`;
  // graphic box
  const box = (inner, label) => `<g transform="translate(150,170)"><rect x="-10" y="-10" width="840" height="500" rx="16" fill="#fff" stroke="${OL}" stroke-width="8"/>` +
    `<svg x="0" y="0" width="820" height="480" viewBox="0 0 820 480">${inner}</svg>` + (label ? `<rect x="10" y="10" width="${label.length * 22 + 50}" height="56" rx="8" fill="${COL.red}"/>` + txt(36, 52, label, 38, '#fff', { anchor: 'start', stroke: 0 }) : '') + `</g>`;
  const crop = (T, vb) => `<svg width="820" height="480" viewBox="${vb}" preserveAspectRatio="xMidYMid slice">${crashWorld(T)}</svg>`;
  let headline = 'PEAK-HOUR SCARE ON BARRAPINYA HWY';
  if (t < C('n2')) {
    tv += box(`<rect width="820" height="480" fill="#3e434f"/><g transform="translate(410,330) rotate(-12) scale(1.1)">${trussTop()}</g>` + [0, 1, 2, 3].map(i => G(`translate(${140 + i * 180},420)`, cone(0, 0, 1.2))).join(''), '25-TONNE STEEL STRUCTURE');
  } else if (t < C('n4')) {
    const T = t < C('n3') ? clamp(E.carCut - .3 + (t - C('n2')), 0, E.fall + 2.5) : clamp(E.busEnter + .3 + (t - C('n3')) * .45, 0, E.busStop + 1);
    tv += box(crop(T, t < C('n3') ? '250 160 1500 878' : '900 260 1020 597') + `<rect width="820" height="480" fill="#000" opacity=".12"/><circle cx="740" cy="40" r="14" fill="${Math.floor(t * 2) % 2 ? '#f22' : 'none'}"/>` + txt(690, 50, 'REC', 30, '#fff', { anchor: 'end', stroke: 4 }) + txt(800, 460, '08:35:12', 28, '#fff', { anchor: 'end', font: 'Fredoka', stroke: 4 }), 'DASHCAM FOOTAGE');
    headline = t < C('n3') ? 'DASHCAM CATCHES DRAMATIC MOMENT' : 'HERO BUS DRIVER SWERVES';
  } else if (t < E.factKimi - .2) {
    tv += box(crop(E.busStop + 8, '1150 300 600 351'), 'BARRIER DAMAGED');
    headline = 'MEDIAN BARRIER EXTENSIVELY DAMAGED';
  } else if (t < C('n5')) {
    let sp = '';
    for (let i = 0; i < 10; i++) { const a = i / 10 * 6.28 + l * 2; sp += `<polygon points="0,-24 6,-6 24,0 6,6 0,24 -6,6 -24,0 -6,-6" fill="${COL.yellow}" transform="translate(${410 + Math.cos(a) * 330},${260 + Math.sin(a) * 170})"/>`; }
    let flag = '';
    for (let r = 0; r < 5; r++) for (let q = 0; q < 8; q++) flag += `<rect x="${250 + q * 40}" y="${110 + r * 36 + Math.sin(l * 6 + q) * 6}" width="40" height="36" fill="${(r + q) % 2 ? '#fff' : '#111'}"/>`;
    tv += box(`<rect width="820" height="480" fill="#26315c"/>${flag}${sp}` + txt(410, 400, 'UNCLE OF F1 STAR!', 60, COL.yellow), 'REVEALED');
    headline = 'HERO DRIVER’S F1 FAMILY CONNECTION';
  } else {
    tv += box(`<rect width="820" height="480" fill="#e8f6f4"/>` + G('translate(410,300) scale(.9)', person(CHARS.steve, { pose: 'clip', blink: blinkAt(t) })), 'NHVR INVESTIGATING');
    headline = 'NHVR INVESTIGATING THE INCIDENT';
  }
  tv += stamp(560, 560, prog(t, E.heroic - .1, .6) * (t < C('n4') ? 1 : 0), ['HEROIC!'], COL.yellow, -10, 80, 380);
  // lower third + ticker
  tv += `<rect x="70" y="730" width="1780" height="110" fill="#fff" stroke="${OL}" stroke-width="6"/><rect x="70" y="730" width="360" height="110" fill="${COL.red}" stroke="${OL}" stroke-width="6"/>` +
    txt(250, 802, 'BREAKING', 56, '#fff', { stroke: 0 }) + txt(470, 802, headline, 52, OL, { anchor: 'start', stroke: 0 });
  const tick = 'BARRAPINYA HWY CLOSED IN BOTH DIRECTIONS  •  STEEL LOAD FALLS FROM TRUCK NEAR WATTLEBROOK PRIMARY  •  NO MAJOR INJURIES  •  NHVR INVESTIGATING  •  ';
  tv += `<rect x="70" y="840" width="1780" height="70" fill="${OL}"/><clipPath id="tk"><rect x="70" y="840" width="1780" height="70"/></clipPath><g clip-path="url(#tk)">` +
    txt(1900 - ((l * 180) % 3600), 888, tick + tick, 36, COL.yellow, { anchor: 'start', font: 'Fredoka', stroke: 0, weight: 700 }) + `</g>`;
  tv += G('translate(170,110)', `<rect x="-80" y="-40" width="300" height="80" rx="12" fill="${COL.red}" stroke="#fff" stroke-width="4"/>` + txt(70, 16, 'BARRA NEWS 6', 38, '#fff', { stroke: 0 }));
  tv += G('translate(1740,110)', `<rect x="-70" y="-34" width="140" height="68" rx="10" fill="${COL.red}"/><circle cx="-40" cy="0" r="12" fill="#fff" opacity="${Math.floor(t * 2) % 2 ? 1 : .3}"/>` + txt(18, 16, 'LIVE', 40, '#fff', { stroke: 0 }));
  // CRT power-on squash
  s += `<clipPath id="crt"><rect x="70" y="${540 - 490 * on}" width="1780" height="${Math.max(4, 980 * on)}" rx="40"/></clipPath><g clip-path="url(#crt)">${tv}</g>`;
  if (on < 1) s += `<rect x="70" y="${536 - 490 * on}" width="1780" height="${8 + 980 * on}" fill="#fff" opacity="${1 - on}"/>`;
  // fact checks (outside the TV)
  const note = (x, y, p, l1, l2, rot) => popAt(x, y, p, `<rect x="-230" y="-100" width="460" height="200" fill="#fff59d" stroke="${OL}" stroke-width="6"/><rect x="-60" y="-118" width="120" height="34" fill="#ffffff" opacity=".7"/>` +
    txt(0, -36, 'FACT CHECK', 44, COL.red, { stroke: 0 }) + txt(0, 14, l1, 34, OL, { font: 'Fredoka', stroke: 0, weight: 700 }) + txt(0, 58, l2, 34, OL, { font: 'Fredoka', stroke: 0, weight: 700 }), rot);
  s += note(1620, 230, t < C('n2') + 1.5 ? pop(t, E.factTonnes) : 0, 'The truss is 20 t,', 'not 25 t!', 6);
  s += note(1620, 230, t < C('n4') ? pop(t, W('n3', 'beam')) : 0, "It's a steel TRUSS,", 'not a beam!', -5);
  return s;
}

function sEnd(t) {
  const sc = SC.end, l = t - sc.start;
  let s = `<rect width="1920" height="1080" fill="#151a33"/><ellipse cx="960" cy="560" rx="${700 + Math.sin(l) * 20}" ry="460" fill="#26315c"/>`;
  s += popAt(560, 220, pop(t, W('m_end', 'dramatic')), `<rect x="-260" y="-60" width="520" height="120" rx="24" fill="#fff" stroke="${OL}" stroke-width="6"/>` + txt(-40, 20, 'DRAMATIC?', 52, OL, { stroke: 0 }) + txt(190, 22, '✔', 70, COL.teal, { stroke: 0 }), -4);
  s += popAt(1360, 220, pop(t, W('m_end', 'accurate')), `<rect x="-260" y="-60" width="520" height="120" rx="24" fill="#fff" stroke="${OL}" stroke-width="6"/>` + txt(-40, 20, 'ACCURATE?', 52, OL, { stroke: 0 }) + txt(190, 22, '✘', 70, COL.red, { stroke: 0 }), 4);
  s += popAt(960, 420, pop(t, W('m_end', 'wrong')), txt(0, 0, 'WHAT REALLY WENT WRONG?', 80, COL.yellow), -2);
  s += popAt(960, 540, pop(t, W('m_end', 'responsible')), txt(0, 0, "WHO'S RESPONSIBLE?", 80, COL.orange), 2);
  const fin = CE('m_end') + .2;
  s += popAt(960, 700, pop(t, W('m_end', 'stay')), `<rect x="-470" y="-70" width="940" height="140" rx="30" fill="${COL.red}" stroke="${OL}" stroke-width="8"/>` + txt(0, 26, 'TO BE CONTINUED…', 84, '#fff'), Math.sin(l * 3) * 2);
  s += op(clamp((t - fin) * 2), `<rect x="0" y="0" width="1920" height="1080" fill="#151a33"/>` + txt(960, 440, 'THE OVERPASS', 150, COL.yellow) +
    txt(960, 530, 'Episode 1: The Incident', 54, '#fff', { font: 'Fredoka', stroke: 0, weight: 700 }) +
    txt(960, 640, 'Think about how these issues could apply in YOUR operation.', 42, COL.yellow, { font: 'Fredoka', stroke: 0 }) +
    txt(960, 760, 'A joint production by SARTA • the NHVR • KJK Legal', 36, '#cfd6ea', { font: 'Fredoka', stroke: 0 }) +
    txt(960, 810, 'The scenario and characters are fictional.', 30, '#9aa4c0', { font: 'Fredoka', stroke: 0 }));
  ['vince', 'aryav', 'rachel', 'mick', 'angelo', 'steve'].forEach((k, i) => {
    s += popAt(260 + i * 280, 1000, pop(t, sc.start + .5 + i * .12), G('scale(.42)', person(CHARS[k], { pose: t > fin ? 'wave' : '', t: t + i, blink: blinkAt(t, i), expr: 'happy' })));
  });
  return s;
}

const RENDER = {
  title: sTitle, intro: sIntro, project: sProject, freight: sFreight, companies: sCompanies, characters: sCharacters,
  cast: sCast, drive: sDrive, crash: sCrash, busdriver: sBusDriver, swerve: sSwerve, interview: sInterview,
  relief: sRelief, jam: sJam, media: sMedia, news: sNews, end: sEnd,
};

// ===================== overlays =====================
const WHO = { mod: ['MODERATOR', COL.navy], ang: ['ANGELO', COL.teal], news: ['NEWS READER', COL.red] };
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
  if (['title', 'intro', 'characters'].includes(scene)) return '';
  const px = scene === 'freight' ? 1770 : 150;
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
