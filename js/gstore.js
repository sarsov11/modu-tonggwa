/* 모두의기사 2판 — 기록 · 복습 간격 · 「오늘 이거 하나」 · 내비
 *
 * 모두의 통사 store.js 의 **원칙만** 옮겼다(2천 줄을 통째로 가져오지 않는다 —
 * 통사 개념트리·범위·학년에 엮여 있어 기사에는 쓸 데가 없다).
 *
 *   · 학생에게 고르게 하지 않는다 — 홈은 오늘 할 것 하나를 정해 준다
 *   · 틀린 문장은 사라지지 않는다 — 1·3·7·21일 간격으로 다시 온다
 *   · 확신하고 맞힌 것만 칸을 올린다 — 찍어서 맞힌 걸 아는 걸로 치지 않는다
 *   · 한 세션에 같은 기출의 다른 선지를 두 번 내지 않는다 —
 *     앞 선지를 보고 나머지 답을 짐작할 수 있다([[exam-cross-item-answer-leak]])
 */
(function () {
  "use strict";
  var D = window.GD || { 테마: [], ox: [], qs: {}, cards: {} };
  var KEY = "modutg2." + (D.종목 || "x");
  var 간격 = [0, 1, 3, 7, 21, 60];          // 칸별로 다시 오기까지 날 수

  function 오늘() {
    var d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  }
  function 날더하기(날, n) {
    var d = new Date(날 + "T00:00:00"); d.setDate(d.getDate() + n);
    return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
  }
  function 읽기() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || "{}");
      s.ox = s.ox || {}; s.테마 = s.테마 || {}; s.날 = s.날 || {}; s.카드 = s.카드 || {};
      s.시험일 = s.시험일 || D.시험일 || "";
      return s;
    } catch (e) { return { ox: {}, 테마: {}, 날: {}, 카드: {}, 시험일: D.시험일 || "" }; }
  }
  var S = 읽기();
  function 쓰기() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  /* ── 색인 ── */
  var 테마맵 = {}, 테마별 = {}, oxMap = {};
  D.테마.forEach(function (t) { 테마맵[t.k] = t; 테마별[t.k] = []; });
  D.ox.forEach(function (o) { oxMap[o.i] = o; if (테마별[o.k]) 테마별[o.k].push(o); });
  var 순 = { S: 0, A: 1, B: 2, C: 3 };

  /* ── 숙련도 — 그 테마 최근 10번의 정답률. 10번 안 됐으면 null ── */
  function 숙련(k) {
    var r = (S.테마[k] || {}).r || [];
    if (r.length < 4) return null;
    var 뒤 = r.slice(-10), 맞 = 0;
    뒤.forEach(function (x) { if (x) 맞++; });
    return 맞 / 뒤.length;
  }
  function 연속오답(k) {
    var r = (S.테마[k] || {}).r || [], n = 0;
    for (var i = r.length - 1; i >= 0 && !r[i]; i--) n++;
    return n;
  }
  function 다시볼것(k) {
    var 날 = 오늘();
    return (k ? 테마별[k] || [] : D.ox).filter(function (o) {
      var x = S.ox[o.i]; return x && x.다음 && x.다음 <= 날;
    });
  }
  function 본적있나(k) { return !!(S.테마[k] && (S.테마[k].r || []).length); }

  /* ── 오늘 이거 하나 ─────────────────────────────
     ① 다시 볼 문장이 8개 넘게 쌓였으면 복습부터 — 쌓이면 못 따라잡는다
     ② 시작했는데 아직 70% 가 안 되는 테마 — 등급 높은 것부터
     ③ 아직 안 본 테마 — S 부터, 같은 등급이면 기출에 많이 나온 것부터 */
  function 오늘할것() {
    var 복습 = 다시볼것();
    if (복습.length >= 8)
      return { 종류: "복습", n: 복습.length, 이름: "다시 볼 문장", k: null };
    var 후보 = D.테마.filter(function (t) { return (테마별[t.k] || []).length >= 4; });
    var 약한 = 후보.filter(function (t) {
      var m = 숙련(t.k); return 본적있나(t.k) && m != null && m < 0.7;
    }).sort(function (a, b) { return (순[a.g] - 순[b.g]) || (숙련(a.k) - 숙련(b.k)); });
    if (약한.length) return { 종류: "약점", k: 약한[0].k, 이름: 약한[0].n, t: 약한[0] };
    var 새 = 후보.filter(function (t) { return !본적있나(t.k); })
      .sort(function (a, b) { return (순[a.g] - 순[b.g]) || (b.c - a.c); });
    if (새.length) return { 종류: "새", k: 새[0].k, 이름: 새[0].n, t: 새[0] };
    if (복습.length) return { 종류: "복습", n: 복습.length, 이름: "다시 볼 문장", k: null };
    var 아무 = 후보.sort(function (a, b) { return (숙련(a.k) || 0) - (숙련(b.k) || 0); })[0];
    return 아무 ? { 종류: "약점", k: 아무.k, 이름: 아무.n, t: 아무 } : null;
  }

  /* ── 한 세션 뽑기 — 12문장 ─────────────────────
     다시 볼 것 → 아직 안 본 것 → 틀린 적 있는 것 순. 같은 기출은 한 번만. */
  function 세션(k, 수) {
    수 = 수 || 12;
    var 풀 = k ? (테마별[k] || []) : D.ox, 날 = 오늘();
    function 섞기(a) {
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
      } return a;
    }
    var 다시 = 섞기(풀.filter(function (o) { var x = S.ox[o.i]; return x && x.다음 && x.다음 <= 날; }));
    var 새 = 섞기(풀.filter(function (o) { return !S.ox[o.i]; }));
    var 틀린 = 섞기(풀.filter(function (o) { var x = S.ox[o.i]; return x && !x.맞 && !(x.다음 && x.다음 <= 날); }));
    var 나머지 = 섞기(풀.slice());
    var 뽑음 = [], 쓴기출 = {}, 쓴문장 = {};
    [다시, 새, 틀린, 나머지].forEach(function (무더기) {
      무더기.forEach(function (o) {
        if (뽑음.length >= 수 || 쓴기출[o.q] || 쓴문장[o.i]) return;
        쓴기출[o.q] = 1; 쓴문장[o.i] = 1; 뽑음.push(o);
      });
    });
    return 뽑음;
  }

  /* ── 기록 ──
     칸은 **확신하고 맞혔을 때만** 오른다. 반반·찍음으로 맞힌 건 제자리(최대 1칸).
     틀리면 0칸 — 내일 다시 온다. */
  function 기록(id, 맞, 확신, ms) {
    var o = oxMap[id]; if (!o) return;
    var x = S.ox[id] || { n: 0, 칸: 0 };
    x.n++; x.맞 = 맞 ? 1 : 0; x.t = 오늘();
    if (!맞) x.칸 = 0;
    else if (확신 === "sure") x.칸 = Math.min(간격.length - 1, (x.칸 || 0) + 1);
    else x.칸 = Math.max(1, Math.min(x.칸 || 0, 1));
    x.다음 = 날더하기(오늘(), 맞 ? 간격[x.칸] : 1);
    S.ox[id] = x;
    var t = S.테마[o.k] || { r: [] };
    t.r.push(맞 ? 1 : 0); if (t.r.length > 30) t.r = t.r.slice(-30);
    S.테마[o.k] = t;
    var d = S.날[오늘()] || { n: 0, ok: 0, ms: 0 };
    d.n++; if (맞) d.ok++; d.ms += Math.min(ms || 0, 120000);
    S.날[오늘()] = d;
    쓰기();
  }
  function 카드봄(k) { S.카드[k] = 오늘(); 쓰기(); }

  function 디데이() {
    if (!S.시험일) return null;
    return Math.round((new Date(S.시험일 + "T00:00:00") - new Date(오늘() + "T00:00:00")) / 864e5);
  }
  function 과목성적() {
    var 합 = {};
    D.테마.forEach(function (t) {
      var r = (S.테마[t.k] || {}).r || [];
      var a = 합[t.s] = 합[t.s] || { 푼: 0, 맞: 0 };
      r.forEach(function (x) { a.푼++; if (x) a.맞++; });
    });
    return 합;
  }
  function 이번주() {
    var n = 0, ok = 0, 날 = 오늘();
    for (var i = 0; i < 7; i++) {
      var d = S.날[날더하기(날, -i)]; if (d) { n += d.n; ok += d.ok; }
    }
    return { n: n, ok: ok };
  }

  /* ── 내비 — 위 머리띠 + 아래 탭 (2026-11-10 화면표준: 머리띠 56px · 표식 28px · 격자 단추 / 탭 62px · 아이콘 23px) ── */
  var 그림 = {
    "index.html": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11.2 12 4l8 7.2V19a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 0 1 4 19z"/></svg>',
    "quiz.html": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M13.2 3 5.5 13.4h5.6L10.2 21l8.3-10.6h-5.7z"/></svg>',
    "tree.html": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="6.5" cy="5.5" r="2.4"/><circle cx="6.5" cy="18.5" r="2.4"/><circle cx="17.5" cy="9.5" r="2.4"/><path d="M6.5 7.9v8.2M17.5 11.9c0 3.4-3.6 3.2-8.6 5.2"/></svg>',
    "card.html": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.5C10.2 5 7.6 4.5 4.5 4.8v13c3.1-.3 5.7.2 7.5 1.7 1.8-1.5 4.4-2 7.5-1.7v-13c-3.1-.3-5.7.2-7.5 1.7zM12 6.5v13"/></svg>',
    "settings.html": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3.2"/><path d="M12 3.2v2.4M12 18.4v2.4M3.2 12h2.4M18.4 12h2.4M5.8 5.8l1.7 1.7M16.5 16.5l1.7 1.7M18.2 5.8l-1.7 1.7M7.5 16.5l-1.7 1.7"/></svg>',
    "exam.html": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round"><path d="M5 19.500V12M12 19.500V5M19 19.500V9"/></svg>',
    "buy.html": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6.5C10.2 5 7.6 4.5 4.5 4.8v13c3.1-.3 5.7.2 7.5 1.7 1.8-1.5 4.4-2 7.5-1.7v-13c-3.1-.3-5.7.2-7.5 1.7zM12 6.5v13"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7.5" height="7.5" rx="2.2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2.2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2.2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2.2"/></svg>', back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4"><path d="m14.5 5.5-6.5 6.5 6.5 6.5"/></svg>', close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.4"><path d="M6 6l12 12M18 6 6 18"/></svg>'
  };
  function 내비(지금, 옵션) {
    옵션 = 옵션 || {};
    var 탭 = [["index.html", "오늘"], ["tree.html", "합격 지도"], ["card.html", "개념"], ["drill.html", "드릴"], ["settings.html", "설정"]];
    var 탭그림 = { "drill.html": 그림["quiz.html"] };
    var 위 = '<header class="gbar"><div class="gin">' +
      '<div class="g-out"><a class="gb" href="index.html"><span class="mk">대</span><span class="nm">모두의 <em>대입</em></span><small class="sb">' + esc(D.종목 || "") + '</small></a>' +
      '<nav class="gnav">' + 탭.map(function (t) { return '<a href="' + t[0] + '"' + (t[0] === 지금 ? ' class="on"' : '') + '>' + t[1] + '</a>'; }).join("") + '</nav>' +
      '<a class="fam" href="https://teralearning.kr/" aria-label="테라러닝 전체 서비스">' + 그림.grid + '</a></div>' +
      '<div class="g-in"><a class="bk" href="' + (옵션.뒤 || "index.html") + '" aria-label="뒤로">' + 그림.back + '</a><b class="gt" id="gtitle">' + esc(옵션.안 || "") + '</b><span class="gpr" id="gpr"></span><a class="xx" href="index.html" aria-label="닫기">' + 그림.close + '</a></div>' +
      '</div></header>';
    var 아래 = 옵션.탭 === false ? "" : '<nav class="gtabs" style="grid-template-columns:repeat(' + 탭.length + ',1fr)">' + 탭.map(function (t) {
      return '<a href="' + t[0] + '"' + (t[0] === 지금 ? ' class="on" aria-current="page"' : '') + '>' + (탭그림[t[0]] || 그림[t[0]] || "") + '<span>' + t[1] + '</span></a>';
    }).join("") + '</nav>';
    document.body.insertAdjacentHTML("afterbegin", 위);
    if (옵션.안 !== undefined) document.body.classList.add("inner");
    if (옵션.탭 === false || 옵션.안 !== undefined) document.body.classList.add("notab");
    if (아래) document.body.insertAdjacentHTML("beforeend", 아래);
  }
  /* 안쪽 화면(문제 풀이 등) 머리띠 제목·진행 「3 / 12」 */
  function 진행표시(글) { var g = document.getElementById("gpr"); if (g) g.textContent = 글 || ""; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  window.GS = {
    D: D, S: S, 오늘: 오늘, 테마맵: 테마맵, 테마별: 테마별, oxMap: oxMap, 순: 순,
    숙련: 숙련, 연속오답: 연속오답, 다시볼것: 다시볼것, 오늘할것: 오늘할것, 세션: 세션,
    기록: 기록, 카드봄: 카드봄, 디데이: 디데이, 과목성적: 과목성적, 이번주: 이번주,
    내비: 내비, 진행표시: 진행표시, esc: esc, 저장: 쓰기,
    초기화: function () { try { localStorage.removeItem(KEY); } catch (e) {} }
  };
})();
