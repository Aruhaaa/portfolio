/*
 * FilmGL draws the project reel as one continuous strip of film bent through 3D space.
 *
 * The ribbon is a single mesh that follows a smooth curve (with perspective and a twist).
 * Every project is a frame on a long texture, and the texture slides along the ribbon as
 * the reel moves, the way film runs through a projector. It needs WebGL2; site.js falls
 * back to the flat DOM strip when create() returns null or fails.
 */
(function (global) {
    'use strict';

    const YELLOW = '#F5C400';
    const BASE = '#121416';
    const CARD = '#1C1F22';
    const DW = 338; // one frame in design px: the same proportions as the flat CSS frame
    const DH = 270;
    const RIBBON_W = DH / DW; // ribbon width, in frame lengths
    const SEG = 28; // mesh segments per frame length
    const FOV = 34 * Math.PI / 180;

    /*
     * The curve the film runs along, in frame lengths. The gate (the frame being read)
     * sits at the origin. Each point is [x, y, z, twist in degrees]; the camera is turned by
     * yaw/pitch/roll so the near end swells toward the viewer and the far end shrinks away.
     */
    const PATHS = {
        wide: {
            gate: 3,
            yaw: 30, pitch: -3, roll: 0,
            pts: [
                [-4.4, 1.7, 0.0, 0],
                [-2.9, 0.8, 0.0, 0],
                [-1.45, 0.2, 0.0, 0],
                [0.0, 0.0, 0.0, 0],
                [1.45, 0.22, 0.0, 8],
                [2.7, 0.95, -0.5, 40],
                [3.3, 2.1, -1.6, 100],
                [3.0, 3.2, -3.0, 170],
            ],
        },
        narrow: {
            gate: 3,
            yaw: 22, pitch: -4, roll: 0,
            pts: [
                [-4.4, -1.1, 0.0, 0],
                [-2.9, -0.6, 0.0, 0],
                [-1.45, -0.2, 0.0, 0],
                [0.0, 0.0, 0.0, 0],
                [1.45, 0.2, 0.0, 6],
                [2.8, 0.7, -0.5, 35],
                [3.7, 1.5, -1.5, 90],
                [3.7, 2.3, -2.8, 160],
            ],
        },
    };

    /* ---------- small maths helpers (matrices are column-major, like WebGL expects) ---------- */
    const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
    const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const norm = (a) => {
        const l = Math.hypot(a[0], a[1], a[2]) || 1;
        return [a[0] / l, a[1] / l, a[2] / l];
    };

    const ident = () => {
        const m = new Float32Array(16);
        m[0] = m[5] = m[10] = m[15] = 1;
        return m;
    };
    function mmul(a, b) {
        const o = new Float32Array(16);
        for (let c = 0; c < 4; c++) {
            for (let r = 0; r < 4; r++) {
                o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
            }
        }
        return o;
    }
    function translate(x, y, z) {
        const m = ident();
        m[12] = x; m[13] = y; m[14] = z;
        return m;
    }
    function rotX(a) {
        const m = ident(), c = Math.cos(a), s = Math.sin(a);
        m[5] = c; m[6] = s; m[9] = -s; m[10] = c;
        return m;
    }
    function rotY(a) {
        const m = ident(), c = Math.cos(a), s = Math.sin(a);
        m[0] = c; m[2] = -s; m[8] = s; m[10] = c;
        return m;
    }
    function rotZ(a) {
        const m = ident(), c = Math.cos(a), s = Math.sin(a);
        m[0] = c; m[1] = s; m[4] = -s; m[5] = c;
        return m;
    }
    function perspective(fovy, aspect, near, far) {
        const f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
        const m = new Float32Array(16);
        m[0] = f / aspect; m[5] = f; m[10] = (far + near) * nf; m[11] = -1; m[14] = 2 * far * near * nf;
        return m;
    }
    // Moves the whole picture on screen by (sx, sy) in clip space, vanishing point included
    function shiftMat(sx, sy) {
        const m = ident();
        m[12] = sx; m[13] = sy;
        return m;
    }
    function apply(m, p) {
        return [
            m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
            m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
            m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14],
            m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15],
        ];
    }

    /* ---------- the ribbon ---------- */
    function catmull(p0, p1, p2, p3, t) {
        const t2 = t * t, t3 = t2 * t;
        return p1.map((_, i) => 0.5 * (
            2 * p1[i] +
            (-p0[i] + p2[i]) * t +
            (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * t2 +
            (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * t3
        ));
    }

    function buildRibbon(def) {
        const pts = def.pts;
        const M = pts.length;
        const ghostA = pts[0].map((v, i) => 2 * v - pts[1][i]);
        const ghostB = pts[M - 1].map((v, i) => 2 * v - pts[M - 2][i]);
        const P = [ghostA].concat(pts, [ghostB]);

        // Dense samples of the spline, then re-sampled so frames have equal length along it
        const PER = 48;
        const dense = [];
        for (let j = 0; j < M - 1; j++) {
            for (let k = 0; k < PER; k++) dense.push({ v: catmull(P[j], P[j + 1], P[j + 2], P[j + 3], k / PER) });
        }
        dense.push({ v: pts[M - 1].slice() });
        let len = 0;
        dense[0].l = 0;
        for (let i = 1; i < dense.length; i++) {
            const a = dense[i - 1].v, b = dense[i].v;
            len += Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
            dense[i].l = len;
        }
        const gateL = dense[def.gate * PER].l;
        const sMin = -gateL;
        const sMax = len - gateL;
        const step = 1 / SEG;
        const count = Math.floor((sMax - sMin) / step) + 1;

        const C = new Array(count);
        const TW = new Array(count);
        let k = 0;
        for (let i = 0; i < count; i++) {
            const l = i * step;
            while (k < dense.length - 2 && dense[k + 1].l < l) k++;
            const a = dense[k], b = dense[k + 1];
            const f = (l - a.l) / ((b.l - a.l) || 1);
            const v = [0, 1, 2, 3].map((c) => a.v[c] + (b.v[c] - a.v[c]) * f);
            C[i] = [v[0], v[1], v[2]];
            TW[i] = v[3];
        }

        // Frames along the curve: tangent, then "across the film" carried along without spinning
        const T = C.map((c, i) => norm(sub(C[Math.min(i + 1, count - 1)], C[Math.max(i - 1, 0)])));
        const ig = clamp(Math.round(-sMin / step), 0, count - 1);
        const up = [0, 1, 0];
        const B = new Array(count);
        B[ig] = norm(sub(up, mul(T[ig], dot(up, T[ig]))));
        for (let i = ig + 1; i < count; i++) B[i] = norm(sub(B[i - 1], mul(T[i], dot(B[i - 1], T[i]))));
        for (let i = ig - 1; i >= 0; i--) B[i] = norm(sub(B[i + 1], mul(T[i], dot(B[i + 1], T[i]))));
        for (let i = 0; i < count; i++) {
            const a = TW[i] * Math.PI / 180;
            B[i] = norm(add(mul(B[i], Math.cos(a)), mul(cross(T[i], B[i]), Math.sin(a))));
        }
        const N = T.map((t, i) => norm(cross(t, B[i])));

        // Interleaved: position(3) normal(3) s,t(2). Two vertices per step: top edge, bottom edge.
        const verts = new Float32Array(count * 2 * 8);
        let o = 0;
        for (let i = 0; i < count; i++) {
            const s = sMin + i * step;
            [1, -1].forEach((t) => {
                const p = add(C[i], mul(B[i], t * RIBBON_W / 2));
                verts.set([p[0], p[1], p[2], N[i][0], N[i][1], N[i][2], s, t], o);
                o += 8;
            });
        }
        return { verts, vcount: count * 2, sMin, sMax, step, count, C, B };
    }

    // A point on the ribbon at s (frame lengths from the gate) and t (+1 top edge ... -1 bottom edge)
    function pointAt(rb, s, t) {
        const u = clamp((s - rb.sMin) / rb.step, 0, rb.count - 1.001);
        const i = Math.floor(u), f = u - i;
        const c = add(mul(rb.C[i], 1 - f), mul(rb.C[i + 1], f));
        const b = norm(add(mul(rb.B[i], 1 - f), mul(rb.B[i + 1], f)));
        return add(c, mul(b, t * RIBBON_W / 2));
    }

    /* ---------- the texture: every frame, side by side ---------- */
    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    function fitText(ctx, text, maxW) {
        if (ctx.measureText(text).width <= maxW) return text;
        let t = text;
        while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
        return t + '…';
    }

    function wrapLines(ctx, text, maxW) {
        const words = text.split(/\s+/);
        const lines = [];
        let line = '';
        words.forEach((w) => {
            const test = line ? line + ' ' + w : w;
            if (line && ctx.measureText(test).width > maxW) {
                lines.push(line);
                line = w;
            } else {
                line = test;
            }
        });
        if (line) lines.push(line);
        return lines;
    }

    function drawFrame(ctx, d, img, x0, k) {
        ctx.save();
        ctx.translate(x0, 0);
        ctx.scale(k, k);

        ctx.fillStyle = BASE;
        ctx.fillRect(0, 0, DW, DH);

        const px = 6, py = 34, pw = DW - 12, ph = DH - 68;
        ctx.fillStyle = CARD;
        ctx.fillRect(px, py, pw, ph);
        if (img && img.naturalWidth) {
            // cover, aligned to the top (like object-fit: cover; object-position: top)
            const s = Math.max(pw / img.naturalWidth, ph / img.naturalHeight);
            const sw = pw / s, sh = ph / s;
            ctx.drawImage(img, (img.naturalWidth - sw) / 2, 0, sw, sh, px, py, pw, ph);
        } else {
            ctx.fillStyle = YELLOW;
            ctx.font = '800 27px Archivo, sans-serif';
            if ('fontStretch' in ctx) ctx.fontStretch = 'extra-condensed';
            ctx.textBaseline = 'alphabetic';
            const lines = wrapLines(ctx, d.title, pw - 32);
            const lh = 27;
            let y = py + ph - 16 - (lines.length - 1) * lh;
            lines.forEach((line) => {
                ctx.fillText(line, px + 16, y);
                y += lh;
            });
        }
        if (d.pinned) {
            ctx.save();
            ctx.beginPath();
            ctx.rect(px, py, pw, ph);
            ctx.clip();
            ctx.strokeStyle = YELLOW;
            ctx.lineWidth = 6;
            ctx.strokeRect(px, py, pw, ph);
            ctx.restore();
        }

        // Edge print: title along the top, tech stack along the bottom
        ctx.fillStyle = YELLOW;
        ctx.font = '700 10px Archivo, sans-serif';
        if ('fontStretch' in ctx) ctx.fontStretch = 'condensed';
        if ('letterSpacing' in ctx) ctx.letterSpacing = '0.6px';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(fitText(ctx, d.title, DW - 16), 8, 30);
        ctx.fillText(fitText(ctx, d.tech, DW - 16), 8, 249);
        if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

        // Sprocket holes are cut out, so the page shows through them
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = '#000';
        const pitch = DW / 16;
        for (let j = 0; j < 16; j++) {
            const hx = j * pitch + (pitch - 10.5) / 2;
            roundRect(ctx, hx, 4, 10.5, 11, 2.2);
            ctx.fill();
            roundRect(ctx, hx, DH - 15, 10.5, 11, 2.2);
            ctx.fill();
        }
        ctx.restore();
    }

    function loadImage(src) {
        return new Promise((resolve) => {
            if (!src) return resolve(null);
            const img = new Image();
            const done = () => resolve(img.naturalWidth ? img : null);
            img.onload = done;
            img.onerror = () => resolve(null);
            img.src = src;
            setTimeout(done, 4500);
        });
    }

    /* ---------- shaders ---------- */
    const VERT = `#version 300 es
precision highp float;
in vec3 a_pos;
in vec3 a_nrm;
in vec2 a_st;
uniform mat4 u_view;
uniform mat4 u_proj;
out vec3 v_nrm;
out vec2 v_st;
out vec3 v_view;
void main() {
    vec4 vp = u_view * vec4(a_pos, 1.0);
    v_view = vp.xyz;
    v_nrm = mat3(u_view) * a_nrm;
    v_st = a_st;
    gl_Position = u_proj * vp;
}`;

    const FRAG = `#version 300 es
precision highp float;
uniform sampler2D u_atlas;
uniform float u_pos;
uniform float u_n;
uniform float u_flash;
uniform float u_focus;
uniform vec2 u_ends;
in vec3 v_nrm;
in vec2 v_st;
in vec3 v_view;
out vec4 outColor;
void main() {
    float fc = v_st.x + u_pos;
    float u = (fc + 0.5) / u_n;
    float v = 0.5 - v_st.y * 0.5;
    vec2 uv = vec2(u, v);
    vec4 tex = textureGrad(u_atlas, vec2(fract(u), v), dFdx(uv), dFdy(uv));

    float sC = floor(fc + 0.5) - u_pos;
    float ad = abs(sC);

    float a = tex.a;
    a *= clamp((u_n * 0.5 - ad) / 0.8, 0.0, 1.0);
    a *= smoothstep(u_ends.x, u_ends.x + 0.8, v_st.x) * (1.0 - smoothstep(u_ends.y - 0.8, u_ends.y, v_st.x));
    if (a < 0.02) discard;

    vec3 N = normalize(v_nrm);
    if (!gl_FrontFacing) N = -N;
    vec3 V = normalize(-v_view);
    vec3 L = normalize(vec3(-0.35, 0.55, 0.75));
    float diff = max(dot(N, L), 0.0);
    vec3 col = tex.rgb * (0.80 + 0.30 * diff);

    float lum = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
    float spec = pow(max(dot(reflect(-L, N), V), 0.0), 20.0);
    col += vec3(0.14, 0.16, 0.19) * spec * (1.0 - smoothstep(0.08, 0.35, lum));
    if (!gl_FrontFacing) col *= 0.55;

    col *= 1.0 - min(ad, 1.6) * 0.40;
    float inGate = 1.0 - step(0.5, ad);
    col *= 1.0 + u_flash * 0.8 * inGate;

    vec2 q = vec2(fract(fc + 0.5), v);
    float edge = min(min(q.x, 1.0 - q.x), min(q.y, 1.0 - q.y));
    if (u_focus > 0.5 && inGate > 0.5 && edge < 0.02) col = vec3(0.96, 0.77, 0.0);

    outColor = vec4(col * a, a);
}`;

    function compile(gl, type, src) {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
            const msg = gl.getShaderInfoLog(sh);
            gl.deleteShader(sh);
            throw new Error('shader: ' + msg);
        }
        return sh;
    }

    /* ---------- the renderer ---------- */
    function create(stage, data, env) {
        const canvas = document.createElement('canvas');
        canvas.className = 'film-canvas';
        canvas.setAttribute('aria-hidden', 'true');
        const gl = canvas.getContext('webgl2', { antialias: true, alpha: true, premultipliedAlpha: true, depth: true });
        if (!gl) return null;
        stage.insertBefore(canvas, stage.firstChild);

        const n = data.length;
        const atlas = document.createElement('canvas');
        let cw = 0, ch = 0;
        let prog = null, vao = null, vbo = null, tex = null, loc = {};
        let ribbons = {};
        let ready = false, lost = false;
        let view = null, persp = null, sx = 0, sy = 0, W = 0, H = 0, dpr = 1;
        let current = null;
        let flashAt = -1e9, focus = 0, last = { pos: 0, vel: 0, now: 0 };

        function layoutAtlas() {
            const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);
            cw = clamp(Math.floor(Math.min(704, maxTex / n)), 256, 704);
            ch = Math.round(cw * DH / DW);
            atlas.width = cw * n;
            atlas.height = ch;
        }

        function paintAtlas(imgs) {
            const ctx = atlas.getContext('2d');
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, atlas.width, atlas.height);
            const k = cw / DW;
            data.forEach((d, i) => drawFrame(ctx, d, imgs[i], i * cw, k));
        }

        function initGL() {
            prog = gl.createProgram();
            gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
            gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
            gl.bindAttribLocation(prog, 0, 'a_pos');
            gl.bindAttribLocation(prog, 1, 'a_nrm');
            gl.bindAttribLocation(prog, 2, 'a_st');
            gl.linkProgram(prog);
            if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error('link: ' + gl.getProgramInfoLog(prog));
            ['u_view', 'u_proj', 'u_atlas', 'u_pos', 'u_n', 'u_flash', 'u_focus', 'u_ends'].forEach((u) => {
                loc[u] = gl.getUniformLocation(prog, u);
            });

            tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
            if (aniso) {
                gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
            }

            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
            gl.disable(gl.CULL_FACE);
        }

        function uploadRibbon(rb) {
            if (!vao) vao = gl.createVertexArray();
            gl.bindVertexArray(vao);
            if (!vbo) vbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            gl.bufferData(gl.ARRAY_BUFFER, rb.verts, gl.STATIC_DRAW);
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 32, 0);
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 32, 12);
            gl.enableVertexAttribArray(2);
            gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 32, 24);
        }

        // Where the camera sits and where the gate lands on screen, for this size of hero
        function compose() {
            const horizontal = env.narrow.matches;
            const def = horizontal ? PATHS.narrow : PATHS.wide;
            if (!ribbons[horizontal ? 'narrow' : 'wide']) ribbons[horizontal ? 'narrow' : 'wide'] = buildRibbon(def);
            const rb = ribbons[horizontal ? 'narrow' : 'wide'];

            // On small screens the strip must fit the height of its box, perspective swell included
            const fw = horizontal
                ? Math.min(env.frame().offsetWidth, (H * 0.7) / RIBBON_W)
                : env.frame().offsetWidth;
            const fh = fw * RIBBON_W;
            let gx, gy;
            const gap = horizontal ? 0 : Math.round(fw * 0.09); // air between the film and the slate
            if (horizontal) {
                gx = W / 2;
                gy = H / 2;
            } else {
                const margin = Math.max(20, Math.round(W * 0.03));
                const slateH = env.panel ? env.panel.offsetHeight : 0;
                const lowest = H - 28 - slateH - gap - fh / 2;
                gx = W - fw * 1.45 - margin;
                gy = clamp(H * 0.36, fh / 2 + 10, Math.max(fh / 2 + 10, lowest));
            }

            const f = (H / 2) / Math.tan(FOV / 2);
            const D = f * Math.cos(def.yaw * Math.PI / 180) / fw;
            const rad = Math.PI / 180;
            let v = mmul(rotX(def.pitch * rad), rotY(def.yaw * rad));
            v = mmul(rotZ(def.roll * rad), v);
            view = mmul(translate(0, 0, -D), v);
            persp = perspective(FOV, W / H, 0.1, 80);
            sx = (gx / W) * 2 - 1;
            sy = 1 - (gy / H) * 2;
            current = { rb, def, fw, fh, gx, gy, gap, horizontal };
            return current;
        }

        function project(p) {
            const m = mmul(mmul(shiftMat(sx, sy), persp), view);
            const c = apply(m, p);
            return [(c[0] / c[3] * 0.5 + 0.5) * W, (1 - (c[1] / c[3] * 0.5 + 0.5)) * H, c[3]];
        }

        function measure() {
            if (!ready) return;
            W = stage.clientWidth;
            H = stage.clientHeight;
            dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = Math.max(1, Math.round(W * dpr));
            canvas.height = Math.max(1, Math.round(H * dpr));
            const cur = compose();

            if (env.hero) {
                if (cur.horizontal) {
                    ['--gate-right', '--gate-w', '--slate-top'].forEach((p) => env.hero.style.removeProperty(p));
                } else {
                    // The slate hangs under the frame in the gate, so measure where that frame lands
                    const xs = [], ys = [];
                    [[-0.5, 1], [0.5, 1], [0.5, -1], [-0.5, -1]].forEach((c) => {
                        const q = project(pointAt(cur.rb, c[0], c[1]));
                        xs.push(q[0]);
                        ys.push(q[1]);
                    });
                    const left = Math.min.apply(null, xs), right = Math.max.apply(null, xs);
                    env.hero.style.setProperty('--gate-right', Math.round(W - right) + 'px');
                    env.hero.style.setProperty('--gate-w', Math.round(right - left) + 'px');
                    env.hero.style.setProperty('--slate-top', Math.round(Math.max.apply(null, ys) + cur.gap) + 'px');
                }
            }
            if (!lost) uploadRibbon(cur.rb);
            render();
        }

        function render() {
            if (!ready || lost || !current) return;
            const now = last.now;
            const moving = Math.min(1, Math.abs(last.vel));
            const weave = env.reduce.matches ? 0 : Math.sin(now / 23) * moving * 1.6;
            const proj = mmul(mmul(shiftMat(sx, sy - (2 * weave) / H), persp), ident());

            gl.viewport(0, 0, canvas.width, canvas.height);
            gl.clearColor(0, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.useProgram(prog);
            gl.bindVertexArray(vao);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.uniform1i(loc.u_atlas, 0);
            gl.uniformMatrix4fv(loc.u_view, false, view);
            gl.uniformMatrix4fv(loc.u_proj, false, proj);
            gl.uniform1f(loc.u_pos, ((last.pos % n) + n) % n);
            gl.uniform1f(loc.u_n, n);
            gl.uniform1f(loc.u_flash, env.reduce.matches ? 0 : Math.max(0, 1 - (now - flashAt) / 380));
            gl.uniform1f(loc.u_focus, focus);
            gl.uniform2f(loc.u_ends, current.rb.sMin, current.rb.sMax);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, current.rb.vcount);
        }

        function draw(pos, vel, now) {
            last = { pos, vel, now };
            render();
        }

        // Which frame is under the pointer, or -1
        function pick(clientX, clientY) {
            if (!ready || !current) return -1;
            const r = canvas.getBoundingClientRect();
            const x = clientX - r.left, y = clientY - r.top;
            let best = -1, bestW = Infinity;
            for (let k = 0; k < n; k++) {
                let d = k - last.pos;
                d -= n * Math.round(d / n);
                if (Math.abs(d) > 5) continue;
                const q = [[-0.5, 1], [0.5, 1], [0.5, -1], [-0.5, -1]].map((c) => project(pointAt(current.rb, d + c[0], c[1])));
                if (q.some((p) => p[2] <= 0)) continue;
                let sign = 0, inside = true;
                for (let i = 0; i < 4 && inside; i++) {
                    const a = q[i], b = q[(i + 1) % 4];
                    const cr = (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]);
                    if (cr !== 0) {
                        if (sign === 0) sign = cr > 0 ? 1 : -1;
                        else if ((cr > 0 ? 1 : -1) !== sign) inside = false;
                    }
                }
                const w = project(pointAt(current.rb, d, 0))[2];
                if (inside && w < bestW) {
                    best = k;
                    bestW = w;
                }
            }
            return best;
        }

        // Screen pixels per frame length along the film at a point, so a drag can follow the strip
        function dragAxis(clientX, clientY) {
            if (!ready || !current) return [current && current.fw ? current.fw : 300, 0];
            let k = pick(clientX, clientY);
            if (k < 0) k = Math.round(last.pos);
            let d = k - last.pos;
            d -= n * Math.round(d / n);
            const a = project(pointAt(current.rb, d - 0.3, 0));
            const b = project(pointAt(current.rb, d + 0.3, 0));
            return [(b[0] - a[0]) / 0.6, (b[1] - a[1]) / 0.6];
        }

        function lose(e) {
            e.preventDefault();
            lost = true;
        }
        function restore() {
            lost = false;
            try {
                loc = {};
                vao = vbo = tex = prog = null;
                initGL();
                if (current) uploadRibbon(current.rb);
                render();
            } catch (err) {
                destroy();
                if (env.onLost) env.onLost();
            }
        }
        canvas.addEventListener('webglcontextlost', lose);
        canvas.addEventListener('webglcontextrestored', restore);

        function destroy() {
            canvas.removeEventListener('webglcontextlost', lose);
            canvas.removeEventListener('webglcontextrestored', restore);
            canvas.remove();
        }

        // Fonts and screenshots first, then the texture, then the first picture
        const fontsReady = (document.fonts && document.fonts.load)
            ? Promise.all([
                document.fonts.load('700 10px Archivo'),
                document.fonts.load('800 27px Archivo'),
            ]).catch(() => null)
            : Promise.resolve();
        const imagesReady = Promise.all(data.map((d) => loadImage(d.image)));
        const readyP = Promise.all([fontsReady, imagesReady]).then((res) => {
            layoutAtlas();
            paintAtlas(res[1]);
            initGL();
            ready = true;
            measure();
        });

        return {
            ready: readyP,
            measure,
            draw,
            pick,
            dragAxis,
            flash() { flashAt = performance.now(); },
            setFocus(on) { focus = on ? 1 : 0; render(); },
            destroy,
        };
    }

    global.FilmGL = { create };
})(window);
