/* Karthik KS Photography — navigation, gallery filters, lightbox, reels */
(function () {
  "use strict";
  var doc = document;
  var root = doc.documentElement;
  root.classList.remove("no-js");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- year ---------- */
  var yr = doc.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- mobile menu ---------- */
  var menuBtn = doc.getElementById("menu-btn");
  var nav = doc.getElementById("site-nav");
  function setMenu(open) {
    nav.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    doc.body.classList.toggle("lb-lock", open && window.innerWidth <= 900);
  }
  menuBtn.addEventListener("click", function () { setMenu(menuBtn.getAttribute("aria-expanded") !== "true"); });
  nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
  doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && nav.classList.contains("open")) { setMenu(false); menuBtn.focus(); } });
  window.addEventListener("resize", function () { if (window.innerWidth > 900 && nav.classList.contains("open")) setMenu(false); });

  /* ---------- active nav link ---------- */
  var links = [].slice.call(nav.querySelectorAll('a[href^="#"]'));
  if ("IntersectionObserver" in window) {
    var secs = links.map(function (a) { return doc.querySelector(a.getAttribute("href")); }).filter(Boolean);
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (a) { a.setAttribute("aria-current", a.getAttribute("href") === "#" + en.target.id ? "true" : "false"); });
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    secs.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- reveal + image fade-in ---------- */
  function markLoaded(img) { img.classList.add("loaded"); }
  [].forEach.call(doc.querySelectorAll(".tile img"), function (img) {
    if (img.complete && img.naturalWidth) markLoaded(img);
    else { img.addEventListener("load", function () { markLoaded(img); }); img.addEventListener("error", function () { markLoaded(img); }); }
  });
  var revealEls = [].slice.call(doc.querySelectorAll(".reveal"));
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else { revealEls.forEach(function (el) { el.classList.add("in"); }); }

  /* ---------- gallery filters ---------- */
  var gallery = doc.getElementById("gallery-grid");
  var filterBtns = [].slice.call(doc.querySelectorAll(".filter"));
  var emptyMsg = doc.getElementById("gallery-empty");
  var liveMsg = doc.getElementById("filter-status");
  var timer = null;
  function applyFilter(cat, scroll) {
    filterBtns.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-filter") === cat ? "true" : "false"); });
    var run = function () {
      var shown = 0;
      [].forEach.call(gallery.children, function (t) {
        var match = cat === "All" || t.getAttribute("data-category") === cat;
        t.hidden = !match; if (match) shown++;
      });
      emptyMsg.hidden = shown !== 0;
      if (liveMsg) liveMsg.textContent = (cat === "All" ? "Showing all photographs" : "Showing " + cat) + ": " + shown;
      gallery.classList.remove("switching");
    };
    if (reduce) run();
    else { gallery.classList.add("switching"); clearTimeout(timer); timer = setTimeout(run, 180); }
    if (scroll) { var g = doc.getElementById("gallery"); if (g) g.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }); }
  }
  filterBtns.forEach(function (b) { b.addEventListener("click", function () { applyFilter(b.getAttribute("data-filter"), false); }); });
  [].forEach.call(doc.querySelectorAll("[data-jump-filter]"), function (b) {
    b.addEventListener("click", function () { applyFilter(b.getAttribute("data-jump-filter"), true); });
  });

  /* ---------- reels scroller buttons ---------- */
  var reels = doc.getElementById("reels-track");
  [].forEach.call(doc.querySelectorAll("[data-reel-dir]"), function (b) {
    b.addEventListener("click", function () {
      var dir = parseInt(b.getAttribute("data-reel-dir"), 10);
      reels.scrollBy({ left: dir * Math.max(240, reels.clientWidth * 0.8), behavior: reduce ? "auto" : "smooth" });
    });
  });


  /* ---------- latest from Instagram (filled by the Netlify sync; hidden if unavailable) ---------- */
  (function () {
    var sec = doc.getElementById("latest"), grid = doc.getElementById("latest-grid");
    if (!sec || !grid || !window.fetch || location.protocol === "file:") return;
    fetch("/api/ig-latest", { headers: { Accept: "application/json" } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.items || !d.items.length) return;
        d.items.forEach(function (it) {
          if (!/^\/api\/ig-media\/\d+$/.test(it.image || "")) return;
          var a = doc.createElement("a"); a.className = "tile";
          var alt = "Recent " + it.kind.toLowerCase() + " from @karthik.ks_photography";
          if (it.type === "photo") {
            a.href = it.image; a.setAttribute("data-lb", ""); a.setAttribute("data-type", "photo");
            a.setAttribute("data-alt", alt); a.setAttribute("data-label", "Latest");
            a.setAttribute("data-source", "Shared on @karthik.ks_photography");
          } else {
            if (!/^https:\/\/www\.instagram\.com\//.test(it.permalink || "")) return;
            a.href = it.permalink; a.target = "_blank"; a.rel = "noopener noreferrer";
            a.setAttribute("aria-label", "Watch this " + it.kind.toLowerCase() + " on Instagram");
          }
          var img = doc.createElement("img"); img.src = it.image; img.alt = it.type === "photo" ? alt : "";
          img.loading = "lazy"; img.decoding = "async"; img.width = 640; img.height = 800;
          img.addEventListener("load", function () { img.classList.add("loaded"); });
          img.addEventListener("error", function () { a.remove(); });
          a.appendChild(img);
          if (it.type !== "photo") {
            var m = doc.createElement("span"); m.className = "reel-meta"; m.textContent = it.kind; a.appendChild(m);
            var p = doc.createElement("span"); p.className = "play"; p.appendChild(doc.createElement("i")); a.appendChild(p);
          }
          grid.appendChild(a);
        });
        if (grid.children.length) { sec.hidden = false; }
      })
      .catch(function () {});
  })();

  /* ---------- lightbox ---------- */
  var lb = doc.getElementById("lightbox");
  var stage = lb.querySelector(".lb-stage");
  var countEl = lb.querySelector(".lb-count");
  var capEl = lb.querySelector(".lb-cap");
  var btnClose = lb.querySelector(".lb-close");
  var btnPrev = lb.querySelector(".lb-prev");
  var btnNext = lb.querySelector(".lb-next");
  var items = [], pos = 0, opener = null, mediaEl = null;

  function collect(link) {
    var group = link.closest("[data-lb-group]");
    return [].slice.call(group.querySelectorAll("a[data-lb]")).filter(function (a) { return !a.closest("[hidden]"); });
  }
  function clearMedia() {
    if (!mediaEl) return;
    if (mediaEl.tagName === "VIDEO") { mediaEl.pause(); mediaEl.removeAttribute("src"); mediaEl.load(); }
    mediaEl.remove(); mediaEl = null;
  }
  function show(i) {
    pos = (i + items.length) % items.length;
    var a = items[pos];
    clearMedia();
    var type = a.getAttribute("data-type");
    var el;
    if (type === "video") {
      el = doc.createElement("video");
      el.controls = true; el.playsInline = true; el.preload = "metadata";
      el.setAttribute("poster", a.getAttribute("data-poster") || "");
      el.setAttribute("aria-label", a.getAttribute("data-alt") || "Video");
      el.src = a.getAttribute("href");
    } else {
      el = doc.createElement("img");
      el.alt = a.getAttribute("data-alt") || "";
      el.src = a.getAttribute("href");
      el.decoding = "async";
    }
    el.className = "lb-media";
    stage.insertBefore(el, btnNext);
    mediaEl = el;
    countEl.textContent = (pos + 1) + " / " + items.length;
    var cat = a.getAttribute("data-label") || "";
    var src = a.getAttribute("data-source") || "";
    capEl.innerHTML = "";
    var b = doc.createElement("b"); b.textContent = cat; capEl.appendChild(b);
    capEl.appendChild(doc.createTextNode(src));
    lb.classList.toggle("lb-single", items.length < 2);
    // preload neighbours (photos only)
    [pos + 1, pos - 1].forEach(function (n) {
      var nb = items[(n + items.length) % items.length];
      if (nb && nb.getAttribute("data-type") !== "video") { var im = new Image(); im.src = nb.getAttribute("href"); }
    });
  }
  function open(link) {
    items = collect(link); pos = items.indexOf(link); if (pos < 0) pos = 0;
    opener = link;
    lb.classList.add("open"); lb.setAttribute("aria-hidden", "false");
    doc.body.classList.add("lb-lock");
    show(pos);
    btnClose.focus();
  }
  function close() {
    lb.classList.remove("open"); lb.setAttribute("aria-hidden", "true");
    clearMedia();
    if (!nav.classList.contains("open")) doc.body.classList.remove("lb-lock");
    if (opener) opener.focus({ preventScroll: true });
  }
  doc.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[data-lb]");
    if (a && !e.metaKey && !e.ctrlKey && !e.shiftKey) { e.preventDefault(); open(a); }
  });
  btnClose.addEventListener("click", close);
  btnPrev.addEventListener("click", function () { show(pos - 1); });
  btnNext.addEventListener("click", function () { show(pos + 1); });
  stage.addEventListener("click", function (e) { if (e.target === stage) close(); });
  doc.addEventListener("keydown", function (e) {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); show(pos + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); show(pos - 1); }
    else if (e.key === "Tab") {           // keep focus inside the viewer
      var f = [].slice.call(lb.querySelectorAll("button:not([hidden]), video[controls]")).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  var sx = 0, sy = 0;
  stage.addEventListener("touchstart", function (e) { sx = e.changedTouches[0].clientX; sy = e.changedTouches[0].clientY; }, { passive: true });
  stage.addEventListener("touchend", function (e) {
    var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(pos + (dx < 0 ? 1 : -1));
  }, { passive: true });
})();

/* ---------- Book a Shoot inline form ---------- */
(function(){
  var form = document.getElementById('book-form');
  var success = document.getElementById('book-success');
  if(!form) return;

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var data = new FormData(form);
    fetch('/', {
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body: new URLSearchParams(data).toString()
    }).then(function(){
      form.style.display='none';
      success.style.display='block';
    }).catch(function(){
      alert('Something went wrong. Please try emailing karthikksphotography@gmail.com directly.');
    });
  });
})();

/* ---------- Hero latest Instagram strip ---------- */
(function(){
  var wrap = document.getElementById('hero-latest-wrap');
  var strip = document.getElementById('hero-latest-strip');
  if(!wrap||!strip||!window.fetch||location.protocol==='file:') return;
  fetch('/api/ig-latest',{headers:{Accept:'application/json'}})
    .then(function(r){return r.ok?r.json():null})
    .then(function(d){
      if(!d||!d.items||!d.items.length) return;
      var count=0;
      d.items.forEach(function(it){
        if(count>=6) return;
        if(!/^\/api\/ig-media\/\d+$/.test(it.image||'')) return;
        var a=document.createElement('a');
        if(it.permalink&&/^https:\/\/www\.instagram\.com\//.test(it.permalink)){
          a.href=it.permalink; a.target='_blank'; a.rel='noopener noreferrer';
        } else { a.href='#latest'; }
        a.setAttribute('aria-label','Latest '+it.kind+' on Instagram');
        var img=document.createElement('img');
        img.src=it.image; img.alt=''; img.loading='lazy'; img.decoding='async';
        img.addEventListener('error',function(){a.remove()});
        a.appendChild(img);
        strip.appendChild(a);
        count++;
      });
      if(strip.children.length) wrap.style.display='';
    })
    .catch(function(){});
})();
