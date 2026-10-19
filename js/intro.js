/* TYPE X — cinematic 3D intro (Three.js). Original animation, not a copy of any brand.
   TypeX.intro.play(onDone)   — full ~3.4s cinematic for first visit
   TypeX.intro.quick(onDone)  — 0.9s logo transition for returning users
   Graceful fallback: if WebGL/THREE unavailable, calls onDone immediately.
*/
(function(){
  const T = window.TypeX;

  function play(onDone){
    const root = document.getElementById('intro-root');
    let finished = false;
    const done = () => {
      if (finished) return; finished = true;
      try { cancelAnimationFrame(raf); } catch(e){}
      const ov = root.querySelector('.intro-overlay');
      if (ov){ ov.classList.add('done'); setTimeout(()=>{ root.innerHTML=''; }, 750); }
      else root.innerHTML = '';
      T.store.set('seen_intro', true);
      if (onDone) onDone();
    };
    // fallback if no THREE / no WebGL
    if (!window.THREE){
      const t = setTimeout(done, 50);
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.149.0/three.min.js';
      s.onload = () => { clearTimeout(t); boot(); };
      s.onerror = () => { clearTimeout(t); done(); };
      document.head.appendChild(s);
      return;
    }
    boot();

    function boot(){
      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({antialias:true, alpha:false});
      } catch(e){ done(); return; }
      const W = window.innerWidth, H = window.innerHeight;
      renderer.setSize(W, H);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      const ov = T.el('<div class="intro-overlay"><div class="intro-word"><h1>TYPE X</h1>' +
        '<p>Tell Type X what to do.</p></div>' +
        '<button class="btn btn-ghost btn-sm skip-intro" style="display:none">Skip intro ' + T.icon('arrow-r','ic-sm') + '</button></div>');
      ov.insertBefore(renderer.domElement, ov.firstChild);
      root.appendChild(ov);
      const skipBtn = ov.querySelector('.skip-intro');
      setTimeout(()=>{ skipBtn.style.display = ''; }, 900);
      skipBtn.addEventListener('click', done);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x070312);
      scene.fog = new THREE.FogExp2(0x070312, 0.055);
      const camera = new THREE.PerspectiveCamera(55, W/H, 0.1, 100);
      camera.position.set(0, 0.4, 9);

      // lights: purple key + orange rim
      const pLight = new THREE.PointLight(0xa855f7, 2.2, 40); pLight.position.set(-5, 3, 5); scene.add(pLight);
      const oLight = new THREE.PointLight(0xff7a18, 2.0, 40); oLight.position.set(5, -2, 4); scene.add(oLight);
      const sweep = new THREE.PointLight(0xff9f43, 0, 30); sweep.position.set(-8, 1, 3); scene.add(sweep);
      scene.add(new THREE.AmbientLight(0x241a3f, 1.4));

      // 1) purple particle field converging to center
      const N = 420;
      const pos = new Float32Array(N*3), start = new Float32Array(N*3), spd = new Float32Array(N);
      for (let i=0;i<N;i++){
        const r = 6 + Math.random()*7, th = Math.random()*Math.PI*2, ph = Math.acos(2*Math.random()-1);
        start[i*3]   = r*Math.sin(ph)*Math.cos(th);
        start[i*3+1] = r*Math.sin(ph)*Math.sin(th)*0.7;
        start[i*3+2] = r*Math.cos(ph)*0.6;
        pos[i*3]=start[i*3]; pos[i*3+1]=start[i*3+1]; pos[i*3+2]=start[i*3+2];
        spd[i] = 0.5 + Math.random()*0.9;
      }
      const pGeo = new THREE.BufferGeometry();
      pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const pMat = new THREE.PointsMaterial({color:0xa855f7, size:0.055, transparent:true, opacity:0.9,
        blending:THREE.AdditiveBlending, depthWrite:false});
      const particles = new THREE.Points(pGeo, pMat);
      scene.add(particles);

      // 2) light-trail rings (purple + orange)
      function ring(color, r, tube){
        const g = new THREE.TorusGeometry(r, tube, 12, 90);
        const m = new THREE.MeshBasicMaterial({color, transparent:true, opacity:0.0, blending:THREE.AdditiveBlending});
        return new THREE.Mesh(g, m);
      }
      const ringP = ring(0xa855f7, 3.4, 0.02); ringP.rotation.x = Math.PI/2.4; scene.add(ringP);
      const ringO = ring(0xff7a18, 4.1, 0.015); ringO.rotation.x = Math.PI/1.8; ringO.rotation.y = 0.5; scene.add(ringO);

      // 3) the X — two metallic bars
      const xGroup = new THREE.Group();
      const barMat = new THREE.MeshStandardMaterial({color:0x1b1033, metalness:0.92, roughness:0.24,
        emissive:0x2a1650, emissiveIntensity:0.55});
      const barGeo = new THREE.BoxGeometry(0.85, 4.6, 0.85);
      const b1 = new THREE.Mesh(barGeo, barMat); b1.rotation.z = Math.PI/4;
      const b2 = new THREE.Mesh(barGeo, barMat); b2.rotation.z = -Math.PI/4;
      xGroup.add(b1, b2);
      // edge glow strips
      const edgeMat = new THREE.MeshBasicMaterial({color:0xff7a18, transparent:true, opacity:0.85, blending:THREE.AdditiveBlending});
      const edgeMatP = new THREE.MeshBasicMaterial({color:0xa855f7, transparent:true, opacity:0.85, blending:THREE.AdditiveBlending});
      const eGeo = new THREE.BoxGeometry(0.06, 4.62, 0.06);
      [[0.44,0,edgeMat],[-0.44,0,edgeMatP],[0,0.44,edgeMatP],[0,-0.44,edgeMat]].forEach(cfg => {
        const e1 = new THREE.Mesh(eGeo, cfg[2]); e1.position.set(cfg[0], cfg[1], 0.44); e1.rotation.z = Math.PI/4; xGroup.add(e1);
        const e2 = new THREE.Mesh(eGeo, cfg[2]); e2.position.set(cfg[0], cfg[1], -0.44); e2.rotation.z = Math.PI/4; xGroup.add(e2);
        const e3 = new THREE.Mesh(eGeo, cfg[2]); e3.position.set(cfg[0], cfg[1], 0.44); e3.rotation.z = -Math.PI/4; xGroup.add(e3);
        const e4 = new THREE.Mesh(eGeo, cfg[2]); e4.position.set(cfg[0], cfg[1], -0.44); e4.rotation.z = -Math.PI/4; xGroup.add(e4);
      });
      xGroup.scale.setScalar(0.001);
      xGroup.rotation.y = -1.2;
      scene.add(xGroup);

      // 4) keyboard-like particles that become letters
      const K = 90;
      const kPos = new Float32Array(K*3);
      const kGeo = new THREE.BufferGeometry();
      kGeo.setAttribute('position', new THREE.BufferAttribute(kPos, 3));
      const kMat = new THREE.PointsMaterial({color:0xffe1c2, size:0.05, transparent:true, opacity:0,
        blending:THREE.AdditiveBlending, depthWrite:false});
      const keys = new THREE.Points(kGeo, kMat);
      scene.add(keys);
      const kSeed = [];
      for (let i=0;i<K;i++) kSeed.push({a:Math.random()*Math.PI*2, r:2.5+Math.random()*2, y:(Math.random()-0.5)*3, s:0.6+Math.random()});

      const clock = new THREE.Clock();
      const DUR = 3.4;
      let raf;

      function ease(t){ return t<0.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2; }

      function frame(){
        raf = requestAnimationFrame(frame);
        const t = Math.min(clock.getElapsedTime(), DUR);
        const u = t / DUR;

        // phase 1 (0–.3): particles converge
        const c1 = ease(Math.min(u/0.32, 1));
        const arr = pGeo.attributes.position.array;
        for (let i=0;i<N;i++){
          const k = 1 - c1*spd[i]*0.96;
          arr[i*3]   = start[i*3]*k   + (Math.random()-0.5)*0.02;
          arr[i*3+1] = start[i*3+1]*k + (Math.random()-0.5)*0.02;
          arr[i*3+2] = start[i*3+2]*k;
        }
        pGeo.attributes.position.needsUpdate = true;
        pMat.opacity = 0.9 * (1 - Math.max(0, (u-0.55)/0.45));

        // rings fade in and spin
        ringP.material.opacity = 0.55 * Math.min(u/0.3, 1) * (1 - Math.max(0,(u-0.7)/0.3));
        ringO.material.opacity = 0.45 * Math.min(u/0.35, 1) * (1 - Math.max(0,(u-0.7)/0.3));
        ringP.rotation.z += 0.008; ringO.rotation.z -= 0.006;

        // phase 2 (.25–.6): X emerges + rotates, then locks
        const x2 = ease(T.clamp((u-0.25)/0.35, 0, 1));
        xGroup.scale.setScalar(Math.max(0.001, x2));
        xGroup.rotation.y = -1.2 * (1 - x2) + Math.sin(u*Math.PI)*0.12;
        xGroup.rotation.x = 0.12 * Math.sin(u*4);

        // phase 3 (.6–.75): orange sweep
        const sw = T.clamp((u-0.6)/0.15, 0, 1);
        sweep.intensity = Math.sin(sw*Math.PI) * 3.2;
        sweep.position.x = -8 + sw*16;

        // phase 4 (.7–.9): keyboard particles flow, then wordmark
        const k4 = T.clamp((u-0.68)/0.22, 0, 1);
        kMat.opacity = Math.sin(k4*Math.PI) * 0.95;
        const ka = kGeo.attributes.position.array;
        for (let i=0;i<K;i++){
          const s = kSeed[i];
          const ang = s.a + k4*3.2*s.s;
          ka[i*3]   = Math.cos(ang)*s.r*(1-k4*0.55);
          ka[i*3+1] = s.y*(1-k4*0.4) + Math.sin(k4*9+i)*0.08;
          ka[i*3+2] = Math.sin(ang)*1.2;
        }
        kGeo.attributes.position.needsUpdate = true;

        const word = ov.querySelector('.intro-word');
        if (u > 0.78) word.classList.add('show');

        // final glow + camera drift
        pLight.intensity = 2.2 + Math.sin(u*9)*0.25 + (u>0.9 ? (u-0.9)*22 : 0);
        camera.position.z = 9 - u*1.1;
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
        if (t >= DUR) done();
      }
      frame();
    }
  }

  function quick(onDone){
    const root = document.getElementById('intro-root');
    const q = T.el('<div class="quick-intro"><div class="qx">' + T.logo(72) + '</div></div>');
    root.appendChild(q);
    setTimeout(()=>{ root.innerHTML=''; if (onDone) onDone(); }, 950);
  }

  T.intro = {play, quick};
})();
