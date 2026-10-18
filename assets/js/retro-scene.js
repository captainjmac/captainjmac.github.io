// Retro background scene rendered with three.js into a single fixed canvas
// behind the page content: gradient sky, scrolling perspective grid with a
// cursor spotlight, the JMAC logo with its floor reflection, and twinkling
// stars. All HTML (nav, portrait, tagline, post panel) sits on top.
//
// The logo's position is still owned by CSS: the <img> inside
// .foreground-container is laid out as usual and this script draws the logo
// into its bounding box, then hides the <img> (it stays clickable).
import * as THREE from 'three';

const canvas = document.querySelector('.retro-canvas');
const logoEl = document.querySelector('.foreground-container .jmac-logo.original');

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

let renderer;
try {
    renderer = canvas && new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
} catch (e) {
    renderer = null; // no WebGL — the CSS gradient and HTML logo remain
}

if (renderer) init();

function init() {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, finePointer ? 2 : 1.5));
    window.__retroScene = renderer; // dev handle for inspecting the effect layer

    // Orthographic camera in CSS pixels: x right, and objects placed at
    // y = -cssY so the origin is the top-left of the viewport.
    const camera = new THREE.OrthographicCamera(0, 1, 0, -1, -10, 10);
    const scene = new THREE.Scene();
    const size = { w: 1, h: 1 };

    // ---- Sky + grid floor ------------------------------------------------
    // The grid used to be a CSS element 250% wide with
    //   transform: perspective(85px) rotateX(8deg); transform-origin: 50% 87%
    // The shader inverts that transform per pixel to find the element-local
    // coordinate, then evaluates the same background pattern, so the
    // geometry matches the CSS version exactly.
    const gridUniforms = {
        uSize: { value: new THREE.Vector2(1, 1) },     // viewport, CSS px
        uPixelRatio: { value: renderer.getPixelRatio() },
        uScroll: { value: 0 },                          // 0..100 px
        uPointer: { value: new THREE.Vector2(-9999, -9999) },
    };

    const gridMaterial = new THREE.ShaderMaterial({
        uniforms: gridUniforms,
        depthTest: false,
        depthWrite: false,
        vertexShader: /* glsl */ `
            void main() {
                gl_Position = vec4(position.xy, 0.0, 1.0);
            }
        `,
        fragmentShader: /* glsl */ `
            uniform vec2 uSize;
            uniform float uPixelRatio;
            uniform float uScroll;
            uniform vec2 uPointer;

            const float PERSPECTIVE = 85.0;
            const float TILT = 0.13962634; // 8deg
            const vec3 GRID_COLOR = vec3(64.0, 181.0, 229.0) / 255.0; // #40b5e5

            // .gradient-bg stops, bottom to top. The last stop is
            // rgba(105,105,205,0.34) premultiplied over the black page.
            vec3 sky(float t) {
                vec3 c0 = vec3(0.0, 0.0, 32.0) / 255.0;
                vec3 c1 = vec3(48.0, 0.0, 48.0) / 255.0;
                vec3 c2 = vec3(80.0, 0.0, 64.0) / 255.0;
                vec3 c6 = vec3(35.7, 35.7, 69.7) / 255.0;
                float s = clamp(t, 0.0, 1.0) * 6.0;
                if (s < 1.0) return mix(c0, c1, s);
                if (s < 2.0) return mix(c1, c2, s - 1.0);
                if (s < 3.0) return mix(c2, c1, s - 2.0);
                if (s < 4.0) return mix(c1, c0, s - 3.0);
                if (s < 5.0) return c0;
                return mix(c0, c6, s - 5.0);
            }

            // Integral of one grid line's alpha profile over a cell: solid
            // for 2px, then a linear fade to transparent at 8px (the CSS
            // "color 2px, transparent 8px" gradient). Integrating lets us
            // box-filter the pattern over each pixel's footprint, so distant
            // lines average out instead of shimmering.
            float profileIntegral(float x, float period) {
                float cell = floor(x / period);
                float t = x - cell * period;
                float i;
                if (t < 2.0) i = t;
                else if (t < 8.0) { float k = t - 2.0; i = 2.0 + k - k * k / 12.0; }
                else i = 5.0;
                return cell * 5.0 + i;
            }

            float lineAlpha(float x, float period, float footprint) {
                float w = max(footprint, 0.01);
                return clamp((profileIntegral(x + 0.5 * w, period) -
                              profileIntegral(x - 0.5 * w, period)) / w, 0.0, 1.0);
            }

            // Black ::after overlay on the grid element, by local v / height.
            float horizonShade(float t) {
                if (t < 0.94) return 1.0 - t / 0.94;
                if (t < 0.98) return (t - 0.94) / 0.04;
                return 1.0;
            }

            void main() {
                vec2 p = vec2(gl_FragCoord.x, uSize.y * uPixelRatio - gl_FragCoord.y) / uPixelRatio;
                vec3 color = sky(1.0 - p.y / uSize.y);

                // Invert the CSS transform. The eye sits on the rotation axis
                // at the transform origin, PERSPECTIVE px in front of the screen.
                vec2 origin = vec2(0.5 * uSize.x, 0.87 * uSize.y);
                vec2 s = p - origin;
                float sinA = sin(TILT);
                float cosA = cos(TILT);
                float denom = PERSPECTIVE * cosA + s.y * sinA;
                float ly = s.y * PERSPECTIVE / denom;
                float lx = s.x * (PERSPECTIVE - ly * sinA) / PERSPECTIVE;
                // Element-local px (the element is 250% wide at margin-left -75%).
                float u = lx + 1.25 * uSize.x;
                float v = ly + 0.87 * uSize.y;

                // Footprints must be taken outside the branch below.
                float fu = fwidth(u);
                float fv = fwidth(v);

                if (denom > 0.0 && v >= 0.0 && v <= uSize.y) {
                    // Horizontal lines scroll toward the viewer; vertical
                    // lines are static. Both have a -1px background offset.
                    float aH = lineAlpha(v + 1.0 - uScroll, 100.0, fv);
                    float aV = lineAlpha(u + 1.0, 125.0, fu);
                    float lines = aH + aV * (1.0 - aH);
                    float shade = horizonShade(v / uSize.y);

                    color = mix(color, GRID_COLOR, lines);
                    color *= 1.0 - shade;

                    // Cursor spotlight: a white copy of the grid (with its own
                    // black overlay) masked by a 240px linear radial falloff.
                    float mask = clamp(1.0 - distance(p, uPointer) / 240.0, 0.0, 1.0);
                    if (mask > 0.0) {
                        float layerAlpha = 1.0 - (1.0 - lines) * (1.0 - shade);
                        vec3 layerPremul = vec3(lines * (1.0 - shade));
                        color = color * (1.0 - mask * layerAlpha) + mask * layerPremul;
                    }
                }

                gl_FragColor = vec4(color, 1.0);
            }
        `,
    });
    const gridQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), gridMaterial);
    gridQuad.frustumCulled = false;
    gridQuad.renderOrder = 0;
    scene.add(gridQuad);

    // ---- Logo + reflection -----------------------------------------------
    const logoGeometry = new THREE.PlaneGeometry(1, 1);
    const logoMaterial = new THREE.MeshBasicMaterial({ transparent: true, depthTest: false, depthWrite: false });
    const reflectionMaterial = new THREE.MeshBasicMaterial({
        transparent: true, opacity: 0.1, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
    });
    const logo = new THREE.Mesh(logoGeometry, logoMaterial);
    const reflection = new THREE.Mesh(logoGeometry, reflectionMaterial);
    logo.renderOrder = 3;
    reflection.renderOrder = 1;
    logo.visible = reflection.visible = false;
    scene.add(logo, reflection);

    if (logoEl) {
        new THREE.TextureLoader().load(logoEl.currentSrc || logoEl.src, (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
            logoMaterial.map = reflectionMaterial.map = texture;
            logoMaterial.needsUpdate = reflectionMaterial.needsUpdate = true;
            logo.visible = reflection.visible = true;
            requestRender();
        });
    }

    let logoRect = null;
    function updateLogo() {
        if (!logoEl) return;
        const r = logoEl.getBoundingClientRect();
        logoRect = r;
        logo.position.set(r.left + r.width / 2, -(r.top + r.height / 2), 0);
        logo.scale.set(r.width, r.height, 1);
        // The reflection's outer box starts at the original's bottom edge,
        // then translateY(-13.7%) scaleY(-1): its centre sits 0.863h lower.
        reflection.position.set(logo.position.x, logo.position.y - r.height * 0.863, 0);
        reflection.scale.set(r.width, -r.height, 1);
    }

    // ---- Stars -----------------------------------------------------------
    // Sparkle texture: soft halo + four-point cross streaks + bright core.
    // Drawn in white so per-star tinting works.
    function makeStarTexture() {
        const S = 64;
        const c = document.createElement('canvas');
        c.width = c.height = S;
        const ctx = c.getContext('2d');
        const m = S / 2;

        const halo = ctx.createRadialGradient(m, m, 0, m, m, m);
        halo.addColorStop(0, 'rgba(255,255,255,0.5)');
        halo.addColorStop(0.4, 'rgba(255,255,255,0.12)');
        halo.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = halo;
        ctx.fillRect(0, 0, S, S);

        for (const rot of [0, Math.PI / 2]) {
            ctx.save();
            ctx.translate(m, m);
            ctx.rotate(rot);
            const streak = ctx.createLinearGradient(-m, 0, m, 0);
            streak.addColorStop(0, 'rgba(255,255,255,0)');
            streak.addColorStop(0.5, 'rgba(255,255,255,0.9)');
            streak.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = streak;
            ctx.fillRect(-m, -1, S, 2);
            ctx.restore();
        }

        const core = ctx.createRadialGradient(m, m, 0, m, m, 5);
        core.addColorStop(0, 'rgba(255,255,255,1)');
        core.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(m, m, 5, 0, Math.PI * 2);
        ctx.fill();

        const texture = new THREE.CanvasTexture(c);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
    }

    // Site palette (see --neon-* in _main.scss); white weighted heaviest.
    const COLORS = [0xffffff, 0xffffff, 0xffffff, 0x00ffff, 0x00ffff, 0x9f00ff];
    const STAR_TEXTURE_SIZE = 64;
    const stars = [];

    function centerPoint() {
        if (logoRect) return { x: logoRect.left + logoRect.width / 2, y: logoRect.top + logoRect.height / 2 };
        return { x: size.w / 2, y: size.h / 2 };
    }

    function spawnPosition() {
        // Mostly clustered around the logo, with some scattered across the sky.
        if (logoRect && Math.random() < 0.75) {
            const c = centerPoint();
            const angle = Math.random() * Math.PI * 2;
            const dist = (0.25 + Math.random() * 0.65) * (logoRect.width / 2) * 1.4;
            return { x: c.x + Math.cos(angle) * dist, y: c.y + Math.sin(angle) * dist * 0.9 };
        }
        return { x: Math.random() * size.w, y: Math.random() * size.h * 0.85 };
    }

    function respawn(star) {
        const pos = spawnPosition();
        star.x = pos.x;
        star.y = pos.y;
        star.sprite.material.color.setHex(COLORS[(Math.random() * COLORS.length) | 0]);
        star.life = 0;
        // Drift outward horizontally; stars level with the center move fastest.
        const c = centerPoint();
        const dir = pos.x >= c.x ? 1 : -1;
        const vertFalloff = Math.max(0.1, 1 - Math.abs(pos.y - c.y) / (size.h / 2));
        star.vx = dir * (10 + Math.random() * 25) * vertFalloff;
        star.duration = 4 + Math.random() * 9;
        star.maxAlpha = 0.6 + Math.random() * 0.4;
        star.baseScale = 0.14 + Math.random() * 0.3;
        if (Math.random() < 0.06) star.baseScale *= 2; // occasional hero sparkle
        star.flickerSpeed = 2 + Math.random() * 3.5;
        star.phase = Math.random() * Math.PI * 2;
    }

    function createStars() {
        const texture = makeStarTexture();
        const count = Math.min(90, Math.round((size.w * size.h) / 18000));
        for (let i = 0; i < count; i++) {
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
                map: texture,
                blending: THREE.AdditiveBlending,
                transparent: true,
                depthTest: false,
                depthWrite: false,
                opacity: 0,
            }));
            sprite.renderOrder = 2;
            scene.add(sprite);
            const star = { sprite };
            respawn(star);
            star.life = Math.random() * star.duration; // stagger so they don't pulse in sync
            stars.push(star);
        }
    }

    function updateStars(dt) {
        const c = centerPoint();
        const slowingScale = size.w * 0.18;
        for (const star of stars) {
            star.life += dt;
            const t = star.life / star.duration;
            if (t >= 1) {
                respawn(star);
                star.sprite.material.opacity = 0;
                continue;
            }
            // Drift decelerates with horizontal distance from the center.
            const damping = 1 / (1 + Math.abs(star.x - c.x) / slowingScale);
            star.x += star.vx * damping * dt;
            const envelope = Math.sin(Math.PI * t);
            const flicker = 0.8 + 0.2 * Math.sin(star.life * star.flickerSpeed + star.phase);
            const scale = STAR_TEXTURE_SIZE * star.baseScale * (0.85 + 0.3 * envelope) * flicker;
            star.sprite.material.opacity = star.maxAlpha * envelope * flicker;
            star.sprite.position.set(star.x, -star.y, 0);
            star.sprite.scale.set(scale, scale, 1);
        }
    }

    // ---- Sizing, input, loop ---------------------------------------------
    function resize() {
        const w = canvas.clientWidth || window.innerWidth;
        const h = canvas.clientHeight || window.innerHeight;
        size.w = w;
        size.h = h;
        renderer.setSize(w, h, false);
        camera.right = w;
        camera.bottom = -h;
        camera.updateProjectionMatrix();
        gridUniforms.uSize.value.set(w, h);
        gridUniforms.uPixelRatio.value = renderer.getPixelRatio();
        updateLogo();
        requestRender();
    }

    if (finePointer) {
        window.addEventListener('pointermove', (e) => {
            gridUniforms.uPointer.value.set(e.clientX, e.clientY);
            requestRender();
        }, { passive: true });
        document.documentElement.addEventListener('pointerleave', () => {
            gridUniforms.uPointer.value.set(-9999, -9999);
            requestRender();
        });
    }

    let elapsed = 0;
    let last = 0;
    let frame = 0;

    function render() {
        renderer.render(scene, camera);
        // Hide the HTML logo only once a frame with the WebGL logo is drawn.
        if (logo.visible) document.documentElement.classList.add('webgl');
    }

    function tick(now) {
        frame = requestAnimationFrame(tick);
        const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
        last = now;
        elapsed = (elapsed + dt) % 2;
        // One 100px cell every 2s, as the old moveUp keyframes.
        gridUniforms.uScroll.value = elapsed * 50;
        updateLogo(); // follows CSS layout changes, including transitions
        updateStars(dt);
        render();
    }

    // With reduced motion the scene is a still frame, redrawn on demand.
    let renderQueued = false;
    function requestRender() {
        if (!reducedMotion || renderQueued) return;
        renderQueued = true;
        requestAnimationFrame(() => {
            renderQueued = false;
            updateLogo();
            render();
        });
    }

    function start() {
        if (reducedMotion || frame) return;
        last = 0;
        frame = requestAnimationFrame(tick);
    }

    function stop() {
        cancelAnimationFrame(frame);
        frame = 0;
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop();
        else start();
    });

    canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        stop();
        document.documentElement.classList.remove('webgl');
    });
    canvas.addEventListener('webglcontextrestored', () => {
        if (logo.visible) document.documentElement.classList.add('webgl');
        start();
        requestRender();
    });

    new ResizeObserver(resize).observe(canvas);
    resize();
    if (!reducedMotion) createStars();
    start();
}
