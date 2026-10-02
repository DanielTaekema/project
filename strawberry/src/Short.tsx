import React from "react";
import { AbsoluteFill, Audio, Sequence, interpolate, spring, staticFile, useCurrentFrame, Easing } from "remotion";

const FPS = 30;
const C = {
  navy: "#0b1020",
  panel: "#161d34",
  text: "#f3f5fb",
  dim: "#8b93ad",
  red: "#ff4d5e",
  green: "#3ddc97",
  yellow: "#ffd166",
  blue: "#5aa9ff",
  ink: "#10131f",
};
const SANS = "Inter, 'Helvetica Neue', Arial, 'DejaVu Sans', sans-serif";
const MONO = "'DejaVu Sans Mono', 'Courier New', monospace";
const WORD = "strawberry";
const R_IDX = [2, 7, 8];

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const outCubic = Easing.out(Easing.cubic);
const inCubic = Easing.in(Easing.cubic);
const pop = (f: number, at: number, damping = 11, stiffness = 230) => spring({ frame: f - at, fps: FPS, config: { damping, stiffness } });
const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const shake = (f: number, at: number, amp = 18, len = 10) => {
  const t = f - at;
  if (t < 0 || t > len) return { x: 0, y: 0 };
  const k = 1 - t / len;
  return { x: (rnd(f) - 0.5) * 2 * amp * k, y: (rnd(f + 99) - 0.5) * 2 * amp * k };
};

// ---------- Achtergronden ----------
type BgKind = "navy" | "yellow" | "white" | "red" | "blue" | "black";
const BG: Record<BgKind, { bg: string; fg: string }> = {
  navy: { bg: C.navy, fg: C.text },
  yellow: { bg: C.yellow, fg: C.ink },
  white: { bg: "#f5f2ea", fg: C.ink },
  red: { bg: C.red, fg: "#fff" },
  blue: { bg: "#143a8f", fg: "#fff" },
  black: { bg: "#000", fg: "#fff" },
};
const Background: React.FC<{ kind: BgKind }> = ({ kind }) => {
  const f = useCurrentFrame();
  const { bg, fg } = BG[kind];
  const dark = kind === "navy" || kind === "black" || kind === "blue";
  return (
    <AbsoluteFill style={{ background: bg, overflow: "hidden" }}>
      {kind !== "black" && (
        <AbsoluteFill
          style={{
            backgroundImage: `linear-gradient(${fg}${dark ? "14" : "12"} 2px, transparent 2px), linear-gradient(90deg, ${fg}${dark ? "14" : "12"} 2px, transparent 2px)`,
            backgroundSize: "120px 120px",
            backgroundPosition: `${(f * 3) % 120}px ${(f * 2) % 120}px`,
          }}
        />
      )}
      {dark && kind !== "black" && (
        <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, rgba(90,169,255,0.20), transparent 60%)" }} />
      )}
    </AbsoluteFill>
  );
};

// ---------- Shot: zoom-in bij binnenkomen, zoom-through bij vertrek, constante push ----------
type ShotDef = { dur: number; bg: BgKind; flash?: "white" | "dark"; noIn?: boolean; noOut?: boolean; comp: React.FC<{ n: number }> };

const Shot: React.FC<{ def: ShotDef; n: number; frames: number }> = ({ def, n, frames }) => {
  const f = useCurrentFrame();
  const inP = def.noIn ? 1 : interpolate(f, [0, 7], [0, 1], { ...clamp, easing: outCubic });
  const outP = def.noOut ? 0 : interpolate(f, [frames - 5, frames], [0, 1], { ...clamp, easing: inCubic });
  const push = interpolate(f, [0, frames], [1, 1.07], clamp);
  const scale = (1.5 - 0.5 * inP) * (1 + 0.35 * outP) * push;
  const flashOp = def.flash ? interpolate(f, [0, 8], [0.95, 0], clamp) : 0;
  const Comp = def.comp;
  return (
    <AbsoluteFill>
      <Background kind={def.bg} />
      <AbsoluteFill style={{ transform: `scale(${scale})`, opacity: inP * (1 - 0.6 * outP), filter: inP < 1 ? `blur(${(1 - inP) * 14}px)` : undefined }}>
        <Comp n={n} />
      </AbsoluteFill>
      {def.flash && <AbsoluteFill style={{ background: def.flash === "white" ? "#fff" : "#000", opacity: flashOp }} />}
    </AbsoluteFill>
  );
};

// ---------- Kleine bouwstenen ----------
const Strawberry: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size * 1.15} viewBox="0 0 200 230">
    <path d="M100 40 C 40 30, 8 80, 22 130 C 36 185, 80 220, 100 222 C 120 220, 164 185, 178 130 C 192 80, 160 30, 100 40 Z" fill={C.red} />
    {[[60, 85], [100, 80], [140, 85], [45, 120], [82, 118], [118, 118], [155, 120], [62, 155], [100, 152], [138, 155], [80, 187], [120, 187], [100, 205]].map(([x, y], i) => (
      <ellipse key={i} cx={x} cy={y} rx="5" ry="8" fill={C.yellow} transform={`rotate(-10 ${x} ${y})`} />
    ))}
    <path d="M100 48 C 80 20, 50 22, 40 36 C 62 38, 76 50, 100 48 Z" fill={C.green} />
    <path d="M100 48 C 120 20, 150 22, 160 36 C 138 38, 124 50, 100 48 Z" fill={C.green} />
    <path d="M100 48 C 92 28, 96 12, 100 6 C 104 12, 108 28, 100 48 Z" fill="#2fb87a" />
  </svg>
);

// Woorden die één voor één in beeld slaan
const Slam: React.FC<{ words: { t: string; at: number; color?: string; size?: number }[]; size?: number; fg: string; lineGap?: number }> = ({ words, size = 150, fg, lineGap = 10 }) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: lineGap, padding: "0 60px" }}>
      {words.map((w, i) => {
        if (f < w.at) return <div key={i} style={{ height: (w.size ?? size) * 1.05 }} />;
        const p = pop(f, w.at, 9, 260);
        const s = 0.3 + 0.7 * p;
        const sh = shake(f, w.at, 8, 6);
        return (
          <div
            key={i}
            style={{
              fontFamily: SANS,
              fontWeight: 900,
              fontSize: w.size ?? size,
              lineHeight: 1.02,
              color: w.color ?? fg,
              textAlign: "center",
              letterSpacing: -2,
              transform: `translate(${sh.x}px, ${sh.y}px) scale(${s})`,
              opacity: Math.min(1, p * 3),
            }}
          >
            {w.t}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const Letters: React.FC<{ size: number; w: number; highlight?: (i: number) => boolean; color?: string; style?: (i: number) => React.CSSProperties }> = ({ size, w, highlight, color = C.text, style }) => (
  <div style={{ display: "flex", fontFamily: MONO, fontWeight: 700, fontSize: size }}>
    {WORD.split("").map((ch, i) => {
      const hi = highlight?.(i);
      return (
        <span key={i} style={{ width: w, textAlign: "center", display: "inline-block", color: hi ? C.red : color, textShadow: hi ? `0 0 40px ${C.red}` : undefined, ...(style?.(i) ?? {}) }}>
          {ch}
        </span>
      );
    })}
  </div>
);

// ---------- Shots ----------
// 1 hook
const S1: React.FC<{ n: number }> = () => (
  <Slam fg={C.text} size={170} words={[{ t: "Deze AI", at: 2 }, { t: "slaagt voor", at: 12 }, { t: "een examen", at: 20, color: C.yellow }]} />
);

// 2 chat
const S2: React.FC<{ n: number }> = () => {
  const f = useCurrentFrame();
  const q = 'Hoeveel R\'s zitten er in "strawberry"?';
  const typed = q.slice(0, Math.floor(interpolate(f, [4, 30], [0, q.length], clamp)));
  const rp = pop(f, 36, 8, 200);
  const sh = shake(f, 36, 22, 12);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 940, background: C.panel, borderRadius: 40, border: "2px solid #26305a", overflow: "hidden", transform: `translate(${sh.x}px, ${sh.y}px)` }}>
        <div style={{ padding: "24px 40px", borderBottom: "2px solid #26305a", fontFamily: SANS, color: C.dim, fontSize: 36, fontWeight: 700 }}>● AI-chat</div>
        <div style={{ padding: 40, display: "flex", flexDirection: "column", gap: 36, minHeight: 640 }}>
          <div style={{ alignSelf: "flex-end", maxWidth: 760, background: C.blue, color: "#06122a", fontFamily: SANS, fontWeight: 600, fontSize: 50, lineHeight: 1.3, padding: "24px 32px", borderRadius: "34px 34px 8px 34px", minHeight: 80 }}>{typed}</div>
          {f >= 36 && (
            <div style={{ alignSelf: "flex-start", background: "#222b4d", color: C.red, fontFamily: SANS, fontWeight: 900, fontSize: 260, padding: "0 80px", borderRadius: "34px 34px 34px 8px", transform: `scale(${0.3 + 0.7 * rp})`, transformOrigin: "left bottom" }}>2</div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// 3 fout / goed
const S3: React.FC<{ n: number }> = () => {
  const f = useCurrentFrame();
  const p = pop(f, 2, 7, 220);
  const p2 = pop(f, 22, 9, 240);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", fontFamily: SANS, fontWeight: 900, fontSize: 900, color: "#fff", transform: `scale(${0.4 + 0.6 * p}) rotate(${f < 22 ? -4 : 0}deg)`, opacity: f < 22 ? 1 : 0 }}>
        2
        <div style={{ position: "absolute", left: -40, right: -40, top: "52%", height: 40, background: "#000", transform: `rotate(-12deg) scaleX(${interpolate(f, [10, 18], [0, 1], clamp)})` }} />
      </div>
      {f >= 22 && <div style={{ position: "absolute", fontFamily: SANS, fontWeight: 900, fontSize: 1000, color: "#fff", transform: `scale(${0.3 + 0.7 * p2})` }}>3</div>}
      <div style={{ position: "absolute", bottom: 330, fontFamily: SANS, fontWeight: 900, fontSize: 80, color: "#fff", letterSpacing: 6, opacity: f >= 22 ? 1 : 0.0 }}>HET ANTWOORD</div>
    </AbsoluteFill>
  );
};

// 4 camera zoomt in op elke R
const S4: React.FC<{ n: number }> = () => {
  const f = useCurrentFrame();
  const W = 96;
  const hits = [10, 25, 40];
  const hitsDone = hits.filter((h) => f >= h).length;
  const xs = [0, ...R_IDX.map((i) => (i - 4.5) * W)];
  const cur = Math.max(0, hitsDone);
  const hf = hits[Math.max(0, cur - 1)] ?? 0;
  const p = cur > 0 ? pop(f, hf, 14, 200) : 1;
  const camX = xs[cur - 1 >= 0 ? cur - 1 : 0] + (xs[cur] - xs[cur - 1 >= 0 ? cur - 1 : 0]) * p;
  const zoomOut = interpolate(f, [52, 62], [0, 1], { ...clamp, easing: outCubic });
  const camScale = cur === 0 ? 1 : (1.9 - 0.9 * zoomOut);
  const tx = cur === 0 ? 0 : -camX * camScale * (1 - zoomOut);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `translateX(${tx}px) scale(${camScale})` }}>
        <Letters size={140} w={W} highlight={(i) => { const ri = R_IDX.indexOf(i); return ri >= 0 && f >= hits[ri]; }} color={C.ink} />
      </div>
      <div style={{ position: "absolute", bottom: 300, display: "flex", gap: 40, fontFamily: SANS, fontWeight: 900, fontSize: 200, color: C.ink }}>
        {[1, 2, 3].map((k) => (
          <div key={k} style={{ opacity: hitsDone >= k ? 1 : 0.15, color: hitsDone >= k ? C.red : C.ink, transform: `scale(${hitsDone >= k ? 0.7 + 0.3 * pop(f, hits[k - 1]) : 1})` }}>{k}</div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// 5 oog doorgestreept
const S5: React.FC<{ n: number }> = () => {
  const f = useCurrentFrame();
  const s = pop(f, 2, 10, 180);
  const slash = interpolate(f, [18, 26], [0, 1], { ...clamp, easing: outCubic });
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <svg width="760" height="420" viewBox="0 0 760 420" style={{ transform: `scale(${s})`, marginTop: -180 }}>
        <path d="M30 210 Q380 -60 730 210 Q380 480 30 210 Z" fill="#fff" stroke="#fff" strokeWidth="10" />
        <circle cx="380" cy="210" r="110" fill={C.blue} />
        <circle cx="380" cy="210" r="52" fill="#0b1020" />
        <circle cx="350" cy="180" r="18" fill="#fff" />
        <line x1="80" y1="400" x2={80 + 600 * slash} y2={400 - 400 * slash} stroke={C.red} strokeWidth="38" strokeLinecap="round" />
      </svg>
      <div style={{ position: "absolute", bottom: 380, left: 0, right: 0, textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: 96, color: "#fff", lineHeight: 1.05, opacity: f > 8 ? 1 : 0, transform: `scale(${0.6 + 0.4 * pop(f, 8)})` }}>
        Het model ziet<br />
        <span style={{ color: C.yellow }}>geen letters</span>
      </div>
    </AbsoluteFill>
  );
};

// 6 letters spatten uit elkaar
const S6: React.FC<{ n: number }> = () => {
  const f = useCurrentFrame();
  const boom = 22;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <Letters
        size={140}
        w={96}
        color={C.ink}
        style={(i) => {
          if (f < boom) return {};
          const t = (f - boom) / 14;
          const dir = (rnd(i + 3) - 0.5) * 2;
          return { transform: `translate(${dir * 900 * t}px, ${(rnd(i + 8) - 0.7) * 1400 * t}px) rotate(${dir * 500 * t}deg) scale(${1 + t})`, opacity: 1 - t * 0.9 };
        }}
      />
      <div style={{ position: "absolute", bottom: 420, fontFamily: SANS, fontWeight: 900, fontSize: 88, color: C.ink, opacity: f > boom + 4 ? 1 : 0, transform: `scale(${0.5 + 0.5 * pop(f, boom + 4)})` }}>Het leest TOKENS</div>
    </AbsoluteFill>
  );
};

// 7 mes snijdt het woord
const TOKENS = [
  { t: "str", n: "496", c: C.blue },
  { t: "aw", n: "675", c: C.yellow },
  { t: "berry", n: "15717", c: C.green },
];
const S7: React.FC<{ n: number }> = () => {
  const f = useCurrentFrame();
  const W = 92;
  const cuts = [14, 28];
  const split = cuts.filter((c) => f >= c).length;
  const gap = (k: number) => (f >= cuts[k] ? 30 * pop(f, cuts[k], 9, 220) : 0);
  const sh = (k: number) => shake(f, cuts[k], 10, 6);
  const pieces = [WORD.slice(0, 3), WORD.slice(3, 5), WORD.slice(5)];
  const col = [C.blue, C.yellow, C.green];
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", fontFamily: MONO, fontWeight: 700, fontSize: 130, color: "#fff", transform: `translate(${sh(0).x + sh(1).x}px, ${sh(0).y + sh(1).y}px)` }}>
        {pieces.map((p, i) => (
          <div key={i} style={{ marginLeft: i === 0 ? 0 : gap(i - 1), padding: "4px 6px", border: split >= i ? `5px solid ${split > 0 ? col[i] : "transparent"}` : "5px solid transparent", borderRadius: 16, color: split > 0 ? col[i] : "#fff", transform: `scale(${split >= i && i > 0 ? 0.92 + 0.08 * pop(f, cuts[i - 1]) : 1})` }}>
            {p}
          </div>
        ))}
      </div>
      {cuts.map((c, k) => (
        <div key={k} style={{ position: "absolute", left: 540 + (k === 0 ? -170 : 20), top: 0, bottom: 0, width: 10, background: "#fff", opacity: interpolate(f, [c - 3, c, c + 4], [0, 1, 0], clamp) }} />
      ))}
      <div style={{ position: "absolute", bottom: 360, fontFamily: SANS, fontWeight: 900, fontSize: 80, color: "#fff", letterSpacing: 4, opacity: split === 2 ? 1 : 0 }}>3 TOKENS</div>
    </AbsoluteFill>
  );
};

// 8 getallen + uitzoomen naar een stroom
const S8: React.FC<{ n: number }> = () => {
  const f = useCurrentFrame();
  const settle = [14, 22, 30];
  const roll = (k: number) => {
    if (f >= settle[k]) return TOKENS[k].n;
    const len = TOKENS[k].n.length;
    return Array.from({ length: len }, (_, i) => Math.floor(rnd(f * 7 + i * 13 + k * 31) * 10)).join("");
  };
  const zo = interpolate(f, [40, 70], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const sc = 1 - 0.62 * zo;
  const cells = Array.from({ length: 11 * 7 }, (_, i) => ({ r: Math.floor(i / 7), c: i % 7 }));
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, opacity: zo, transform: `translateY(${-(f * 6) % 160}px)` }}>
        {cells.map((cl, i) => (
          <div key={i} style={{ position: "absolute", left: cl.c * 170 - 60, top: cl.r * 160 - 40, width: 150, padding: "10px 0", textAlign: "center", fontFamily: MONO, fontSize: 52, fontWeight: 700, color: "#fff", opacity: 0.25, border: "3px solid rgba(255,255,255,0.35)", borderRadius: 12 }}>
            {Math.floor(rnd(i + 5) * 30000)}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 24, transform: `scale(${1 + 0.0 * sc})`, fontFamily: MONO, fontWeight: 700, fontSize: 108 }}>
        {TOKENS.map((tk, k) => (
          <div key={k} style={{ background: tk.c, color: "#06122a", padding: "18px 26px", borderRadius: 20, transform: `scale(${f >= settle[k] ? 1 + 0.12 * Math.sin(pop(f, settle[k]) * Math.PI) : 1})`, boxShadow: "0 0 0 8px rgba(0,0,0,0.45)" }}>
            {roll(k)}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", bottom: 330, left: 60, right: 60, textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: 70, color: "#fff", lineHeight: 1.1, opacity: interpolate(f, [30, 40], [0, 1], clamp) }}>
        Elk stukje wordt een getal
        <div style={{ fontSize: 34, fontWeight: 500, color: "rgba(255,255,255,0.75)", marginTop: 14 }}>Voorbeeld. De opsplitsing verschilt per model.</div>
      </div>
    </AbsoluteFill>
  );
};

// 9 aardbei slam + inzoomen
const S9: React.FC<{ n: number }> = () => {
  const f = useCurrentFrame();
  const p = pop(f, 2, 8, 200);
  const dive = interpolate(f, [26, 75], [1, 2.6], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const qp = pop(f, 20, 7, 260);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `scale(${p * dive}) rotate(${Math.sin(f / 6) * 3}deg)`, position: "relative" }}>
        <Strawberry size={640} />
        {f >= 20 && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontWeight: 900, fontSize: 520, color: "#fff", transform: `scale(${qp})`, textShadow: "0 10px 60px rgba(0,0,0,0.5)" }}>?</div>
        )}
      </div>
      <div style={{ position: "absolute", top: 260, left: 0, right: 0, textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: 84, color: C.ink, opacity: f > 4 ? 1 : 0 }}>Hoeveel R's zitten hierin?</div>
    </AbsoluteFill>
  );
};

// 10 splitscreen: jij vs model
const S10: React.FC<{ n: number }> = () => {
  const f = useCurrentFrame();
  const a = interpolate(f, [0, 8], [-1100, 0], { ...clamp, easing: outCubic });
  const b = interpolate(f, [8, 16], [1100, 0], { ...clamp, easing: outCubic });
  const tp = pop(f, 30, 10, 220);
  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 960, background: C.navy, transform: `translateX(${a}px)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 36 }}>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 60, letterSpacing: 6, color: C.dim }}>JIJ ZIET</div>
        <Letters size={104} w={90} color={C.text} highlight={(i) => R_IDX.includes(i) && f > 22} />
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 960, height: 960, background: C.red, transform: `translateX(${b}px)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 60, letterSpacing: 6, color: "rgba(255,255,255,0.8)" }}>HET MODEL ZIET</div>
        <div style={{ transform: `scale(${f >= 30 ? 0.4 + 0.6 * tp : 0})` }}>
          <Strawberry size={300} />
        </div>
        <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 64, color: "#fff", opacity: f >= 30 ? 1 : 0 }}>één ding</div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, top: 940, height: 40, background: "#fff", opacity: f > 14 ? 1 : 0 }} />
    </AbsoluteFill>
  );
};

// 11 hoe lukt het soms wel
const S11: React.FC<{ n: number }> = () => (
  <Slam fg={C.ink} size={150} words={[{ t: "Soms lukt", at: 2 }, { t: "het wél.", at: 10, color: C.red }, { t: "Hoe?", at: 26, size: 300 }]} />
);

// 12 letter voor letter
const S12: React.FC<{ n: number }> = () => {
  const f = useCurrentFrame();
  const W = 96;
  const t0 = 6;
  const step = 6;
  const checks = [75, 90, 105];
  const done = checks.filter((c) => f >= c).length;
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", top: 380, left: 0, right: 0, textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: 80, color: C.green, opacity: f > 2 ? 1 : 0 }}>Schrijf het uit</div>
      <div style={{ display: "flex", fontFamily: MONO, fontWeight: 700, fontSize: 130 }}>
        {WORD.split("").map((ch, i) => {
          const at = t0 + i * step;
          const ri = R_IDX.indexOf(i);
          const checked = ri >= 0 && f >= checks[ri];
          const sc = checked ? 1 + 0.4 * Math.sin(pop(f, checks[ri], 12, 260) * Math.PI) : 1;
          const p = pop(f, at, 12, 300);
          return (
            <div key={i} style={{ width: W, textAlign: "center", position: "relative", opacity: f >= at ? 1 : 0, transform: `translateY(${(1 - p) * 70}px) scale(${sc})`, color: checked ? C.red : C.text, textShadow: checked ? `0 0 40px ${C.red}` : undefined }}>
              {ch}
              {checked && <div style={{ position: "absolute", left: 0, right: 0, top: -110, fontSize: 90, color: C.green, fontFamily: SANS }}>✓</div>}
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", bottom: 330, fontFamily: SANS, fontWeight: 900, fontSize: 300, color: done === 3 ? C.green : C.dim, opacity: done > 0 ? 1 : 0, transform: `scale(${done > 0 ? 0.7 + 0.3 * pop(f, checks[done - 1] ?? 0, 10, 260) : 1})` }}>{done}</div>
    </AbsoluteFill>
  );
};

// 13 geen domheid
const S13: React.FC<{ n: number }> = () => (
  <Slam fg={C.ink} size={190} words={[{ t: "Geen", at: 2 }, { t: "domheid.", at: 10, color: C.red }]} />
);

// 14 bril
const S14: React.FC<{ n: number }> = () => {
  const f = useCurrentFrame();
  const draw = interpolate(f, [0, 14], [1, 0], { ...clamp, easing: outCubic });
  const cutAt = 32;
  if (f >= cutAt) {
    return (
      <AbsoluteFill style={{ background: "#000", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: SANS, fontWeight: 900, fontSize: 800, color: C.green }}>3</div>
      </AbsoluteFill>
    );
  }
  const letters = ["s", "t", "r", "a", "w", "b", "e", "r", "r", "y"];
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <svg width="900" height="400" viewBox="0 0 900 400" style={{ marginTop: -200 }}>
        {[260, 640].map((cx) => (
          <circle key={cx} cx={cx} cy="200" r="150" fill="rgba(90,169,255,0.15)" stroke={C.blue} strokeWidth="14" strokeDasharray="950" strokeDashoffset={950 * draw} />
        ))}
        <path d="M410 190 Q450 150 490 190" stroke={C.blue} strokeWidth="14" fill="none" strokeDasharray="120" strokeDashoffset={120 * draw} />
        {letters.map((l, i) => {
          const bounce = f > 12 ? Math.min(1, (f - 12) / 6) : 0;
          const x = i < 5 ? 130 + i * 56 - bounce * 70 * (i + 1) * 0.5 : 530 + (i - 5) * 56 + bounce * 40 * (i - 4);
          return <text key={i} x={x} y={225 + Math.sin((f + i * 5) / 4) * 6} fontFamily={MONO} fontWeight="700" fontSize="80" fill={C.dim} opacity={1 - bounce * 0.6}>{l}</text>;
        })}
      </svg>
      <div style={{ position: "absolute", bottom: 400, left: 0, right: 0, textAlign: "center", fontFamily: SANS, fontWeight: 900, fontSize: 84, lineHeight: 1.1, color: "#fff", padding: "0 60px", transform: `scale(${0.6 + 0.4 * pop(f, 6)})`, opacity: f > 4 ? 1 : 0 }}>
        Een bril waar letters<br /><span style={{ color: C.yellow }}>niet in passen</span>
      </div>
    </AbsoluteFill>
  );
};

// ---------- Montage (alles in seconden, cuts vallen op de beat van 120 BPM) ----------
const SHOTS: ShotDef[] = [
  { dur: 2, bg: "navy", noIn: true, comp: S1 },
  { dur: 2, bg: "navy", comp: S2 },
  { dur: 1.5, bg: "red", flash: "white", comp: S3 },
  { dur: 2.5, bg: "yellow", comp: S4 },
  { dur: 2, bg: "blue", comp: S5 },
  { dur: 2, bg: "white", flash: "dark", comp: S6 },
  { dur: 3, bg: "navy", comp: S7 },
  { dur: 3, bg: "blue", flash: "white", comp: S8 },
  { dur: 2.5, bg: "yellow", comp: S9 },
  { dur: 2.5, bg: "navy", comp: S10 },
  { dur: 3, bg: "white", flash: "dark", comp: S11 },
  { dur: 5, bg: "navy", comp: S12 },
  { dur: 3, bg: "yellow", flash: "white", comp: S13 },
  { dur: 2, bg: "navy", comp: S14, noOut: true },
];
const frames = SHOTS.map((s) => Math.round(s.dur * FPS));
export const TOTAL_FRAMES = frames.reduce((a, b) => a + b, 0);

export const Short: React.FC = () => {
  let at = 0;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Audio src={staticFile("audio/beat.wav")} />
      {SHOTS.map((def, i) => {
        const from = at;
        at += frames[i];
        return (
          <Sequence key={i} from={from} durationInFrames={frames[i]}>
            <Shot def={def} n={i} frames={frames[i]} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
