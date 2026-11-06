// Builds README.md + pixel-art assets (section headers, 1-bit icons, braille art).
// Usage: node scripts/build.js
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ASSETS = path.join(ROOT, 'assets');
const ICONS = path.join(ASSETS, 'icons');
const USER = 'EduardoLafaiety';

// ───────────────────────── ASCII name (figlet "Roman") ─────────────────────────
const NAME = [
  '                .o8                                       .o8            ',
  '               "888                                      "888            ',
  ' .ooooo.   .oooo888  oooo  oooo   .oooo.   oooo d8b  .oooo888   .ooooo.  ',
  'd88\' `88b d88\' `888  `888  `888  `P  )88b  `888""8P d88\' `888  d88\' `88b ',
  '888ooo888 888   888   888   888   .oP"888   888     888   888  888   888 ',
  '888    .o 888   888   888   888  d8(  888   888     888   888  888   888 ',
  '`Y8bod8P\' `Y8bod88P"  `V88V"V8P\' `Y888""8o d888b    `Y8bod88P" `Y8bod8P\' ',
];

// ───────────────────────── braille art: coffee cup ─────────────────────────
function cupBraille() {
  const W = 76, H = 88;
  const px = Array.from({ length: H }, () => new Array(W).fill(0));
  const set = (x, y, v = 1) => { if (x >= 0 && y >= 0 && x < W && y < H) px[y][x] = v; };

  // Draws shapes back-to-front: each shape erases what's behind it, then draws its outline.
  function shape(inside, fillFn) {
    const m = (x, y) => x >= 0 && y >= 0 && x < W && y < H && inside(x, y);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!m(x, y)) continue;
      const edge = !m(x - 1, y) || !m(x + 1, y) || !m(x, y - 1) || !m(x, y + 1);
      set(x, y, edge ? 1 : fillFn ? fillFn(x, y) : 0);
    }
  }
  const ell = (cx, cy, rx, ry) => (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;

  const CX = 34;
  shape(ell(CX, 75, 33, 7));                      // saucer
  shape(ell(CX, 75, 24, 4));                      // saucer well
  shape((x, y) => {                               // handle (ring, right side only)
    const d = Math.hypot(x - 56, y - 52);
    return x > 52 && d <= 12 && d >= 6.5;
  });
  shape((x, y) => {                               // cup body
    if (y < 34 || y > 74) return false;
    let w = 22 - (y - 34) * 0.12;
    if (y > 64) w -= (y - 64) ** 2 * 0.22;
    return Math.abs(x - CX) <= w;
  });
  shape(ell(CX, 34, 22, 5));                      // rim
  shape(ell(CX, 34.5, 18, 3), (x, y) => (x + y) % 2); // coffee, dithered

  // steam
  [CX - 10, CX, CX + 10].forEach((cx, i) => {
    for (let y = 4 + i * 2; y < 26; y++) {
      const x = Math.round(cx + 3 * Math.sin(y / 4 + i * 2));
      set(x, y); set(x + 1, y);
    }
  });

  // "</>" on the body (5x7 glyphs at 2x)
  const G = {
    '<': ['...#.', '..#..', '.#...', '#....', '.#...', '..#..', '...#.'],
    '/': ['....#', '...#.', '...#.', '..#..', '.#...', '.#...', '#....'],
    '>': ['.#...', '..#..', '...#.', '....#', '...#.', '..#..', '.#...'],
  };
  ['<', '/', '>'].forEach((ch, i) => G[ch].forEach((row, r) =>
    [...row].forEach((c, col) => {
      if (c !== '#') return;
      const x = CX - 17 + (i * 6 + col) * 2, y = 45 + r * 2;
      set(x, y); set(x + 1, y); set(x, y + 1); set(x + 1, y + 1);
    })));

  // pack into braille cells
  const bits = [[0x01, 0x08], [0x02, 0x10], [0x04, 0x20], [0x40, 0x80]];
  const lines = [];
  for (let cy = 0; cy < H; cy += 4) {
    let line = '';
    for (let cx = 0; cx < W; cx += 2) {
      let b = 0;
      for (let dy = 0; dy < 4; dy++) for (let dx = 0; dx < 2; dx++)
        if (px[cy + dy]?.[cx + dx]) b |= bits[dy][dx];
      line += String.fromCharCode(0x2800 + b);
    }
    lines.push(line.replace(/\u2800+$/, ''));
  }
  while (!lines[0]) lines.shift();
  while (!lines[lines.length - 1]) lines.pop();
  return lines;
}

// ───────────────────────── 5x7 pixel font for headers ─────────────────────────
const FONT = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '#.#.#', '.#.#.'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  3: ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
};

const sq = (x, y) => `M${x} ${y}h1v1h-1z`;

function textPath(str, x0, y0) {
  let d = '';
  [...str].forEach((ch, i) => FONT[ch].forEach((row, r) =>
    [...row].forEach((c, col) => { if (c === '#') d += sq(x0 + i * 6 + col, y0 + r); })));
  return d;
}

// Header: white card, 1px black border, hard drop shadow, blue number, highlighted label.
function header(num, label) {
  const pad = 3, sh = 2;
  const numW = num.length * 6 - 1, labW = label.length * 6 - 1;
  const innerW = numW + 6 + labW;
  const w = innerW + pad * 2 + 2, h = 7 + pad * 2 + 2;
  const lx = 1 + pad + numW + 6, ty = 1 + pad;
  const S = 3;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w + sh} ${h + sh}" width="${(w + sh) * S}" height="${(h + sh) * S}" shape-rendering="crispEdges">
<rect x="${sh}" y="${sh}" width="${w}" height="${h}" fill="#111"/>
<rect x="0" y="0" width="${w}" height="${h}" fill="#111"/>
<rect x="1" y="1" width="${w - 2}" height="${h - 2}" fill="#fff"/>
<rect x="${lx - 1}" y="${ty + 3}" width="${labW + 2}" height="4" fill="#ffc83d"/>
<rect x="${lx - 1}" y="${ty + 7}" width="${labW + 2}" height="1" fill="#111"/>
<path d="${textPath(num, 1 + pad, ty)}" fill="#1d4ed8"/>
<path d="${textPath(label, lx, ty)}" fill="#111"/>
</svg>`;
}

// ───────────────────────── 16x16 1-bit icons ─────────────────────────
const ICON_ART = {
  java: [
    '................',
    '.....#...#......',
    '....#...#.......',
    '.....#...#......',
    '....#...#.......',
    '................',
    '.###########....',
    '.###########.##.',
    '.###########..#.',
    '.###########..#.',
    '.###########.##.',
    '..#########.....',
    '...#######......',
    '................',
    '#############...',
    '................',
  ],
  spring: [
    '................',
    '..........#####.',
    '.......########.',
    '.....##########.',
    '....###########.',
    '...######..####.',
    '...####..######.',
    '..####.########.',
    '..###.#########.',
    '..##.#########..',
    '..#.#########...',
    '..#.########....',
    '.#..######......',
    '.#..............',
    '#...............',
    '................',
  ],
  postgresql: [
    '................',
    '...##########...',
    '.##..........##.',
    '.#............#.',
    '.##..........##.',
    '.#.##########.#.',
    '.#............#.',
    '.#...###.###..#.',
    '.#...#.#.#....#.',
    '.#...###.#.#..#.',
    '.#...#...#.#..#.',
    '.#...#...###..#.',
    '.#............#.',
    '.##..........##.',
    '...##########...',
    '................',
  ],
  mysql: [
    '................',
    '...##########...',
    '.##..........##.',
    '.#............#.',
    '.##..........##.',
    '.#.##########.#.',
    '.#............#.',
    '.#...#.#.#.#..#.',
    '.#...###.#.#..#.',
    '.#...#.#..#...#.',
    '.#...#.#..#...#.',
    '.#...#.#..#...#.',
    '.#............#.',
    '.##..........##.',
    '...##########...',
    '................',
  ],
  redis: [
    '................',
    '...##########...',
    '.##..........##.',
    '.#............#.',
    '.##..........##.',
    '.#.##########.#.',
    '.#............#.',
    '.#...###.##...#.',
    '.#...#.#.#.#..#.',
    '.#...##..#.#..#.',
    '.#...#.#.#.#..#.',
    '.#...#.#.##...#.',
    '.#............#.',
    '.##..........##.',
    '...##########...',
    '................',
  ],
  docker: [
    '................',
    '................',
    '.......##.......',
    '.......##.......',
    '....##.##.......',
    '....##.##.......',
    '.##.##.##.##..#.',
    '.##.##.##.##.###',
    '##############..',
    '###.##########..',
    '.#############..',
    '.###########....',
    '..#########.....',
    '....#####.......',
    '................',
    '................',
  ],
  kubernetes: [
    '................',
    '.......##.......',
    '.....######.....',
    '...##..##..##...',
    '..###..##..###..',
    '..#.##.##.##.#..',
    '.##..######..##.',
    '.######..######.',
    '.######..######.',
    '.##..######..##.',
    '..#.##.##.##.#..',
    '..###..##..###..',
    '...##..##..##...',
    '.....######.....',
    '.......##.......',
    '................',
  ],
  aws: [
    '................',
    '................',
    '................',
    '................',
    '###.#...#.###...',
    '..#.#...#.#.....',
    '###.#.#.#.###...',
    '#.#.#.#.#...#...',
    '###..#.#..###...',
    '................',
    '.#..........#.#.',
    '..##########..#.',
    '...........###..',
    '................',
    '................',
    '................',
  ],
  terraform: [
    '................',
    '.....####.......',
    '.....####.......',
    '.....####.####..',
    '.....####.####..',
    '.....####.####..',
    '.####.....####..',
    '.####.####......',
    '.####.####......',
    '.####.####......',
    '......####......',
    '......####......',
    '................',
    '................',
    '................',
    '................',
  ],
  linux: [
    '......####......',
    '.....######.....',
    '.....#.##.#.....',
    '.....######.....',
    '.....##..##.....',
    '....###..###....',
    '...##......##...',
    '...#........#...',
    '..##........##..',
    '..#..........#..',
    '..#..........#..',
    '..##........##..',
    '...##......##...',
    '..####....####..',
    '..#####..#####..',
    '................',
  ],
  kafka: [
    '................',
    '.....###........',
    '.....#.#........',
    '.....###...###..',
    '......#....#.#..',
    '......#...####..',
    '.....###.#......',
    '.....#.##.......',
    '.....###.#......',
    '......#...####..',
    '......#....#.#..',
    '.....###...###..',
    '.....#.#........',
    '.....###........',
    '................',
    '................',
  ],
  git: [
    '................',
    '....###.........',
    '....#.#.........',
    '....###....###..',
    '.....#.....#.#..',
    '.....#.....###..',
    '.....#......#...',
    '.....#.....#....',
    '.....#....#.....',
    '.....#...#......',
    '.....#..#.......',
    '.....#.#........',
    '....###.........',
    '....#.#.........',
    '....###.........',
    '................',
  ],
  github: [
    '.....######.....',
    '...##########...',
    '..##.######.##..',
    '.###..####..###.',
    '.###........###.',
    '####........####',
    '###..........###',
    '###..........###',
    '###..........###',
    '####........####',
    '.####......####.',
    '.#..###..######.',
    '..##.#....####..',
    '...##.....###...',
    '.....#....#.....',
    '................',
  ],
  linkedin: [
    '................',
    '................',
    '..###...........',
    '..###...........',
    '................',
    '..###..###.###..',
    '..###..########.',
    '..###..###..###.',
    '..###..###..###.',
    '..###..###..###.',
    '..###..###..###.',
    '..###..###..###.',
    '..###..###..###.',
    '................',
    '................',
    '................',
  ],
  email: [
    '................',
    '................',
    '................',
    '################',
    '##............##',
    '#.#..........#.#',
    '#..#........#..#',
    '#...#......#...#',
    '#....#....#....#',
    '#.....####.....#',
    '#..............#',
    '#..............#',
    '################',
    '................',
    '................',
    '................',
  ],
};

// Icon card: 16x16 art centered in a bordered square with a hard shadow.
function icon(rows) {
  let d = '';
  rows.forEach((row, r) => [...row].forEach((c, col) => { if (c === '#') d += sq(3 + col, 3 + r); }));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" shape-rendering="crispEdges">
<rect x="2" y="2" width="22" height="22" fill="#111"/>
<rect x="0" y="0" width="22" height="22" fill="#111"/>
<rect x="1" y="1" width="20" height="20" fill="#fff"/>
<path d="${d}" fill="#111"/>
</svg>`;
}

// ───────────────────────── README ─────────────────────────
function box(title, body, inner = 66) {
  const line = (s = '') => `| ${s.padEnd(inner - 2)} |`;
  const t = '(x) (-) (+)';
  const titleRow = t + title.padStart(Math.floor((inner - 2) / 2 + title.length / 2) - t.length);
  return [
    '.' + '-'.repeat(inner) + '.',
    line(titleRow),
    '|' + '-'.repeat(inner) + '|',
    line(),
    ...body.map(line),
    line(),
    "'" + '-'.repeat(inner) + "'",
  ].join('\n');
}

function hero() {
  const art = cupBraille();
  const nameTop = Math.floor((art.length - NAME.length) / 2) + 1;
  const w = NAME[0].length + 4;
  return art.map((a, i) => {
    const n = NAME[i - nameTop] ?? '';
    return (n.padEnd(w) + a).replace(/\s+$/, '');
  }).join('\n');
}

const STACK = [
  ['java', 'Java'], ['spring', 'Spring'], ['postgresql', 'PostgreSQL'], ['mysql', 'MySQL'],
  ['redis', 'Redis'], ['docker', 'Docker'], ['kubernetes', 'Kubernetes'], ['aws', 'AWS'],
  ['terraform', 'Terraform'], ['linux', 'Linux'], ['kafka', 'Kafka'], ['git', 'Git'],
];
const SOCIAL = [
  ['linkedin', 'LinkedIn', 'https://www.linkedin.com/in/eduardolafaiety/'],
  ['github', 'GitHub', `https://github.com/${USER}`],
  ['email', 'Email', 'mailto:deveducontato@gmail.com'],
];

const img = (id, alt) => `<img src="./assets/icons/${id}.svg" width="48" height="48" alt="${alt}" title="${alt}"/>`;

const ABOUT = [
  'Software Engineer focado no ecossistema Java e em backend,',
  'direto do Brasil.',
  '',
  'Construo APIs REST, microsserviços e tudo que envolve',
  'modelagem de dados, arquitetura e boas práticas.',
  '',
  'Hoje mergulhando em Cloud, containers, automação de deploy',
  'e orquestração: do commit até a produção.',
  `-@${USER}`,
];

const FOCUS = [
  'eduardo@lafaiety ~ % cat focus.log',
  '[ main  ]  Java + Spring Boot',
  '[ build ]  APIs REST & arquitetura de microsserviços',
  '[ data  ]  Modelagem e persistência de dados',
  '[ cloud ]  Docker · Kubernetes · AWS · Terraform',
  '[ next  ]  Automação de deploy & orquestração',
];

const README = `\`\`\`text
${hero()}

${box('~/about.txt', ABOUT)}
\`\`\`

<img src="./assets/h-stack.svg" alt="01 STACK"/>

${STACK.map(([id, alt]) => img(id, alt)).join('&nbsp;\n')}

<img src="./assets/h-focus.svg" alt="02 NOW BUILDING"/>

\`\`\`text
${FOCUS.join('\n')}
\`\`\`

<img src="./assets/h-contact.svg" alt="03 CONTACT"/>

${SOCIAL.map(([id, alt, href]) => `<a href="${href}">${img(id, alt)}</a>`).join('&nbsp;\n')}

\`\`\`text
eduardo@lafaiety ~ % exit
logout
Saving session...completed.

[Process completed]█
\`\`\`
`;

fs.mkdirSync(ICONS, { recursive: true });
for (const [id, rows] of Object.entries(ICON_ART)) {
  if (rows.length !== 16 || rows.some(r => r.length !== 16)) throw new Error(`icon ${id} is not 16x16`);
  fs.writeFileSync(path.join(ICONS, `${id}.svg`), icon(rows));
}
fs.writeFileSync(path.join(ASSETS, 'h-stack.svg'), header('01', 'STACK'));
fs.writeFileSync(path.join(ASSETS, 'h-focus.svg'), header('02', 'NOW BUILDING'));
fs.writeFileSync(path.join(ASSETS, 'h-contact.svg'), header('03', 'CONTACT'));
fs.writeFileSync(path.join(ROOT, 'README.md'), README);
console.log('README.md + assets gerados.');
