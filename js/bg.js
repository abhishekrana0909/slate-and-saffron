// Background behind every page: black slate with a very slow, faint smoke.
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, small = Math.min(innerWidth, innerHeight) < 700;
  var canvas = document.getElementById('bg'), gl = null, mouse = { x: .5, y: .5, tx: .5, ty: .5 };
  try { gl = canvas && canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' }); } catch (e) {}
  if (!gl) return;
  addEventListener('pointermove', function (e) { mouse.tx = e.clientX / innerWidth; mouse.ty = 1 - e.clientY / innerHeight; }, { passive: true });
  function hex(s) { s = (s || '#D9A441').trim(); return s[0] === '#' ? [parseInt(s.slice(1, 3), 16) / 255, parseInt(s.slice(3, 5), 16) / 255, parseInt(s.slice(5, 7), 16) / 255] : [.85, .64, .25]; }
  var want = hex(getComputedStyle(document.documentElement).getPropertyValue('--acc')), cur = want.slice();
  window.GA_tint = function (color) { want = hex(color); };
  var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FS = 'precision mediump float;uniform vec2 R;uniform float T;uniform vec2 M;uniform vec3 C;' +
    'float h(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}' +
    'float n(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);return mix(h(i),h(i+vec2(1,0)),u.x)+(h(i+vec2(0,1))-h(i))*u.y*(1.-u.x)+(h(i+vec2(1,1))-h(i+vec2(1,0)))*u.x*u.y;}' +
    'float f(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<4;i++){v+=a*n(p);p=m*p;a*=.5;}return v;}' +
    'void main(){vec2 uv=gl_FragCoord.xy/R;vec2 p=(uv-.5)*vec2(R.x/R.y,1.)*2.2;float t=T*.035;vec2 md=(M-uv)*vec2(R.x/R.y,1.);float d=length(md);p+=md*.1*exp(-d*2.5);' +
    'vec2 q=vec2(f(p+vec2(0.,t)),f(p+vec2(5.2,1.3)-t));float v=f(p+3.*q+.4*t);' +
    'vec3 c=vec3(.042,.044,.047);c=mix(c,vec3(.115,.118,.124),clamp(v*v*2.,0.,1.));c=mix(c,C*.5+.03,clamp(q.x*q.x*1.2,0.,1.)*.06);' +
    'float g=smoothstep(1.3,.25,length(uv-.5));c*=.55+.45*g;gl_FragColor=vec4(c,1.);}';
  var sh = function (ty, src) { var s = gl.createShader(ty); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  var P = gl.createProgram(); gl.attachShader(P, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(P, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(P);
  if (!gl.getProgramParameter(P, gl.LINK_STATUS)) return;
  gl.useProgram(P);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var a = gl.getAttribLocation(P, 'p'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
  var uR = gl.getUniformLocation(P, 'R'), uT = gl.getUniformLocation(P, 'T'), uM = gl.getUniformLocation(P, 'M'), uC = gl.getUniformLocation(P, 'C');
  var scale = small ? .35 : .5;
  function draw(now) {
    mouse.x += (mouse.tx - mouse.x) * .05; mouse.y += (mouse.ty - mouse.y) * .05;
    for (var i = 0; i < 3; i++) cur[i] += (want[i] - cur[i]) * .04;
    gl.uniform1f(uT, now / 1000); gl.uniform2f(uM, mouse.x, mouse.y); gl.uniform3f(uC, cur[0], cur[1], cur[2]); gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function size() { canvas.width = Math.max(2, innerWidth * scale | 0); canvas.height = Math.max(2, innerHeight * scale | 0); gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform2f(uR, canvas.width, canvas.height); draw(performance.now()); }
  addEventListener('resize', size); size();
  if (!reduce) { var last = 0, loop = function (t) { requestAnimationFrame(loop); if (document.hidden || t - last < 33) return; last = t; draw(t); }; requestAnimationFrame(loop); }
})();
