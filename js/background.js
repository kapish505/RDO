/**
 * RDO – Three.js Dotted Wave Background
 * Adapted from DottedSurface (React/Three.js) → vanilla JS
 * Brand colour: #3b82f6 (RDO primary blue) at low opacity
 */
(function () {
  'use strict';

  function initRDOBackground() {
    // ── Config ──────────────────────────────────────────────────
    const SEPARATION = 130;
    const AMOUNTX   = 45;
    const AMOUNTY   = 55;
    const BG_COLOR  = 0x090909;   // matches body background
    const DOT_R     = 0x3b;       // blue R
    const DOT_G     = 0x82;       // blue G
    const DOT_B     = 0xf6;       // blue B
    const DOT_SIZE  = 5;
    const DOT_OPACITY = 0.45;

    // ── Scene ────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(BG_COLOR, 0.00015);

    const camera = new THREE.PerspectiveCamera(
      58,
      window.innerWidth / window.innerHeight,
      1,
      10000
    );
    camera.position.set(0, 380, 1300);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);

    // Mount behind everything
    const container = document.createElement('div');
    container.id = 'rdo-bg-canvas';
    container.style.cssText =
      'position:fixed;inset:0;z-index:-2;pointer-events:none;overflow:hidden;';
    container.appendChild(renderer.domElement);
    document.body.insertBefore(container, document.body.firstChild);

    // ── Geometry ─────────────────────────────────────────────────
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(AMOUNTX * AMOUNTY * 3);
    const colors    = new Float32Array(AMOUNTX * AMOUNTY * 3);

    let i = 0;
    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        positions[i * 3]     = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;

        // Normalise 0-1 for PointsMaterial vertexColors
        colors[i * 3]     = DOT_R / 255;
        colors[i * 3 + 1] = DOT_G / 255;
        colors[i * 3 + 2] = DOT_B / 255;
        i++;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color',    new THREE.BufferAttribute(colors,    3));

    const material = new THREE.PointsMaterial({
      size: DOT_SIZE,
      vertexColors: true,
      transparent: true,
      opacity: DOT_OPACITY,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // ── Mouse parallax ───────────────────────────────────────────
    let mouseX = 0, mouseY = 0;
    const PARALLAX_STRENGTH = 0.06;

    window.addEventListener('mousemove', (e) => {
      mouseX = (e.clientX - window.innerWidth  / 2) * PARALLAX_STRENGTH;
      mouseY = (e.clientY - window.innerHeight / 2) * PARALLAX_STRENGTH * 0.4;
    });

    // ── Animate ──────────────────────────────────────────────────
    let count = 0;
    let rafId;

    // Suspend loop completely when tab is hidden to save battery
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        animate(); // restart loop
      }
    });

    function animate() {
      if (document.hidden) return; // Halt loop
      
      rafId = requestAnimationFrame(animate);

      const posArr = geometry.attributes.position.array;
      let idx = 0;
      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          posArr[idx * 3 + 1] =
            Math.sin((ix + count) * 0.3) * 55 +
            Math.sin((iy + count) * 0.5) * 55;
          idx++;
        }
      }
      geometry.attributes.position.needsUpdate = true;

      // Smooth camera drift toward mouse
      camera.position.x += (mouseX - camera.position.x) * 0.035;
      camera.position.y += (-mouseY - camera.position.y + 380) * 0.035;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
      count += 0.085;
    }

    animate();

    // ── Resize ───────────────────────────────────────────────────
    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onResize);

    // ── Cleanup (call if SPA navigation) ─────────────────────────
    window.__rdoBgCleanup = function () {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      container.remove();
    };
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRDOBackground);
  } else {
    initRDOBackground();
  }
})();
