/* ==========================================================================
   Fernhill Realty: art.js
   Draws the listing pictures, the hero scene, the map and the agent avatars
   as SVG, so the site works without any photo files.

   To use a real photo for a listing, add  photo: 'photos/your-file.jpg'  to
   that listing in listings.js. The drawing is only the fallback.
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- helpers ---------- */
  function rng(seed) {                     // small seeded random, so every drawing is stable
    let t = (seed >>> 0) || 1;
    return function () {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  const r1 = n => Math.round(n * 10) / 10;
  const uri = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  let uidN = 0;

  /* ---------- light: day, dusk and mist ---------- */
  const SKY = {
    day:  { top: '#cfe0b4', mid: '#eef0c0', hor: '#fff3b0', sun: '#ffde42', sunY: 118, hill1: '#b9c78c', hill2: '#9bb06a', hill3: '#7f9650', ground: '#93aa5e', ground2: '#7d944b', shade: 'rgba(49,62,23,.26)', glass: '#cfe3d6', leaf1: '#6f8d3f', leaf2: '#8aa851', trunk: '#5a4026', cloud: '#ffffff', cloudOp: .8, path: '#e4dcb4', lit: 0, water: '#a8cbc4', water2: '#8db9b2' },
    dusk: { top: '#1b0c0c', mid: '#4c5c2d', hor: '#e8b83a', sun: '#ffde42', sunY: 300, hill1: '#5a6a35', hill2: '#425125', hill3: '#2f3b17', ground: '#2c3615', ground2: '#222b10', shade: 'rgba(0,0,0,.4)', glass: '#2d3b31', leaf1: '#34431b', leaf2: '#2a3811', trunk: '#2a1b0c', cloud: '#d8bd52', cloudOp: .28, path: '#6d6a45', lit: 1, water: '#274242', water2: '#1c3434' },
    mist: { top: '#dfe7d6', mid: '#eceee0', hor: '#f6f2d8', sun: '#fff3b0', sunY: -200, hill1: '#c3cfa4', hill2: '#acbb88', hill3: '#93a56d', ground: '#9db26e', ground2: '#88a05a', shade: 'rgba(49,62,23,.22)', glass: '#d6e4dc', leaf1: '#7f9d56', leaf2: '#9bb673', trunk: '#66503a', cloud: '#ffffff', cloudOp: .7, path: '#e8e2c0', lit: 0, water: '#b6d2cc', water2: '#9cc2ba' }
  };

  /* ---------- small drawing parts ---------- */
  function win(c, x, y, w, h, o) {
    o = o || {};
    const P = c.P, trim = o.trim || c.S.trim;
    const lit = P.lit && (o.lit === undefined ? c.rand() > 0.25 : o.lit);
    let s = '';
    if (lit) s += `<rect x="${x - 7}" y="${y - 7}" width="${w + 14}" height="${h + 14}" rx="9" fill="#ffde42" opacity=".16"/>`;
    if (o.arch) {
      const rr = w / 2;
      const shape = `M${x} ${y + h}V${y + rr}A${rr} ${rr} 0 0 1 ${x + w} ${y + rr}V${y + h}Z`;
      s += `<path d="${shape}" fill="${lit ? '#ffd84a' : P.glass}" stroke="${trim}" stroke-width="4"/>`;
      if (!lit) s += `<path d="M${x + 4} ${y + h}L${x + w * .55} ${y + rr * .6}L${x + w * .85} ${y + rr * .9}L${x + w * .35} ${y + h}Z" fill="#fff" opacity=".26"/>`;
      s += `<path d="M${x + w / 2} ${y}V${y + h}M${x} ${y + h * .55}H${x + w}" stroke="${trim}" stroke-width="2"/>`;
      return s;
    }
    s += `<rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" rx="2" fill="${trim}"/>`;
    s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${lit ? '#ffd84a' : P.glass}"/>`;
    if (lit) s += `<rect x="${x}" y="${y}" width="${w}" height="${h * .5}" fill="#fff6b8" opacity=".55"/>`;
    else s += `<path d="M${x} ${y + h}L${x + w * .55} ${y}L${x + w * .85} ${y}L${x + w * .3} ${y + h}Z" fill="#fff" opacity=".28"/>`;
    if (o.grid !== false) s += `<path d="M${x + w / 2} ${y}V${y + h}M${x} ${y + h / 2}H${x + w}" stroke="${trim}" stroke-width="2"/>`;
    return s;
  }

  function door(c, x, y, w, h, color, arch) {
    const S = c.S;
    let s = '';
    if (arch) {
      const rr = w / 2;
      s += `<path d="M${x} ${y + h}V${y + rr}A${rr} ${rr} 0 0 1 ${x + w} ${y + rr}V${y + h}Z" fill="${color}"/>`;
    } else {
      s += `<rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 3}" fill="${S.trim}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}"/>`;
    }
    s += `<path d="M${x + w * .22} ${y + h * .12}h${w * .56}v${h * .34}h${-w * .56}zM${x + w * .22} ${y + h * .56}h${w * .56}v${h * .32}h${-w * .56}z" fill="none" stroke="#000" stroke-opacity=".22" stroke-width="1.5"/>`;
    s += `<circle cx="${x + w * .8}" cy="${y + h * .55}" r="2.2" fill="#ffde42"/>`;
    return s;
  }

  function tree(c, x, base, s) {
    const P = c.P;
    return `<rect x="${x - 5 * s}" y="${base - 64 * s}" width="${10 * s}" height="${64 * s}" fill="${P.trunk}"/>` +
      `<circle cx="${x}" cy="${base - 100 * s}" r="${46 * s}" fill="${P.leaf1}"/>` +
      `<circle cx="${x - 30 * s}" cy="${base - 72 * s}" r="${33 * s}" fill="${P.leaf1}"/>` +
      `<circle cx="${x + 31 * s}" cy="${base - 74 * s}" r="${35 * s}" fill="${P.leaf1}"/>` +
      `<circle cx="${x - 12 * s}" cy="${base - 112 * s}" r="${24 * s}" fill="${P.leaf2}" opacity=".8"/>` +
      `<circle cx="${x + 22 * s}" cy="${base - 84 * s}" r="${18 * s}" fill="${P.leaf2}" opacity=".6"/>`;
  }

  function pine(c, x, base, s) {
    const P = c.P;
    let o = `<rect x="${x - 4 * s}" y="${base - 26 * s}" width="${8 * s}" height="${26 * s}" fill="${P.trunk}"/>`;
    [[0, 70, 44], [-34, 62, 36], [-66, 52, 28]].forEach((t, i) => {
      const y0 = base - 20 * s + t[0] * s;
      o += `<path d="M${x - t[1] * s * .62} ${y0}L${x} ${y0 - t[2] * s * 1.9}L${x + t[1] * s * .62} ${y0}Z" fill="${i % 2 ? P.leaf2 : P.leaf1}"/>`;
    });
    return o;
  }

  function shrub(c, x, y, s) {
    const P = c.P;
    return `<ellipse cx="${x}" cy="${y}" rx="${26 * s}" ry="${17 * s}" fill="${P.leaf1}"/><ellipse cx="${x - 8 * s}" cy="${y - 5 * s}" rx="${16 * s}" ry="${10 * s}" fill="${P.leaf2}" opacity=".75"/>`;
  }

  function flowers(c, x0, x1, y, rand) {
    let o = '';
    const cols = c.P.lit ? ['#e8c84a', '#f4ecc4'] : ['#ffde42', '#ffffff', '#f4a06b'];
    for (let x = x0; x < x1; x += 11 + rand() * 9) o += `<circle cx="${r1(x)}" cy="${r1(y + rand() * 12)}" r="${r1(2 + rand() * 1.8)}" fill="${cols[Math.floor(rand() * cols.length)]}"/>`;
    return o;
  }

  function cloud(x, y, s, P) {
    return `<g opacity="${P.cloudOp}" fill="${P.cloud}"><ellipse cx="${x}" cy="${y}" rx="${46 * s}" ry="${12 * s}"/><ellipse cx="${x + 26 * s}" cy="${y - 9 * s}" rx="${28 * s}" ry="${12 * s}"/><ellipse cx="${x - 22 * s}" cy="${y - 6 * s}" rx="${22 * s}" ry="${9 * s}"/></g>`;
  }

  function hill(y0, amp, freq, phase, fill) {
    let d = `M0 ${y0}`;
    for (let x = 0; x <= 640; x += 16) d += `L${x} ${r1(y0 - amp * Math.sin(freq * x + phase) - amp * .5 * Math.sin(2.3 * freq * x + phase * 1.7))}`;
    return `<path d="${d}V380H0Z" fill="${fill}"/>`;
  }

  /* ---------- sky, hills and lawn ---------- */
  function backdrop(c, ground) {
    const P = c.P, id = c.id, rand = c.rand;
    const sunX = c.spec.sunX || (rand() < .5 ? 118 : 520);
    let defs = `<linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.top}"/><stop offset=".55" stop-color="${P.mid}"/><stop offset="1" stop-color="${P.hor}"/></linearGradient>` +
      `<radialGradient id="${id}g"><stop offset="0" stop-color="${P.sun}" stop-opacity=".85"/><stop offset="1" stop-color="${P.sun}" stop-opacity="0"/></radialGradient>` +
      `<linearGradient id="${id}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${ground === 'water' ? P.water : P.ground}"/><stop offset="1" stop-color="${ground === 'water' ? P.water2 : P.ground2}"/></linearGradient>`;
    let s = `<rect width="640" height="480" fill="url(#${id}s)"/>`;
    if (c.time === 'dusk') {
      for (let i = 0; i < 22; i++) s += `<circle cx="${r1(rand() * 640)}" cy="${r1(rand() * 170)}" r="${r1(.6 + rand() * 1.1)}" fill="#fff6c4" opacity="${r1(.3 + rand() * .5)}"/>`;
    }
    s += `<circle cx="${sunX}" cy="${P.sunY}" r="150" fill="url(#${id}g)"/><circle cx="${sunX}" cy="${P.sunY}" r="${c.time === 'dusk' ? 46 : 32}" fill="${P.sun}"/>`;
    s += cloud(rand() * 200 + 80, 78 + rand() * 30, 1.05, P) + cloud(rand() * 160 + 400, 52 + rand() * 40, .8, P);
    const ph = rand() * 6;
    s += hill(300, 24, .011, ph, P.hill1) + hill(322, 20, .016, ph + 2, P.hill2) + hill(340, 14, .022, ph + 4, P.hill3);
    s += `<rect y="336" width="640" height="144" fill="url(#${id}f)"/>`;
    if (ground === 'water') {
      for (let i = 0; i < 9; i++) s += `<path d="M${r1(rand() * 560)} ${r1(350 + rand() * 120)}h${r1(30 + rand() * 60)}" stroke="#fff" stroke-opacity="${c.time === 'dusk' ? .12 : .35}" stroke-width="2" stroke-linecap="round"/>`;
    } else {
      for (let i = 0; i < 26; i++) { const x = rand() * 640, y = 350 + rand() * 120; s += `<path d="M${r1(x)} ${r1(y)}l2 -6M${r1(x + 4)} ${r1(y)}l-1 -5" stroke="${P.leaf2}" stroke-width="1.6" opacity=".6" stroke-linecap="round"/>`; }
    }
    return { defs, s };
  }

  /* ---------- the house styles ---------- */
  const B = 384;                           // the line where buildings meet the ground

  function pathway(c, x, w) {
    const P = c.P;
    return `<path d="M${x - w / 2} ${B}H${x + w / 2}L${x + w * 1.4} 480H${x - w * 1.4}Z" fill="${P.path}"/><path d="M${x - w * .45} ${B + 24}H${x + w * .45}M${x - w * .7} ${B + 52}H${x + w * .7}M${x - w * .95} ${B + 82}H${x + w * .95}" stroke="#000" stroke-opacity=".1" stroke-width="2"/>`;
  }

  function gable(c, o) {
    const S = c.S, P = c.P, rand = c.rand;
    const fl = o.floors || 2, H = fl * 96, top = B - H, x0 = 170, x1 = 490;
    let s = `<ellipse cx="320" cy="${B + 4}" rx="250" ry="14" fill="${P.shade}"/>`;
    s += pathway(c, 320, 46);
    if (o.garage) {
      s += `<rect x="46" y="${B - 112}" width="130" height="112" fill="${S.wall}"/>` +
        `<path d="M32 ${B - 108}L110 ${B - 172}L190 ${B - 108}Z" fill="${S.roof}"/>` +
        `<rect x="66" y="${B - 74}" width="90" height="74" fill="${S.trim}"/><path d="M66 ${B - 56}H156M66 ${B - 38}H156M66 ${B - 20}H156" stroke="#000" stroke-opacity=".2" stroke-width="2"/>` +
        `<path d="M70 ${B}H152L170 480H52Z" fill="${P.path}"/>`;
    }
    s += `<rect x="${x1 - 74}" y="${top - 96}" width="26" height="70" fill="${S.brick}"/><rect x="${x1 - 78}" y="${top - 100}" width="34" height="9" fill="${S.trim}"/>`;
    s += `<rect x="${x0}" y="${top}" width="${x1 - x0}" height="${H}" fill="${S.wall}"/>`;
    if (o.batten) for (let x = x0 + 12; x < x1; x += 14) s += `<path d="M${x} ${top}V${B}" stroke="${S.trim}" stroke-width="1.6" opacity=".4"/>`;
    s += `<rect x="${x0}" y="${B - 12}" width="${x1 - x0}" height="12" fill="${S.base}"/>`;
    if (fl > 1) s += `<rect x="${x0}" y="${top + 94}" width="${x1 - x0}" height="5" fill="${S.trim}" opacity=".8"/>`;
    s += `<path d="M${x0 - 24} ${top + 8}L${x0 + 44} ${top - 72}H${x1 - 44}L${x1 + 24} ${top + 8}Z" fill="${S.roof}"/>` +
      `<path d="M${x0 - 24} ${top + 8}L${x1 + 24} ${top + 8}" stroke="#000" stroke-opacity=".2" stroke-width="6"/>`;
    for (let i = 1; i < 5; i++) s += `<path d="M${x0 - 24 + i * 11} ${top + 8 - i * 17}H${x1 + 24 - i * 11}" stroke="#000" stroke-opacity=".1" stroke-width="2"/>`;
    s += `<path d="M252 ${top + 6}L320 ${top - 64}L388 ${top + 6}Z" fill="${S.wall}" stroke="${S.trim}" stroke-width="7" stroke-linejoin="round"/>` +
      `<circle cx="320" cy="${top - 20}" r="13" fill="${P.lit ? '#ffd84a' : P.glass}" stroke="${S.trim}" stroke-width="4"/>`;
    const wy1 = top + 26;
    if (fl > 1) { [212, 428].forEach(cx => { s += win(c, cx - 23, wy1, 46, 58, {}); }); s += win(c, 297, wy1 + 4, 46, 54, {}); }
    const wy0 = B - 98;
    [212, 428].forEach(cx => { s += win(c, cx - 25, wy0 + (fl > 1 ? 4 : 0), 50, 62, {}); if (o.shutters) s += `<rect x="${cx - 42}" y="${wy0 + 1}" width="12" height="68" fill="${S.accent}"/><rect x="${cx + 30}" y="${wy0 + 1}" width="12" height="68" fill="${S.accent}"/>`; });
    if (o.porch) {
      s += `<rect x="${x0 - 14}" y="${B - 112}" width="${x1 - x0 + 28}" height="10" fill="${S.roof}"/>`;
      for (let x = x0 + 4; x <= x1 - 4; x += 64) s += `<rect x="${x}" y="${B - 104}" width="7" height="${104 - 12}" fill="${S.trim}"/>`;
      s += `<path d="M${x0} ${B - 34}H${x1}M${x0} ${B - 50}H${x1}" stroke="${S.trim}" stroke-width="3"/>`;
      s += door(c, 296, B - 88, 48, 88, S.door);
      s += `<rect x="288" y="${B}" width="64" height="6" fill="${P.path}"/>`;
    } else {
      s += `<path d="M282 ${B - 100}L320 ${B - 128}L358 ${B - 100}Z" fill="${S.roof}"/><rect x="284" y="${B - 100}" width="6" height="100" fill="${S.trim}"/><rect x="350" y="${B - 100}" width="6" height="100" fill="${S.trim}"/>`;
      s += door(c, 297, B - 86, 46, 86, S.door);
      s += `<rect x="286" y="${B}" width="68" height="6" fill="${P.path}"/>`;
    }
    s += shrub(c, 200, B + 6, 1.1) + shrub(c, 440, B + 6, 1.1) + shrub(c, 236, B + 8, .8) + shrub(c, 404, B + 8, .8);
    s += tree(c, 574, B + 22, 1.25) + (o.garage ? '' : tree(c, 74, B + 18, 1.1));
    return s;
  }

  function modern(c, o) {
    const S = c.S, P = c.P, rand = c.rand;
    let s = `<ellipse cx="320" cy="${B + 4}" rx="270" ry="13" fill="${P.shade}"/>`;
    s += `<path d="M150 ${B}H250L292 480H110Z" fill="${P.path}"/>`;
    s += `<rect x="96" y="304" width="360" height="${B - 304}" fill="${S.wall}"/>`;
    s += `<rect x="456" y="304" width="70" height="12" fill="#000" opacity=".28"/>`;
    s += `<rect x="236" y="206" width="294" height="98" fill="${S.accent}"/>`;
    for (let x = 242; x < 528; x += 11) s += `<path d="M${x} 206V304" stroke="#000" stroke-opacity=".14" stroke-width="2"/>`;
    s += `<rect x="84" y="294" width="384" height="10" fill="${S.roof}"/><rect x="224" y="198" width="318" height="10" fill="${S.roof}"/>`;
    const glass = (x, y, w, h, n) => {
      const lit = P.lit && rand() > .15;
      let g = lit ? `<rect x="${x - 8}" y="${y - 8}" width="${w + 16}" height="${h + 16}" rx="10" fill="#ffde42" opacity=".15"/>` : '';
      g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${lit ? '#ffd84a' : P.glass}" stroke="#14100c" stroke-width="4"/>`;
      if (lit) g += `<rect x="${x}" y="${y}" width="${w}" height="${h * .45}" fill="#fff6b8" opacity=".5"/>`;
      else g += `<path d="M${x} ${y + h}L${x + w * .5} ${y}H${x + w * .7}L${x + w * .2} ${y + h}Z" fill="#fff" opacity=".28"/>`;
      for (let i = 1; i < n; i++) g += `<path d="M${x + w / n * i} ${y}V${y + h}" stroke="#14100c" stroke-width="3"/>`;
      return g;
    };
    s += glass(264, 224, 232, 62, 4);
    s += glass(300, 322, 150, 54, 3);
    s += `<rect x="112" y="332" width="124" height="${B - 332}" fill="#2a2a24"/>`;
    for (let y = 342; y < B; y += 10) s += `<path d="M112 ${y}H236" stroke="#fff" stroke-opacity=".14" stroke-width="2"/>`;
    s += `<rect x="252" y="322" width="30" height="${B - 322}" fill="${S.door}"/><rect x="274" y="338" width="3" height="26" fill="#ffde42"/>`;
    s += `<path d="M96 ${B}H456" stroke="#000" stroke-opacity=".25" stroke-width="3"/>`;
    s += shrub(c, 470, B + 8, 1.2) + shrub(c, 292, B + 10, .8) + pine(c, 580, B + 24, 1.1) + pine(c, 54, B + 20, .9);
    return s;
  }

  function bungalow(c, o) {
    const S = c.S, P = c.P;
    let s = `<ellipse cx="320" cy="${B + 4}" rx="270" ry="13" fill="${P.shade}"/>`;
    s += pathway(c, 320, 46);
    s += `<rect x="446" y="188" width="28" height="74" fill="${S.brick}"/><rect x="442" y="184" width="36" height="9" fill="${S.trim}"/>`;
    s += `<rect x="100" y="288" width="440" height="${B - 288}" fill="${S.wall}"/>`;
    s += `<rect x="100" y="${B - 12}" width="440" height="12" fill="${S.base}"/>`;
    s += `<path d="M76 298L158 222H482L564 298Z" fill="${S.roof}"/><path d="M76 298H564" stroke="#000" stroke-opacity=".2" stroke-width="6"/>`;
    for (let i = 1; i < 4; i++) s += `<path d="M${76 + i * 20} ${298 - i * 19}H${564 - i * 20}" stroke="#000" stroke-opacity=".1" stroke-width="2"/>`;
    s += `<path d="M238 296L320 232L402 296Z" fill="${S.wall}" stroke="${S.trim}" stroke-width="7" stroke-linejoin="round"/>`;
    [148, 218].forEach(x => { s += win(c, x, 312, 46, 54, {}); });
    [412, 482].forEach(x => { s += win(c, x - 8, 312, 46, 54, {}); });
    s += `<rect x="258" y="294" width="7" height="${B - 294}" fill="${S.trim}"/><rect x="375" y="294" width="7" height="${B - 294}" fill="${S.trim}"/>`;
    s += door(c, 297, B - 82, 46, 82, S.door);
    s += `<rect x="284" y="${B}" width="72" height="6" fill="${P.path}"/>`;
    s += shrub(c, 150, B + 6, 1.1) + shrub(c, 500, B + 6, 1.1) + shrub(c, 228, B + 8, .8) + shrub(c, 412, B + 8, .8);
    s += tree(c, 584, B + 20, 1.2) + tree(c, 50, B + 24, 1);
    return s;
  }

  function cottage(c, o) {
    const S = c.S, P = c.P, rand = c.rand;
    let s = `<ellipse cx="320" cy="${B + 4}" rx="200" ry="12" fill="${P.shade}"/>`;
    s += `<path d="M296 ${B}H344L380 480H262Z" fill="${P.path}"/>`;
    s += `<rect x="392" y="176" width="36" height="94" fill="${S.brick}"/><rect x="388" y="172" width="44" height="10" fill="${S.trim}"/>`;
    s += `<rect x="200" y="288" width="240" height="${B - 288}" fill="${S.wall}"/>`;
    if (o.logs) for (let y = 296; y < B; y += 13) s += `<path d="M200 ${y}H440" stroke="#000" stroke-opacity=".22" stroke-width="2"/><path d="M200 ${y + 6}H440" stroke="#fff" stroke-opacity=".08" stroke-width="2"/>`;
    s += `<path d="M176 298L320 172L464 298Z" fill="${S.roof}"/><path d="M176 298H464" stroke="#000" stroke-opacity=".22" stroke-width="6"/>`;
    for (let i = 1; i < 5; i++) s += `<path d="M${176 + i * 22} ${298 - i * 24}H${464 - i * 22}" stroke="#000" stroke-opacity=".12" stroke-width="2"/>`;
    s += `<path d="M262 262L292 224L322 262Z" fill="${S.wall}" stroke="${S.trim}" stroke-width="6" stroke-linejoin="round"/>` + win(c, 280, 246, 24, 24, { grid: false });
    s += win(c, 228, 316, 44, 46, {}) + win(c, 368, 316, 44, 46, {});
    s += `<rect x="222" y="364" width="56" height="10" fill="${S.accent}"/><rect x="362" y="364" width="56" height="10" fill="${S.accent}"/>`;
    s += flowers(c, 224, 276, 360, rand) + flowers(c, 364, 416, 360, rand);
    s += door(c, 292, B - 80, 56, 80, S.door, true);
    if (o.porch) {
      s += `<path d="M262 ${B - 96}L320 ${B - 124}L378 ${B - 96}Z" fill="${S.roof}"/><rect x="268" y="${B - 96}" width="6" height="96" fill="${S.trim}"/><rect x="366" y="${B - 96}" width="6" height="96" fill="${S.trim}"/>`;
    }
    for (let x = 90; x < 560; x += 22) if (x < 250 || x > 390) s += `<path d="M${x} ${B + 40}V${B + 74}L${x + 8} ${B + 66}L${x + 16} ${B + 74}V${B + 40}Z" fill="#f6f2dc" stroke="${P.shade}" stroke-width="1"/>`;
    s += `<path d="M84 ${B + 52}H236M404 ${B + 52}H556M84 ${B + 64}H236M404 ${B + 64}H556" stroke="#f6f2dc" stroke-width="3"/>`;
    s += flowers(c, 100, 230, B + 80, rand) + flowers(c, 410, 550, B + 80, rand);
    s += pine(c, 92, B + 20, 1.25) + tree(c, 566, B + 24, 1.15) + shrub(c, 190, B + 6, .9) + shrub(c, 450, B + 6, .9);
    return s;
  }

  function townhouse(c, o) {
    const S = c.S, P = c.P, rand = c.rand;
    const n = o.units || 3, uw = n === 3 ? 124 : 180, x0 = 320 - (uw * n) / 2;
    let s = `<ellipse cx="320" cy="${B + 4}" rx="${uw * n / 2 + 30}" ry="13" fill="${P.shade}"/>`;
    s += `<rect y="${B}" width="640" height="22" fill="${P.path}"/><rect y="${B + 22}" width="640" height="5" fill="#000" opacity=".08"/>`;
    for (let i = 0; i < n; i++) {
      const x = x0 + i * uw, fl = o.flat ? 3 : 3, top = B - fl * 92 - (i % 2 ? 0 : 14), col = (S.units || [S.wall])[i % (S.units || [S.wall]).length];
      s += `<rect x="${x}" y="${top}" width="${uw}" height="${B - top}" fill="${col}"/>`;
      s += `<rect x="${x}" y="${B - 14}" width="${uw}" height="14" fill="${S.base}"/>`;
      if (o.flat) {
        s += `<rect x="${x - 4}" y="${top - 8}" width="${uw + 8}" height="10" fill="${S.roof}"/>`;
        for (let k = 0; k < fl; k++) s += win(c, x + 16, top + 22 + k * 86 - (k === fl - 1 ? 0 : 0) , uw - 78 > 40 ? uw - 62 : 62, 56, { trim: '#14100c', grid: false });
        s += `<rect x="${x + uw - 40}" y="${B - 80}" width="30" height="80" fill="${S.door}"/>`;
      } else {
        s += `<rect x="${x - 3}" y="${top - 9}" width="${uw + 6}" height="12" fill="${S.trim}"/><path d="M${x - 3} ${top - 9}L${x + uw / 2} ${top - 34}L${x + uw + 3} ${top - 9}Z" fill="${S.roof}"/>`;
        for (let k = 0; k < fl; k++) {
          const wy = top + 20 + k * 88, ww = 32;
          if (k === fl - 1) { s += win(c, x + 18, B - 86, ww, 54, {}); s += door(c, x + uw - 52, B - 78, 36, 78, S.door); }
          else { s += win(c, x + 18, wy, ww, 54, {}) + win(c, x + uw - 52, wy, ww, 54, {}); }
        }
        s += `<path d="M${x + uw - 60} ${B - 6}h52v6h-52z" fill="${P.path}"/>`;
      }
      s += `<path d="M${x} ${top} V${B}" stroke="#000" stroke-opacity=".25" stroke-width="2"/>`;
    }
    s += tree(c, 56, B + 26, .95) + tree(c, 590, B + 26, 1.05);
    s += `<path d="M96 ${B + 56}H544" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-dasharray="26 22"/>`;
    return s;
  }

  function loft(c, o) {
    const S = c.S, P = c.P, id = c.id;
    let s = `<rect y="${B}" width="640" height="26" fill="${P.path}"/><rect y="${B + 26}" width="640" height="94" fill="${P.ground2}"/>`;
    c.defs += `<pattern id="${id}b" width="28" height="14" patternUnits="userSpaceOnUse"><rect width="28" height="14" fill="${S.wall}"/><path d="M0 .5H28M0 7.5H28M7 .5V7.5M21 7.5V14" stroke="#000" stroke-opacity=".2" stroke-width="1.4"/></pattern>`;
    s += `<rect x="80" y="130" width="480" height="${B - 130}" fill="url(#${id}b)"/>`;
    s += `<rect x="70" y="120" width="500" height="14" fill="${S.trim}"/><rect x="70" y="128" width="500" height="4" fill="#000" opacity=".18"/>`;
    if (o.tank !== false) s += `<g fill="#14100c"><rect x="462" y="62" width="64" height="48" rx="3"/><path d="M458 62L494 38L530 62Z"/><rect x="470" y="110" width="4" height="12"/><rect x="514" y="110" width="4" height="12"/></g>`;
    if (o.tank !== false) s += `<rect x="458" y="76" width="72" height="3" fill="#6b5a3c"/>`;
    for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) s += win(c, 112 + i * 112, 154 + r * 66 - (r ? 0 : 0), 52, 50, { arch: o.arch !== false && r === 0, trim: S.trim });
    s += `<rect x="80" y="${B - 62}" width="480" height="62" fill="#14100c" opacity=".16"/>`;
    for (let i = 0; i < 3; i++) s += win(c, 112 + i * 112, B - 58, 82, 46, { trim: '#14100c', lit: P.lit ? i !== 1 : false });
    s += door(c, 444, B - 66, 48, 66, S.door);
    s += `<path d="M430 ${B - 72}H506L496 ${B - 92}H440Z" fill="${S.roof}"/>`;
    for (const x of [64, 584]) s += `<rect x="${x}" y="${B - 96}" width="4" height="96" fill="#14100c"/><circle cx="${x + 2}" cy="${B - 98}" r="7" fill="${P.lit ? '#ffde42' : '#e8e2c0'}"/>`;
    s += tree(c, 36, B + 36, .9) + tree(c, 612, B + 36, .95);
    return s;
  }

  function tower(c, o) {
    const S = c.S, P = c.P, id = c.id, rand = c.rand;
    c.defs += `<linearGradient id="${id}t" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${S.wall}"/><stop offset="1" stop-color="${S.accent}"/></linearGradient>`;
    let s = '';
    const bld = (x, y, w, cols, rows, op) => {
      let g = `<g opacity="${op}"><rect x="${x}" y="${y}" width="${w}" height="${B - y}" fill="url(#${id}t)"/>`;
      const cw = (w - 12) / cols;
      for (let r = 0; r < rows; r++) for (let i = 0; i < cols; i++) {
        const lit = P.lit && rand() > .4;
        g += `<rect x="${r1(x + 6 + i * cw + 1.5)}" y="${y + 12 + r * 22}" width="${r1(cw - 3)}" height="15" fill="${lit ? '#ffd84a' : P.glass}" opacity="${lit ? 1 : .85}"/>`;
      }
      return g + '</g>';
    };
    s += bld(130, 168, 120, 4, 9, .85) + bld(404, 118, 120, 4, 11, .85);
    s += `<rect x="248" y="36" width="144" height="${B - 36}" fill="url(#${id}t)"/><rect x="258" y="24" width="124" height="14" fill="${S.trim}"/><rect x="314" y="2" width="12" height="24" fill="${S.trim}"/>`;
    for (let r = 0; r < 15; r++) for (let i = 0; i < 6; i++) {
      const lit = P.lit && rand() > .38;
      s += `<rect x="${256 + i * 21.6}" y="${50 + r * 22}" width="18" height="15" fill="${lit ? '#ffd84a' : P.glass}"/>`;
      if (!lit) s += `<path d="M${256 + i * 21.6} ${65 + r * 22}L${256 + i * 21.6 + 10} ${50 + r * 22}H${256 + i * 21.6 + 14}L${256 + i * 21.6 + 4} ${65 + r * 22}Z" fill="#fff" opacity=".3"/>`;
    }
    s += `<rect x="248" y="${B - 40}" width="144" height="40" fill="${S.trim}"/><rect x="288" y="${B - 32}" width="64" height="32" fill="${P.lit ? '#ffd84a' : P.glass}"/>`;
    s += `<rect y="${B}" width="640" height="22" fill="${P.path}"/><rect y="${B + 22}" width="640" height="4" fill="#000" opacity=".12"/>`;
    for (let x = 20; x < 640; x += 44) s += `<path d="M${x} ${B + 4}V${B - 14}" stroke="${S.trim}" stroke-width="3"/>`;
    s += `<path d="M10 ${B - 14}H630" stroke="${S.trim}" stroke-width="3"/>`;
    s += `<g opacity=".16" transform="translate(0 ${2 * (B + 22)}) scale(1 -1)"><rect x="248" y="${B + 22}" width="144" height="150" fill="${S.wall}"/></g>`;
    s += `<path d="M498 ${B + 70}l22 -34v34zM520 ${B + 70}l0 -44l26 44z" fill="#f6f2dc" opacity=".9"/><path d="M509 ${B + 72}V${B + 70}M530 ${B + 72}V${B + 70}" stroke="#000"/><path d="M490 ${B + 72}H560" stroke="${S.trim}" stroke-width="4" stroke-linecap="round"/>`;
    return s;
  }

  const BUILD = { gable, farmhouse: (c, o) => gable(c, Object.assign({ porch: true, batten: true, floors: 2 }, o)), modern, bungalow, cottage, townhouse, loft, tower };

  /* ---------- one listing picture ---------- */
  function renderArt(spec, opts) {
    opts = opts || {};
    const time = opts.time || spec.time || 'day';
    const seed = (spec.seed || 1) + (opts.seedShift || 0);
    const c = {
      id: 'a' + (++uidN), time: time, P: SKY[time] || SKY.day, rand: rng(seed * 977 + 13), spec: spec, defs: '',
      S: Object.assign({ wall: '#efe6c8', trim: '#f7f3e4', roof: '#4c5c2d', base: '#a89f80', brick: '#8f4f38', door: '#313e17', accent: '#313e17' }, spec.colors || {})
    };
    if (time === 'dusk') {
      // walls look darker at dusk; the picture still reads the same house
      c.S.trim = spec.colors && spec.colors.trim ? c.S.trim : '#d9d3b4';
    }
    const ground = spec.style === 'tower' ? 'water' : 'grass';
    const bd = backdrop(c, ground);
    const fn = BUILD[spec.style] || gable;
    const body = fn(c, spec);
    let vignette = '';
    if (time === 'dusk') vignette = `<rect width="640" height="480" fill="#1b0c0c" opacity=".14"/>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" preserveAspectRatio="xMidYMid slice"><defs>${bd.defs}${c.defs}</defs>${bd.s}${body}${vignette}</svg>`;
    return svg;
  }
  const artUri = (spec, opts) => uri(renderArt(spec, opts));

  /* ---------- hero scene: a neighbourhood at golden hour ---------- */
  function heroScene() {
    const rand = rng(41), W = 1600, H = 800;
    const hills = (y0, amp, f, ph, fill) => {
      let d = `M0 ${y0}`;
      for (let x = 0; x <= W; x += 40) d += `L${x} ${r1(y0 - amp * Math.sin(f * x + ph) - amp * .5 * Math.sin(2.1 * f * x + ph * 1.6))}`;
      return `<path d="${d}V${H}H0Z" fill="${fill}"/>`;
    };
    const house = (x, base, w, h, fill, kind, litP) => {
      let s = '';
      if (kind === 'tower') {
        s += `<rect x="${x}" y="${base - h}" width="${w}" height="${h}" fill="${fill}"/>`;
        for (let r = 0; r < Math.floor(h / 26); r++) for (let i = 0; i < Math.floor(w / 20); i++) if (rand() < litP) s += `<rect class="hs-win" style="--d:${r1(rand() * 6)}s" x="${x + 6 + i * 20}" y="${base - h + 10 + r * 26}" width="9" height="12" fill="#ffde42"/>`;
        return s;
      }
      const roofH = kind === 'flat' ? 8 : w * .34;
      s += `<rect x="${x}" y="${base - h}" width="${w}" height="${h}" fill="${fill}"/>`;
      s += kind === 'flat' ? `<rect x="${x - 4}" y="${base - h - 8}" width="${w + 8}" height="9" fill="${fill}"/>` : `<path d="M${x - 8} ${base - h + 2}L${x + w / 2} ${base - h - roofH}L${x + w + 8} ${base - h + 2}Z" fill="${fill}"/>`;
      if (kind === 'gable' && rand() > .4) s += `<rect x="${x + w * .66}" y="${base - h - roofH * .9}" width="9" height="${roofH * .7}" fill="${fill}"/>`;
      const cols = Math.max(2, Math.floor(w / 34)), rows = Math.max(1, Math.floor(h / 40));
      for (let r = 0; r < rows; r++) for (let i = 0; i < cols; i++) if (rand() < litP) s += `<rect class="hs-win" style="--d:${r1(rand() * 6)}s" x="${r1(x + 12 + i * ((w - 24) / cols))}" y="${base - h + 14 + r * 38}" width="14" height="19" fill="#ffde42"/>`;
      return s;
    };
    let defs = `<linearGradient id="hsk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b0c0c"/><stop offset=".32" stop-color="#313e17"/><stop offset=".6" stop-color="#4c5c2d"/><stop offset=".8" stop-color="#b79a2e"/><stop offset="1" stop-color="#ffde42"/></linearGradient>` +
      `<radialGradient id="hsg"><stop offset="0" stop-color="#ffde42" stop-opacity=".9"/><stop offset=".45" stop-color="#ffde42" stop-opacity=".22"/><stop offset="1" stop-color="#ffde42" stop-opacity="0"/></radialGradient>` +
      `<linearGradient id="hgr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f2a0e"/><stop offset="1" stop-color="#1b0c0c"/></linearGradient>`;
    let sky = `<g class="hs-l0"><rect width="${W}" height="${H}" fill="url(#hsk)"/>`;
    for (let i = 0; i < 70; i++) sky += `<circle class="hs-star" style="--d:${r1(rand() * 5)}s" cx="${r1(rand() * W)}" cy="${r1(rand() * 330)}" r="${r1(.7 + rand() * 1.3)}" fill="#fff6c4"/>`;
    sky += `<circle cx="1130" cy="560" r="330" fill="url(#hsg)"/><circle class="hs-sun" cx="1130" cy="560" r="92" fill="#ffde42"/>`;
    sky += `<g class="hs-cloud c1" fill="#e8c63a" opacity=".22"><ellipse cx="300" cy="360" rx="230" ry="16"/><ellipse cx="360" cy="338" rx="150" ry="13"/></g><g class="hs-cloud c2" fill="#e8c63a" opacity=".2"><ellipse cx="1300" cy="300" rx="260" ry="15"/><ellipse cx="1240" cy="278" rx="160" ry="12"/></g><g class="hs-cloud c3" fill="#ffde42" opacity=".16"><ellipse cx="800" cy="440" rx="300" ry="14"/></g></g>`;
    let far = `<g class="hs-l1">${hills(590, 38, .004, 1, '#566632')}${hills(630, 30, .006, 3, '#425125')}</g>`;
    let mid = `<g class="hs-l2">`;
    for (let x = 30; x < W; x += 50 + rand() * 60) mid += house(r1(x), 668, 44 + rand() * 40, 38 + rand() * 40, '#2b3715', rand() > .7 ? 'flat' : 'gable', .35);
    mid += `${hills(690, 18, .008, 5, '#2a3513')}</g>`;
    let near = `<g class="hs-l3">`;
    const spots = [[90, 120, 100], [250, 170, 130], [470, 110, 92], [640, 90, 220], [780, 150, 120], [960, 210, 150], [1190, 150, 110], [1370, 120, 170]];
    spots.forEach((p, i) => { const kind = p[2] > 200 ? 'tower' : (i % 3 === 1 ? 'flat' : 'gable'); near += house(p[0], 740, p[1] * (kind === 'tower' ? .5 : 1) + (kind === 'tower' ? 10 : 0), p[2], '#1d260c', kind, .5); });
    for (const x of [30, 188, 584, 744, 905, 1138, 1330, 1520]) { const s = .8 + rand() * .7; near += `<rect x="${x - 4}" y="${740 - 30 * s}" width="8" height="${30 * s}" fill="#171008"/><path d="M${x - 34 * s} ${740 - 26 * s}L${x} ${740 - 128 * s}L${x + 34 * s} ${740 - 26 * s}Z" fill="#1a2309"/><path d="M${x - 28 * s} ${740 - 62 * s}L${x} ${740 - 150 * s}L${x + 28 * s} ${740 - 62 * s}Z" fill="#202b0d"/>`; }
    near += '</g>';
    const front = `<g class="hs-l4"><rect y="738" width="${W}" height="${H - 738}" fill="url(#hgr)"/><path d="M0 760H${W}" stroke="#ffde42" stroke-opacity=".18" stroke-width="3" stroke-dasharray="60 46"/></g>`;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false"><defs>${defs}</defs>${sky}${far}${mid}${near}${front}</svg>`;
  }

  /* ---------- the map ---------- */
  function mapBase() {
    const roads = [];
    const R = (d, major) => roads.push(`<path d="${d}" class="${major ? 'm-road m-major' : 'm-road'}"/>`);
    for (let x = 70; x < 1000; x += 90) R(`M${x} 0C${x + 20} 200 ${x - 20} 480 ${x + 10} 760`);
    for (let y = 60; y < 760; y += 85) R(`M0 ${y}C250 ${y - 18} 600 ${y + 24} 1000 ${y - 8}`);
    R('M0 330C240 290 460 360 700 300S940 250 1000 270', true);
    R('M520 0C540 180 470 340 520 520S560 700 540 760', true);
    R('M0 120C200 150 360 90 560 130S860 190 1000 150', true);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 760" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">` +
      `<rect width="1000" height="760" class="m-land"/>` +
      `<path d="M120 600C200 560 290 580 330 630S300 720 210 720 80 660 120 600Z" class="m-park"/>` +
      `<path d="M600 60C700 30 800 70 820 130S760 200 670 190 540 110 600 60Z" class="m-park"/>` +
      `<path d="M330 150C400 120 470 150 460 210S380 260 330 230 290 180 330 150Z" class="m-park"/>` +
      `<path d="M440 440C500 420 560 440 570 480S520 540 470 530 410 470 440 440Z" class="m-park"/>` +
      roads.join('') +
      `<path d="M-20 470C200 400 380 520 560 450S760 480 850 580" class="m-river"/>` +
      `<path d="M690 590C750 548 900 548 970 585S1030 650 1020 780H650C640 690 650 630 690 590Z" class="m-water-fill"/>` +
      `<g class="m-label"><text x="150" y="196">Maple Ridge</text><text x="640" y="104">Northgate</text><text x="418" y="436">Old Mill District</text><text x="120" y="372">Riverbend</text><text x="110" y="700">Cedar Hollow</text><text x="750" y="660">Harbour Point</text></g>` +
      `</svg>`;
  }

  /* ---------- agent avatar: monogram on a shaped tile ---------- */
  function avatar(name, tone) {
    const ini = name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
    const T = [['#313e17', '#ffde42'], ['#ffde42', '#313e17'], ['#4c5c2d', '#f6f2dc'], ['#1b0c0c', '#ffde42']][tone % 4];
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" role="img" aria-label="${name}"><rect width="120" height="120" fill="${T[0]}"/><circle cx="96" cy="22" r="46" fill="${T[1]}" opacity=".16"/><circle cx="14" cy="112" r="38" fill="${T[1]}" opacity=".12"/><text x="60" y="73" text-anchor="middle" font-family="Outfit, system-ui, sans-serif" font-size="42" font-weight="700" fill="${T[1]}">${ini}</text></svg>`;
  }

  window.FHArt = { renderArt: renderArt, artUri: artUri, heroScene: heroScene, mapBase: mapBase, avatar: avatar, uri: uri };
})();
