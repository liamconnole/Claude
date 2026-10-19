// Top-down crash world shared by every episode. Needs E.carCut, E.brake, E.fall,
// E.busEnter, E.swerve, E.scrape, E.busStop in the episode timeline.
const CRASH_T0 = E.carCut - 2.24;
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
    const x = 2100 - 560 * (T - (CRASH_T0 - .5 + i * 1.3));
    if (x > -150 && x < 2100 && T < E.fall) s += G(`translate(${x},${i % 2 ? CW.wbOuter : CW.wbInner}) rotate(180)`, carTop(['#3d8bfd', '#ffd23f', '#9b5de5'][i]));
  }
  // truck
  const xf = truckFront(Math.min(T, E.fall + 2));
  s += G(`translate(${xf - 335},${CW.outer})`, truckTop({ brake: T > E.brake }));
  // car
  const [cx, cy] = carPos(T);
  if (cx < 2100 && T > CRASH_T0 - 3) s += G(`translate(${cx},${cy}) rotate(${-14 * Math.sin(Math.PI * prog(T, E.carCut - .1, .6))})`, carTop('#e63946'));
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
