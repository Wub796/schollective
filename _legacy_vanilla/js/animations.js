/**
 * Schollective Animations JS
 * Lottie and Rive initialization.
 */

document.addEventListener('DOMContentLoaded', () => {
    initLottie();
});

/* ──────────────────────────────────────────────────────────────
   SYSTEM: LOTTIE ANIMATION (CTA section)
   ────────────────────────────────────────────────────────────── */
function initLottie() {
    const lottieContainer = document.getElementById('lottie-cta');
    if (!lottieContainer || typeof lottie === 'undefined') return;

    // Animation data (Academic orbit effect)
    const lottieAnimData = {
        v: '5.9.0', fr: 60, ip: 0, op: 240, w: 200, h: 200,
        nm: 'schollective-orbit', ddd: 0, assets: [],
        layers: [
            // Outer dashed ring (sage)
            {
                ddd: 0, ind: 1, ty: 4, nm: 'ring-outer', sr: 1, bm: 0,
                ks: {
                    o: { a: 0, k: 25 },
                    r: { a: 1, k: [{ t: 0, s: [0], e: [-360], i: { x: [0.5], y: [0.5] }, o: { x: [0.5], y: [0.5] } }, { t: 240, s: [-360] }] },
                    p: { a: 0, k: [100, 100, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] }
                },
                shapes: [
                    { ty: 'el', nm: 'outer-el', s: { a: 0, k: [168, 168] }, p: { a: 0, k: [0, 0] } },
                    { ty: 'st', nm: 'outer-st', c: { a: 0, k: [0.239, 0.478, 0.416, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 1 }, lc: 2, lj: 2, d: [{ n: 'd', nm: 'dash', v: { a: 0, k: 6 } }, { n: 'g', nm: 'gap', v: { a: 0, k: 16 } }] }
                ],
                ip: 0, op: 240, st: 0
            },
            // Inner dashed ring (amber)
            {
                ddd: 0, ind: 2, ty: 4, nm: 'ring-inner', sr: 1, bm: 0,
                ks: {
                    o: { a: 0, k: 45 },
                    r: { a: 1, k: [{ t: 0, s: [0], e: [360], i: { x: [0.5], y: [0.5] }, o: { x: [0.5], y: [0.5] } }, { t: 240, s: [360] }] },
                    p: { a: 0, k: [100, 100, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] }
                },
                shapes: [
                    { ty: 'el', nm: 'inner-el', s: { a: 0, k: [104, 104] }, p: { a: 0, k: [0, 0] } },
                    { ty: 'st', nm: 'inner-st', c: { a: 0, k: [0.831, 0.573, 0.165, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 1.5 }, lc: 2, lj: 2, d: [{ n: 'd', nm: 'dash', v: { a: 0, k: 18 } }, { n: 'g', nm: 'gap', v: { a: 0, k: 8 } }] }
                ],
                ip: 0, op: 240, st: 0
            },
            // Orbit controller
            {
                ddd: 0, ind: 3, ty: 4, nm: 'orbit-ctrl', sr: 1, bm: 0,
                ks: {
                    o: { a: 0, k: 0 },
                    r: { a: 1, k: [{ t: 0, s: [0], e: [360], i: { x: [0.167], y: [0.167] }, o: { x: [0.167], y: [0.167] } }, { t: 240, s: [360] }] },
                    p: { a: 0, k: [100, 100, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] }
                },
                shapes: [
                    { ty: 'el', s: { a: 0, k: [2, 2] }, p: { a: 0, k: [0, 0] } },
                    { ty: 'fl', c: { a: 0, k: [1, 1, 1, 0] }, o: { a: 0, k: 0 }, r: 1 }
                ],
                ip: 0, op: 240, st: 0
            },
            // Orbiting dot
            {
                ddd: 0, ind: 4, ty: 4, nm: 'dot-orbit', sr: 1, bm: 0,
                parent: 3,
                ks: {
                    o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [52, 0, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] }
                },
                shapes: [
                    { ty: 'el', s: { a: 0, k: [10, 10] }, p: { a: 0, k: [0, 0] } },
                    { ty: 'fl', c: { a: 0, k: [0.831, 0.573, 0.165, 1] }, o: { a: 0, k: 100 }, r: 1 }
                ],
                ip: 0, op: 240, st: 0
            },
            // Center pulsing circle
            {
                ddd: 0, ind: 5, ty: 4, nm: 'center-dot', sr: 1, bm: 0,
                ks: {
                    o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [100, 100, 0] }, a: { a: 0, k: [0, 0, 0] },
                    s: { a: 1, k: [{ t: 0, s: [100, 100, 100], e: [118, 118, 100], i: { x: [0.5, 0.5, 0.5], y: [1, 1, 1] }, o: { x: [0.5, 0.5, 0.5], y: [0, 0, 0] } }, { t: 120, s: [118, 118, 100], e: [100, 100, 100], i: { x: [0.5, 0.5, 0.5], y: [1, 1, 1] }, o: { x: [0.5, 0.5, 0.5], y: [0, 0, 0] } }, { t: 240, s: [100, 100, 100] }] }
                },
                shapes: [
                    { ty: 'el', s: { a: 0, k: [26, 26] }, p: { a: 0, k: [0, 0] } },
                    { ty: 'fl', c: { a: 0, k: [0.831, 0.573, 0.165, 1] }, o: { a: 0, k: 100 }, r: 1 }
                ],
                ip: 0, op: 240, st: 0
            },
            // Center glow ring
            {
                ddd: 0, ind: 6, ty: 4, nm: 'glow-ring', sr: 1, bm: 0,
                ks: {
                    o: { a: 1, k: [{ t: 0, s: [35], e: [0], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } }, { t: 120, s: [0], e: [35], i: { x: [0.5], y: [1] }, o: { x: [0.5], y: [0] } }, { t: 240, s: [35] }] },
                    r: { a: 0, k: 0 }, p: { a: 0, k: [100, 100, 0] }, a: { a: 0, k: [0, 0, 0] },
                    s: { a: 1, k: [{ t: 0, s: [100, 100, 100], e: [160, 160, 100], i: { x: [0.5, 0.5, 0.5], y: [1, 1, 1] }, o: { x: [0.5, 0.5, 0.5], y: [0, 0, 0] } }, { t: 120, s: [160, 160, 100], e: [100, 100, 100], i: { x: [0.5, 0.5, 0.5], y: [1, 1, 1] }, o: { x: [0.5, 0.5, 0.5], y: [0, 0, 0] } }, { t: 240, s: [100, 100, 100] }] }
                },
                shapes: [
                    { ty: 'el', s: { a: 0, k: [26, 26] }, p: { a: 0, k: [0, 0] } },
                    { ty: 'st', c: { a: 0, k: [0.831, 0.573, 0.165, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 1.5 }, lc: 2, lj: 2 }
                ],
                ip: 0, op: 240, st: 0
            }
        ]
    };

    const lottieInstance = lottie.loadAnimation({
        container: lottieContainer,
        renderer: 'svg',
        loop: true,
        autoplay: false,
        animationData: lottieAnimData
    });

    const lottieObs = new IntersectionObserver((entries) => {
        entries.forEach(e => e.isIntersecting ? lottieInstance.play() : lottieInstance.pause());
    }, { threshold: 0.1 });
    lottieObs.observe(lottieContainer);
    lottieInstance.setSpeed(0.7);
}
