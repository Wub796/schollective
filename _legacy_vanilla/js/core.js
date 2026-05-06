/**
 * Schollective Core JS
 * Global systems: Custom cursor, scroll reveals, and navigation behavior.
 */

document.addEventListener('DOMContentLoaded', () => {
    initCursor();
    initScrollReveals();
    initNavbar();
});

/* ──────────────────────────────────────────────────────────────
   SYSTEM 1: CUSTOM CURSOR
   ────────────────────────────────────────────────────────────── */
function initCursor() {
    const dot = document.getElementById('cursorDot');
    const ring = document.getElementById('cursorRing');
    
    if (!dot || !ring) return;

    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dot.style.left = mouseX + 'px';
        dot.style.top = mouseY + 'px';
    });

    // Ring lerp loop
    function animateRing() {
        ringX += (mouseX - ringX) * 0.12;
        ringY += (mouseY - ringY) * 0.12;
        ring.style.left = ringX + 'px';
        ring.style.top = ringY + 'px';
        requestAnimationFrame(animateRing);
    }
    animateRing();

    // Hoverable elements
    const hoverables = 'a, button, .feat-card, .role-card, .request-card, .btn-primary, .btn-ghost';
    document.querySelectorAll(hoverables).forEach(el => {
        el.addEventListener('mouseenter', () => ring.classList.add('hovering'));
        el.addEventListener('mouseleave', () => ring.classList.remove('hovering'));
    });
}

/* ──────────────────────────────────────────────────────────────
   SYSTEM 2: SCROLL REVEALS
   ────────────────────────────────────────────────────────────── */
function initScrollReveals() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* ──────────────────────────────────────────────────────────────
   SYSTEM 3: NAVBAR BEHAVIOR
   ────────────────────────────────────────────────────────────── */
function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}
