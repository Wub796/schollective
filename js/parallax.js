/**
 * Schollective Parallax JS
 * CSS 3D Mouse Parallax (Hero cards)
 */

document.addEventListener('DOMContentLoaded', () => {
    initHeroParallax();
});

function initHeroParallax() {
    const hero = document.getElementById('heroSection');
    const cluster = document.getElementById('cardCluster');
    const heroOrb = document.getElementById('heroOrb');
    const floatCards = document.querySelectorAll('.float-card');

    if (!hero || !cluster) return;

    let targetNX = 0, targetNY = 0;
    let currentNX = 0, currentNY = 0;

    const MAX_ROT = 8;
    const DEPTH_SCALE = 1.0;

    document.addEventListener('mousemove', (e) => {
        const rect = hero.getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width;
        const ny = (e.clientY - rect.top) / rect.height;
        targetNX = (nx - 0.5) * 2;
        targetNY = (ny - 0.5) * 2;

        if (heroOrb) {
            heroOrb.style.left = e.clientX + 'px';
            heroOrb.style.top = e.clientY + 'px';
        }
    });

    function animateParallax() {
        const LERP = 0.055;
        currentNX += (targetNX - currentNX) * LERP;
        currentNY += (targetNY - currentNY) * LERP;

        const rotY = currentNX * MAX_ROT;
        const rotX = -currentNY * MAX_ROT * 0.6;
        cluster.style.transform = `rotateY(${rotY}deg) rotateX(${rotX}deg)`;

        floatCards.forEach(card => {
            const depth = parseFloat(card.dataset.depth) || 10;
            const tx = currentNX * depth * DEPTH_SCALE;
            const ty = currentNY * depth * DEPTH_SCALE;
            card.style.transform = `translateX(${tx}px) translateY(${ty}px)`;
        });

        requestAnimationFrame(animateParallax);
    }

    animateParallax();
}
