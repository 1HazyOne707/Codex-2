// Minimal first-person spiral using Three.js
import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { OrbitControls } from "https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js";

// --- Admin gate: if you don't have codex_admin cookie, run flythrough-only
const isAdmin = (document.cookie||"").includes("codex_admin=1");
document.getElementById('role').textContent = isAdmin ? 'builder' : 'watch';

const canvas = document.createElement('canvas');
document.body.prepend(canvas);

const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, powerPreference:"high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x060a0f, 0.012);
const camera = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, 0.1, 2000);
camera.position.set(0, 1.6, 20);

const hemi = new THREE.HemisphereLight(0xbfefff, 0x0a0a1a, 0.6); scene.add(hemi);
const key = new THREE.DirectionalLight(0xffffff, 0.35); key.position.set(5,10,8); scene.add(key);

// Stars
{
  const g = new THREE.BufferGeometry();
  const N = 4000, pos = new Float32Array(N*3);
  for (let i=0;i<N;i++){ const r=200*(Math.random()**0.7+0.2); const t=THREE.MathUtils.randFloatSpread(Math.PI*2); const p=THREE.MathUtils.randFloatSpread(Math.PI);
    pos[i*3+0]=r*Math.cos(t)*Math.cos(p); pos[i*3+1]=r*Math.sin(p)*0.3; pos[i*3+2]=r*Math.sin(t); }
  g.setAttribute("position", new THREE.BufferAttribute(pos,3));
  const m = new THREE.PointsMaterial({ size:1.6, sizeAttenuation:true, color:0x89f2c3, transparent:true, opacity:0.6 });
  const stars = new THREE.Points(g,m); scene.add(stars);
}

// Spiral tube
let spiral, portal;
{
  const turns = 6, steps = 900, radius = 4.0, pitch = 0.9;
  const path = new THREE.Curve();
  path.getPoint = (t)=>{ const a = t*turns*Math.PI*2; return new THREE.Vector3(
    Math.cos(a)*radius*Math.max(0.2,1-t*0.85),
    (t*turns*pitch),
    Math.sin(a)*radius*Math.max(0.2,1-t*0.85)
  );};
  const geo = new THREE.TubeGeometry(path, steps, 0.12, 12, false);
  const mat = new THREE.MeshBasicMaterial({ color:0x34d399, transparent:true, opacity:0.9 });
  spiral = new THREE.Mesh(geo, mat);
  spiral.position.y = -3.0;
  scene.add(spiral);

  // Portal plane at end
  const pGeo = new THREE.PlaneGeometry(10,10, 1,1);
  const pMat = new THREE.ShaderMaterial({
    transparent:true,
    uniforms:{ t:{value:0} },
    vertexShader:`varying vec2 vUv; void main(){ vUv=uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader:`
      varying vec2 vUv; uniform float t;
      float ring(vec2 p, float r, float w){ float d=abs(length(p)-r); return smoothstep(w,0.,d); }
      void main(){
        vec2 p = (vUv-0.5)*2.;
        float a = atan(p.y,p.x);
        float r = length(p);
        float swirl = 0.55 + 0.45*sin(12.0*(a+1.5*t))*(1.0-r);
        float core = smoothstep(0.18,0.05,r);
        float glow = ring(p, swirl, 0.02)*(1.0-r);
        vec3 col = mix(vec3(0.03,0.07,0.10), vec3(0.20,0.95,0.65), glow);
        col += vec3(0.12,0.85,0.55)*core*0.8;
        gl_FragColor = vec4(col, clamp(glow+core, 0.0, 1.0));
      }`
  });
  portal = new THREE.Mesh(pGeo, pMat);
  portal.rotation.x = -Math.PI/2;
  portal.position.set(0, turns*pitch-3.2, 0);
  scene.add(portal);
}

// Controls
let controls, pointerLocked=false;
if (isAdmin){
  // First-person (pointer-lock) for builders
  const vel = new THREE.Vector3(), dir = new THREE.Vector3(), keys = {};
  const look = {x:0,y:0};
  const speed = 6;
  addEventListener('keydown', e=> keys[e.code]=true);
  addEventListener('keyup', e=> keys[e.code]=false);
  addEventListener('mousemove', e=> { if(pointerLocked){ look.x -= e.movementX*0.002; look.y -= e.movementY*0.002; look.y = Math.max(-1.2, Math.min(1.2, look.y)); }});
  addEventListener('click', ()=>{ if(!pointerLocked){ canvas.requestPointerLock?.(); } });
  document.addEventListener('pointerlockchange', ()=>{ pointerLocked = !!document.pointerLockElement; document.getElementById('center').style.display = pointerLocked?'none':'grid'; });

  // Update per frame
  function update(dt){
    camera.rotation.set(look.y, look.x, 0);
    dir.set(0,0,-1).applyEuler(camera.rotation).normalize();
    const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0,1,0)).normalize();
    vel.set(0,0,0);
    if(keys['KeyW']) vel.add(dir);
    if(keys['KeyS']) vel.sub(dir);
    if(keys['KeyA']) vel.sub(right);
    if(keys['KeyD']) vel.add(right);
    const updown = (keys['Space']?1:0) - (keys['ShiftLeft']?1:0);
    vel.y += updown;
    vel.normalize().multiplyScalar(speed*dt);
    camera.position.add(vel);
  }
  controls = { update };
}else{
  // Watch-only orbit for public
  controls = new OrbitControls(camera, canvas);
  controls.enablePan = false;
  controls.minDistance = 6; controls.maxDistance = 80;
  document.getElementById('center').style.display = 'none';
}

// Enter button
document.getElementById('enter').onclick = async () => {
  if (isAdmin) { canvas.requestPointerLock?.(); }
  document.getElementById('center').style.display='none';
};

// Resize
addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix();
});

// Animate
let last = performance.now();
function tick(now=performance.now()){
  const dt = (now-last)/1000; last = now;
  if (controls?.update) controls.update(dt);

  // Spiral animation + portal “time”
  portal.material.uniforms.t.value = now*0.0015;
  spiral.rotation.y += 0.05*dt;

  // Transition: if camera crosses portal plane, fade + move inside garden
  const gateY = portal.position.y;
  if (camera.position.y > gateY-0.5){
    document.getElementById('veil').classList.add('show');
    setTimeout(()=>{ location.href = '/spiral/'; }, 700);
  }

  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();
