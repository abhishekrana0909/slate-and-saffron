// The 3D Earth: dots coloured by continent, drag to spin, click a continent, dishes in orbit.
import * as THREE from '../vendor/three.module.min.js';

const KEYS = ['asia', 'europe', 'africa', 'north-america', 'south-america', 'oceania'];
const P = [
  [3, [[-168,66],[-162,70],[-156,71],[-141,70],[-128,70],[-115,68],[-95,69],[-85,70],[-82,67],[-93,59],[-85,55],[-80,52],[-79,55],[-77,62],[-70,62],[-65,59],[-60,54],[-56,52],[-60,47],[-66,45],[-70,43],[-74,40],[-76,35],[-81,31],[-80,25],[-82,28],[-85,30],[-90,29],[-97,27],[-97,22],[-95,18],[-90,21],[-87,21],[-88,16],[-83,15],[-83,10],[-79,9],[-81,7],[-85,10],[-92,14],[-96,16],[-105,20],[-109,26],[-113,31],[-117,32],[-121,35],[-124,40],[-124,47],[-128,51],[-134,57],[-146,60],[-152,59],[-158,56],[-164,54],[-160,59],[-166,62]]],
  [3, [[-60,76],[-70,77],[-60,82],[-35,83],[-20,80],[-20,72],[-30,68],[-43,60],[-50,62],[-54,68]]],
  [3, [[-84,22],[-75,20],[-78,23]]],
  [4, [[-77,8],[-72,12],[-62,11],[-52,5],[-50,0],[-44,-2],[-35,-6],[-35,-9],[-39,-15],[-40,-22],[-48,-26],[-53,-33],[-58,-36],[-62,-39],[-65,-42],[-66,-47],[-69,-52],[-72,-53],[-74,-48],[-73,-40],[-71,-30],[-70,-18],[-76,-14],[-81,-6],[-80,-2],[-78,2]]],
  [1, [[-9,37],[-9,43],[-2,43],[-1,46],[-4,48],[2,51],[8,54],[9,56],[12,54],[20,55],[24,59],[30,60],[34,65],[40,67],[45,68],[60,69],[60,50],[50,47],[48,42],[39,44],[37,46],[33,45],[30,46],[28,42],[26,40],[23,38],[22,37],[19,41],[14,45],[18,40],[16,38],[12,42],[8,44],[3,43],[0,39],[-2,37],[-5,36]]],
  [1, [[5,59],[6,62],[14,68],[25,71],[30,70],[29,62],[30,60],[22,60],[21,64],[24,66],[17,61],[18,59],[13,55],[11,59]]],
  [1, [[-5,50],[1,51],[1,53],[-2,56],[-3,58],[-6,58],[-5,54],[-5,52]]],
  [1, [[-10,52],[-6,52],[-6,55],[-9,55]]],
  [1, [[-24,65],[-14,64],[-14,66],[-22,66.5]]],
  [0, [[27,37],[36,36],[35,32],[35,28],[39,21],[43,13],[52,16],[59,22],[56,26],[50,26],[48,30],[52,28],[57,26],[61,25],[67,25],[72,21],[73,16],[77,8],[80,13],[82,17],[87,21],[91,22],[94,18],[98,16],[99,9],[103,2],[104,1],[101,7],[103,13],[106,10],[109,13],[106,19],[110,21],[117,23],[121,29],[122,31],[119,35],[122,37],[118,39],[121,40],[125,39],[127,35],[129,37],[128,40],[132,43],[140,50],[135,54],[142,59],[155,59],[163,61],[157,51],[163,56],[170,60],[179,63],[180,68],[170,70],[150,71],[130,72],[113,74],[100,77],[80,73],[68,72],[60,69],[60,50],[50,47],[48,42],[41,41.5],[36,42],[28,41],[26,39]]],
  [0, [[130,32],[135,33],[140,35],[142,40],[145,44],[141,45],[139,38],[132,35]]],
  [0, [[80,9.5],[82,7],[80.5,6]]],
  [0, [[95,5],[105,-5],[103,-5.5],[95,3]]],
  [0, [[109,1],[117,7],[118,1],[115,-4],[110,-3]]],
  [0, [[105,-6],[115,-7],[115,-8.5],[106,-7.5]]],
  [0, [[120,18],[122,18],[125,8],[122,7],[120,14]]],
  [2, [[-17,15],[-17,21],[-13,27],[-9,32],[-6,36],[3,37],[10,37],[11,33],[20,31],[25,32],[32,31],[35,28],[37,21],[39,15],[43,12],[51,12],[48,5],[41,-2],[39,-6],[40,-15],[35,-20],[35,-24],[32,-28],[26,-34],[19,-35],[15,-27],[12,-17],[13,-6],[9,-1],[9,4],[3,6],[-5,5],[-8,4],[-13,8]]],
  [2, [[44,-16],[49,-12],[50,-16],[47,-25],[44,-25]]],
  [5, [[113,-22],[122,-18],[129,-15],[131,-12],[137,-12],[136,-15],[140,-17],[142,-11],[146,-19],[153,-26],[153,-31],[150,-37],[146,-39],[140,-38],[135,-35],[129,-32],[123,-34],[115,-34]]],
  [5, [[173,-35],[178,-38],[175,-41],[174,-39]]],
  [5, [[172,-41],[174,-42],[170,-46],[167,-46],[168,-44]]],
  [5, [[131,-1],[141,-3],[147,-6],[150,-10],[143,-9],[138,-8]]],
  [5, [[145,-41],[148,-41],[147,-43.5],[146,-43.5]]],
];
const CENTRE = { asia: [90, 32], europe: [15, 48], africa: [20, 4], 'north-america': [-100, 42], 'south-america': [-60, -15], oceania: [140, -24] };

function inPoly(lon, lat, poly) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) c = !c;
  }
  return c;
}
const continentAt = (lon, lat) => { for (const [k, poly] of P) if (inPoly(lon, lat, poly)) return k; return -1; };

const wrap = document.getElementById('globeW'), canvas = document.getElementById('globe');
if (wrap && canvas && window.GA) start();

function start() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, small = innerWidth < 700;
  const orbs = [...document.querySelectorAll('.orb')], tip = document.getElementById('gTip');
  const orbit = () => {
    if (!orbs.length) return;
    const w = wrap.clientWidth, R = w * .47;
    orbs.forEach((o, i) => {
      const a = orbA + i / orbs.length * Math.PI * 2, x = Math.cos(a) * R, y = Math.sin(a) * R * .34 - Math.cos(a) * R * .12, z = Math.sin(a);
      const s = .72 + (z + 1) * .2;
      o.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${s.toFixed(3)})`;
      o.style.zIndex = z > 0 ? 5 : 1;
      o.style.opacity = (z > 0 ? 1 : .55 + (z + 1) * .4) * introT;
    });
  };
  let orbA = 0, orbPause = false, introT = document.documentElement.classList.contains('intro') ? 0 : 1, intro = introT;
  orbs.forEach(o => { o.addEventListener('pointerenter', () => orbPause = true); o.addEventListener('pointerleave', () => orbPause = false); });

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' }); }
  catch (e) { canvas.remove(); orbit(); return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.5 : 2));

  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(32, 1, .1, 20);
  cam.position.z = 5.05;
  const earth = new THREE.Group();
  scene.add(earth);
  earth.add(new THREE.Mesh(new THREE.SphereGeometry(.992, 64, 48), new THREE.MeshBasicMaterial({ color: 0xffffff })));

  const N = small ? 9000 : 15000, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), group = new Float32Array(N), sz = new Float32Array(N);
  const palette = KEYS.map(k => new THREE.Color(GA.conts[k].a)), sea = new THREE.Color('#d9e8f4'), gold = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < N; i++) {
    const y = 1 - (i + .5) / N * 2, r = Math.sqrt(1 - y * y), th = i * gold;
    const x = Math.cos(th) * r, z = Math.sin(th) * r;
    pos.set([x, y, z], i * 3);
    const lat = Math.asin(y) * 180 / Math.PI, lon = Math.atan2(x, z) * 180 / Math.PI;
    const k = continentAt(lon, lat), c = k < 0 ? sea : palette[k];
    col.set([c.r, c.g, c.b], i * 3);
    group[i] = k; sz[i] = k < 0 ? .55 : 1;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('grp', new THREE.BufferAttribute(group, 1));
  geo.setAttribute('sz', new THREE.BufferAttribute(sz, 1));
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    uniforms: { uS: { value: 1 }, uH: { value: -2 } },
    vertexShader: `attribute vec3 color; attribute float grp; attribute float sz; uniform float uS; uniform float uH; varying vec3 vC; varying float vH;
      void main(){ vC=color; vH=abs(grp-uH)<.5?1.:0.; vec4 mv=modelViewMatrix*vec4(position,1.); gl_Position=projectionMatrix*mv; gl_PointSize=uS*sz*(1.+vH*.5)*(5.05/-mv.z); }`,
    fragmentShader: `varying vec3 vC; varying float vH; void main(){ float d=length(gl_PointCoord-.5); if(d>.5) discard; gl_FragColor=vec4(vC+vH*.12,1.); }`,
  });
  earth.add(new THREE.Points(geo, mat));

  const toRad = THREE.MathUtils.degToRad;
  let rotY = toRad(-78), rotX = toRad(14), velY = 0, drag = null, moved = 0, targetY = null, targetX = null, hover = -2, visible = true;

  function resize() {
    const s = wrap.clientWidth;
    renderer.setSize(s, s, false);
    mat.uniforms.uS.value = Math.max(2.1, s / 196) * renderer.getPixelRatio() / (small ? 1.05 : 1.15);
    orbit();
  }
  new ResizeObserver(resize).observe(wrap);
  new IntersectionObserver(e => { visible = e[0].isIntersecting; }).observe(wrap);
  resize();

  function hit(ev) {
    const b = canvas.getBoundingClientRect(), v = new THREE.Vector3((ev.clientX - b.left) / b.width * 2 - 1, -(ev.clientY - b.top) / b.height * 2 + 1, .5).unproject(cam).sub(cam.position).normalize();
    const o = cam.position, bq = o.dot(v), disc = bq * bq - o.dot(o) + 1;
    if (disc < 0) return -1;
    const p = o.clone().addScaledVector(v, -bq - Math.sqrt(disc)).applyQuaternion(earth.quaternion.clone().invert());
    return continentAt(Math.atan2(p.x, p.z) * 180 / Math.PI, Math.asin(THREE.MathUtils.clamp(p.y, -1, 1)) * 180 / Math.PI);
  }
  const lang = document.documentElement.dataset.lang === 'hi' ? 1 : 0;
  function setHover(k, ev) {
    hover = k < 0 ? -2 : k;
    mat.uniforms.uH.value = hover;
    canvas.style.cursor = k >= 0 && !drag ? 'pointer' : '';
    if (tip) {
      tip.style.opacity = k >= 0 ? 1 : 0;
      if (k >= 0 && ev) { const b = wrap.getBoundingClientRect(); tip.textContent = GA.conts[KEYS[k]].n[lang]; tip.style.transform = `translate(${ev.clientX - b.left + 14}px,${ev.clientY - b.top - 34}px)`; }
    }
    if (k >= 0) { document.documentElement.style.setProperty('--acc', GA.conts[KEYS[k]].a); document.documentElement.style.setProperty('--acc2', GA.conts[KEYS[k]].b); }
  }
  canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY }; moved = 0; targetY = null; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', e => {
    if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y; moved += Math.abs(dx) + Math.abs(dy); drag.x = e.clientX; drag.y = e.clientY;
      velY = dx * .0075; rotY += velY; rotX = THREE.MathUtils.clamp(rotX + dy * .005, -1, 1);
    } else if (e.pointerType === 'mouse') setHover(hit(e), e);
  });
  const up = e => {
    if (drag && moved < 8) { const k = hit(e); if (k >= 0) location.href = 'c/' + KEYS[k] + '/'; }
    drag = null;
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', () => drag = null);
  canvas.addEventListener('pointerleave', () => { if (!drag) setHover(-1); });
  document.querySelectorAll('.chip[data-c]').forEach(ch => {
    ch.addEventListener('pointerenter', () => {
      const [lon, lat] = CENTRE[ch.dataset.c], k = KEYS.indexOf(ch.dataset.c);
      targetY = -toRad(lon); targetX = toRad(lat);
      mat.uniforms.uH.value = k;
      document.documentElement.style.setProperty('--acc', GA.conts[KEYS[k]].a);
      document.documentElement.style.setProperty('--acc2', GA.conts[KEYS[k]].b);
    });
    ch.addEventListener('pointerleave', () => { targetY = null; targetX = null; mat.uniforms.uH.value = -2; });
  });
  addEventListener('ga:bookdone', () => { intro = 1; });

  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible || document.hidden) { clock.getDelta(); return; }
    const raw = clock.getDelta(), dt = Math.min(raw, .05);
    introT += (intro - introT) * Math.min(1, raw * 3.4);
    if (intro - introT < .004) introT = intro;
    if (targetY !== null) {
      let d = (targetY - rotY) % (Math.PI * 2);
      if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2;
      rotY += d * Math.min(1, dt * 4); rotX += (targetX - rotX) * Math.min(1, dt * 4);
    } else if (!drag) {
      velY *= .94;
      rotY += velY + (reduce || hover >= 0 ? 0 : dt * .16);
    }
    earth.rotation.set(rotX, rotY, 0);
    const s = .5 + .5 * introT;
    earth.scale.setScalar(s);
    canvas.style.opacity = introT;
    if (!orbPause && !reduce) orbA += dt * .26;
    orbit();
    renderer.render(scene, cam);
  }
  frame();
}
