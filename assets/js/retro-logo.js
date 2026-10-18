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
// the swoosh get the full sweep too.
function makeChromeFaceMaterial(yMin = 0, yMax = 1) {
    return new THREE.ShaderMaterial({
        uniforms: {
            uSweep: { value: 99 },
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
            varying vec2 vShape;
            varying vec3 vNormalV;
            void main() {
                vShape = position.xy;
                vNormalV = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: /* glsl */ `
            uniform float uSweep;
            uniform vec2 uYRange;
            uniform vec3 uSkyTop, uSkyMid, uSkyLow, uEdge;
            uniform vec3 uGroundTop, uGroundMid, uGroundHot, uGroundLow, uStreak;
            varying vec2 vShape;
            varying vec3 vNormalV;

            void main() {
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

// ---- Logo ----------------------------------------------------------------------
export function createLogo(renderer, { starTexture } = {}) {
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

    function addSolid(shape, offsetX, z, face = faceMaterial) {
        const geometry = new THREE.ExtrudeGeometry(shape, extrude);
        geometry.translate(offsetX, 0, 0);
        geometry.scale(LETTER_WIDTH, 1, 1);
        geometry.applyMatrix4(shearMatrix);
        geometry.translate(0, 0, z);
        // Group 0 is the front/back caps, group 1 the walls and bevels.
        const mesh = new THREE.Mesh(geometry, [face, sideMaterial]);
        textGroup.add(mesh);
        // Black stand-in on the glow layer so letters hide glow behind them.
        const occluder = new THREE.Mesh(geometry, occluderMaterial);
        occluder.layers.set(GLOW_LAYER);
        textGroup.add(occluder);
        addBacking(shape, offsetX, z);
    }

    // A dark slab cut slightly larger than the shape, just behind it: the
    // thick dark outline round each letter on the original, which also
    // fills the gaps between letters. It blocks glow behind it too.
    function addBacking(shape, offsetX, z) {
        const geometry = new THREE.ExtrudeGeometry(shape, {
            depth: 0.02,
            bevelEnabled: true,
            bevelThickness: 0,
            bevelSize: 0,
            bevelOffset: BACKING_OFFSET,
            bevelSegments: 1,
            curveSegments: 16,
        });
        geometry.translate(offsetX, 0, 0);
        geometry.scale(LETTER_WIDTH, 1, 1);
        geometry.applyMatrix4(shearMatrix);
        geometry.translate(0, 0, z - BEVEL_THICKNESS - 0.03);
        const backing = new THREE.Mesh(geometry, backingMaterial);
        backing.layers.enable(GLOW_LAYER);
        textGroup.add(backing);
    }

    function addOutline(shape, offsetX, z, colorAt) {
        for (const loop of loopsFor(shape, offsetX)) {
            // Bold laser line: a white-hot core plus a wider coloured glow.
            textGroup.add(makeLine(loop, (x, y) => colorAt(x, y).clone().lerp(white, 0.5), z + FRONT_Z + 0.004, 0.036, 0));
            textGroup.add(makeLine(loop, colorAt, z + FRONT_Z + 0.004, 0.055, GLOW_LAYER));
        }
    }

    const letterColor = (x, y) => pink.clone().lerp(cyan, smoothstep(0.2, 0.75, y));
    for (const { shape, x } of LETTERS) {
        const s = shape();
        addSolid(s, x, 0);
        addOutline(s, x, 0, letterColor);
    }

    const swoosh = swooshMain();
    addSolid(swoosh, 0, SWOOSH_Z, swooshFaceMaterial);
    addOutline(swoosh, 0, SWOOSH_Z, (x, y) => orange.clone().lerp(cyan, smoothstep(SWOOSH_BOTTOM, SWOOSH_TOP - 0.01, y)));
    const stripe = swooshStripe();
    addSolid(stripe, 0, SWOOSH_Z * 2, stripeFaceMaterial);
    addOutline(stripe, 0, SWOOSH_Z * 2, () => magenta);

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

        // A glint sweeps across the letters every 5s.
        const cycle = time % 5;
        const sweep = cycle < 1.6 ? -1.5 + (cycle / 1.6) * 6 : 99;
        for (const m of faceMaterials) m.uniforms.uSweep.value = sweep;

        for (const s of sparkles) {
            const f = Math.pow(Math.max(0, Math.sin(Math.PI * 2 * (time / s.period + s.phase))), 12);
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

        camera.layers.set(0);
        renderer.setRenderTarget(target);
        renderer.clear();
        renderer.render(scene, camera);

        camera.layers.set(GLOW_LAYER);
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
