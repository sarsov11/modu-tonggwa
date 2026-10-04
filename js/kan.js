/* 모두의 통과 — 교재 개념면 3판 원고(칸)를 폰 화면 HTML 로 그린다.
 * 원고 = 통합과학_교재\데이터\개념정리2*.json · 킬러드릴.json 의 「칸」. 조판기(17_개념면3.py)와 같은 칸 꼴.
 *   표 · 흐름 · 줄 · 함정 · 기본량 · 도해 · 쪽 · 연습(빈칸 · 비교 · OX줄 · 분류 · 순서 · 잇기)
 * 연습 답은 「답 보기」를 눌러야 보인다(교재는 답지로 뺀다).
 */
(function () {
  "use strict";
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  /* **굵게** · ^{위} · _{아래} · 줄바꿈 */
  function 글(t) {
    return esc(t)
      .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
      .replace(/\^\{([^}]*)\}/g, "<sup>$1</sup>")
      .replace(/_\{([^}]*)\}/g, "<sub>$1</sub>")
      .replace(/\n/g, "<br>");
  }
  function 제목(c) { return c.제목 ? '<h3 class="kh">' + 글(c.제목) + "</h3>" : ""; }
  function 답칸(안) { return '<details class="kans"><summary>답 보기</summary><div>' + 안 + "</div></details>"; }

  var 꼴 = {
    표: function (c) {
      var h = '<div class="kt"><table><thead><tr>' + c.머리.map(function (x) { return "<th>" + 글(x) + "</th>"; }).join("") +
        "</tr></thead><tbody>" + c.줄.map(function (r) {
          return "<tr>" + r.map(function (x, j) { return (j ? "<td>" : "<th>") + 글(x) + (j ? "</td>" : "</th>"); }).join("") + "</tr>";
        }).join("") + "</tbody></table></div>";
      return 제목(c) + h;
    },
    흐름: function (c) {
      return 제목(c) + '<ol class="kf">' + c.줄.map(function (z) {
        return "<li><b>" + 글(z[0]) + "</b>" + (z[1] ? "<span>" + 글(z[1]) + "</span>" : "") + "</li>";
      }).join("") + "</ol>" + (c.밑 ? '<p class="kn">' + 글(c.밑) + "</p>" : "");
    },
    줄: function (c) { return c.줄.map(function (z) { return '<p class="kl">' + 글(z) + "</p>"; }).join(""); },
    함정: function (c) {
      return 제목(c) + '<ul class="kx">' + c.줄.map(function (z) {
        return '<li class="' + (z[0] === "X" ? "x" : "o") + '"><i>' + (z[0] === "X" ? "✕" : "○") + "</i><span>" + 글(z[1]) +
          (z[2] ? ' <b class="fix">→ ' + 글(z[2]) + "</b>" : "") + ' <small>' + esc(z[3] || "") + "</small></span></li>";
      }).join("") + "</ul>";
    },
    기본량: function (c) {
      return 제목(c) + '<div class="kb">' + c.줄.map(function (z, j) {
        return '<div class="' + (j > 4 ? "soft" : "") + '"><small>' + esc(z[0]) + "</small><b>" + esc(z[1]) + "</b><span>" + esc(z[2]) + "</span></div>";
      }).join("") + "</div>" + (c.밑 ? '<p class="kn">' + 글(c.밑) + "</p>" : "");
    },
    도해: function (c) {
      return 제목(c) + '<div class="kdw"><img class="kd" src="img/d/' + encodeURIComponent(c.파일) + '.svg" alt="' + esc(c.제목 || "") + '"></div>' +
        (c.밑 ? '<p class="kn">' + 글(c.밑) + "</p>" : "");
    },
    쪽: function (c) { return '<h2 class="kp">' + 글(c.제목) + (c.부제 ? " <small>" + 글(c.부제.replace(/ · 답은 답지에/, "")) + "</small>" : "") + "</h2>"; },
    빈칸: function (c) {
      return 제목(c) + '<ol class="kq">' + c.줄.map(function (z) {
        return "<li>" + 글(z[0]) + " = <u>　　　</u> " + 글(z[1]) + 답칸(글(z[2]) + " " + 글(z[1])) + "</li>";
      }).join("") + "</ol>";
    },
    비교: function (c) {
      return 제목(c) + '<ol class="kq">' + c.줄.map(function (z) {
        return "<li>" + 글(z[0]) + " <u>　○　</u> " + 글(z[1]) + 답칸(글(z[0]) + " <b>" + esc(z[2]) + "</b> " + 글(z[1])) + "</li>";
      }).join("") + "</ol>" + (c.밑 ? '<p class="kn">' + 글(c.밑) + "</p>" : "");
    },
    OX줄: function (c) {
      return 제목(c) + '<div class="kq2">' + c.줄.map(function (z) { return "<span>" + esc(z[0]) + "</span>"; }).join("") + "</div>" +
        답칸(c.줄.map(function (z) { return esc(z[0]) + " <b>" + z[1] + "</b>"; }).join(" · "));
    },
    분류: function (c) {
      return 제목(c) + '<div class="kq2">' + c.줄.map(function (z) { return "<span>" + esc(z[0]) + "</span>"; }).join("") + "</div>" +
        답칸(c.갈래.map(function (g) {
          return "<b>" + esc(g) + "</b> " + c.줄.filter(function (z) { return z[1] === g; }).map(function (z) { return esc(z[0]); }).join(" · ");
        }).join("<br>"));
    },
    순서: function (c) {
      return 제목(c) + '<div class="kq2">' + c.줄.map(function (z) { return "<span>" + 글((z[0] ? z[0] + " " : "") + z[1]) + "</span>"; }).join("") + "</div>" +
        답칸(c.줄.slice().sort(function (a, b) { return a[2] - b[2]; }).map(function (z) { return 글((z[0] ? z[0] + " " : "") + z[1]); }).join(" &lt; "));
    },
    잇기: function (c) {
      return 제목(c) + '<div class="kq2">' + c.줄.map(function (z) { return "<span>" + esc(z[0]) + "</span>"; }).join("") + "</div>" +
        답칸(c.답.map(function (z) { return esc(z[0]) + " → " + esc(z[1]); }).join("<br>"));
    }
  };
  function 그리기(칸들) {
    return (칸들 || []).map(function (c) { return (꼴[c.꼴] || function () { return ""; })(c); }).join("");
  }
  window.KAN = { 그리기: 그리기, 글: 글, esc: esc };
})();
