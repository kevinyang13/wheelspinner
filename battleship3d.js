// battleship3d.js — real-time 3D sea battle board for battleship.html.
// Needs the global Three.js build (r128). Exposes BS3D.render(el, marks, opts),
// which draws one 10x10 battlefield into `el` and diffs against what it showed
// last time, so only *new* hits / misses / sinkings get their animations.
(function () {
  'use strict';
  const T = window.THREE;
  let ok = false;
  try {
    const c = document.createElement('canvas');
    ok = !!(T && (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch (e) { ok = false; }
  const API = (window.BS3D = { supported: ok, cfg: {} });
  if (!ok) return;

  const SIZE = 10, HALF = SIZE / 2;
  const SUN = new T.Vector3(-0.42, 0.17, -0.89).normalize();
  const rnd = (a, b) => a + Math.random() * (b - a);
  const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const cellPos = (r, c) => ({ x: c - HALF + 0.5, z: r - HALF + 0.5 });

  // ───────────────────────── textures (shared, drawn once) ─────────────────────────
  const TEX = {};
  function canvasTex(w, h, draw) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    return new T.CanvasTexture(c);
  }
  function radial(x, w, h, stops) {
    const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    stops.forEach(s => g.addColorStop(s[0], s[1]));
    x.fillStyle = g; x.fillRect(0, 0, w, h);
  }
  function tex(name) {
    if (TEX[name]) return TEX[name];
    let t;
    switch (name) {
      case 'fire':
        t = canvasTex(128, 128, (x, w, h) => radial(x, w, h,
          [[0, 'rgba(255,252,215,1)'], [.22, 'rgba(255,205,75,.95)'], [.5, 'rgba(255,110,25,.6)'], [1, 'rgba(190,30,10,0)']]));
        break;
      case 'glow':
        t = canvasTex(128, 128, (x, w, h) => radial(x, w, h,
          [[0, 'rgba(255,255,255,1)'], [.3, 'rgba(255,225,170,.6)'], [1, 'rgba(255,160,60,0)']]));
        break;
      case 'spray':
        t = canvasTex(64, 64, (x, w, h) => radial(x, w, h,
          [[0, 'rgba(255,255,255,.95)'], [.5, 'rgba(236,246,255,.55)'], [1, 'rgba(236,246,255,0)']]));
        break;
      case 'smoke':
        t = canvasTex(128, 128, (x, w, h) => {
          for (let i = 0; i < 8; i++) {
            const px = w * rnd(.3, .7), py = h * rnd(.3, .7), r = w * rnd(.2, .36);
            const g = x.createRadialGradient(px, py, 0, px, py, r);
            g.addColorStop(0, 'rgba(78,74,78,.6)'); g.addColorStop(1, 'rgba(40,38,42,0)');
            x.fillStyle = g; x.fillRect(0, 0, w, h);
          }
        });
        break;
      case 'bump':
        t = canvasTex(256, 256, (x, w, h) => {
          x.fillStyle = '#808080'; x.fillRect(0, 0, w, h);
          for (let i = 0; i < 900; i++) {
            const px = rnd(0, w), py = rnd(0, h), r = rnd(3, 16), light = Math.random() < .5;
            for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) {
              const g = x.createRadialGradient(px + ox, py + oy, 0, px + ox, py + oy, r);
              g.addColorStop(0, light ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.22)');
              g.addColorStop(1, 'rgba(128,128,128,0)');
              x.fillStyle = g; x.fillRect(px + ox - r, py + oy - r, r * 2, r * 2);
            }
          }
        });
        t.wrapS = t.wrapT = T.RepeatWrapping;
        break;
      case 'cloud':
        t = canvasTex(512, 128, (x, w, h) => {
          for (let i = 0; i < 26; i++) {
            const px = rnd(60, w - 60), py = rnd(40, h - 40), r = rnd(30, 70);
            const g = x.createRadialGradient(px, py, 0, px, py, r);
            g.addColorStop(0, 'rgba(255,214,176,.5)'); g.addColorStop(1, 'rgba(255,190,150,0)');
            x.fillStyle = g; x.fillRect(0, 0, w, h);
          }
        });
        break;
    }
    return (TEX[name] = t);
  }
  function labelTex(text) {
    return canvasTex(64, 64, (x, w, h) => {
      x.font = '800 40px Nunito, system-ui, sans-serif';
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.shadowColor = 'rgba(0,0,0,.8)'; x.shadowBlur = 6;
      x.fillStyle = '#ffe6bd';
      x.fillText(text, w / 2, h / 2 + 2);
    });
  }

  // ───────────────────────── materials (shared) ─────────────────────────
  const M = {};
  function mats() {
    if (M.ready) return M;
    const s = (c, r, m) => new T.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
    Object.assign(M, {
      ready: true,
      hull: s(0x7b8690, .55, .35), hullDk: s(0x2f353b, .7, .3), bottom: s(0x5b2622, .8, .1),
      deck: s(0x8b8e89, .8, .1), wood: s(0x8f7653, .9, 0),
      sup: s(0xb9c1c8, .6, .25), supDk: s(0x5a646d, .6, .3), black: s(0x1a1f24, .7, .3),
      glass: new T.MeshStandardMaterial({ color: 0x10202e, roughness: .2, metalness: .6, emissive: 0x2a4a66, emissiveIntensity: .5 }),
      barrel: s(0x3a424a, .5, .5), white: s(0xe9edf0, .7, .1), sub: s(0x2a3138, .55, .2),
      cdeck: s(0x4a5157, .9, .1), plane: s(0xcfd6db, .6, .2),
      stripe: new T.MeshBasicMaterial({ color: 0xf0ead0 }),
    });
    return M;
  }
  const charCache = new Map();
  function charMat(m) {                      // burnt, sooty copy for sunk ships
    if (!charCache.has(m)) {
      const c = m.clone();
      if (c.color) c.color.multiplyScalar(.32);
      if (c.emissive) c.emissive.set(0x000000);
      c.roughness = 1; c.metalness = .1;
      charCache.set(m, c);
    }
    return charCache.get(m);
  }

  // ───────────────────────── ship models ─────────────────────────
  // Every model faces +X (bow), keel at y≈-0.24, waterline y=0.
  function add(g, m) { m.castShadow = true; m.receiveShadow = true; g.add(m); return m; }
  function box(g, w, h, d, mat, x, y, z) {
    const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
    m.position.set(x, y + h / 2, z);
    return add(g, m);
  }
  function cyl(g, rt, rb, h, mat, x, y, z, seg) {
    const m = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg || 14), mat);
    m.position.set(x, y + h / 2, z);
    return add(g, m);
  }
  function planShape(L, beam) {
    const B = beam / 2, s = new T.Shape();
    s.moveTo(-L / 2, -B * .86);
    s.lineTo(L / 2 - L * .3, -B);
    s.quadraticCurveTo(L / 2 - L * .08, -B * .88, L / 2, 0);
    s.quadraticCurveTo(L / 2 - L * .08, B * .88, L / 2 - L * .3, B);
    s.lineTo(-L / 2, B * .86);
    s.lineTo(-L / 2, -B * .86);
    return s;
  }
  function extrude(L, beam, h, bevel) {
    const g = new T.ExtrudeGeometry(planShape(L, beam), {
      depth: h, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 10,
    });
    g.rotateX(-Math.PI / 2);
    return g;
  }
  function addHull(g, L, beam, up) {
    const m = mats();
    const lower = new T.Mesh(extrude(L * .97, beam * .8, .2, .02), m.bottom);
    lower.position.y = -.25; add(g, lower);
    const upper = new T.Mesh(extrude(L, beam, up + .03, .03), m.hull);
    upper.position.y = -.05; add(g, upper);
    // dark boot-topping stripe at the waterline
    const boot = new T.Mesh(extrude(L * 1.002, beam * 1.003, .05, .03), m.hullDk);
    boot.position.y = -.07; add(g, boot);
    return up;
  }
  function addFoam(g, L, beam) {
    const mk = (shape, op) => {
      const geo = new T.ShapeGeometry(shape); geo.rotateX(-Math.PI / 2);
      const mat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: op, depthWrite: false });
      const mesh = new T.Mesh(geo, mat); mesh.position.y = .055; mesh.renderOrder = 2; g.add(mesh);
      return mesh;
    };
    const parts = [mk(planShape(L * 1.1, beam * 1.5), .3)];
    const bow = new T.Shape();
    bow.moveTo(L / 2 - .6, -beam * .75); bow.lineTo(L / 2 + .3, 0); bow.lineTo(L / 2 - .6, beam * .75);
    bow.quadraticCurveTo(L / 2 - .25, 0, L / 2 - .6, -beam * .75);
    parts.push(mk(bow, .5));
    const wake = new T.Shape();
    wake.moveTo(-L / 2 + .1, -beam * .5); wake.lineTo(-L / 2 - 1.8, 0); wake.lineTo(-L / 2 + .1, beam * .5);
    parts.push(mk(wake, .22));
    g.userData.foam = parts;
  }
  function turret(g, x, y, z, s, dir, barrels) {
    const m = mats(), t = new T.Group();
    t.position.set(x, y, z);
    if (dir < 0) t.rotation.y = Math.PI;
    cyl(t, .2 * s, .22 * s, .1 * s, m.supDk, 0, 0, 0, 18);
    cyl(t, .17 * s, .19 * s, .09 * s, m.hull, 0, .1 * s, 0, 18);
    box(t, .36 * s, .07 * s, .32 * s, m.hull, -.02 * s, .17 * s, 0);
    box(t, .12 * s, .04 * s, .12 * s, m.supDk, -.08 * s, .24 * s, .07 * s);
    const span = .2 * s;
    for (let i = 0; i < barrels; i++) {
      const zz = barrels === 1 ? 0 : -span / 2 + i * span / (barrels - 1);
      const b = new T.Mesh(new T.CylinderGeometry(.022 * s, .027 * s, .62 * s, 8), m.barrel);
      b.rotation.z = -Math.PI / 2 + .1; b.position.set(.42 * s, .16 * s, zz); add(t, b);
      const tip = new T.Mesh(new T.CylinderGeometry(.032 * s, .032 * s, .05 * s, 8), m.black);
      tip.rotation.z = -Math.PI / 2 + .1; tip.position.set(.73 * s, .185 * s, zz); add(t, tip);
    }
    g.add(t);
  }
  function mast(g, x, y, h) {
    const m = mats();
    cyl(g, .012, .018, h, m.supDk, x, y, 0, 6);
    box(g, .012, .014, .42, m.supDk, x, y + h * .62, 0);
    box(g, .012, .014, .26, m.supDk, x, y + h * .85, 0);
    const dish = new T.Mesh(new T.SphereGeometry(.09, 10, 6), m.sup);
    dish.scale.set(.5, .16, 1.9); dish.position.set(x, y + h + .02, 0); add(g, dish);
  }
  function tower(g, x, y, z, tiers) {
    const m = mats(); let yy = y, xx = x;
    tiers.forEach(([w, h, d]) => {
      box(g, w, h, d, m.sup, xx, yy, z);
      box(g, .014, h * .34, d * .82, m.glass, xx + w / 2, yy + h * .42, z);
      box(g, w * 1.04, .02, d * 1.06, m.supDk, xx, yy + h, z);
      yy += h + .02; xx -= .02;
    });
    return yy;
  }
  function funnel(g, x, y, z, r, h) {
    const m = mats(), f = new T.Group();
    f.position.set(x, 0, z); f.rotation.z = .1; g.add(f);
    cyl(f, r * .8, r, h, m.hullDk, 0, y, 0, 16);
    cyl(f, r * .82, r * .82, .035, m.black, 0, y + h, 0, 16);
  }
  function deckDetails(g, L, beam, y, seed, skip) {
    const m = mats(); let s = seed;
    const r = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    for (let i = 0; i < 9; i++) {
      const x = (r() - .5) * L * .86, z = (r() - .5) * beam * .5;
      if (skip && skip(x)) continue;
      box(g, .08 + r() * .08, .04 + r() * .05, .06 + r() * .06, i % 3 ? m.supDk : m.sup, x, y, z);
    }
  }

  function buildShip(k, len) {
    const m = mats(), g = new T.Group(), L = len * .96;
    g.userData.L = L;
    switch (k) {
      case 'battleship': {
        const beam = .7, up = addHull(g, L, beam, .3);
        addFoam(g, L, beam);
        box(g, L * .94, .03, beam * .86, m.deck, 0, up + .03, 0);
        box(g, L * .62, .035, beam * .5, m.wood, -.1, up + .05, 0);
        deckDetails(g, L, beam, up + .06, 7, x => Math.abs(x) > L * .38 || Math.abs(x + .1) < .45);
        turret(g, 1.4, up + .06, 0, 1, 1, 2);
        cyl(g, .22, .24, .14, m.supDk, .98, up + .06, 0, 18);
        turret(g, .98, up + .2, 0, 1, 1, 2);
        turret(g, -1.42, up + .06, 0, 1, -1, 2);
        const top = tower(g, .02, up + .06, 0, [[.52, .26, .4], [.42, .25, .34], [.34, .22, .28], [.26, .2, .2]]);
        mast(g, -.04, top, .7);
        funnel(g, -.58, up + .06, 0, .13, .36);
        // secondary battery casemates
        [-.9, -.25, .55].forEach(x => { box(g, .2, .1, beam * 1.02, m.supDk, x, up - .08, 0); });
        break;
      }
      case 'carrier': {
        const beam = .78, up = addHull(g, L, beam, .36);
        addFoam(g, L, beam);
        const fd = box(g, L * 1.0, .05, beam * 1.16, m.cdeck, 0, up + .02, 0);
        fd.scale.x = 1;
        // deck markings
        for (let i = 0; i < 9; i++) box(g, .22, .006, .025, m.stripe, -L * .4 + i * L * .09, up + .075, 0);
        const ang = new T.Mesh(new T.BoxGeometry(L * .5, .006, .03), m.stripe);
        ang.position.set(-.1, up + .078, -.18); ang.rotation.y = .12; g.add(ang);
        box(g, .3, .008, .3, m.hull, .8, up + .074, .15);
        box(g, .3, .008, .3, m.hull, -.5, up + .074, -.15);
        // island
        const top = tower(g, .35, up + .07, .34, [[.46, .24, .2], [.34, .22, .18], [.22, .2, .14]]);
        mast(g, .3, top, .55);
        // parked aircraft
        [[-1.0, .1], [-.75, -.2], [-.55, .22], [.05, -.22]].forEach(([x, z], i) => {
          const p = new T.Group(); p.position.set(x, up + .12, z); p.rotation.y = .25 * (i % 2 ? 1 : -1);
          const fus = new T.Mesh(new T.CylinderGeometry(.03, .026, .28, 8), m.plane);
          fus.rotation.z = Math.PI / 2; add(p, fus);
          box(p, .09, .008, .36, m.plane, 0, -.004, 0);
          box(p, .04, .06, .008, m.plane, -.13, 0, 0);
          box(p, .05, .008, .14, m.plane, -.13, 0, 0);
          g.add(p);
        });
        break;
      }
      case 'cruiser': {
        const beam = .6, up = addHull(g, L, beam, .28);
        addFoam(g, L, beam);
        box(g, L * .94, .03, beam * .86, m.deck, 0, up + .03, 0);
        box(g, L * .55, .035, beam * .46, m.wood, -.05, up + .05, 0);
        deckDetails(g, L, beam, up + .06, 3, x => Math.abs(x) > L * .38 || Math.abs(x + .05) < .4);
        turret(g, .98, up + .06, 0, .92, 1, 2);
        turret(g, -.95, up + .06, 0, .92, -1, 2);
        const top = tower(g, .12, up + .06, 0, [[.46, .24, .34], [.36, .22, .28], [.28, .2, .22]]);
        mast(g, .06, top, .55);
        funnel(g, -.32, up + .06, 0, .11, .3);
        break;
      }
      case 'destroyer': {
        const beam = .46, up = addHull(g, L, beam, .24);
        addFoam(g, L, beam);
        box(g, L * .94, .025, beam * .84, m.deck, 0, up + .03, 0);
        turret(g, .55, up + .055, 0, .72, 1, 2);
        turret(g, -.62, up + .055, 0, .72, -1, 1);
        const top = tower(g, .02, up + .055, 0, [[.36, .22, .26], [.26, .18, .2]]);
        mast(g, -.02, top, .45);
        funnel(g, -.26, up + .055, 0, .09, .24);
        funnel(g, -.44, up + .055, 0, .09, .22);
        box(g, .22, .06, .12, m.supDk, -.1, up + .055, .13);
        break;
      }
      default: {                                   // submarine
        const r = .2, body = L - .6;
        const hull = new T.Mesh(new T.CylinderGeometry(r, r, body, 24), m.sub);
        hull.rotation.z = Math.PI / 2; hull.position.y = -.02; add(g, hull);
        [-1, 1].forEach(sg => {
          const cap = new T.Mesh(new T.SphereGeometry(r, 24, 14), m.sub);
          cap.scale.set(sg > 0 ? 1.7 : 2.1, 1, 1); cap.position.set(sg * body / 2, -.02, 0); add(g, cap);
        });
        box(g, .5, .26, .15, m.sub, .3, .1, 0);
        box(g, .5, .02, .17, m.supDk, .3, .36, 0);
        cyl(g, .014, .014, .3, m.black, .42, .36, 0, 6);
        cyl(g, .01, .01, .26, m.black, .2, .36, 0, 6);
        box(g, .14, .02, .5, m.supDk, 1.0, .05, 0);       // dive planes
        box(g, .12, .22, .02, m.supDk, -body / 2 - .15, .08, 0); // rudder
        box(g, .3, .01, .12, m.supDk, -.5, .17, 0);      // deck casing
        const sub = new T.Shape(); // little wake
        sub.moveTo(L / 2 - .2, -.3); sub.lineTo(L / 2 + .3, 0); sub.lineTo(L / 2 - .2, .3);
        const geo = new T.ShapeGeometry(sub); geo.rotateX(-Math.PI / 2);
        const fm = new T.Mesh(geo, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .4, depthWrite: false }));
        fm.position.y = .055; fm.renderOrder = 2; g.add(fm);
        const ring = new T.Shape(); ring.absellipse(0, 0, L * .56, .34, 0, Math.PI * 2, false);
        const rg = new T.ShapeGeometry(ring); rg.rotateX(-Math.PI / 2);
        const rm = new T.Mesh(rg, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .26, depthWrite: false }));
        rm.position.y = .055; rm.renderOrder = 2; g.add(rm);
        g.userData.foam = [fm, rm];
      }
    }
    return g;
  }

  // ───────────────────────── water ─────────────────────────
  function waveH(x, z, t) {
    const edge = Math.max(Math.abs(x), Math.abs(z));
    const a = .35 + .65 * smooth(6, 14, edge);
    return a * (.10 * Math.sin(x * .42 + t * 1.0) + .07 * Math.sin(z * .55 - t * .8 + x * .15) +
                .04 * Math.sin((x + z) * 1.1 + t * 1.6));
  }

  // ───────────────────────── effects ─────────────────────────
  // Persistent fire + smoke on a burning cell. Pure function of time.
  class Flame {
    constructor(b, x, z, y, scale, sunk) {
      this.b = b; this.x = x; this.z = z; this.y = y; this.s = scale; this.off = Math.random();
      this.fire = []; this.smoke = [];
      const nf = sunk ? 4 : 7, ns = sunk ? 8 : 6;
      for (let i = 0; i < nf; i++) { const f = b.sprite('fire', T.AdditiveBlending); f.material.color.setRGB(1, .55, .22); this.fire.push(f); }
      for (let i = 0; i < ns; i++) this.smoke.push(b.sprite('smoke', T.NormalBlending));
      b.flames++;
    }
    update(now) {
      const s = this.s;
      this.fire.forEach((sp, i) => {
        const ph = ((now * .95 + i / this.fire.length + this.off) % 1);
        sp.position.set(this.x + Math.sin(now * 7 + i * 2) * .05 * s, this.y + ph * .6 * s, this.z + Math.cos(now * 6 + i) * .05 * s);
        const sc = (.7 + (1 - ph) * .6) * s;
        sp.scale.set(sc, sc * 1.5, 1);
        sp.material.opacity = Math.pow(1 - ph, 1.3) * .8;
      });
      this.smoke.forEach((sp, j) => {
        const ph = ((now * .2 + j / this.smoke.length + this.off * 3) % 1);
        sp.position.set(this.x + ph * ph * 1.4 + Math.sin(ph * 6 + j) * .1, this.y + .35 + ph * 2.8 * s, this.z + Math.sin(ph * 4 + j * 2) * .15);
        const sc = (.5 + ph * 1.9) * s;
        sp.scale.set(sc, sc, 1);
        sp.material.opacity = .62 * (1 - ph) * Math.min(1, ph * 7);
      });
      return true;
    }
    dispose() { this.b.flames--; [...this.fire, ...this.smoke].forEach(sp => this.b.kill(sp)); }
  }

  // Short blast: flash, fireballs, sparks, smoke, shockwave. `big` = a ship going down.
  class Boom {
    constructor(b, x, y, z, s, big) {
      this.b = b; this.t0 = b.now; this.s = s; this.big = big; this.life = big ? 4.4 : 1.8;
      this.x = x; this.y = y; this.z = z;
      this.flash = b.sprite('glow', T.AdditiveBlending);
      this.parts = [];
      const mk = (name, blend, n, f) => { for (let i = 0; i < n; i++) this.parts.push(Object.assign({ sp: b.sprite(name, blend) }, f(i))); };
      mk('fire', T.AdditiveBlending, big ? 12 : 4, () => ({ tint: 1,
        v: new T.Vector3(rnd(-1, 1), rnd(.3, 1.4), rnd(-1, 1)).multiplyScalar(s * 1.2), life: rnd(.9, 1.5), size: rnd(1.4, 2.4) * s, g: 0, kind: 'fire' }));
      mk('glow', T.AdditiveBlending, big ? 38 : 10, () => ({
        v: new T.Vector3(rnd(-1, 1), rnd(.8, 2.4), rnd(-1, 1)).multiplyScalar(s * 3), life: rnd(.7, 1.4), size: rnd(.08, .17) * s, g: -6, kind: 'spark' }));
      mk('smoke', T.NormalBlending, big ? 10 : 3, () => ({
        v: new T.Vector3(rnd(-.3, .5), rnd(.4, .9), rnd(-.3, .3)).multiplyScalar(s), life: rnd(2.4, 3.8), size: rnd(1, 1.9) * s, g: 0, kind: 'smoke' }));
      const ringMat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .8, depthWrite: false, side: T.DoubleSide });
      const rg = new T.RingGeometry(.4, .55, 40); rg.rotateX(-Math.PI / 2);
      this.ring = new T.Mesh(rg, ringMat); this.ring.position.set(x, .12, z); this.ring.renderOrder = 3;
      b.scene.add(this.ring);
      if (big) b.shake = Math.max(b.shake, .35); else b.shake = Math.max(b.shake, .08);
      b.flashLight(x, y + .6, z, big ? 5 : 2.4);
    }
    update(now) {
      const t = now - this.t0, s = this.s;
      if (t > this.life) return false;
      const fl = Math.max(0, 1 - t / .55);
      this.flash.position.set(this.x, this.y + .4, this.z);
      const fs = (.8 + t * 10) * s * (this.big ? 3 : 1.8);
      this.flash.scale.set(fs, fs, 1); this.flash.material.opacity = fl;
      this.parts.forEach(p => {
        const u = t / p.life;
        if (u >= 1) { p.sp.visible = false; return; }
        p.sp.visible = true;
        p.sp.position.set(this.x + p.v.x * t, this.y + .2 + p.v.y * t + .5 * p.g * t * t, this.z + p.v.z * t);
        if (p.kind === 'fire') {
          const sc = p.size * (.4 + u * 1.2); p.sp.scale.set(sc, sc, 1); p.sp.material.opacity = (1 - u) * .95;
        } else if (p.kind === 'spark') {
          p.sp.scale.set(p.size, p.size, 1); p.sp.material.opacity = 1 - u;
        } else {
          p.sp.position.y += u * 1.4 * s; p.sp.position.x += u * u * 1.2;
          const sc = p.size * (.4 + u * 1.6); p.sp.scale.set(sc, sc, 1);
          p.sp.material.opacity = .7 * (1 - u) * Math.min(1, u * 6);
        }
      });
      const ru = Math.min(1, t / (this.big ? 1.5 : .9));
      const rs = 1 + ru * (this.big ? 11 : 5) * s;
      this.ring.scale.set(rs, 1, rs); this.ring.material.opacity = .8 * (1 - ru);
      return true;
    }
    dispose() {
      this.b.kill(this.flash); this.parts.forEach(p => this.b.kill(p.sp));
      this.b.scene.remove(this.ring); this.ring.geometry.dispose(); this.ring.material.dispose();
    }
  }

  // A shell that missed: spray column + shockwave, then a lasting foam patch.
  class Splash {
    constructor(b, x, z, fresh) {
      this.b = b; this.x = x; this.z = z; this.t0 = b.now; this.fresh = fresh;
      this.spray = [];
      if (fresh) {
        for (let i = 0; i < 26; i++) {
          const a = rnd(0, Math.PI * 2), sp = rnd(0, 1.1), col = i < 8;
          this.spray.push({
            sp: b.sprite('spray', T.NormalBlending),
            v: new T.Vector3(Math.cos(a) * sp * (col ? .3 : 1.2), col ? rnd(4, 6.5) : rnd(3, 6.4), Math.sin(a) * sp * (col ? .3 : 1.2)),
            life: rnd(1.1, 1.6), size: col ? rnd(.85, 1.25) : rnd(.22, .42),
          });
        }
      }
      const mkRing = (a, bb) => {
        const g = new T.RingGeometry(a, bb, 36); g.rotateX(-Math.PI / 2);
        const m = new T.Mesh(g, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .6, depthWrite: false, side: T.DoubleSide }));
        m.position.set(x, .12, z); m.renderOrder = 3; b.scene.add(m); return m;
      };
      this.wave = mkRing(.15, .24);
      this.r1 = mkRing(.3, .36); this.r2 = mkRing(.3, .36);
      const dg = new T.CircleGeometry(.3, 24); dg.rotateX(-Math.PI / 2);
      this.foam = new T.Mesh(dg, new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .5, depthWrite: false }));
      this.foam.position.set(x, .115, z); this.foam.renderOrder = 2; b.scene.add(this.foam);
      this.sprayLive = fresh;
    }
    update(now) {
      const t = now - this.t0;
      if (this.sprayLive) {
        if (t > 1.6) {
          this.sprayLive = false; this.spray.forEach(p => this.b.kill(p.sp)); this.spray = [];
        } else this.spray.forEach(p => {
          const u = t / p.life;
          if (u >= 1) { p.sp.visible = false; return; }
          p.sp.position.set(this.x + p.v.x * t, .1 + p.v.y * t - 4.6 * t * t, this.z + p.v.z * t);
          const sc = p.size * (1 + u * .8); p.sp.scale.set(sc, sc, 1);
          p.sp.material.opacity = .9 * (1 - u * u);
        });
        const w = Math.min(1, t / 1.4), ws = 1 + w * 9;
        this.wave.scale.set(ws, 1, ws); this.wave.material.opacity = .7 * (1 - w);
      } else this.wave.visible = false;
      [this.r1, this.r2].forEach((r, i) => {
        const ph = ((now * .4 + i * .5) % 1), sc = 1 + ph * 1.6;
        r.scale.set(sc, 1, sc); r.material.opacity = .45 * (1 - ph);
      });
      this.foam.material.opacity = .42 + Math.sin(now * 2 + this.x) * .08;
      return true;
    }
    dispose() {
      this.spray.forEach(p => this.b.kill(p.sp));
      [this.wave, this.r1, this.r2, this.foam].forEach(m => { this.b.scene.remove(m); m.geometry.dispose(); m.material.dispose(); });
    }
  }

  // ───────────────────────── one board ─────────────────────────
  const boards = new Set();
  let looping = false;
  function loop(ts) {
    requestAnimationFrame(loop);
    if (API.manual) return;                       // tests step time themselves via BS3D.tick
    boards.forEach(b => b.frame(ts / 1000));
  }
  API.tick = t => boards.forEach(b => b.frame(t));

  class Board {
    constructor(el, mode) {
      mats();
      this.el = el; this.mode = mode; this.lite = mode === 'mine';
      this.now = 0; this.ready = false; this.flames = 0; this.shake = 0; this.fireT = 0;
      this.opts = {}; this.marks = null; this.hover = null; this.needSize = true;
      this.ships = new Map(); this.fx = []; this.cellFx = new Map(); this.cellType = new Map();
      this.sprites = [];

      const canvas = document.createElement('canvas');
      el.appendChild(canvas);
      this.canvas = canvas;
      const r = this.renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
      r.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.lite ? 1.5 : 2));
      r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.15;
      r.shadowMap.enabled = !this.lite; r.shadowMap.type = T.PCFSoftShadowMap;

      const sc = this.scene = new T.Scene();
      sc.fog = new T.FogExp2(0xe39a62, .0105);
      this.camera = new T.PerspectiveCamera(mode === 'mine' ? 40 : 38, 1.3, .1, 800);

      this.buildSky(); this.buildWater(); this.buildLights(); this.buildBoardOverlay();
      if (mode === 'tv') this.buildFarFleet();

      this.hoverMesh = new T.Mesh(
        (() => { const g = new T.PlaneGeometry(.94, .94); g.rotateX(-Math.PI / 2); return g; })(),
        new T.MeshBasicMaterial({ color: 0xffb454, transparent: true, opacity: .4, depthWrite: false }));
      this.hoverMesh.position.y = .13; this.hoverMesh.visible = false; this.hoverMesh.renderOrder = 4;
      sc.add(this.hoverMesh);
      const lg = new T.RingGeometry(.42, .5, 32); lg.rotateX(-Math.PI / 2);
      this.lastRing = new T.Mesh(lg, new T.MeshBasicMaterial({ color: 0xffb454, transparent: true, opacity: .9, depthWrite: false }));
      this.lastRing.position.y = .13; this.lastRing.visible = false; this.lastRing.renderOrder = 4;
      sc.add(this.lastRing);

      this.ray = new T.Raycaster(); this.plane = new T.Plane(new T.Vector3(0, 1, 0), 0);
      canvas.addEventListener('pointermove', e => this.onMove(e));
      canvas.addEventListener('pointerleave', () => { this.hover = null; this.hoverMesh.visible = false; });
      canvas.addEventListener('click', e => this.onClick(e));
      if (window.ResizeObserver) new ResizeObserver(() => { this.needSize = true; }).observe(el);
      boards.add(this);
      if (!looping) { looping = true; requestAnimationFrame(loop); }
    }

    // — scene pieces —
    buildSky() {
      const geo = new T.SphereGeometry(500, 32, 16);
      const mat = new T.ShaderMaterial({
        side: T.BackSide, depthWrite: false, fog: false,
        uniforms: { sun: { value: SUN.clone() } },
        vertexShader: 'varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
        fragmentShader: `varying vec3 vP; uniform vec3 sun;
          void main(){
            vec3 d=normalize(vP); float h=clamp(d.y,0.,1.);
            vec3 hor=vec3(.98,.68,.44), mid=vec3(.62,.66,.84), top=vec3(.20,.36,.70);
            vec3 col=mix(hor,mid,smoothstep(0.,.22,h)); col=mix(col,top,smoothstep(.18,.85,h));
            float s=max(dot(d,normalize(sun)),0.);
            col+=vec3(1.,.55,.2)*pow(s,5.)*.55+vec3(1.,.86,.5)*pow(s,40.)*.6+vec3(1.,.95,.75)*pow(s,900.)*4.;
            if(d.y<0.) col=mix(hor*.85,vec3(.06,.16,.28),clamp(-d.y*8.,0.,1.));
            gl_FragColor=vec4(col,1.);
          }`,
      });
      this.sky = new T.Mesh(geo, mat); this.sky.renderOrder = -10; this.scene.add(this.sky);
      for (let i = 0; i < 6; i++) {
        const m = new T.SpriteMaterial({ map: tex('cloud'), transparent: true, depthWrite: false, fog: false, opacity: rnd(.5, .9) });
        const sp = new T.Sprite(m);
        sp.position.set(rnd(-260, 260), rnd(50, 120), -300); sp.scale.set(rnd(240, 380), rnd(40, 70), 1);
        this.scene.add(sp);
      }
    }
    buildWater() {
      const seg = this.lite ? 56 : 84;
      const geo = new T.PlaneGeometry(170, 170, seg, seg); geo.rotateX(-Math.PI / 2);
      this.waterBase = geo.attributes.position.array.slice();
      this.bump = tex('bump').clone(); this.bump.wrapS = this.bump.wrapT = T.RepeatWrapping;
      this.bump.repeat.set(34, 34); this.bump.needsUpdate = true;
      const mat = new T.MeshPhongMaterial({
        color: 0x072a45, emissive: 0x020e19, specular: 0x7a4a24, shininess: 90, bumpMap: this.bump, bumpScale: .16,
      });
      this.water = new T.Mesh(geo, mat); this.water.receiveShadow = true; this.scene.add(this.water);
    }
    buildLights() {
      const sc = this.scene;
      sc.add(new T.HemisphereLight(0x9fb4d8, 0x08203a, .55));
      sc.add(new T.AmbientLight(0x243448, .35));
      const d = this.sun = new T.DirectionalLight(0xffb27a, 1.9);
      d.position.copy(SUN).multiplyScalar(30).add(new T.Vector3(0, 7, 6));
      if (!this.lite) {
        d.castShadow = true; d.shadow.mapSize.set(1024, 1024);
        const c = d.shadow.camera; c.left = -9; c.right = 9; c.top = 9; c.bottom = -9; c.near = 1; c.far = 80;
        d.shadow.bias = -.0006;
      }
      sc.add(d); sc.add(d.target);
      this.fireLight = new T.PointLight(0xff7a22, 0, 9, 1.6);
      sc.add(this.fireLight);
    }
    buildBoardOverlay() {
      const sc = this.scene;
      // faint tint over the 10x10 battlefield + crisp grid lines + labels
      const pg = new T.PlaneGeometry(SIZE, SIZE); pg.rotateX(-Math.PI / 2);
      const tint = new T.Mesh(pg, new T.MeshBasicMaterial({ color: 0x66d0ff, transparent: true, opacity: .07, depthWrite: false }));
      tint.position.y = .1; tint.renderOrder = 1; sc.add(tint);
      const pos = [], w = .03;
      for (let i = 0; i <= SIZE; i++) {
        const p = i - HALF;
        pos.push(-HALF, 0, p - w, HALF, 0, p - w, HALF, 0, p + w, -HALF, 0, p - w, HALF, 0, p + w, -HALF, 0, p + w);
        pos.push(p - w, 0, -HALF, p - w, 0, HALF, p + w, 0, HALF, p - w, 0, -HALF, p + w, 0, HALF, p + w, 0, -HALF);
      }
      const lg = new T.BufferGeometry();
      lg.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      const lines = new T.Mesh(lg, new T.MeshBasicMaterial({ color: 0xffe2b8, transparent: true, opacity: .34, depthWrite: false, side: T.DoubleSide }));
      lines.position.y = .11; lines.renderOrder = 2; sc.add(lines);
      const label = (txt, x, z) => {
        const s = new T.Sprite(new T.SpriteMaterial({ map: labelTex(txt), transparent: true, depthWrite: false, fog: false }));
        s.position.set(x, .35, z); s.scale.set(.7, .7, 1); sc.add(s);
      };
      for (let i = 0; i < SIZE; i++) {
        label('ABCDEFGHIJ'[i], i - HALF + .5, HALF + .55);
        label(String(i + 1), -HALF - .55, i - HALF + .5);
      }
    }
    buildFarFleet() {
      const ship = (k, len, x, z, ry, s) => {
        const g = buildShip(k, len); g.scale.setScalar(s); g.position.set(x, 0, z); g.rotation.y = ry; this.scene.add(g);
      };
      ship('battleship', 4, 30, -62, Math.PI, 1.6);
      ship('cruiser', 3, 52, -80, Math.PI * .96, 1.6);
      ship('destroyer', 2, -34, -90, .08, 1.7);
      // a pillar of smoke on the horizon, like the photo
      for (let i = 0; i < 9; i++) {
        const sp = this.sprite('smoke', T.NormalBlending); sp.material.opacity = .75; sp.material.fog = false;
        const s = 20 + i * 6; sp.scale.set(s, s, 1); sp.position.set(32 + i * 2, 8 + i * 9, -64);
      }
      const fb = this.sprite('fire', T.AdditiveBlending); fb.material.fog = false;
      fb.scale.set(14, 14, 1); fb.position.set(30, 5, -62);
    }

    // — helpers —
    sprite(name, blend) {
      const m = new T.SpriteMaterial({ map: tex(name), transparent: true, depthWrite: false, blending: blend });
      const s = new T.Sprite(m); s.renderOrder = 5; this.scene.add(s); this.sprites.push(s); return s;
    }
    kill(s) {
      this.scene.remove(s); s.material.dispose();
      const i = this.sprites.indexOf(s); if (i >= 0) this.sprites.splice(i, 1);
    }
    flashLight(x, y, z, intensity) { this.fireLight.position.set(x, y, z); this.fireT = Math.max(this.fireT, intensity); this.flashBoost = intensity; }

    // — sizing / camera —
    resize() {
      const w = this.el.clientWidth, h = this.el.clientHeight;
      if (!w || !h) return false;
      this.renderer.setSize(w, h, false);
      const cam = this.camera; cam.aspect = w / h;
      // elev = angle the camera sits above the board; pitch = how far it looks down.
      // pitch < elev leaves room above the board for the horizon and sky.
      const P = Object.assign(({ tv: { elev: 52, pitch: 50, fov: 36, top: .98 }, phone: { elev: 58, pitch: 58, fov: 38, top: .96 }, mine: { elev: 48, pitch: 48, fov: 40, top: .96 } })[this.mode], API.cfg[this.mode] || {});
      cam.fov = P.fov; cam.updateProjectionMatrix();
      const e = P.elev * Math.PI / 180, pt = P.pitch * Math.PI / 180;
      this.target = new T.Vector3(0, .3, 0);
      const corners = [[-6.1, 0, 6.5], [6.1, 0, 6.5], [-6.1, 0, -5.7], [6.1, 0, -5.7], [0, 1.3, -5.2]].map(a => new T.Vector3(...a));
      const margin = .96;
      let d = P.dist || 6;
      if (P.tx !== undefined) this.target.set(P.tx, .3, P.tz);
      for (; d < 90; d += .25) {
        cam.position.set(0, d * Math.sin(e), d * Math.cos(e)).add(this.target);
        cam.lookAt(cam.position.x, cam.position.y - Math.sin(pt) * 50, cam.position.z - Math.cos(pt) * 50);
        cam.updateMatrixWorld(true);
        const fit = corners.every(c => { const v = c.clone().project(cam); return Math.abs(v.x) < margin && v.y > -margin && v.y < P.top; });
        if (fit || P.dist) break;
      }
      this.dFit = d; this.camBase = cam.position.clone();
      this.lookAtPt = new T.Vector3(cam.position.x, cam.position.y - Math.sin(pt) * 50, cam.position.z - Math.cos(pt) * 50);
      this.needSize = false;
      return true;
    }
    visible() { return this.el.isConnected && this.el.clientWidth > 0 && this.el.clientHeight > 0; }

    // — picking —
    pick(e) {
      const rc = this.canvas.getBoundingClientRect();
      const nx = ((e.clientX - rc.left) / rc.width) * 2 - 1, ny = -((e.clientY - rc.top) / rc.height) * 2 + 1;
      this.ray.setFromCamera({ x: nx, y: ny }, this.camera);
      const p = new T.Vector3();
      if (!this.ray.ray.intersectPlane(this.plane, p)) return null;
      const c = Math.floor(p.x + HALF), r = Math.floor(p.z + HALF);
      return (r >= 0 && r < SIZE && c >= 0 && c < SIZE) ? { r, c } : null;
    }
    onMove(e) {
      const cell = this.pick(e);
      const ok = cell && this.opts.aim && this.marks && !this.marks[cell.r][cell.c];
      this.hover = ok ? cell : null;
      this.hoverMesh.visible = !!ok;
      if (ok) { const p = cellPos(cell.r, cell.c); this.hoverMesh.position.set(p.x, .13, p.z); }
      this.canvas.style.cursor = ok ? 'crosshair' : (this.opts.onCell ? 'pointer' : 'default');
    }
    onClick(e) {
      const cell = this.pick(e);
      if (cell && this.opts.onCell) this.opts.onCell(cell.r, cell.c);
    }

    // — state sync —
    update(marks, opts) {
      this.opts = opts; this.marks = marks;
      this.syncShips(opts.ships || []);
      this.syncCells(marks);
      if (opts.last) {
        const p = cellPos(opts.last[0], opts.last[1]);
        this.lastRing.position.set(p.x, .13, p.z); this.lastRing.visible = true;
      } else this.lastRing.visible = false;
      this.ready = true;
    }
    syncShips(list) {
      const seen = new Set();
      list.forEach(s => {
        const sig = s.cells.map(c => c.join(',')).join('|');
        seen.add(s.k);
        let rig = this.ships.get(s.k);
        if (rig && rig.sig !== sig) { this.removeShip(rig); this.ships.delete(s.k); rig = null; }
        if (!rig) {
          rig = this.makeRig(s, sig); this.ships.set(s.k, rig);
          if (s.sunk) this.sinkShip(rig, this.ready);        // TV reveals a ship the moment it goes down
        } else if (s.sunk && !rig.sunk) this.sinkShip(rig, true);
      });
      [...this.ships.keys()].forEach(k => { if (!seen.has(k)) { this.removeShip(this.ships.get(k)); this.ships.delete(k); } });
    }
    makeRig(s, sig) {
      const len = s.cells.length, rows = s.cells.map(c => c[0]), cols = s.cells.map(c => c[1]);
      const vertical = len > 1 && new Set(cols).size === 1;
      const r0 = Math.min(...rows), c0 = Math.min(...cols);
      const cx = vertical ? c0 + .5 : c0 + len / 2, cz = vertical ? r0 + len / 2 : r0 + .5;
      const inner = buildShip(s.k, len), outer = new T.Group();
      outer.add(inner);
      outer.position.set(cx - HALF, 0, cz - HALF);
      outer.rotation.y = vertical ? -Math.PI / 2 : 0;
      this.scene.add(outer);
      return { k: s.k, sig, outer, inner, sunk: false, phase: Math.random() * 6, sinkAt: 0, animate: false, baseY: s.k === 'sub' ? -.04 : 0, cx: outer.position.x, cz: outer.position.z, len, vertical };
    }
    removeShip(rig) {
      this.scene.remove(rig.outer);
      rig.outer.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    }
    sinkShip(rig, animate) {
      rig.sunk = true; rig.animate = animate; rig.sinkAt = this.now;
      rig.inner.traverse(o => { if (o.isMesh && o.material && !o.material.isMeshBasicMaterial) o.material = charMat(o.material); });
      const foam = rig.inner.userData.foam; if (foam) foam.forEach(f => { f.visible = false; });
      if (animate) this.fx.push(new Boom(this, rig.cx, .5, rig.cz, 1.1 + rig.len * .12, true));
    }
    syncCells(marks) {
      for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
        const m = marks[r][c], type = m === 'H' ? 'H' : m === 'X' ? 'X' : m === 'M' ? 'M' : '';
        const key = r * SIZE + c, prev = this.cellType.get(key) || '';
        if (type === prev) continue;
        this.cellType.set(key, type);
        const old = this.cellFx.get(key); if (old) { old.dispose(); this.cellFx.delete(key); }
        const { x, z } = cellPos(r, c);
        let fx = null;
        if (type === 'H') {
          fx = new Flame(this, x, z, .38, 1, false);
          if (this.ready) this.fx.push(new Boom(this, x, .35, z, .85, false));
        } else if (type === 'X') fx = new Flame(this, x, z, .12, .85, true);
        else if (type === 'M') fx = new Splash(this, x, z, this.ready);
        if (fx) this.cellFx.set(key, fx);
      }
    }

    // — per frame —
    frame(t) {
      if (!this.visible()) return;
      if (this.needSize && !this.resize()) return;
      if (!this.camBase) return;
      this.now = t;

      // water
      const pos = this.water.geometry.attributes.position, base = this.waterBase;
      for (let i = 0; i < pos.count; i++) pos.array[i * 3 + 1] = waveH(base[i * 3], base[i * 3 + 2], t);
      pos.needsUpdate = true; this.water.geometry.computeVertexNormals();
      this.bump.offset.set(t * .006, t * .004);

      // ships bob on the swell; sunk ones settle
      this.ships.forEach(rig => {
        const x = rig.cx, z = rig.cz, ph = rig.phase;
        let y = waveH(x, z, t) + rig.baseY + Math.sin(t * 1.3 + ph) * .012;
        let roll = Math.sin(t * .9 + ph) * .022, pitch = Math.cos(t * .7 + ph) * .014;
        if (rig.sunk) {
          const p = rig.animate ? Math.min(1, (t - rig.sinkAt) / 4.2) : 1, e = p * p * (3 - 2 * p);
          y += -.46 * e; roll += .42 * e * (rig.len % 2 ? 1 : -1); pitch += -.1 * e;
        }
        rig.inner.position.y = y; rig.inner.rotation.set(roll, 0, pitch);
        const foam = rig.inner.userData.foam;
        if (foam && !rig.sunk) foam.forEach((f, i) => { f.material.opacity = (i === 0 ? .26 : i === 1 ? .46 : .2) * (.8 + .2 * Math.sin(t * 2 + i + ph)); });
      });

      // effects
      this.cellFx.forEach(fx => fx.update(t));
      this.fx = this.fx.filter(f => { if (f.update(t)) return true; f.dispose(); return false; });

      // fire light flicker follows the most recent burst
      this.fireT *= .94;
      const base_i = Math.min(1.4, this.flames * .18);
      this.fireLight.intensity = Math.max(this.fireT, base_i) * (.85 + .15 * Math.sin(t * 17) * Math.sin(t * 11));
      if (this.flames && this.fireT < .1) {
        const f = [...this.cellFx.values()].find(x => x instanceof Flame);
        if (f) this.fireLight.position.set(f.x, 1, f.z);
      }

      // aim highlight + last-shot ring pulse
      if (this.hoverMesh.visible) this.hoverMesh.material.opacity = .3 + .15 * Math.sin(t * 6);
      if (this.lastRing.visible) { const s = 1 + (t * 1.3 % 1) * .5; this.lastRing.scale.set(s, 1, s); this.lastRing.material.opacity = .9 * (1 - (t * 1.3 % 1)); }

      // camera shake
      const cam = this.camera;
      if (this.shake > .002) {
        cam.position.set(this.camBase.x + rnd(-1, 1) * this.shake, this.camBase.y + rnd(-1, 1) * this.shake, this.camBase.z);
        this.shake *= .93;
      } else cam.position.copy(this.camBase);
      cam.lookAt(this.lookAtPt);

      this.renderer.render(this.scene, cam);
    }
  }

  API.render = function (el, marks, opts) {
    let b = el._bs3d;
    if (!b) {
      const mode = el.classList.contains('tv') ? 'tv' : el.classList.contains('mine') ? 'mine' : 'phone';
      b = el._bs3d = new Board(el, mode);
    }
    b.update(marks, opts || {});
  };
})();
