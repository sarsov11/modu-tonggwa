/* 기출 문항 카드 — 시험지 크롭 대신 글자로 다시 짠 문항(시안 A, 1104).
 * 문항 구조는 q/<id>.json(통합과학_교재\문항조판\추출.py, 검사.py 통과분만). 자료 그림만 img/qf/.
 * QC.칸 + QC.채우기 — 구조가 있으면 카드, 없으면 원래 크롭 그림. */
(function(){
  var 원="①②③④⑤";
  var css='.qc{background:#fff;color:#111419;border:1px solid var(--line-2,#E5E7EB);border-radius:var(--r2,14px);padding:16px 16px 14px;font-family:"Pretendard Variable",Pretendard,sans-serif;font-size:16px;line-height:1.62;font-weight:500;word-break:keep-all;overflow-wrap:anywhere}'+
  '@font-face{font-family:QCM;src:url(css/fonts/KaTeX_Math-Italic.woff2) format("woff2")}'+
  '.qc i{font-family:QCM,serif;font-style:normal;font-size:1.08em}.qc sub,.qc sup{font-size:.72em;line-height:0}'+
  '.qc .frac{display:inline-flex;flex-direction:column;vertical-align:middle;text-align:center;font-size:.86em;line-height:1.15;margin:0 2px}.qc .frac>span:first-child{border-bottom:1px solid currentColor;padding:0 2px}'+
  '.qc u{text-underline-offset:3px}.qc .qb{display:inline-block;border:1px solid currentColor;padding:0 .9em;line-height:1.3;margin:0 1px}'+
  '.qc .q-hd{display:flex;align-items:center;gap:8px;margin-bottom:8px}.qc .q-no{background:#0F766E;color:#fff;font-weight:800;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:14px;flex:none}'+
  '.qc .q-src{font-size:11.5px;color:#6B7280;font-weight:600}.qc .q-pt{margin-left:auto;font-size:11.5px;color:#0F766E;font-weight:700;border:1px solid #0F766E;border-radius:12px;padding:0 7px}'+
  '.qc .q-p{margin:0 0 6px}.qc .q-ask{font-weight:700}'+
  '.qc .q-box{border:1.4px solid #c5d6d3;background:#f2f8f7;border-radius:12px;padding:8px 12px;margin:8px 0}.qc .q-box .q-p:last-child{margin-bottom:0}'+
  '.qc .q-bogi{position:relative;border:1.6px solid #0F766E;border-radius:12px;padding:16px 14px 8px;margin:16px 0 10px}'+
  '.qc .q-bogi .q-lab{margin:0;position:absolute;top:-11px;left:50%;transform:translateX(-50%);background:#fff;padding:0 10px;color:#111419;font-weight:800;font-size:13px}'+
  '.qc .q-bi{display:flex;gap:6px;margin:2px 0}.qc .q-bi b{color:#111419;flex:none}'+
  '.qc .q-ch{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.qc .q-ch>span{border:1px solid #E5E7EB;border-radius:14px;padding:2px 10px;font-size:14px}'+
  '.qc .q-ch.q-long{flex-direction:column;gap:4px}.qc .q-ch.q-long>span{border:0;border-radius:0;padding:0}'+
  '.qc .q-fig{text-align:center;margin:8px auto;max-width:100%}.qc .q-fig img{width:100%;display:block}.qc .q-fig .q-cap{font-size:13px;margin-top:2px}'+
  '.qc .q-figrow{display:flex;justify-content:center;gap:10px;align-items:flex-end}.qc .q-figrow .q-fig{margin:8px 0}'+
  '.qc .q-wrap{display:flow-root}.qc .q-wrap .q-fig.q-side{float:right;margin:2px 0 4px 10px}'+
  '.qc table.q-cht{border-collapse:collapse;margin:8px auto 0;font-size:14px;min-width:70%}.qc table.q-cht th{font-weight:700;color:#111419;padding:2px 12px;border-bottom:1.4px solid #0F766E}'+
  '.qc table.q-cht td{padding:3px 12px;text-align:center;border-bottom:1px solid #F1F3F5}.qc table.q-cht td:first-child{color:#111419;font-weight:700;padding-left:4px}'+
  '.qc .q-chg{display:grid;grid-template-columns:repeat(3,1fr);gap:8px 6px;margin-top:8px}.qc .q-chg div{display:flex;gap:4px;align-items:flex-start}.qc .q-chg b{color:#0F766E;flex:none}.qc .q-chg img{width:100%;min-width:0}'+
  '@media(max-width:380px){.qc .q-wrap .q-fig.q-side{float:none;margin:8px auto;width:80%!important}}';
  var 붙음=false;
  function 꾸밈(){ if(붙음) return; 붙음=true; var s=document.createElement("style"); s.textContent=css; document.head.appendChild(s); }
  function 그림(v, 단폭){
    var w=Math.min(100, v["폭pt"]/단폭*125);
    return '<div class="q-fig'+(v["옆"]?' q-side':'')+'" style="width:'+w.toFixed(0)+'%"><img loading="lazy" src="img/qf/'+v["파일"].replace(/\.png$/,".webp")+'" alt="자료">'+
      (v["꼬리"]?'<div class="q-cap">'+v["꼬리"]+'</div>':'')+'</div>';
  }
  function 몸(items, 단폭){
    var o=[], 줄=[];
    function 털기(){
      if(!줄.length) return;
      if(줄.length===1) o.push(그림(줄[0],단폭));
      else{
        var 합=줄.reduce(function(a,v){return a+v["폭pt"];},0), k=Math.min(1, 단폭/합*0.95);
        o.push('<div class="q-figrow">'+줄.map(function(v){ var u={}; for(var x in v) u[x]=v[x]; u["옆"]=false; u["폭pt"]=v["폭pt"]*k; return 그림(u,단폭); }).join("")+'</div>');
      }
      줄=[];
    }
    items.forEach(function(it){
      var k=it[0], v=it[1];
      if(k==="그림"){
        var 앞=줄[줄.length-1];
        if(앞 && !(v.y0<앞.y1-5 && v.y1>앞.y0+5)) 털기();
        if(v["옆"]){ 털기(); o.push(["옆",그림(v,단폭)]); return; }
        줄.push(v); return;
      }
      털기();
      if(k==="글"){
        var t=v.replace(/&lt;/g,"<").replace(/&gt;/g,">");
        var ask=(t.indexOf("<보기>")>=0 && t.indexOf("고른")>=0) || /\?\s*$/.test(t);
        o.push('<p class="q-p'+(ask?' q-ask':'')+'">'+v+'</p>');
      } else if(k==="틀") o.push('<div class="q-box">'+몸(v,단폭)+'</div>');
    });
    털기();
    var h=[];
    for(var i=0;i<o.length;i++){
      if(Array.isArray(o[i])){
        var j=i+1, 묶=[];
        while(j<o.length && !Array.isArray(o[j]) && o[j].slice(0,2)==="<p"){ 묶.push(o[j]); j++; }
        h.push('<div class="q-wrap">'+o[i][1]+묶.join("")+'</div>'); i=j-1; continue;
      }
      h.push(o[i]);
    }
    return h.join("");
  }
  function 선지(d){
    var 그=d["선지그림"]||[];
    if(그.some(Boolean))
      return '<div class="q-chg">'+그.map(function(v,i){ return v?'<div><b>'+원[i]+'</b><img loading="lazy" src="img/qf/'+v["파일"].replace(/\.png$/,".webp")+'" alt="선지 '+(i+1)+'"></div>':''; }).join("")+'</div>';
    var t=d["선지표"];
    if(t) return '<table class="q-cht">'+(t["머리"].length?'<tr><th></th>'+t["머리"].map(function(x){return '<th>'+x.replace(/<\/?u>/g,"")+'</th>';}).join("")+'</tr>':'')+
      t["줄"].map(function(r){ return '<tr>'+r.map(function(x){return '<td>'+x+'</td>';}).join("")+'</tr>'; }).join("")+'</table>';
    if(!d["선지"].some(Boolean)) return "";
    var 길=Math.max.apply(null, d["선지"].map(function(x){return x.replace(/<[^>]+>/g,"").length;}))>9;
    return '<div class="q-ch'+(길?' q-long':'')+'">'+d["선지"].map(function(x,i){return x?'<span>'+원[i]+' '+x+'</span>':'';}).join("")+'</div>';
  }
  function 다듬(h){ return h.replace(/&lt;보기&gt;/g,'<span style="white-space:nowrap">&lt;보기&gt;</span>').replace(/([A-Za-z0-9)\]]|<\/i>) (<su[bp]>)/g,"$1$2"); }   // 「A ²⁺」 처럼 위·아래 첨자 앞에 끼어든 공백(G23714012_17)
  function 카드(d, 출처){
    var 보=d["보기"].length?'<div class="q-bogi"><span class="q-lab">보기</span>'+d["보기"].map(function(b){return '<div class="q-bi"><b>'+b[0]+'.</b><span>'+b[1]+'</span></div>';}).join("")+'</div>':"";
    return '<div class="qc"><div class="q-hd"><span class="q-no">'+d["번호"]+'</span><span class="q-src">'+(출처||"")+'</span>'+(d["배점"]?'<span class="q-pt">'+d["배점"]+'점</span>':'')+'</div>'+
      몸(d["몸"], d["단폭"])+보+선지(d)+'</div>';
  }
  var 묶캐시={};   // 문항 구조는 20묶음 q/bNN.json(낱 파일 1,500개는 GitHub Pages 빌드가 못 견딤, 1105)
  function 묶음(k){ var n=("0"+k).slice(-2); return 묶캐시[n]||(묶캐시[n]=fetch("q/b"+n+".json").then(function(r){ if(!r.ok) throw 0; return r.json(); })); }
  function 넣기(자리){
    var 크롭=자리.getAttribute("data-img"), 출처=자리.getAttribute("data-y")||"";
    var id=(크롭.match(/([^\/]+)\.webp$/)||[])[1], 있음=window.QC_IDS||{};
    var 옛='<img class="fig" src="'+크롭+'" alt="기출 문항">';
    if(!id || !(id in 있음)){ 자리.innerHTML=옛; return; }
    꾸밈();
    묶음(있음[id]).then(function(b){ var d=b[id]; if(!d) throw 0; 자리.innerHTML=다듬(카드(d, 출처)); })
      .catch(function(){ 자리.innerHTML=옛; });
  }
  /* QC.칸(크롭주소, 출처) → 자리 HTML,  QC.채우기(뿌리) → 자리마다 카드(없으면 원래 크롭) */
  window.QC={
    칸:function(크롭, 출처){ return '<div class="qslot" data-img="'+크롭+'" data-y="'+String(출처||"").replace(/"/g,"&quot;")+'"></div>'; },
    채우기:function(뿌리){ (뿌리||document).querySelectorAll(".qslot:not([data-done])").forEach(function(x){ x.setAttribute("data-done","1"); 넣기(x); }); }
  };
})();
