// Shared drawing kit for The Overpass: easing, characters, vehicles, UI.
const OL = '#23263a';
const COL = {
  orange: '#ff8a1f', yellow: '#ffd23f', teal: '#16b3a6', red: '#ef476f', navy: '#26315c',
  cream: '#fff6e5', sky: '#8fd3ff', grass: '#7cc96b', road: '#4a4f5c', truss: '#d9632b',
};

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, t0, d) => clamp((t - t0) / d);
const eio = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const eout = t => 1 - Math.pow(1 - t, 3);
const back = t => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const pop = (t, t0, d = .5) => (t < t0 ? 0 : back(clamp((t - t0) / d)));
const rnd = i => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const fadeIO = (t, t0, t1, f = .35) => clamp(Math.min((t - t0) / f, (t1 - t) / f));

const G = (tr, inner, extra = '') => `<g transform="${tr}" ${extra}>${inner}</g>`;
const op = (o, inner) => (o <= 0.001 ? '' : `<g opacity="${o.toFixed(3)}">${inner}</g>`);
// pop-in group around a point
const popAt = (x, y, s, inner, rot = 0) =>
  s <= 0.001 ? '' : G(`translate(${x},${y}) rotate(${rot}) scale(${s.toFixed(3)})`, inner);

function txt(x, y, s, size, fill = '#fff', o = {}) {
  const font = o.font || 'Lucky';
  const sw = o.stroke === undefined ? (font === 'Lucky' ? size * 0.14 : 0) : o.stroke;
  const anchor = o.anchor || 'middle';
  const extra = o.extra || '';
  const strokeCol = o.strokeCol || OL;
  const weight = o.weight || (font === 'Lucky' ? 400 : 600);
  return `<text x="${x}" y="${y}" font-family="${font}" font-weight="${weight}" font-size="${size}" fill="${fill}"
    text-anchor="${anchor}" ${sw ? `stroke="${strokeCol}" stroke-width="${sw}" paint-order="stroke" stroke-linejoin="round"` : ''}
    ${o.ls ? `letter-spacing="${o.ls}"` : ''} ${extra}>${s}</text>`;
}

// ---------- timeline helpers ----------
const TL = window.TL;
const C = id => TL.clips[id].start;
const CE = id => TL.clips[id].start + TL.clips[id].dur;
const E = TL.events;
function W(id, prefix, n = 0) {
  const c = TL.clips[id];
  const hits = c.words.filter(w => w[1].toLowerCase().startsWith(prefix.toLowerCase()));
  const w = hits[Math.min(n, hits.length - 1)];
  return c.start + (w ? w[0] : 0);
}
function speaking(who, t) {
  for (const id in TL.clips) {
    const c = TL.clips[id];
    if (c.who === who && t >= c.start && t < c.start + c.dur) return id;
  }
  return null;
}
function mouth(who, t) {
  const id = speaking(who, t);
  if (!id) return 0;
  const c = TL.clips[id];
  const v = c.env[Math.floor((t - c.start) * TL.fps)] || 0;
  return v < 0.12 ? 0 : clamp(v);
}
const blinkAt = (t, seed = 0) => ((t + seed * 1.7) % 3.7) < 0.12;

// ---------- characters ----------
const CHARS = {
  mod:    { name: 'Moderator', skin: '#f2c6a0', hair: 'short', hairCol: '#5a3a22', shirt: '#2f3e7a', tie: COL.red, collar: '#fff' },
  vince:  { name: 'Vince Murphy', skin: '#f5cfae', hair: 'short', hairCol: '#9a9a9a', shirt: '#4a78c2', hat: ['hardhat', '#ffffff'], glasses: true, mo: true, moCol: '#8a8a8a', logo: 'IRONCLAD' },
  aryav:  { name: 'Aryav Nair', skin: '#b07650', hair: 'short', hairCol: '#1d1a1a', shirt: '#ffffff', vest: '#ff7a1a', hat: ['hardhat', '#ffd23f'], beard: '#1d1a1a', logo: 'MERIDIAN' },
  rachel: { name: 'Rachel Whitfield', skin: '#f6d3b8', hair: 'bun', hairCol: '#a8452a', shirt: '#26315c', logo: 'OHH', lips: true, lashes: true },
  mick:   { name: 'Mick Delaney', skin: '#e2a878', hair: 'short', hairCol: '#6b4a2a', shirt: '#3a6ea5', vest: '#c6f02a', hat: ['cap', '#ff8a1f'], mo: true, moCol: '#6b4a2a', stubble: true },
  angelo: { name: 'Angelo Petrakis', skin: '#d9a57a', hair: 'curly', hairCol: '#2b2420', shirt: '#9cc8ec', hat: ['cap', '#26315c'], mo: true, moCol: '#2b2420', logo: 'SCHOOL BUS', bushy: true },
  steve:  { name: 'Steve Nguyen', skin: '#e8c095', hair: 'spiky', hairCol: '#141414', shirt: '#1f2a44', glasses: true, logo: 'NHVR', lanyard: true },
  anchor: { name: 'News Reader', skin: '#f6d0b5', hair: 'bob', hairCol: '#f0c24a', shirt: '#d6336c', lips: true, lashes: true, collar: '#fff' },
  kid1:   { skin: '#f2c6a0', hair: 'short', hairCol: '#e0a030', shirt: '#ef476f' },
  kid2:   { skin: '#8d5a3b', hair: 'curly', hairCol: '#1d1a1a', shirt: '#16b3a6' },
  kid3:   { skin: '#f5d6c0', hair: 'bob', hairCol: '#5a3a22', shirt: '#ffd23f', lashes: true },
  cop:    { skin: '#e9b98f', hair: 'short', hairCol: '#3a2a1a', shirt: '#2d4f9e', hat: ['police', '#1b2a5a'] },
  camera: { skin: '#c98b62', hair: 'short', hairCol: '#222', shirt: '#555', hat: ['cap', '#d33'] },
  reporter: { skin: '#f3cdb0', hair: 'ponytail', hairCol: '#3b2414', shirt: '#7b4fd6', lips: true, lashes: true },
};

function hairBack(c) {
  if (c.hair === 'bob') return `<path d="M-88 -10 Q-96 -96 0 -98 Q96 -96 88 -10 L92 58 Q60 70 40 40 L-40 40 Q-60 70 -92 58 Z" fill="${c.hairCol}" stroke="${OL}" stroke-width="6"/>`;
  if (c.hair === 'ponytail') return `<ellipse cx="84" cy="-10" rx="30" ry="58" fill="${c.hairCol}" stroke="${OL}" stroke-width="6" transform="rotate(-18 84 -10)"/>`;
  return '';
}
function hairFront(c) {
  const f = `fill="${c.hairCol}" stroke="${OL}" stroke-width="6" stroke-linejoin="round"`;
  switch (c.hair) {
    case 'short': case 'ponytail':
      return `<path d="M-80 -8 Q-88 -98 0 -96 Q88 -98 80 -8 Q74 -50 30 -56 Q0 -40 -20 -58 Q-66 -52 -80 -8 Z" ${f}/>`;
    case 'bob':
      return `<path d="M-82 0 Q-88 -96 0 -96 Q88 -96 82 0 Q70 -48 10 -60 Q-40 -40 -82 0 Z" ${f}/>`;
    case 'bun':
      return `<circle cx="0" cy="-100" r="32" ${f}/><path d="M-80 -4 Q-88 -96 0 -94 Q88 -96 80 -4 Q70 -56 0 -56 Q-70 -56 -80 -4 Z" ${f}/>`;
    case 'curly': {
      let s = '';
      for (let i = 0; i < 9; i++) {
        const a = Math.PI * (1.05 + i * 0.112);
        s += `<circle cx="${(Math.cos(a) * 74).toFixed(1)}" cy="${(Math.sin(a) * 74 - 8).toFixed(1)}" r="26" ${f}/>`;
      }
      return s;
    }
    case 'spiky':
      return `<path d="M-80 -6 L-86 -70 L-60 -62 L-56 -108 L-26 -82 L-6 -118 L14 -84 L44 -112 L50 -70 L82 -80 L80 -6 Q60 -52 0 -52 Q-60 -52 -80 -6 Z" ${f}/>`;
  }
  return '';
}
function hat(c) {
  if (!c.hat) return '';
  const [kind, col] = c.hat;
  const st = `stroke="${OL}" stroke-width="6" stroke-linejoin="round"`;
  if (kind === 'hardhat') return `<path d="M-78 -40 Q-78 -122 0 -124 Q78 -122 78 -40 Z" fill="${col}" ${st}/>
    <rect x="-8" y="-128" width="16" height="88" rx="6" fill="${col}" ${st}/>
    <rect x="-100" y="-50" width="200" height="20" rx="10" fill="${col}" ${st}/>`;
  if (kind === 'cap') return `<path d="M-80 -36 Q-80 -116 0 -116 Q80 -116 80 -36 Z" fill="${col}" ${st}/>
    <path d="M30 -44 Q110 -52 128 -30 Q90 -22 30 -30 Z" fill="${col}" ${st}/>
    <circle cx="0" cy="-116" r="8" fill="${col}" ${st}/>`;
  if (kind === 'police') return `<path d="M-80 -40 L-92 -96 Q0 -132 92 -96 L80 -40 Z" fill="${col}" ${st}/>
    <rect x="-82" y="-60" width="164" height="22" fill="#fff" ${st}/>
    <path d="M-82 -52 h164" stroke="${COL.navy}" stroke-width="8" stroke-dasharray="14 14"/>
    <path d="M-90 -40 Q0 -20 90 -40 L80 -30 Q0 -10 -80 -30Z" fill="#111"/>
    <circle cx="0" cy="-86" r="13" fill="${COL.yellow}" ${st}/>`;
  return '';
}

// Head centred at 0,0 (radius ~80). o: mouth 0..1, blink, expr, lx/ly look offsets
function head(c, o = {}) {
  const m = o.mouth || 0, ex = o.expr || 'happy', lx = (o.lx || 0) * 6, ly = (o.ly || 0) * 5;
  const st = `stroke="${OL}" stroke-width="6"`;
  let s = hairBack(c);
  s += `<circle cx="-78" cy="6" r="18" fill="${c.skin}" ${st}/><circle cx="78" cy="6" r="18" fill="${c.skin}" ${st}/>`;
  s += `<ellipse cx="0" cy="0" rx="78" ry="84" fill="${c.skin}" ${st}/>`;
  if (c.stubble) s += `<path d="M-62 30 Q0 100 62 30 Q40 76 0 78 Q-40 76 -62 30Z" fill="${OL}" opacity=".15"/>`;
  if (c.beard) s += `<path d="M-74 10 Q-70 96 0 100 Q70 96 74 10 Q60 40 40 48 Q0 34 -40 48 Q-60 40 -74 10 Z" fill="${c.beard}" ${st}/>`;
  s += `<circle cx="-46" cy="28" r="12" fill="#ff8fa0" opacity=".45"/><circle cx="46" cy="28" r="12" fill="#ff8fa0" opacity=".45"/>`;
  // eyes
  const shock = ex === 'shock';
  const ery = shock ? 22 : 18;
  if (o.blink && !shock) {
    s += `<path d="M-42 -6 Q-28 2 -14 -6 M14 -6 Q28 2 42 -6" stroke="${OL}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  } else {
    for (const ex2 of [-28, 28]) {
      s += `<ellipse cx="${ex2}" cy="-8" rx="15" ry="${ery}" fill="#fff" stroke="${OL}" stroke-width="5"/>
            <circle cx="${ex2 + lx}" cy="${-6 + ly}" r="${shock ? 6 : 8}" fill="${OL}"/>
            <circle cx="${ex2 + lx + 3}" cy="${-9 + ly}" r="2.6" fill="#fff"/>`;
      if (c.lashes) s += `<path d="M${ex2 + (ex2 < 0 ? -14 : 14)} -20 l${ex2 < 0 ? -9 : 9} -7" stroke="${OL}" stroke-width="4" stroke-linecap="round"/>`;
    }
  }
  // brows
  const bY = shock ? -44 : ex === 'worried' ? -34 : -36;
  const tilt = ex === 'worried' ? 6 : ex === 'focus' ? -6 : 0;
  const bw = c.bushy ? 9 : 6;
  s += `<path d="M-44 ${bY + tilt} L-14 ${bY - tilt}" stroke="${c.hairCol}" stroke-width="${bw}" stroke-linecap="round"/>
        <path d="M14 ${bY - tilt} L44 ${bY + tilt}" stroke="${c.hairCol}" stroke-width="${bw}" stroke-linecap="round"/>`;
  s += `<path d="M-2 4 Q12 20 -4 24" stroke="${OL}" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  // mouth
  if (shock) {
    s += `<ellipse cx="0" cy="48" rx="${14 + m * 4}" ry="${18 + m * 8}" fill="#7a1f2b" stroke="${OL}" stroke-width="5"/>`;
  } else if (m > 0.05) {
    const h = 6 + 30 * m;
    s += `<path d="M-24 40 Q0 ${40 + h * 1.4} 24 40 Q0 ${44 - h * 0.25} -24 40 Z" fill="#7a1f2b" stroke="${OL}" stroke-width="5" stroke-linejoin="round"/>`;
    if (m > .3) s += `<ellipse cx="0" cy="${40 + h * .9}" rx="10" ry="${h * .22}" fill="#ff6f86"/>`;
  } else if (ex === 'worried') {
    s += `<path d="M-20 50 Q0 38 20 50" stroke="${OL}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  } else {
    s += `<path d="M-26 38 Q0 62 26 38" stroke="${OL}" stroke-width="6" fill="${ex === 'grin' ? '#fff' : 'none'}" stroke-linecap="round"/>`;
  }
  if (c.lips && m <= 0.05 && !shock) s += `<path d="M-14 46 Q0 54 14 46" stroke="#d6336c" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  if (c.mo) s += `<path d="M-34 36 Q-18 18 0 28 Q18 18 34 36 Q18 34 0 34 Q-18 34 -34 36Z" fill="${c.moCol}" stroke="${OL}" stroke-width="4" stroke-linejoin="round"/>`;
  if (c.glasses) s += `<g fill="#fff" fill-opacity=".25" stroke="${OL}" stroke-width="5"><circle cx="-28" cy="-8" r="24"/><circle cx="28" cy="-8" r="24"/><path d="M-4 -10 h8 M-52 -12 L-76 -18 M52 -12 L76 -18" fill="none"/></g>`;
  s += hairFront(c) + hat(c);
  return s;
}

// Person: origin at the neck base. o.full adds legs; o.pose: 'wave','mic','clip','point','up','flag','cheer'
function person(c, o = {}) {
  const st = `stroke="${OL}" stroke-width="6" stroke-linejoin="round"`;
  let s = '';
  const arm = (x0, y0, x1, y1, x2, y2) =>
    `<path d="M${x0} ${y0} Q${x1} ${y1} ${x2} ${y2}" stroke="${OL}" stroke-width="40" fill="none" stroke-linecap="round"/>
     <path d="M${x0} ${y0} Q${x1} ${y1} ${x2} ${y2}" stroke="${c.shirt}" stroke-width="28" fill="none" stroke-linecap="round"/>
     <circle cx="${x2}" cy="${y2}" r="19" fill="${c.skin}" ${st}/>`;
  if (o.full) {
    s += `<rect x="-62" y="190" width="54" height="170" rx="16" fill="#3b4566" ${st}/><rect x="8" y="190" width="54" height="170" rx="16" fill="#3b4566" ${st}/>
          <ellipse cx="-44" cy="364" rx="40" ry="18" fill="#2a2a2a" ${st}/><ellipse cx="44" cy="364" rx="40" ry="18" fill="#2a2a2a" ${st}/>`;
  }
  const pose = o.pose || '';
  const wv = Math.sin((o.t || 0) * 9) * 18;
  // back arms (drawn under torso)
  let leftArm = arm(-86, 30, -120, 110, -110, 190);
  let rightArm = arm(86, 30, 120, 110, 110, 190);
  if (pose === 'wave') rightArm = arm(86, 30, 170, -10, 150 + wv * .5, -110 + wv * .3);
  if (pose === 'cheer') { rightArm = arm(86, 30, 150, -40, 130 + wv * .3, -150); leftArm = arm(-86, 30, -150, -40, -130 - wv * .3, -150); }
  if (pose === 'point') rightArm = arm(86, 30, 170, 40, 230, -20);
  if (pose === 'flag') rightArm = arm(86, 30, 150, -20, 140, -130);
  s += `<rect x="-22" y="-40" width="44" height="50" fill="${c.skin}" ${st}/>`;
  s += leftArm + rightArm;
  s += `<path d="M-100 210 L-100 70 Q-100 0 -40 -6 L40 -6 Q100 0 100 70 L100 210 Z" fill="${c.shirt}" ${st}/>`;
  if (c.collar) s += `<path d="M-30 -6 L0 34 L30 -6 Z" fill="${c.collar}" ${st}/>`;
  if (c.tie) s += `<path d="M0 26 L-12 40 L0 130 L12 40 Z" fill="${c.tie}" ${st}/>`;
  if (c.vest) s += `<path d="M-100 210 L-100 70 Q-100 4 -42 -4 L-20 60 L-26 210 Z M100 210 L100 70 Q100 4 42 -4 L20 60 L26 210 Z" fill="${c.vest}" ${st}/>
    <path d="M-98 120 h70 M-98 160 h70 M98 120 h-70 M98 160 h-70" stroke="#e8eef5" stroke-width="12"/>`;
  if (c.lanyard) s += `<path d="M-30 -4 L-6 90 M30 -4 L6 90" stroke="${COL.teal}" stroke-width="8"/><rect x="-24" y="88" width="48" height="60" rx="6" fill="#fff" ${st}/><rect x="-14" y="98" width="28" height="22" fill="#9ab"/>`;
  if (c.logo && !c.lanyard) s += `<text x="${c.vest ? 0 : 46}" y="${c.vest ? 196 : 66}" font-family="Fredoka" font-weight="700" font-size="${c.logo.length > 6 ? 15 : 20}" fill="${c.vest ? OL : '#fff'}" text-anchor="middle">${c.logo}</text>`;
  if (c.lanyard) s += `<text x="0" y="190" font-family="Fredoka" font-weight="700" font-size="26" fill="#fff" text-anchor="middle">${c.logo}</text>`;
  // front arms with props
  if (pose === 'mic') {
    s += arm(86, 30, 120, 140, 60, 80);
    s += `<rect x="50" y="-10" width="18" height="90" rx="8" fill="#333" ${st}/><circle cx="59" cy="-22" r="24" fill="#888" ${st}/><circle cx="60" cy="80" r="19" fill="${c.skin}" ${st}/>`;
  }
  if (pose === 'clip') {
    s += arm(-86, 30, -110, 150, -20, 120);
    s += `<rect x="-60" y="40" width="96" height="124" rx="8" fill="#b9874f" ${st} transform="rotate(-8 -12 100)"/><rect x="-48" y="56" width="72" height="96" fill="#fff" transform="rotate(-8 -12 100)"/>
          <path d="M-40 80 h50 M-40 100 h50 M-40 120 h36" stroke="#9ab" stroke-width="6" transform="rotate(-8 -12 100)"/><circle cx="-20" cy="120" r="19" fill="${c.skin}" ${st}/>`;
  }
  if (pose === 'flag') {
    const fx = 140, fy = -130;
    s += `<path d="M${fx} ${fy + 20} L${fx} ${fy - 170}" stroke="${OL}" stroke-width="8"/>`;
    let cells = '';
    for (let r = 0; r < 4; r++) for (let q = 0; q < 6; q++) {
      const x = fx + q * 26, w = Math.sin((o.t || 0) * 8 + q * .9) * 8;
      cells += `<rect x="${x}" y="${fy - 170 + r * 24 + w}" width="26" height="24" fill="${(r + q) % 2 ? '#fff' : '#111'}"/>`;
    }
    s += `<g stroke="${OL}" stroke-width="2">${cells}</g>`;
  }
  s += G('translate(0,-110)', head(c, o));
  return s;
}

// ---------- vehicles ----------
function wheel(x, y, r, ang) {
  const a = ang;
  let sp = '';
  for (let i = 0; i < 3; i++) {
    const t = a + i * 2.094;
    sp += `<path d="M${x} ${y} L${(x + Math.cos(t) * r * .55).toFixed(1)} ${(y + Math.sin(t) * r * .55).toFixed(1)}" stroke="#777" stroke-width="5"/>`;
  }
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="#2a2d36" stroke="${OL}" stroke-width="5"/><circle cx="${x}" cy="${y}" r="${r * .55}" fill="#c9ced8" stroke="${OL}" stroke-width="4"/>${sp}<circle cx="${x}" cy="${y}" r="${r * .15}" fill="#555"/>`;
}

// Truss in side view. origin = deck surface at left of truss. shift: 0..1 (load moved), loose 0..1
function trussSide(t, shift = 0, loose = 0, glow = 0, straps = true) {
  const st = (w, col) => `stroke="${col}" stroke-width="${w}" fill="none" stroke-linejoin="round" stroke-linecap="round"`;
  const bot = [[30, -6], [180, -22], [330, -10], [470, -30], [600, -14]];
  const top = [[90, -150], [230, -230], [380, -270], [480, -210], [560, -120]];
  const pts = a => a.map(p => p.join(',')).join(' ');
  let diag = '';
  for (let i = 0; i < 5; i++) {
    diag += `M${bot[i][0]} ${bot[i][1]} L${top[i][0]} ${top[i][1]} `;
    if (i < 4) diag += `M${top[i][0]} ${top[i][1]} L${bot[i + 1][0]} ${bot[i + 1][1]} `;
  }
  // extra offset lump making it high and lopsided
  const lump = `M380 -270 L420 -330 L500 -320 L480 -210`;
  let s = `<path d="M${pts(bot).replace(/ /g, ' L')} M${pts(top).replace(/ /g, ' L')} ${diag} ${lump}" ${st(26, OL)}/>`;
  s += `<path d="M${pts(bot).replace(/ /g, ' L')} M${pts(top).replace(/ /g, ' L')} ${diag} ${lump}" ${st(14, COL.truss)}/>`;
  if (glow) s = `<path d="M${pts(bot).replace(/ /g, ' L')} M${pts(top).replace(/ /g, ' L')} ${diag} ${lump}" ${st(46, COL.yellow)} opacity="${glow}"/>` + s;
  const rot = -4 * shift, dx = 22 * shift, dy = -8 * shift;
  const body = G(`translate(${dx},${dy}) rotate(${rot} 300 -10)`, s);
  // straps from truss nodes to deck edges
  const anchors = [[[180, -22], [120, 22]], [[230, -230], [60, 22]], [[380, -270], [520, 22]], [[470, -30], [560, 22]]];
  let strapSvg = '';
  anchors.forEach(([a, b], i) => {
    const ax = a[0] + dx, ay = a[1] + dy;
    const sag = loose * (40 + 20 * Math.sin(t * 7 + i * 1.7));
    const mx = (ax + b[0]) / 2 + loose * 30 * Math.sin(t * 5 + i), my = (ay + b[1]) / 2 + sag;
    strapSvg += `<path d="M${ax} ${ay} Q${mx} ${my} ${b[0]} ${b[1]}" stroke="${OL}" stroke-width="11" fill="none"/><path d="M${ax} ${ay} Q${mx} ${my} ${b[0]} ${b[1]}" stroke="${COL.yellow}" stroke-width="6" fill="none"/>`;
  });
  return straps ? body + strapSvg : body;
}

// Side-view truck facing right. origin at ground, x=0 is the trailer rear. Length ~1110.
function truckSide(t, o = {}) {
  const st = `stroke="${OL}" stroke-width="6" stroke-linejoin="round"`;
  const ang = o.dist ? o.dist / 34 : 0;
  let s = '';
  s += `<ellipse cx="560" cy="4" rx="580" ry="16" fill="#000" opacity=".18"/>`;
  // trailer
  s += `<path d="M0 -60 L760 -60 L790 -120 L900 -120 L900 -92 L812 -92 L780 -40 L0 -40 Z" fill="#5a6175" ${st}/>`;
  s += `<rect x="0" y="-86" width="770" height="30" fill="#7b8399" ${st}/>`;
  s += `<text x="380" y="-62" font-family="Fredoka" font-weight="700" font-size="20" fill="#fff" text-anchor="middle">OUTBACK HEAVY HAULAGE</text>`;
  s += wheel(70, -34, 34, ang) + wheel(150, -34, 34, ang) + wheel(230, -34, 34, ang);
  // prime mover
  s += `<rect x="840" y="-110" width="290" height="40" fill="#3a3f4f" ${st}/>`;
  s += `<path d="M960 -110 L960 -300 Q960 -318 980 -318 L1080 -318 Q1100 -318 1106 -300 L1130 -200 L1140 -110 Z" fill="${COL.orange}" ${st}/>`;
  s += `<path d="M1050 -300 L1092 -300 L1112 -214 L1050 -214 Z" fill="#bfe6ff" ${st}/>`;
  if (o.driver) s += G('translate(1074,-252) scale(.3)', head(CHARS.mick, o.driver));
  s += `<path d="M1050 -300 L1092 -300 L1112 -214 L1050 -214 Z" fill="#bfe6ff" opacity=".25"/>`;
  s += `<rect x="970" y="-290" width="66" height="70" rx="6" fill="#ffb366" ${st}/><text x="1003" y="-247" font-family="Lucky" font-size="24" fill="${OL}" text-anchor="middle">OHH</text>`;
  s += `<rect x="930" y="-370" width="18" height="250" rx="6" fill="#c9ced8" ${st}/>`;
  s += `<rect x="1120" y="-160" width="34" height="56" rx="6" fill="#c9ced8" ${st}/><circle cx="1138" cy="-180" r="12" fill="#fff6b0" ${st}/>`;
  if (o.brake) s += `<circle cx="-4" cy="-72" r="16" fill="#ff2a2a" ${st}/><circle cx="-4" cy="-72" r="40" fill="#ff2a2a" opacity=".35"/>`;
  s += wheel(890, -34, 36, ang) + wheel(970, -34, 36, ang) + wheel(1090, -34, 36, ang);
  if (o.truss !== false) s += G('translate(70,-86)', trussSide(t, o.shift || 0, o.loose || 0, o.glow || 0));
  return s;
}

// Side-view bus facing left. origin ground, x=0 front. length 760
function busSide(t, o = {}) {
  const st = `stroke="${OL}" stroke-width="6" stroke-linejoin="round"`;
  const ang = -(o.dist || 0) / 32;
  let s = `<ellipse cx="380" cy="4" rx="400" ry="14" fill="#000" opacity=".18"/>`;
  s += `<path d="M10 -40 L10 -250 Q10 -300 60 -300 L730 -300 Q760 -300 760 -270 L760 -40 Z" fill="#f4f6fa" ${st}/>`;
  s += `<rect x="10" y="-120" width="750" height="26" fill="${COL.yellow}" stroke="${OL}" stroke-width="4"/>`;
  s += `<rect x="190" y="-342" width="300" height="46" rx="8" fill="${COL.yellow}" ${st}/>`;
  s += `<text x="340" y="-308" font-family="Lucky" font-size="34" fill="${OL}" text-anchor="middle">SCHOOL BUS</text>`;
  s += `<path d="M14 -270 L80 -270 L80 -140 L14 -140 Z" fill="#bfe6ff" ${st}/>`;
  if (o.driver) s += G('translate(52,-196) scale(.34)', head(CHARS.angelo, o.driver));
  const kids = ['kid1', 'kid2', 'kid3'];
  for (let i = 0; i < 6; i++) {
    const x = 110 + i * 105;
    s += `<rect x="${x}" y="-270" width="90" height="110" rx="10" fill="#bfe6ff" ${st}/>`;
    if (!(o.broken && o.broken.includes(i))) {
      const bob = Math.sin(t * 6 + i * 1.3) * 4;
      s += `<clipPath id="bw${i}${o.id || ''}"><rect x="${x}" y="-270" width="90" height="110" rx="10"/></clipPath>`;
      s += `<g clip-path="url(#bw${i}${o.id || ''})">` + G(`translate(${x + 45},${-182 + bob}) scale(.36)`, head(CHARS[kids[i % 3]], { expr: o.kidExpr || 'grin', blink: blinkAt(t, i) })) + '</g>';
    } else {
      s += `<path d="M${x + 10} -262 l30 40 l-14 30 l40 22 M${x + 70} -264 l-20 50 l30 20" stroke="${OL}" stroke-width="4" fill="none"/>`;
    }
  }
  s += `<rect x="0" y="-70" width="24" height="30" rx="4" fill="#c9ced8" ${st}/><circle cx="16" cy="-150" r="0"/>`;
  s += wheel(150, -34, 38, ang) + wheel(620, -34, 38, ang);
  if (o.scratch) s += `<path d="M90 -210 Q300 -190 560 -205 M120 -180 Q320 -170 600 -185" stroke="#888" stroke-width="5" fill="none" opacity="${o.scratch}"/>`;
  return s;
}

// Simple side car facing right. origin ground, x=0 rear, length 260
function carSide(col, ang = 0) {
  const st = `stroke="${OL}" stroke-width="5" stroke-linejoin="round"`;
  return `<path d="M0 -30 L0 -80 Q4 -96 30 -98 L70 -100 L110 -150 Q120 -158 140 -158 L196 -158 Q210 -156 220 -140 L242 -104 Q262 -100 262 -80 L262 -30 Z" fill="${col}" ${st}/>
   <path d="M118 -144 L140 -146 L140 -106 L96 -106 Z M152 -146 L196 -146 L214 -106 L152 -106 Z" fill="#bfe6ff" ${st}/>` + wheel(56, -28, 26, ang) + wheel(206, -28, 26, ang);
}

// ---------- top-down vehicles (facing +x, centred) ----------
function truckTop(o = {}) {
  const st = `stroke="${OL}" stroke-width="5" stroke-linejoin="round"`;
  let s = `<rect x="-330" y="-40" width="540" height="80" rx="8" fill="#6a7186" ${st}/>`;
  s += `<rect x="215" y="-42" width="120" height="84" rx="14" fill="${COL.orange}" ${st}/><rect x="300" y="-34" width="26" height="68" rx="6" fill="#bfe6ff" ${st}/>`;
  if (o.brake) s += `<rect x="-338" y="-36" width="12" height="16" fill="#ff2a2a"/><rect x="-338" y="20" width="12" height="16" fill="#ff2a2a"/>`;
  return s;
}
function trussTop(len = 460) {
  const h = len / 2;
  let zig = `M${-h} -26 `;
  for (let i = 0; i <= 8; i++) zig += `L${(-h + i * len / 8).toFixed(1)} ${i % 2 ? 26 : -26} `;
  const p = `M${-h} -26 L${h} -22 M${-h} 26 L${h} 30 ${zig} M60 -26 L110 -50 L170 -46 L160 -22`;
  return `<path d="${p}" stroke="${OL}" stroke-width="20" fill="none" stroke-linejoin="round" stroke-linecap="round"/><path d="${p}" stroke="${COL.truss}" stroke-width="10" fill="none" stroke-linejoin="round" stroke-linecap="round"/>`;
}
function busTop(o = {}) {
  const st = `stroke="${OL}" stroke-width="5" stroke-linejoin="round"`;
  let s = `<rect x="-160" y="-40" width="320" height="80" rx="16" fill="#f4f6fa" ${st}/>`;
  s += `<rect x="-160" y="-40" width="34" height="80" rx="14" fill="#bfe6ff" ${st}/>`;
  s += `<rect x="-90" y="-22" width="190" height="44" rx="8" fill="${COL.yellow}" ${st}/><text x="5" y="10" font-family="Lucky" font-size="24" fill="${OL}" text-anchor="middle">SCHOOL BUS</text>`;
  return s;
}
function carTop(col) {
  const st = `stroke="${OL}" stroke-width="5" stroke-linejoin="round"`;
  return `<rect x="-62" y="-30" width="124" height="60" rx="18" fill="${col}" ${st}/><rect x="6" y="-24" width="26" height="48" rx="6" fill="#bfe6ff" ${st}/><rect x="-46" y="-22" width="20" height="44" rx="6" fill="#bfe6ff" ${st}/>`;
}
function policeTop(t) {
  const on = Math.floor(t * 6) % 2;
  return carTop('#ffffff') + `<rect x="-30" y="-30" width="20" height="60" fill="${COL.navy}"/><rect x="-14" y="-22" width="14" height="20" rx="4" fill="${on ? '#ff2a2a' : '#4466ff'}"/><rect x="-14" y="2" width="14" height="20" rx="4" fill="${on ? '#4466ff' : '#ff2a2a'}"/>
    <circle cx="-7" cy="0" r="${44}" fill="${on ? '#ff2a2a' : '#4466ff'}" opacity=".18"/>`;
}

// ---------- UI pieces ----------
function burst(x, y, s, word, col = COL.yellow, rot = -8, size = 80) {
  if (s <= 0) return '';
  let pts = '';
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * Math.PI * 2, r = i % 2 ? 150 : 210 + rnd(i) * 30;
    pts += `${(Math.cos(a) * r * 1.4).toFixed(1)},${(Math.sin(a) * r * .8).toFixed(1)} `;
  }
  return popAt(x, y, s, `<polygon points="${pts}" fill="${col}" stroke="${OL}" stroke-width="8" stroke-linejoin="round"/>` + txt(0, size * .36, word, size, COL.red, { stroke: size * .1 }), rot);
}
// Rubber-stamp slam: p is linear progress 0..1 since the slam started.
function stamp(x, y, p, lines, col = COL.red, rot = -10, size = 56, w = 560) {
  if (p <= 0) return '';
  const h = lines.length * size * 1.1 + 40;
  let t2 = '';
  lines.forEach((l, i) => { t2 += txt(0, -h / 2 + 20 + size * (i + .85) * 1.08, l, size, col, { stroke: 0 }); });
  const sc = 1 + .9 * (1 - eout(clamp(p * 3.5)));
  return op(clamp(p * 6), G(`translate(${x},${y}) rotate(${rot}) scale(${sc.toFixed(3)})`, `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="14" fill="#fff" fill-opacity=".92" stroke="${col}" stroke-width="10"/><rect x="${-w / 2 + 12}" y="${-h / 2 + 12}" width="${w - 24}" height="${h - 24}" rx="8" fill="none" stroke="${col}" stroke-width="4"/>${t2}`));
}
function bubble(x, y, w, h, lines, s = 1, tail = [-80, 90], size = 40, thought = false) {
  if (s <= 0) return '';
  let t2 = '';
  lines.forEach((l, i) => { t2 += txt(0, -((lines.length - 1) * size * 1.15) / 2 + i * size * 1.15 + size * .35, l, size, OL, { font: 'Fredoka', stroke: 0, weight: 600 }); });
  const tl = thought
    ? `<circle cx="${tail[0] * .55}" cy="${h / 2 + 22}" r="16" fill="#fff" stroke="${OL}" stroke-width="6"/><circle cx="${tail[0] * .85}" cy="${h / 2 + 52}" r="10" fill="#fff" stroke="${OL}" stroke-width="5"/>`
    : `<path d="M${tail[0] - 20} ${h / 2 - 8} L${tail[0]} ${tail[1]} L${tail[0] + 30} ${h / 2 - 8}" fill="#fff" stroke="${OL}" stroke-width="6" stroke-linejoin="round"/>`;
  const body = thought
    ? `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${h / 2}" fill="#fff" stroke="${OL}" stroke-width="6"/>`
    : `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="30" fill="#fff" stroke="${OL}" stroke-width="6"/>`;
  return popAt(x, y, s, tl + body + (thought ? '' : `<path d="M${tail[0] - 14} ${h / 2 - 10} L${tail[0] + 24} ${h / 2 - 10}" stroke="#fff" stroke-width="10"/>`) + t2);
}
function card(x, y, w, h, fill, inner, s = 1, rot = 0) {
  return popAt(x, y, s, `<rect x="${-w / 2 + 10}" y="${-h / 2 + 12}" width="${w}" height="${h}" rx="26" fill="${OL}"/><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="26" fill="${fill}" stroke="${OL}" stroke-width="7"/>` + inner, rot);
}
function sunburst(cx, cy, t, c1, c2, n = 18) {
  let s = `<rect width="1920" height="1080" fill="${c1}"/>`;
  const r = 2400;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2 + t * .08, a1 = a0 + Math.PI / n;
    s += `<path d="M${cx} ${cy} L${cx + Math.cos(a0) * r} ${cy + Math.sin(a0) * r} L${cx + Math.cos(a1) * r} ${cy + Math.sin(a1) * r} Z" fill="${c2}"/>`;
  }
  return s;
}
function clockHud(x, y, label, sub, s = 1) {
  return popAt(x, y, s, `<rect x="-170" y="-60" width="340" height="120" rx="24" fill="${OL}" opacity=".85"/>
    <circle cx="-110" cy="0" r="40" fill="#fff" stroke="${COL.yellow}" stroke-width="6"/><path d="M-110 0 L-110 -28 M-110 0 L-90 8" stroke="${OL}" stroke-width="6" stroke-linecap="round"/>` +
    txt(40, 10, label, 52, '#fff', { stroke: 0 }) + txt(40, 44, sub, 24, COL.yellow, { font: 'Fredoka', stroke: 0 }));
}
function rain(t, n = 140, op2 = .5) {
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = (rnd(i) * 2200 - t * 300 * (0.8 + rnd(i + 3) * .4)) % 2200;
    const y = (rnd(i + 7) * 1200 + t * 1400 * (0.8 + rnd(i + 5) * .4)) % 1200 - 60;
    const xx = x < 0 ? x + 2200 : x;
    s += `M${xx.toFixed(0)} ${y.toFixed(0)} l-10 34 `;
  }
  return `<path d="${s}" stroke="#dfe8f5" stroke-width="3" opacity="${op2}" stroke-linecap="round"/>`;
}
function tree(x, y, s = 1, col = '#4caf50') {
  return G(`translate(${x},${y}) scale(${s})`, `<rect x="-12" y="-70" width="24" height="80" fill="#8b5a2b" stroke="${OL}" stroke-width="5"/><circle cx="0" cy="-110" r="62" fill="${col}" stroke="${OL}" stroke-width="6"/><circle cx="-30" cy="-130" r="18" fill="#fff" opacity=".15"/>`);
}
function house(x, y, col, s = 1) {
  const st = `stroke="${OL}" stroke-width="5" stroke-linejoin="round"`;
  return G(`translate(${x},${y}) scale(${s})`, `<rect x="-60" y="-80" width="120" height="80" fill="${col}" ${st}/><path d="M-76 -76 L0 -140 L76 -76 Z" fill="#c4553a" ${st}/><rect x="-14" y="-48" width="28" height="48" fill="#8b5a2b" ${st}/><rect x="-48" y="-62" width="24" height="22" fill="#bfe6ff" ${st}/><rect x="24" y="-62" width="24" height="22" fill="#bfe6ff" ${st}/>`);
}
function cloud(x, y, s = 1, col = '#fff') {
  return G(`translate(${x},${y}) scale(${s})`, `<path d="M-120 30 Q-150 30 -150 0 Q-150 -40 -100 -40 Q-90 -90 -30 -86 Q10 -130 70 -90 Q130 -100 136 -40 Q170 -30 160 10 Q156 30 120 30 Z" fill="${col}" stroke="${OL}" stroke-width="6" stroke-linejoin="round"/>`);
}
function cone(x, y, s = 1) {
  return G(`translate(${x},${y}) scale(${s})`, `<path d="M-20 0 L-6 -60 L6 -60 L20 0 Z" fill="${COL.orange}" stroke="${OL}" stroke-width="4"/><rect x="-28" y="-6" width="56" height="10" rx="3" fill="${COL.orange}" stroke="${OL}" stroke-width="4"/><path d="M-14 -24 h28" stroke="#fff" stroke-width="8"/>`);
}
