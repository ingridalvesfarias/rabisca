/* Rabisca — quadro branco em JS puro (Canvas 2D)
   Ideia central: o desenho é uma lista de "elementos" (els).
   Toda mudança altera a lista e chama render(), que redesenha tudo. */
const $ = s => document.querySelector(s);
const cv = $('#canvas'), ctx = cv.getContext('2d');

let els = [];            // elementos desenhados
let undoS = [], redoS = []; // histórico (cópias JSON da lista)
let tool = 'select', cur = null, sel = null, drag = null, INK = '#000';
const st = { stroke: 'auto', fill: 'transparent', width: 2, sketchy: true };

const STROKES = ['auto', '#e03131', '#2f9e44', '#1971c2', '#f08c00', '#9c36b5'];
const FILLS = ['transparent', '#ffc9c9', '#b2f2bb', '#a5d8ff', '#ffec99', '#eebefa'];
const WIDTHS = [1, 2, 4];

/* ---------- Utilidades ---------- */
// Gerador pseudo-aleatório com semente: o "tremor" do traço fica fixo por elemento
const rng = s => () => {
  s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296;
};
const color = c => c === 'auto' ? INK : c;
const snap = () => { undoS.push(JSON.stringify(els)); redoS = []; };
const save = () => localStorage.setItem('rabisca', JSON.stringify(els));

/* ---------- Desenho ---------- */
// Linha poligonal com tremor (k = intensidade). Duas passadas = efeito de lápis
function wob(pts, r, k) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => {
    const X = x + (r() - .5) * k, Y = y + (r() - .5) * k;
    i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
  });
  ctx.stroke();
}
function stroke(pts, e, r) {
  const k = e.sk ? 2.2 : 0;
  for (let i = 0; i < (e.sk ? 2 : 1); i++) wob(pts, r, k);
}
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

function drawEl(e) {
  const r = rng(e.seed);
  ctx.strokeStyle = color(e.stroke); ctx.lineWidth = e.width;
  ctx.lineCap = ctx.lineJoin = 'round';
  const { x1, y1, x2, y2 } = e;
  if (e.type === 'rect' || e.type === 'diamond') {
    const P = e.type === 'rect'
      ? [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]
      : [[(x1 + x2) / 2, y1], [x2, (y1 + y2) / 2], [(x1 + x2) / 2, y2], [x1, (y1 + y2) / 2]];
    if (e.fill !== 'transparent') {
      ctx.fillStyle = e.fill; ctx.beginPath();
      P.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.fill();
    }
    P.forEach((p, i) => { const q = P[(i + 1) % 4]; stroke([p, mid(p, q), q], e, r); });
  } else if (e.type === 'ellipse') {
    const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2, rx = Math.abs(x2 - x1) / 2, ry = Math.abs(y2 - y1) / 2;
    if (e.fill !== 'transparent') {
      ctx.fillStyle = e.fill; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 7); ctx.fill();
    }
    const P = Array.from({ length: 41 }, (_, i) => [cx + rx * Math.cos(i / 40 * 6.4), cy + ry * Math.sin(i / 40 * 6.4)]);
    stroke(P, e, r);
  } else if (e.type === 'line' || e.type === 'arrow') {
    stroke([[x1, y1], mid([x1, y1], [x2, y2]), [x2, y2]], e, r);
    if (e.type === 'arrow') {
      const a = Math.atan2(y2 - y1, x2 - x1), h = 12 + e.width * 2;
      [2.6, -2.6].forEach(d => stroke([[x2, y2], [x2 + h * Math.cos(a + d), y2 + h * Math.sin(a + d)]], e, r));
    }
  } else if (e.type === 'pencil') {
    ctx.beginPath(); e.pts.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.stroke();
  } else if (e.type === 'text') {
    ctx.fillStyle = color(e.stroke); ctx.textBaseline = 'top';
    ctx.font = '24px "Segoe Print","Comic Sans MS",cursive';
    e.text.split('\n').forEach((l, i) => ctx.fillText(l, x1, y1 + i * 30));
  }
}

function render() {
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg');
  ctx.fillRect(0, 0, cv.width, cv.height);          // fundo (também sai no PNG)
  els.forEach(drawEl);
  if (sel) {                                         // caixa tracejada da seleção
    const b = bbox(sel); ctx.save(); ctx.setLineDash([6, 4]); ctx.lineWidth = 1;
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--accent');
    ctx.strokeRect(b.x - 6, b.y - 6, b.w + 12, b.h + 12); ctx.restore();
  }
}

/* ---------- Geometria e seleção ---------- */
function bbox(e) {
  if (e.type === 'pencil') {
    const xs = e.pts.map(p => p[0]), ys = e.pts.map(p => p[1]);
    return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  }
  if (e.type === 'text') {
    ctx.font = '24px "Segoe Print","Comic Sans MS",cursive';
    const ls = e.text.split('\n');
    return { x: e.x1, y: e.y1, w: Math.max(...ls.map(l => ctx.measureText(l).width)), h: ls.length * 30 };
  }
  return { x: Math.min(e.x1, e.x2), y: Math.min(e.y1, e.y2), w: Math.abs(e.x2 - e.x1), h: Math.abs(e.y2 - e.y1) };
}
function distSeg(px, py, ax, ay, bx, by) {              // distância ponto → segmento
  const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}
function hit(e, x, y) {
  if (e.type === 'line' || e.type === 'arrow') return distSeg(x, y, e.x1, e.y1, e.x2, e.y2) < 8;
  if (e.type === 'pencil') return e.pts.some(p => Math.hypot(p[0] - x, p[1] - y) < 8);
  const b = bbox(e), p = 6;
  const inside = x > b.x - p && x < b.x + b.w + p && y > b.y - p && y < b.y + b.h + p;
  if (e.fill === 'transparent' && (e.type === 'rect' || e.type === 'ellipse' || e.type === 'diamond'))
    return inside && !(x > b.x + 10 && x < b.x + b.w - 10 && y > b.y + 10 && y < b.y + b.h - 10); // só a borda
  return inside;
}
const pick = (x, y) => [...els].reverse().find(e => hit(e, x, y));
function move(e, dx, dy) {
  e.x1 += dx; e.x2 += dx; e.y1 += dy; e.y2 += dy;
  if (e.pts) e.pts = e.pts.map(p => [p[0] + dx, p[1] + dy]);
}

/* ---------- Eventos do mouse/toque ---------- */
const pos = ev => [ev.clientX, ev.clientY];
cv.addEventListener('pointerdown', ev => {
  const [x, y] = pos(ev); cv.setPointerCapture(ev.pointerId);
  if (tool === 'select') {
    sel = pick(x, y) || null;
    if (sel) { snap(); drag = [x, y]; }
  } else if (tool === 'eraser') {
    snap(); drag = true; erase(x, y);
  } else if (tool === 'text') {
    openText(x, y);
  } else {
    snap();
    cur = {
      type: tool, x1: x, y1: y, x2: x, y2: y, stroke: st.stroke, fill: st.fill,
      width: st.width, sk: st.sketchy, seed: Math.random() * 1e9 | 0
    };
    if (tool === 'pencil') cur.pts = [[x, y]];
    els.push(cur);
  }
  render();
});
cv.addEventListener('pointermove', ev => {
  const [x, y] = pos(ev);
  if (cur) { cur.x2 = x; cur.y2 = y; if (cur.pts) cur.pts.push([x, y]); }
  else if (drag && sel) { move(sel, x - drag[0], y - drag[1]); drag = [x, y]; }
  else if (drag === true) erase(x, y);
  render();
});
cv.addEventListener('pointerup', () => {
  if (cur) {
    const b = bbox(cur);
    if (cur.type !== 'pencil' && b.w < 3 && b.h < 3) { els.pop(); undoS.pop(); } // clique sem arrastar
    sel = null;
  }
  cur = null; drag = null; save(); render();
});
function erase(x, y) { const e = pick(x, y); if (e) els = els.filter(o => o !== e); }

/* ---------- Texto: um <textarea> flutuante vira elemento ao perder o foco ---------- */
function openText(x, y) {
  const t = document.createElement('textarea');
  t.className = 'txt'; t.style.left = x + 'px'; t.style.top = y + 'px'; t.rows = 1; t.cols = 14;
  document.body.append(t); setTimeout(() => t.focus());
  t.oninput = () => { t.rows = t.value.split('\n').length; };
  t.onblur = () => {
    if (t.value.trim()) {
      snap(); els.push({
        type: 'text', text: t.value, x1: x, y1: y, x2: x, y2: y,
        stroke: st.stroke, fill: 'transparent', width: 1, sk: false, seed: 1
      }); save();
    }
    t.remove(); render();
  };
}

/* ---------- Interface ---------- */
function setTool(t) {
  tool = t; sel = null;
  document.querySelectorAll('#tools button').forEach(b => b.classList.toggle('on', b.dataset.tool === t));
  cv.style.cursor = t === 'select' ? 'default' : t === 'text' ? 'text' : 'crosshair'; render();
}
document.querySelectorAll('#tools button').forEach(b => b.onclick = () => setTool(b.dataset.tool));

// Cria os botões de cor/espessura; se houver seleção, altera o elemento selecionado também
function swatches(box, list, key, label) {
  list.forEach(v => {
    const b = document.createElement('button');
    if (key === 'width') { b.textContent = v; b.title = 'Espessura ' + v; }
    else {
      b.style.background = v === 'auto' ? 'var(--ink)' : v === 'transparent' ? 'var(--ui)' : v;
      b.title = v === 'auto' ? 'Cor do tema' : v === 'transparent' ? 'Sem fundo' : v;
    }
    b.onclick = () => {
      st[key] = v; if (sel) { snap(); sel[key] = v; save(); }
      box.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b)); render();
    };
    if (st[key] === v) b.classList.add('on');
    box.append(b);
  });
}
swatches($('#strokes'), STROKES, 'stroke'); swatches($('#fills'), FILLS, 'fill'); swatches($('#widths'), WIDTHS, 'width');
$('#sketchy').onchange = e => { st.sketchy = e.target.checked; if (sel) { sel.sk = st.sketchy; save(); } render(); };

function undo() { if (!undoS.length) return; redoS.push(JSON.stringify(els)); els = JSON.parse(undoS.pop()); sel = null; save(); render(); }
function redo() { if (!redoS.length) return; undoS.push(JSON.stringify(els)); els = JSON.parse(redoS.pop()); sel = null; save(); render(); }
$('#undo').onclick = undo; $('#redo').onclick = redo;
$('#clear').onclick = () => { if (els.length && confirm('Limpar o quadro todo?')) { snap(); els = []; sel = null; save(); render(); } };
$('#export').onclick = () => {
  const a = document.createElement('a'); sel = null; render();
  a.download = 'rabisca.png'; a.href = cv.toDataURL('image/png'); a.click();
};

/* ---------- Tema claro/escuro (salvo no localStorage) ---------- */
function applyTheme(t) {
  document.documentElement.dataset.theme = t; localStorage.setItem('rabisca-tema', t);
  $('#theme').textContent = t === 'dark' ? '☀' : '☾';
  INK = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim(); render();
}
$('#theme').onclick = () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');

/* ---------- Atalhos ---------- */
const KEYS = { v: 'select', r: 'rect', o: 'ellipse', d: 'diamond', l: 'line', a: 'arrow', p: 'pencil', t: 'text', e: 'eraser' };
addEventListener('keydown', ev => {
  if (ev.target.tagName === 'TEXTAREA') return;
  const k = ev.key.toLowerCase();
  if ((ev.ctrlKey || ev.metaKey) && k === 'z') { ev.preventDefault(); ev.shiftKey ? redo() : undo(); }
  else if ((ev.ctrlKey || ev.metaKey) && k === 'y') { ev.preventDefault(); redo(); }
  else if ((k === 'delete' || k === 'backspace') && sel) { snap(); els = els.filter(e => e !== sel); sel = null; save(); render(); }
  else if (KEYS[k] && !ev.ctrlKey && !ev.metaKey) setTool(KEYS[k]);
});

/* ---------- Início ---------- */
function resize() {
  cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio;
  cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px'; render();
}
addEventListener('resize', resize);
try { els = JSON.parse(localStorage.getItem('rabisca')) || []; } catch { els = []; }
applyTheme(localStorage.getItem('rabisca-tema') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
setTool('select'); resize();
