// 3D "JMAC" logo for the retro scene (see retro-scene.js), built from
// scratch to echo the original artwork: italic extruded letters with an
// 80s chrome face (cyan sky / sunset horizon), mirror-chrome bevels, neon
// outlines, a two-tone swoosh off the J, a striped disc with a neon rim and
// a dusty starry haze behind it all.
//
// The logo renders into its own render target so the scene can draw it
// (and its floor reflection) as a plane in the CSS-laid-out logo box. Neon
// parts are also drawn into a separate glow target and blurred, so the
// bloom only touches the logo, not the grid.
import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

// Letters are authored 1 unit tall; the text group scales them into a frame
// FRAME_HEIGHT world units tall at z = 0.
const FRAME_HEIGHT = 6;
const CAMERA_FOV = 30;
const TEXT_SCALE = 1.66;
const LETTER_WIDTH = 0.82;   // narrows the authored letters
const SHEAR = 0.16;           // italic lean
const TILT = 0.13;            // baseline rises to the right
const DISC_RADIUS = 1.9;
const DEPTH = 0.16;
const BEVEL_THICKNESS = 0.03;
const BEVEL_SIZE = 0.02;
const FRONT_Z = DEPTH + BEVEL_THICKNESS;
const SWOOSH_Z = -0.06;       // swoosh sits just behind the letters
const BACKING_OFFSET = 0.12;  // dark outline around each letter
const MAX_TARGET_SIZE = 1600; // px, per side
// The logo renders into a box this much larger than the CSS logo box, so
// glow, haze and the sway never clip at its edges.
export const LOGO_PADDING = 1.4;

// Intro (landing page): the letters swing out from behind the disc on a
// tilted orbit, one after another; while they settle, the swoosh and stripe
// are beamed in from left to right by a spark-spraying point of light.
// Times in seconds.
const INTRO_DELAY = 0.2;
const LETTER_STAGGER = 0.22;
const LETTER_DURATION = 2.2;
const ORBIT_RADIUS = 1.45;   // starting orbit, as a multiple of the disc radius
const ORBIT_RISE = 0.45;     // letters start this far above (text units), sinking into place
const SWOOSH_LEAD = 1.95;    // starts this long before the last letter lands
const SWOOSH_DURATION = 1.6;
const STRIPE_LAG = 0.6;      // after the swoosh starts
const STRIPE_DURATION = 1.2;
// A point of light rides each reveal edge, beaming the piece in and
// showering sparks.
const BEAM_FADE = 0.35;      // the edge's heat fades this long after a piece is done
const GLINT_LEAD = 0.5;      // the first glint sweeps this long before the intro ends
const MAX_SPARKS = 480;
const SPARK_GRAVITY = 7;     // world units / s²

const easeOutCubic = (t) => 1 - (1 - t) ** 3;
const easeInOutSine = (t) => 0.5 - 0.5 * Math.cos(Math.PI * t);

// Layer 0 is the visible logo; layer 1 is what feeds the glow.
const GLOW_LAYER = 1;

const color = (hex) => new THREE.Color(hex);
// Raw sRGB values for shaders that blend gradients perceptually and convert
// to linear themselves (blending in linear makes dark gradients wash out).
const srgb = (hex) => new THREE.Color().setStyle(hex, THREE.LinearSRGBColorSpace);
const smoothstep = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
};

// ---- Letter outlines (x, y in letter units, baseline at y = 0) ------------
function letterJ() {
    const s = new THREE.Shape();
    s.moveTo(0.06, 1.0);
    s.lineTo(0.70, 1.0);
    s.lineTo(0.70, 0.26);
    s.quadraticCurveTo(0.70, 0.0, 0.44, 0.0);
    s.lineTo(0.0, 0.0);
    s.lineTo(0.0, 0.22);
    s.lineTo(0.40, 0.22);
    s.quadraticCurveTo(0.46, 0.22, 0.46, 0.30);
    s.lineTo(0.46, 0.80);
    s.lineTo(0.06, 0.80);
    s.closePath();
    return s;
}

function letterM() {
    const s = new THREE.Shape();
    s.moveTo(0.0, 0.0);
    s.lineTo(0.0, 1.0);
    s.lineTo(0.24, 1.0);
    s.lineTo(0.425, 0.66);
    s.lineTo(0.61, 1.0);
    s.lineTo(0.85, 1.0);
    s.lineTo(0.85, 0.0);
    s.lineTo(0.63, 0.0);
    s.lineTo(0.63, 0.56);
    s.lineTo(0.425, 0.22);
    s.lineTo(0.22, 0.56);
    s.lineTo(0.22, 0.0);
    s.closePath();
    return s;
}

function letterA() {
    const s = new THREE.Shape();
    s.moveTo(0.0, 0.0);
    s.lineTo(0.0, 0.62);
    s.quadraticCurveTo(0.0, 1.0, 0.37, 1.0);
    s.quadraticCurveTo(0.74, 1.0, 0.74, 0.62);
    s.lineTo(0.74, 0.0);
    s.lineTo(0.52, 0.0);
    s.lineTo(0.52, 0.30);
    s.lineTo(0.22, 0.30);
    s.lineTo(0.22, 0.0);
    s.closePath();
    const hole = new THREE.Path();
    hole.moveTo(0.22, 0.50);
    hole.lineTo(0.22, 0.62);
    hole.quadraticCurveTo(0.22, 0.78, 0.37, 0.78);
    hole.quadraticCurveTo(0.52, 0.78, 0.52, 0.62);
    hole.lineTo(0.52, 0.50);
    hole.closePath();
    s.holes.push(hole);
    return s;
}

function letterC() {
    const s = new THREE.Shape();
    s.moveTo(0.72, 0.64);
    s.lineTo(0.72, 0.76);
    s.quadraticCurveTo(0.72, 1.0, 0.48, 1.0);
    s.lineTo(0.24, 1.0);
    s.quadraticCurveTo(0.0, 1.0, 0.0, 0.76);
    s.lineTo(0.0, 0.24);
    s.quadraticCurveTo(0.0, 0.0, 0.24, 0.0);
    s.lineTo(0.48, 0.0);
    s.quadraticCurveTo(0.72, 0.0, 0.72, 0.24);
    s.lineTo(0.72, 0.36);
    s.lineTo(0.50, 0.36);
    s.lineTo(0.50, 0.30);
    s.quadraticCurveTo(0.50, 0.22, 0.42, 0.22);
    s.lineTo(0.30, 0.22);
    s.quadraticCurveTo(0.22, 0.22, 0.22, 0.30);
    s.lineTo(0.22, 0.70);
    s.quadraticCurveTo(0.22, 0.78, 0.30, 0.78);
    s.lineTo(0.42, 0.78);
    s.quadraticCurveTo(0.50, 0.78, 0.50, 0.70);
    s.lineTo(0.50, 0.64);
    s.closePath();
    return s;
}

// Spaced so each letter's dark outline leaves a clear dark gap between them.
const LETTERS = [
    { shape: letterJ, x: 0.0 },
    { shape: letterM, x: 0.86 },
    { shape: letterA, x: 1.87 },
    { shape: letterC, x: 2.77 },
];
const TEXT_WIDTH = 3.49;

// Swoosh and stripe heights (letter units). The swoosh sits low enough
// under the baseline that the letters' dark outline leaves a dark gap above
// it, matching the gaps between letters.
const SWOOSH_TOP = -0.14;
const SWOOSH_BOTTOM = -0.26;
const STRIPE_TOP = -0.35;
const STRIPE_BOTTOM = -0.38;

// The main swoosh hooks up out of the J's tail and runs under every letter.
function swooshMain() {
    const w = TEXT_WIDTH;
    const mid = (SWOOSH_TOP + SWOOSH_BOTTOM) / 2;
    const s = new THREE.Shape();
    s.moveTo(-0.30, 0.22);
    s.quadraticCurveTo(-0.30, SWOOSH_TOP, 0.05, SWOOSH_TOP);
    s.lineTo(w + 0.18, SWOOSH_TOP);
    s.quadraticCurveTo(w + 0.30, SWOOSH_TOP, w + 0.30, mid);
    s.quadraticCurveTo(w + 0.30, SWOOSH_BOTTOM, w + 0.18, SWOOSH_BOTTOM);
    s.lineTo(0.05, SWOOSH_BOTTOM);
    s.quadraticCurveTo(-0.42, SWOOSH_BOTTOM, -0.42, 0.22);
    s.closePath();
    return s;
}

// Thin second stripe beneath it.
function swooshStripe() {
    const w = TEXT_WIDTH;
    const mid = (STRIPE_TOP + STRIPE_BOTTOM) / 2;
    const s = new THREE.Shape();
    s.moveTo(0.30, STRIPE_TOP);
    s.lineTo(w + 0.04, STRIPE_TOP);
    s.quadraticCurveTo(w + 0.08, STRIPE_TOP, w + 0.08, mid);
    s.quadraticCurveTo(w + 0.08, STRIPE_BOTTOM, w + 0.04, STRIPE_BOTTOM);
    s.lineTo(0.30, STRIPE_BOTTOM);
    s.quadraticCurveTo(0.26, STRIPE_BOTTOM, 0.26, mid);
    s.quadraticCurveTo(0.26, STRIPE_TOP, 0.30, STRIPE_TOP);
    s.closePath();
    return s;
}

// Text-local bounding box, for centring.
const TEXT_MIN_X = -0.42;
const TEXT_MAX_X = TEXT_WIDTH + 0.30;
const TEXT_MIN_Y = STRIPE_BOTTOM;
const TEXT_MAX_Y = 1.0;

const shearMatrix = new THREE.Matrix4().makeShear(0, 0, SHEAR, 0, 0, 0);
const shearPoint = (x, y, offsetX) => [(x + offsetX) * LETTER_WIDTH + SHEAR * y, y];

// ---- Textures --------------------------------------------------------------
// Equirect environment for the chrome bevels: purple sky, hot sunset
// horizon with a white line, dark floor with a magenta grid, and a couple of
// bright "sun" spots so edges catch sharp glints as the logo turns.
function makeEnvironment(renderer) {
    const W = 1024, H = 512;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');

    const sky = ctx.createLinearGradient(0, 0, 0, H / 2);
    sky.addColorStop(0, '#07001c');
    sky.addColorStop(0.45, '#2a0b6a');
    sky.addColorStop(0.8, '#a2299c');
    sky.addColorStop(0.97, '#ff8ac0');
    sky.addColorStop(1, '#ffffff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H / 2);

    const floor = ctx.createLinearGradient(0, H / 2, 0, H);
    floor.addColorStop(0, '#3a0a4a');
    floor.addColorStop(0.15, '#12001e');
    floor.addColorStop(1, '#000000');
    ctx.fillStyle = floor;
    ctx.fillRect(0, H / 2, W, H / 2);

    ctx.strokeStyle = 'rgba(255, 60, 200, 0.7)';
    ctx.lineWidth = 2;
    for (let i = 1; i < 12; i++) {
        const y = H / 2 + Math.pow(i / 12, 1.8) * (H / 2);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
    }
    for (let i = 0; i < 32; i++) {
        const x = (i / 32) * W;
        ctx.beginPath();
        ctx.moveTo(x, H / 2);
        ctx.lineTo(x, H);
        ctx.stroke();
    }

    for (const [u, v, r, col] of [[0.18, 0.22, 60, '#bffcff'], [0.62, 0.3, 40, '#ffd0f0'], [0.86, 0.12, 30, '#ffffff']]) {
        const g = ctx.createRadialGradient(u * W, v * H, 0, u * W, v * H, r);
        g.addColorStop(0, col);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(u * W - r, v * H - r, r * 2, r * 2);
    }

    const texture = new THREE.CanvasTexture(c);
    texture.mapping = THREE.EquirectangularReflectionMapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromEquirectangular(texture).texture;
    pmrem.dispose();
    texture.dispose();
    return env;
}

// Dusty purple cloud with irregular edges, and a separate layer of star
// specks, so the haze shader can churn the cloud and twinkle the specks.
function makeHazeTextures() {
    const S = 512;
    const m = S / 2;
    const canvas = () => {
        const c = document.createElement('canvas');
        c.width = c.height = S;
        return c;
    };

    const cloud = canvas();
    let ctx = cloud.getContext('2d');
    const core = ctx.createRadialGradient(m, m, 0, m, m, m * 0.8);
    core.addColorStop(0, 'rgba(60, 20, 140, 0.9)');
    core.addColorStop(0.7, 'rgba(50, 15, 120, 0.55)');
    core.addColorStop(1, 'rgba(40, 10, 100, 0)');
    ctx.fillStyle = core;
    ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < 260; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = Math.pow(Math.random(), 0.6) * m * 0.8;
        const r = m * (0.06 + Math.random() * 0.14);
        const x = m + Math.cos(a) * d;
        const y = m + Math.sin(a) * d;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const hue = Math.random() < 0.3 ? '120, 40, 200' : '70, 25, 150';
        g.addColorStop(0, `rgba(${hue}, 0.3)`);
        g.addColorStop(1, `rgba(${hue}, 0)`);
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    const specks = canvas();
    ctx = specks.getContext('2d');
    const colors = ['#ffffff', '#7af6ff', '#c27bff', '#ff7ad9'];
    for (let i = 0; i < 520; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = Math.sqrt(Math.random()) * m * 0.92;
        const size = 0.6 + Math.random() * 1.6;
        ctx.globalAlpha = 0.35 + Math.random() * 0.65;
        ctx.fillStyle = colors[(Math.random() * colors.length) | 0];
        ctx.fillRect(m + Math.cos(a) * d, m + Math.sin(a) * d, size, size);
    }

    const toTexture = (c) => {
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        return t;
    };
    return { cloud: toTexture(cloud), specks: toTexture(specks) };
}

// The haze churns: two copies of the cloud turn slowly in opposite
// directions through a gentle flowing warp, the whole thing breathes and its
// hue drifts between violet and blue, and each star speck twinkles on its
// own rhythm.
function makeHazeMaterial() {
    const { cloud, specks } = makeHazeTextures();
    return new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
            tCloud: { value: cloud },
            tSpecks: { value: specks },
            uTime: { value: 0 },
            uViolet: { value: color('#7a2bd0') },
            uBlue: { value: color('#2b3fd8') },
        },
        vertexShader: /* glsl */ `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: /* glsl */ `
            uniform sampler2D tCloud, tSpecks;
            uniform float uTime;
            uniform vec3 uViolet, uBlue;
            varying vec2 vUv;

            vec2 rotate(vec2 p, float a) {
                float c = cos(a), s = sin(a);
                return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
            }
            float hash(vec2 p) {
                return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
            }

            void main() {
                vec2 p = vUv - 0.5;
                float breathe = 1.0 + 0.06 * sin(uTime * 0.7);
                vec2 warp = 0.022 * vec2(sin(p.y * 9.0 + uTime * 0.9), cos(p.x * 8.0 - uTime * 0.7));

                vec4 a = texture2D(tCloud, rotate(p, uTime * 0.07) / breathe + 0.5 + warp);
                vec4 b = texture2D(tCloud, rotate(p * 1.12, -uTime * 0.1 + 1.7) / breathe + 0.5 - warp);
                float alpha = 1.0 - (1.0 - a.a) * (1.0 - b.a);
                vec3 rgb = (a.rgb * a.a + b.rgb * b.a) / max(a.a + b.a, 1e-4);

                // Slow hue drift that rolls around the haze.
                float drift = 0.5 + 0.5 * sin(uTime * 0.35 + atan(p.y, p.x));
                rgb = mix(rgb, mix(uViolet, uBlue, drift), 0.35);
                alpha *= 0.85 + 0.15 * sin(uTime * 0.9 + length(p) * 6.0);

                vec2 sp = rotate(p, uTime * 0.02) + 0.5;
                vec4 speck = texture2D(tSpecks, sp);
                vec2 cell = floor(sp * 96.0);
                float twinkle = 0.25 + 0.75 * pow(0.5 + 0.5 * sin(uTime * (1.5 + hash(cell) * 3.0) + hash(cell + 3.1) * 6.283), 2.0);
                float s = speck.a * twinkle;

                gl_FragColor = vec4(mix(rgb, speck.rgb, s), max(alpha, s));
                #include <colorspace_fragment>
            }
        `,
    });
}

// ---- Materials -------------------------------------------------------------
// Letter faces: the classic 80s chrome reflection, as on the original
// artwork. Above the horizon a "sky" runs from dark navy at the top through
// electric blue to a hot violet-pink just above the horizon; a sharp cyan
// edge marks the horizon; below it the "ground" starts dark and warms
// through purple and magenta to orange at the bottom, crossed by thin
// sunset streaks. A fine halftone dot gives it the printed-poster texture.
// The horizon slides with the face's view-space normal so the reflection
// shifts as the logo sways, and a glint sweeps across every few seconds.
// yRange maps the shape's own height onto the gradient, so thin pieces like
// the swoosh get the full sweep too. uBeam heats the freshly revealed part
// of the swoosh pieces as the intro beams them in (x: the reveal edge in
// unsheared units, y: strength, z: time).
function makeChromeFaceMaterial(yMin = 0, yMax = 1) {
    return new THREE.ShaderMaterial({
        clipping: true, // the intro reveals the swoosh with a clipping plane
        uniforms: {
            uSweep: { value: 99 },
            uBeam: { value: new THREE.Vector3(0, 0, 0) },
            uYRange: { value: new THREE.Vector2(yMin, yMax) },
            uSkyTop: { value: srgb('#060824') },
            uSkyMid: { value: srgb('#2f63ff') },
            uSkyLow: { value: srgb('#e46cff') },
            uEdge: { value: srgb('#c8fdff') },
            uGroundTop: { value: srgb('#090522') },
            uGroundMid: { value: srgb('#5a1690') },
            uGroundHot: { value: srgb('#ff3fa6') },
            uGroundLow: { value: srgb('#ffb347') },
            uStreak: { value: srgb('#ffd27a') },
        },
        vertexShader: /* glsl */ `
            #include <clipping_planes_pars_vertex>
            varying vec2 vShape;
            varying vec3 vNormalV;
            void main() {
                vShape = position.xy;
                vNormalV = normalize(normalMatrix * normal);
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_Position = projectionMatrix * mvPosition;
                #include <clipping_planes_vertex>
            }
        `,
        fragmentShader: /* glsl */ `
            uniform float uSweep;
            uniform vec3 uBeam;
            uniform vec2 uYRange;
            uniform vec3 uSkyTop, uSkyMid, uSkyLow, uEdge;
            uniform vec3 uGroundTop, uGroundMid, uGroundHot, uGroundLow, uStreak;
            varying vec2 vShape;
            varying vec3 vNormalV;
            #include <clipping_planes_pars_fragment>

            float hash(vec2 p) {
                return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
            }

            void main() {
                #include <clipping_planes_fragment>
                float y = (vShape.y - uYRange.x) / (uYRange.y - uYRange.x);
                float h = 0.54 + vNormalV.y * 0.8 - vNormalV.x * 0.2;
                vec3 col;
                float brightness;

                if (y >= h) {
                    // Sky: brightest right above the horizon.
                    float t = clamp((y - h) / max(1.0 - h, 0.05), 0.0, 1.0);
                    col = mix(uSkyLow, uSkyMid, smoothstep(0.0, 0.45, t));
                    col = mix(col, uSkyTop, smoothstep(0.4, 1.0, t));
                    brightness = 1.0 - t;
                } else {
                    // Ground: dark just below the horizon, sunset at the bottom.
                    float t = clamp((h - y) / max(h, 0.05), 0.0, 1.0);
                    col = mix(uGroundTop, uGroundMid, smoothstep(0.05, 0.5, t));
                    col = mix(col, uGroundHot, smoothstep(0.45, 0.8, t));
                    col = mix(col, uGroundLow, smoothstep(0.78, 1.0, t));
                    // Thin streaks that get bolder toward the bottom.
                    float band = fract(y * 11.0);
                    float streak = smoothstep(0.0, 0.05, band) * (1.0 - smoothstep(0.1, 0.16, band));
                    col = mix(col, uStreak, streak * smoothstep(0.35, 0.9, t) * 0.55);
                    brightness = t;
                }

                // Sharp horizon edge with a soft bloom on the sky side.
                float d = y - h;
                col = mix(col, uEdge, 1.0 - smoothstep(0.0, 0.012, abs(d)));
                col += uEdge * 0.25 * (1.0 - smoothstep(0.0, 0.08, d)) * step(0.0, d);

                // Halftone dots, strongest in the bright parts.
                vec2 cell = fract(gl_FragCoord.xy / 3.0) - 0.5;
                float dotMask = smoothstep(0.42, 0.18, length(cell));
                col *= mix(1.0, 0.8 + 0.3 * dotMask, brightness * 0.6);

                float glint = exp(-pow((vShape.x * 0.4 + vShape.y * 0.7 - uSweep) * 6.0, 2.0));
                col += vec3(1.0, 0.95, 1.0) * glint * 0.8;

                // Beam-in: white-hot right behind the reveal edge, then a
                // cyan afterglow with transporter-style twinkles that cools
                // off along the piece.
                float behind = uBeam.x - (vShape.x - ${SHEAR.toFixed(2)} * vShape.y);
                if (uBeam.y > 0.0 && behind >= 0.0) {
                    float heat = exp(-behind * 16.0);
                    float trail = exp(-behind * 3.0);
                    float n = hash(floor(gl_FragCoord.xy / 2.0) + floor(uBeam.z * 24.0) * 7.31);
                    float twinkle = smoothstep(0.86, 0.98, n) * trail;
                    float scan = 0.75 + 0.25 * sin(gl_FragCoord.y * 1.4 - uBeam.z * 40.0);
                    col = mix(col, vec3(1.0, 0.97, 0.92), heat * 0.9 * uBeam.y);
                    col += (vec3(0.45, 0.9, 1.0) * trail * 0.4 * scan + vec3(1.0) * twinkle * 0.7) * uBeam.y;
                }

                gl_FragColor = vec4(pow(clamp(col, 0.0, 1.0), vec3(2.2)), 1.0);
                #include <colorspace_fragment>
            }
        `,
    });
}

function makeDiscMaterial() {
    return new THREE.ShaderMaterial({
        transparent: true,
        uniforms: {
            uBaseInner: { value: srgb('#0d0b30') },
            uBaseOuter: { value: srgb('#261256') },
            uCyan: { value: srgb('#4ff4ff') },
            uMagenta: { value: srgb('#ff3fd8') },
        },
        vertexShader: /* glsl */ `
            varying vec2 vP;
            void main() {
                vP = position.xy / ${DISC_RADIUS.toFixed(2)};
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: /* glsl */ `
            uniform vec3 uBaseInner, uBaseOuter, uCyan, uMagenta;
            varying vec2 vP;

            void main() {
                float r = length(vP);
                float alpha = 1.0 - smoothstep(0.985, 1.0, r);
                vec3 col = mix(uBaseInner, uBaseOuter, r * r);

                // Neon tint runs cyan (top-left) to magenta (bottom-right).
                vec3 tint = mix(uMagenta, uCyan, smoothstep(-0.7, 0.7, (vP.y - vP.x) * 0.7));

                // Horizontal streaks. They thicken toward the bottom like a
                // retro sunset. Strongest on the left and along the bottom,
                // with a softer full-disc layer so they show above the logo.
                float band = fract(vP.y * 12.0);
                float width = mix(0.135, 0.195, smoothstep(0.9, -0.9, vP.y));
                float stripe = smoothstep(0.0, 0.03, band) * (1.0 - smoothstep(width, width + 0.04, band));
                float edgeMask = max(smoothstep(0.1, -0.85, vP.x) * smoothstep(0.75, 0.2, vP.y),
                                     smoothstep(-0.25, -0.8, vP.y));
                float discMask = mix(0.6, 1.0, smoothstep(0.9, -0.9, vP.y)) * (0.75 + 0.25 * smoothstep(0.3, -0.9, vP.x));
                col += tint * stripe * (edgeMask * 0.275 + discMask * 0.25);

                float rim = smoothstep(0.88, 0.995, r);
                col += tint * pow(rim, 2.0) * 0.45;

                gl_FragColor = vec4(pow(col, vec3(2.2)), alpha);
                #include <colorspace_fragment>
            }
        `,
    });
}

// ---- Neon outline helpers ---------------------------------------------------
function loopsFor(shape, offsetX, divisions = 12) {
    const { shape: outer, holes } = shape.extractPoints(divisions);
    return [outer, ...holes].map((pts) => {
        const loop = pts.map((p) => shearPoint(p.x, p.y, offsetX));
        loop.push(loop[0]);
        return loop;
    });
}

function makeLine(points, colorAt, z, width, layer) {
    const positions = [];
    const colors = [];
    for (const [x, y] of points) {
        positions.push(x, y, z);
        const c = colorAt(x, y);
        colors.push(c.r, c.g, c.b);
    }
    const geometry = new LineGeometry();
    geometry.setPositions(positions);
    geometry.setColors(colors);
    const material = new LineMaterial({ linewidth: width, worldUnits: true, vertexColors: true });
    const line = new Line2(geometry, material);
    line.layers.set(layer);
    return line;
}

// Rewrites a Line2's per-point colours in place (segments store start and
// end colours side by side).
function recolorLine(line, count, colorAt) {
    const data = line.geometry.attributes.instanceColorStart.data;
    const arr = data.array;
    let c = colorAt(0);
    let r = c.r, g = c.g, b = c.b;
    for (let i = 1; i < count; i++) {
        const o = (i - 1) * 6;
        arr[o] = r;
        arr[o + 1] = g;
        arr[o + 2] = b;
        c = colorAt(i);
        r = c.r;
        g = c.g;
        b = c.b;
        arr[o + 3] = r;
        arr[o + 4] = g;
        arr[o + 5] = b;
    }
    data.needsUpdate = true;
}

// ---- Fullscreen blur ---------------------------------------------------------
function makeBlurPass() {
    const material = new THREE.ShaderMaterial({
        uniforms: { tInput: { value: null }, uStep: { value: new THREE.Vector2() } },
        depthTest: false,
        depthWrite: false,
        vertexShader: /* glsl */ `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position.xy, 0.0, 1.0);
            }
        `,
        fragmentShader: /* glsl */ `
            uniform sampler2D tInput;
            uniform vec2 uStep;
            varying vec2 vUv;
            void main() {
                vec4 sum = texture2D(tInput, vUv) * 0.227027;
                sum += texture2D(tInput, vUv + uStep * 1.0) * 0.1945946;
                sum += texture2D(tInput, vUv - uStep * 1.0) * 0.1945946;
                sum += texture2D(tInput, vUv + uStep * 2.0) * 0.1216216;
                sum += texture2D(tInput, vUv - uStep * 2.0) * 0.1216216;
                sum += texture2D(tInput, vUv + uStep * 3.0) * 0.054054;
                sum += texture2D(tInput, vUv - uStep * 3.0) * 0.054054;
                sum += texture2D(tInput, vUv + uStep * 4.0) * 0.016216;
                sum += texture2D(tInput, vUv - uStep * 4.0) * 0.016216;
                gl_FragColor = sum;
            }
        `,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    quad.frustumCulled = false;
    const scene = new THREE.Scene();
    scene.add(quad);
    const camera = new THREE.Camera();
    return { material, scene, camera };
}

// ---- Beam-in light and sparks -----------------------------------------------------
// The logo target holds premultiplied colour, so light is added in
// premultiplied form: colour adds up, alpha builds like normal "over".
const LIGHT_BLENDING = {
    transparent: true,
    depthTest: false,
    depthWrite: false,
    premultipliedAlpha: true,
    blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
    blendSrcAlpha: THREE.OneFactor,
    blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
};

// White-hot glare, either a round core or an anamorphic flare: a long
// horizontal streak with a fainter vertical one.
function makeGlareTexture(flare) {
    const S = 256;
    const c = document.createElement('canvas');
    c.width = c.height = S;
    const ctx = c.getContext('2d');
    const m = S / 2;
    if (flare) {
        for (const [rot, length, alpha] of [[0, m, 1], [Math.PI / 2, m * 0.45, 0.5]]) {
            ctx.save();
            ctx.translate(m, m);
            ctx.rotate(rot);
            const streak = ctx.createLinearGradient(-length, 0, length, 0);
            streak.addColorStop(0, 'rgba(255,255,255,0)');
            streak.addColorStop(0.5, `rgba(255,255,255,${alpha})`);
            streak.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = streak;
            ctx.fillRect(-length, -2, length * 2, 4);
            ctx.restore();
        }
    } else {
        const glare = ctx.createRadialGradient(m, m, 0, m, m, m);
        glare.addColorStop(0, 'rgba(255,255,255,1)');
        glare.addColorStop(0.08, 'rgba(255,255,255,0.95)');
        glare.addColorStop(0.22, 'rgba(255,255,255,0.35)');
        glare.addColorStop(0.5, 'rgba(255,255,255,0.08)');
        glare.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = glare;
        ctx.fillRect(0, 0, S, S);
    }
    const texture = new THREE.CanvasTexture(c);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}

// Where a vertical line at x crosses a closed polygon: the middle of its
// span, or null if it misses.
function midlineAt(points, x) {
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 0; i < points.length; i++) {
        const [x0, y0] = points[i];
        const [x1, y1] = points[(i + 1) % points.length];
        if ((x0 <= x && x <= x1) || (x1 <= x && x <= x0)) {
            const y = x0 === x1 ? (y0 + y1) / 2 : y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
            lo = Math.min(lo, y);
            hi = Math.max(hi, y);
        }
    }
    return lo <= hi ? (lo + hi) / 2 : null;
}

// Sparks that spray from the beam and rain down. They live in world space,
// so they fall straight down whatever the logo's sway. Each spark draws as a
// soft dot plus a short motion-blur streak behind it.
function makeSparks() {
    const pos = new Float32Array(MAX_SPARKS * 3);
    const vel = new Float32Array(MAX_SPARKS * 3);
    const age = new Float32Array(MAX_SPARKS);
    const life = new Float32Array(MAX_SPARKS); // 0 = free
    const size = new Float32Array(MAX_SPARKS);
    const cool = new Uint8Array(MAX_SPARKS);   // 1 = cyan spark, 0 = hot orange

    const dotPositions = new THREE.BufferAttribute(new Float32Array(MAX_SPARKS * 3), 3);
    const dotColors = new THREE.BufferAttribute(new Float32Array(MAX_SPARKS * 4), 4);
    const dotSizes = new THREE.BufferAttribute(new Float32Array(MAX_SPARKS), 1);
    const dotGeometry = new THREE.BufferGeometry();
    dotGeometry.setAttribute('position', dotPositions);
    dotGeometry.setAttribute('aColor', dotColors);
    dotGeometry.setAttribute('aSize', dotSizes);
    const dotMaterial = new THREE.ShaderMaterial({
        ...LIGHT_BLENDING,
        uniforms: { uViewport: { value: 1 } },
        vertexShader: /* glsl */ `
            attribute vec4 aColor;
            attribute float aSize;
            uniform float uViewport;
            varying vec4 vColor;
            void main() {
                vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                gl_Position = projectionMatrix * mvPosition;
                // aSize is in world units; uViewport is the target height.
                gl_PointSize = max(1.0, aSize * projectionMatrix[1][1] * uViewport * 0.5 / -mvPosition.z);
                vColor = aColor;
            }
        `,
        fragmentShader: /* glsl */ `
            varying vec4 vColor;
            void main() {
                float d = length(gl_PointCoord - 0.5) * 2.0;
                float a = vColor.a * pow(max(0.0, 1.0 - d), 1.5);
                gl_FragColor = vec4(vColor.rgb * a, a);
            }
        `,
    });
    const dots = new THREE.Points(dotGeometry, dotMaterial);
    dots.layers.enable(GLOW_LAYER);

    const streakPositions = new THREE.BufferAttribute(new Float32Array(MAX_SPARKS * 6), 3);
    const streakColors = new THREE.BufferAttribute(new Float32Array(MAX_SPARKS * 8), 4);
    const streakGeometry = new THREE.BufferGeometry();
    streakGeometry.setAttribute('position', streakPositions);
    streakGeometry.setAttribute('color', streakColors);
    const streaks = new THREE.LineSegments(streakGeometry, new THREE.LineBasicMaterial({ ...LIGHT_BLENDING, vertexColors: true }));

    for (const o of [dots, streaks]) {
        o.frustumCulled = false;
        o.renderOrder = 12;
    }

    // Hot sparks cool from white through gold and orange to a dull pink;
    // the odd cyan one cools to magenta.
    const hot = [color('#ffffff'), color('#ffe9a0'), color('#ff9a3c'), color('#c8306a')];
    const cold = [color('#ffffff'), color('#9ff8ff'), color('#4ff4ff'), color('#b03ad8')];
    const tint = new THREE.Color();
    function colorAt(ramp, f) {
        const x = Math.min(0.999, f) * (ramp.length - 1);
        const i = Math.floor(x);
        return tint.copy(ramp[i]).lerp(ramp[i + 1], x - i);
    }

    let next = 0;
    function emit(x, y, z, drift) {
        // Reuse the oldest slot if all are busy.
        let i = next;
        for (let k = 0; k < MAX_SPARKS; k++) {
            const j = (next + k) % MAX_SPARKS;
            if (life[j] === 0) {
                i = j;
                break;
            }
        }
        next = (i + 1) % MAX_SPARKS;
        const speed = 0.5 + Math.random() * 1.1;
        const a = Math.random() * Math.PI * 2;
        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = z;
        vel[i * 3] = Math.cos(a) * 2.2 * speed + drift;
        vel[i * 3 + 1] = Math.sin(a) * 1.4 * speed + 0.5;
        vel[i * 3 + 2] = (Math.random() - 0.3) * 1.2;
        age[i] = 0;
        life[i] = 0.5 + Math.random() * 0.7;
        size[i] = 0.05 + Math.random() * 0.05;
        cool[i] = Math.random() < 0.22 ? 1 : 0;
    }

    // halfWidth / halfHeight: the visible frame at z = 0, so sparks fade out
    // before they reach the edge of the logo's render target.
    function update(dt, halfWidth, halfHeight) {
        const drag = Math.exp(-1.4 * dt);
        let n = 0;
        for (let i = 0; i < MAX_SPARKS; i++) {
            if (life[i] === 0) continue;
            age[i] += dt;
            if (age[i] >= life[i]) {
                life[i] = 0;
                continue;
            }
            const i3 = i * 3;
            vel[i3] *= drag;
            vel[i3 + 1] = vel[i3 + 1] * drag - SPARK_GRAVITY * dt;
            vel[i3 + 2] *= drag;
            pos[i3] += vel[i3] * dt;
            pos[i3 + 1] += vel[i3 + 1] * dt;
            pos[i3 + 2] += vel[i3 + 2] * dt;

            const f = age[i] / life[i];
            const edge = smoothstep(1, 0.8, Math.abs(pos[i3]) / halfWidth) * smoothstep(1, 0.8, Math.abs(pos[i3 + 1]) / halfHeight);
            const alpha = (1 - f) ** 1.5 * edge * (0.75 + Math.random() * 0.25); // a little flicker
            const c = colorAt(cool[i] ? cold : hot, f);

            dotPositions.array.set([pos[i3], pos[i3 + 1], pos[i3 + 2]], n * 3);
            dotColors.array.set([c.r, c.g, c.b, alpha], n * 4);
            dotSizes.array[n] = size[i] * (1 - 0.5 * f);
            // The streak trails back along the spark's path.
            const t = 0.045;
            streakPositions.array.set([
                pos[i3], pos[i3 + 1], pos[i3 + 2],
                pos[i3] - vel[i3] * t, pos[i3 + 1] - vel[i3 + 1] * t, pos[i3 + 2] - vel[i3 + 2] * t,
            ], n * 6);
            streakColors.array.set([c.r, c.g, c.b, alpha * 0.8, c.r, c.g, c.b, 0], n * 8);
            n++;
        }
        for (const a of [dotPositions, dotColors, dotSizes, streakPositions, streakColors]) a.needsUpdate = true;
        dotGeometry.setDrawRange(0, n);
        streakGeometry.setDrawRange(0, n * 2);
        dots.visible = streaks.visible = n > 0;
    }

    return { objects: [dots, streaks], dotMaterial, emit, update };
}

// ---- Logo ----------------------------------------------------------------------
export function createLogo(renderer, { starTexture, intro = false } = {}) {
    renderer.localClippingEnabled = true; // only the swoosh materials clip
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100);
    camera.position.z = (FRAME_HEIGHT * LOGO_PADDING / 2) / Math.tan(THREE.MathUtils.degToRad(CAMERA_FOV / 2));

    const root = new THREE.Group();
    scene.add(root);

    // Haze and disc.
    const haze = new THREE.Mesh(
        new THREE.PlaneGeometry(6.6, 6.6),
        makeHazeMaterial(),
    );
    haze.position.z = -0.9;
    root.add(haze);

    const disc = new THREE.Mesh(new THREE.CircleGeometry(DISC_RADIUS, 128), makeDiscMaterial());
    disc.position.z = -0.5;
    root.add(disc);
    // Black stand-in on the glow layer, so the glow of anything behind the
    // disc (letters waiting or orbiting during the intro) can't bleed through.
    const discOccluder = new THREE.Mesh(disc.geometry, new THREE.MeshBasicMaterial({ color: 0x000000 }));
    discOccluder.layers.set(GLOW_LAYER);
    disc.add(discOccluder);

    const cyan = color('#4ff4ff');
    const magenta = color('#ff3fd8');
    const pink = color('#ff5aa8');
    const orange = color('#ffa040');
    const white = color('#ffffff');
    const ringColor = (x, y) =>
        magenta.clone().lerp(cyan, smoothstep(-0.7, 0.7, ((y - x) / DISC_RADIUS) * 0.7));
    const ringPoints = [];
    for (let i = 0; i <= 160; i++) {
        const a = (i / 160) * Math.PI * 2;
        ringPoints.push([Math.cos(a) * DISC_RADIUS, Math.sin(a) * DISC_RADIUS]);
    }
    const ringCore = makeLine(ringPoints, (x, y) => ringColor(x, y).lerp(white, 0.35), 0.01, 0.024, 0);
    const ringGlow = makeLine(ringPoints, ringColor, 0.01, 0.04, GLOW_LAYER);
    disc.add(ringCore, ringGlow);

    // Two comets of light chase round the ring in opposite directions.
    const ringBase = ringPoints.map(([x, y]) => ringColor(x, y));
    const ringAngles = ringPoints.map(([x, y]) => Math.atan2(y, x));
    const scratch = new THREE.Color();
    function cometBoost(angle, head) {
        let d = Math.abs(angle - head) % (Math.PI * 2);
        if (d > Math.PI) d = Math.PI * 2 - d;
        return Math.exp(-((d / 0.4) ** 2));
    }
    function paintRing(time) {
        const headA = time * 0.9;
        const headB = Math.PI - time * 0.7;
        const shade = (i, base, dim, whiten) => {
            const boost = Math.max(cometBoost(ringAngles[i], headA), cometBoost(ringAngles[i], headB));
            return scratch.copy(ringBase[i]).multiplyScalar(dim + (1 - dim) * boost).lerp(white, base + whiten * boost);
        };
        recolorLine(ringCore, ringPoints.length, (i) => shade(i, 0.3, 0.75, 0.5));
        recolorLine(ringGlow, ringPoints.length, (i) => shade(i, 0, 0.45, 0.35));
    }

    // Text: tilt about its centre, then scale letter units to world units.
    const tiltGroup = new THREE.Group();
    tiltGroup.position.set(-0.15, -0.05, 0);
    tiltGroup.rotation.z = TILT;
    root.add(tiltGroup);

    const textGroup = new THREE.Group();
    textGroup.scale.setScalar(TEXT_SCALE);
    textGroup.position.set(
        -((TEXT_MIN_X + TEXT_MAX_X) / 2 * LETTER_WIDTH + SHEAR * (TEXT_MIN_Y + TEXT_MAX_Y) / 2) * TEXT_SCALE,
        -((TEXT_MIN_Y + TEXT_MAX_Y) / 2) * TEXT_SCALE,
        0,
    );
    tiltGroup.add(textGroup);

    const faceMaterial = makeChromeFaceMaterial(0, 1);
    const swooshFaceMaterial = makeChromeFaceMaterial(SWOOSH_BOTTOM, 0.25);
    const stripeFaceMaterial = makeChromeFaceMaterial(STRIPE_BOTTOM, STRIPE_TOP);
    const faceMaterials = [faceMaterial, swooshFaceMaterial, stripeFaceMaterial];
    const backingMaterial = new THREE.MeshBasicMaterial({ color: color('#03021a') });
    const sideMaterial = new THREE.MeshStandardMaterial({
        color: color('#efe2ff'),
        metalness: 1,
        roughness: 0.16,
        envMap: makeEnvironment(renderer),
        envMapIntensity: 1.25,
        emissive: color('#1a0028'),
    });
    const occluderMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });

    const extrude = { depth: DEPTH, bevelEnabled: true, bevelThickness: BEVEL_THICKNESS, bevelSize: BEVEL_SIZE, bevelSegments: 3, curveSegments: 16 };
    const backingExtrude = { depth: 0.02, bevelEnabled: true, bevelThickness: 0, bevelSize: 0, bevelOffset: BACKING_OFFSET, bevelSegments: 1, curveSegments: 16 };

    function placeGeometry(geometry, offsetX, z) {
        geometry.translate(offsetX, 0, 0);
        geometry.scale(LETTER_WIDTH, 1, 1);
        geometry.applyMatrix4(shearMatrix);
        geometry.translate(0, 0, z);
        return geometry;
    }

    // Builds one piece (a letter, the swoosh or the stripe) into its own
    // pivot group, centred on the piece, so the intro can move and spin it.
    //  - the chrome solid (group 0 is the front/back caps, group 1 the walls
    //    and bevels)
    //  - a black stand-in on the glow layer, so it hides glow behind it
    //  - a dark slab cut slightly larger than the shape, just behind it: the
    //    thick dark outline round each letter on the original, which also
    //    fills the gaps between letters
    //  - the bold laser line: a white-hot core plus a wider coloured glow
    function buildPiece(shape, offsetX, z, mats, colorAt) {
        const geometry = placeGeometry(new THREE.ExtrudeGeometry(shape, extrude), offsetX, z);
        geometry.computeBoundingBox();
        const center = geometry.boundingBox.getCenter(new THREE.Vector3());

        const pivot = new THREE.Group();
        pivot.position.copy(center);
        const inner = new THREE.Group();
        inner.position.copy(center).negate();
        pivot.add(inner);
        textGroup.add(pivot);

        inner.add(new THREE.Mesh(geometry, [mats.face, mats.side]));
        const occluder = new THREE.Mesh(geometry, mats.occluder);
        occluder.layers.set(GLOW_LAYER);
        inner.add(occluder);

        const backingGeometry = placeGeometry(new THREE.ExtrudeGeometry(shape, backingExtrude), offsetX, z - BEVEL_THICKNESS - 0.03);
        const backing = new THREE.Mesh(backingGeometry, mats.backing);
        backing.layers.enable(GLOW_LAYER);
        inner.add(backing);

        for (const loop of loopsFor(shape, offsetX)) {
            for (const line of [
                makeLine(loop, (x, y) => colorAt(x, y).clone().lerp(white, 0.5), z + FRONT_Z + 0.004, 0.036, 0),
                makeLine(loop, colorAt, z + FRONT_Z + 0.004, 0.055, GLOW_LAYER),
            ]) {
                if (mats.clip) line.material.clippingPlanes = mats.clip;
                inner.add(line);
            }
        }
        return { pivot, center };
    }

    // Swoosh pieces get their own clipped copies of the shared materials, so
    // the intro can reveal them without clipping the letters.
    function clippedMaterials(face) {
        const clip = [new THREE.Plane()];
        const withClip = (m) => {
            m.clippingPlanes = clip;
            return m;
        };
        return {
            clip,
            face: withClip(face),
            side: withClip(sideMaterial.clone()),
            occluder: withClip(occluderMaterial.clone()),
            backing: withClip(backingMaterial.clone()),
        };
    }

    const letterMats = { face: faceMaterial, side: sideMaterial, occluder: occluderMaterial, backing: backingMaterial };
    const letterColor = (x, y) => pink.clone().lerp(cyan, smoothstep(0.2, 0.75, y));
    const letters = LETTERS.map(({ shape, x }) => buildPiece(shape(), x, 0, letterMats, letterColor));

    const swooshMats = clippedMaterials(swooshFaceMaterial);
    const swooshShape = swooshMain();
    buildPiece(swooshShape, 0, SWOOSH_Z, swooshMats,
        (x, y) => orange.clone().lerp(cyan, smoothstep(SWOOSH_BOTTOM, SWOOSH_TOP - 0.01, y)));
    const stripeMats = clippedMaterials(stripeFaceMaterial);
    const stripeShape = swooshStripe();
    buildPiece(stripeShape, 0, SWOOSH_Z * 2, stripeMats, () => magenta);

    // Sparkles that flash on the chrome now and then.
    const sparkles = [];
    if (starTexture) {
        const spots = [[0.06, 1.0], [1.47, 1.0], [TEXT_WIDTH, 0.76], [TEXT_WIDTH + 0.30, (SWOOSH_TOP + SWOOSH_BOTTOM) / 2], [-0.42, 0.22]];
        spots.forEach(([x, y], i) => {
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
                map: starTexture,
                blending: THREE.AdditiveBlending,
                transparent: true,
                depthTest: false,
                depthWrite: false,
            }));
            const [sx, sy] = shearPoint(x, y, 0);
            sprite.position.set(sx, sy, FRONT_Z + 0.05);
            sprite.layers.enable(GLOW_LAYER);
            sprite.renderOrder = 10;
            textGroup.add(sprite);
            sparkles.push({ sprite, phase: i * 0.37 + Math.random() * 0.2, period: 4 + Math.random() * 3 });
        });
    }

    // Beam-in: a point of light for the swoosh and one for the stripe, each
    // a white-hot core with a tinted glare and anamorphic flare, plus the
    // sparks they throw off.
    const glareTexture = makeGlareTexture(false);
    const flareTexture = makeGlareTexture(true);
    function makeBeam(shape, face, mats, size, haloColor, sparkRate) {
        // The outline in unsheared text-local units, which the reveal edge
        // is measured in.
        const outline = shape.extractPoints(24).shape.map((p) => [p.x * LETTER_WIDTH, p.y]);
        const xs = outline.map(([x]) => x);
        const group = new THREE.Group();
        group.visible = false;
        const sprite = (map, tint, scale) => {
            const s = new THREE.Sprite(new THREE.SpriteMaterial({
                // Sprites don't premultiply in their shader, so the blend does.
                ...LIGHT_BLENDING, premultipliedAlpha: false, blendSrc: THREE.SrcAlphaFactor,
                map, color: tint, rotation: TILT,
            }));
            s.layers.enable(GLOW_LAYER);
            s.renderOrder = 11;
            s.userData.scale = (scale * size) / TEXT_SCALE;
            group.add(s);
            return s;
        };
        const sprites = [
            sprite(glareTexture, haloColor, 2.0),
            sprite(flareTexture, haloColor.clone().lerp(white, 0.3), 4.2),
            sprite(glareTexture, white, 0.8),
        ];
        textGroup.add(group);
        return {
            face, mats, outline, group, sprites, sparkRate,
            minX: Math.min(...xs), maxX: Math.max(...xs),
            z: SWOOSH_Z + FRONT_Z + 0.08, carry: 0, last: null,
        };
    }
    const beams = intro ? [
        makeBeam(swooshShape, swooshFaceMaterial, swooshMats, 1, color('#7ff6ff'), 230),
        makeBeam(stripeShape, stripeFaceMaterial, stripeMats, 0.7, color('#ff6ae0'), 130),
    ] : [];
    const sparks = makeSparks();
    if (intro) scene.add(...sparks.objects);

    // ---- Render targets ----------------------------------------------------
    // sRGB storage keeps precision in the dark navy shades, which an 8-bit
    // linear target would crush to black. Sampling decodes back to linear.
    const targetOptions = { colorSpace: THREE.SRGBColorSpace };
    const target = new THREE.WebGLRenderTarget(1, 1, { ...targetOptions, samples: 4 });
    const glowTarget = new THREE.WebGLRenderTarget(1, 1, targetOptions);
    const blurA = new THREE.WebGLRenderTarget(1, 1, targetOptions);
    const blurB = new THREE.WebGLRenderTarget(1, 1, targetOptions);
    const blur = makeBlurPass();
    const lineMaterials = [];
    scene.traverse((o) => { if (o.isLine2) lineMaterials.push(o.material); });

    let width = 0;
    let height = 0;
    // Takes the CSS logo box size; the target covers it plus the padding.
    function setSize(boxWidth, boxHeight, pixelRatio) {
        const cssWidth = boxWidth * LOGO_PADDING;
        const cssHeight = boxHeight * LOGO_PADDING;
        const scale = Math.min(pixelRatio, MAX_TARGET_SIZE / Math.max(cssWidth, cssHeight, 1));
        const w = Math.max(1, Math.round(cssWidth * scale));
        const h = Math.max(1, Math.round(cssHeight * scale));
        if (w === width && h === height) return;
        width = w;
        height = h;
        target.setSize(w, h);
        glowTarget.setSize(Math.ceil(w / 2), Math.ceil(h / 2));
        blurA.setSize(Math.ceil(w / 4), Math.ceil(h / 4));
        blurB.setSize(Math.ceil(w / 4), Math.ceil(h / 4));
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        for (const m of lineMaterials) m.resolution.set(w, h);
    }

    // ---- Intro -----------------------------------------------------------------
    // Disc centre in text-local space, for the letters' orbit.
    root.updateMatrixWorld(true);
    const discCenter = textGroup.worldToLocal(disc.getWorldPosition(new THREE.Vector3()));
    const orbitRadius = (DISC_RADIUS * ORBIT_RADIUS) / TEXT_SCALE;
    // Each letter's resting place in polar form around the disc's vertical
    // axis (angle 0 is straight toward the viewer, positive to the right).
    for (const letter of letters) {
        const dx = letter.center.x - discCenter.x;
        const dz = letter.center.z - discCenter.z;
        letter.restRadius = Math.hypot(dx, dz);
        letter.restAngle = Math.atan2(dx, dz);
    }

    const lettersLand = INTRO_DELAY + LETTER_STAGGER * (letters.length - 1) + LETTER_DURATION;
    const swooshStart = lettersLand - SWOOSH_LEAD;
    const stripeStart = swooshStart + STRIPE_LAG;
    const introLength = intro ? Math.max(lettersLand, swooshStart + SWOOSH_DURATION, stripeStart + STRIPE_DURATION) : 0;
    // Unsheared text-local x range the reveal sweeps across.
    const revealFrom = TEXT_MIN_X * LETTER_WIDTH - 0.3;
    const revealTo = TEXT_MAX_X * LETTER_WIDTH + 0.3;
    let introStart = null;
    let lastTime = null;

    function placeLetter({ pivot, center, restRadius, restAngle }, t) {
        if (t >= 1) {
            pivot.position.copy(center);
            pivot.rotation.set(0, 0, 0);
            pivot.scale.setScalar(1);
            return;
        }
        // One continuous spiral round the disc: from directly behind it
        // (angle π) past its right-hand edge to the letter's resting angle.
        // The orbit stays wide until the letter is round the front of the
        // disc, then tightens in step with the angle, so each letter moves
        // into its own column and never sweeps across a neighbour's place.
        // Angle, radius, height, spin and size all ease out monotonically,
        // so the letter just decelerates into place with no overshoot.
        const e = easeOutCubic(t);
        const angle = Math.PI + (restAngle - Math.PI) * e;
        const frontFrom = Math.PI / 2;
        const tighten = Math.min(1, Math.max(0, (frontFrom - angle) / Math.max(frontFrom - restAngle, 0.05)));
        const radius = orbitRadius + (restRadius - orbitRadius) * tighten;
        pivot.position.set(
            discCenter.x + Math.sin(angle) * radius,
            center.y + ORBIT_RISE * (1 - e),
            discCenter.z + Math.cos(angle) * radius,
        );
        pivot.rotation.set(0, angle - restAngle, 0); // spins down to face front
        pivot.scale.setScalar(0.55 + 0.45 * e);
    }

    // Keeps everything left of the (italic-slanted) edge at x = edge.
    const localPlane = new THREE.Plane();
    function setReveal(mats, progress) {
        const edge = revealFrom + (revealTo - revealFrom) * progress;
        localPlane.setComponents(-1, SHEAR, 0, edge).normalize();
        mats.clip[0].copy(localPlane).applyMatrix4(textGroup.matrixWorld);
        return edge;
    }

    // Moves a beam's light along its reveal edge, following the middle of
    // the piece, heats the edge and throws sparks. s is the reveal's raw
    // progress (0..1 while it draws in); fade is BEAM_FADE in those units.
    const sparkFrom = new THREE.Vector3();
    const sparkTo = new THREE.Vector3();
    function updateBeam(beam, edge, s, fade, t, dt) {
        const heat = smoothstep(0, 0.08, s) * (1 - smoothstep(1, 1 + fade, s));
        beam.face.uniforms.uBeam.value.set(edge, heat, t);
        // The light goes out the moment the edge reaches the end of the piece.
        const on = smoothstep(0, 0.08, s) * smoothstep(beam.maxX, beam.maxX - 0.05, edge);
        beam.group.visible = on > 0.001;
        if (!beam.group.visible) {
            beam.last = null;
            return;
        }
        const x = Math.min(beam.maxX - 0.01, Math.max(beam.minX + 0.01, edge));
        const y = midlineAt(beam.outline, x) ?? 0;
        beam.group.position.set(x + SHEAR * y, y, beam.z);
        // An arc-light flicker.
        const flicker = 0.8 + Math.random() * 0.35;
        for (const sprite of beam.sprites) {
            sprite.scale.setScalar(sprite.userData.scale * (0.85 + 0.15 * on) * flicker);
            sprite.material.opacity = on * flicker;
        }

        // Sparks, spread along the path the light moved this frame.
        sparkTo.set(x + SHEAR * y, y, beam.z).applyMatrix4(textGroup.matrixWorld);
        sparkFrom.copy(beam.last ?? sparkTo);
        const drift = dt > 0 ? ((sparkTo.x - sparkFrom.x) / dt) * 0.15 : 0;
        beam.carry += beam.sparkRate * on * dt;
        const count = Math.floor(beam.carry);
        beam.carry -= count;
        for (let i = 0; i < count; i++) {
            const k = Math.random();
            sparks.emit(
                sparkFrom.x + (sparkTo.x - sparkFrom.x) * k,
                sparkFrom.y + (sparkTo.y - sparkFrom.y) * k,
                sparkFrom.z + (sparkTo.z - sparkFrom.z) * k,
                drift,
            );
        }
        beam.last = (beam.last ?? new THREE.Vector3()).copy(sparkTo);
    }

    // ---- Animation -----------------------------------------------------------
    const tilt = { x: 0, y: 0 };
    function update(time, pointer) {
        // Gentle sway, leaning toward the cursor when there is one.
        const px = pointer ? pointer.x : 0;
        const py = pointer ? pointer.y : 0;
        tilt.x += (px - tilt.x) * 0.05;
        tilt.y += (py - tilt.y) * 0.05;
        root.rotation.y = 0.16 * Math.sin(time * 0.5) + tilt.x * 0.25;
        root.rotation.x = 0.07 * Math.sin(time * 0.37 + 1) + tilt.y * 0.15;

        haze.material.uniforms.uTime.value = time;
        paintRing(time);

        if (introStart === null) introStart = time;
        const t = intro ? time - introStart : Infinity;
        letters.forEach((letter, i) => {
            // Letters wait behind the disc (progress 0) until their turn.
            placeLetter(letter, Math.max(0, (t - INTRO_DELAY - i * LETTER_STAGGER) / LETTER_DURATION));
        });
        root.updateMatrixWorld(true);
        const swooshEdge = setReveal(swooshMats, easeInOutSine(Math.min(1, Math.max(0, (t - swooshStart) / SWOOSH_DURATION))));
        const stripeEdge = setReveal(stripeMats, easeInOutSine(Math.min(1, Math.max(0, (t - stripeStart) / STRIPE_DURATION))));
        if (intro) {
            const dt = lastTime === null ? 0 : Math.min(0.05, Math.max(0, time - lastTime));
            updateBeam(beams[0], swooshEdge, (t - swooshStart) / SWOOSH_DURATION, BEAM_FADE / SWOOSH_DURATION, t, dt);
            updateBeam(beams[1], stripeEdge, (t - stripeStart) / STRIPE_DURATION, BEAM_FADE / STRIPE_DURATION, t, dt);
            const halfHeight = (FRAME_HEIGHT * LOGO_PADDING) / 2;
            sparks.update(dt, halfHeight * camera.aspect, halfHeight);
        }
        lastTime = time;
        const introDone = t >= introLength;
        const sinceIntro = intro ? Math.max(0, t - introLength) : time;

        // A glint sweeps across the letters every 5s, starting just before
        // the intro is done.
        const sinceGlint = intro ? t - (introLength - GLINT_LEAD) : time;
        const cycle = sinceGlint >= 0 ? sinceGlint % 5 : 99;
        const sweep = cycle < 1.6 ? -1.5 + (cycle / 1.6) * 6 : 99;
        for (const m of faceMaterials) m.uniforms.uSweep.value = sweep;

        for (const s of sparkles) {
            const f = introDone ? Math.pow(Math.max(0, Math.sin(Math.PI * 2 * (sinceIntro / s.period + s.phase))), 12) : 0;
            s.sprite.material.opacity = f;
            s.sprite.scale.setScalar((0.6 * f) / TEXT_SCALE);
            s.sprite.visible = f > 0.01;
        }
    }

    const clearColor = new THREE.Color();
    function blurPass(input, output, dx, dy) {
        blur.material.uniforms.tInput.value = input.texture;
        blur.material.uniforms.uStep.value.set(dx / input.width, dy / input.height);
        renderer.setRenderTarget(output);
        renderer.render(blur.scene, blur.camera);
    }

    function render() {
        const prevTarget = renderer.getRenderTarget();
        renderer.getClearColor(clearColor);
        const prevAlpha = renderer.getClearAlpha();
        renderer.setClearColor(0x000000, 0);

        // Spark sizes are in world units, so they need each target's height.
        camera.layers.set(0);
        sparks.dotMaterial.uniforms.uViewport.value = target.height;
        renderer.setRenderTarget(target);
        renderer.clear();
        renderer.render(scene, camera);

        camera.layers.set(GLOW_LAYER);
        sparks.dotMaterial.uniforms.uViewport.value = glowTarget.height;
        renderer.setRenderTarget(glowTarget);
        renderer.clear();
        renderer.render(scene, camera);

        blurPass(glowTarget, blurA, 1, 0);
        blurPass(blurA, blurB, 0, 1);
        blurPass(blurB, blurA, 1.5, 0);
        blurPass(blurA, blurB, 0, 1.5);

        renderer.setRenderTarget(prevTarget);
        renderer.setClearColor(clearColor, prevAlpha);
    }

    return {
        padding: LOGO_PADDING,
        texture: target.texture,
        glowTight: glowTarget.texture,
        glowWide: blurB.texture,
        setSize,
        update,
        render,
    };
}
