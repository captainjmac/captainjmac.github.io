// Twinkling star layer rendered with PixiJS (WebGL/WebGPU).
// Sits between the grid background and the logo; stars cluster around the
// logo and blink in and out in the site's white/cyan/purple palette.
(async () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const host = document.querySelector('.starfield-container');
    if (!host || !window.PIXI) return;

    const app = new PIXI.Application();
    try {
        await app.init({
            backgroundAlpha: 0,
            resizeTo: window,
            antialias: true,
            autoDensity: true,
            resolution: Math.min(window.devicePixelRatio || 1, 2),
        });
    } catch (e) {
        return; // no WebGL/WebGPU — the page is fine without stars
    }
    host.appendChild(app.canvas);
    window.__starfield = app; // dev handle for inspecting/extending the effect layer

    // Sparkle texture: soft halo + four-point cross streaks + bright core.
    // Drawn in white so per-star tinting works.
    function makeStarTexture() {
        const S = 64;
        const c = document.createElement('canvas');
        c.width = c.height = S;
        const ctx = c.getContext('2d');
        const m = S / 2;

        let halo = ctx.createRadialGradient(m, m, 0, m, m, m);
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

        return PIXI.Texture.from(c);
    }

    // Site palette (see --neon-* in _main.scss); white weighted heaviest.
    const COLORS = [
        0xffffff, 0xffffff, 0xffffff,
        0x00ffff, 0x00ffff,
        0x9f00ff,
    ];

    const texture = makeStarTexture();
    const logoEl = document.querySelector('.foreground-container .jmac-logo.original');

    function centerPoint() {
        if (logoEl) {
            const r = logoEl.getBoundingClientRect();
            return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        }
        return { x: app.screen.width / 2, y: app.screen.height / 2 };
    }

    function spawnPosition() {
        const w = app.screen.width;
        const h = app.screen.height;
        // Mostly clustered around the logo, with some scattered across the sky.
        if (logoEl && Math.random() < 0.75) {
            const r = logoEl.getBoundingClientRect();
            const cx = r.left + r.width / 2;
            const cy = r.top + r.height / 2;
            const angle = Math.random() * Math.PI * 2;
            const dist = (0.25 + Math.random() * 0.65) * (r.width / 2) * 1.4;
            return {
                x: cx + Math.cos(angle) * dist,
                y: cy + Math.sin(angle) * dist * 0.9,
            };
        }
        return { x: Math.random() * w, y: Math.random() * h * 0.85 };
    }

    function respawn(star) {
        const pos = spawnPosition();
        star.sprite.position.set(pos.x, pos.y);
        star.sprite.tint = COLORS[(Math.random() * COLORS.length) | 0];
        star.life = 0;
        // Drift outward horizontally; stars level with the center move fastest.
        const c = centerPoint();
        const dir = pos.x >= c.x ? 1 : -1;
        const vertFalloff = Math.max(0.1, 1 - Math.abs(pos.y - c.y) / (app.screen.height / 2));
        star.vx = dir * (10 + Math.random() * 25) * vertFalloff;
        star.duration = 4 + Math.random() * 9;
        star.maxAlpha = 0.6 + Math.random() * 0.4;
        star.baseScale = 0.14 + Math.random() * 0.3;
        if (Math.random() < 0.06) star.baseScale *= 2; // occasional hero sparkle
        star.flickerSpeed = 2 + Math.random() * 3.5;
        star.phase = Math.random() * Math.PI * 2;
    }

    const STAR_COUNT = Math.min(90, Math.round((app.screen.width * app.screen.height) / 18000));
    const stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
        const sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(0.5);
        sprite.blendMode = 'add';
        sprite.alpha = 0;
        app.stage.addChild(sprite);
        const star = { sprite };
        respawn(star);
        star.life = Math.random() * star.duration; // stagger so they don't pulse in sync
        stars.push(star);
    }

    app.ticker.add((ticker) => {
        const dt = ticker.deltaMS / 1000;
        const c = centerPoint();
        const slowingScale = app.screen.width * 0.18;
        for (const star of stars) {
            star.life += dt;
            const t = star.life / star.duration;
            if (t >= 1) {
                respawn(star);
                continue;
            }
            // Drift decelerates with horizontal distance from the center.
            const damping = 1 / (1 + Math.abs(star.sprite.x - c.x) / slowingScale);
            star.sprite.x += star.vx * damping * dt;
            const envelope = Math.sin(Math.PI * t);
            const flicker = 0.8 + 0.2 * Math.sin(star.life * star.flickerSpeed + star.phase);
            star.sprite.alpha = star.maxAlpha * envelope * flicker;
            star.sprite.scale.set(star.baseScale * (0.85 + 0.3 * envelope) * flicker);
        }
    });
})();
