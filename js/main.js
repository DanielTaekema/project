(() => {
  "use strict";

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Sticky nav state ---------- */
  const nav = document.getElementById("nav");
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 12);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  const toggle = document.getElementById("nav-toggle");
  const links = document.getElementById("nav-links");
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!open));
    toggle.setAttribute("aria-label", open ? "Menu openen" : "Menu sluiten");
    links.classList.toggle("is-open", !open);
  });
  links.addEventListener("click", (e) => {
    if (e.target.closest("a")) {
      toggle.setAttribute("aria-expanded", "false");
      links.classList.remove("is-open");
    }
  });

  /* ---------- Scroll reveal (staggered per batch) ---------- */
  const revealEls = document.querySelectorAll("[data-reveal]");
  if (prefersReducedMotion) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        let stagger = 0;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.style.setProperty("--reveal-delay", `${stagger}ms`);
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
          stagger += 70;
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- Animated counters ---------- */
  const counters = document.querySelectorAll(".stat__num");
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const suffix = el.dataset.suffix || "";
    const format = (v) =>
      v.toLocaleString("nl-NL", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;

    if (prefersReducedMotion) {
      el.textContent = format(target);
      return;
    }
    const duration = 1600;
    const start = performance.now();
    const easeOut = (t) => 1 - Math.pow(1 - t, 4);
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      el.textContent = format(target * easeOut(p));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  const countObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        animateCount(entry.target);
        countObserver.unobserve(entry.target);
      }
    },
    { threshold: 0.6 }
  );
  counters.forEach((el) => countObserver.observe(el));

  /* ---------- Pointer-tracked glow + tilt on cards (desktop only) ---------- */
  const fineMq = window.matchMedia("(pointer: fine)");
  if (fineMq.matches && !prefersReducedMotion) {
    document.querySelectorAll(".tilt").forEach((card) => {
      let raf = null;
      card.addEventListener("pointermove", (e) => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          const r = card.getBoundingClientRect();
          const x = e.clientX - r.left;
          const y = e.clientY - r.top;
          card.style.setProperty("--mx", `${x}px`);
          card.style.setProperty("--my", `${y}px`);
          const rx = ((y / r.height) - 0.5) * -4;
          const ry = ((x / r.width) - 0.5) * 4;
          card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-3px)`;
          raf = null;
        });
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  }

  /* ---------- Terminal typewriter ---------- */
  const tw = document.getElementById("typewriter");
  if (tw && !prefersReducedMotion) {
    const phrases = [
      "Natuurlijk. Hier is je samenvatting met 3 actiepunten…",
      "Concept-mail staat klaar — toon: professioneel, kort.",
      "Dashboard bijgewerkt. Omzet Q2 +12% t.o.v. Q1.",
      "Workflow geactiveerd: facturen worden nu automatisch verwerkt.",
    ];
    let phraseIdx = 0;
    let charIdx = phrases[0].length;
    let deleting = true;
    let started = false;

    const step = () => {
      const phrase = phrases[phraseIdx];
      if (deleting) {
        charIdx -= 2;
        if (charIdx <= 0) {
          charIdx = 0;
          deleting = false;
          phraseIdx = (phraseIdx + 1) % phrases.length;
        }
        tw.textContent = phrase.slice(0, Math.max(charIdx, 0));
        setTimeout(step, 18);
      } else {
        const next = phrases[phraseIdx];
        charIdx += 1;
        tw.textContent = next.slice(0, charIdx);
        if (charIdx >= next.length) {
          deleting = true;
          setTimeout(step, 3200);
        } else {
          setTimeout(step, 32 + Math.random() * 36);
        }
      }
    };

    const twObserver = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !started) {
          started = true;
          setTimeout(step, 1200);
          twObserver.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    twObserver.observe(tw);
  }

  /* ---------- FAQ: close others when one opens ---------- */
  const faqItems = document.querySelectorAll(".faq__item");
  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      faqItems.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });

  /* ---------- Footer year ---------- */
  document.getElementById("year").textContent = new Date().getFullYear();
})();
