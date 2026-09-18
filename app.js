/* DeskGains — app.js
   Part 1: state, plan builder, ROI engine, progression, reminders. */
(function () {
'use strict';

const D = window.DATA, MUS = D.MUSCLES, EX = D.EX, PLAN = D.PLAN, SITES = D.SITES, TAGS = D.TAGS, GROUPS = D.GROUPS;
const KEY = 'deskgains.v1';

/* ---------- helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const parse = s => { const p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2], 12, 0, 0); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const DOWL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const todayKey = () => ymd(new Date());
const fmt12 = t => { const p = t.split(':').map(Number); return (((p[0] + 11) % 12) + 1) + ':' + pad(p[1]) + (p[0] >= 12 ? ' PM' : ' AM'); };
const unitTxt = ex => ({ reps: 'reps', 'reps/side': 'reps per side', 'reps/leg': 'reps per leg', sec: 'sec' }[ex.unit] || ex.unit);
const isSecEx = ex => ex.unit.indexOf('sec') === 0;

/* ---------- state ---------- */
function defaults() {
  return {
    v: 1,
    settings: {
      days: [1, 2, 3, 4, 5],
      slotTimes: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
      fuel: [
        { id: 'f1', time: '10:30', label: 'Calorie shake', on: true, msg: 'Shake time. Aim for 500+ calories between meals.' },
        { id: 'f2', time: '14:30', label: 'Snack + water', on: true, msg: 'Snack time: sandwich, nuts or yogurt. Calories count toward the goal.' }
      ],
      notif: true, sound: true, unit: 'cm',
      startDate: ymd(new Date()), goalWeeks: 12, startWeight: 137, goalWeight: 155,
      roi: { sat: 1.6, P: {} }
    },
    log: {}, progress: {}, measures: [], weights: [], flags: {}
  };
}
function load() {
  const d = defaults();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const o = JSON.parse(raw);
      const r = Object.assign(d, o);
      const ds = defaults().settings;
      r.settings = Object.assign(ds, o.settings || {});
      r.settings.roi = Object.assign({ sat: 1.6, P: {} }, (o.settings || {}).roi || {});
      r.settings.roi.P = r.settings.roi.P || {};
      return r;
    }
  } catch (e) { /* fall through to defaults */ }
  return d;
}
let S = load();
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage full or blocked */ } }

const ui = { tab: 'today', viewKey: null, overlay: null, dismissed: new Set(), mapSel: null, autoView: true };

/* ---------- calendar ---------- */
function isWork(d) { return S.settings.days.indexOf(d.getDay()) >= 0 && !!PLAN[d.getDay()]; }
function nextWorkKey(from) { let d = new Date(from); for (let i = 0; i < 9; i++) { if (isWork(d)) return ymd(d); d = addDays(d, 1); } return ymd(from); }
function prevWorkKey(key) { let d = addDays(parse(key), -1); for (let i = 0; i < 9; i++) { if (isWork(d)) return ymd(d); d = addDays(d, -1); } return null; }
function stepWorkKey(key, dir) { let d = parse(key); for (let i = 0; i < 9; i++) { d = addDays(d, dir); if (isWork(d)) return ymd(d); } return key; }

/* ---------- log access ---------- */
const peek = (k, i) => ((S.log[k] || {}).slots || {})[i] || { status: 'pending' };
function wlog(k) { const d = S.log[k] || (S.log[k] = { slots: {}, fuel: {}, sore: [] }); d.slots = d.slots || {}; d.fuel = d.fuel || {}; d.sore = d.sore || []; return d; }
function wslot(k, i) { const d = wlog(k); return d.slots[i] || (d.slots[i] = { status: 'pending' }); }
function prog(id) { return S.progress[id] || { level: EX[id].start || 0, bump: 0, last: 0, streak: 0 }; }

/* ---------- sore / pain flags ---------- */
const FLAGS = [
  { id: 'chest', l: 'Chest' }, { id: 'shoulders', l: 'Shoulders' }, { id: 'neck', l: 'Neck' },
  { id: 'forearms', l: 'Forearms / wrists' }, { id: 'knees', l: 'Knees / legs' }, { id: 'other', l: 'General fatigue' }
];
function affects(ex, f) {
  switch (f) {
    case 'chest': return ex.tag === 'chest';
    case 'shoulders': return ex.tag === 'shoulder' || ex.tag === 'chest';
    case 'neck': return ex.tag === 'neck' || ex.id === 'chin_tuck';
    case 'forearms': return ex.tag === 'forearm' || ex.tag === 'wrist';
    case 'knees': return ex.tag === 'calves' || ex.tag === 'glutes' || ex.tag === 'hams';
    case 'other': return ex.hard;
    default: return false;
  }
}
function soreFor(key) {
  const a = (S.log[key] && S.log[key].sore) || [];
  const pk = prevWorkKey(key);
  const b = pk && S.log[pk] && S.log[pk].sore ? S.log[pk].sore : [];
  return Array.from(new Set(a.concat(b)));
}

/* ---------- plan for a date ---------- */
function planFor(key) {
  const wd = parse(key).getDay(), P = PLAN[wd];
  if (!P || S.settings.days.indexOf(wd) < 0) return null;
  const sore = soreFor(key);
  const slots = P.slots.map((id, i) => {
    const ex = EX[id], pr = prog(id);
    const lv = ex.levels ? Math.min(pr.level, ex.levels.length - 1) : 0;
    const name = ex.levels ? ex.levels[lv] : ex.name;
    const light = sore.some(f => affects(ex, f));
    const sets = light ? Math.max(1, ex.sets - 1) : ex.sets;
    const lo = ex.range[0] + pr.bump, hi = ex.range[1] + pr.bump, step = isSecEx(ex) ? 5 : 1;
    const target = pr.last ? Math.min(hi, Math.max(lo, pr.last + step)) : lo;
    return { i, id, ex, name, level: lv, sets, lo, hi, target, light, f: light ? 0.5 : 1, time: S.settings.slotTimes[i] || '09:00' };
  });
  return { key, wd, P, slots, sore };
}
function dueMs(key, i) {
  const st = peek(key, i);
  if (st.dueAt) return st.dueAt;
  const p = (S.settings.slotTimes[i] || '09:00').split(':').map(Number);
  const d = parse(key); d.setHours(p[0], p[1], 0, 0);
  return d.getTime();
}
function targetTxt(sl) { return isSecEx(sl.ex) ? sl.target + ' sec' : sl.target + '+ ' + unitTxt(sl.ex); }
function doseTxt(sl) {
  const ex = sl.ex;
  if (isSecEx(ex)) return sl.sets + ' × ' + (ex.holdReps ? ex.holdReps + ' holds × ' : '') + sl.target + ' sec';
  return sl.sets + ' × ' + sl.lo + '–' + sl.hi + ' ' + unitTxt(ex);
}

/* ---------- ROI model ----------
   Site sets = sets × stimulus × muscle weight (best muscle per site, so a lift is never double counted).
   Expected girth change = P × (1 − e^(−S/τ)), with τ set so that full adherence for the goal
   period earns (1 − e^(−sat)) of the ceiling P. Diminishing returns are built in. */
function exSites(ex, sets, f) {
  const out = {};
  const add = (mid, role) => {
    const m = MUS[mid]; if (!m || !m.site) return;
    const v = sets * ex.stim * (f == null ? 1 : f) * role * m.w;
    if (v > (out[m.site] || 0)) out[m.site] = v;
  };
  ex.pri.forEach(m => add(m, 1));
  (ex.sec || []).forEach(m => add(m, 0.35));
  return out;
}
const PLANNED = (() => {
  const t = {};
  Object.keys(PLAN).forEach(wd => PLAN[wd].slots.forEach(id => {
    const s = exSites(EX[id], EX[id].sets, 1);
    for (const k in s) t[k] = (t[k] || 0) + s[k];
  }));
  return t;
})();
function tau(site) { const w = PLANNED[site] || 0; return w > 0 ? (w * S.settings.goalWeeks) / S.settings.roi.sat : Infinity; }
function Pot(site) { const o = S.settings.roi.P[site]; return (o != null && !isNaN(o)) ? o : SITES[site].P; }
function expCM(site, sets) { const t = tau(site); return isFinite(t) ? Pot(site) * (1 - Math.exp(-sets / t)) : 0; }
function cumulative() {
  const cum = {}, series = [];
  Object.keys(S.log).sort().forEach(k => {
    const sl = (S.log[k] || {}).slots || {};
    Object.keys(sl).forEach(i => {
      const st = sl[i]; if (st.status !== 'done' || !EX[st.ex]) return;
      const s = exSites(EX[st.ex], st.sets || 0, st.f || 1);
      for (const site in s) cum[site] = (cum[site] || 0) + s[site];
    });
    series.push({ k, cum: Object.assign({}, cum) });
  });
  return { cum, series };
}
function siteDelta(site, cum, add) { return expCM(site, (cum[site] || 0) + add) - expCM(site, cum[site] || 0); }
function slotROI(sl, cum) {
  const s = exSites(sl.ex, sl.sets, sl.f);
  return Object.keys(s).map(site => ({ site, cm: siteDelta(site, cum, s[site]) })).filter(x => x.cm > 0).sort((a, b) => b.cm - a.cm);
}
function dayROI(plan, cum) {
  const add = {};
  plan.slots.forEach(sl => { const s = exSites(sl.ex, sl.sets, sl.f); for (const k in s) add[k] = (add[k] || 0) + s[k]; });
  return Object.keys(add).map(site => ({ site, cm: siteDelta(site, cum, add[site]) })).filter(x => x.cm > 0).sort((a, b) => b.cm - a.cm);
}
function len(cm, dec) { return S.settings.unit === 'in' ? (cm / 2.54).toFixed(dec + 1) + ' in' : cm.toFixed(dec) + ' cm'; }
const sgn = (cm, dec) => '+' + len(cm, dec);

/* ---------- muscle loads (charts) ---------- */
function exGroupLoad(ex, sets) {
  const out = {};
  const add = (m, role) => { const g = MUS[m] && MUS[m].g; if (!g) return; const v = sets * ex.stim * role; if (v > (out[g] || 0)) out[g] = v; };
  ex.pri.forEach(m => add(m, 1)); (ex.sec || []).forEach(m => add(m, 0.35));
  return out;
}
function muscleLoad(list) {
  const L = {};
  const g = m => L[m] || (L[m] = { v: 0, st: 0 });
  list.forEach(o => {
    o.ex.pri.forEach(m => { g(m).v += o.sets * o.ex.stim; });
    (o.ex.sec || []).forEach(m => { g(m).v += 0.35 * o.sets * o.ex.stim; });
    (o.ex.stretch || []).forEach(m => { g(m).st += 1; });
  });
  return L;
}

/* ---------- adherence & streaks ---------- */
function dayDone(key) {
  const p = planFor(key); if (!p) return { done: 0, total: 0 };
  let n = 0; p.slots.forEach(s => { if (peek(key, s.i).status === 'done') n++; });
  return { done: n, total: p.slots.length };
}
function streakInfo() {
  let streak = 0; const tk = todayKey();
  for (let n = 0; n < 200; n++) {
    const d = addDays(new Date(), -n); if (!isWork(d)) continue;
    const k = ymd(d), g = dayDone(k);
    if (k === tk && g.done < 6) continue;
    if (g.done >= 6) streak++; else break;
  }
  return { streak };
}
function adherence() {
  const start = parse(S.settings.startDate), tk = todayKey(); let done = 0, total = 0;
  for (let d = new Date(start); ymd(d) <= tk; d = addDays(d, 1)) {
    if (!isWork(d)) continue; const g = dayDone(ymd(d));
    if (ymd(d) === tk) {
      let t = 0; const tp = planFor(tk);
      tp.slots.forEach(sl => { if (peek(tk, sl.i).status === 'done' || dueMs(tk, sl.i) <= Date.now()) t++; });
      done += g.done; total += t; continue;
    }
    done += g.done; total += g.total;
  }
  return { done, total, pct: total ? Math.round(done / total * 100) : 0 };
}

/* ---------- actions on slots ---------- */
function applyProgress(ex, top) {
  const pr = S.progress[ex.id] || (S.progress[ex.id] = { level: ex.start || 0, bump: 0, last: 0, streak: 0 });
  pr.last = top;
  const hi = ex.range[1] + pr.bump;
  if (top >= hi) pr.streak++; else pr.streak = 0;
  if (pr.streak >= 2) {
    pr.streak = 0;
    if (ex.levels && pr.level < ex.levels.length - 1) { pr.level++; pr.last = 0; return 'LEVEL UP: ' + ex.levels[pr.level]; }
    pr.bump += isSecEx(ex) ? 5 : 2;
    return 'New target range: ' + (ex.range[0] + pr.bump) + '–' + (ex.range[1] + pr.bump);
  }
  return top >= hi ? 'Top of the range. Hit it once more to level up.' : null;
}
function commitDone(key, i, repsArr) {
  const plan = planFor(key); if (!plan) return null;
  const sl = plan.slots[i], ex = sl.ex, st = wslot(key, i);
  const prev = JSON.stringify(S.progress[ex.id] || null);
  let sets = sl.sets, best = null, reps = null;
  if (repsArr) {
    const clean = repsArr.map(Number).filter(v => v > 0);
    if (clean.length) { sets = clean.length; best = Math.max.apply(null, clean); reps = clean; }
  }
  st.status = 'done'; st.ex = ex.id; st.sets = sets; st.f = sl.f; st.reps = reps; st.at = Date.now(); st.prevProg = prev; st.name = sl.name;
  delete st.dueAt;
  const msg = best ? applyProgress(ex, best) : null;
  save();
  return { sets, best, msg, sl };
}
function undoSlot(key, i) {
  const st = wslot(key, i);
  if (st.ex && st.prevProg !== undefined) {
    if (st.prevProg === 'null') delete S.progress[st.ex]; else S.progress[st.ex] = JSON.parse(st.prevProg);
  }
  S.log[key].slots[i] = { status: 'pending', notified: true };
  save();
}
function skipSlot(key, i) { const st = wslot(key, i); st.status = 'skipped'; st.at = Date.now(); save(); }
function snoozeSlot(key, i, min) { const st = wslot(key, i); st.dueAt = Date.now() + min * 60000; st.notified = false; save(); }
function meetingSlot(key, i) { const st = wslot(key, i); st.dueAt = Math.max(Date.now(), dueMs(key, i)) + 30 * 60000; st.notified = false; save(); }

/* ---------- guided timer sequence ---------- */
function buildSequence(sl) {
  const ex = sl.ex, seq = [], sec = isSecEx(ex);
  const sides = /side|leg/.test(ex.unit) ? ['LEFT', 'RIGHT'] : [null];
  const rest = ex.rest || 60;
  if (!sec && !ex.tempo) return seq;
  for (let s = 1; s <= sl.sets; s++) {
    sides.forEach((side, si) => {
      const sub = 'Set ' + s + ' of ' + sl.sets + (side ? ' · ' + side.toLowerCase() : '');
      if (sec) {
        const n = ex.holdReps || 1;
        for (let h = 0; h < n; h++) {
          const lab = (ex.holdLabels && ex.holdLabels[h]) || ex.hw || 'HOLD';
          seq.push({ label: lab.toUpperCase(), sub, sec: sl.target, kind: 'work' });
          if (h < n - 1) seq.push({ label: 'SWITCH', sub, sec: 4, kind: 'rest' });
        }
      } else {
        const t = ex.tempo.split('-').map(Number), words = ['LOWER', 'PAUSE', 'DRIVE UP'];
        for (let r = 1; r <= sl.target; r++) t.forEach((sc, ti) => { if (sc > 0) seq.push({ label: words[ti], sub: sub + ' · rep ' + r + ' of ' + sl.target, sec: sc, kind: 'work' }); });
      }
      if (!(s === sl.sets && si === sides.length - 1)) seq.push({ label: 'REST', sub: 'Shake it out', sec: rest, kind: 'rest' });
    });
  }
  return seq;
}

/* ---------- sound ---------- */
let AC = null;
function beep(freq, dur) {
  if (!S.settings.sound) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = 'square'; o.frequency.value = freq; g.gain.value = 0.04;
    o.connect(g); g.connect(AC.destination); o.start(); o.stop(AC.currentTime + dur);
  } catch (e) { /* audio not available */ }
}
function chime() { [523, 659, 784, 1047].forEach((f, n) => setTimeout(() => beep(f, 0.12), n * 110)); }

/* ---------- notifications ---------- */
function setBadge(n) {
  try { if (n > 0 && navigator.setAppBadge) navigator.setAppBadge(n); else if (navigator.clearAppBadge) navigator.clearAppBadge(); } catch (e) { /* unsupported */ }
}
async function pushNotification(title, body, data) {
  if (!S.settings.notif || !('Notification' in window) || Notification.permission !== 'granted') return;
  const opts = { body, icon: 'icons/icon-192.png', badge: 'icons/badge.png', tag: data.tag, renotify: true, requireInteraction: true, data };
  const actions = [{ action: 'done', title: data.kind === 'fuel' ? 'Had it' : '✅ Done' }, { action: 'snooze', title: '⏰ Snooze 10' }];
  const max = Notification.maxActions || 0;
  if (max > 0 && data.kind !== 'fuel') opts.actions = actions.slice(0, max);
  else if (max > 0) opts.actions = actions.slice(0, 1);
  try {
    const reg = navigator.serviceWorker && await navigator.serviceWorker.getRegistration();
    if (reg) { await reg.showNotification(title, opts); return; }
  } catch (e) { /* fall back to page notification */ }
  try { delete opts.actions; const n = new Notification(title, opts); n.onclick = () => { window.focus(); n.close(); }; } catch (e) { /* blocked */ }
}
function fireSlot(k, sl) {
  const roi = slotROI(sl, cumulative().cum)[0];
  const title = '⚡ ' + fmt12(sl.time) + ' · ' + D.CALL[sl.ex.tag] + ': ' + sl.name;
  const body = doseTxt(sl) + ' · ' + sl.ex.cues[0] + (roi ? '\n' + sgn(roi.cm, 3) + ' ' + SITES[roi.site].n.toLowerCase() + ' banked when you finish' : '');
  pushNotification(title, body, { kind: 'slot', key: k, i: sl.i, tag: 'dg-' + k + '-' + sl.i });
  chime();
  if (!ui.overlay) openOverlay({ type: 'alert', key: k, i: sl.i });
}
function fireFuel(k, f) {
  pushNotification('🥤 ' + fmt12(f.time) + ' · ' + f.label, f.msg, { kind: 'fuel', key: k, id: f.id, tag: 'dg-fuel-' + k + '-' + f.id });
  chime();
}

/* ---------- scheduler ---------- */
function tick() {
  const now = Date.now(), d = new Date(), k = ymd(d);
  if (ui.autoView && ui.viewKey !== (isWork(d) ? k : nextWorkKey(d))) { ui.viewKey = isWork(d) ? k : nextWorkKey(d); if (ui.tab === 'today' && !ui.overlay) render(); }
  if (!isWork(d)) { setBadge(0); return; }
  const plan = planFor(k); let due = 0, fired = false;
  plan.slots.forEach(sl => {
    const st = peek(k, sl.i);
    if (st.status === 'done' || st.status === 'skipped') return;
    const at = dueMs(k, sl.i);
    if (at <= now) {
      due++;
      if (!st.notified) {
        wslot(k, sl.i).notified = true; save();
        if (now - at < 20 * 60000) { fireSlot(k, sl); fired = true; }
      }
    }
  });
  (S.settings.fuel || []).forEach(f => {
    if (!f.on) return;
    const fs = wlog(k).fuel[f.id]; if (fs && (fs.done || fs.notified)) return;
    const p = f.time.split(':').map(Number), at = new Date(); at.setHours(p[0], p[1], 0, 0);
    if (at.getTime() <= now) { wlog(k).fuel[f.id] = { notified: true }; save(); if (now - at.getTime() < 20 * 60000) { fireFuel(k, f); fired = true; } }
  });
  setBadge(due);
  if (fired && ui.tab === 'today' && !ui.overlay) render();
}

/* =====================================================================
   Part 2: views
   ===================================================================== */

/* ---------- toast + confetti ---------- */
let toastT = null;
function toast(msg) {
  const el = $('#toast'); if (!el) return;
  el.innerHTML = msg; el.className = 'show';
  clearTimeout(toastT); toastT = setTimeout(() => { el.className = ''; }, 4200);
}
function burst(x, y) {
  const em = ['🔥', '⚡', '💪', '✨'];
  for (let n = 0; n < 16; n++) {
    const s = document.createElement('span');
    s.className = 'conf'; s.textContent = em[n % em.length];
    s.style.left = x + 'px'; s.style.top = y + 'px';
    s.style.setProperty('--dx', (Math.random() * 420 - 210) + 'px');
    s.style.setProperty('--dy', (-Math.random() * 280 - 40) + 'px');
    s.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
    document.body.appendChild(s); setTimeout(() => s.remove(), 1000);
  }
}

/* ---------- shared bits ---------- */
const tagChip = ex => '<span class="chip tag" style="--c:' + TAGS[ex.tag].c + '">' + TAGS[ex.tag].l + '</span>';
function ring(done, total, size) {
  const r = size / 2 - 5, c = 2 * Math.PI * r, p = total ? done / total : 0;
  return '<svg class="ring" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '"><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" class="rb"/><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" class="rf" stroke-dasharray="' + (c * p).toFixed(1) + ' ' + c.toFixed(1) + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="central">' + done + '/' + total + '</text></svg>';
}
function ago(ms) { const m = Math.round(ms / 60000); return m < 60 ? m + ' min' : Math.floor(m / 60) + ' h ' + (m % 60) + ' min'; }

/* ---------- header ---------- */
function renderHeader() {
  const st = streakInfo(), perm = ('Notification' in window) ? Notification.permission : 'unsupported';
  const bell = perm === 'granted' ? '<span class="chip ok" title="Reminders fire while this app is running">🔔 Reminders on</span>'
    : perm === 'unsupported' ? '<span class="chip warn">Notifications unsupported</span>'
      : '<button class="btn hot small" data-act="perm">🔔 Turn on reminders</button>';
  const tabs = [['today', 'Today'], ['map', 'Muscle map'], ['roi', 'Expected ROI'], ['set', 'Settings']];
  return '<header class="top"><div class="brand"><div class="logo">⚡</div><div><b>DeskGains</b><small>Office pump · Mon–Fri · 9 to 4</small></div></div>' +
    '<nav class="tabs">' + tabs.map(t => '<button class="tab ' + (ui.tab === t[0] ? 'on' : '') + '" data-act="tab" data-v="' + t[0] + '">' + t[1] + '</button>').join('') + '</nav>' +
    '<div class="hud"><div class="chip streak" title="Consecutive workdays with 6 or more of 8 slots done">🔥 <b>' + st.streak + '</b> day streak</div>' + bell +
    '<button class="icon" data-act="sore" title="Sore or painful? Lighten the next sets">🩹</button><button class="icon" data-act="full" title="Full screen (F11)">⛶</button></div></header>';
}
function renderTicker() {
  const plan = ui.viewKey ? planFor(ui.viewKey) : null;
  const lines = (plan ? [plan.P.hype] : []).concat(D.HYPE);
  const txt = lines.join('   ⚡   ');
  return '<div class="ticker" aria-hidden="true"><span>' + esc(txt) + '   ⚡   ' + esc(txt) + '</span></div>';
}

/* ---------- today: slot card ---------- */
function renderSlot(sl, c) {
  const st = peek(c.key, sl.i), ex = sl.ex, t = TAGS[ex.tag], pr = prog(ex.id);
  const roi = slotROI(sl, c.cum).slice(0, 3).map(r => SITES[r.site].n.toLowerCase() + ' ' + sgn(r.cm, 3)).join(' · ');
  const pri = ex.pri.map(m => '<span class="m p" title="' + esc(MUS[m].does) + '">' + esc(MUS[m].n) + '</span>').join('');
  const sec = (ex.sec || []).filter(m => MUS[m].g !== 'Arms (assist)').slice(0, 3).map(m => '<span class="m s" title="' + esc(MUS[m].does) + '">' + esc(MUS[m].n) + '</span>').join('');
  const str = (ex.stretch || []).slice(0, 3).map(m => '<span class="m st" title="' + esc(MUS[m].does) + '">' + esc(MUS[m].n) + ' (stretch)</span>').join('');
  const due = dueMs(c.key, sl.i);
  const overdue = c.isToday && st.status === 'pending' && due < c.now - 5 * 60000;
  const snoozed = st.dueAt && st.status === 'pending' && due > c.now;
  const aim = !isSecEx(ex) && pr.last ? 'last ' + pr.last + ', aim for ' + sl.target + '+' : '';
  let status = '';
  if (st.status === 'done') status = '<div class="done-line">✓ Done' + (st.at ? ' at ' + new Date(st.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '') + ' · ' + st.sets + ' sets' + (st.reps ? ' · best ' + Math.max.apply(null, st.reps) : '') + '</div>';
  else if (st.status === 'skipped') status = '<div class="skip-line">Skipped</div>';
  else if (overdue) status = '<div class="late-line">Overdue by ' + ago(c.now - due) + '. Do it now or skip it.</div>';
  else if (snoozed) status = '<div class="snooze-line">Snoozed until ' + new Date(due).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) + '</div>';
  const dis = c.canAct ? '' : ' disabled';
  const acts = st.status === 'done'
    ? '<button class="btn ghost small" data-act="undo" data-k="' + c.key + '" data-i="' + sl.i + '"' + dis + '>Undo</button><button class="btn ghost small" data-act="timer" data-k="' + c.key + '" data-i="' + sl.i + '">⏱ Timer</button>'
    : '<button class="btn go" data-act="done" data-k="' + c.key + '" data-i="' + sl.i + '"' + dis + '>✓ Done</button>' +
      '<button class="btn ghost small" data-act="timer" data-k="' + c.key + '" data-i="' + sl.i + '" title="Guided timer">⏱ Timer</button>' +
      '<button class="btn ghost small" data-act="snooze" data-k="' + c.key + '" data-i="' + sl.i + '"' + dis + ' title="Remind me in 10 min">⏰ 10</button>' +
      '<button class="btn ghost small" data-act="meeting" data-k="' + c.key + '" data-i="' + sl.i + '"' + dis + ' title="In a meeting: push back 30 min">🗓 +30</button>' +
      '<button class="btn ghost small" data-act="skip" data-k="' + c.key + '" data-i="' + sl.i + '"' + dis + '>Skip</button>';
  return '<article class="slot ' + st.status + (c.activeI === sl.i ? ' active' : '') + (overdue ? ' overdue' : '') + '" style="--c:' + t.c + '">' +
    '<div class="slot-time"><b>' + fmt12(sl.time).replace(' ', '<i>') + '</i></b><span>' + (sl.i + 1) + ' of 8</span></div>' +
    '<div class="slot-body"><div class="slot-head">' + tagChip(ex) + (ex.hard ? '<span class="chip hard">Hard set</span>' : '') + (sl.light ? '<span class="chip light">Lightened</span>' : '') +
    (ex.tempo ? '<span class="chip">Tempo ' + ex.tempo + '</span>' : '') + '<span class="eq">' + esc(ex.eq) + '</span></div>' +
    '<h3>' + esc(sl.name) + '</h3>' +
    '<div class="dose"><b>' + doseTxt(sl) + '</b><span>' + esc(ex.rir) + (aim ? ' · ' + aim : '') + '</span></div>' +
    '<div class="mus">' + pri + sec + str + '</div>' +
    '<ul class="cues">' + ex.cues.map(q => '<li>' + esc(q) + '</li>').join('') + '</ul>' +
    '<div class="roi-line" title="Modeled girth change when you finish this slot">' + (roi ? 'Expected: ' + roi : 'Mobility slot: no girth change modeled') + '</div>' +
    status + '<div class="acts">' + acts + '</div></div></article>';
}

/* ---------- today: side panels ---------- */
function weekMonday(key) { const vd = parse(key); return addDays(vd, -((vd.getDay() + 6) % 7)); }
function groupTotals(keys) {
  const planned = {}, done = {};
  keys.forEach(k => {
    const p = planFor(k); if (!p) return;
    p.slots.forEach(sl => {
      const pl = exGroupLoad(sl.ex, sl.sets); for (const g in pl) planned[g] = (planned[g] || 0) + pl[g];
      const st = peek(k, sl.i);
      if (st.status === 'done' && EX[st.ex]) { const dl = exGroupLoad(EX[st.ex], st.sets || 0); for (const g in dl) done[g] = (done[g] || 0) + dl[g] * (st.f || 1); }
    });
  });
  return { planned, done };
}
function groupBars(t) {
  const shown = GROUPS.filter(g => g !== 'Arms (assist)' && (t.planned[g] || 0) > 0);
  const max = Math.max.apply(null, shown.map(g => t.planned[g]).concat([0.01]));
  return shown.map(g => {
    const pl = t.planned[g], dn = t.done[g] || 0;
    return '<div class="gb"><span class="gl">' + g + '</span><div class="gbar"><i class="pl" style="width:' + (pl / max * 100).toFixed(1) + '%"></i><i class="dn" style="width:' + (Math.min(dn, pl) / max * 100).toFixed(1) + '%"></i></div><span class="gv">' + dn.toFixed(1) + ' / ' + pl.toFixed(1) + '</span></div>';
  }).join('');
}
function renderWeek(key) {
  const mon = weekMonday(key), tk = todayKey(), keys = [];
  let rows = '';
  for (let n = 0; n < 7; n++) {
    const d = addDays(mon, n), k = ymd(d); if (!isWork(d)) continue; keys.push(k);
    const p = planFor(k), g = dayDone(k);
    const dots = p.slots.map(sl => '<i class="dot ' + peek(k, sl.i).status + '" style="--c:' + TAGS[sl.ex.tag].c + '" title="' + esc(fmt12(sl.time) + ' ' + sl.name) + '"></i>').join('');
    rows += '<button class="wk ' + (k === key ? 'sel' : '') + (k === tk ? ' today' : '') + '" data-act="goto" data-k="' + k + '"><b>' + DOW[d.getDay()] + '</b><span class="wt">' + p.P.theme + '</span><span class="kind ' + p.P.kind.toLowerCase() + '">' + (p.P.kind === 'HARD' ? 'Hard' : 'Light') + '</span><span class="dots">' + dots + '</span><span class="wp">' + g.done + '/' + g.total + '</span></button>';
  }
  return '<section class="panel week"><h2>This week</h2>' + rows + '<h4>Weekly muscle load (sets done / planned)</h4><div class="gbars">' + groupBars(groupTotals(keys)) + '</div></section>';
}
function renderMuscleToday(key) {
  return '<section class="panel mtoday"><h2>Muscles worked ' + (key === todayKey() ? 'today' : 'this day') + '</h2><div class="gbars">' + groupBars(groupTotals([key])) + '</div><p class="tiny">Bright bar = sets done. Dim bar = planned. Stimulus-weighted sets, so isometrics count less than hard push-ups.</p></section>';
}
function renderMonth(key) {
  const vd = parse(key), y = vd.getFullYear(), m = vd.getMonth(), n = new Date(y, m + 1, 0).getDate(), tk = todayKey();
  let cells = '', off = new Date(y, m, 1, 12).getDay(), done = 0, total = 0, green = 0, work = 0;
  for (let i = 0; i < off; i++) cells += '<i class="mc blank"></i>';
  for (let dn = 1; dn <= n; dn++) {
    const d = new Date(y, m, dn, 12), k = ymd(d);
    if (!isWork(d)) { cells += '<i class="mc off"></i>'; continue; }
    const g = dayDone(k); work++;
    if (k <= tk) { done += g.done; total += g.total; if (g.done >= 6) green++; }
    cells += '<i class="mc ' + (k === tk ? 'today' : '') + '" style="--p:' + (g.total ? g.done / g.total : 0).toFixed(2) + '" data-act="goto" data-k="' + k + '" title="' + k + ': ' + g.done + '/' + g.total + '"></i>';
  }
  return '<section class="panel month"><h2>' + MONTHS[m] + '</h2><div class="mrow"><div class="mgrid">' + cells + '</div><p class="tiny"><b>' + done + '</b> of ' + total + ' slots done<br><b>' + green + '</b> strong days (6+ of 8)<br>Darker green = more slots done</p></div></section>';
}

/* ---------- today ---------- */
function renderToday() {
  const key = ui.viewKey, plan = planFor(key), tk = todayKey();
  if (!plan) return '<section class="panel"><h2>No workout days are switched on</h2><p>Turn a weekday on in Settings.</p></section>';
  const P = plan.P, d = parse(key), isToday = key === tk, future = key > tk, cum = cumulative().cum, now = Date.now();
  const g = dayDone(key), first = plan.slots.find(s => peek(key, s.i).status === 'pending');
  const activeI = isToday && first ? first.i : -1;
  const cards = plan.slots.map(sl => renderSlot(sl, { key, cum, isToday, canAct: !future, activeI, now })).join('');
  const droi = dayROI(plan, cum).slice(0, 5).map(r => SITES[r.site].n.toLowerCase() + ' ' + sgn(r.cm, 3)).join(' · ');
  const fuel = (S.settings.fuel || []).filter(f => f.on).map(f => {
    const fs = (S.log[key] && S.log[key].fuel && S.log[key].fuel[f.id]) || {};
    return '<button class="fuel ' + (fs.done ? 'on' : '') + '" data-act="fuel" data-k="' + key + '" data-id="' + f.id + '"' + (future ? ' disabled' : '') + '>' + (fs.done ? '✓' : '🥤') + ' ' + fmt12(f.time) + ' · ' + esc(f.label) + '</button>';
  }).join('');
  const soreBar = plan.sore.length ? '<div class="alertbar">Recovery mode for ' + plan.sore.map(f => FLAGS.find(x => x.id === f).l.toLowerCase()).join(', ') + '. Affected slots are lightened: one fewer set, stop 3–4 reps short of failure. Sharp pain is different from soreness, so skip it if that is what you feel.</div>' : '';
  return '<section class="today panel" data-keep>' +
    '<div class="dayhead"><div class="dh-l"><div class="dh-date">' + DOWL[d.getDay()] + ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate() + (isToday ? '<span class="live">Today</span>' : future ? '<span class="live prev">Preview</span>' : '') + '</div>' +
    '<h1 class="theme">' + P.theme + '</h1><div class="dh-meta"><span class="kind ' + P.kind.toLowerCase() + '">' + (P.kind === 'HARD' ? 'Hard day' : 'Light day') + '</span><span>' + esc(P.twist) + '</span></div>' +
    '<div class="dh-rec">' + esc(P.recovery) + '</div></div>' +
    '<div class="dh-r">' + ring(g.done, g.total, 84) + '<div class="nav"><button class="icon" data-act="day" data-v="-1" title="Previous workday">‹</button><button class="btn ghost small" data-act="goto" data-k="' + (isWork(new Date()) ? tk : nextWorkKey(new Date())) + '">Today</button><button class="icon" data-act="day" data-v="1" title="Next workday">›</button></div></div></div>' +
    soreBar + (fuel ? '<div class="fuelbar"><span>Fuel</span>' + fuel + '</div>' : '') +
    '<div class="dayroi">If you finish every slot: <b>' + (droi || 'nothing modeled') + '</b></div>' +
    '<div class="slots">' + cards + '</div></section>' +
    '<aside class="side">' + renderWeek(key) + renderMuscleToday(key) + renderMonth(key) + '</aside>';
}

/* ---------- muscle map ---------- */
const BASE = '<g class="bodybase"><circle cx="100" cy="28" r="19"/><rect x="90" y="44" width="20" height="24" rx="8"/><path d="M64 72Q100 60 136 72L144 100L134 140L128 200L72 200L66 140L56 100Z"/>' +
  '<rect x="26" y="78" width="26" height="150" rx="13" transform="rotate(4 39 78)"/><rect x="148" y="78" width="26" height="150" rx="13" transform="rotate(-4 161 78)"/>' +
  '<rect x="70" y="196" width="29" height="104" rx="14"/><rect x="101" y="196" width="29" height="104" rx="14"/><rect x="72" y="298" width="24" height="108" rx="11"/><rect x="104" y="298" width="24" height="108" rx="11"/></g>';
const ABS = [120, 136, 152, 168].map(y => '<rect x="89" y="' + y + '" width="10" height="13" rx="3"/><rect x="101" y="' + y + '" width="10" height="13" rx="3"/>').join('');
/* [muscle id, mirrored?, svg fragment] */
const FRONT = [
  ['neck_flex', 0, '<path d="M91 47h18l3 19H88z"/>'],
  ['neck_lat', 1, '<ellipse cx="85" cy="57" rx="4" ry="10"/>'],
  ['traps_upper', 1, '<path d="M87 66L64 76l12 8 16-12z"/>'],
  ['delt_front', 1, '<ellipse cx="56" cy="91" rx="12" ry="15"/>'],
  ['delt_side', 1, '<ellipse cx="44" cy="99" rx="7" ry="14"/>'],
  ['pec_upper', 1, '<path d="M95 78Q78 74 67 87Q80 97 95 92z"/>'],
  ['pec_lower', 1, '<path d="M95 94Q80 99 67 90Q64 108 80 115Q93 115 95 105z"/>'],
  ['serratus', 1, '<ellipse cx="68" cy="130" rx="5" ry="12"/>'],
  ['obliques', 1, '<path d="M75 122L87 120V184L79 178L72 150z"/>'],
  ['abs', 0, ABS],
  ['fore_flex', 1, '<ellipse cx="38" cy="194" rx="8" ry="26"/>'],
  ['brachio', 1, '<ellipse cx="29" cy="186" rx="5" ry="20"/>'],
  ['wrist_stab', 1, '<ellipse cx="35" cy="216" rx="6" ry="5"/>'],
  ['grip', 1, '<ellipse cx="33" cy="232" rx="8" ry="7"/>'],
  ['tib', 1, '<ellipse cx="83" cy="346" rx="7" ry="28"/>']
];
const BACK = [
  ['neck_ext', 0, '<path d="M91 47h18l3 19H88z"/>'],
  ['traps_upper', 0, '<polygon points="88,64 112,64 140,82 100,108 60,82"/>'],
  ['traps_mid', 0, '<polygon points="100,110 136,88 128,128 100,152 72,128 64,88"/>'],
  ['delt_rear', 1, '<ellipse cx="55" cy="92" rx="12" ry="14"/>'],
  ['delt_side', 1, '<ellipse cx="43" cy="99" rx="7" ry="13"/>'],
  ['rot_cuff', 1, '<ellipse cx="77" cy="102" rx="11" ry="8"/>'],
  ['triceps', 1, '<ellipse cx="46" cy="136" rx="9" ry="24"/>'],
  ['fore_ext', 1, '<ellipse cx="38" cy="194" rx="8" ry="26"/>'],
  ['wrist_stab', 1, '<ellipse cx="35" cy="216" rx="6" ry="5"/>'],
  ['erectors', 0, '<rect x="91" y="152" width="18" height="40" rx="6"/>'],
  ['glute_med', 1, '<ellipse cx="76" cy="200" rx="10" ry="8"/>'],
  ['glute_max', 1, '<ellipse cx="86" cy="222" rx="16" ry="16"/>'],
  ['hams', 1, '<ellipse cx="83" cy="266" rx="13" ry="36"/>'],
  ['gastroc', 1, '<ellipse cx="82" cy="336" rx="11" ry="22"/>'],
  ['soleus', 1, '<ellipse cx="82" cy="374" rx="8" ry="14"/>']
];
function heatCol(v, max, st) {
  if (v <= 0 && st > 0) return '#1f7aa5';
  if (v <= 0) return '#262a48';
  const t = Math.min(1, v / max);
  return 'hsl(' + (14 + 40 * t).toFixed(0) + ' 100% ' + (34 + 26 * t).toFixed(0) + '%)';
}
function bodySvg(shapes, load, max, label) {
  const g = shapes.map(s => {
    const L = load[s[0]] || { v: 0, st: 0 };
    const frag = s[1] ? s[2] + '<g transform="translate(200 0) scale(-1 1)">' + s[2] + '</g>' : s[2];
    return '<g class="mu" style="fill:' + heatCol(L.v, max, L.st) + '"><title>' + esc(MUS[s[0]].n + (L.v ? ': ' + L.v.toFixed(1) + ' set-points' : L.st ? ': stretched' : ': not trained')) + '</title>' + frag + '</g>';
  }).join('');
  return '<figure><svg viewBox="0 0 200 420" role="img" aria-label="' + label + ' view of the body with worked muscles highlighted">' + BASE + g + '</svg><figcaption>' + label + '</figcaption></figure>';
}
function mapList(sel) {
  const mk = id => ({ ex: EX[id], sets: EX[id].sets });
  if (sel === 'week') { const l = []; Object.keys(PLAN).forEach(wd => PLAN[wd].slots.forEach(id => l.push(mk(id)))); return l; }
  return PLAN[+sel.slice(1)].slots.map(mk);
}
function renderMap() {
  if (!ui.mapSel) { const wd = parse(ui.viewKey).getDay(); ui.mapSel = PLAN[wd] ? 'w' + wd : 'w1'; }
  const sel = ui.mapSel, list = mapList(sel), load = muscleLoad(list);
  const max = Math.max.apply(null, Object.keys(load).map(k => load[k].v).concat([0.5]));
  const btns = Object.keys(PLAN).map(wd => '<button class="tab ' + (sel === 'w' + wd ? 'on' : '') + '" data-act="mapsel" data-v="w' + wd + '">' + DOW[wd] + ' <small>' + PLAN[wd].theme.split(' ')[0].toLowerCase() + '</small></button>').join('') +
    '<button class="tab ' + (sel === 'week' ? 'on' : '') + '" data-act="mapsel" data-v="week">Whole week</button>';
  /* matrix */
  let cols, colHead;
  if (sel === 'week') { cols = Object.keys(PLAN).map(wd => ({ label: DOW[wd], list: mapList('w' + wd) })); }
  else { cols = PLAN[+sel.slice(1)].slots.map((id, i) => ({ label: fmt12(S.settings.slotTimes[i] || '09:00').replace(':00', ''), list: [{ ex: EX[id], sets: EX[id].sets }], name: EX[id].name })); }
  colHead = cols.map(c => '<th title="' + esc(c.name || '') + '">' + c.label + '</th>').join('');
  let rows = '';
  GROUPS.forEach(gr => {
    const ms = Object.keys(MUS).filter(m => MUS[m].g === gr && ((load[m] && (load[m].v > 0 || load[m].st > 0))));
    if (!ms.length) return;
    rows += '<tr class="grp"><td colspan="' + (cols.length + 2) + '">' + gr + '</td></tr>';
    ms.forEach(m => {
      const cells = cols.map(c => {
        const L = muscleLoad(c.list)[m];
        if (!L || (L.v <= 0 && L.st <= 0)) return '<td></td>';
        if (sel === 'week') return '<td class="cell" style="background:' + heatCol(L.v, 3.2, L.st) + '">' + (L.v ? L.v.toFixed(1) : '~') + '</td>';
        const ex = c.list[0].ex, role = ex.pri.indexOf(m) >= 0 ? 'p' : (ex.sec || []).indexOf(m) >= 0 ? 's' : 't';
        return '<td class="cell r-' + role + '" title="' + esc(ex.name) + '">' + (role === 'p' ? '●' : role === 's' ? '○' : '~') + '</td>';
      }).join('');
      rows += '<tr><th class="mn" title="' + esc(MUS[m].does) + '">' + esc(MUS[m].n) + '<small>' + esc(MUS[m].does) + '</small></th>' + cells + '<td class="tot">' + load[m].v.toFixed(1) + '</td></tr>';
    });
  });
  const title = sel === 'week' ? 'Whole week' : DOWL[+sel.slice(1)] + ': ' + PLAN[+sel.slice(1)].theme;
  return '<section class="mapwrap" data-keep><div class="maphead"><h1>Muscle map</h1><div class="tabs sub">' + btns + '</div></div>' +
    '<div class="mapgrid"><div class="panel bodies"><h2>' + esc(title) + '</h2><div class="figs">' + bodySvg(FRONT, load, max, 'Front') + bodySvg(BACK, load, max, 'Back') + '</div>' +
    '<div class="legend"><span><i style="background:hsl(14 100% 34%)"></i>Light work</span><span><i style="background:hsl(54 100% 60%)"></i>Heavy work</span><span><i style="background:#1f7aa5"></i>Stretched</span><span><i style="background:#262a48"></i>Not trained</span></div>' +
    '<p class="tiny">Stylized diagram. Deep core and hip flexors sit under the surface, so they only appear in the table. Hover any shape for its name.</p></div>' +
    '<div class="panel matrix"><h2>Muscle-by-muscle detail</h2><p class="tiny">' + (sel === 'week' ? 'Numbers are stimulus-weighted set-points per day. ~ marks a stretch.' : '● primary muscle · ○ assisting muscle · ~ stretched. Hover a column for the exercise name. Set-points on the right are the day total.') + '</p><div class="mxs"><table class="mx"><thead><tr><th></th>' + colHead + '<th>Total</th></tr></thead><tbody>' + rows + '</tbody></table></div></div></div></section>';
}

/* ---------- expected ROI ---------- */
function countWork(from, to) { let n = 0; for (let d = new Date(from); ymd(d) <= ymd(to); d = addDays(d, 1)) if (isWork(d)) n++; return n; }
function cumAt(series, k) { let c = {}; series.forEach(s => { if (s.k <= k) c = s.cum; }); return c; }
function roiChart(series, cum) {
  const W = 820, H = 280, x0 = 44, x1 = W - 14, y0 = H - 30, y1 = 14;
  const start = parse(S.settings.startDate), total = Math.max(7, S.settings.goalWeeks * 7), now = new Date();
  const xOf = d => x0 + (x1 - x0) * Math.min(1, Math.max(0, (d - start) / 864e5 / total));
  const yOf = pct => y0 - (y0 - y1) * Math.min(100, Math.max(0, pct)) / 100;
  let g = '';
  [0, 25, 50, 75, 100].forEach(p => { g += '<line x1="' + x0 + '" x2="' + x1 + '" y1="' + yOf(p) + '" y2="' + yOf(p) + '" class="gl"/><text x="' + (x0 - 6) + '" y="' + (yOf(p) + 4) + '" text-anchor="end">' + p + '%</text>'; });
  for (let w = 0; w <= S.settings.goalWeeks; w += 2) g += '<text x="' + xOf(addDays(start, w * 7)) + '" y="' + (H - 8) + '" text-anchor="middle">wk ' + w + '</text>';
  const elapsedWork = Math.max(1, countWork(start, now)), remainWork = Math.max(0, countWork(addDays(now, 1), addDays(start, total)));
  Object.keys(SITES).forEach(site => {
    const P = Pot(site); if (!P) return;
    const pct = sets => expCM(site, sets) / P * 100;
    let pts = [[xOf(start), yOf(0)]];
    series.forEach(s => pts.push([xOf(parse(s.k)), yOf(pct(s.cum[site] || 0))]));
    const nowY = yOf(pct(cum[site] || 0));
    pts.push([xOf(now), nowY]);
    const proj = (cum[site] || 0) + (cum[site] || 0) / elapsedWork * remainWork;
    g += '<polyline class="ln" style="stroke:' + SITES[site].c + '" points="' + pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ') + '"/>';
    if (elapsedWork >= 3) g += '<line class="pj" style="stroke:' + SITES[site].c + '" x1="' + xOf(now).toFixed(1) + '" y1="' + nowY.toFixed(1) + '" x2="' + xOf(addDays(start, total)).toFixed(1) + '" y2="' + yOf(pct(proj)).toFixed(1) + '"/>';
  });
  g += '<line x1="' + xOf(now) + '" x2="' + xOf(now) + '" y1="' + y1 + '" y2="' + y0 + '" class="nowl"/>';
  return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Expected gain per body site as percent of the 12-week ceiling">' + g + '</svg>';
}
function renderROI() {
  const cu = cumulative(), cum = cu.cum, adh = adherence(), start = parse(S.settings.startDate);
  const dayN = Math.max(1, Math.round((Date.now() - start) / 864e5) + 1), totalDays = S.settings.goalWeeks * 7;
  const elapsedWork = Math.max(1, countWork(start, new Date())), remainWork = Math.max(0, countWork(addDays(new Date(), 1), addDays(start, totalDays)));
  const cards = Object.keys(SITES).map(site => {
    const s = SITES[site], sets = cum[site] || 0, e = expCM(site, sets), P = Pot(site), pct = P ? e / P * 100 : 0;
    const proj = expCM(site, sets + sets / elapsedWork * remainWork);
    const projTxt = elapsedWork >= 3 ? 'At this pace by week ' + S.settings.goalWeeks + ': ' + sgn(proj, 2) : 'Pace projection appears after 3 workdays';
    return '<div class="site" style="--c:' + s.c + '"><b>' + esc(s.n) + '</b><div class="big">' + sgn(e, 3) + '</div><div class="bar"><i style="width:' + Math.min(100, pct).toFixed(1) + '%"></i></div><small>' + pct.toFixed(1) + '% of the ' + len(P, 1) + ' ceiling · ' + sets.toFixed(1) + ' credited sets</small><small>' + projTxt + '</small><small class="dim">' + esc(s.note) + '</small></div>';
  }).join('');
  /* measured vs expected */
  const ms = {}; S.measures.slice().sort((a, b) => a.date < b.date ? -1 : 1).forEach(m => { (ms[m.site] = ms[m.site] || []).push(m); });
  const trows = Object.keys(ms).map(site => {
    const a = ms[site][0], b = ms[site][ms[site].length - 1];
    if (ms[site].length < 2) return '<tr><td>' + esc(SITES[site].n) + '</td><td colspan="4">Baseline logged (' + len(a.cm, 1) + '). Log a second measurement to compare.</td></tr>';
    const ea = cumAt(cu.series, a.date)[site] || 0, eb = cumAt(cu.series, b.date)[site] || 0, exp = expCM(site, eb) - expCM(site, ea), act = b.cm - a.cm;
    return '<tr><td>' + esc(SITES[site].n) + '</td><td>' + a.date + ' → ' + b.date + '</td><td>' + sgn(exp, 2) + '</td><td>' + (act >= 0 ? '+' : '−') + len(Math.abs(act), 2) + '</td><td>' + ((act - exp) >= 0 ? '+' : '−') + len(Math.abs(act - exp), 2) + '</td></tr>';
  }).join('');
  const mlist = S.measures.slice().sort((a, b) => a.date < b.date ? 1 : -1).slice(0, 8).map(m => '<li>' + m.date + ' · ' + esc(SITES[m.site].n) + ' · ' + len(m.cm, 1) + ' <button class="x" data-act="delmeasure" data-id="' + m.id + '" title="Delete">✕</button></li>').join('');
  /* weight */
  const ws = S.weights.slice().sort((a, b) => a.date < b.date ? -1 : 1), cur = ws.length ? ws[ws.length - 1].lb : S.settings.startWeight;
  const gain = cur - S.settings.startWeight, goal = S.settings.goalWeight - S.settings.startWeight, wpct = goal ? Math.max(0, Math.min(100, gain / goal * 100)) : 0;
  const perWk = goal / Math.max(1, S.settings.goalWeeks), goalDate = addDays(start, totalDays);
  const wlist = ws.slice().reverse().slice(0, 8).map(w => '<li>' + w.date + ' · ' + w.lb + ' lb <button class="x" data-act="delweight" data-id="' + w.id + '" title="Delete">✕</button></li>').join('');
  const opts = Object.keys(SITES).map(s => '<option value="' + s + '">' + esc(SITES[s].n) + '</option>').join('');
  return '<section class="roi" data-keep><div class="maphead"><h1>Expected ROI</h1><p class="lead">What the model says your finished sets have earned so far. Day ' + dayN + ' of ' + totalDays + ' · adherence <b>' + adh.pct + '%</b> (' + adh.done + ' of ' + adh.total + ' slots) · only checked-off sets count.</p></div>' +
    '<div class="sitegrid">' + cards + '</div>' +
    '<div class="panel"><h2>Progress toward each ceiling</h2><p class="tiny">Each line is the share of that site’s 12-week ceiling earned. Dashed lines project your pace to the goal date once you have 3 workdays logged. Curves flatten because early sets earn more than late ones.</p>' + roiChart(cu.series, cum) +
    '<div class="legend big">' + Object.keys(SITES).map(s => '<span><i style="background:' + SITES[s].c + '"></i>' + esc(SITES[s].n) + '</span>').join('') + '</div></div>' +
    '<div class="two"><div class="panel"><h2>Measured vs expected</h2><table class="mt"><thead><tr><th>Site</th><th>Window</th><th>Expected</th><th>Measured</th><th>Gap</th></tr></thead><tbody>' + (trows || '<tr><td colspan="5">Log tape measurements below to compare them with the model.</td></tr>') + '</tbody></table>' +
    '<p class="tiny">Tape numbers include fat and water. While you eat in a surplus, waist and hips will read higher than the muscle-only model. Compare shoulders, chest, neck and forearm first.</p>' +
    '<div class="form"><select id="m-site">' + opts + '</select><input id="m-val" type="number" step="0.1" placeholder="' + (S.settings.unit === 'in' ? 'inches' : 'cm') + '"><input id="m-date" type="date" value="' + todayKey() + '"><button class="btn go small" data-act="addmeasure">Log measurement</button></div><ul class="lst">' + mlist + '</ul></div>' +
    '<div class="panel"><h2>Body weight</h2><div class="wt-big"><b>' + cur + ' lb</b><span>goal ' + S.settings.goalWeight + ' lb by ' + goalDate.toLocaleDateString([], { month: 'short', day: 'numeric' }) + '</span></div><div class="bar wbar"><i style="width:' + wpct.toFixed(1) + '%"></i></div>' +
    '<p class="tiny">' + (gain >= 0 ? '+' : '') + gain.toFixed(1) + ' lb so far. The goal needs about ' + perWk.toFixed(1) + ' lb per week. New muscle is limited to roughly 0.25–0.5 lb per week for a beginner, so most of a gain this fast will be fat, water and glycogen. That is normal for a bulk, but it is why the waist number climbs.</p>' +
    '<div class="form"><input id="w-val" type="number" step="0.1" placeholder="lb"><input id="w-date" type="date" value="' + todayKey() + '"><button class="btn go small" data-act="addweight">Log weight</button></div><ul class="lst">' + wlist + '</ul></div></div>' +
    '<div class="panel note"><h2>How the model works</h2><p class="tiny">Every set you check off earns credit for the body sites its muscles feed, scaled by how hard the exercise is and by whether the muscle is the main mover or a helper. Expected change = ceiling × (1 − e<sup>−credit/τ</sup>). τ is set so that finishing every planned set for ' + S.settings.goalWeeks + ' weeks earns ' + Math.round((1 - Math.exp(-S.settings.roi.sat)) * 100) + '% of the ceiling. The ceilings are conservative beginner estimates, not measurements, and you can edit them in Settings once your tape says otherwise. Wrists barely change in size, since it is mostly bone.</p></div></section>';
}

/* ---------- settings ---------- */
function getPath(o, p) { return p.split('.').reduce((a, k) => (a == null ? a : a[k]), o); }
function setPath(o, p, v) { const ks = p.split('.'), last = ks.pop(); const t = ks.reduce((a, k) => (a[k] == null ? (a[k] = {}) : a[k]), o); t[last] = v; }
const inp = (path, type, extra) => '<input type="' + type + '" data-set="' + path + '" value="' + esc(getPath(S, path)) + '" ' + (extra || '') + '>';
const chk = (path, label) => '<label class="sw"><input type="checkbox" data-set="' + path + '" ' + (getPath(S, path) ? 'checked' : '') + '> ' + label + '</label>';
function renderSettings() {
  const perm = ('Notification' in window) ? Notification.permission : 'unsupported';
  const days = [1, 2, 3, 4, 5].map(d => '<label class="sw"><input type="checkbox" data-day="' + d + '" ' + (S.settings.days.indexOf(d) >= 0 ? 'checked' : '') + '> ' + DOW[d] + '</label>').join('');
  const times = S.settings.slotTimes.map((t, i) => '<label class="tm">Slot ' + (i + 1) + inp('settings.slotTimes.' + i, 'time') + '</label>').join('');
  const fuel = S.settings.fuel.map((f, i) => '<div class="fuelrow">' + chk('settings.fuel.' + i + '.on', '') + inp('settings.fuel.' + i + '.time', 'time') + inp('settings.fuel.' + i + '.label', 'text') + '</div>').join('');
  const pots = Object.keys(SITES).map(s => '<label class="tm">' + esc(SITES[s].n) + ' ceiling (cm)<input type="number" step="0.1" min="0" data-set="settings.roi.P.' + s + '" value="' + (S.settings.roi.P[s] != null ? esc(S.settings.roi.P[s]) : '') + '" placeholder="' + SITES[s].P + '"></label>').join('');
  return '<section class="settings" data-keep><div class="maphead"><h1>Settings</h1></div><div class="setgrid">' +
    '<div class="panel"><h2>Reminders</h2><p class="tiny">Status: <b>' + perm + '</b>. Reminders fire while this app is open (minimized is fine). Keep it running all day; see the README for launch-at-sign-in.</p>' +
    (perm !== 'granted' && perm !== 'unsupported' ? '<button class="btn hot" data-act="perm">🔔 Turn on reminders</button> ' : '') +
    '<button class="btn ghost" data-act="testnotif">Send a test reminder</button>' + chk('settings.notif', 'Show desktop notifications') + chk('settings.sound', 'Play sounds (chime and timer beeps)') + '</div>' +
    '<div class="panel"><h2>Schedule</h2><div class="row">' + days + '</div><div class="times">' + times + '</div><p class="tiny">Noon is set as a light mobility slot. Times apply to every workday.</p></div>' +
    '<div class="panel"><h2>Fuel reminders</h2><p class="tiny">Non-workout nudges for the weight goal.</p>' + fuel + '</div>' +
    '<div class="panel"><h2>Units & goals</h2><label class="tm">Show measurements in<select data-set="settings.unit"><option value="cm" ' + (S.settings.unit === 'cm' ? 'selected' : '') + '>Centimeters</option><option value="in" ' + (S.settings.unit === 'in' ? 'selected' : '') + '>Inches</option></select></label>' +
    '<div class="times"><label class="tm">Program start' + inp('settings.startDate', 'date') + '</label><label class="tm">Goal (weeks)' + inp('settings.goalWeeks', 'number', 'min="4" max="52"') + '</label><label class="tm">Start weight (lb)' + inp('settings.startWeight', 'number', 'step="0.1"') + '</label><label class="tm">Goal weight (lb)' + inp('settings.goalWeight', 'number', 'step="0.1"') + '</label></div></div>' +
    '<div class="panel wide"><h2>ROI model assumptions</h2><p class="tiny">Ceiling = the most this program is modeled to add at that body site over the goal period, at full adherence. Leave blank for the default shown. Raise or lower these once your tape measurements show what your body does.</p><div class="times">' + pots +
    '<label class="tm">Saturation<input type="number" step="0.1" min="0.5" max="4" data-set="settings.roi.sat" value="' + S.settings.roi.sat + '"></label></div></div>' +
    '<div class="panel wide"><h2>Backup</h2><p class="tiny">Your data lives in this browser. Export a copy now and then; clearing site data erases it.</p><button class="btn go" data-act="exportdata">Export backup</button> <label class="btn ghost filebtn">Import backup<input type="file" id="imp" accept="application/json" hidden></label> <button class="btn ghost danger" data-act="resetdata">Erase everything</button></div>' +
    '</div></section>';
}

/* ---------- render root ---------- */
function render() {
  const app = $('#app'); if (!app) return;
  const keep = $$('[data-keep]', app).map(e => e.scrollTop), ay = $('.main', app) ? $('.main', app).scrollTop : 0;
  const body = ui.tab === 'today' ? renderToday() : ui.tab === 'map' ? renderMap() : ui.tab === 'roi' ? renderROI() : renderSettings();
  app.innerHTML = renderHeader() + renderTicker() + '<main class="main tab-' + ui.tab + '">' + body + '</main>';
  $$('[data-keep]', app).forEach((e, n) => { if (keep[n]) e.scrollTop = keep[n]; });
  void ay;
}

/* ---------- overlays ---------- */
function openOverlay(o) { ui.overlay = o; renderOverlay(); }
function closeOverlay() { tmStop(); ui.overlay = null; renderOverlay(); }
function alertHTML(o) {
  const plan = planFor(o.key), sl = plan.slots[o.i], ex = sl.ex, t = TAGS[ex.tag];
  const roi = slotROI(sl, cumulative().cum).slice(0, 3).map(r => SITES[r.site].n.toLowerCase() + ' ' + sgn(r.cm, 3)).join(' · ');
  const a = ' data-k="' + o.key + '" data-i="' + o.i + '"';
  return '<div class="ov alert" style="--c:' + t.c + '" role="dialog" aria-modal="true" aria-label="Workout reminder"><div class="ov-card"><button class="x close" data-act="close" title="Dismiss">✕</button>' +
    '<div class="a-time">' + fmt12(sl.time) + '</div><div class="a-call">' + D.CALL[ex.tag] + '</div><h2>' + esc(sl.name) + '</h2>' +
    '<div class="a-dose">' + doseTxt(sl) + '<span>' + esc(ex.rir) + '</span></div><ul class="cues big">' + ex.cues.map(q => '<li>' + esc(q) + '</li>').join('') + '</ul>' +
    '<div class="roi-line">' + (roi ? 'Bank it: ' + roi : 'Mobility slot') + '</div>' +
    '<div class="ov-acts"><button class="btn go big" data-act="done"' + a + '>✓ Done</button><button class="btn ghost" data-act="timer"' + a + '>⏱ Timer</button><button class="btn ghost" data-act="snooze"' + a + '>⏰ 10 min</button><button class="btn ghost" data-act="meeting"' + a + '>🗓 In a meeting (+30)</button><button class="btn ghost" data-act="skip"' + a + '>Skip</button></div></div></div>';
}
function logHTML(o) {
  const plan = planFor(o.key), sl = plan.slots[o.i], sec = isSecEx(sl.ex);
  const rows = []; for (let n = 1; n <= sl.sets; n++) rows.push('<label class="repin">Set ' + n + '<input type="number" min="0" data-rep value="' + sl.target + '"><small>' + (sec ? 'sec' : unitTxt(sl.ex)) + '</small></label>');
  return '<div class="ov" role="dialog" aria-modal="true" aria-label="Log your sets"><div class="ov-card small"><button class="x close" data-act="close">✕</button><h2>' + esc(sl.name) + '</h2>' +
    '<p class="tiny">Log what you actually did. Clear a box for a set you skipped. Your best set drives the next target.</p><div class="reps">' + rows.join('') + '</div>' +
    '<div class="ov-acts"><button class="btn go big" data-act="logsave" data-k="' + o.key + '" data-i="' + o.i + '">Log it</button><button class="btn ghost" data-act="logquick" data-k="' + o.key + '" data-i="' + o.i + '">I hit the target</button></div></div></div>';
}
function soreHTML() {
  const cur = wlog(todayKey()).sore;
  return '<div class="ov" role="dialog" aria-modal="true" aria-label="Sore or pain flag"><div class="ov-card small"><button class="x close" data-act="close">✕</button><h2>What feels sore today?</h2>' +
    '<p class="tiny">Flagged areas get one fewer set and a lighter effort today and on the next workday. Sharp or joint pain is different from muscle soreness. Skip the exercise and get it checked if it does not settle.</p>' +
    '<div class="flags">' + FLAGS.map(f => '<label class="sw"><input type="checkbox" data-flag="' + f.id + '" ' + (cur.indexOf(f.id) >= 0 ? 'checked' : '') + '> ' + f.l + '</label>').join('') + '</div>' +
    '<div class="ov-acts"><button class="btn go" data-act="soresave">Save</button><button class="btn ghost" data-act="close">Cancel</button></div></div></div>';
}
const tm = { seq: [], idx: 0, left: 0, running: false, id: null, last: 0, lastS: -1, finished: false, sl: null };
function timerHTML() {
  const sl = tm.sl, has = tm.seq.length > 0;
  return '<div class="ov timer" role="dialog" aria-modal="true" aria-label="Guided timer"><div class="ov-card" style="--c:' + TAGS[sl.ex.tag].c + '"><button class="x close" data-act="close">✕</button><h2>' + esc(sl.name) + '</h2>' +
    '<div class="tm-phase" id="tm-label"></div><div class="tm-time" id="tm-time"></div><div class="tm-sub" id="tm-sub"></div><div class="tm-bar"><i id="tm-bar"></i></div>' +
    '<div class="ov-acts"><button class="btn go big" id="tm-toggle" data-act="tm-toggle">Start</button><button class="btn ghost" data-act="tm-next">Skip step</button><button class="btn ghost" data-act="tm-reset">Restart</button></div>' +
    '<div class="tm-rest"><span>Quick rest</span>' + [30, 45, 60, 90].map(s => '<button class="btn ghost small" data-act="tm-rest" data-v="' + s + '">' + s + ' s</button>').join('') + '</div>' +
    '<p class="tiny">' + (has ? 'Guided: the timer counts each lowering, pause and drive phase, or each hold and rest, and beeps between them.' : 'This one is counted in reps. Do your set, then start a quick rest.') + '</p></div></div>';
}
function tmStop() { tm.running = false; if (tm.id) { clearInterval(tm.id); tm.id = null; } }
function paintTimer() {
  const L = $('#tm-label'); if (!L) return;
  const cur = tm.seq[tm.idx], card = $('.timer .ov-card');
  if (tm.finished) { L.textContent = 'DONE'; $('#tm-time').textContent = '✓'; $('#tm-sub').textContent = 'Nice. Now check it off.'; $('#tm-bar').style.width = '100%'; }
  else if (!cur) { L.textContent = 'READY'; $('#tm-time').textContent = '--'; $('#tm-sub').textContent = 'Pick a rest time below'; $('#tm-bar').style.width = '0%'; }
  else { L.textContent = cur.label; $('#tm-time').textContent = Math.max(0, Math.ceil(tm.left / 1000)); $('#tm-sub').textContent = cur.sub; $('#tm-bar').style.width = (100 - tm.left / (cur.sec * 1000) * 100).toFixed(1) + '%'; if (card) card.classList.toggle('rest', cur.kind === 'rest'); }
  const b = $('#tm-toggle'); if (b) b.textContent = tm.running ? 'Pause' : (tm.idx > 0 && !tm.finished ? 'Resume' : 'Start');
}
function tmSet(seq) { tmStop(); tm.seq = seq; tm.idx = 0; tm.finished = false; tm.left = seq[0] ? seq[0].sec * 1000 : 0; tm.lastS = -1; }
function tmStart() {
  if (tm.running || !tm.seq.length) return;
  if (tm.finished) tmSet(tm.seq);
  tm.running = true; tm.last = performance.now(); tm.id = setInterval(tmStep, 100); beep(880, 0.1); paintTimer();
}
function tmAdvance() {
  tm.idx++;
  if (tm.idx >= tm.seq.length) { tmStop(); tm.finished = true; chime(); return; }
  tm.left = tm.seq[tm.idx].sec * 1000; tm.lastS = -1; beep(tm.seq[tm.idx].kind === 'rest' ? 440 : 880, 0.15);
}
function tmStep() {
  const n = performance.now(); tm.left -= n - tm.last; tm.last = n;
  const s = Math.ceil(tm.left / 1000);
  if (s !== tm.lastS) { tm.lastS = s; if (s <= 3 && s > 0) beep(660, 0.06); }
  if (tm.left <= 0) tmAdvance();
  paintTimer();
}
function openTimer(key, i) {
  const sl = planFor(key).slots[i];
  tm.sl = sl; tmSet(buildSequence(sl));
  ui.overlay = { type: 'timer', key, i }; renderOverlay();
}
function renderOverlay() {
  const el = $('#overlay'); if (!el) return; const o = ui.overlay;
  if (!o) { el.className = ''; el.innerHTML = ''; return; }
  el.className = 'on';
  el.innerHTML = o.type === 'alert' ? alertHTML(o) : o.type === 'log' ? logHTML(o) : o.type === 'sore' ? soreHTML() : timerHTML();
  if (o.type === 'timer') paintTimer();
  const f = $('#overlay .btn.go, #overlay input'); if (f && o.type !== 'timer') { try { f.focus(); } catch (e) { /* ignore */ } }
}

/* ---------- finish / notification actions ---------- */
function finishDone(key, i, reps, ev) {
  const before = cumulative().cum, pl = planFor(key); if (!pl) return;
  const sl = pl.slots[i], r = commitDone(key, i, reps);
  if (ui.overlay) { tmStop(); ui.overlay = null; renderOverlay(); }
  if (!r) return;
  const roi = slotROI({ ex: sl.ex, sets: r.sets, f: sl.f }, before).slice(0, 2).map(x => SITES[x.site].n.toLowerCase() + ' ' + sgn(x.cm, 3)).join(', ');
  toast('⚡ <b>Banked:</b> ' + (roi || 'mobility work') + (r.msg ? '<br><b>' + esc(r.msg) + '</b>' : ''));
  if (ev && ev.clientX != null) burst(ev.clientX, ev.clientY);
  beep(784, 0.1); setTimeout(() => beep(1047, 0.16), 110);
  render();
}
function handleNotif(m) {
  if (!m) return;
  if (m.kind === 'fuel') { if (m.action === 'done') { wlog(m.key).fuel[m.id] = { notified: true, done: true }; save(); } render(); return; }
  const i = +m.i, st = peek(m.key, i);
  if (st.status === 'done' || st.status === 'skipped') { render(); return; }
  if (m.action === 'done') { finishDone(m.key, i, null, null); return; }
  if (m.action === 'snooze') { snoozeSlot(m.key, i, 10); toast('Snoozed for 10 minutes'); render(); return; }
  ui.tab = 'today'; ui.viewKey = m.key; render(); openOverlay({ type: 'alert', key: m.key, i });
}
function maybeAlert() {
  if (ui.overlay) return; const d = new Date(), k = ymd(d); if (!isWork(d)) return;
  const pl = planFor(k), now = Date.now();
  const sl = pl.slots.find(s => peek(k, s.i).status === 'pending' && dueMs(k, s.i) <= now && now - dueMs(k, s.i) < 90 * 60000 && !ui.dismissed.has(k + s.i));
  if (sl) openOverlay({ type: 'alert', key: k, i: sl.i });
}

/* ---------- events ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]'); if (!t || t.disabled) return;
  const a = t.dataset.act, k = t.dataset.k, i = t.dataset.i != null ? +t.dataset.i : null;
  switch (a) {
    case 'tab': ui.tab = t.dataset.v; render(); break;
    case 'day': ui.autoView = false; ui.viewKey = stepWorkKey(ui.viewKey, +t.dataset.v); render(); break;
    case 'goto': ui.autoView = (k === todayKey()); ui.viewKey = k; ui.tab = 'today'; render(); break;
    case 'mapsel': ui.mapSel = t.dataset.v; render(); break;
    case 'done': openOverlay({ type: 'log', key: k, i }); break;
    case 'logsave': { const reps = $$('#overlay input[data-rep]').map(x => x.value); finishDone(k, i, reps, e); break; }
    case 'logquick': finishDone(k, i, null, e); break;
    case 'undo': undoSlot(k, i); render(); break;
    case 'skip': skipSlot(k, i); if (ui.overlay) closeOverlay(); render(); break;
    case 'snooze': snoozeSlot(k, i, 10); if (ui.overlay) closeOverlay(); toast('Snoozed. Back in 10 minutes.'); render(); break;
    case 'meeting': meetingSlot(k, i); if (ui.overlay) closeOverlay(); toast('Pushed back 30 minutes.'); render(); break;
    case 'timer': openTimer(k, i); break;
    case 'close': if (ui.overlay && ui.overlay.type === 'alert') ui.dismissed.add(ui.overlay.key + ui.overlay.i); closeOverlay(); break;
    case 'tm-toggle': if (tm.running) { tmStop(); paintTimer(); } else tmStart(); break;
    case 'tm-next': if (tm.seq.length) { tmAdvance(); paintTimer(); } break;
    case 'tm-reset': tmSet(tm.seq); paintTimer(); break;
    case 'tm-rest': tmSet([{ label: 'REST', sub: 'Breathe and shake it out', sec: +t.dataset.v, kind: 'rest' }]); paintTimer(); tmStart(); break;
    case 'sore': openOverlay({ type: 'sore' }); break;
    case 'soresave': { wlog(todayKey()).sore = $$('#overlay input[data-flag]').filter(x => x.checked).map(x => x.dataset.flag); save(); closeOverlay(); toast(wlog(todayKey()).sore.length ? 'Noted. Affected sets get lighter.' : 'Flags cleared.'); render(); break; }
    case 'fuel': { const fs = wlog(k).fuel[t.dataset.id] || {}; wlog(k).fuel[t.dataset.id] = { notified: true, done: !fs.done }; save(); render(); break; }
    case 'perm': if ('Notification' in window) Notification.requestPermission().then(p => { render(); toast(p === 'granted' ? 'Reminders are on.' : 'Reminders blocked. Allow notifications for this site in Edge settings.'); }); break;
    case 'testnotif': pushNotification('⚡ Test: pike push-ups', '3 × 8–15 reps · Hips high, head between your hands', { kind: 'slot', key: todayKey(), i: 0, tag: 'dg-test' }); chime(); toast('Test sent. If nothing appears, check Windows Focus Assist and Edge notification settings.'); break;
    case 'full': if (document.fullscreenElement) document.exitFullscreen(); else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {}); break;
    case 'addmeasure': { const v = parseFloat($('#m-val').value); if (isNaN(v) || v <= 0) { toast('Enter a measurement first.'); break; } S.measures.push({ id: Date.now(), date: $('#m-date').value || todayKey(), site: $('#m-site').value, cm: S.settings.unit === 'in' ? v * 2.54 : v }); save(); render(); break; }
    case 'delmeasure': S.measures = S.measures.filter(m => String(m.id) !== t.dataset.id); save(); render(); break;
    case 'addweight': { const v = parseFloat($('#w-val').value); if (isNaN(v) || v <= 0) { toast('Enter your weight first.'); break; } S.weights.push({ id: Date.now(), date: $('#w-date').value || todayKey(), lb: v }); save(); render(); break; }
    case 'delweight': S.weights = S.weights.filter(w => String(w.id) !== t.dataset.id); save(); render(); break;
    case 'exportdata': { const b = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' }), u = URL.createObjectURL(b), l = document.createElement('a'); l.href = u; l.download = 'deskgains-backup-' + todayKey() + '.json'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 1000); break; }
    case 'resetdata': if (confirm('Erase all DeskGains data in this browser? Export a backup first if you want one.')) { S = defaults(); save(); ui.viewKey = isWork(new Date()) ? todayKey() : nextWorkKey(new Date()); render(); } break;
  }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'imp' && t.files && t.files[0]) {
    const fr = new FileReader();
    fr.onload = () => { try { const o = JSON.parse(fr.result); if (!o.settings || !o.log) throw new Error('bad file'); localStorage.setItem(KEY, JSON.stringify(o)); S = load(); render(); toast('Backup imported.'); } catch (err) { toast('That file is not a DeskGains backup.'); } };
    fr.readAsText(t.files[0]); return;
  }
  if (t.dataset.day) {
    const d = +t.dataset.day, ix = S.settings.days.indexOf(d);
    if (t.checked && ix < 0) S.settings.days.push(d); else if (!t.checked && ix >= 0) S.settings.days.splice(ix, 1);
    save(); render(); return;
  }
  if (t.dataset.set) {
    let v = t.type === 'checkbox' ? t.checked : t.value;
    if (t.type === 'number') v = parseFloat(v);
    if (/roi\.P\./.test(t.dataset.set) && (v === '' || isNaN(v))) { const ks = t.dataset.set.split('.'); delete S.settings.roi.P[ks[ks.length - 1]]; }
    else if (t.type === 'number' && isNaN(v)) return;
    else setPath(S, t.dataset.set, v);
    save(); render();
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && ui.overlay) { if (ui.overlay.type === 'alert') ui.dismissed.add(ui.overlay.key + ui.overlay.i); closeOverlay(); } });

/* ---------- service worker + startup ---------- */
function registerSW() {
  if (!('serviceWorker' in navigator) || !/^https?:/.test(location.protocol)) return;
  navigator.serviceWorker.register('sw.js').catch(() => {});
  navigator.serviceWorker.addEventListener('message', e => { if (e.data && e.data.type === 'notif') handleNotif(e.data); });
}
function init() {
  ui.viewKey = isWork(new Date()) ? todayKey() : nextWorkKey(new Date());
  render(); registerSW(); tick(); setInterval(tick, 15000);
  const q = new URLSearchParams(location.search);
  if (q.get('a') && q.get('k')) {
    handleNotif({ action: q.get('a'), key: q.get('k'), i: q.get('i'), id: q.get('id'), kind: q.get('kind') });
    try { history.replaceState({}, '', location.pathname); } catch (e) { /* ignore */ }
  } else setTimeout(maybeAlert, 600);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { tick(); maybeAlert(); if (!ui.overlay) render(); } });
  try { if (!S.flags.sized && window.matchMedia && matchMedia('(display-mode: standalone)').matches) { window.moveTo(0, 0); window.resizeTo(screen.availWidth, screen.availHeight); S.flags.sized = true; save(); } } catch (e) { /* not allowed */ }
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { /* ignore */ }
  window.__dg = { S: () => S, ui, planFor, cumulative, tick, render, commitDone, expCM, exSites, PLANNED, buildSequence, slotROI, dayROI, handleNotif, openOverlay, finishDone };
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

})();
