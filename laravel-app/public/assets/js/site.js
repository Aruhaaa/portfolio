document.documentElement.classList.add('js');

document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('site-header');
    const toggle = document.getElementById('menu-toggle');
    const nav = document.getElementById('site-nav');

    // Header rule appears once the page scrolls
    if (header) {
        const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    // Mobile menu
    if (toggle && nav) {
        toggle.addEventListener('click', () => {
            const open = nav.toggleAttribute('data-open');
            toggle.setAttribute('aria-expanded', String(open));
        });
        nav.addEventListener('click', (e) => {
            if (e.target.closest('a')) {
                nav.removeAttribute('data-open');
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // Mark the nav link for the section in view
    const spyLinks = document.querySelectorAll('[data-spy]');
    if (spyLinks.length && 'IntersectionObserver' in window) {
        const byId = new Map([...spyLinks].map((a) => [a.dataset.spy, a]));
        const spy = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const link = byId.get(entry.target.id);
                if (!link) return;
                if (entry.isIntersecting) {
                    spyLinks.forEach((a) => a.removeAttribute('aria-current'));
                    link.setAttribute('aria-current', 'location');
                } else {
                    link.removeAttribute('aria-current');
                }
            });
        }, { rootMargin: '-40% 0px -55% 0px' });
        byId.forEach((_, id) => {
            const section = document.getElementById(id);
            if (section) spy.observe(section);
        });
    }

    // Film strip of projects
    const filmStage = document.getElementById('film-stage');
    if (filmStage) initFilm(filmStage);

    // Copy email
    const copyBtn = document.getElementById('copy-email');
    const copyStatus = document.getElementById('copy-status');
    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            const email = copyBtn.dataset.email;
            let ok = false;
            try {
                await navigator.clipboard.writeText(email);
                ok = true;
            } catch (e) {
                const probe = document.createElement('textarea');
                probe.value = email;
                document.body.appendChild(probe);
                probe.select();
                try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
                probe.remove();
            }
            copyBtn.textContent = ok ? 'Copied' : 'Copy failed, select the address above';
            if (copyStatus) copyStatus.textContent = ok ? 'Email address copied' : 'Could not copy the email address';
            setTimeout(() => { copyBtn.textContent = 'Copy email'; }, 2500);
        });
    }

    // Admin dialog
    const dialog = document.getElementById('login-modal');
    const openBtn = document.getElementById('admin-open');
    const closeBtn = document.getElementById('modal-close');
    if (dialog && typeof dialog.showModal === 'function') {
        if (openBtn) openBtn.addEventListener('click', () => dialog.showModal());
        if (closeBtn) closeBtn.addEventListener('click', () => dialog.close());
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) dialog.close();
        });
        if (dialog.hasAttribute('data-open-on-load')) dialog.showModal();
    }
});

/*
 * The project reel. This part is the controller: which project is in the gate, the spring
 * that moves the reel, keyboard, wheel and drag. Drawing is done by a renderer:
 *   - FilmGL (film3d.js): one continuous ribbon of film bent through 3D, when WebGL2 works
 *   - domRenderer (below): the flat strip of tilted frames, as the fallback
 * Add ?film=2d to the address to force the fallback.
 * The reel loops, so there is always a frame on both sides of the gate.
 */
function domRenderer(stage, frames, env) {
    const THETA_DEG = 30;
    const THETA = THETA_DEG * Math.PI / 180;
    const COS = Math.cos(THETA);
    const SIN = Math.sin(THETA);
    const GAP = 8;
    const n = frames.length;
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    const wrapD = (d) => d - n * Math.round(d / n);
    let W = 0, H = 0, fw = 0, fh = 0, ax = 0, ay = 0;

    function measure() {
        W = stage.clientWidth;
        H = stage.clientHeight;
        fw = frames[0].offsetWidth;
        fh = frames[0].offsetHeight;
        const hero = env.hero;
        if (!hero) return;
        if (env.narrow.matches) {
            ['--gate-right', '--gate-w', '--slate-top'].forEach((p) => hero.style.removeProperty(p));
            return;
        }
        // The gate hugs the right edge; the slate hangs under it, so the gate sits high
        // enough for both to fit inside the hero.
        const margin = Math.max(20, Math.round(W * 0.03));
        const slateH = env.panel ? env.panel.offsetHeight : 0;
        const gap = Math.round(fw * 0.09); // air between the film and the slate
        const lowest = H - 28 - slateH - gap - fh / 2;
        ax = W - fw / 2 - margin;
        ay = clamp(H * 0.36, fh / 2 + 10, Math.max(fh / 2 + 10, lowest));
        hero.style.setProperty('--gate-right', margin + 'px');
        hero.style.setProperty('--gate-w', fw + 'px');
        hero.style.setProperty('--slate-top', (ay + fh / 2 + gap) + 'px');
    }

    function draw(pos, vel, now) {
        const horizontal = env.narrow.matches;
        const moving = Math.min(1, Math.abs(vel));
        const weave = env.reduce.matches ? 0 : Math.sin(now / 23) * moving * 1.6;
        const step = (fw + GAP) * 0.92;

        frames.forEach((f, i) => {
            const d = wrapD(i - pos);
            const ad = Math.abs(d);
            const scale = 1 - 0.08 * Math.min(ad, 2);
            let x, y, rot;

            if (horizontal) {
                x = W / 2 + d * (fw * 0.9 + 10);
                y = H / 2 + weave;
                rot = 0;
            } else {
                // Round off the point so frames swing smoothly through it
                const e = 0.35;
                const s = ad < e ? (d * d) / (2 * e) + e / 2 : ad;
                x = ax + (e / 2 - s) * step * COS; // the gate frame lands exactly on ax
                y = ay + d * step * SIN + weave;
                rot = -clamp(d, -1, 1) * THETA_DEG;
            }

            // Draw only the frames that reach into the hero
            const a = Math.abs(rot) * Math.PI / 180;
            const hx = (fw * scale / 2) * Math.cos(a) + (fh * scale / 2) * Math.sin(a);
            const hy = (fw * scale / 2) * Math.sin(a) + (fh * scale / 2) * Math.cos(a);
            const inside = x + hx > 0 && x - hx < W && y + hy > 0 && y - hy < H;

            // With very few projects the reel's seam can be on screen: fade frames out there
            const seam = clamp((n / 2 - ad) / 0.8, 0, 1);

            f.style.transform = 'translate3d(' + (x - fw / 2) + 'px,' + (y - fh / 2) + 'px,0) rotate(' + rot + 'deg) scale(' + scale + ')';
            f.style.zIndex = String(100 - Math.round(ad * 10));
            f.style.opacity = seam < 1 ? String(seam) : '';
            f.style.setProperty('--dim', String(Math.min(ad, 1.6) * 0.4));
            f.style.visibility = inside ? '' : 'hidden';
            // Tails that have faded out behind the text should not catch clicks
            f.style.pointerEvents = !horizontal && x < W * 0.42 ? 'none' : '';
        });
    }

    return {
        dom: true,
        ready: Promise.resolve(),
        measure,
        draw,
        dragAxis() {
            return env.narrow.matches ? [fw * 0.9 + 10, 0] : [0, SIN * (fw + GAP) * 0.92];
        },
        flash() {},
        setFocus() {},
        destroy() {},
    };
}

function initFilm(stage) {
    const frames = [...stage.querySelectorAll('.frame')];
    const n = frames.length;
    if (!n) return;

    const hero = stage.closest('.hero');
    const panel = document.querySelector('.film-panel');
    const prevBtn = document.getElementById('film-prev');
    const nextBtn = document.getElementById('film-next');
    const count = document.getElementById('film-count');
    const caption = document.getElementById('film-caption');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    const narrow = window.matchMedia('(max-width: 56rem)');
    const env = { hero, panel, reduce, narrow, frame: () => frames[0] };

    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    const wrapD = (d) => d - n * Math.round(d / n); // signed distance around the reel
    const idx = (v) => ((Math.round(v) % n) + n) % n; // which project is in the gate

    const start = clamp(parseInt(stage.dataset.start, 10) || 0, 0, n - 1);
    let target = start;
    let pos = reduce.matches ? start : start + 2.2; // the reel threads in on load
    let vel = 0;
    let raf = 0;
    let last = 0;
    let shown = -1;
    let renderer = null;

    function applyMode() {
        stage.classList.toggle('is-horizontal', narrow.matches);
        stage.classList.toggle('is-vertical', !narrow.matches);
    }

    function syncUI() {
        const cur = idx(target);
        if (cur === shown) return;

        frames.forEach((f, i) => {
            const btn = f.querySelector('.frame-btn');
            f.classList.toggle('is-active', i === cur);
            btn.tabIndex = i === cur ? 0 : -1;
            if (i === cur) btn.setAttribute('aria-current', 'true');
            else btn.removeAttribute('aria-current');
        });

        caption.innerHTML = frames[cur].querySelector('.frame-detail').innerHTML;
        count.textContent = (cur + 1) + ' of ' + n;
        prevBtn.disabled = n < 2;
        nextBtn.disabled = n < 2;

        if (shown !== -1 && !reduce.matches) {
            const f = frames[cur];
            f.classList.remove('is-exposed');
            void f.offsetWidth;
            f.classList.add('is-exposed');
            if (renderer) renderer.flash();
        }
        shown = cur;
    }

    function tick(now) {
        const dt = Math.min(0.032, (now - last) / 1000 || 0.016);
        last = now;
        const k = 150, c = 17; // slightly underdamped
        vel += ((target - pos) * k - vel * c) * dt;
        pos += vel * dt;
        if (renderer) renderer.draw(pos, vel, now);
        if (Math.abs(target - pos) < 0.0008 && Math.abs(vel) < 0.01) {
            pos = target;
            vel = 0;
            if (renderer) renderer.draw(pos, vel, now);
            raf = 0;
            return;
        }
        raf = requestAnimationFrame(tick);
    }

    function kick() {
        if (!renderer) return;
        if (reduce.matches) {
            pos = target;
            vel = 0;
            renderer.draw(pos, 0, performance.now());
            return;
        }
        if (!raf) {
            last = performance.now();
            raf = requestAnimationFrame(tick);
        }
    }

    // Move one frame along the reel, or to a given project by the shortest way round
    function stepBy(dir) {
        if (n < 2) return;
        target = Math.round(target) + dir;
        syncUI();
        kick();
    }
    function goTo(i) {
        const base = Math.round(target);
        target = base + wrapD(i - base);
        syncUI();
        kick();
    }

    prevBtn.addEventListener('click', () => stepBy(-1));
    nextBtn.addEventListener('click', () => stepBy(1));

    let suppressClick = false;
    stage.addEventListener('click', (e) => {
        if (suppressClick || !renderer || !renderer.dom) return;
        const btn = e.target.closest('.frame-btn');
        if (!btn) return;
        const i = frames.indexOf(btn.closest('.frame'));
        if (i !== idx(target)) goTo(i);
    });

    stage.addEventListener('keydown', (e) => {
        const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
        if (e.key in keys) {
            e.preventDefault();
            stepBy(keys[e.key]);
        } else if (e.key === 'Home') {
            e.preventDefault();
            goTo(0);
        } else if (e.key === 'End') {
            e.preventDefault();
            goTo(n - 1);
        }
    });

    // The frames are real buttons for keyboard and screen-reader users; the ring is drawn on the film
    stage.addEventListener('focusin', (e) => {
        let visible = false;
        try { visible = e.target.matches(':focus-visible'); } catch (err) { visible = true; }
        if (renderer) renderer.setFocus(visible);
    });
    stage.addEventListener('focusout', () => {
        if (renderer) renderer.setFocus(false);
    });

    // Sideways trackpad swipes step through the reel; vertical scrolling stays with the page
    let wheelAcc = 0;
    let wheelLock = false;
    stage.addEventListener('wheel', (e) => {
        if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) * 1.2) return;
        e.preventDefault();
        if (wheelLock) return;
        wheelAcc += e.deltaX;
        if (Math.abs(wheelAcc) > 50) {
            stepBy(Math.sign(wheelAcc));
            wheelAcc = 0;
            wheelLock = true;
            setTimeout(() => { wheelLock = false; }, 320);
        }
    }, { passive: false });

    // Drag the reel so the film follows the pointer along the strip.
    // On wide touch screens the field covers the page, so touch keeps scrolling the page
    // and uses the buttons or a tap on a frame instead.
    let drag = null;
    stage.addEventListener('pointerdown', (e) => {
        if (!renderer) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (e.pointerType === 'touch' && !narrow.matches) return;
        drag = {
            id: e.pointerId, x: e.clientX, y: e.clientY, base: pos, moved: false,
            axis: renderer.dragAxis(e.clientX, e.clientY),
            samples: [{ t: e.timeStamp, p: pos }],
        };
    });
    stage.addEventListener('pointermove', (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        if (!drag.moved) {
            if (Math.hypot(dx, dy) < 6) return;
            drag.moved = true;
            stage.setPointerCapture(e.pointerId);
            stage.classList.add('is-dragging');
            cancelAnimationFrame(raf);
            raf = 0;
            vel = 0;
        }
        const ax = drag.axis[0], ay = drag.axis[1];
        const len2 = Math.max(ax * ax + ay * ay, 400);
        pos = drag.base - (dx * ax + dy * ay) / len2;
        target = pos;
        drag.samples.push({ t: e.timeStamp, p: pos });
        if (drag.samples.length > 6) drag.samples.shift();
        syncUI();
        renderer.draw(pos, 0, e.timeStamp);
    });
    const endDrag = (e) => {
        if (!drag || e.pointerId !== drag.id) return;
        const d = drag;
        drag = null;
        stage.classList.remove('is-dragging');
        if (!d.moved) {
            // A tap: pick the frame under the pointer (the ribbon has no DOM frames to click)
            if (e.type === 'pointerup' && renderer && renderer.pick) {
                const i = renderer.pick(e.clientX, e.clientY);
                if (i >= 0 && i !== idx(target)) goTo(i);
            }
            return;
        }
        suppressClick = true;
        setTimeout(() => { suppressClick = false; }, 0);
        const first = d.samples[0];
        const span = Math.max(1, e.timeStamp - first.t) / 1000;
        const v = e.type === 'pointerup' ? (pos - first.p) / span : 0;
        target = Math.round(pos + clamp(v * 0.12, -1, 1));
        vel = clamp(v * 0.6, -6, 6);
        syncUI();
        kick();
    };
    stage.addEventListener('pointerup', endDrag);
    stage.addEventListener('pointercancel', endDrag);

    const relayout = () => {
        if (!renderer) return;
        applyMode();
        renderer.measure();
        renderer.draw(pos, vel, performance.now());
    };
    if ('ResizeObserver' in window) {
        new ResizeObserver(relayout).observe(stage);
    } else {
        window.addEventListener('resize', relayout);
    }

    function begin(r) {
        renderer = r;
        applyMode();
        r.measure();
        syncUI();
        r.draw(pos, vel, performance.now());
        stage.classList.add('film-ready');
        kick();
    }
    function useFlat() {
        stage.classList.remove('film-gl');
        begin(domRenderer(stage, frames, env));
    }

    // Everything the ribbon needs from the markup
    const data = frames.map((f) => {
        const prints = f.querySelectorAll('.frame-print');
        const img = f.querySelector('.frame-pic img');
        return {
            title: prints[0] ? prints[0].textContent.trim() : '',
            tech: prints[1] ? prints[1].textContent.trim() : '',
            image: img ? img.src : '',
            pinned: f.classList.contains('is-pinned'),
        };
    });

    let gl = null;
    if (window.FilmGL && !/[?&]film=2d\b/.test(location.search)) {
        try {
            env.onLost = () => { renderer = null; useFlat(); };
            gl = window.FilmGL.create(stage, data, env);
        } catch (err) {
            gl = null;
        }
    }
    if (gl) {
        stage.classList.add('film-gl');
        gl.ready.then(() => begin(gl)).catch(() => {
            gl.destroy();
            useFlat();
        });
    } else {
        useFlat();
    }
}
