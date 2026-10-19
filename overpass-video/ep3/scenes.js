// The Overpass, Episode 3: The Investigation. Scene renderers for global time t.

const SC = Object.fromEntries(TL.scenes.map(s => [s.name, s]));
const PIP = { hide: ['title'], right: [] };

const MENTI = {
  menti6: { n: 6, intro: 'q6', items: [
    { c: 'q6a', q: 'Could you provide all the documents sought by the NHVR Investigator?', type: 'yn' },
    { c: 'q6b', q: 'Are you confident your records and compliance checking are up to date?', type: 'yn' },
    { c: 'q6c', qs: 40, q: "If this were prosecuted, what would you expect the Court would consider as it decides whether each party's systems and actions met their obligations under the HVNL to ensure the safety of their transport activities, as far as reasonably practicable?", type: 'mc',
      opts: [["The party's past safety record", 'past'], ['Compare to industry standards', 'comparison'], ['Effectiveness compared to the Master Code', 'effectiveness']] },
    { c: 'q6d', qs: 46, q: 'Does “reasonably practicable” scale? What difference would it make if Ironclad is a 4-truck family operation vs a 40-truck operator?', type: 'mc',
      opts: [['None', 'none'], ['Small operator not expected to have sophisticated systems and resources', 'small'], ['Larger operator expected to have more sophisticated systems and apply more resources', 'larger']] },
    { c: 'q6e', q: 'Are you surprised that Ironclad has a duty?', type: 'yn' },
  ] },
};

// Full-screen hand-over to a live presenter at the event.
function overCard(t, t0, name, sub) {
  if (t < t0 - .2) return '';
  const sc = TL.scenes.find(s => t >= s.start && t < s.end);
  const p = pop(t, t0 - .2, .5), frac = Math.max(0, sc.end - t) / (sc.end - t0), ang = 2 * Math.PI * frac;
  return op(clamp((t - t0 + .2) * 3) * .55, `<rect width="1920" height="1080" fill="#11142a"/>`) +
    popAt(960, 470, p, `<rect x="-620" y="-200" width="1240" height="400" rx="50" fill="${COL.red}" stroke="${OL}" stroke-width="10"/>` +
      `<g transform="translate(-460,0)"><rect x="-34" y="-110" width="68" height="130" rx="34" fill="#ddd" stroke="${OL}" stroke-width="7"/><path d="M-60 -10 Q-60 60 0 60 Q60 60 60 -10" stroke="${OL}" stroke-width="8" fill="none"/><path d="M0 60 V110 M-40 110 H40" stroke="${OL}" stroke-width="8"/></g>` +
      txt(90, -40, 'OVER TO', 70, COL.yellow, { stroke: 0 }) + txt(90, 70, name.toUpperCase(), 120, '#fff', { stroke: 0 }) + txt(90, 140, sub, 38, '#ffe0e8', { font: 'Fredoka', stroke: 0, weight: 700 })) +
    popAt(960, 860, p, `<rect x="-330" y="-56" width="660" height="112" rx="56" fill="#fff" stroke="${OL}" stroke-width="7"/>` +
      `<circle cx="-260" cy="0" r="38" fill="#eee" stroke="${OL}" stroke-width="5"/><path d="M-260 0 L-260 -38 A38 38 0 ${ang > Math.PI ? 1 : 0} 1 ${-260 + 38 * Math.sin(ang)} ${-38 * Math.cos(ang)} Z" fill="${COL.yellow}"/>` +
      `<rect x="-274" y="-16" width="10" height="32" fill="${OL}"/><rect x="-256" y="-16" width="10" height="32" fill="${OL}"/>` + txt(40, 16, 'PAUSE THE VIDEO', 48, OL, { stroke: 0 }));
}

function sTitle(t) {
  const l = t - SC.title.start;
  let s = skyGrad('tsky', '#7fd0ff', '#d9f3ff') + `<rect width="1920" height="1080" fill="url(#tsky)"/>`;
  s += `<circle cx="1650" cy="200" r="110" fill="${COL.yellow}" stroke="${OL}" stroke-width="7"/>` + cloud(300 + l * 20, 180, .9) + cloud(1100 - l * 15, 120, .7);
  s += `<path d="M0 760 Q300 600 640 720 Q1000 590 1340 720 Q1640 620 1920 700 L1920 1080 L0 1080 Z" fill="#8fd27e" stroke="${OL}" stroke-width="7"/>`;
  s += `<rect x="0" y="820" width="1920" height="160" fill="${COL.road}" stroke="${OL}" stroke-width="7"/><path d="M0 900 H1920" stroke="#fff" stroke-width="8" stroke-dasharray="70 50"/>`;
  // Steve strolls in with his magnifying glass
  const sx = lerp(-200, 1500, prog(t, SC.title.start + .3, 5));
  s += G(`translate(${sx},${640 + Math.abs(Math.sin(l * 7)) * -8}) scale(.55)`, person(CHARS.steve, { full: true, pose: 'clip', blink: blinkAt(t), expr: 'focus', lx: 1 }));
  s += popAt(960, 330, pop(t, SC.title.start + .5, .7), txt(0, 0, 'THE OVERPASS', 210, COL.yellow, { stroke: 30 }), Math.sin(l * 2.2) * 2);
  s += popAt(960, 470, pop(t, SC.title.start + 1.3), `<rect x="-480" y="-50" width="960" height="96" rx="20" fill="${COL.teal}" stroke="${OL}" stroke-width="6"/>` + txt(0, 22, 'EPISODE 3: THE INVESTIGATION', 54, '#fff'), -2);
  s += op(clamp((l - 2.4) * 2), txt(960, 1050, 'SARTA  •  NHVR  •  KJK LEGAL', 34, '#fff', { font: 'Fredoka', stroke: 6, weight: 700 }));
  return s;
}

function sStage4(t) {
  let s = room('nhvr', t);
  s += stageChip(t, C('m_s4'), 4, 'THE INVESTIGATION');
  const rp = pop(t, C('m_s4b') - .2);
  const ring = Math.sin(t * 40) * 6 * (t > C('m_s4b') && t < SC.stage4.end ? 1 : 0);
  s += popAt(700, 560, rp, `<g transform="rotate(${ring})"><rect x="-200" y="-110" width="400" height="220" rx="40" fill="${COL.red}" stroke="${OL}" stroke-width="8"/><rect x="-150" y="-180" width="300" height="90" rx="45" fill="${COL.red}" stroke="${OL}" stroke-width="8"/>` +
    [0, 1, 2].map(r => [0, 1, 2].map(c => `<circle cx="${-80 + c * 80}" cy="${-40 + r * 50}" r="16" fill="#fff"/>`).join('')).join('') + `</g>` +
    `<path d="M240 -100 q40 40 0 80 M280 -140 q70 80 0 160" stroke="${OL}" stroke-width="8" fill="none" opacity="${ring ? 1 : 0}"/>`);
  s += popAt(1300, 560, pop(t, W('m_s4b', 'notified')), `<rect x="-280" y="-120" width="560" height="240" rx="24" fill="#fff" stroke="${OL}" stroke-width="8"/>` + txt(0, -40, 'INCIDENT', 64, COL.red, { stroke: 0 }) + txt(0, 40, 'NOTIFIED', 64, COL.navy, { stroke: 0 }), 3);
  return s;
}

function sSteve(t) {
  let s = room('nhvr', t);
  s += G('translate(480,560) scale(.85)', person(CHARS.steve, { full: true, pose: 'clip', blink: blinkAt(t), expr: 'focus' }));
  // magnifying glass bob
  s += G(`translate(${700 + Math.sin(t * 2) * 20},${380 + Math.cos(t * 2) * 10}) rotate(-30)`, `<circle r="60" fill="#d6f1ff" fill-opacity=".5" stroke="${OL}" stroke-width="12"/><rect x="-10" y="60" width="20" height="90" rx="8" fill="#8b5a2b" stroke="${OL}" stroke-width="6"/>`);
  s += chip(1000, 300, pop(t, W('m_s4c', 'thorough')), 'THOROUGH', COL.teal, 400, 52, -3);
  s += chip(1460, 300, pop(t, W('m_s4c', 'considered')), 'CONSIDERED', COL.navy, 440, 52, 3);
  const words = [['PAPERWORK', 'paperwork'], ['RECORDS', 'records'], ['DOCUMENTS', 'documentation']];
  words.forEach(([lab, w], i) => {
    const p = pop(t, W('m_s4c', w));
    s += popAt(1150 + i * 270, 640 - i * 20, p, G('scale(.75)', doc(lab, 5)), (i - 1) * 5);
  });
  s += stamp(1420, 450, prog(t, W('m_s4c', 'before') - .1, .7), ['DOCUMENTS FIRST!'], COL.red, -6, 56, 600);
  return s;
}

// The evidence board: what Steve asks for, filed by who holds it.
const EVID = [
  ['IRONCLAD', '#8a94a8', [['Fabrication drawings & specs', 's1b', 'drawings'], ['File notes / meeting minutes', 's1b', 'file'], ['Transport procedures for large indivisible items', 's1c', 'procedures'], ['Risk assessments: restraint method & points', 's1c', 'risk'], ['Loading plan', 's1d', 'Ironclad']]],
  ['MERIDIAN', '#3c9a3c', [['Loading plan', 's1d', 'Meridian'], ['Procurement policy / transporter due diligence', 's1g', 'procurement'], ['Driver training records & policies', 's1h', 'records']]],
  ['OUTBACK', COL.orange, [['Driver allocation records', 's1e', 'allocation'], ['Journey plans', 's1e', 'journey'], ['Hazard notification', 's1e', 'hazard'], ['Risk registers', 's1e', 'risk'], ["Mick's licence & employment record", 's1e', 'licence'],
    ['Telemetry speed reports', 's1f', 'telemetry'], ['Work Diaries: incident day + week before', 's1f', 'work'], ['Compliance monitoring reports', 's1f', 'compliance'], ['Truck maintenance records', 's1f', 'maintenance'], ['Driver training records & policies', 's1h', 'Haulage']]],
  ['MICK', '#d9822b', [['Phone records', 's1i', 'phone']]],
];
function board(t, status) {
  let s = `<rect x="795" y="90" width="1110" height="840" rx="20" fill="#c9a26b" stroke="${OL}" stroke-width="8"/>` + txt(1350, 150, 'EVIDENCE REQUESTED', 52, COL.navy, { stroke: 8, strokeCol: '#fff' });
  EVID.forEach(([name, col, items], ci) => {
    const x0 = 810 + ci * 272;
    s += `<rect x="${x0}" y="180" width="262" height="735" rx="12" fill="#f5efe2" stroke="${OL}" stroke-width="5"/><rect x="${x0}" y="180" width="262" height="56" rx="12" fill="${col}" stroke="${OL}" stroke-width="5"/>` + txt(x0 + 131, 220, name, 32, '#fff', { stroke: 0 });
    items.forEach(([lab, cid, w], i) => {
      const lines = wrap(lab, 20), y = 246 + i * 66;
      s += popAt(x0 + 131, y + 30, pop(t, W(cid, w) - .1), `<rect x="-122" y="-30" width="244" height="60" rx="8" fill="#fff" stroke="${OL}" stroke-width="3"/><rect x="-122" y="-30" width="10" height="60" fill="${col}"/>` +
        lines.slice(0, 2).map((ln, j) => txt(6, (lines.length > 1 ? -5 : 8) + j * 24, ln, 21, OL, { font: 'Fredoka', stroke: 0, weight: 600 })).join(''));
    });
    if (status) s += status(ci, x0);
  });
  return s;
}
function sEvidence(t) {
  let s = interview(t, 'evidence', 'steve', []);
  const bp = pop(t, C('s1a') - .2, .6);
  s += popAt(1320, 535, bp, G('translate(-1320,-535)', board(t)));
  return s;
}
function sMostly(t) {
  let s = interview(t, 'mostly', 'steve', []);
  const at = (w) => W('s2', w);
  s += op(t > CE('iq_s2') - .3 ? 1 : 0, board(1e9, (ci, x0) => {
    if (ci === 0) return stamp(x0 + 131, 560, prog(t, at('Mostly') - .1, .7), ['PROVIDED'], COL.teal, -12, 40, 240);
    if (ci === 1) return stamp(x0 + 131, 520, prog(t, at('Meridian') - .1, .7), ['LAWYERS', 'FIRST'], COL.red, 10, 40, 240);
    if (ci === 2) return stamp(x0 + 131, 560, prog(t, at('Outback') - .1, .7), ['LAWYERS', 'FIRST'], COL.red, -8, 40, 240);
    return '';
  }));
  return s;
}

function lawOffice(t) {
  const st = `stroke="${OL}" stroke-width="6" stroke-linejoin="round"`;
  let s = `<rect x="960" y="0" width="960" height="1080" fill="#e8dcc8"/><rect x="960" y="780" width="960" height="300" fill="#7b5a3a" stroke="${OL}" stroke-width="6"/>`;
  for (let r = 0; r < 3; r++) { s += `<rect x="1020" y="${120 + r * 150}" width="400" height="20" fill="#7b5a3a" ${st}/>`; for (let b = 0; b < 9; b++) s += `<rect x="${1030 + b * 42}" y="${40 + r * 150}" width="34" height="80" fill="${['#8a2b2b', '#2b4a8a', '#2b6a3a', '#a07a2a'][(b + r) % 4]}" stroke="${OL}" stroke-width="3"/>`; }
  s += `<rect x="1500" y="110" width="360" height="110" rx="14" fill="${COL.navy}" ${st}/>` + txt(1680, 182, 'KJK LEGAL', 54, COL.yellow, { stroke: 0 });
  s += `<rect x="1060" y="640" width="780" height="60" fill="#8b5a2b" ${st}/><rect x="1100" y="700" width="40" height="100" fill="#6b4220" ${st}/><rect x="1760" y="700" width="40" height="100" fill="#6b4220" ${st}/>`;
  return s;
}
function sOliver(t) {
  let s = room('depot', t);
  s += `<clipPath id="lhalf"><rect width="960" height="1080"/></clipPath>`;
  s = `<g clip-path="url(#lhalf)">${s}</g>` + lawOffice(t) + `<path d="M960 0 V1080" stroke="${OL}" stroke-width="10"/>`;
  s += G(`translate(470,${600 + Math.sin(t * 2) * 3}) scale(1.3)`, person(CHARS.rachel, { pose: 'phone', blink: blinkAt(t), expr: 'worried', mouth: t > C('m_ol') + 1.2 && t < E.over.oliver ? Math.abs(Math.sin(t * 9)) * .5 : 0 }));
  // ringing phone on the KJK desk + nameplate
  const ring = t < W('m_ol', 'told') ? Math.sin(t * 40) * 5 : 0;
  s += G(`translate(1300,600) rotate(${ring})`, `<rect x="-90" y="-30" width="180" height="70" rx="20" fill="#333" stroke="${OL}" stroke-width="6"/><rect x="-110" y="-70" width="220" height="50" rx="25" fill="#333" stroke="${OL}" stroke-width="6"/>`);
  s += `<rect x="1520" y="580" width="260" height="60" rx="8" fill="#d4af37" stroke="${OL}" stroke-width="5"/>` + txt(1650, 622, 'OLIVER', 36, OL, { stroke: 0 });
  s += popAt(960, 300, pop(t, W('m_ol', 'Rachel')), `<path d="M-340 0 Q0 -120 340 0" stroke="${COL.yellow}" stroke-width="10" fill="none" stroke-dasharray="20 16" stroke-dashoffset="${-t * 80}"/>` +
    `<rect x="-170" y="-140" width="340" height="80" rx="40" fill="${COL.yellow}" stroke="${OL}" stroke-width="6"/>` + txt(0, -86, 'CALLING…', 44, OL, { stroke: 0 }));
  s += popAt(1420, 820, pop(t, W('m_ol', 'advice')), `<rect x="-420" y="-90" width="840" height="180" rx="24" fill="#fff" stroke="${OL}" stroke-width="7"/>` +
    txt(0, -20, 'WHAT ADVICE DO YOU GIVE?', 48, COL.navy, { stroke: 0 }) + txt(0, 44, '…including about providing the records', 34, '#555', { font: 'Fredoka', stroke: 0, weight: 700 }), -2);
  return s + overCard(t, E.over.oliver, 'Oliver', 'KJK Legal');
}

function court(t) {
  const st = `stroke="${OL}" stroke-width="6" stroke-linejoin="round"`;
  let s = skyGrad('csky', '#9fd8ff', '#e6f6ff') + `<rect width="1920" height="1080" fill="url(#csky)"/>`;
  s += `<path d="M1000 260 L1450 90 L1900 260 Z" fill="#e8e2d0" ${st}/><rect x="1000" y="260" width="900" height="50" fill="#e8e2d0" ${st}/>`;
  for (let i = 0; i < 6; i++) s += `<rect x="${1040 + i * 150}" y="310" width="60" height="420" fill="#f4efe2" ${st}/>`;
  s += `<rect x="980" y="730" width="940" height="50" fill="#d8d0bc" ${st}/>` + txt(1450, 220, 'COURT', 60, COL.navy, { stroke: 0 });
  s += `<rect x="0" y="780" width="1920" height="300" fill="#c9c2b0" stroke="${OL}" stroke-width="6"/>`;
  return s;
}
function sProsecutor(t) {
  let s = court(t);
  const promo = W('m_pr', 'promotion');
  s += G(`translate(560,${560 - Math.abs(Math.sin(t * 6)) * (t > promo && t < promo + 2 ? 20 : 0)}) scale(.85)`, person(CHARS.steve, { full: true, pose: t > promo ? 'cheer' : 'clip', t, blink: blinkAt(t), expr: t > promo ? 'grin' : 'focus' }));
  s += popAt(560, 640, pop(t, promo), `<path d="M-70 -50 L70 100" stroke="${COL.red}" stroke-width="30"/><path d="M-70 -50 L70 100" stroke="${COL.yellow}" stroke-width="6" stroke-dasharray="12 10"/>` +
    `<circle cx="-36" cy="-12" r="30" fill="${COL.yellow}" stroke="${OL}" stroke-width="5"/>` + txt(-36, 0, '★', 30, OL, { stroke: 0 }));
  s += chip(560, 120, pop(t, promo + .2), 'NHVR PROSECUTOR', COL.teal, 640, 56, -3);
  const cp = t - promo;
  if (cp > 0 && cp < 4) for (let i = 0; i < 70; i++) {
    const x = rnd(i) * 1920, y = -40 + cp * (220 + rnd(i + 1) * 260) - rnd(i + 2) * 300;
    if (y > -40 && y < 1080) s += `<rect x="${x}" y="${y}" width="16" height="26" fill="${[COL.yellow, COL.red, COL.teal, '#fff'][i % 4]}" transform="rotate(${cp * 300 + i * 40} ${x + 8} ${y + 13})"/>`;
  }
  s += popAt(1280, 520, pop(t, W('m_pr', 'charges')), `<rect x="-380" y="-120" width="760" height="240" rx="24" fill="#fff" stroke="${OL}" stroke-width="8"/>` +
    txt(0, -30, 'WHAT CHARGES', 60, COL.navy, { stroke: 0 }) + txt(0, 50, 'MIGHT YOU LAY?', 60, COL.navy, { stroke: 0 }), 2);
  s += stamp(1280, 740, prog(t, W('m_pr', 'hypothetically') - .1, .7), ['HYPOTHETICALLY'], COL.red, -6, 56, 600);
  return s + overCard(t, E.over.prosecutor, 'Steven', 'Hypothetical charges');
}

function sChris(t) {
  const st = `stroke="${OL}" stroke-width="6" stroke-linejoin="round"`;
  let s = `<rect width="1920" height="1080" fill="#3b2a20"/>`;
  for (let r = 0; r < 4; r++) { s += `<rect x="0" y="${200 + r * 170}" width="1920" height="24" fill="#6b4220" ${st}/>`; for (let b = 0; b < 46; b++) s += `<rect x="${10 + b * 42}" y="${110 + r * 170}" width="34" height="90" fill="${['#8a2b2b', '#2b4a8a', '#2b6a3a', '#a07a2a', '#5a2b6a'][(b * 3 + r) % 5]}" stroke="${OL}" stroke-width="3"/>`; }
  s += `<rect x="0" y="800" width="1920" height="280" fill="#6b4220" stroke="${OL}" stroke-width="6"/>`;
  // barrister's wig on a stand
  s += G('translate(450,600)', `<rect x="-10" y="40" width="20" height="160" fill="#333" ${st}/><ellipse cx="0" cy="200" rx="70" ry="16" fill="#333" ${st}/>` +
    `<path d="M-90 40 Q-100 -90 0 -100 Q100 -90 90 40 Z" fill="#f0eee8" ${st}/>` + [-60, -30, 0, 30, 60].map(x => `<circle cx="${x}" cy="-60" r="16" fill="#f0eee8" stroke="${OL}" stroke-width="4"/>`).join('') +
    `<path d="M-80 30 q-10 30 0 60 M80 30 q10 30 0 60" stroke="${OL}" stroke-width="12" fill="none"/>`);
  s += txt(450, 870, 'CHRIS', 48, COL.yellow, { stroke: 6 }) + txt(450, 910, 'Barrister', 30, '#fff', { font: 'Fredoka', stroke: 0, weight: 700 });
  // phone notifications
  const pp = pop(t, C('m_ch') + .2);
  let ph = `<rect x="-200" y="-330" width="400" height="660" rx="50" fill="${OL}"/><rect x="-175" y="-290" width="350" height="580" rx="20" fill="#e9eef7"/>` + txt(0, -240, '9:41', 34, OL, { stroke: 0 });
  ph += popAt(0, -150, pop(t, W('m_ch', 'voice')), `<rect x="-160" y="-60" width="320" height="120" rx="18" fill="#fff" stroke="${OL}" stroke-width="4"/>` +
    txt(-140, -18, 'Voicemail', 26, COL.teal, { anchor: 'start', font: 'Fredoka', stroke: 0, weight: 700 }) + txt(-140, 20, 'Oliver · KJK Legal', 26, OL, { anchor: 'start', font: 'Fredoka', stroke: 0, weight: 700 }) + txt(-140, 48, '▶ 0:42', 22, '#777', { anchor: 'start', font: 'Fredoka', stroke: 0 }));
  ph += popAt(0, 0, pop(t, W('m_ch', 'Aryav')), `<rect x="-160" y="-60" width="320" height="120" rx="18" fill="#fff" stroke="${OL}" stroke-width="4"/>` +
    txt(-140, -18, 'Missed call', 26, COL.red, { anchor: 'start', font: 'Fredoka', stroke: 0, weight: 700 }) + txt(-140, 20, 'Aryav Nair', 26, OL, { anchor: 'start', font: 'Fredoka', stroke: 0, weight: 700 }) + txt(-140, 48, 'Meridian Construction', 22, '#777', { anchor: 'start', font: 'Fredoka', stroke: 0 }));
  s += popAt(860, 480, pp, ph, Math.sin(t * 30) * (t < W('m_ch', 'voice') ? 2 : 0));
  // who to talk to
  const who = [['OLIVER', 'KJK Legal', COL.navy, 'Oliver'], ['THE DEFENDANTS', 'given the charges', COL.orange, 'defendants'], ['THE NHVR', 'the prosecutor', COL.teal, 'N']];
  s += popAt(1500, 160, pop(t, C('m_ch2')), txt(0, 0, 'WHAT DISCUSSION DO YOU HAVE WITH…', 40, '#fff', { stroke: 6 }));
  who.forEach(([a, b, col, w], i) => s += popAt(1500, 300 + i * 180, pop(t, W('m_ch2', w, w === 'N' ? 0 : 0) - .1), `<rect x="-330" y="-70" width="660" height="140" rx="30" fill="${col}" stroke="${OL}" stroke-width="7"/>` +
    txt(0, -6, a, 54, '#fff', { stroke: 0 }) + txt(0, 44, b, 30, '#fff', { font: 'Fredoka', stroke: 0, weight: 700 }), (i - 1) * 2));
  return s + overCard(t, E.over.chris, 'Chris', 'Barrister');
}

function sEnd(t) {
  const sc = SC.end, l = t - sc.start;
  let s = `<rect width="1920" height="1080" fill="#151a33"/><ellipse cx="960" cy="520" rx="${700 + Math.sin(l) * 20}" ry="440" fill="#26315c"/>`;
  s += popAt(960, 330, pop(t, sc.start + .3), txt(0, 0, 'THE OVERPASS', 150, COL.yellow));
  s += popAt(960, 450, pop(t, sc.start + .8), txt(0, 0, 'Episode 3: The Investigation', 54, '#fff', { font: 'Fredoka', stroke: 0, weight: 700 }));
  s += popAt(960, 620, pop(t, W('m_end', 'continued')), `<rect x="-470" y="-70" width="940" height="140" rx="30" fill="${COL.red}" stroke="${OL}" stroke-width="8"/>` + txt(0, 26, 'TO BE CONTINUED…', 84, '#fff'), Math.sin(l * 3) * 2);
  s += op(clamp((t - CE('m_end')) * 2), txt(960, 760, 'A joint production by SARTA • the NHVR • KJK Legal', 36, '#cfd6ea', { font: 'Fredoka', stroke: 0 }) + txt(960, 810, 'The scenario and characters are fictional.', 30, '#9aa4c0', { font: 'Fredoka', stroke: 0 }));
  ['vince', 'aryav', 'rachel', 'mick', 'angelo', 'steve'].forEach((k, i) => s += popAt(260 + i * 280, 1010, pop(t, sc.start + .5 + i * .12), G('scale(.42)', person(CHARS[k], { pose: 'wave', t: t + i, blink: blinkAt(t, i) }))));
  return s;
}

const RENDER = {
  title: sTitle, stage4: sStage4, steve: sSteve, evidence: sEvidence, mostly: sMostly, oliver: sOliver,
  menti6: t => mentiScene('menti6', t), prosecutor: sProsecutor, chris: sChris, end: sEnd,
};
