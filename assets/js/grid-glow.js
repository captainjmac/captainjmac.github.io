// Cursor spotlight for the scrolling grid (see .grid-glow in _grid.scss).
// Moves the small masked spotlight box to the pointer and counter-translates
// the grid copy inside it, so both moves are compositor-only transforms and
// nothing larger than the spotlight ever repaints.
(() => {
    const glow = document.querySelector('.grid-glow');
    const inner = glow && glow.querySelector('.grid-glow-inner');
    if (!glow || !inner || !window.matchMedia('(pointer: fine)').matches) return;

    const HALF = 240; // half the .grid-glow box size
    let x = -9999, y = -9999, queued = false;

    function apply() {
        queued = false;
        glow.style.transform = `translate(${x - HALF}px, ${y - HALF}px)`;
        inner.style.transform = `translate(${HALF - x}px, ${HALF - y}px)`;
    }

    function schedule() {
        if (!queued) {
            queued = true;
            requestAnimationFrame(apply);
        }
    }

    window.addEventListener('pointermove', (e) => {
        x = e.clientX;
        y = e.clientY;
        schedule();
    }, { passive: true });

    // Park the spotlight offscreen when the pointer leaves the window.
    document.documentElement.addEventListener('pointerleave', () => {
        x = y = -9999;
        schedule();
    });
})();
