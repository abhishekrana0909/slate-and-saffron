// Living jungle behind every page: green mist, swaying fern shadows, falling leaves.
(function () {
  var html = document.documentElement, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, small = Math.min(innerWidth, innerHeight) < 700, calm = html.hasAttribute('data-calm'), fine = matchMedia('(pointer: fine)').matches;
  var mouse = { x: .5, y: .5, tx: .5, ty: .5, px: -999, py: -999 };
  addEventListener('pointermove', function (e) {
    mouse.tx = e.clientX / innerWidth; mouse.ty = 1 - e.clientY / innerHeight; mouse.px = e.clientX; mouse.py = e.clientY;
    if (ferns && fine) { ferns.style.setProperty('--mx', ((mouse.tx - .5) * 2).toFixed(3)); ferns.style.setProperty('--my', ((.5 - mouse.ty) * 2).toFixed(3)); }
  }, { passive: true });

  // ----- fern shadows -----
  var ferns = document.getElementById('ferns');
  function frond(n, w, seed) {
    var d = 'M0 0', i, t, y, x, l, a;
    for (i = 1; i <= n; i++) {
      t = i / n; y = -t * 1000; x = Math.sin(t * 2.1 + seed) * 70 * t; l = w * Math.sin(Math.PI * Math.min(1, t * .92 + .08)) * (1 - t * .25);
      a = 150 * t; // leaflets get shorter toward the tip
      d += 'M' + x.toFixed(0) + ' ' + y.toFixed(0) + 'Q' + (x + l * .55).toFixed(0) + ' ' + (y - 34).toFixed(0) + ' ' + (x + l).toFixed(0) + ' ' + (y - 66 - a * .2).toFixed(0) + 'Q' + (x + l * .45).toFixed(0) + ' ' + (y + 14).toFixed(0) + ' ' + x.toFixed(0) + ' ' + y.toFixed(0) + 'Z';
      d += 'M' + x.toFixed(0) + ' ' + y.toFixed(0) + 'Q' + (x - l * .55).toFixed(0) + ' ' + (y - 34).toFixed(0) + ' ' + (x - l).toFixed(0) + ' ' + (y - 66 - a * .2).toFixed(0) + 'Q' + (x - l * .45).toFixed(0) + ' ' + (y + 14).toFixed(0) + ' ' + x.toFixed(0) + ' ' + y.toFixed(0) + 'Z';
    }
    return d;
  }
  if (ferns) {
    var spec = [
      { l: '-7%', t: '58%', s: 'min(46vw, 560px)', r: 28, c: '#1c4a33', d: '7.4s', z: 10 },
      { l: '-4%', t: '-16%', s: 'min(40vw, 500px)', r: 148, c: '#163b2a', d: '8.9s', z: 7 },
      { r2: '-7%', t: '-20%', s: 'min(46vw, 580px)', r: 214, c: '#1c4a33', d: '8.1s', z: 9 },
      { r2: '-6%', t: '50%', s: 'min(44vw, 540px)', r: 332, c: '#225a3d', d: '6.8s', z: 13 },
      { l: '36%', t: '76%', s: 'min(28vw, 340px)', r: 8, c: '#123326', d: '9.6s', z: 5 },
    ];
    if (small) spec = spec.slice(0, 4);
    ferns.innerHTML = spec.map(function (f, i) {
      return '<div class="fern" style="' + (f.l ? 'left:' + f.l : 'right:' + f.r2) + ';top:' + f.t + ';--s:' + f.s + ';--r0:' + f.r + 'deg;--d:' + f.d + ';--ox:50%;--oy:100%;--z:' + f.z + ';transform:rotate(' + f.r + 'deg)"><svg viewBox="-360 -1120 720 1130" fill="' + f.c + '" opacity=".9"><path d="M0 0Q' + (30 + i * 6) + ' -500 ' + (Math.sin(2.1 + i) * 70).toFixed(0) + ' -1000" fill="none" stroke="' + f.c + '" stroke-width="12"/><path d="' + frond(26, 300, i) + '"/></svg></div>';
    }).join('');
  }

  // ----- mist (same idea as StarPath's smoke, in forest colours) -----
  var canvas = document.getElementById('bg'), gl = null;
  try { gl = canvas && canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' }); } catch (e) {}
  var tint = { a: hex(getComputedStyle(html).getPropertyValue('--acc')), t: null };
  function hex(s) { s = (s || '#D9A441').trim(); return s[0] === '#' ? [parseInt(s.slice(1, 3), 16) / 255, parseInt(s.slice(3, 5), 16) / 255, parseInt(s.slice(5, 7), 16) / 255] : [.85, .64, .25]; }
  window.GA_tint = function (color) { tint.t = hex(color); };
  if (gl) {
    var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var FS = 'precision mediump float;uniform vec2 R;uniform float T;uniform vec2 M;uniform vec3 C;' +
      'float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}' +
      'float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(h(i),h(i+vec2(1,0)),u.x)+(h(i+vec2(0,1))-h(i))*u.y*(1.-u.x)+(h(i+vec2(1,1))-h(i+vec2(1,0)))*u.x*u.y;}' +
      'float f(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<4;i++){v+=a*n(p);p=m*p;a*=.5;}return v;}' +
      'void main(){vec2 uv=gl_FragCoord.xy/R;vec2 p=(uv-.5)*vec2(R.x/R.y,1.)*2.2;float t=T*.05;vec2 md=(M-uv)*vec2(R.x/R.y,1.);float d=length(md);p+=md*.14*exp(-d*2.5);' +
      'vec2 q=vec2(f(p+vec2(0.,t)),f(p+vec2(5.2,1.3)-t));vec2 r=vec2(f(p+3.2*q+vec2(1.7,9.2)+.5*t),f(p+3.2*q+vec2(8.3,2.8)+.4*t));float v=f(p+3.*r);' +
      'vec3 c=vec3(.028,.058,.046);c=mix(c,vec3(.075,.26,.16),clamp(v*v*2.7,0.,1.));c=mix(c,vec3(.03,.16,.13),clamp(length(q)*.8,0.,1.)*.55);c=mix(c,C,clamp(r.x*r.x*1.5,0.,1.)*.2);c+=C*.08*exp(-d*d*9.);' +
      'float g=smoothstep(1.25,.25,length(uv-.5));c*=.42+.58*g;gl_FragColor=vec4(c,1.);}';
    var sh = function (ty, src) { var s = gl.createShader(ty); gl.shaderSource(s, src); gl.compileShader(s); return s; };
    var P = gl.createProgram(); gl.attachShader(P, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(P, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(P);
    if (gl.getProgramParameter(P, gl.LINK_STATUS)) {
      gl.useProgram(P);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var a = gl.getAttribLocation(P, 'p'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
      var uR = gl.getUniformLocation(P, 'R'), uT = gl.getUniformLocation(P, 'T'), uM = gl.getUniformLocation(P, 'M'), uC = gl.getUniformLocation(P, 'C');
      var scale = small ? .35 : .5, cur = tint.a.slice();
      var size = function () { canvas.width = Math.max(2, innerWidth * scale | 0); canvas.height = Math.max(2, innerHeight * scale | 0); gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform2f(uR, canvas.width, canvas.height); draw(performance.now()); };
      var draw = function (now) {
        mouse.x += (mouse.tx - mouse.x) * .05; mouse.y += (mouse.ty - mouse.y) * .05;
        if (tint.t) for (var i = 0; i < 3; i++) cur[i] += (tint.t[i] - cur[i]) * .04;
        gl.uniform1f(uT, now / 1000); gl.uniform2f(uM, mouse.x, mouse.y); gl.uniform3f(uC, cur[0], cur[1], cur[2]); gl.drawArrays(gl.TRIANGLES, 0, 3);
      };
      addEventListener('resize', size); size();
      if (!reduce) { var last = 0, loop = function (t) { requestAnimationFrame(loop); if (document.hidden || t - last < 33) return; last = t; draw(t); }; requestAnimationFrame(loop); }
    }
  }

  // ----- falling leaves -----
  var fx = document.getElementById('fx');
  if (fx && !reduce) {
    var ctx = fx.getContext('2d'), W, H, COUNT = (small ? 7 : 16) * (calm ? .4 : 1) | 0;
    var cols = ['#7FB069', '#D9A441', '#3F8F5F', '#B5653A'], L = [];
    var rs = function () { W = fx.width = innerWidth; H = fx.height = innerHeight; };
    rs(); addEventListener('resize', rs);
    var mk = function (top) { return { x: Math.random() * W, y: top ? -30 : Math.random() * H, s: 7 + Math.random() * 12, v: .25 + Math.random() * .5, a: Math.random() * 6.28, sp: .004 + Math.random() * .012, drift: Math.random() * 6.28, c: cols[Math.random() * 4 | 0], o: .35 + Math.random() * .4, pushX: 0 }; };
    for (var k = 0; k < COUNT; k++) L.push(mk());
    var tick = function () {
      requestAnimationFrame(tick);
      if (document.hidden) return;
      ctx.clearRect(0, 0, W, H);
      L.forEach(function (l, i) {
        l.y += l.v; l.drift += .012; l.a += l.sp;
        var dx = l.x - mouse.px, dy = l.y - mouse.py, d2 = dx * dx + dy * dy;
        if (d2 < 14400) l.pushX += (dx > 0 ? .18 : -.18);
        l.pushX *= .95; l.x += Math.sin(l.drift) * .5 + l.pushX;
        if (l.y > H + 30) { L[i] = mk(true); return; }
        ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.a + Math.sin(l.drift) * .7); ctx.globalAlpha = l.o; ctx.fillStyle = l.c;
        ctx.beginPath(); ctx.moveTo(0, -l.s); ctx.quadraticCurveTo(l.s * .75, -l.s * .1, 0, l.s); ctx.quadraticCurveTo(-l.s * .75, -l.s * .1, 0, -l.s); ctx.fill(); ctx.restore();
      });
    };
    if (COUNT) requestAnimationFrame(tick);
  } else if (fx) fx.remove();
})();
