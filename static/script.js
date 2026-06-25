import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';

/* ══════════════════════════════════════════
   NEURAL CANVAS — soft, minimal palette
══════════════════════════════════════════ */
const nc = document.getElementById('nc');
const nctx = nc.getContext('2d');
let NW, NH, NCX, NCY, nodes = [], edges = [], pulses = [];
let thinking = false, thinkI = 0, nfr = 0, NT = 0;

// Fewer rings, more breathing room
const RINGS   = [0.15, 0.30, 0.46, 0.62];
const RC      = [5, 11, 18, 25];

function nresize() {
  const p = nc.parentElement;
  NW = nc.width  = p.offsetWidth;
  NH = nc.height = p.offsetHeight;
  NCX = NW * 0.5;
  NCY = NH * 0.48;
  nbuild();
}

function nbuild() {
  nodes = []; edges = [];
  const mR = Math.min(NW, NH) * 0.42;

  nodes.push({ x:NCX, y:NCY, r:6, ring:-1, angle:0, oR:0, spd:0,
    color:'core', glow:1, active:false, cd:0 });

  RINGS.forEach((f, ri) => {
    const oR = mR * f, cnt = RC[ri];
    for (let i = 0; i < cnt; i++) {
      const a = (i / cnt) * Math.PI * 2 + ri * 0.7;
      const jit = (Math.random() - .5) * oR * 0.18;
      const r = oR + jit;
      nodes.push({
        x: NCX + Math.cos(a) * r, y: NCY + Math.sin(a) * r,
        r: ri < 1 ? 4.5 : ri < 2 ? 3.5 : ri < 3 ? 2.5 : 2,
        ring: ri, angle: a, oR: r,
        spd: (.0003 + Math.random() * .0004) * (ri % 2 ? -1 : 1),
        color: ['hub','inner','mid','outer'][ri] || 'outer',
        glow: .3 + Math.random() * .7, active: false, cd: 0
      });
    }
  });

  // sparse scatter
  for (let i = 0; i < 12; i++) {
    const a = Math.random() * Math.PI * 2, d = mR * (.68 + Math.random() * .38);
    nodes.push({ x: NCX+Math.cos(a)*d, y: NCY+Math.sin(a)*d,
      r: 1.2, ring: 4, angle: a, oR: d,
      spd: (.0001+Math.random()*.0002)*(Math.random()>.5?1:-1),
      vx: (Math.random()-.5)*.1, vy: (Math.random()-.5)*.1,
      color: 'scatter', glow: .2+Math.random()*.4, active:false, cd:0 });
  }

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
      const d = Math.sqrt(dx*dx + dy*dy);
      const th = nodes[i].ring===-1||nodes[j].ring===-1 ? 210
               : Math.abs(nodes[i].ring-nodes[j].ring)<=1 ? 120 : 55;
      if (d < th && Math.random() < .48)
        edges.push({ a:i, b:j, d, ba:(1-d/th)*.12 });
    }
  }
}

function mkp(f, t) {
  pulses.push({ from:f, to:t, t:0, spd:.01+Math.random()*.016, active:thinking, sz:1.5+Math.random()*1.8 });
}
function trigThink() {
  for (let i = 0; i < 12; i++)
    setTimeout(() => { const e = edges[Math.floor(Math.random()*edges.length)]; if(e) mkp(e.a,e.b); }, i*70);
}
function trigResp() {
  for (let i = 0; i < 20; i++)
    setTimeout(() => {
      const o = nodes.filter(n => n.ring >= 2);
      const s = o[Math.floor(Math.random()*o.length)];
      if (s) mkp(nodes.indexOf(s), 0);
    }, i*55);
  setTimeout(() => thinking = false, 1800);
}

function nupdate() {
  NT += .006; nfr++;
  thinkI += ((thinking ? 1 : 0) - thinkI) * .04;

  nodes.forEach((n, i) => {
    if (n.ring >= 0) {
      n.angle += n.spd * (1 + thinkI * 3.2);
      const w = Math.sin(NT * .75 + i * .5) * 3;
      n.x = NCX + Math.cos(n.angle) * (n.oR + w);
      n.y = NCY + Math.sin(n.angle) * (n.oR + w);
    }
    if (n.ring === 4) {
      n.x += n.vx * (1 + thinkI * 1.8);
      n.y += n.vy * (1 + thinkI * 1.8);
      const dx = n.x-NCX, dy = n.y-NCY, d = Math.sqrt(dx*dx+dy*dy);
      const mD = Math.min(NW,NH)*.5;
      if (d > mD) { n.vx -= (dx/d)*.04; n.vy -= (dy/d)*.04; }
    }
    if (n.cd > 0) n.cd -= .022; else n.active = false;
  });

  if (thinking && nfr % 18 === 0) { const e=edges[Math.floor(Math.random()*edges.length)]; if(e) mkp(e.a,e.b); }
  if (!thinking && nfr % 110 === 0) { const e=edges[Math.floor(Math.random()*edges.length)]; if(e) mkp(e.a,e.b); }

  pulses = pulses.filter(p => p.t < 1);
  pulses.forEach(p => {
    p.t += p.spd * (1 + thinkI * 2);
    if (p.t >= 1) {
      const d = nodes[p.to]; if (d) { d.active=true; d.cd=1; }
      if (thinking && Math.random() < .5) {
        const ne = edges.filter(e => e.a===p.to||e.b===p.to);
        if (ne.length) { const e=ne[Math.floor(Math.random()*ne.length)]; mkp(p.to, e.a===p.to?e.b:e.a); }
      }
    }
  });
}

function ndraw() {
  nctx.clearRect(0, 0, NW, NH);
  const I = thinkI;

  // soft radial glow — muted blue/teal, not neon
  const aR = 65 + Math.sin(NT*1.8)*10 + I*70;
  const ag = nctx.createRadialGradient(NCX,NCY,0, NCX,NCY,aR*2.6);
  ag.addColorStop(0, `rgba(100,160,255,${.03+I*.07})`);
  ag.addColorStop(.6, `rgba(60,100,200,${.012+I*.025})`);
  ag.addColorStop(1, 'transparent');
  nctx.fillStyle = ag;
  nctx.beginPath(); nctx.arc(NCX,NCY,aR*2.6,0,Math.PI*2); nctx.fill();

  // ring guides
  RINGS.forEach(f => {
    const oR = Math.min(NW,NH)*.42*f;
    nctx.beginPath(); nctx.arc(NCX,NCY,oR,0,Math.PI*2);
    nctx.strokeStyle = `rgba(139,184,255,${.018+I*.03})`;
    nctx.lineWidth = .5; nctx.setLineDash([2,9]); nctx.stroke(); nctx.setLineDash([]);
  });

  // edges
  edges.forEach(e => {
    const a=nodes[e.a], b=nodes[e.b];
    const act = a.active || b.active;
    const al = e.ba * (1+I*2.2) * (act?3:1);
    if (al < .008) return;
    nctx.beginPath(); nctx.moveTo(a.x,a.y); nctx.lineTo(b.x,b.y);
    nctx.strokeStyle = act && I>.12
      ? `rgba(139,184,255,${Math.min(al,.45)})`
      : `rgba(100,${140+I*80},${220+I*35},${al})`;
    nctx.lineWidth = act ? 1.2 : .5; nctx.stroke();
  });

  // pulses
  pulses.forEach(p => {
    const a=nodes[p.from], b=nodes[p.to]; if(!a||!b) return;
    const px=a.x+(b.x-a.x)*p.t, py=a.y+(b.y-a.y)*p.t;
    const t0=Math.max(0,p.t-.16);
    const tx=a.x+(b.x-a.x)*t0, ty=a.y+(b.y-a.y)*t0;
    const gr=nctx.createLinearGradient(tx,ty,px,py);
    gr.addColorStop(0,'transparent');
    gr.addColorStop(1, p.active?'rgba(139,184,255,0.82)':'rgba(100,200,220,0.5)');
    nctx.beginPath(); nctx.moveTo(tx,ty); nctx.lineTo(px,py);
    nctx.strokeStyle=gr; nctx.lineWidth=1.6; nctx.stroke();
    const pR = p.sz + (p.active?I*2.5:0);
    nctx.beginPath(); nctx.arc(px,py,pR,0,Math.PI*2);
    nctx.fillStyle = p.active ? '#a8c8ff' : '#88d8e8'; nctx.fill();
    const gg=nctx.createRadialGradient(px,py,0,px,py,pR*5);
    gg.addColorStop(0, p.active?`rgba(139,184,255,${.45+I*.25})`:'rgba(100,200,220,0.25)');
    gg.addColorStop(1,'transparent');
    nctx.beginPath(); nctx.arc(px,py,pR*5,0,Math.PI*2); nctx.fillStyle=gg; nctx.fill();
  });

  // nodes
  nodes.forEach((n, i) => {
    const core = n.ring===-1;
    const bG = n.glow*(1+I*1.6), aB=n.active?2.8:1;
    const pls = Math.sin(NT*1.5+i*.8)*.28+.72;
    let col;
    if      (core)              col=`rgba(180,210,255,${.9+I*.1})`;
    else if (n.color==='hub')   col=`rgba(200,220,255,${.8*bG*aB})`;
    else if (n.color==='inner') col=`rgba(139,184,255,${.7*bG*aB})`;
    else if (n.color==='mid')   col=`rgba(110,170,255,${.55*bG*aB})`;
    else if (n.color==='outer') col=`rgba(127,232,216,${.45*bG*aB})`;
    else                        col=`rgba(100,140,220,${.35*bG*aB*pls})`;

    const r = n.r*(core?1+Math.sin(NT*2)*.14+I*.5:1);
    const gs = r*(core?7:n.active?8:3.8)*(1+I*.7);
    const gg=nctx.createRadialGradient(n.x,n.y,0,n.x,n.y,gs);
    const ha=(core?.38:n.active?.42:.1)*(1+I*.7);
    gg.addColorStop(0, col.replace(/[\d.]+\)$/, `${Math.min(ha,.75)})`));
    gg.addColorStop(1,'transparent');
    nctx.beginPath(); nctx.arc(n.x,n.y,gs,0,Math.PI*2); nctx.fillStyle=gg; nctx.fill();
    nctx.beginPath(); nctx.arc(n.x,n.y,r,0,Math.PI*2); nctx.fillStyle=col; nctx.fill();

    if (core) {
      [[r+4+I*7,.3+I*.32],[r+14+I*18,.1+I*.16],[r+28+I*32,.04+I*.08]].forEach(([rr,op])=>{
        nctx.beginPath(); nctx.arc(n.x,n.y,rr,0,Math.PI*2);
        nctx.strokeStyle=`rgba(180,210,255,${op})`; nctx.lineWidth=.8; nctx.stroke();
      });
    }
  });
}

window.addEventListener('resize', () => nresize());
setTimeout(() => nresize(), 80);

/* ══════════════════════════════════════════
   VRM — THREE.JS
   Bigger model, natural warm-ish lighting,
   no tinted scanline filter
══════════════════════════════════════════ */
const vrmCanvas = document.getElementById('vrmCanvas');

const renderer = new THREE.WebGLRenderer({
  canvas: vrmCanvas, alpha: true, antialias: true
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(vrmCanvas.parentElement.offsetWidth, vrmCanvas.parentElement.offsetHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();

// Camera — closer, more portrait framing
const camera = new THREE.PerspectiveCamera(
  26,
  vrmCanvas.parentElement.offsetWidth / vrmCanvas.parentElement.offsetHeight,
  0.1, 20
);
camera.position.set(0, 1.25, 3.2);
camera.lookAt(0, 1.15, 0);

// ── LIGHTING — natural, not cyberpunk ──
// Soft warm ambient
const ambient = new THREE.AmbientLight(0xfff0e8, 0.85);
scene.add(ambient);

// Key light — slightly warm, from front-right
const keyLight = new THREE.DirectionalLight(0xfffaf5, 1.3);
keyLight.position.set(1.5, 2.5, 2.5);
scene.add(keyLight);

// Fill light — cool, soft, left side
const fillLight = new THREE.DirectionalLight(0xe8f0ff, 0.4);
fillLight.position.set(-2, 1, 1);
scene.add(fillLight);

// Rim/back light — very subtle blue tint (character separation)
const rimLight = new THREE.DirectionalLight(0xd0e8ff, 0.25);
rimLight.position.set(0, 1, -3);
scene.add(rimLight);

// Ground bounce (simulates floor bounce light)
const bounceLight = new THREE.HemisphereLight(0xffeedd, 0xd0e8ff, 0.3);
scene.add(bounceLight);

// VRM state
let vrm = null;
const vrmClock = new THREE.Clock();
let vrmState = 'idle';
let blinkTimer = 3;
let blinkOpen = true;
let breathT = 0, headT = 0, talkT = 0;

const loader = new GLTFLoader();
loader.register(parser => new VRMLoaderPlugin(parser));

loader.load(
  '/model.vrm',
  (gltf) => {
    vrm = gltf.userData.vrm;
    VRMUtils.removeUnnecessaryJoints(gltf.scene);
    VRMUtils.removeUnnecessaryVertices(gltf.scene);
    VRMUtils.rotateVRM0(vrm);
    scene.add(vrm.scene);

    // Bigger: closer crop, model sits slightly lower so bust/portrait is the focus
    vrm.scene.position.set(0, -0.55, 0);

    document.getElementById('loadOverlay').classList.add('hidden');
    startLoop();
  },
  (progress) => {
    if (progress.total > 0) {
      const pct = Math.round((progress.loaded / progress.total) * 100);
      document.querySelector('.load-txt').textContent = `Cargando modelo... ${pct}%`;
    }
  },
  (err) => {
    console.error('VRM error:', err);
    document.getElementById('loadOverlay').classList.add('hidden');
    startLoop();
  }
);

function applyExpr(name, w) {
  if (!vrm?.expressionManager) return;
  try { vrm.expressionManager.setValue(name, w); } catch(_) {}
}

function setBone(name, x, y, z) {
  if (!vrm?.humanoid) return;
  const b = vrm.humanoid.getNormalizedBoneNode(name);
  if (b) { b.rotation.x=x; b.rotation.y=y; b.rotation.z=z; }
}

function vrmUpdate(dt) {
  if (!vrm) return;
  breathT += dt; headT += dt; talkT += dt;

  // breathing
  const bSpd = vrmState==='thinking' ? 2.0 : 0.85;
  const bAmp = vrmState==='thinking' ? 0.022 : 0.01;
  const br = Math.sin(breathT * bSpd) * bAmp;
  setBone('chest', br, 0, 0);
  setBone('spine', br*.5, 0, 0);

  // head sway
  const hSpd = vrmState==='thinking' ? 1.6 : 0.45;
  const hAmp = vrmState==='thinking' ? 0.07 : 0.02;
  setBone('head',
    Math.cos(headT*hSpd*.7)*hAmp*.5 - 0.04,
    Math.sin(headT*hSpd)*hAmp,
    0
  );

  // blink
  blinkTimer -= dt;
  if (blinkTimer <= 0) {
    blinkOpen = !blinkOpen;
    blinkTimer = blinkOpen ? (2.8+Math.random()*2.2) : 0.11;
  }
  const bv = blinkOpen ? 0 : 1;
  applyExpr('blinkLeft', bv);
  applyExpr('blinkRight', bv);

  // expressions
  if (vrmState === 'idle') {
    applyExpr('happy', 0.25);
    applyExpr('neutral', 0.75);
    applyExpr('aa', 0);
  } else if (vrmState === 'thinking') {
    applyExpr('happy', 0);
    applyExpr('neutral', 0.5);
    applyExpr('aa', 0);
    // subtle head tilt
    const hb = vrm.humanoid.getNormalizedBoneNode('head');
    if (hb) hb.rotation.z = -0.07 + Math.sin(talkT*2)*.02;
  } else if (vrmState === 'talking') {
    const mv = Math.abs(Math.sin(talkT * 7.5)) * 0.65;
    applyExpr('aa', mv);
    applyExpr('happy', 0.35);
    applyExpr('neutral', 0.3);
  }

  // arms — natural resting position
  const ab = Math.sin(breathT*.85)*.012;
  setBone('leftUpperArm',  0.08, 0, -11.15+ab);
  setBone('rightUpperArm', 0.08, 0,  11.15-ab);

  vrm.update(dt);
}

function startLoop() {
  (function loop() {
    requestAnimationFrame(loop);
    const dt = vrmClock.getDelta();
    nupdate(); ndraw();
    vrmUpdate(dt);
    renderer.render(scene, camera);
  })();
}

function onResize() {
  nresize();
  const p = vrmCanvas.parentElement;
  const w = p.offsetWidth, h = p.offsetHeight;
  renderer.setSize(w, h);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', onResize);

/* ══════════════════════════════════════════
   CHAT LOGIC
══════════════════════════════════════════ */
const chatEl = document.getElementById('chat');
const msgEl  = document.getElementById('msg');
document.getElementById('t0').textContent = now();

function now() {
  return new Date().toLocaleTimeString('es',{hour:'2-digit',minute:'2-digit'});
}

function botAv() {
  return `<div class="mav"><svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="7" r="3" fill="white"/><circle cx="6" cy="19" r="2" fill="white"/><circle cx="18" cy="19" r="2" fill="white"/><line x1="12" y1="7" x2="6" y2="19" stroke="white" stroke-width="1.2"/><line x1="12" y1="7" x2="18" y2="19" stroke="white" stroke-width="1.2"/></svg></div>`;
}

function addMsg(role, html) {
  const w = document.createElement('div');
  w.className = `msg ${role}`;
  if (role === 'bot') {
    w.innerHTML = botAv() + `<div class="mbody"><div class="mmeta"><span class="mname">Kiora</span><span class="mtime">${now()}</span></div><div class="mbbl">${html}</div></div>`;
  } else {
    w.innerHTML = `<div class="muav">👤</div><div class="mbody"><div class="mmeta"><span class="mname">Tú</span><span class="mtime">${now()}</span><span class="mchk">✓✓</span></div><div class="mbbl">${html}</div></div>`;
  }
  chatEl.appendChild(w);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function setSt(s, hv, hc) {
  document.getElementById('stTxt').textContent = s;
  document.getElementById('chSub').textContent = '● ' + s;
  const h = document.getElementById('hudVal');
  h.textContent = hv;
  h.style.color = hc || 'var(--teal)';
}

window.send = async function() {
  const raw = msgEl.value.trim();
  if (!raw) return;
  msgEl.value = '';
  addMsg('user', raw);

  thinking = true; trigThink();
  vrmState = 'thinking';
  setSt('Procesando...', 'Pensando', 'var(--acc)');

  const td = document.createElement('div');
  td.className = 'msg bot'; td.id = 'tmsg';
  td.innerHTML = botAv() + `<div class="mbody"><div class="mmeta"><span class="mname">Kiora</span></div><div class="mbbl"><div class="tdots"><span></span><span></span><span></span></div></div></div>`;
  chatEl.appendChild(td);
  chatEl.scrollTop = chatEl.scrollHeight;

  try {
    const res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: raw })
    });
    const data = await res.json();
    document.getElementById('tmsg')?.remove();

    trigResp();
    vrmState = 'talking';
    setSt('Conectado', 'Óptimo', 'var(--teal)');
    addMsg('bot', marked.parse(data.response));

    const ms = Math.min(Math.max(data.response.split(' ').length * 175, 2000), 8000);
    setTimeout(() => { vrmState = 'idle'; }, ms);

  } catch (err) {
    document.getElementById('tmsg')?.remove();
    thinking = false; vrmState = 'idle';
    setSt('Error', 'Error', '#ff8888');
    addMsg('bot', 'No pude conectar con el sistema.');
    console.error(err);
  }
};

msgEl.addEventListener('keypress', e => { if (e.key === 'Enter') window.send(); });
