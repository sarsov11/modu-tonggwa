/* 모두의 통과 — 문제 화면 공용 부품(tera-q) 연결 도우미 (2026-11-10)
 *   TQ.freq()        테마 키 → 중요도 별 1~3(해마다 문항 수 순위: 상위 20% = 3 · 다음 30% = 2 · 나머지 = 1). 자료가 없으면 빈 집합
 *   TQ.clock()       머리띠 오른쪽에 풀이 시간 mm:ss
 *   TQ.bar(옵션)     아래 줄: 헷갈림 · 해설 · 펜 + ‹ 2 / 5 ›
 *   TQ.coach()       첫 사용 안내(헷갈림 → 펜), 안내 끄기 하면 다시 안 뜸
 */
(function () {
  var d = document, TQ = window.TQ = {};
  var S = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';
  var ICON = {
    conf: S + '<circle cx="12" cy="12" r="8.5"/><path d="M9.7 9.5a2.4 2.4 0 1 1 3.3 2.2c-.7.3-1 .8-1 1.6M12 16.5h.01"/></svg>',
    exp: S + '<path d="M12 6.5C10.2 5 7.6 4.5 4.5 4.8v13c3.1-.3 5.7.2 7.5 1.7 1.8-1.5 4.4-2 7.5-1.7v-13c-3.1-.3-5.7.2-7.5 1.7zM12 6.5v13"/></svg>',
    pen: S + '<path d="M4.5 19.5l1-4L16 5l3 3L8.5 18.5z"/></svg>'
  };
  var cache = null;
  TQ.freq = function () {
    if (cache) return cache;
    var G = window.GS, D = G && G.D, 기출수 = {}, 연도 = {}, nodes = {}, set = {};
    if (!D) return (cache = set);
    (D.gichul || []).forEach(function (x) {
      기출수[x.k] = (기출수[x.k] || 0) + 1;
      var m = /(\d{2})\.\d/.exec(x.y || ""); if (m) 연도[m[1]] = 1;
    });
    var 해 = Math.max(1, Object.keys(연도).length);
    D.테마.forEach(function (t) {
      var id = t.s + "|" + t.h, n = nodes[id] = nodes[id] || { avg: 0, ks: [] };
      n.avg += (기출수[t.k] || 0) / 해; n.ks.push(t.k);
    });
    var list = Object.keys(nodes).map(function (k) { return nodes[k]; }).sort(function (a, b) { return b.avg - a.avg; });
    list.forEach(function (n, i) { if (n.avg > 0) { var r = i / list.length, v = r < 0.2 ? 3 : r < 0.5 ? 2 : 1; n.ks.forEach(function (k) { set[k] = v; }); } });   /* 별: 상위 20% = 3 · 다음 30% = 2 · 나머지 = 1 */
    return (cache = set);
  };
  TQ.clock = function () {
    var t0 = Date.now();
    function p() { var s = Math.floor((Date.now() - t0) / 1000); GS.진행표시(("0" + Math.floor(s / 60)).slice(-2) + ":" + ("0" + (s % 60)).slice(-2)); }
    p(); setInterval(p, 1000);
  };
  TQ.bar = function (o) {
    o = o || {};
    var b = d.createElement("div"); b.className = "tq-bar";
    function tool(id, name) { return '<button type="button" class="tq-tool" data-t="' + id + '">' + ICON[id] + name + "</button>"; }
    b.innerHTML = (o.conf ? tool("conf", "헷갈림") : "") + (o.exp ? tool("exp", "해설") : "") + (o.pen ? tool("pen", "펜") : "") +
      '<span class="tq-sp"></span><button type="button" class="tq-nav" data-a="prev" aria-label="이전">‹</button><span class="tq-pos"></span>' +
      '<button type="button" class="tq-nav is-next" data-a="next" aria-label="다음">다음 ›</button>';
    d.body.appendChild(b);
    var pop = null, conf = "sure", api = { el: b, on: o };
    var T = function (id) { return b.querySelector('[data-t="' + id + '"]'); }, A = function (a) { return b.querySelector('[data-a="' + a + '"]'); };
    function closePop() { if (pop) { pop.remove(); pop = null; } }
    function paint() { var t = T("conf"); if (t) t.classList.toggle("is-on", conf !== "sure"); }
    api.conf = function () { return conf; };
    api.setPos = function (n, m) { b.querySelector(".tq-pos").innerHTML = n + " <small>/ " + m + "</small>"; };
    api.enable = function (next, exp, prev) { A("next").disabled = !next; var t = T("exp"); if (t) t.disabled = !exp; A("prev").disabled = !prev; };
    api.reset = function () { conf = "sure"; closePop(); paint(); if (window.TERA_PAD && TERA_PAD.penHide) TERA_PAD.penHide(); var p = T("pen"); if (p) p.classList.remove("is-on"); api.enable(false, false, !!(o.canPrev && o.canPrev())); };
    api.lockConf = function () { closePop(); var t = T("conf"); if (t) t.disabled = true; };
    api.unlockConf = function () { var t = T("conf"); if (t) t.disabled = false; };
    api.hide = function () { closePop(); b.style.display = "none"; };
    b.addEventListener("click", function (e) {
      var t = e.target.closest("button"); if (!t) return;
      var id = t.getAttribute("data-t"), a = t.getAttribute("data-a");
      if (id === "conf") {
        if (pop) return closePop();
        pop = d.createElement("div"); pop.className = "tq-conf";
        pop.innerHTML = '<button type="button" data-c="half">반반</button><button type="button" data-c="guess">찍었어요</button>';
        pop.querySelectorAll("button").forEach(function (x) { if (x.dataset.c === conf) x.classList.add("is-on"); });
        pop.onclick = function (ev) { var c = ev.target.closest("button"); if (!c) return; conf = (conf === c.dataset.c) ? "sure" : c.dataset.c; paint(); closePop(); if (o.onConf) o.onConf(conf); };
        d.body.appendChild(pop);
      } else if (id === "exp") { if (o.onExp) o.onExp(); }
      else if (id === "pen") { if (window.TERA_PAD && TERA_PAD.pen) TERA_PAD.pen({ key: o.penKey ? o.penKey() : "q", onChange: function (on) { t.classList.toggle("is-on", on); } }); }
      else if (a === "next") { if (o.onNext) o.onNext(); }
      else if (a === "prev") { if (o.onPrev) o.onPrev(); }
    });
    d.addEventListener("click", function (e) { if (pop && !e.target.closest(".tq-conf,.tq-bar")) closePop(); });
    return api;
  };
  /* 안내 말풍선은 아래 줄 단추 위에 뜬다. 작은 폰에서는 그 자리에 O · X · 선지 단추가 있어 가렸다(11-10).
     → 말풍선을 화면에 고정하고, 단추와 겹치면 문제 화면을 그만큼 올려 단추가 말풍선 위에 보이게 한다.
     그림이 늦게 뜨면 단추 자리가 바뀌므로 여러 번(그림 로드 · 크기 변경 때도) 다시 잰다. */
  function 겹치지않게(c) {
    if (!c) return c;
    if (c.classList.contains("tq-coach-flow")) return c;   // 11-12 끼워 넣은 띠는 그대로 둔다(고정 · 올리기 없음)
    var top0 = parseFloat(c.style.top) || 0, base = null;
    c.style.position = "fixed"; c.style.top = (top0 - window.scrollY) + "px";
    function 재기() {
      if (!c.isConnected) return;
      if (base === null) base = document.body.style.paddingBottom;
      document.body.style.paddingBottom = base; window.scrollTo(0, 0);
      var a = c.getBoundingClientRect(), 가림 = 0;
      [].slice.call(document.querySelectorAll(".tq-ox button,button.o,button.x,.tq-choice,.opt,.pick5 button")).forEach(function (b) {
        var q = b.getBoundingClientRect();
        if (q.width > 1 && !(a.right <= q.left || a.left >= q.right || a.bottom <= q.top || a.top >= q.bottom)) 가림 = Math.max(가림, q.bottom - a.top + 12);
      });
      if (가림 > 0) {
        var now = parseFloat(getComputedStyle(document.body).paddingBottom) || 0;
        document.body.style.paddingBottom = (now + 가림) + "px";
        window.scrollTo(0, 가림);
      }
    }
    function 끝() { document.body.style.paddingBottom = base === null ? "" : base; window.scrollTo(0, 0); window.removeEventListener("resize", 재기); document.removeEventListener("load", 재기, true); }
    [].slice.call(c.querySelectorAll("button")).forEach(function (bt) { bt.addEventListener("click", function () { setTimeout(끝, 0); }, true); });
    [300, 900, 1800].forEach(function (ms) { setTimeout(재기, ms); });
    window.addEventListener("resize", 재기); document.addEventListener("load", 재기, true);
    return c;
  }
  TQ.coach = function (bar) {
    if (!window.TERA_Q) return;
    var c = bar.el.querySelector('[data-t="conf"]'), p = bar.el.querySelector('[data-t="pen"]');
    var 펜 = { key: "pen", title: "문제 위에 바로 쓸 수 있어요", text: "펜을 누르고 문제 위에 풀이를 적어 보세요." };
    if (c) 겹치지않게(TERA_Q.coach(c, { key: "conf", title: "헷갈림을 표시할 수 있어요", text: "누르면 반반이나 찍었어요를 고를 수 있어요.",
      onDone: function () { if (p) 겹치지않게(TERA_Q.coach(p, 펜)); } }));
    else if (p) 겹치지않게(TERA_Q.coach(p, 펜));
  };
})();
