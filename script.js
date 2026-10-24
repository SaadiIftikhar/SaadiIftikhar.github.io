(function () {
  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Theme toggle: saved choice wins, otherwise follow the OS setting
  function isDark() {
    if (root.dataset.theme) return root.dataset.theme === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  document.getElementById("themeToggle").addEventListener("click", function () {
    var next = isDark() ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
  });

  // Mobile menu
  var burger = document.getElementById("burger");
  var nav = document.getElementById("nav");
  function setMenu(open) {
    nav.classList.toggle("open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  burger.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
  nav.addEventListener("click", function (e) { if (e.target.tagName === "A") setMenu(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

  // Footer year
  document.getElementById("year").textContent = new Date().getFullYear();

  // Scroll-linked UI: progress bar, header shadow, back-to-top button
  var bar = document.getElementById("bar");
  var toTop = document.getElementById("toTop");
  var ticking = false;
  function onScroll() {
    var y = window.scrollY;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    root.style.setProperty("--scroll", max > 0 ? (y / max).toFixed(4) : 0);
    bar.classList.toggle("bar--scrolled", y > 8);
    toTop.classList.toggle("show", y > 700);
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  if (!("IntersectionObserver" in window)) return;

  // Highlight the nav link for the section currently on screen
  var links = {};
  nav.querySelectorAll("a").forEach(function (a) { links[a.getAttribute("href").slice(1)] = a; });
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var link = links[entry.target.id];
      if (link && entry.isIntersecting) {
        nav.querySelectorAll("a").forEach(function (a) { a.classList.remove("active"); });
        link.classList.add("active");
      }
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  Object.keys(links).forEach(function (id) {
    var el = document.getElementById(id);
    if (el) spy.observe(el);
  });

  // Reveal cards one after another as they scroll into view
  var revealables = document.querySelectorAll(
    ".section .label, .section__title, .section__lead, .about__photo, .about__text, .competencies, " +
    ".skill, .job, .project, .block, .subhead, .cert, .contact, .stat"
  );
  var reveal = new IntersectionObserver(function (entries) {
    var batch = entries.filter(function (e) { return e.isIntersecting; });
    batch.forEach(function (entry, i) {
      entry.target.style.transitionDelay = Math.min(i * 70, 350) + "ms";
      entry.target.classList.add("in");
      reveal.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  revealables.forEach(function (el) {
    el.classList.add("reveal");
    reveal.observe(el);
    // Once revealed, drop the helper classes so hover effects use their own timing again
    el.addEventListener("transitionend", function done(e) {
      if (e.target !== el || !el.classList.contains("in")) return;
      el.classList.remove("reveal", "in");
      el.style.transitionDelay = "";
      el.removeEventListener("transitionend", done);
    });
  });

  // Count stats up from zero the first time they appear
  var counters = document.querySelectorAll("[data-count]");
  var countIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      countIO.unobserve(entry.target);
      if (reduceMotion) return;
      var el = entry.target, end = +el.dataset.count, start = null, dur = 1200;
      function step(t) {
        if (start === null) start = t;
        var p = Math.min((t - start) / dur, 1);
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      }
      el.textContent = "0";
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  counters.forEach(function (el) { countIO.observe(el); });
})();

// Copy email to clipboard with a small confirmation toast
(function () {
  var btn = document.getElementById("copyEmail");
  var toast = document.getElementById("toast");
  var timer;
  function show(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(timer);
    timer = setTimeout(function () { toast.classList.remove("show"); }, 2000);
  }
  btn.addEventListener("click", function () {
    var email = btn.dataset.email;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(email).then(
        function () { show("✓ Email copied"); btn.textContent = "Copied ✓"; setTimeout(function () { btn.textContent = "Copy"; }, 2000); },
        function () { show(email); }
      );
    } else {
      show(email);
    }
  });
})();

// A note for the curious who open DevTools
console.log(
  "%c✓ 0 bugs found on this page.%c\nFound one? Let me know: saadiiftikhar1993@gmail.com",
  "color:#15803d;font-weight:bold;font-size:14px", "color:inherit"
);
